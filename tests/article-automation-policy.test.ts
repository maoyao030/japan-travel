import assert from 'node:assert/strict'
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import test from 'node:test'

import {
  BOOKING_CHANNELS,
  CATEGORY_SLUGS,
  decideHubLandingAction,
  findQueueItem,
  getArticlePathFromSnapshot,
  getDailyPublicationLimitForItem,
  getItemTravelGroup,
  getProductionOrderedItems,
  validateTravelGroups,
  loadArticleQueue,
  validateArticleQueue,
  validateBatchPlanningRecords,
  validateReleaseSnapshot,
  validateStandingApproval,
  validateStayItem,
} from '../scripts/article-automation-policy.mjs'
import {siteCategories} from '../src/data/categories.ts'
import {createBatch, createItem, createQueue} from './fixtures/queue.ts'

const projectRoot = path.resolve(import.meta.dirname, '..')
const queuePath = path.join(projectRoot, 'content-automation/article-queue.json')

type AnyRecord = Record<string, any>

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
  assert.equal(findQueueItem(queue, 'ginzan-onsen-ryokan')?.targetPath, '/places/ginzan-onsen/ryokan/')
})

test('清單只接受地點、季節、神社與祭典、旅行教學四個分類', () => {
  const issues = validateArticleQueue(
    createQueue([createBatch({categorySlug: 'materials', parentHubId: 'hub-materials-ginzan-onsen', allowedPathPrefix: '/materials/ginzan-onsen/'})]),
  )
  assert.match(issues.join('\n'), /categorySlug 必須是 places、seasons、shrines、guides 之一/)
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
    createQueue([createBatch({items: [createItem({workingTitle: '銀山溫泉住宿：怎麼訂', targetPath: '/places/ginzan-onsen/other/'})]})]),
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
        targetPath: '/places/ginzan-onsen/ryokan/',
        primaryHubId: 'hub-places-ginzan-onsen',
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
    await mkdir(path.join(root, 'content-planning/yamagata'), {recursive: true})
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
    primaryHubId: 'hub-places-ginzan-onsen',
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
    hub: {id: 'hub-places-ginzan-onsen', title: '銀山溫泉', slug: 'ginzan-onsen', categorySlug: 'places'},
  }
  assert.equal(getArticlePathFromSnapshot(snapshot), '/places/ginzan-onsen/ryokan/')
  assert.deepEqual(validateReleaseSnapshot(snapshot, item), [])
  assert.match(
    validateReleaseSnapshot({...snapshot, cover: {...snapshot.cover, width: 1200}}, item).join('\n'),
    /封面必須完成 1600×900/,
  )
  assert.match(validateReleaseSnapshot({...snapshot, sponsored: true}, item).join('\n'), /不接受業配/)

  const manifest = {
    articleId: 'ginzan-onsen-ryokan',
    targetUrl: '/places/ginzan-onsen/ryokan/',
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
    validateStandingApproval({...manifest, targetUrl: '/places/other/'}, queue, item).join('\n'),
    /文章封包網址與清單不一致/,
  )
})

function placeEntryItem(overrides: AnyRecord = {}): AnyRecord {
  return createItem({
    articleId: 'ginzan-onsen',
    documentId: 'article-ginzan-onsen',
    articleSlug: 'ginzan-onsen',
    targetPath: '/places/ginzan-onsen/',
    routeMode: 'hub-landing',
    futureHubLanding: true,
    aspect: 'other',
    pageType: 'place-entry',
    planningSpec: {pageSpecs: 'content-planning/yamagata/ginzan-onsen-page-specs.json', articleId: 'ginzan-onsen'},
    ...overrides,
  })
}

test('地點條目是地點 Hub 的入口文章，也要有訂房管道與查核日期', () => {
  const issues = validateArticleQueue(createQueue([createBatch({items: [placeEntryItem()]})]))
  assert.doesNotMatch(issues.join('\n'), /routeMode|地點條目|Hub 入口文章|targetPath/)

  const noBooking = validateArticleQueue(
    createQueue([createBatch({items: [placeEntryItem({bookingChannels: undefined})]})]),
  )
  assert.match(noBooking.join('\n'), /bookingChannels/)

  const notLanding = validateArticleQueue(
    createQueue([createBatch({items: [placeEntryItem({routeMode: 'parent-direct-article', targetPath: '/places/ginzan-onsen/ginzan-onsen/'})]})]),
  )
  assert.match(notLanding.join('\n'), /地點條目必須是地點分類的 Hub 入口文章/)

  const noAspect = validateArticleQueue(createQueue([createBatch({items: [createItem({aspect: undefined})]})]))
  assert.match(noAspect.join('\n'), /aspect 必須是/)

  const food = validateArticleQueue(
    createQueue([createBatch({items: [createItem({aspect: 'food', bookingChannels: undefined, factCheck: undefined})]})]),
  )
  assert.doesNotMatch(food.join('\n'), /bookingChannels/)
})

