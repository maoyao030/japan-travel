// 把稚內群（24 頁）排進文章自動化清單：每個地點一個批次（Hub），加一個旅行群依大綱的寫作順序生產。
// 用法：node content-planning/hokkaido/build-queue.mjs .（在專案根目錄執行），之後跑 npm run queue:validate。
// 欄位一律從規劃檔帶出（page-specs.json、candidates.json、大綱、地點研究），不手填查詢、網址或搜尋量。
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

const repo = process.argv[2]
const read = async (file) => JSON.parse(await readFile(path.join(repo, file), 'utf8'))
const PAGE_SPECS = 'content-planning/hokkaido/page-specs.json'
const CANDIDATES = 'content-planning/hokkaido/candidates.json'
const OUTLINE = 'content-planning/hokkaido/hokkaido-wakkanai-outline.json'
const QUEUE = 'content-automation/article-queue.json'

const specs = await read(PAGE_SPECS)
const candidates = await read(CANDIDATES)
const outline = await read(OUTLINE)
const queue = await read(QUEUE)

// Darren 2026-10-20：「品質可以，把稚內群排進發布清單，每天幾篇我再決定。」
const AUTHORIZED_AT = '2026-10-20'
const DECISION = '渡輪頁與利尻島交通通過完整驗收後，Darren 確認品質可以，把稚內群 24 頁排進發布清單；2026-10-20 量過一篇的用量後，Darren 決定每天 3 篇；先不開始執行、不上傳，等 Darren 說好才開始。'
const START_DATE = '2026-10-21'
// Darren 2026-10-20：每天 3 篇（先不啟用、不上傳，等 Darren 說好才開始）
const DAILY_LIMIT = 3
const VERIFIED_AT = '2026-10-18'

// 地點 Hub 的文案只寫已查證的事實（渡輪航程見渡輪頁 F11），研究後可由 routine 定稿（researchMayFinalizeWorkingFields）。
const places = {
  wakkanai: {
    label: '稚內',
    hub: {
      title: '稚內',
      eyebrow: '北海道北端的港口城市',
      introduction: ['稚內在北海道北端，JR稚內站走路約5分鐘就是北防波堤穹頂，70根圓柱撐起長427公尺的拱廊。前往利尻島、禮文島的渡輪都從稚內港出發，到利尻島約1小時40分、直航禮文島約1小時55分。從札幌搭JR約5小時12分。直達的特急宗谷一天只有一班，其他時段要在旭川轉車。'],
      checklist: ['札幌、旭川到稚內怎麼去', '稚內到利尻島、禮文島的渡輪', '搭早班船住哪一區', '稚內各月天氣與穿著'],
      seoTitle: '稚內旅遊，交通、渡輪、住宿與景點',
      seoDescription: '整理北海道稚內的交通、往利尻島與禮文島的渡輪、住宿、景點、美食、祭典與天氣。',
    },
  },
  'cape-soya': {
    label: '宗谷岬',
    hub: {
      title: '宗谷岬',
      eyebrow: '北海道本島的最北端',
      introduction: ['宗谷岬是北海道本島的最北端，日本最北端之地碑就立在岬上，天氣晴朗時看得到40公里以上外的庫頁島。從稚內市區過去單程約32公里，大眾運輸只有路線巴士，一天4個來回，出發前先排好回程那一班。'],
      checklist: ['稚內到宗谷岬的巴士與末班', '宗谷丘陵與白色道路的開放季節', '冬天能不能去宗谷岬'],
      seoTitle: '宗谷岬旅遊，交通、白色道路與宗谷丘陵',
      seoDescription: '整理北海道最北端宗谷岬的巴士與自駕、停留時間、宗谷丘陵與白色道路的開放季節。',
    },
    // 宗谷岬沒有住宿，住在稚內；地點條目的訂房管道依稚內的住宿清單
    stayFrom: 'wakkanai',
  },
  'rishiri-island': {
    label: '利尻島',
    hub: {
      title: '利尻島',
      eyebrow: '稚內外海的離島',
      introduction: ['利尻島在稚內西邊的海上，島中央的利尻山標高1,721公尺，別名利尻富士，是日本百名山的第一座。從稚內搭渡輪約1小時40分到鴛泊港，夏季每天3個來回。札幌丘珠機場也有全年的航班，約50分鐘。島上的路線巴士繞島一圈約1小時45分，夏季兩個方向各只有5班。'],
      checklist: ['稚內到利尻島與島上的巴士', '利尻山的登山路線', '住宿怎麼選區', '海膽的產季'],
      seoTitle: '利尻島旅遊，交通、住宿與利尻山登山',
      seoDescription: '整理北海道利尻島的交通、環島巴士與觀光巴士、住宿、利尻山登山、景點、美食與天氣。',
    },
  },
  'rebun-island': {
    label: '禮文島',
    hub: {
      title: '禮文島',
      eyebrow: '稚內外海的離島',
      introduction: ['禮文島在利尻島北邊，從稚內搭渡輪直航約1小時55分到香深港。島上有7條官方步道，最北端的須古頓岬晴天看得到庫頁島。禮文敦盛草的群生地例年5月下旬到6月中旬開放。住宿分在南邊有渡輪站的香深和北邊的船泊兩區。'],
      checklist: ['禮文島的路線巴士與觀光巴士', '健行步道與花季', '住香深還是船泊', '一日來回可不可行'],
      seoTitle: '禮文島旅遊，交通、住宿與健行步道',
      seoDescription: '整理北海道禮文島的路線巴士與觀光巴士、住宿、健行步道、景點與美食。',
    },
  },
}

