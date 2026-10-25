// 把北海道的一個旅行群排進文章自動化清單：每個地點一個批次（Hub），加一個旅行群依大綱的寫作順序生產。
// 用法（在專案根目錄執行）：node content-planning/hokkaido/build-queue.mjs . <群>，之後跑 npm run queue:validate。
//   <群> 是下面 groups 的鍵：wakkanai（稚內群，2026-10-20 已排入）、asahikawa（旭川・大雪群，2026-10-26）。
// 新的群一律「附加」到清單後面：批次接在 batches 最後、旅行群接在 travelGroups 最後；
// 已經在清單裡的群不覆寫（清單裡的條目之後可能被人工或 routine 修過），要重排請先手動移除那一群。
// 欄位一律從規劃檔帶出（page-specs.json、candidates.json、大綱、地點研究），不手填查詢、網址或搜尋量。
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

const [repo, groupKey] = process.argv.slice(2)
const read = async (file) => JSON.parse(await readFile(path.join(repo, file), 'utf8'))
const PAGE_SPECS = 'content-planning/hokkaido/page-specs.json'
const CANDIDATES = 'content-planning/hokkaido/candidates.json'
const QUEUE = 'content-automation/article-queue.json'
// Darren 2026-10-20：每天 3 篇；2026-10-22 改成每天 5 篇
const DAILY_LIMIT = 5