test('地點主頁暫存後要掛成父 Hub 的入口文章，網址才會是 Hub 網址', () => {
  const batch = createBatch({items: [placeEntryItem()]})
  const hub = {_id: 'hub-places-ginzan-onsen', landingArticleId: null}
  const article = {_type: 'article', slug: 'ginzan-onsen', primaryHubId: 'hub-places-ginzan-onsen', bodyCount: 8}
  assert.deepEqual(decideHubLandingAction({batch, hub, article}), {action: 'set-landing', articleId: 'article-ginzan-onsen'})
  assert.equal(decideHubLandingAction({batch, hub: {...hub, landingArticleId: 'article-ginzan-onsen'}, article}).action, 'landing-already-set')
  assert.equal(decideHubLandingAction({batch, hub: {...hub, landingArticleId: 'article-other'}, article}).action, 'blocked-landing-conflict')
  assert.equal(decideHubLandingAction({batch, hub, article, articleDraftExists: true}).action, 'blocked-article-draft')
  assert.equal(decideHubLandingAction({batch, hub, article: null}).action, 'blocked-article-not-staged')
  assert.equal(decideHubLandingAction({batch, hub, article: {...article, primaryHubId: 'hub-x'}}).action, 'blocked-article-not-staged')
  assert.equal(decideHubLandingAction({batch, hub: null, article}).action, 'blocked-hub-missing')
  assert.equal(decideHubLandingAction({batch: createBatch(), hub, article}).action, 'blocked-no-landing-item')

  const snapshot = {
    articleId: 'article-ginzan-onsen',
    slug: 'ginzan-onsen',
    hub: {id: 'hub-places-ginzan-onsen', slug: 'ginzan-onsen', categorySlug: 'places', landingArticleId: null},
  }
  assert.equal(getArticlePathFromSnapshot(snapshot), '/places/ginzan-onsen/ginzan-onsen/')
  assert.equal(
    getArticlePathFromSnapshot({...snapshot, hub: {...snapshot.hub, landingArticleId: 'article-ginzan-onsen'}}),
    '/places/ginzan-onsen/',
  )
})

test('地點分類不使用子 Hub', () => {
  const issues = validateArticleQueue(
    createQueue([
      createBatch({
        items: [
          createItem({
            routeMode: 'child-hub-article',
            primaryHubId: 'hub-places-ginzan-onsen-ryokan',
            hubSlug: 'ryokan',
            parentHubSlug: 'ginzan-onsen',
            targetPath: '/places/ginzan-onsen/ryokan-ryokan/',
          }),
        ],
      }),
    ]),
  )
  assert.match(issues.join('\n'), /地點分類不使用子 Hub/)
})

function guideBatch(): AnyRecord {
  const base = createBatch()
  return createBatch({
    id: 'ferry-booking-guide',
    contentTheme: 'ferry-booking',
    themeLabel: '渡輪訂票教學',
    categorySlug: 'guides',
    parentHubSlug: 'ferry-booking',
    parentHubId: 'hub-guides-ferry-booking',
    allowedPathPrefix: '/guides/ferry-booking/',
    standingAuthorization: {
      ...base.standingAuthorization,
      finalizationLimits: {...base.standingAuthorization.finalizationLimits, contentTheme: 'ferry-booking', allowedPathPrefix: '/guides/ferry-booking/'},
    },
    parentHub: {...base.parentHub, id: 'hub-guides-ferry-booking', slug: 'ferry-booking', category: 'guides'},
    items: [
      createItem({
        articleId: 'ferry-booking',
        documentId: 'article-ferry-booking',
        contentTheme: 'ferry-booking',
        articleSlug: 'ferry-booking',
        hubSlug: 'ferry-booking',
        targetPath: '/guides/ferry-booking/',
        primaryHubId: 'hub-guides-ferry-booking',
        categorySlug: 'guides',
        routeMode: 'hub-landing',
        futureHubLanding: true,
        aspect: 'transport',
        pageType: 'shared-guide',
        planningSpec: {pageSpecs: 'content-planning/yamagata/ginzan-onsen-page-specs.json', articleId: 'ferry-booking'},
        keywordValidation: {...createItem().keywordValidation, provider: 'Google autocomplete'},
      }),
    ],
  })
}

