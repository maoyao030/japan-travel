/**
 * 讀取清單與 Sanity 文件狀態，回報下一篇要生產的文章、當日剩餘額度與各批父 Hub 狀態。
 * 這是自動發布流程唯一的進度依據；不看 Git 裡有沒有文章封包。
 *
 * 用法（在 studio/ 目錄）：npx sanity exec scripts/inspect-article-queue.mjs --with-user-token
 */
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {
  getDailyPublicationLimitForItem,
  getItemAllowedPathPrefix,
  getItemBatch,
  getProductionOrderedItems,
  getQueueBatches,
  loadArticleQueue,
} from '../../scripts/article-automation-policy.mjs'

const projectRoot = path.resolve(import.meta.dirname, '../..')
const queuePath = path.join(projectRoot, 'content-automation', 'article-queue.json')
const queue = await loadArticleQueue(queuePath, projectRoot)
const orderedItems = getProductionOrderedItems(queue)
const ids = orderedItems.flatMap((item) => [item.documentId, `drafts.${item.documentId}`])
const batches = getQueueBatches(queue)
const parentHubIds = batches.flatMap((batch) => [batch.parentHubId, `drafts.${batch.parentHubId}`])
const client = getCliClient({apiVersion: '2026-08-29'})
const [documents, parentHubDocuments] = await Promise.all([
  ids.length > 0
    ? client.fetch(
        `*[_id in $ids]{
          _id,
          _rev,
          _type,
          title,
          noindex,
          publishedAt,
          "slug": slug.current,
          "primaryHubId": primaryHub._ref,
          "coverAssetId": cover.asset._ref
        }`,
        {ids},
      )
    : Promise.resolve([]),
  parentHubIds.length > 0
    ? client.fetch(
        `*[_id in $ids]{
          _id,
          _rev,
          _type,
          title,
          "slug": slug.current,
          publicationState,
          researchValidated,
          noindex
        }`,
        {ids: parentHubIds},
      )
    : Promise.resolve([]),
])

const items = orderedItems.map((item, index) => {
  const article = documents.find((document) => document._id === item.documentId)
  const draft = documents.find((document) => document._id === `drafts.${item.documentId}`)
  let status = 'unpublished'

  if (draft) {
    status = 'blocked_draft'
  } else if (article?._type !== 'article' && article) {
    status = 'blocked_wrong_type'
  } else if (article?.noindex === false && article?.coverAssetId) {
    status = 'published_indexable'
  } else if (article?.noindex === true) {
    status = 'staged_noindex'
  } else if (article) {
    status = 'blocked_invalid_state'
  }

  const batch = getItemBatch(queue, item)
  return {
    productionIndex: index + 1,
    order: item.order,
    batchId: batch?.id ?? null,
    articleId: item.articleId,
    contentTheme: item.contentTheme,
    documentId: item.documentId,
    targetPath: item.targetPath,
    primaryHubId: item.primaryHubId,
    currentPrimaryHubId: article?.primaryHubId ?? null,
    launchGroupId: item.launchGroupId ?? null,
    releaseMode: item.releaseMode,
    status,
    publishedAt: article?.publishedAt ?? null,
    currentRevision: article?._rev ?? null,
    hasCover: Boolean(article?.coverAssetId),
    draftRevision: draft?._rev ?? null,
  }
})

function dateInTimezone(value, timezone) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function describeParentHub(batch) {
  const hub = parentHubDocuments.find((document) => document._id === batch.parentHubId)
  const draft = parentHubDocuments.find((document) => document._id === `drafts.${batch.parentHubId}`)
  const indexableArticleIds = items
    .filter((item) => item.batchId === batch.id && item.status === 'published_indexable')
    .map((item) => item.articleId)
  let status = 'missing'
  if (draft) {
    status = 'blocked_draft'
  } else if (hub && (hub._type !== 'hub' || hub.slug !== batch.parentHubSlug)) {
    status = 'blocked_mismatch'
  } else if (hub && hub.publicationState === 'ready' && hub.researchValidated === true) {
    status = hub.noindex === false ? 'ready_indexable' : 'ready_noindex'
  } else if (hub) {
    status = 'blocked_invalid_state'
  }
  return {
    batchId: batch.id,
    contentTheme: batch.contentTheme,
    themeLabel: batch.themeLabel,
    parentHubId: batch.parentHubId,
    parentHubPath: batch.allowedPathPrefix,
    status,
    currentRevision: hub?._rev ?? null,
    noindex: hub?.noindex ?? null,
    indexableArticleCount: indexableArticleIds.length,
    shouldReleaseIndex: status === 'ready_noindex' && indexableArticleIds.length > 0,
  }
}

