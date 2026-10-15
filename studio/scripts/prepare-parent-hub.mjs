import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {findQueueBatch, loadArticleQueue} from '../../scripts/article-automation-policy.mjs'

/**
 * 依 article-queue.json 的 batches[].parentHub 建立（或開放索引）批次的父 Hub。
 *
 * 用法：
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id>                 # 預覽
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> --apply         # 建立父 Hub（ready、noindex=true）
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> --release-index # 預覽開放索引
 *   npx sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> --release-index --expected-revision=<rev> --apply
 *
 * 父 Hub 一律先以 noindex=true 建立；只有本批至少一篇文章已開放索引後，才允許 --release-index。
 */
const argumentsList = process.argv.slice(2)
const applyChanges = argumentsList.includes('--apply')
const releaseIndex = argumentsList.includes('--release-index')
const expectedRevision = argumentsList
  .find((argument) => argument.startsWith('--expected-revision='))
  ?.slice('--expected-revision='.length)
const batchId = argumentsList.find((argument) => !argument.startsWith('--'))

if (!batchId) {
  throw new Error(
    '用法：sanity exec scripts/prepare-parent-hub.mjs -- <batch-id> [--release-index] [--expected-revision=<rev>] [--apply]',
  )
}

const projectRoot = path.resolve(import.meta.dirname, '../..')
const queue = await loadArticleQueue(
  path.join(projectRoot, 'content-automation', 'article-queue.json'),
  projectRoot,
)
const batch = findQueueBatch(queue, batchId)
if (!batch) throw new Error(`找不到批次：${batchId}`)

const copy = batch.parentHub
const hubId = batch.parentHubId
const batchDocumentIds = batch.items.map((item) => item.documentId)

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
        "parentHubId": parentHub._ref
      },
      "draftIds": *[_id == $draftId]._id,
      "indexableArticleIds": *[_type == "article" && _id in $articleIds && noindex == false && defined(cover.asset)]._id
    }`,
    {hubId, draftId: `drafts.${hubId}`, articleIds: batchDocumentIds},
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
let action = 'none'
if (!before.hub) {
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
    },
    null,
    2,
  ),
)

if (action.startsWith('blocked-')) {
  throw new Error(
    action === 'blocked-hub-missing'
      ? '父 Hub 尚未建立，不能開放索引；請先不帶 --release-index 建立'
      : '本批尚無已開放索引的文章，父 Hub 維持 noindex',
  )
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
} else {
  console.log('父 Hub 已在正確狀態，不重複修改。')
}