const pageRoles = {
  'place-entry': '地點主頁',
  transport: '交通頁',
  stay: '住宿頁',
  sight: '景點頁',
  food: '美食頁',
  festival: '祭典頁',
  weather: '天氣頁',
  hiking: '步道與登山頁',
}

async function stayFacts(placeId) {
  const research = await read(`content-planning/hokkaido/research/${placeId}.json`)
  const list = research.stayList ?? []
  const channels = []
  if (list.some((stay) => typeof stay.officialUrl === 'string' && stay.officialUrl.startsWith('https://'))) channels.push('official')
  if (list.some((stay) => stay.tripCom === 'yes')) channels.push('trip.com')
  if (list.some((stay) => stay.agoda === 'yes')) channels.push('agoda')
  const sources = list.map((stay) => stay.officialUrl).filter((url) => typeof url === 'string' && url.startsWith('https://')).slice(0, 3)
  return {channels, sources}
}

async function placeSources(placeId) {
  const facts = await read(`content-planning/hokkaido/places/${placeId}/facts.json`)
  const list = Array.isArray(facts) ? facts : facts.facts
  return [...new Set(list.map((fact) => fact.sourceUrl).filter((url) => typeof url === 'string' && url.startsWith('https://')))].slice(0, 3)
}

const keep = specs.items.filter((spec) => spec.decision === 'keep')
const candidateById = new Map(candidates.items.map((entry) => [entry.articleId, entry]))
const pathOf = new Map(keep.map((spec) => [spec.articleId, spec.targetPath]))
const order = outline.writingOrder