const parentHubs = batches.map(describeParentHub)
const today = dateInTimezone(new Date(), queue.publicationCadence.timezone)

const next =
  items.find((item) => item.status === 'staged_noindex') ??
  items.find((item) => item.status !== 'published_indexable') ??
  null
const nextQueueItem = next
  ? orderedItems.find((item) => item.articleId === next.articleId)
  : null
const nextBatch = nextQueueItem ? getItemBatch(queue, nextQueueItem) : null
const dailyPublicationLimit = nextQueueItem
  ? getDailyPublicationLimitForItem(queue, nextQueueItem, today)
  : 0
const publishedToday = items.filter(
  (item) =>
    item.status === 'published_indexable' &&
    dateInTimezone(item.publishedAt, queue.publicationCadence.timezone) === today,
)
const remainingDailyCapacity = Number.isFinite(dailyPublicationLimit)
  ? Math.max(0, dailyPublicationLimit - publishedToday.length)
  : Number.POSITIVE_INFINITY
const describeLimit = (value) => (Number.isFinite(value) ? value : 'unlimited')

const nextProductionUnitIds = next ? [next.articleId] : []
const nextProductionUnitBlocked = nextProductionUnitIds.some((articleId) => {
  const item = items.find((candidate) => candidate.articleId === articleId)
  return !item || ['blocked_draft', 'blocked_wrong_type', 'blocked_invalid_state'].includes(item.status)
})
const allowedPathPrefix = nextQueueItem ? getItemAllowedPathPrefix(queue, nextQueueItem) : null
const themeRouteValid = Boolean(
  nextQueueItem && allowedPathPrefix && nextQueueItem.targetPath.startsWith(allowedPathPrefix),
)
const nextParentHub = nextBatch ? parentHubs.find((hub) => hub.batchId === nextBatch.id) : null
const parentHubBlocked = Boolean(nextParentHub && nextParentHub.status.startsWith('blocked_'))
const canStartNextProductionUnit =
  nextProductionUnitIds.length > 0 &&
  !nextProductionUnitBlocked &&
  !parentHubBlocked &&
  themeRouteValid &&
  nextProductionUnitIds.length <= remainingDailyCapacity

console.log(
  JSON.stringify(
    {
      queue: path.relative(projectRoot, queuePath).replaceAll('\\', '/'),
      cadence: {
        timezone: queue.publicationCadence.timezone,
        today,
        dailyPublicationLimit: describeLimit(dailyPublicationLimit),
        publishedTodayArticleIds: publishedToday.map((item) => item.articleId),
        remainingDailyCapacity: describeLimit(remainingDailyCapacity),
        maxProductionUnitsPerRun: queue.publicationCadence.maxProductionUnitsPerRun,
      },
      parentHubs,
      next,
      nextProductionUnit: next
        ? {
            mode: 'individual',
            articleIds: nextProductionUnitIds,
            batchId: nextBatch?.id ?? null,
            contentTheme: nextQueueItem.contentTheme,
            categorySlug: nextQueueItem.categorySlug,
            allowedPathPrefix,
            themeRouteValid,
            parentHubId: nextBatch?.parentHubId ?? null,
            parentHubPath: allowedPathPrefix,
            parentHubStatus: nextParentHub?.status ?? 'missing',
            parentHubAction:
              nextParentHub?.status === 'missing'
                ? 'prepare-parent-hub'
                : nextParentHub?.shouldReleaseIndex
                  ? 'release-parent-hub-index'
                  : 'none',
            canStart: canStartNextProductionUnit,
          }
        : null,
      items,
    },
    null,
    2,
  ),
)
