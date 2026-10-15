import assert from 'node:assert/strict'
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import test from 'node:test'

import {
  acquireAutoPublisherLock,
  releaseAutoPublisherLock,
} from '../scripts/manage-auto-publisher-lock.mjs'
import {
  BOOKING_CHANNELS,
  CATEGORY_SLUGS,
  findQueueItem,
  getArticlePathFromSnapshot,
  getDailyPublicationLimitForItem,
  getProductionOrderedItems,
  loadArticleQueue,
  validateArticleQueue,
  validateBatchPlanningRecords,
  validateReleaseSnapshot,
  validateStandingApproval,
  validateStayItem,
} from '../scripts/article-automation-policy.mjs'
import {siteCategories} from '../src/data/categories.ts'

const projectRoot = path.resolve(import.meta.dirname, '..')
const queuePath = path.join(projectRoot, 'content-automation/article-queue.json')

type AnyRecord = Record<string, any>

function createItem(overrides: AnyRecord = {}): AnyRecord {
  return {
    order: 1,
    articleId: 'ginzan-onsen-ryokan',
    contentTheme: 'ginzan-onsen',
    topicDirection: '銀山溫泉旅館清單與訂房管道',
    pageRole: '住宿清單頁',
    documentId: 'article-ginzan-onsen-ryokan',
    workingTitle: '銀山溫泉住宿怎麼訂，官網與 Agoda 能訂到的旅館',
    primaryKeyword: '銀山溫泉 住宿',
    primaryQuery: '銀山溫泉 住宿',
    articleSlug: 'ryokan',
    targetPath: '/stay/ginzan-onsen/ryokan/',
    authorId: 'author-editorial-team',
    primaryHubId: 'hub-stay-ginzan-onsen',
    categorySlug: 'stay',
    hubSlug: 'ginzan-onsen',
    routeMode: 'parent-direct-article',
    contentBoundary: '只寫銀山溫泉街區內的旅館，不含尾花澤市區飯店。',
    readerTask: '決定住哪一間、從哪裡訂。',
    plannedInternalLinks: '/stay/ginzan-onsen/',
    relatedArticleIds: [],
    releaseMode: 'individual',
    authorizationMode: 'batch-standing-authorization',
    planningSpec: {
      pageSpecs: 'content-planning/stay/ginzan-onsen-page-specs.json',
      articleId: 'ginzan-onsen-ryokan',
    },
    keywordValidation: {
      provider: 'SERP observation',
      ahrefsVerified: false,
      serpIntentConfirmed: true,
      country: 'TW',
      auditedAt: '2026-10-15',
      decision: 'keep',
      query: '銀山溫泉 住宿',
      svDisplay: '300',
      record: 'content-planning/stay/ginzan-onsen-candidates.json',
    },
    bookingChannels: ['official', 'agoda'],
    factCheck: {
      lastVerifiedAt: '2026-10-15',
      nextReviewDue: '2027-10-15',
      sources: ['https://example.com/ryokan'],
    },
    ...overrides,
  }
}

function createBatch(overrides: AnyRecord = {}): AnyRecord {
  return {
    id: 'ginzan-onsen-2026-10',
    batchSchemaVersion: 1,
    contentTheme: 'ginzan-onsen',
    themeLabel: '銀山溫泉',
    categorySlug: 'stay',
    parentHubSlug: 'ginzan-onsen',
    parentHubId: 'hub-stay-ginzan-onsen',
    allowedPathPrefix: '/stay/ginzan-onsen/',
    planningSource: {
      pageSpecs: 'content-planning/stay/ginzan-onsen-page-specs.json',
      candidateRegistry: 'content-planning/stay/ginzan-onsen-candidates.json',
      planningCompletedAt: '2026-10-15',
      authorizedCount: 1,
      plannedPageCount: 1,
      countPolicy: 'validated-independent-pages-only',
      deferredItems: [],
    },
    standingAuthorization: {
      recordedAt: '2026-10-15',
      authorizedBy: 'Darren',
      decision: '核准銀山溫泉試點清單',
      scope: 'listed-items-only',
      autoPublish: true,
      indexable: true,
      researchMayFinalizeWorkingFields: true,
      finalizationLimits: {
        contentTheme: 'ginzan-onsen',
        allowedPathPrefix: '/stay/ginzan-onsen/',
        preserveTopicDirection: true,
        preserveContentBoundary: true,
        requireQueueTargetPath: true,
      },
    },
    publicationCadence: {
      timezone: 'Asia/Taipei',
      startDate: '2026-11-01',
      maxArticlesPerDay: 1,
      maxProductionUnitsPerRun: 1,
      productionUnitMode: 'individual',
    },
    parentHub: {
      id: 'hub-stay-ginzan-onsen',
      slug: 'ginzan-onsen',
      category: 'stay',
      publicationState: 'ready',
      noindexUntilFirstIndexableArticle: true,
      researchRecord: 'content-planning/stay/ginzan-onsen-research.json',
      title: '銀山溫泉',
      eyebrow: '銀山溫泉住宿指南',
      introduction: ['銀山溫泉的旅館、房型與訂房管道整理。'],
      checklist: ['訂房管道', '含餐與房型', '接駁與交通'],
      seoTitle: '銀山溫泉住宿指南',
      seoDescription: '整理銀山溫泉旅館的房型、含餐、接駁與訂房管道。',
      researchValidated: true,
    },
    readyChildHubs: [],
    hubLaunchGroups: [],
    items: [createItem()],
    ...overrides,
  }
}

