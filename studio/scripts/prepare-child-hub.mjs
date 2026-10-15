import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {
  findHubLaunchGroup,
  loadArticleQueue,
} from '../../scripts/article-automation-policy.mjs'

const argumentsList = process.argv.slice(2)
const applyChanges = argumentsList.includes('--apply')
const groupId = argumentsList.find((argument) => !argument.startsWith('--'))
const hubFileArgument = argumentsList.find((argument) => argument.startsWith('--hub-file='))

if (!groupId) {
  throw new Error(
    '用法：sanity exec scripts/prepare-child-hub.mjs --with-user-token -- <child-hub-group-id> [--hub-file=<hub.json>] [--apply]',
  )
}

const projectRoot = path.resolve(import.meta.dirname, '../..')
const queue = await loadArticleQueue(
  path.join(projectRoot, 'content-automation', 'article-queue.json'),
  projectRoot,
)
const group = findHubLaunchGroup(queue, groupId)

if (!group) throw new Error(`找不到子 Hub 定義：${groupId}`)

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function validateHubCopy(copy) {
  for (const field of ['title', 'eyebrow', 'seoTitle', 'seoDescription', 'contentBoundary']) {
    if (!hasText(copy?.[field])) throw new Error(`Hub 準備資料缺少 ${field}`)
  }
  if (!Array.isArray(copy?.introduction) || copy.introduction.length < 1) {
    throw new Error('Hub 準備資料至少要有 1 段 introduction')
  }
  if (!Array.isArray(copy?.checklist) || copy.checklist.length < 3) {
    throw new Error('Hub 準備資料至少要有 3 項 checklist')
  }
  if (copy.researchValidated !== true) {
    throw new Error('Hub 準備資料必須完成研究驗證')
  }
  if (
    group.childHubBlueprint &&
    copy.contentBoundary !== group.childHubBlueprint.contentBoundary
  ) {
    throw new Error('Hub 準備資料的內容邊界與授權清單不一致')
  }
}

let hubCopy = group.childHub
if (!hubCopy) {
  if (!hubFileArgument) throw new Error('此 Hub 必須提供研究後產生的 --hub-file=<hub.json>')
  const hubFilePath = path.resolve(hubFileArgument.slice('--hub-file='.length))
  hubCopy = JSON.parse(await readFile(hubFilePath, 'utf8'))
}
validateHubCopy({
  ...hubCopy,
  contentBoundary: hubCopy.contentBoundary ?? group.childHubBlueprint?.contentBoundary,
})

function paragraphsToBlocks(paragraphs) {
  return paragraphs.map((paragraph, index) => ({
    _key: `launch-intro-${String(index + 1).padStart(2, '0')}`,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _key: `launch-span-${String(index + 1).padStart(2, '0')}`,
        _type: 'span',
        marks: [],
        text: paragraph,
      },
    ],
  }))
}

const isPromotion = group.landingArticleMode === 'existing-indexable'
const expectedChildHub = {
  _id: group.childHubId,
  _type: 'hub',
  title: hubCopy.title,
  slug: {_type: 'slug', current: group.childHubSlug},
  category: group.categorySlug,
  eyebrow: hubCopy.eyebrow,
  introduction: paragraphsToBlocks(hubCopy.introduction),
  checklist: hubCopy.checklist,
  seoTitle: hubCopy.seoTitle,
  seoDescription: hubCopy.seoDescription,
  publicationState: 'draft',
  researchValidated: true,
  noindex: false,
  parentHub: {_type: 'reference', _ref: group.parentHubId},
  ...(isPromotion
    ? {landingArticle: {_type: 'reference', _ref: group.landingArticleId}}
    : {}),
}

const client = getCliClient({apiVersion: '2026-08-31'})

async function fetchSnapshot() {
  const ids = [group.parentHubId, group.childHubId, group.landingArticleId]
  const draftIds = [group.childHubId, group.landingArticleId].map((id) => `drafts.${id}`)
  return client.fetch(
    `{
      "documents": *[_id in $ids]{
        _id,
        _rev,
        _type,
        title,
        "slug": slug.current,
        category,
        publicationState,
        researchValidated,
        noindex,
        "parentHubId": parentHub._ref,
        "landingArticleId": landingArticle._ref,
        "primaryHubId": primaryHub._ref,
        "coverAssetId": cover.asset._ref,
        "bodyCount": count(body)
      },
      "draftIds": *[_id in $draftIds]._id
    }`,
    {ids, draftIds},
  )
}