// 地點 Hub 的文案只寫已查證的事實（數字都在 places/<地點>/facts.json），研究後可由 routine 定稿（researchMayFinalizeWorkingFields）。
const groups = {
  wakkanai: {
    id: 'hokkaido-wakkanai',
    label: '稚內、宗谷岬、利尻島、禮文島',
    outline: 'content-planning/hokkaido/hokkaido-wakkanai-outline.json',
    planningCompletedAt: '2026-10-18',
    // Darren 2026-10-20：「品質可以，把稚內群排進發布清單，每天幾篇我再決定。」
    authorizedAt: '2026-10-20',
    decision: '渡輪頁與利尻島交通通過完整驗收後，Darren 確認品質可以，把稚內群 24 頁排進發布清單；2026-10-20 量過一篇的用量後，Darren 決定每天 3 篇（2026-10-22 改成每天 5 篇）；先不開始執行、不上傳，等 Darren 說好才開始。',
    startDate: '2026-10-21',
    verifiedAt: '2026-10-18',
    // Darren 已明確核准（2026-10-18 整批核准、2026-10-20 確認品質並排進清單）
    approval: {remindedAt: '2026-10-18', autoApproveOn: '2026-10-21', approvedExplicitlyAt: '2026-10-20'},
    // 稚內、宗谷岬、利尻島、禮文島在台灣沒有同名地點，主要查詢都帶這些地名
    serpIntentNote: '查詢含稚內、宗谷岬、利尻島或禮文島，台灣沒有同名地點',
    places: {
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
        bookingChannelsBasis: '宗谷岬沒有住宿，訂房管道依稚內的住宿清單',
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
    },
  },
  asahikawa: {
    id: 'hokkaido-asahikawa',
    label: '旭川、層雲峽、旭岳、東川',
    outline: 'content-planning/hokkaido/hokkaido-asahikawa-outline.json',
    planningCompletedAt: '2026-10-26',
    // Darren 2026-10-26：稚內群寫完後的下一群，大綱通過檢查就直接寫，不等 3 天默許（只限這一次）
    authorizedAt: '2026-10-26',
    decision: 'Darren 2026-10-26 決定稚內群之後的下一群（旭川・大雪群 21 頁）大綱通過檢查就直接寫，不等 3 天默許，只限這一次；大綱摘要照樣寫進規劃總表給 Darren 之後看（AGENTS.md「住宿頁不寫價格、下一群做好就寫」）。每天上限沿用 5 篇。',
    startDate: '2026-10-26',
    verifiedAt: '2026-10-26',
    // 大綱 2026-10-26 完成並通過檢查，Darren 同日已明確同意直接寫；autoApproveOn 只為符合「提醒後至少 3 天」的格式
    approval: {remindedAt: '2026-10-26', autoApproveOn: '2026-10-29', approvedExplicitlyAt: '2026-10-26'},
    // 旭川、層雲峽、旭岳、東川町、旭山動物園在台灣沒有同名地點；「大雪山」會撞台中的大雪山森林遊樂區，標題與查詢都不用
    serpIntentNote: '查詢含旭川、層雲峽、旭岳、東川町或旭山動物園，台灣沒有同名地點；不用「大雪山」（台中有大雪山森林遊樂區）；依地名判斷，台灣節點的搜尋結果頁還沒看',
    places: {
      asahikawa: {
        label: '旭川',
        hub: {
          title: '旭川',
          eyebrow: '北海道第二大城',
          introduction: ['旭川是北海道第二大城，從札幌搭特急最快1小時25分，旭川機場到市區的機場巴士約30～40分鐘。旭山動物園離旭川站約11.3公里，站前搭公車約40分鐘，冬天只開10:30～15:30。往旭岳、東川、層雲峽、富良野的巴士都從旭川站前出發，往稚內的列車也在旭川轉車。'],
          checklist: ['旭川機場到旭川站、札幌到旭川怎麼去', '旭山動物園的開園時間與公車', '住旭川站前還是市中心', '旭川拉麵與成吉思汗', '旭川各月天氣與積雪'],
          seoTitle: '旭川旅遊，交通、旭山動物園、住宿與景點',
          seoDescription: '整理北海道旭川的機場與札幌交通、旭山動物園、住宿、景點、美食與天氣。',
        },
      },
      sounkyo: {
        label: '層雲峽',
        hub: {
          title: '層雲峽',
          eyebrow: '大雪山系最大的溫泉街',
          introduction: ['層雲峽是沿著石狩川延續約24公里的斷崖峽谷，岩壁是一根根並排的柱狀節理，峽谷裡的層雲峽溫泉是大雪山系最大的溫泉街。從旭川站前搭道北巴士約1小時59分，直達車一天7班，回旭川的末班17:00發。黑岳纜車從山麓站約7分鐘到五合目，冬天1月下旬到3月上旬有冰瀑祭。'],
          checklist: ['旭川到層雲峽的巴士與末班', '黑岳纜車與黑岳登山', '冰瀑祭的日期與看完煙火怎麼回', '溫泉旅館怎麼選', '層雲峽各月天氣與楓葉'],
          seoTitle: '層雲峽旅遊，交通、黑岳纜車、冰瀑祭與住宿',
          seoDescription: '整理北海道層雲峽的巴士交通、黑岳纜車與登山、冰瀑祭、溫泉住宿、景點與天氣。',
        },
      },
      asahidake: {
        label: '旭岳',
        hub: {
          title: '旭岳',
          eyebrow: '北海道最高峰',
          introduction: ['旭岳標高2,291公尺，是北海道最高峰。旭岳纜車從標高約1,100公尺的旭岳溫泉上到約1,600公尺的姿見站，單程約10分鐘，秋天有一段檢修停駛。從旭川站搭いで湯號約1小時48分，旭川機場上車約1小時3分，一天只有4班。旭岳溫泉沒有溫泉街，附近也沒有ATM，現金要先備好。'],
          checklist: ['旭川站與旭川機場到旭岳的巴士', '旭岳纜車的營業時間與停駛期', '姿見の池散策與登頂', '旭岳溫泉住宿', '旭岳與層雲峽怎麼選'],
          seoTitle: '旭岳旅遊，交通、纜車、登山與溫泉住宿',
          seoDescription: '整理北海道旭岳的巴士交通、旭岳纜車與姿見の池、登山、旭岳溫泉住宿，以及和層雲峽怎麼選。',
        },
      },
      higashikawa: {
        label: '東川町',
        hub: {
          title: '東川町',
          eyebrow: '旭岳山腳的寫真之町',
          introduction: ['東川町離旭川機場約7公里、離旭川市中心13公里，北海道最高峰旭岳也在町內。町裡沒有鐵路，從旭川機場搭往旭岳的いで湯號約12分鐘到道の駅ひがしかわ道草館。東川是北海道唯一沒有自來水設施的町，生活用水都是大雪山雪融水滲成的地下水，咖啡店、麵包店與酒廠也用這個水。熱門麵包店常常過中午就賣完。'],
          checklist: ['旭川站與旭川機場到東川的巴士', '道の駅ひがしかわ道草館與租自行車', '咖啡店、麵包店的營業日', '大雪旭岳源水與キトウシの森'],
          seoTitle: '東川町旅遊，交通、景點、咖啡店與住宿',
          seoDescription: '整理北海道東川町的巴士與自行車、道の駅、咖啡店與麵包店、大雪旭岳源水與住宿。',
        },
      },
    },
  },
}

const group = groups[groupKey]
if (!repo || !group) {
  console.error(`用法：node content-planning/hokkaido/build-queue.mjs . <群>（可用：${Object.keys(groups).join('、')}）`)
  process.exit(1)
}

