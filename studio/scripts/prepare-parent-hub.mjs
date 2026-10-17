import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {decideHubLandingAction, findQueueBatch, loadArticleQueue} from '../../scripts/article-automation-policy.mjs'

/**
 * 依 article-queue.json 的 batches[].parentHub 建立（或開放索引）批次的父 Hub。
 *
 * 用法：
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id>                 # 預覽
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> --apply         # 建立父 Hub（ready、noindex=true）
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> --release-index # 預覽開放索引
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> --release-index --expected-revision=<rev> --apply
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> --set-landing   # 預覽把地點主頁掛成入口文章
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> --set-landing --expected-revision=<rev> --apply
 *
 * 父 Hub 一律先以 noindex=true 建立；只有本批至少一篇文章已開放索引後，才允許 --release-index。
 * --set-landing：本批的地點主頁（routeMode hub-landing）暫存到 Sanity 後、開放索引前執行，
 * 讓主頁的網址是 /<分類>/<Hub>/；主題頁是否可索引從此跟著入口文章的 noindex。
 */
const argumentsList = process.argv.slice(2)
const applyChanges = argumentsList.includes('--apply')
const releaseIndex = argumentsList.includes('--release-index')
const setLanding = argumentsList.includes('--set-landing')
const expectedRevision = argumentsList
  .find((argument) => argument.startsWith('--expected-revision='))
  ?.slice('--expected-revision='.length)
const batchId = argumentsList.find((argument) => !argument.startsWith('--'))

if (!batchId) {
  throw new Error(
    '用法：sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> [--release-index|--set-landing] [--expected-revision=<rev>] [--apply]',
  )
}

const projectRoot = path.resolve(import.meta.dirname, '../..')
const queue = await loadArticleQueue(
  path.join(projectRoot, 'content-automation', 'article-queue.json'),
  projectRoot,
)
const batch = findQueueBatch(queue, batchId)
if (!batch) throw new Error(`找不到批次：${batchId}`)
if (releaseIndex && setLanding) throw new Error('--release-index 與 --set-landing 要分開執行')

const copy = batch.parentHub
const hubId = batch.parentHubId
const batchDocumentIds = batch.items.map((item) => item.documentId)
const landingArticleId = batch.items.find((item) => item.routeMode === 'hub-landing')?.documentId ?? null

function paragraphsToBlocks(paragraphs) {
  return paragraphs.map((paragraph, index) => ({
    _key: `parent-intro-${String(index + 1).padStart(2, '0')}`,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _key: `parent-span-${String(index + 1).padStart(2, '0')}`,
        _type: 'span',
        marks: [],
        text: paragraph,
      },
    ],
  }))
}

const expectedHub = {
  _id: hubId,
  _type: 'hub',
  title: copy.title,
  slug: {_type: 'slug', current: batch.parentHubSlug},
  category: batch.categorySlug,
  eyebrow: copy.eyebrow,
  introduction: paragraphsToBlocks(copy.introduction),
  checklist: copy.checklist,
  seoTitle: copy.seoTitle,
  seoDescription: copy.seoDescription,
  publicationState: 'ready',
  researchValidated: true,
  noindex: true,
}

const client = getCliClient({apiVersion: '2026-08-31'})

async function fetchSnapshot() {
  return client.fetch(
    `{
      "hub": *[_id == $hubId][0]{
        _id,
        _rev,
        _type,
        title,
        "slug": slug.current,
        category,
        publicationState,
        researchValidated,
        noindex,
        "introductionCount": count(introduction),
        "checklistCount": count(checklist),
        seoTitle,
        seoDescription,
        "parentHubId": parentHub._ref,
        "landingArticleId": landingArticle._ref
      },
      "draftIds": *[_id == $draftId]._id,
      "indexableArticleIds": *[_type == "article" && _id in $articleIds && noindex == false && defined(cover.asset)]._id,
      "landingArticle": *[_id == $landingId][0]{
        _id,
        _type,
        "slug": slug.current,
        "primaryHubId": primaryHub._ref,
        "bodyCount": count(body)
      },
      "landingDraftIds": *[_id == $landingDraftId]._id
    }`,
    {
      hubId,
      draftId: `drafts.${hubId}`,
      articleIds: batchDocumentIds,
      landingId: landingArticleId ?? '',
      landingDraftId: landingArticleId ? `drafts.${landingArticleId}` : '',
    },
  )
}

function validateExistingHub(hub) {
  if (!hub) return
  if (
    hub._type !== 'hub' ||
    hub.slug !== batch.parentHubSlug ||
    hub.category !== batch.categorySlug ||
    hub.parentHubId ||
    hub.title !== copy.title ||
    hub.researchValidated !== true ||
    hub.publicationState !== 'ready' ||
    hub.introductionCount < 1 ||
    hub.checklistCount < 3 ||
    !hub.seoTitle ||
    !hub.seoDescription
  ) {
    throw new Error(`既有父 Hub 與清單定義不一致或未通過門檻：${hubId}`)
  }
}