function createQueue(batches: AnyRecord[] = [createBatch()]): AnyRecord {
  return {
    schemaVersion: 1,
    siteBaseUrl: 'https://japan-travel.example',
    selectionPolicy: 'queue-order-not-indexable-in-sanity',
    statusTracking: 'sanity-document-state',
    runLog: {path: 'content-automation/auto-publisher-run-log.md', updateEveryRun: true},
    publicationCadence: {
      timezone: 'Asia/Taipei',
      triggerIntervalHours: 4,
      maxProductionUnitsPerRun: 1,
      productionUnitMode: 'individual',
      lockStaleAfterHours: 12,
      maxArticlesPerDay: 1,
    },
    batches,
  }
}

test('repo 內的清單是通過驗證的空殼，分類代稱與分類樹一致', async () => {
  const queue = JSON.parse(await readFile(queuePath, 'utf8'))
  assert.deepEqual(validateArticleQueue(queue), [])
  assert.deepEqual(queue.batches, [])
  assert.deepEqual(CATEGORY_SLUGS, siteCategories.map((category) => category.slug))

  const result = spawnSync(process.execPath, ['scripts/validate-article-queue.mjs'], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /沒有任何已核准的批次/)
})

test('完整的批次通過驗證，生產順序依批次與 order', () => {
  const queue = createQueue()
  assert.deepEqual(validateArticleQueue(queue), [])
  assert.deepEqual(
    getProductionOrderedItems(queue).map((item) => item.articleId),
    ['ginzan-onsen-ryokan'],
  )
  assert.equal(findQueueItem(queue, 'ginzan-onsen-ryokan')?.targetPath, '/stay/ginzan-onsen/ryokan/')
})

test('清單只接受住宿、天氣季節、美食、交通四個分類', () => {
  const issues = validateArticleQueue(
    createQueue([createBatch({categorySlug: 'materials', parentHubId: 'hub-materials-ginzan-onsen', allowedPathPrefix: '/materials/ginzan-onsen/'})]),
  )
  assert.match(issues.join('\n'), /categorySlug 必須是 stay、weather、food、transport 之一/)
})

test('住宿文章必須有訂房管道與查核日期，下次重查是一年後', () => {
  assert.deepEqual(validateStayItem(createItem(), 'item'), [])
  assert.deepEqual(BOOKING_CHANNELS, ['official', 'trip.com', 'agoda', 'jalan-only'])

  const missingChannels = validateStayItem(createItem({bookingChannels: []}), 'item')
  assert.match(missingChannels.join('\n'), /bookingChannels 必須列出訂房管道/)

  const jalanMixed = validateStayItem(createItem({bookingChannels: ['jalan-only', 'agoda']}), 'item')
  assert.match(jalanMixed.join('\n'), /僅 Jalan 時不得同時列其他管道/)

  const wrongReview = validateStayItem(
    createItem({factCheck: {lastVerifiedAt: '2026-10-15', nextReviewDue: '2026-12-15', sources: ['https://example.com']}}),
    'item',
  )
  assert.match(wrongReview.join('\n'), /nextReviewDue 等於一年後/)

  const queueIssues = validateArticleQueue(
    createQueue([createBatch({items: [createItem({bookingChannels: undefined, factCheck: undefined})]})]),
  )
  assert.match(queueIssues.join('\n'), /bookingChannels/)
  assert.match(queueIssues.join('\n'), /factCheck/)
})