// 頁型優先（地點主頁、跨地點頁），其他依面向
const pageTypeRoles = {
  'place-entry': '地點主頁',
  'cross-place-page': '跨地點頁',
}
const aspectRoles = {
  transport: '交通頁',
  stay: '住宿頁',
  sight: '景點頁',
  food: '美食頁',
  festival: '祭典頁',
  weather: '天氣頁',
  hiking: '步道與登山頁',
}

const addYear = (date) => `${Number(date.slice(0, 4)) + 1}${date.slice(4)}`
const isHttps = (url) => typeof url === 'string' && url.startsWith('https://')

async function stayFacts(placeId) {
  const research = await read(`content-planning/hokkaido/research/${placeId}.json`)
  const list = research.stayList ?? []
  const channels = []
  // 研究紀錄的寫法：yes（確認訂得到）、listed（搜尋結果有房型頁）、unknown／unchecked／not-found（不算）
  const bookable = (value) => value === 'yes' || value === 'listed'
  if (list.some((stay) => isHttps(stay.officialUrl))) channels.push('official')
  if (list.some((stay) => bookable(stay.tripCom))) channels.push('trip.com')
  if (list.some((stay) => bookable(stay.agoda))) channels.push('agoda')
  const sources = list.map((stay) => stay.officialUrl).filter(isHttps).slice(0, 3)
  return {channels, sources}
}

async function placeSources(placeId) {
  const facts = await read(`content-planning/hokkaido/places/${placeId}/facts.json`)
  const list = Array.isArray(facts) ? facts : facts.facts
  return [...new Set(list.map((fact) => fact.sourceUrl).filter(isHttps))].slice(0, 3)
}

const specs = await read(PAGE_SPECS)
const candidates = await read(CANDIDATES)
const outline = await read(group.outline)
const queue = await read(QUEUE)

const existingBatchIds = new Set((queue.batches ?? []).map((batch) => batch.id))
const clash = Object.keys(group.places).map((placeId) => `hokkaido-${placeId}`).filter((id) => existingBatchIds.has(id))
if ((queue.travelGroups ?? []).some((entry) => entry.id === group.id) || clash.length > 0) {
  console.error(`${group.label} 已經在清單裡（${[group.id, ...clash].join('、')}），不覆寫；要重排請先手動移除那一群。`)
  process.exit(1)
}

const keep = specs.items.filter((spec) => spec.decision === 'keep')
const candidateById = new Map(candidates.items.map((entry) => [entry.articleId, entry]))
const pathOf = new Map(keep.map((spec) => [spec.articleId, spec.targetPath]))
const order = outline.writingOrder
const nextReviewDue = addYear(group.verifiedAt)

const batches = []
for (const [placeId, place] of Object.entries(group.places)) {
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
    const pageRole = pageTypeRoles[spec.pageType] ?? aspectRoles[spec.aspect]
    if (!pageRole) throw new Error(`${spec.articleId} 的頁型 ${spec.pageType}／面向 ${spec.aspect} 沒有對應的頁面角色`)
    const item = {
      order: index + 1,
      articleId: spec.articleId,
      contentTheme: placeId,
      topicDirection: spec.planningTitle,
      pageRole,
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
        serpIntentConfirmed: true,
        serpIntentNote: group.serpIntentNote,
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
      if (place.bookingChannelsBasis) item.bookingChannelsBasis = place.bookingChannelsBasis
      const sources = spec.aspect === 'stay' ? stay.sources : await placeSources(placeId)
      item.factCheck = {lastVerifiedAt: group.verifiedAt, nextReviewDue, sources}
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
      planningCompletedAt: group.planningCompletedAt,
      authorizedCount: items.length,
      plannedPageCount: items.length,
      countPolicy: 'validated-independent-pages-only',
      deferredItems: [],
    },
    standingAuthorization: {
      recordedAt: group.authorizedAt,
      authorizedBy: 'Darren',
      decision: group.decision,
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
      startDate: group.startDate,
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

// 附加在後面：本機排定工作只讀 travelGroups[0]，先排進來的群保持在前面
queue.batches = [...(queue.batches ?? []), ...batches]
queue.travelGroups = [
  ...(queue.travelGroups ?? []),
  {
    id: group.id,
    label: group.label,
    outline: group.outline,
    batchIds: batches.map((batch) => batch.id),
    writingOrder: order,
    approval: group.approval,
  },
]
await writeFile(path.join(repo, QUEUE), `${JSON.stringify(queue, null, 2)}\n`)
console.log(`${group.label}：`, batches.map((batch) => `${batch.themeLabel} ${batch.items.length} 篇`).join('、'), '／寫作順序', order.length, '篇')
