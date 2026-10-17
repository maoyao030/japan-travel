// 文章清單測試共用的資料。
type AnyRecord = Record<string, any>

export function createItem(overrides: AnyRecord = {}): AnyRecord {
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
    targetPath: '/places/ginzan-onsen/ryokan/',
    authorId: 'author-editorial-team',
    primaryHubId: 'hub-places-ginzan-onsen',
    categorySlug: 'places',
    hubSlug: 'ginzan-onsen',
    routeMode: 'parent-direct-article',
    aspect: 'stay',
    pageType: 'aspect-page',
    contentBoundary: '只寫銀山溫泉街區內的旅館，不含尾花澤市區飯店。',
    readerTask: '決定住哪一間、從哪裡訂。',
    plannedInternalLinks: '/places/ginzan-onsen/',
    relatedArticleIds: [],
    releaseMode: 'individual',
    authorizationMode: 'batch-standing-authorization',
    planningSpec: {
      pageSpecs: 'content-planning/yamagata/ginzan-onsen-page-specs.json',
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
      record: 'content-planning/yamagata/ginzan-onsen-candidates.json',
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

export function createBatch(overrides: AnyRecord = {}): AnyRecord {
  return {
    id: 'ginzan-onsen-2026-10',
    batchSchemaVersion: 1,
    contentTheme: 'ginzan-onsen',
    themeLabel: '銀山溫泉',
    categorySlug: 'places',
    parentHubSlug: 'ginzan-onsen',
    parentHubId: 'hub-places-ginzan-onsen',
    allowedPathPrefix: '/places/ginzan-onsen/',
    planningSource: {
      pageSpecs: 'content-planning/yamagata/ginzan-onsen-page-specs.json',
      candidateRegistry: 'content-planning/yamagata/ginzan-onsen-candidates.json',
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
        allowedPathPrefix: '/places/ginzan-onsen/',
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
      id: 'hub-places-ginzan-onsen',
      slug: 'ginzan-onsen',
      category: 'places',
      publicationState: 'ready',
      noindexUntilFirstIndexableArticle: true,
      researchRecord: 'content-planning/yamagata/ginzan-onsen-research.json',
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

export function createQueue(batches: AnyRecord[] = [createBatch()]): AnyRecord {
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