test('沒有連 Ahrefs 時不得標成 Ahrefs 已驗證，且要確認搜尋意圖是日本', () => {
  const fakeAhrefs = validateArticleQueue(
    createQueue([createBatch({items: [createItem({keywordValidation: {...createItem().keywordValidation, ahrefsVerified: true}})]})]),
  )
  assert.match(fakeAhrefs.join('\n'), /只有來源是 Ahrefs 時才能是 true/)

  const realAhrefs = validateArticleQueue(
    createQueue([createBatch({items: [createItem({keywordValidation: {...createItem().keywordValidation, provider: 'Ahrefs MCP', ahrefsVerified: true}})]})]),
  )
  assert.deepEqual(realAhrefs, [])

  const noIntent = validateArticleQueue(
    createQueue([createBatch({items: [createItem({keywordValidation: {...createItem().keywordValidation, serpIntentConfirmed: false}})]})]),
  )
  assert.match(noIntent.join('\n'), /serpIntentConfirmed/)
})

test('標題不得用冒號，網址必須與分類、Hub、slug 一致', () => {
  const issues = validateArticleQueue(
    createQueue([createBatch({items: [createItem({workingTitle: '銀山溫泉住宿：怎麼訂', targetPath: '/stay/ginzan-onsen/other/'})]})]),
  )
  assert.match(issues.join('\n'), /workingTitle 不得使用冒號/)
  assert.match(issues.join('\n'), /targetPath 與分類、Hub、slug 不一致/)
})

test('每日上限取批次與全站設定的較小值，批次開始前為 0', () => {
  const queue = createQueue([createBatch({publicationCadence: {...createBatch().publicationCadence, maxArticlesPerDay: 3}})])
  const item = findQueueItem(queue, 'ginzan-onsen-ryokan')
  assert.equal(getDailyPublicationLimitForItem(queue, item, '2026-11-02'), 1)
  assert.equal(getDailyPublicationLimitForItem(queue, item, '2026-10-20'), 0)

  const unlimited = createQueue([createBatch({publicationCadence: {...createBatch().publicationCadence, maxArticlesPerDay: null}})])
  unlimited.publicationCadence.maxArticlesPerDay = null
  assert.equal(getDailyPublicationLimitForItem(unlimited, findQueueItem(unlimited, 'ginzan-onsen-ryokan'), '2026-11-02'), Number.POSITIVE_INFINITY)
})

test('規劃紀錄與清單逐篇核對，查詢、網址或搜尋量不一致就擋下', async () => {
  const batch = createBatch()
  const pageSpecs = {
    status: 'planning-complete',
    items: [
      {
        articleId: 'ginzan-onsen-ryokan',
        decision: 'keep',
        primaryQuery: '銀山溫泉 住宿',
        targetPath: '/stay/ginzan-onsen/ryokan/',
        primaryHubId: 'hub-stay-ginzan-onsen',
        contentBoundary: '只寫銀山溫泉街區內的旅館，不含尾花澤市區飯店。',
        planningTitle: '銀山溫泉住宿怎麼訂，官網與 Agoda 能訂到的旅館',
        readerTaskContract: {primaryTask: '決定住哪一間、從哪裡訂。'},
      },
    ],
  }
  const candidateRegistry = {
    status: 'planning-complete',
    items: [
      {
        articleId: 'ginzan-onsen-ryokan',
        decision: 'keep',
        metricEvidence: {provider: 'SERP observation', checkedAt: '2026-10-15', query: '銀山溫泉 住宿', svDisplay: '300'},
      },
    ],
  }
  assert.deepEqual(validateBatchPlanningRecords(batch, {pageSpecs, candidateRegistry}), [])

  const changedQuery = structuredClone(pageSpecs)
  changedQuery.items[0].primaryQuery = '銀山溫泉 飯店'
  assert.match(
    validateBatchPlanningRecords(batch, {pageSpecs: changedQuery, candidateRegistry}).join('\n'),
    /主要查詢、網址、Hub、內容邊界、標題或讀者任務與頁面規格不一致/,
  )

  const changedVolume = structuredClone(candidateRegistry)
  changedVolume.items[0].metricEvidence.svDisplay = '900'
  assert.match(
    validateBatchPlanningRecords(batch, {pageSpecs, candidateRegistry: changedVolume}).join('\n'),
    /關鍵字證據不一致/,
  )

  const root = await mkdtemp(path.join(tmpdir(), 'japan-travel-queue-'))
  try {
    await mkdir(path.join(root, 'content-planning/stay'), {recursive: true})
    await mkdir(path.join(root, 'content-automation'), {recursive: true})
    await writeFile(path.join(root, batch.planningSource.pageSpecs), JSON.stringify(pageSpecs))
    await writeFile(path.join(root, batch.planningSource.candidateRegistry), JSON.stringify(candidateRegistry))
    const tempQueuePath = path.join(root, 'content-automation/article-queue.json')
    await writeFile(tempQueuePath, JSON.stringify(createQueue([batch])))
    const loaded = await loadArticleQueue(tempQueuePath, root)
    assert.equal(loaded.batches.length, 1)

    await writeFile(tempQueuePath, JSON.stringify(createQueue([createBatch({items: [createItem({primaryQuery: '銀山溫泉 飯店', primaryKeyword: '銀山溫泉 飯店'})]})])))
    await assert.rejects(loadArticleQueue(tempQueuePath, root), /文章自動化清單驗證失敗/)
  } finally {
    await rm(root, {recursive: true, force: true})
  }
})

