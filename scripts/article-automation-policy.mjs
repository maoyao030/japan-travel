/**
 * 文章自動化清單（content-automation/article-queue.json）的規則。
 *
 * 從好材誌的清單結構抽出通用部分：一個主題一個批次（batch）、每篇文章由 Darren 核准後才列入、
 * 進度只看 Sanity 文件狀態、每日上限與執行鎖。本站新增兩條規則（交接文件第五節）：
 * - 面向是住宿（aspect stay）或地點條目（pageType place-entry）的文章必須有「訂房管道」與「查核日期／下次重查日」。
 * - 地點優先網址（2026-10-16）：地點分類不用子 Hub，地點條目是 Hub 入口文章 `/places/<地點>/`，
 *   面向頁是 `/places/<地點>/<面向>/`；網址最多三層。
 * - 關鍵字證據必須標明來源；沒有連 Ahrefs 時只能是「SERP observation」，不得標成 Ahrefs 已驗證。
 */
import {readFile} from 'node:fs/promises'
import path from 'node:path'

export const QUEUE_SCHEMA_VERSION = 1
export const BATCH_SCHEMA_VERSION = 1
export const BATCH_AUTHORIZATION_MODE = 'batch-standing-authorization'
export const CATEGORY_SLUGS = ['places', 'seasons', 'shrines', 'guides']
export const PLACES_CATEGORY_SLUG = 'places'
export const ARTICLE_ASPECTS = ['stay', 'food', 'transport', 'weather', 'hiking', 'festival', 'sight', 'other']
export const PAGE_TYPES = ['place-entry', 'aspect-page', 'topic-page', 'shared-guide']
export const KEYWORD_PROVIDERS = ['Ahrefs MCP', 'Ahrefs browser UI', 'SERP observation']
export const AHREFS_PROVIDERS = ['Ahrefs MCP', 'Ahrefs browser UI']
export const BOOKING_CHANNELS = ['official', 'trip.com', 'agoda', 'jalan-only']
export const COVER_WIDTH = 1600
export const COVER_HEIGHT = 900

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const ARTICLE_DOCUMENT_ID_PATTERN = /^article-[a-z0-9-]+$/

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function isIsoDate(dateString) {
  if (!ISO_DATE_PATTERN.test(dateString ?? '')) return false
  const date = new Date(`${dateString}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString
}

export function addIsoYears(dateString, years) {
  if (!isIsoDate(dateString)) return null
  const date = new Date(`${dateString}T00:00:00Z`)
  date.setUTCFullYear(date.getUTCFullYear() + years)
  return date.toISOString().slice(0, 10)
}

function isPlanningJsonPath(value) {
  return (
    typeof value === 'string' &&
    value.startsWith('content-planning/') &&
    value.endsWith('.json') &&
    !value.includes('..')
  )
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function isUnlimitedDailyLimit(value) {
  return value === null
}

function isValidDailyLimit(value) {
  return isUnlimitedDailyLimit(value) || (Number.isInteger(value) && value > 0)
}

function resolveDailyLimit(value) {
  return isUnlimitedDailyLimit(value) ? Number.POSITIVE_INFINITY : value
}

export function expectedArticlePath(item) {
  if (item?.routeMode === 'hub-landing') {
    return `/${item.categorySlug}/${item.hubSlug}/`
  }
  if (item?.routeMode === 'parent-direct-article') {
    return `/${item.categorySlug}/${item.hubSlug}/${item.articleSlug}/`
  }
  if (item?.routeMode === 'child-hub-landing') {
    return `/${item.categorySlug}/${item.parentHubSlug}/${item.hubSlug}/`
  }
  if (item?.routeMode === 'child-hub-article') {
    return `/${item.categorySlug}/${item.parentHubSlug}/${item.hubSlug}-${item.articleSlug}/`
  }
  return null
}

// ---------------------------------------------------------------------------
// 讀取工具
// ---------------------------------------------------------------------------

export function getQueueBatches(queue) {
  return Array.isArray(queue?.batches) ? queue.batches : []
}

export function findQueueBatch(queue, batchId) {
  return getQueueBatches(queue).find((batch) => batch.id === batchId) ?? null
}

export function getItemBatch(queue, item) {
  if (!item) return null
  return (
    getQueueBatches(queue).find((batch) =>
      (batch.items ?? []).some((candidate) => candidate.articleId === item.articleId),
    ) ?? null
  )
}

export function getItemAuthorization(queue, item) {
  return getItemBatch(queue, item)?.standingAuthorization ?? null
}

export function getItemAllowedPathPrefix(queue, item) {
  return getItemBatch(queue, item)?.allowedPathPrefix ?? null
}

export function getBatchPageSpecPaths(batch) {
  const value = batch?.planningSource?.pageSpecs
  if (typeof value === 'string') return [value]
  return Array.isArray(value) ? value : []
}

function sortByOrder(items) {
  return [...items].sort((left, right) => left.order - right.order)
}

/** 生產順序：依 batches 的順序逐批處理；每批內依 order。 */
export function getProductionOrderedItems(queue) {
  return getQueueBatches(queue).flatMap((batch) => sortByOrder(batch.items ?? []))
}

export function getAllHubLaunchGroups(queue) {
  return getQueueBatches(queue).flatMap((batch) => batch.hubLaunchGroups ?? [])
}

export function findQueueItem(queue, articleId) {
  return getProductionOrderedItems(queue).find((item) => item.articleId === articleId) ?? null
}

export function findHubLaunchGroup(queue, groupId) {
  return getAllHubLaunchGroups(queue).find((group) => group.id === groupId) ?? null
}

export function getHubLaunchGroupItems(queue, groupId) {
  return getProductionOrderedItems(queue).filter((item) => item.launchGroupId === groupId)
}

export function getBatchDailyPublicationLimit(batch, dateString) {
  const cadence = batch?.publicationCadence
  if (!isIsoDate(dateString)) return 0
  if (dateString < cadence?.startDate) return 0
  if (isIsoDate(cadence?.endDate) && dateString > cadence.endDate) return 0
  return resolveDailyLimit(cadence?.maxArticlesPerDay ?? null)
}

/** 當日上限：批次自己的設定優先，否則用清單總設定；兩者取較小值。 */
export function getDailyPublicationLimitForItem(queue, item, dateString) {
  const batch = getItemBatch(queue, item)
  if (!batch) return 0
  const batchLimit = getBatchDailyPublicationLimit(batch, dateString)
  const siteLimit = resolveDailyLimit(queue?.publicationCadence?.maxArticlesPerDay ?? null)
  return Math.min(batchLimit, siteLimit)
}

// ---------------------------------------------------------------------------
// 清單驗證
// ---------------------------------------------------------------------------

function validateHubCopy(copy, label, issues) {
  for (const field of ['title', 'eyebrow', 'seoTitle', 'seoDescription']) {
    if (!hasText(copy?.[field])) issues.push(`${label}.${field} 不得為空`)
  }
  if (/[:：]/.test(copy?.title ?? '') || /[:：]/.test(copy?.seoTitle ?? '')) {
    issues.push(`${label} 的標題與 SEO 標題不得用冒號切開`)
  }
  if (!Array.isArray(copy?.introduction) || copy.introduction.length < 1) {
    issues.push(`${label}.introduction 至少要有 1 段`)
  }
  if (!Array.isArray(copy?.checklist) || copy.checklist.length < 3 || copy.checklist.length > 5) {
    issues.push(`${label}.checklist 必須有 3～5 項`)
  }
  if (copy?.researchValidated !== true) issues.push(`${label} 必須完成研究驗證`)
}

function validateKeywordValidation(validation, batch, label, issues) {
  if (
    !KEYWORD_PROVIDERS.includes(validation?.provider) ||
    validation?.country !== 'TW' ||
    !isIsoDate(validation?.auditedAt) ||
    validation?.decision !== 'keep' ||
    !hasText(validation?.query) ||
    !hasText(validation?.svDisplay) ||
    validation?.record !== batch?.planningSource?.candidateRegistry
  ) {
    issues.push(`${label}.keywordValidation 必須記錄關鍵字證據的來源、日期、查詢與搜尋量`)
  }
  const isAhrefs = AHREFS_PROVIDERS.includes(validation?.provider)
  if (validation?.ahrefsVerified !== isAhrefs) {
    issues.push(
      `${label}.keywordValidation.ahrefsVerified 只有來源是 Ahrefs 時才能是 true；只做搜尋結果觀察不得標成 Ahrefs 已驗證`,
    )
  }
  if (validation?.serpIntentConfirmed !== true) {
    issues.push(`${label}.keywordValidation.serpIntentConfirmed 必須是 true（已確認搜尋結果是日本而非台灣同名地名）`)
  }
}

export function requiresStayValidation(item) {
  return item?.aspect === 'stay' || item?.pageType === 'place-entry'
}

/** 住宿頁與地點條目專屬：訂房管道與查核日期（交接文件第二、五節）。 */
export function validateStayItem(item, label) {
  const issues = []
  const channels = item?.bookingChannels
  if (
    !Array.isArray(channels) ||
    channels.length === 0 ||
    channels.some((channel) => !BOOKING_CHANNELS.includes(channel)) ||
    new Set(channels).size !== channels.length
  ) {
    issues.push(`${label}.bookingChannels 必須列出訂房管道（${BOOKING_CHANNELS.join('／')}）`)
  } else if (channels.includes('jalan-only') && channels.length > 1) {
    issues.push(`${label}.bookingChannels 標示僅 Jalan 時不得同時列其他管道`)
  }

  const factCheck = item?.factCheck
  if (
    !isIsoDate(factCheck?.lastVerifiedAt) ||
    factCheck?.nextReviewDue !== addIsoYears(factCheck?.lastVerifiedAt, 1)
  ) {
    issues.push(`${label}.factCheck 必須有查核日期 lastVerifiedAt，且 nextReviewDue 等於一年後`)
  }
  if (
    !Array.isArray(factCheck?.sources) ||
    factCheck.sources.length === 0 ||
    factCheck.sources.some((source) => !isHttpsUrl(source))
  ) {
    issues.push(`${label}.factCheck.sources 必須列出至少一個 HTTPS 官網來源`)
  }
  return issues
}

function validateQueueBatch(queue, batch, index, seen) {
  const issues = []
  const label = `batches[${index}]`

  if (!SLUG_PATTERN.test(batch?.id ?? '')) issues.push(`${label}.id 格式錯誤`)
  if (seen.batchIds.has(batch?.id)) issues.push(`${label}.id 重複：${batch?.id}`)
  seen.batchIds.add(batch?.id)
  if (batch?.batchSchemaVersion !== BATCH_SCHEMA_VERSION) {
    issues.push(`${label}.batchSchemaVersion 必須是 ${BATCH_SCHEMA_VERSION}`)
  }
  if (!SLUG_PATTERN.test(batch?.contentTheme ?? '')) issues.push(`${label}.contentTheme 格式錯誤`)
  if (!hasText(batch?.themeLabel)) issues.push(`${label}.themeLabel 不得為空`)
  if (!CATEGORY_SLUGS.includes(batch?.categorySlug)) {
    issues.push(`${label}.categorySlug 必須是 ${CATEGORY_SLUGS.join('、')} 之一`)
  }
  if (!SLUG_PATTERN.test(batch?.parentHubSlug ?? '')) issues.push(`${label}.parentHubSlug 格式錯誤`)
  const expectedParentHubId = `hub-${batch?.categorySlug}-${batch?.parentHubSlug}`
  const expectedPathPrefix = `/${batch?.categorySlug}/${batch?.parentHubSlug}/`
  if (batch?.parentHubId !== expectedParentHubId) {
    issues.push(`${label}.parentHubId 必須是 ${expectedParentHubId}`)
  }
  if (batch?.allowedPathPrefix !== expectedPathPrefix) {
    issues.push(`${label}.allowedPathPrefix 必須是 ${expectedPathPrefix}`)
  }

  const planningSource = batch?.planningSource
  const specPaths = getBatchPageSpecPaths(batch)
  const deferredItems = Array.isArray(planningSource?.deferredItems)
    ? planningSource.deferredItems
    : null
  if (
    specPaths.length === 0 ||
    !specPaths.every(isPlanningJsonPath) ||
    new Set(specPaths).size !== specPaths.length ||
    !isPlanningJsonPath(planningSource?.candidateRegistry) ||
    !isIsoDate(planningSource?.planningCompletedAt) ||
    !Number.isInteger(planningSource?.authorizedCount) ||
    planningSource.authorizedCount < 1 ||
    !Number.isInteger(planningSource?.plannedPageCount) ||
    planningSource?.countPolicy !== 'validated-independent-pages-only' ||
    !deferredItems ||
    planningSource.plannedPageCount !== planningSource.authorizedCount + deferredItems.length
  ) {
    issues.push(
      `${label}.planningSource 必須指向 content-planning 的頁面規格與候選登記，且已授權頁數加延後頁數等於規劃頁數`,
    )
  }
  for (const [deferredIndex, deferred] of (deferredItems ?? []).entries()) {
    if (
      !SLUG_PATTERN.test(deferred?.articleId ?? '') ||
      !hasText(deferred?.primaryQuery) ||
      !hasText(deferred?.targetPath) ||
      !hasText(deferred?.reason)
    ) {
      issues.push(`${label}.planningSource.deferredItems[${deferredIndex}] 必須記錄延後的頁面與原因`)
    }
  }

  const authorization = batch?.standingAuthorization
  if (
    !isIsoDate(authorization?.recordedAt) ||
    !hasText(authorization?.authorizedBy) ||
    !hasText(authorization?.decision) ||
    authorization?.scope !== 'listed-items-only' ||
    authorization?.autoPublish !== true ||
    authorization?.indexable !== true ||
    authorization?.researchMayFinalizeWorkingFields !== true ||
    authorization?.finalizationLimits?.contentTheme !== batch?.contentTheme ||
    authorization?.finalizationLimits?.allowedPathPrefix !== batch?.allowedPathPrefix ||
    authorization?.finalizationLimits?.preserveTopicDirection !== true ||
    authorization?.finalizationLimits?.preserveContentBoundary !== true ||
    authorization?.finalizationLimits?.requireQueueTargetPath !== true
  ) {
    issues.push(`${label}.standingAuthorization 必須記錄 Darren 的核准日期與決定，並限定只能自動發布清單內的文章`)
  }

  const cadence = batch?.publicationCadence
  if (
    cadence?.timezone !== 'Asia/Taipei' ||
    !isIsoDate(cadence?.startDate) ||
    (cadence?.endDate !== undefined && cadence?.endDate !== null && !isIsoDate(cadence.endDate)) ||
    !isValidDailyLimit(cadence?.maxArticlesPerDay ?? null) ||
    cadence?.maxProductionUnitsPerRun !== 1 ||
    cadence?.productionUnitMode !== 'individual'
  ) {
    issues.push(`${label}.publicationCadence 必須是台北時間、有開始日期、每輪 1 篇；每日上限為正整數或 null`)
  }

  const parentHub = batch?.parentHub
  if (
    parentHub?.id !== batch?.parentHubId ||
    parentHub?.slug !== batch?.parentHubSlug ||
    parentHub?.category !== batch?.categorySlug ||
    parentHub?.publicationState !== 'ready' ||
    parentHub?.noindexUntilFirstIndexableArticle !== true ||
    !isPlanningJsonPath(parentHub?.researchRecord)
  ) {
    issues.push(`${label}.parentHub 必須對應本批父 Hub，狀態為可發布，並在第一篇文章開放索引前維持 noindex`)
  }
  validateHubCopy(parentHub, `${label}.parentHub`, issues)

  const readyChildHubs = Array.isArray(batch?.readyChildHubs) ? batch.readyChildHubs : []
  const readyChildHubsById = new Map()
  for (const [hubIndex, hub] of readyChildHubs.entries()) {
    const hubLabel = `${label}.readyChildHubs[${hubIndex}]`
    if (
      hub?.id !== `${batch?.parentHubId}-${hub?.slug}` ||
      !SLUG_PATTERN.test(hub?.slug ?? '') ||
      hub?.parentHubId !== batch?.parentHubId ||
      !ARTICLE_DOCUMENT_ID_PATTERN.test(hub?.landingArticleId ?? '')
    ) {
      issues.push(`${hubLabel} 必須是本批父 Hub 底下已啟用的子 Hub`)
    }
    if (readyChildHubsById.has(hub?.id)) issues.push(`${hubLabel}.id 重複：${hub?.id}`)
    readyChildHubsById.set(hub?.id, hub)
  }

  const launchGroups = Array.isArray(batch?.hubLaunchGroups) ? batch.hubLaunchGroups : []
  const launchGroupsById = new Map()
  for (const [groupIndex, group] of launchGroups.entries()) {
    const groupLabel = `${label}.hubLaunchGroups[${groupIndex}]`
    if (!SLUG_PATTERN.test(group?.id ?? '')) issues.push(`${groupLabel}.id 格式錯誤`)
    if (launchGroupsById.has(group?.id) || seen.launchGroupIds.has(group?.id)) {
      issues.push(`${groupLabel}.id 重複：${group?.id}`)
    }
    launchGroupsById.set(group?.id, group)
    seen.launchGroupIds.add(group?.id)
    if (
      group?.contentTheme !== batch?.contentTheme ||
      group?.categorySlug !== batch?.categorySlug ||
      group?.parentHubId !== batch?.parentHubId ||
      group?.parentHubSlug !== batch?.parentHubSlug ||
      !SLUG_PATTERN.test(group?.childHubSlug ?? '') ||
      group?.childHubId !== `${batch?.parentHubId}-${group?.childHubSlug}` ||
      group?.landingArticleId !== `article-${group?.childHubSlug}` ||
      !['new', 'existing-indexable'].includes(group?.landingArticleMode)
    ) {
      issues.push(`${groupLabel} 必須是本批父 Hub 底下的子 Hub 定義，入口文章 ID 須與子 Hub slug 一致`)
    }
    if (!Array.isArray(group?.articleIds) || group.articleIds.length === 0) {
      issues.push(`${groupLabel}.articleIds 不得為空`)
    } else if (new Set(group.articleIds).size !== group.articleIds.length) {
      issues.push(`${groupLabel}.articleIds 不得重複`)
    }
    const blueprint = group?.childHubBlueprint
    if (group?.childHub) {
      validateHubCopy(group.childHub, `${groupLabel}.childHub`, issues)
    } else if (
      !hasText(blueprint?.title) ||
      !hasText(blueprint?.contentBoundary) ||
      blueprint?.copyMode !== 'generate-and-validate-before-staging'
    ) {
      issues.push(`${groupLabel}.childHubBlueprint 必須鎖定主題邊界並要求研究後產生 Hub 文案`)
    }
  }

  const items = Array.isArray(batch?.items) ? batch.items : []
  if (items.length === 0) {
    issues.push(`${label}.items 不得為空`)
    return issues
  }
  if (items.length !== planningSource?.authorizedCount) {
    issues.push(`${label}.items 必須完整列出本批已核准的獨立頁，不得為篇數配額增減`)
  }

  const seenOrders = new Set()
  const batchDocumentIds = new Set(items.map((item) => item?.documentId))
  const earlierDocumentIds = new Set()
  for (const [itemIndex, item] of items.entries()) {
    const itemLabel = `${label}.items[${itemIndex}]`
    if (!Number.isInteger(item?.order) || item.order < 1) {
      issues.push(`${itemLabel}.order 必須是正整數`)
    } else if (seenOrders.has(item.order)) {
      issues.push(`${itemLabel}.order 重複：${item.order}`)
    }
    seenOrders.add(item?.order)

    for (const field of [
      'articleId',
      'contentTheme',
      'topicDirection',
      'pageRole',
      'documentId',
      'workingTitle',
      'primaryKeyword',
      'primaryQuery',
      'articleSlug',
      'targetPath',
      'authorId',
      'primaryHubId',
      'categorySlug',
      'hubSlug',
      'contentBoundary',
      'readerTask',
      'plannedInternalLinks',
      'authorizationMode',
    ]) {
      if (!hasText(item?.[field])) issues.push(`${itemLabel}.${field} 不得為空`)
    }
    if (/[:：]/.test(item?.workingTitle ?? '')) issues.push(`${itemLabel}.workingTitle 不得使用冒號`)
    if (item?.contentTheme !== batch?.contentTheme) {
      issues.push(`${itemLabel}.contentTheme 必須是 ${batch?.contentTheme}`)
    }
    if (item?.authorizationMode !== BATCH_AUTHORIZATION_MODE) {
      issues.push(`${itemLabel}.authorizationMode 必須是 ${BATCH_AUTHORIZATION_MODE}`)
    }
    if (item?.categorySlug !== batch?.categorySlug) {
      issues.push(`${itemLabel}.categorySlug 必須是 ${batch?.categorySlug}`)
    }
    if (!SLUG_PATTERN.test(item?.articleId ?? '')) issues.push(`${itemLabel}.articleId 格式錯誤`)
    if (!SLUG_PATTERN.test(item?.articleSlug ?? '')) issues.push(`${itemLabel}.articleSlug 格式錯誤`)
    if (item?.documentId !== `article-${item?.articleId}`) {
      issues.push(`${itemLabel}.documentId 必須是 article-${item?.articleId ?? '<articleId>'}`)
    }
    if (item?.primaryKeyword !== item?.primaryQuery) {
      issues.push(`${itemLabel}.primaryKeyword 必須等於 primaryQuery`)
    }
    if (item?.releaseMode !== 'individual') issues.push(`${itemLabel} 清單文章一律單篇發布`)
    if (
      !specPaths.includes(item?.planningSpec?.pageSpecs) ||
      item?.planningSpec?.articleId !== item?.articleId
    ) {
      issues.push(`${itemLabel}.planningSpec 必須指回本批頁面規格中的同一篇`)
    }

    validateKeywordValidation(item?.keywordValidation, batch, itemLabel, issues)
    if (!ARTICLE_ASPECTS.includes(item?.aspect)) {
      issues.push(`${itemLabel}.aspect 必須是 ${ARTICLE_ASPECTS.join('、')} 之一`)
    }
    if (!PAGE_TYPES.includes(item?.pageType)) {
      issues.push(`${itemLabel}.pageType 必須是 ${PAGE_TYPES.join('、')} 之一`)
    }
    if (requiresStayValidation(item)) issues.push(...validateStayItem(item, itemLabel))

    const launchGroup = launchGroupsById.get(item?.launchGroupId)
    const isHubLanding = item?.routeMode === 'hub-landing'
    const isParentDirect = item?.routeMode === 'parent-direct-article'
    const isChildHubItem = ['child-hub-landing', 'child-hub-article'].includes(item?.routeMode)
    if (!isHubLanding && !isParentDirect && !isChildHubItem) {
      issues.push(`${itemLabel}.routeMode 不是允許的文章路徑類型`)
    }
    if (isChildHubItem && batch?.categorySlug === PLACES_CATEGORY_SLUG) {
      issues.push(`${itemLabel} 地點分類不使用子 Hub；需要更細時升格成獨立地點，或在第三層用連字號代稱`)
    }
    if (item?.pageType === 'place-entry' && !(isHubLanding && batch?.categorySlug === PLACES_CATEGORY_SLUG)) {
      issues.push(`${itemLabel} 地點條目必須是地點分類的 Hub 入口文章（routeMode hub-landing）`)
    }
    if (isHubLanding) {
      if (
        item?.primaryHubId !== batch?.parentHubId ||
        item?.hubSlug !== batch?.parentHubSlug ||
        item?.articleSlug !== item?.hubSlug ||
        item?.futureHubLanding !== true
      ) {
        issues.push(`${itemLabel} Hub 入口文章必須掛在 ${batch?.parentHubId}，slug 與 Hub 相同並標示 futureHubLanding`)
      }
    } else if (isParentDirect) {
      if (item?.primaryHubId !== batch?.parentHubId || item?.hubSlug !== batch?.parentHubSlug) {
        issues.push(`${itemLabel} 父 Hub 直屬文章必須掛在 ${batch?.parentHubId}`)
      }
    } else if (isChildHubItem) {
      const childDefinition =
        launchGroup ??
        launchGroups.find((group) => group.childHubId === item?.primaryHubId) ??
        readyChildHubsById.get(item?.primaryHubId)
      const childHubId = childDefinition?.childHubId ?? childDefinition?.id
      const childHubSlug = childDefinition?.childHubSlug ?? childDefinition?.slug
      if (
        !childDefinition ||
        childHubId !== item?.primaryHubId ||
        childHubSlug !== item?.hubSlug ||
        item?.parentHubSlug !== batch?.parentHubSlug ||
        (launchGroup && !launchGroup.articleIds?.includes(item?.articleId))
      ) {
        issues.push(`${itemLabel} 子 Hub 文章與子 Hub 定義不一致`)
      }
      if (
        item?.routeMode === 'child-hub-landing' &&
        (item?.documentId !== childDefinition?.landingArticleId ||
          item?.articleSlug !== item?.hubSlug ||
          item?.futureHubLanding !== true)
      ) {
        issues.push(`${itemLabel} 子 Hub 入口文章與子 Hub 定義不一致`)
      }
    }
    if (item?.targetPath !== expectedArticlePath(item)) {
      issues.push(`${itemLabel}.targetPath 與分類、Hub、slug 不一致`)
    }
    if (!item?.targetPath?.startsWith(batch?.allowedPathPrefix ?? ' ')) {
      issues.push(`${itemLabel}.targetPath 不在 ${batch?.allowedPathPrefix} 底下`)
    }

    if (!Array.isArray(item?.relatedArticleIds)) {
      issues.push(`${itemLabel}.relatedArticleIds 必須是陣列`)
    } else {
      for (const relatedId of item.relatedArticleIds) {
        if (!ARTICLE_DOCUMENT_ID_PATTERN.test(relatedId ?? '')) {
          issues.push(`${itemLabel}.relatedArticleIds 含有無效文件 ID`)
        } else if (
          !seen.earlierBatchDocumentIds.has(relatedId) &&
          !(batchDocumentIds.has(relatedId) && earlierDocumentIds.has(relatedId))
        ) {
          issues.push(
            `${itemLabel}.relatedArticleIds 只能引用前面批次的文章或本批排在前面的文章：${relatedId}`,
          )
        }
      }
    }
    earlierDocumentIds.add(item?.documentId)

    for (const [value, seenSet, field] of [
      [item?.articleId, seen.articleIds, 'articleId'],
      [item?.documentId, seen.documentIds, 'documentId'],
      [item?.targetPath, seen.paths, 'targetPath'],
    ]) {
      if (seenSet.has(value)) issues.push(`${itemLabel}.${field} 重複：${value}`)
      seenSet.add(value)
    }
  }

  const ordered = sortByOrder(items)
  if (ordered.some((item, itemIndex) => item.order !== itemIndex + 1)) {
    issues.push(`${label}.items.order 必須從 1 開始連續排列`)
  }
  for (const [groupIndex, group] of launchGroups.entries()) {
    const groupLabel = `${label}.hubLaunchGroups[${groupIndex}]`
    const actualArticleIds = ordered
      .filter((item) => item.launchGroupId === group.id)
      .map((item) => item.articleId)
    if (
      actualArticleIds.length !== group.articleIds?.length ||
      actualArticleIds.some((articleId, articleIndex) => articleId !== group.articleIds[articleIndex])
    ) {
      issues.push(`${groupLabel}.articleIds 必須與本批清單中的同組文章及順序完全一致`)
    }
    if (
      group.landingArticleMode === 'new' &&
      !group.articleIds?.some((id) => `article-${id}` === group.landingArticleId)
    ) {
      issues.push(`${groupLabel} 新子 Hub 的入口文章必須列在同組文章中`)
    }
  }

  for (const documentId of batchDocumentIds) seen.earlierBatchDocumentIds.add(documentId)
  return issues
}

export function validateArticleQueue(queue) {
  const issues = []

  if (queue?.schemaVersion !== QUEUE_SCHEMA_VERSION) {
    issues.push(`schemaVersion 必須是 ${QUEUE_SCHEMA_VERSION}`)
  }
  if (queue?.selectionPolicy !== 'queue-order-not-indexable-in-sanity') {
    issues.push('selectionPolicy 必須依清單順序，由 Sanity 文件狀態判斷下一篇')
  }
  if (queue?.statusTracking !== 'sanity-document-state') {
    issues.push('不得把每日進度寫回 Git；statusTracking 必須是 sanity-document-state')
  }

  try {
    const siteUrl = new URL(queue?.siteBaseUrl)
    if (siteUrl.protocol !== 'https:' || siteUrl.pathname !== '/') {
      issues.push('siteBaseUrl 必須是 HTTPS 網站根網址')
    }
  } catch {
    issues.push('siteBaseUrl 不是有效網址')
  }

  const cadence = queue?.publicationCadence
  if (
    cadence?.timezone !== 'Asia/Taipei' ||
    !Number.isInteger(cadence?.triggerIntervalHours) ||
    cadence.triggerIntervalHours < 1 ||
    cadence?.maxProductionUnitsPerRun !== 1 ||
    cadence?.productionUnitMode !== 'individual' ||
    !Number.isInteger(cadence?.lockStaleAfterHours) ||
    cadence.lockStaleAfterHours < 1 ||
    !isValidDailyLimit(cadence?.maxArticlesPerDay ?? null)
  ) {
    issues.push('publicationCadence 必須是台北時間、固定啟動間隔、每輪 1 篇、有鎖逾時小時數；每日上限為正整數或 null')
  }

  if (queue?.runLog !== undefined) {
    const runLogPath = queue.runLog?.path
    if (
      typeof runLogPath !== 'string' ||
      !runLogPath.startsWith('content-automation/') ||
      !runLogPath.endsWith('.md') ||
      runLogPath.includes('..')
    ) {
      issues.push('runLog.path 必須是 content-automation/ 內的 Markdown 執行紀錄文件')
    }
    if (queue.runLog?.updateEveryRun !== true) {
      issues.push('runLog.updateEveryRun 必須是 true，每輪結束前都要記錄結果')
    }
  }

  if (queue?.batches !== undefined && !Array.isArray(queue.batches)) {
    issues.push('batches 必須是陣列')
    return issues
  }

  const seen = {
    batchIds: new Set(),
    launchGroupIds: new Set(),
    earlierBatchDocumentIds: new Set(),
    articleIds: new Set(),
    documentIds: new Set(),
    paths: new Set(),
  }
  for (const [index, batch] of getQueueBatches(queue).entries()) {
    issues.push(...validateQueueBatch(queue, batch, index, seen))
  }

  return issues
}

// ---------------------------------------------------------------------------
// 規劃紀錄核對：清單不能在規劃之外偷改查詢、網址、內容邊界或搜尋量證據
// ---------------------------------------------------------------------------

function isPlanningCompleteStatus(status) {
  return typeof status === 'string' && (status === 'planning-complete' || status.endsWith('-complete'))
}

function normalizePlanningSpec(spec) {
  if (!spec) return null
  return {
    decision: spec.decision ?? spec.planningStatus ?? null,
    finalQuery: spec.finalQuery ?? spec.primaryQuery ?? null,
    canonicalUrl: spec.canonicalUrl ?? spec.targetPath ?? null,
    primaryHubId: spec.primaryHubId ?? null,
    contentBoundary: spec.contentBoundary ?? null,
    planningTitle: spec.planningTitle ?? null,
    primaryTask: spec.readerTaskContract?.primaryTask ?? spec.primaryTask ?? null,
  }
}

function collectSpecItems(pageSpecs) {
  const documents = Array.isArray(pageSpecs) ? pageSpecs : [pageSpecs]
  return documents.flatMap((document) =>
    (Array.isArray(document?.items) ? document.items : []).map((spec) => ({
      spec,
      document,
      normalized: normalizePlanningSpec(spec),
    })),
  )
}

export function validateBatchPlanningRecords(batch, {pageSpecs, candidateRegistry}) {
  const issues = []
  const label = `batches(${batch?.id})`
  const specDocuments = Array.isArray(pageSpecs) ? pageSpecs : [pageSpecs]
  const specEntries = collectSpecItems(pageSpecs)
  const registryItems = Array.isArray(candidateRegistry?.items) ? candidateRegistry.items : []
  const specById = new Map(specEntries.map((entry) => [entry.spec.articleId, entry]))
  const registryById = new Map(registryItems.map((entry) => [entry.articleId, entry]))
  const keepSpecCount = specEntries.filter(({normalized}) => normalized.decision === 'keep').length
  const deferredItems = batch?.planningSource?.deferredItems ?? []

  if (
    specDocuments.some((document) => !isPlanningCompleteStatus(document?.status)) ||
    !isPlanningCompleteStatus(candidateRegistry?.status)
  ) {
    issues.push(`${label} 的頁面規格與候選登記必須都是 planning-complete`)
  }
  if (keepSpecCount !== batch?.planningSource?.plannedPageCount) {
    issues.push(`${label}.planningSource.plannedPageCount 必須等於頁面規格中保留的頁數 ${keepSpecCount}`)
  }

  const specPaths = getBatchPageSpecPaths(batch)
  for (const [index, item] of (batch?.items ?? []).entries()) {
    const itemLabel = `${label}.items[${index}]`
    const entryRecord = specById.get(item.articleId)
    const spec = entryRecord?.normalized ?? null
    const entry = registryById.get(item.articleId)
    if (!spec || spec.decision !== 'keep') {
      issues.push(`${itemLabel} 在頁面規格中不存在或未保留`)
      continue
    }
    if (
      specDocuments.length > 1 &&
      specDocuments.indexOf(entryRecord.document) !== specPaths.indexOf(item.planningSpec?.pageSpecs)
    ) {
      issues.push(`${itemLabel}.planningSpec.pageSpecs 不是這篇規格實際所在的檔案`)
    }
    if (
      spec.finalQuery !== item.primaryQuery ||
      spec.canonicalUrl !== item.targetPath ||
      (spec.primaryHubId !== null && spec.primaryHubId !== item.primaryHubId) ||
      spec.contentBoundary !== item.contentBoundary ||
      spec.planningTitle !== item.workingTitle ||
      spec.primaryTask !== item.readerTask
    ) {
      issues.push(`${itemLabel} 的主要查詢、網址、Hub、內容邊界、標題或讀者任務與頁面規格不一致`)
    }
    const evidence = entry?.metricEvidence
    const validation = item.keywordValidation
    if (
      !entry ||
      entry.decision !== 'keep' ||
      evidence?.provider !== validation?.provider ||
      evidence?.checkedAt !== validation?.auditedAt ||
      evidence?.query !== validation?.query ||
      evidence?.svDisplay !== validation?.svDisplay
    ) {
      issues.push(`${itemLabel}.keywordValidation 與候選登記的關鍵字證據不一致`)
    }
  }

  for (const [index, deferred] of deferredItems.entries()) {
    const spec = specById.get(deferred.articleId)?.normalized ?? null
    if (!spec || spec.canonicalUrl !== deferred.targetPath || spec.finalQuery !== deferred.primaryQuery) {
      issues.push(`${label}.planningSource.deferredItems[${index}] 與頁面規格不一致`)
    }
  }

  return issues
}

export async function loadBatchPlanningRecords(batch, projectRoot = path.resolve(import.meta.dirname, '..')) {
  async function loadJson(relativePath) {
    try {
      return JSON.parse(await readFile(path.resolve(projectRoot, relativePath), 'utf8'))
    } catch (error) {
      throw new Error(`批次 ${batch.id} 的規劃紀錄無法讀取（${relativePath}）：${error.message}`)
    }
  }
  const specDocuments = []
  for (const relativePath of getBatchPageSpecPaths(batch)) specDocuments.push(await loadJson(relativePath))
  return {
    pageSpecs: typeof batch.planningSource.pageSpecs === 'string' ? specDocuments[0] : specDocuments,
    candidateRegistry: await loadJson(batch.planningSource.candidateRegistry),
  }
}

export async function loadArticleQueue(queuePath, projectRoot = path.resolve(import.meta.dirname, '..')) {
  const resolvedPath = path.resolve(queuePath)
  const queue = JSON.parse(await readFile(resolvedPath, 'utf8'))
  const queueIssues = validateArticleQueue(queue)
  if (queueIssues.length > 0) {
    throw new Error(`文章自動化清單驗證失敗：\n- ${queueIssues.join('\n- ')}`)
  }
  const issues = []
  for (const batch of getQueueBatches(queue)) {
    issues.push(...validateBatchPlanningRecords(batch, await loadBatchPlanningRecords(batch, projectRoot)))
  }
  if (issues.length > 0) {
    throw new Error(`文章自動化清單驗證失敗：\n- ${issues.join('\n- ')}`)
  }
  return queue
}

// ---------------------------------------------------------------------------
// 發布前核對：Sanity 文件與文章封包必須和清單一致
// ---------------------------------------------------------------------------

export function getArticlePathFromSnapshot(snapshot) {
  const hub = snapshot?.hub
  if (!hub) return null

  const isLandingArticle = hub.landingArticleId === snapshot.articleId
  const segments = hub.parentHub?.slug
    ? [
        hub.categorySlug,
        hub.parentHub.slug,
        isLandingArticle ? hub.slug : `${hub.slug}-${snapshot.slug}`,
      ]
    : [hub.categorySlug, hub.slug, ...(isLandingArticle ? [] : [snapshot.slug])]

  if (segments.some((segment) => !SLUG_PATTERN.test(segment ?? ''))) return null
  return `/${segments.join('/')}/`
}

export function validateReleaseSnapshot(snapshot, item) {
  const issues = []
  const requiredArticleFields = [
    'title',
    'excerpt',
    'publishedAt',
    'updatedAt',
    'seoTitle',
    'seoDescription',
  ]

  if (snapshot?.articleId !== item.documentId) issues.push('Sanity 文章 ID 與清單不一致')
  if (snapshot?.slug !== item.articleSlug) issues.push('Sanity slug 與清單不一致')
  if (snapshot?.authorId !== item.authorId) issues.push('Sanity 作者與清單不一致')
  if (snapshot?.primaryHubId !== item.primaryHubId) issues.push('Sanity 主要 Hub 與清單不一致')
  if (snapshot?.sponsored !== false) issues.push('自動發布清單不接受業配文章')
  if (snapshot?.noindex !== true && snapshot?.noindex !== false) {
    issues.push('Sanity 文章缺少明確的 noindex 布林值')
  }
  if (!Number.isInteger(snapshot?.bodyCount) || snapshot.bodyCount < 1) {
    issues.push('Sanity 文章正文為空')
  }
  for (const field of requiredArticleFields) {
    if (!hasText(snapshot?.[field])) issues.push(`Sanity 文章缺少 ${field}`)
  }

  const cover = snapshot?.cover
  if (
    !hasText(cover?.assetId) ||
    cover?.width !== COVER_WIDTH ||
    cover?.height !== COVER_HEIGHT ||
    !hasText(cover?.alt) ||
    !hasText(cover?.caption) ||
    !hasText(cover?.credit)
  ) {
    issues.push(`Sanity 封面必須完成 ${COVER_WIDTH}×${COVER_HEIGHT}、替代文字、圖說與署名`)
  }

  const hub = snapshot?.hub
  if (
    hub?.id !== item.primaryHubId ||
    !hasText(hub?.title) ||
    !hasText(hub?.slug) ||
    !hasText(hub?.categorySlug)
  ) {
    issues.push('主要 Hub 與清單不一致')
  }

  const route = getArticlePathFromSnapshot(snapshot)
  if (route !== item.targetPath) issues.push(`實際文章路徑不符清單：${route ?? '無法計算'}`)

  return issues
}

export function validateStandingApproval(manifest, queue, item) {
  const issues = []
  const approval = manifest?.approval
  const planning = manifest?.planning
  const today = new Date().toISOString().slice(0, 10)
  const authorization = getItemAuthorization(queue, item)

  if (manifest?.articleId !== item.articleId) issues.push('文章封包 ID 與清單不一致')
  if (manifest?.targetUrl !== item.targetPath) issues.push('文章封包網址與清單不一致')
  if (manifest?.primaryKeyword !== item.primaryKeyword) {
    issues.push('文章封包主要關鍵字與清單不一致')
  }
  if (manifest?.primaryQuery !== item.primaryQuery) {
    issues.push('文章封包主要查詢與固定清單不一致')
  }
  if (
    planning?.source !== 'content-automation/article-queue.json' ||
    planning?.recordId !== item.articleId ||
    planning?.status !== 'keep' ||
    planning?.publicationAuthorization !== 'authorized' ||
    planning?.authorizedAt !== authorization?.recordedAt
  ) {
    issues.push('文章封包的規劃來源、保留決策或發布授權與固定清單不一致')
  }
  for (const [field, expectedValue, label] of [
    ['topicDirection', item.topicDirection, '主題方向'],
    ['pageRole', item.pageRole, '頁面角色'],
    ['contentBoundary', item.contentBoundary, '內容邊界'],
    ['primaryHubId', item.primaryHubId, '主要 Hub'],
  ]) {
    if (planning?.[field] !== expectedValue) {
      issues.push(`文章封包${label}與固定清單不一致`)
    }
  }
  if (manifest?.status !== 'approved') issues.push('文章封包必須是 approved')
  if (
    approval?.mode !== 'standing-authorization' ||
    approval?.queue !== 'content-automation/article-queue.json' ||
    approval?.authorizedAt !== authorization?.recordedAt ||
    !isIsoDate(approval?.approvedAt) ||
    approval.approvedAt < approval.authorizedAt ||
    approval.approvedAt > today
  ) {
    issues.push('文章封包缺少有效且不早於授權日的清單預先發布核准紀錄')
  }

  return issues
}
