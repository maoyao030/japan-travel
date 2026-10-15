import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {
  findQueueItem,
  getArticlePathFromSnapshot,
  loadArticleQueue,
  validateReleaseSnapshot,
  validateStandingApproval,
} from '../../scripts/article-automation-policy.mjs'

const argumentsList = process.argv.slice(2)
const applyChanges = argumentsList.includes('--apply')
const expectedRevisionArgument = argumentsList.find((argument) =>
  argument.startsWith('--expected-revision='),
)
const expectedRevision = expectedRevisionArgument?.slice('--expected-revision='.length)
const packetArgument = argumentsList.find((argument) => !argument.startsWith('--'))

if (!packetArgument) {
  throw new Error(
    '用法：sanity exec scripts/release-indexable-article.mjs --with-user-token -- <文章封包資料夾> [--expected-revision=<rev>] [--apply]',
  )
}

const projectRoot = path.resolve(import.meta.dirname, '../..')
const packetDirectory = path.resolve(packetArgument)
const queuePath = path.join(projectRoot, 'content-automation', 'article-queue.json')
const manifestPath = path.join(packetDirectory, 'manifest.json')
const [queue, manifest] = await Promise.all([
  loadArticleQueue(queuePath, projectRoot),
  readFile(manifestPath, 'utf8').then(JSON.parse),
])
const item = findQueueItem(queue, manifest.articleId)

if (!item) {
  throw new Error(`文章不在自動發布清單內：${manifest.articleId ?? '未提供 articleId'}`)
}

const approvalIssues = validateStandingApproval(manifest, queue, item)
if (approvalIssues.length > 0) {
  throw new Error(`自動發布授權驗證失敗：\n- ${approvalIssues.join('\n- ')}`)
}

if (manifest.files?.images !== 'images/image-plan.json') {
  throw new Error('文章封包缺少 images/image-plan.json')
}

const imagePlan = JSON.parse(
  await readFile(path.join(packetDirectory, manifest.files.images), 'utf8'),
)
if (
  imagePlan.articleId !== item.articleId ||
  imagePlan.targetUrl !== item.targetPath ||
  imagePlan.status !== 'selected' ||
  !imagePlan.selectedCandidateIds?.cover
) {
  throw new Error('圖片封包尚未完成清單文章的封面選定')
}

const client = getCliClient({apiVersion: '2026-08-29'})
const draftId = `drafts.${item.documentId}`

async function fetchSnapshot() {
  return client.fetch(
    `{
      "article": *[_id == $articleId][0]{
        "articleId": _id,
        _rev,
        _type,
        title,
        excerpt,
        publishedAt,
        updatedAt,
        seoTitle,
        seoDescription,
        noindex,
        sponsored,
        "slug": slug.current,
        "authorId": author._ref,
        "primaryHubId": primaryHub._ref,
        "bodyCount": count(body),
        "cover": cover{
          "assetId": asset._ref,
          "width": asset->metadata.dimensions.width,
          "height": asset->metadata.dimensions.height,
          alt,
          caption,
          credit,
          sourcePageUrl
        },
        "hub": primaryHub->{
          "id": _id,
          title,
          "slug": slug.current,
          "categorySlug": category,
          "description": pt::text(introduction),
          checklist,
          seoTitle,
          seoDescription,
          publicationState,
          researchValidated,
          "landingArticleId": landingArticle._ref,
          "parentHub": parentHub->{
            "id": _id,
            "slug": slug.current,
            "categorySlug": category,
            title,
            publicationState,
            researchValidated
          }
        }
      },
      "draft": *[_id == $draftId][0]{_id, _rev}
    }`,
    {articleId: item.documentId, draftId},
  )
}

const before = await fetchSnapshot()
if (before.draft) {
  throw new Error(`Sanity 有同 ID 草稿，拒絕自動發布：${before.draft._id}`)
}
if (before.article?._type !== 'article') {
  throw new Error(`找不到 Sanity 正式文章：${item.documentId}`)
}

const releaseIssues = validateReleaseSnapshot(before.article, item)
if (releaseIssues.length > 0) {
  throw new Error(`索引發布前驗證失敗：\n- ${releaseIssues.join('\n- ')}`)
}

const action = before.article.noindex === false ? 'already-indexable' : 'set-indexable'
console.log(
  JSON.stringify(
    {
      mode: applyChanges ? 'apply' : 'dry-run',
      action,
      articleId: item.documentId,
      articleTitle: before.article.title,
      currentRevision: before.article._rev,
      targetUrl: new URL(item.targetPath, queue.siteBaseUrl).href,
      currentNoindex: before.article.noindex,
      nextNoindex: false,
    },
    null,
    2,
  ),
)

if (!applyChanges) {
  console.log('目前為預覽模式；確認完整網站 CI 通過後，加上 revision 與 --apply 才會開放索引。')
} else if (before.article.noindex === false) {
  console.log('文章已允許索引，不重複修改。')
} else {
  if (!expectedRevision) {
    throw new Error('--apply 必須同時提供 dry-run 顯示的 --expected-revision=<rev>')
  }
  if (expectedRevision !== before.article._rev) {
    throw new Error(`Sanity 版本已變更；目前為 ${before.article._rev}，不是 ${expectedRevision}`)
  }

  await client
    .patch(item.documentId)
    .ifRevisionId(expectedRevision)
    .set({noindex: false})
    .commit()

  const verified = await fetchSnapshot()
  if (verified.draft) throw new Error('索引發布後出現非預期草稿')
  const verifiedIssues = validateReleaseSnapshot(verified.article, item)
  if (verifiedIssues.length > 0 || verified.article.noindex !== false) {
    throw new Error(`索引發布後驗證失敗：\n- ${verifiedIssues.join('\n- ')}`)
  }
  if (getArticlePathFromSnapshot(verified.article) !== item.targetPath) {
    throw new Error('索引發布後網址發生非預期變更')
  }

  console.log(
    JSON.stringify(
      {
        articleId: verified.article.articleId,
        articleRevision: verified.article._rev,
        targetUrl: new URL(item.targetPath, queue.siteBaseUrl).href,
        noindex: verified.article.noindex,
        status: 'indexable-and-verified',
      },
      null,
      2,
    ),
  )
}