test('Sanity 快照與文章封包必須和清單一致才能開放索引', () => {
  const queue = createQueue()
  const item = findQueueItem(queue, 'ginzan-onsen-ryokan')
  const snapshot = {
    articleId: 'article-ginzan-onsen-ryokan',
    slug: 'ryokan',
    authorId: 'author-editorial-team',
    primaryHubId: 'hub-stay-ginzan-onsen',
    sponsored: false,
    noindex: true,
    bodyCount: 12,
    title: '標題',
    excerpt: '摘要',
    publishedAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    seoTitle: 'SEO 標題',
    seoDescription: 'SEO 描述',
    cover: {assetId: 'image-1', width: 1600, height: 900, alt: '替代文字', caption: '圖說', credit: '署名'},
    hub: {id: 'hub-stay-ginzan-onsen', title: '銀山溫泉', slug: 'ginzan-onsen', categorySlug: 'stay'},
  }
  assert.equal(getArticlePathFromSnapshot(snapshot), '/stay/ginzan-onsen/ryokan/')
  assert.deepEqual(validateReleaseSnapshot(snapshot, item), [])
  assert.match(
    validateReleaseSnapshot({...snapshot, cover: {...snapshot.cover, width: 1200}}, item).join('\n'),
    /封面必須完成 1600×900/,
  )
  assert.match(validateReleaseSnapshot({...snapshot, sponsored: true}, item).join('\n'), /不接受業配/)

  const manifest = {
    articleId: 'ginzan-onsen-ryokan',
    targetUrl: '/stay/ginzan-onsen/ryokan/',
    primaryKeyword: '銀山溫泉 住宿',
    primaryQuery: '銀山溫泉 住宿',
    status: 'approved',
    planning: {
      source: 'content-automation/article-queue.json',
      recordId: 'ginzan-onsen-ryokan',
      status: 'keep',
      publicationAuthorization: 'authorized',
      authorizedAt: '2026-10-15',
      topicDirection: item.topicDirection,
      pageRole: item.pageRole,
      contentBoundary: item.contentBoundary,
      primaryHubId: item.primaryHubId,
    },
    approval: {
      mode: 'standing-authorization',
      queue: 'content-automation/article-queue.json',
      authorizedAt: '2026-10-15',
      approvedAt: '2026-10-15',
    },
  }
  assert.deepEqual(validateStandingApproval(manifest, queue, item), [])
  assert.match(
    validateStandingApproval({...manifest, targetUrl: '/stay/other/'}, queue, item).join('\n'),
    /文章封包網址與清單不一致/,
  )
})

test('執行鎖同一時間只給一個執行者，逾時才能接手', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'japan-travel-lock-'))
  const lockPath = path.join(root, 'auto-publisher.lock')
  try {
    const first = await acquireAutoPublisherLock({lockPath, staleAfterHours: 12, ownerLabel: 'first'})
    assert.equal(first.status, 'acquired')

    const second = await acquireAutoPublisherLock({lockPath, staleAfterHours: 12, ownerLabel: 'second'})
    assert.equal(second.status, 'busy')

    const later = new Date(Date.now() + 13 * 60 * 60 * 1000)
    const takeover = await acquireAutoPublisherLock({lockPath, staleAfterHours: 12, ownerLabel: 'third', now: later})
    assert.equal(takeover.status, 'acquired')
    assert.equal(takeover.owner?.replacedStaleOwner?.ownerLabel, 'first')

    assert.equal((await releaseAutoPublisherLock({lockPath, token: 'wrong'})).status, 'token-mismatch')
    assert.equal((await releaseAutoPublisherLock({lockPath, token: takeover.token})).status, 'released')
    assert.equal((await releaseAutoPublisherLock({lockPath, token: takeover.token})).status, 'missing')
  } finally {
    await rm(root, {recursive: true, force: true})
  }
})