function groupedQueue(groupOverrides: AnyRecord = {}): AnyRecord {
  const queue = createQueue([createBatch(), guideBatch()])
  queue.travelGroups = [
    {
      id: 'yamagata-ginzan',
      label: '銀山溫泉群',
      outline: 'content-planning/yamagata/ginzan-outline.json',
      batchIds: ['ginzan-onsen-2026-10', 'ferry-booking-guide'],
      writingOrder: ['ferry-booking', 'ginzan-onsen-ryokan'],
      approval: {remindedAt: '2026-10-17', autoApproveOn: '2026-10-24'},
      ...groupOverrides,
    },
  ]
  return queue
}

test('旅行群可以跨多個 Hub，生產順序依群的寫作順序', () => {
  const queue = groupedQueue()
  assert.deepEqual(validateArticleQueue(queue), [])
  assert.deepEqual(
    getProductionOrderedItems(queue).map((item) => item.articleId),
    ['ferry-booking', 'ginzan-onsen-ryokan'],
  )
  assert.equal(getItemTravelGroup(queue, findQueueItem(queue, 'ginzan-onsen-ryokan'))?.id, 'yamagata-ginzan')
})

test('旅行群的寫作順序要剛好涵蓋成員批次，自動核准日至少在提醒後 3 天', () => {
  assert.match(validateTravelGroups(groupedQueue({writingOrder: ['ferry-booking']})).join('\n'), /writingOrder 缺少：ginzan-onsen-ryokan/)
  assert.match(
    validateTravelGroups(groupedQueue({writingOrder: ['ferry-booking', 'ginzan-onsen-ryokan', 'other']})).join('\n'),
    /不屬於本群的文章：other/,
  )
  assert.match(
    validateTravelGroups(groupedQueue({approval: {remindedAt: '2026-10-17', autoApproveOn: '2026-10-19'}})).join('\n'),
    /至少要在提醒後 3 天/,
  )
  const twoGroups = groupedQueue()
  twoGroups.travelGroups.push({...twoGroups.travelGroups[0], id: 'other-group'})
  assert.match(validateTravelGroups(twoGroups).join('\n'), /已經屬於別的旅行群/)
})

test('同一份規格涵蓋多個 Hub 時，規劃頁數只數屬於本批的保留頁', () => {
  const batch = createBatch()
  const specItem = {
    articleId: 'ginzan-onsen-ryokan',
    decision: 'keep',
    primaryQuery: '銀山溫泉 住宿',
    targetPath: '/places/ginzan-onsen/ryokan/',
    primaryHubId: 'hub-places-ginzan-onsen',
    contentBoundary: '只寫銀山溫泉街區內的旅館，不含尾花澤市區飯店。',
    planningTitle: '銀山溫泉住宿怎麼訂，官網與 Agoda 能訂到的旅館',
    readerTaskContract: {primaryTask: '決定住哪一間、從哪裡訂。'},
  }
  const pageSpecs = {
    status: 'planning-complete',
    items: [
      specItem,
      {...specItem, articleId: 'ferry-booking', targetPath: '/guides/ferry-booking/', primaryHubId: 'hub-guides-ferry-booking'},
      {...specItem, articleId: 'ginzan-onsen-food', targetPath: '/places/ginzan-onsen/food/', decision: 'merge'},
    ],
  }
  const candidateRegistry = {
    status: 'planning-complete',
    items: [
      {articleId: 'ginzan-onsen-ryokan', decision: 'keep', metricEvidence: {provider: 'SERP observation', checkedAt: '2026-10-15', query: '銀山溫泉 住宿', svDisplay: '300'}},
    ],
  }
  assert.deepEqual(validateBatchPlanningRecords(batch, {pageSpecs, candidateRegistry}), [])
})

test('自動化流程還不支援子 Hub', () => {
  const batch = createBatch({categorySlug: 'guides', parentHubId: 'hub-guides-ginzan-onsen', allowedPathPrefix: '/guides/ginzan-onsen/'})
  const issues = validateArticleQueue(createQueue([{...batch, items: [createItem({categorySlug: 'guides', routeMode: 'child-hub-article', parentHubSlug: 'ginzan-onsen'})]}]))
  assert.match(issues.join('\n'), /還不支援子 Hub/)
})