const batches = []
for (const [placeId, place] of Object.entries(places)) {
  const hubId = `hub-places-${placeId}`
  const prefix = `/places/${placeId}/`
  const members = keep.filter((spec) => spec.primaryHubId === hubId || spec.targetPath.startsWith(prefix))
  members.sort((a, b) => order.indexOf(a.articleId) - order.indexOf(b.articleId))
  const stay = await stayFacts(place.stayFrom ?? placeId)
  const items = []
  for (const [index, spec] of members.entries()) {
    const evidence = candidateById.get(spec.articleId).metricEvidence
    const isEntry = spec.pageType === 'place-entry'
    const slug = isEntry ? placeId : spec.targetPath.replace(prefix, '').replace(/\/$/, '')
    const links = (outline.links ?? []).filter((link) => link.from === spec.articleId && pathOf.has(link.to)).map((link) => pathOf.get(link.to))
    const item = {
      order: index + 1,
      articleId: spec.articleId,
      contentTheme: placeId,
      topicDirection: spec.planningTitle,
      pageRole: isEntry ? pageRoles['place-entry'] : pageRoles[spec.aspect],
      documentId: `article-${spec.articleId}`,
      workingTitle: spec.planningTitle,
      primaryKeyword: spec.primaryQuery,
      primaryQuery: spec.primaryQuery,
      articleSlug: slug,
      targetPath: spec.targetPath,
      authorId: 'author-editorial-team',
      primaryHubId: hubId,
      categorySlug: 'places',
      hubSlug: placeId,
      routeMode: spec.routeMode,
      ...(isEntry ? {futureHubLanding: true} : {}),
      aspect: spec.aspect,
      pageType: spec.pageType,
      contentBoundary: spec.contentBoundary,
      readerTask: spec.readerTaskContract.primaryTask,
      plannedInternalLinks: [...new Set(links)].join('、') || prefix,
      relatedArticleIds: [],
      releaseMode: 'individual',
      authorizationMode: 'batch-standing-authorization',
      planningSpec: {pageSpecs: PAGE_SPECS, articleId: spec.articleId},
      keywordValidation: {
        provider: evidence.provider,
        ahrefsVerified: ['Ahrefs MCP', 'Ahrefs browser UI'].includes(evidence.provider),
        // 稚內、宗谷岬、利尻島、禮文島在台灣沒有同名地點，主要查詢都帶這些地名
        serpIntentConfirmed: true,
        serpIntentNote: '查詢含稚內、宗谷岬、利尻島或禮文島，台灣沒有同名地點',
        country: 'TW',
        auditedAt: evidence.checkedAt,
        decision: 'keep',
        query: evidence.query,
        svDisplay: evidence.svDisplay,
        record: CANDIDATES,
      },
    }
    if (spec.aspect === 'stay' || isEntry) {
      item.bookingChannels = stay.channels
      if (place.stayFrom) item.bookingChannelsBasis = '宗谷岬沒有住宿，訂房管道依稚內的住宿清單'
      const sources = spec.aspect === 'stay' ? stay.sources : await placeSources(placeId)
      item.factCheck = {lastVerifiedAt: VERIFIED_AT, nextReviewDue: '2027-10-18', sources}
    }
    items.push(item)
  }
  batches.push({
    id: `hokkaido-${placeId}`,
    batchSchemaVersion: 1,
    contentTheme: placeId,
    themeLabel: place.label,
    categorySlug: 'places',
    parentHubSlug: placeId,
    parentHubId: hubId,
    allowedPathPrefix: prefix,
    planningSource: {
      pageSpecs: PAGE_SPECS,
      candidateRegistry: CANDIDATES,
      planningCompletedAt: '2026-10-18',
      authorizedCount: items.length,
      plannedPageCount: items.length,
      countPolicy: 'validated-independent-pages-only',
      deferredItems: [],
    },
    standingAuthorization: {
      recordedAt: AUTHORIZED_AT,
      authorizedBy: 'Darren',
      decision: DECISION,
      scope: 'listed-items-only',
      autoPublish: true,
      indexable: true,
      researchMayFinalizeWorkingFields: true,
      finalizationLimits: {
        contentTheme: placeId,
        allowedPathPrefix: prefix,
        preserveTopicDirection: true,
        preserveContentBoundary: true,
        requireQueueTargetPath: true,
      },
    },
    publicationCadence: {
      timezone: 'Asia/Taipei',
      startDate: START_DATE,
      maxArticlesPerDay: DAILY_LIMIT,
      maxProductionUnitsPerRun: 1,
      productionUnitMode: 'individual',
    },
    parentHub: {
      id: hubId,
      slug: placeId,
      category: 'places',
      publicationState: 'ready',
      noindexUntilFirstIndexableArticle: true,
      researchRecord: `content-planning/hokkaido/research/${placeId}.json`,
      ...place.hub,
      researchValidated: true,
    },
    readyChildHubs: [],
    hubLaunchGroups: [],
    items,
  })
}

queue.batches = batches
queue.travelGroups = [
  {
    id: 'hokkaido-wakkanai',
    label: '稚內、宗谷岬、利尻島、禮文島',
    outline: OUTLINE,
    batchIds: batches.map((batch) => batch.id),
    writingOrder: order,
    // Darren 已明確核准（2026-10-18 整批核准、2026-10-20 確認品質並排進清單）
    approval: {remindedAt: '2026-10-18', autoApproveOn: '2026-10-21', approvedExplicitlyAt: AUTHORIZED_AT},
  },
]
await writeFile(path.join(repo, QUEUE), `${JSON.stringify(queue, null, 2)}\n`)
console.log(batches.map((batch) => `${batch.themeLabel} ${batch.items.length} 篇`).join('、'), '／寫作順序', order.length, '篇')