const before = await fetchSnapshot()
if (before.draftIds.length > 0) {
  throw new Error(`Sanity 有同 ID 草稿，拒絕自動處理父 Hub：${before.draftIds.join('、')}`)
}
validateExistingHub(before.hub)

const indexableCount = before.indexableArticleIds.length
const landingDecision = setLanding
  ? decideHubLandingAction({
      batch,
      hub: before.hub,
      article: before.landingArticle,
      articleDraftExists: before.landingDraftIds.length > 0,
    })
  : null
let action = 'none'
if (landingDecision) {
  action = landingDecision.action
} else if (!before.hub) {
  action = releaseIndex ? 'blocked-hub-missing' : 'create-ready-noindex'
} else if (releaseIndex) {
  if (before.hub.noindex === false) action = 'already-indexable'
  else if (indexableCount < 1) action = 'blocked-no-indexable-article'
  else action = 'release-index'
} else {
  action = 'already-exists'
}

console.log(
  JSON.stringify(
    {
      mode: applyChanges ? 'apply' : 'dry-run',
      batchId,
      hubId,
      action,
      currentRevision: before.hub?._rev ?? null,
      currentNoindex: before.hub?.noindex ?? null,
      indexableArticleCount: indexableCount,
      ...(landingDecision ? {landingArticleId: landingDecision.articleId ?? null, currentLandingId: before.hub?.landingArticleId ?? null} : {}),
    },
    null,
    2,
  ),
)

const blockedMessages = {
  'blocked-hub-missing': '父 Hub 尚未建立；請先不帶參數建立',
  'blocked-no-indexable-article': '本批尚無已開放索引的文章，父 Hub 維持 noindex',
  'blocked-no-landing-item': '本批沒有地點主頁（routeMode hub-landing），不需要 --set-landing',
  'blocked-landing-conflict': '父 Hub 已經掛了別篇入口文章，拒絕覆蓋',
  'blocked-article-draft': 'Sanity 有地點主頁的同 ID 草稿，拒絕自動處理',
  'blocked-article-not-staged': '地點主頁還沒暫存到 Sanity，或 slug、主要 Hub 與清單不一致',
}
if (action.startsWith('blocked-')) {
  throw new Error(blockedMessages[action] ?? action)
}

if (!applyChanges) {
  console.log('目前為預覽模式；確認後加上 --apply 才會寫入 Sanity。')
} else if (action === 'create-ready-noindex') {
  await client.create(expectedHub)
  const after = await fetchSnapshot()
  validateExistingHub(after.hub)
  if (!after.hub || after.hub.noindex !== true) throw new Error('父 Hub 建立後回讀驗證失敗')
  console.log(JSON.stringify({status: 'parent-hub-created-and-verified', revision: after.hub._rev}, null, 2))
} else if (action === 'release-index') {
  if (!expectedRevision) throw new Error('--release-index --apply 必須同時提供 --expected-revision=<rev>')
  if (expectedRevision !== before.hub._rev) {
    throw new Error(`Sanity Hub 版本已變更；目前為 ${before.hub._rev}，不是 ${expectedRevision}`)
  }
  await client
    .patch(hubId)
    .ifRevisionId(expectedRevision)
    .set({noindex: false})
    .commit()
  const after = await fetchSnapshot()
  validateExistingHub(after.hub)
  if (after.hub.noindex !== false) throw new Error('父 Hub 開放索引後回讀驗證失敗')
  console.log(JSON.stringify({status: 'parent-hub-indexable-and-verified', revision: after.hub._rev}, null, 2))
} else if (action === 'set-landing') {
  if (!expectedRevision) throw new Error('--set-landing --apply 必須同時提供 --expected-revision=<rev>')
  if (expectedRevision !== before.hub._rev) {
    throw new Error(`Sanity Hub 版本已變更；目前為 ${before.hub._rev}，不是 ${expectedRevision}`)
  }
  await client
    .patch(hubId)
    .ifRevisionId(expectedRevision)
    .set({landingArticle: {_type: 'reference', _ref: landingDecision.articleId}})
    .commit()
  const after = await fetchSnapshot()
  validateExistingHub(after.hub)
  if (after.hub.landingArticleId !== landingDecision.articleId) throw new Error('入口文章設定後回讀驗證失敗')
  console.log(JSON.stringify({status: 'landing-set-and-verified', revision: after.hub._rev}, null, 2))
} else {
  console.log('父 Hub 已在正確狀態，不重複修改。')
}
