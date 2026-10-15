import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {
  findHubLaunchGroup,
  loadArticleQueue,
} from '../../scripts/article-automation-policy.mjs'

const argumentsList = process.argv.slice(2)
const applyChanges = argumentsList.includes('--apply')
const expectedRevisionArgument = argumentsList.find((argument) =>
  argument.startsWith('--expected-revision='),
)
const expectedLandingRevisionArgument = argumentsList.find((argument) =>
  argument.startsWith('--expected-landing-revision='),
)
const expectedRevision = expectedRevisionArgument?.slice('--expected-revision='.length)
const expectedLandingRevision = expectedLandingRevisionArgument?.slice(
  '--expected-landing-revision='.length,
)
const groupId = argumentsList.find((argument) => !argument.startsWith('--'))

if (!groupId) {
  throw new Error(
    '用法：sanity exec scripts/activate-child-hub.mjs --with-user-token -- <child-hub-group-id> [--expected-revision=<rev>] [--expected-landing-revision=<rev>] [--apply]',
  )
}

const projectRoot = path.resolve(import.meta.dirname, '../..')
const queue = await loadArticleQueue(
  path.join(projectRoot, 'content-automation', 'article-queue.json'),
  projectRoot,
)
const group = findHubLaunchGroup(queue, groupId)

if (!group) throw new Error(`找不到子 Hub 定義：${groupId}`)

const isPromotion = group.landingArticleMode === 'existing-indexable'
const client = getCliClient({apiVersion: '2026-08-31'})

async function fetchSnapshot() {
  const hubIds = [group.parentHubId, group.childHubId]
  const articleIds = [group.landingArticleId]
  const draftIds = [...hubIds, ...articleIds].map((id) => `drafts.${id}`)
  return client.fetch(
    `{
      "hubs": *[_id in $hubIds]{
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
      "articles": *[_id in $articleIds]{
        _id,
        _rev,
        _type,
        "slug": slug.current,
        noindex,
        "primaryHubId": primaryHub._ref,
        "coverAssetId": cover.asset._ref,
        "bodyCount": count(body)
      },
      "draftIds": *[_id in $draftIds]._id
    }`,
    {hubIds, articleIds, draftIds},
  )
}

function validateSnapshot(snapshot, {afterActivation = false} = {}) {
  if (snapshot.draftIds.length > 0) {
    throw new Error(`Sanity 有同 ID 草稿，拒絕啟動 Hub：${snapshot.draftIds.join('、')}`)
  }

  const parentHub = snapshot.hubs.find((hub) => hub._id === group.parentHubId)
  const childHub = snapshot.hubs.find((hub) => hub._id === group.childHubId)
  const landingArticle = snapshot.articles.find(
    (article) => article._id === group.landingArticleId,
  )
  if (parentHub?._type !== 'hub' || parentHub.slug !== group.parentHubSlug) {
    throw new Error(`父 Hub 資料與清單不一致：${group.parentHubId}`)
  }
  if (
    childHub?._type !== 'hub' ||
    childHub.slug !== group.childHubSlug ||
    childHub.category !== (group.categorySlug) ||
    childHub.parentHubId !== group.parentHubId ||
    (childHub.landingArticleId && childHub.landingArticleId !== group.landingArticleId) ||
    childHub.researchValidated !== true ||
    childHub.introductionCount < 1 ||
    childHub.checklistCount < 3 ||
    !childHub.title ||
    !childHub.seoTitle ||
    !childHub.seoDescription ||
    !['draft', 'ready'].includes(childHub.publicationState)
  ) {
    throw new Error(`子 Hub 欄位或關聯未通過門檻：${group.childHubId}`)
  }

  if (
    landingArticle?._type !== 'article' ||
    landingArticle.slug !== group.childHubSlug ||
    landingArticle.bodyCount < 1 ||
    !landingArticle.coverAssetId
  ) {
    throw new Error(`入口文章不存在或不完整：${group.landingArticleId}`)
  }
  if (isPromotion) {
    if (![group.parentHubId, group.childHubId].includes(landingArticle.primaryHubId)) {
      throw new Error(`既有入口文章不符合安全升級條件：${group.landingArticleId}`)
    }
  } else if (landingArticle.primaryHubId !== group.childHubId) {
    throw new Error(`新 Hub 入口文章尚未歸屬子 Hub：${group.landingArticleId}`)
  }

  if (afterActivation) {
    if (
      childHub.publicationState !== 'ready' ||
      childHub.landingArticleId !== group.landingArticleId ||
      landingArticle.primaryHubId !== group.childHubId
    ) {
      throw new Error('Hub 啟動後的入口與狀態驗證失敗')
    }
  }

  return {parentHub, childHub, landingArticle}
}

const before = await fetchSnapshot()
const {childHub, landingArticle} = validateSnapshot(before)
const alreadyReady =
  childHub.publicationState === 'ready' &&
  childHub.landingArticleId === group.landingArticleId &&
  landingArticle.primaryHubId === group.childHubId

console.log(
  JSON.stringify(
    {
      mode: applyChanges ? 'apply' : 'dry-run',
      groupId,
      landingArticleMode: group.landingArticleMode,
      action: alreadyReady ? 'already-ready' : 'activate-hub',
      currentRevision: childHub._rev,
      landingArticleRevision: landingArticle._rev,
    },
    null,
    2,
  ),
)

if (!applyChanges) {
  console.log('目前為預覽模式；帶入 Hub 與入口文章 revision 才會啟動子 Hub。')
} else if (alreadyReady) {
  console.log('子 Hub 與入口文章已在正確狀態，不重複修改。')
} else {
  if (!expectedRevision) throw new Error('--apply 必須同時提供 --expected-revision=<rev>')
  if (expectedRevision !== childHub._rev) {
    throw new Error(`Sanity Hub 版本已變更；目前為 ${childHub._rev}，不是 ${expectedRevision}`)
  }
  if (isPromotion) {
    if (!expectedLandingRevision) {
      throw new Error('升級既有入口時必須提供 --expected-landing-revision=<rev>')
    }
    if (expectedLandingRevision !== landingArticle._rev) {
      throw new Error(
        `Sanity 入口文章版本已變更；目前為 ${landingArticle._rev}，不是 ${expectedLandingRevision}`,
      )
    }
  }

  let transaction = client
    .transaction()
    .patch(group.childHubId, (patch) =>
      patch
        .ifRevisionId(expectedRevision)
        .set({
          publicationState: 'ready',
          noindex: false,
          landingArticle: {_type: 'reference', _ref: group.landingArticleId},
        }),
    )
  if (isPromotion && landingArticle.primaryHubId !== group.childHubId) {
    transaction = transaction.patch(group.landingArticleId, (patch) =>
      patch
        .ifRevisionId(expectedLandingRevision)
        .set({primaryHub: {_type: 'reference', _ref: group.childHubId}}),
    )
  }
  await transaction.commit()

  const after = await fetchSnapshot()
  const verified = validateSnapshot(after, {afterActivation: true})
  console.log(
    JSON.stringify(
      {
        status: 'ready-and-verified',
        childHubRevision: verified.childHub._rev,
        landingArticleRevision: verified.landingArticle._rev,
      },
      null,
      2,
    ),
  )
}