function validateSnapshot(snapshot) {
  if (snapshot.draftIds.length > 0) {
    throw new Error(`Sanity 有同 ID 草稿，拒絕自動建立 Hub：${snapshot.draftIds.join('、')}`)
  }

  const parentHub = snapshot.documents.find((document) => document._id === group.parentHubId)
  const childHub = snapshot.documents.find((document) => document._id === group.childHubId)
  const landingArticle = snapshot.documents.find(
    (document) => document._id === group.landingArticleId,
  )

  if (
    parentHub?._type !== 'hub' ||
    parentHub.slug !== group.parentHubSlug ||
    parentHub.publicationState !== 'ready' ||
    parentHub.researchValidated !== true
  ) {
    throw new Error(`父 Hub 尚未通過發布門檻：${group.parentHubId}`)
  }

  if (isPromotion) {
    if (
      landingArticle?._type !== 'article' ||
      landingArticle.slug !== group.childHubSlug ||
      landingArticle.noindex !== false ||
      landingArticle.bodyCount < 1 ||
      !landingArticle.coverAssetId ||
      ![group.parentHubId, group.childHubId].includes(landingArticle.primaryHubId)
    ) {
      throw new Error(`既有入口文章不符合安全升級條件：${group.landingArticleId}`)
    }
  } else if (
    landingArticle &&
    (landingArticle._type !== 'article' ||
      landingArticle.slug !== group.childHubSlug ||
      ![group.parentHubId, group.childHubId].includes(landingArticle.primaryHubId))
  ) {
    throw new Error(`新 Hub 的入口文章狀態衝突：${group.landingArticleId}`)
  }

  if (
    childHub &&
    (childHub._type !== 'hub' ||
      childHub.slug !== group.childHubSlug ||
      childHub.category !== (group.categorySlug) ||
      childHub.parentHubId !== group.parentHubId ||
      (childHub.landingArticleId && childHub.landingArticleId !== group.landingArticleId) ||
      childHub.researchValidated !== true ||
      !['draft', 'ready'].includes(childHub.publicationState))
  ) {
    throw new Error(`既有子 Hub 與固定清單衝突：${group.childHubId}`)
  }

  return {parentHub, childHub, landingArticle}
}

const before = await fetchSnapshot()
const {childHub, landingArticle} = validateSnapshot(before)
const actions = {
  childHub: childHub ? 'already-exists' : 'create-draft',
  landingArticle: isPromotion
    ? landingArticle?.primaryHubId === group.childHubId
      ? 'already-migrated'
      : 'migrate-on-activation'
    : 'publish-after-hub-created',
}

console.log(
  JSON.stringify(
    {mode: applyChanges ? 'apply' : 'dry-run', groupId, landingArticleMode: group.landingArticleMode, actions},
    null,
    2,
  ),
)

if (!applyChanges) {
  console.log('目前為預覽模式；確認後加上 --apply 才會建立子 Hub 草稿。')
} else {
  if (!childHub) await client.create(expectedChildHub)

  const after = await fetchSnapshot()
  const verified = validateSnapshot(after)
  if (!verified.childHub || verified.childHub.parentHubId !== group.parentHubId) {
    throw new Error('子 Hub 準備後回讀驗證失敗')
  }
  const beforeLanding = before.documents.find(
    (document) => document._id === group.landingArticleId,
  )
  if (
    isPromotion &&
    verified.landingArticle.primaryHubId !== beforeLanding.primaryHubId
  ) {
    throw new Error('準備階段不得提前遷移既有入口文章')
  }

  console.log(
    JSON.stringify(
      {
        status: 'hub-draft-prepared-and-verified',
        childHubRevision: verified.childHub._rev,
        landingArticleRevision: verified.landingArticle?._rev ?? null,
      },
      null,
      2,
    ),
  )
}
