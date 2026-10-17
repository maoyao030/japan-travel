// 產生稚內群大綱：node content-planning/hokkaido/build-outline.mjs .（在專案根目錄執行）
// 標題的 facts 先空著，研究完成後由 fill-facts 階段補上；已補的事實不會被覆蓋。
import {readFile, writeFile, access} from 'node:fs/promises'
import path from 'node:path'

const repo = process.argv[2]
const specs = JSON.parse(await readFile(path.join(repo, 'content-planning/hokkaido/page-specs.json'), 'utf8'))
const outPath = path.join(repo, 'content-planning/hokkaido/hokkaido-wakkanai-outline.json')
let previous = null
try {
  await access(outPath)
  previous = JSON.parse(await readFile(outPath, 'utf8'))
} catch {}

const placeOf = {
  wakkanai: 'wakkanai', 'wakkanai-transport': 'wakkanai', 'wakkanai-stay': 'wakkanai', 'wakkanai-sights': 'wakkanai',
  'wakkanai-food': 'wakkanai', 'wakkanai-festival': 'wakkanai', 'wakkanai-weather': 'wakkanai', 'wakkanai-ferry': 'wakkanai',
  'cape-soya': 'cape-soya', 'cape-soya-transport': 'cape-soya',
}
for (const item of specs.items) if (!placeOf[item.articleId] && item.decision === 'keep') {
  placeOf[item.articleId] = item.articleId.startsWith('rishiri') ? 'rishiri-island' : 'rebun-island'
}
const nameZh = {wakkanai: '稚內', 'cape-soya': '宗谷岬', 'rishiri-island': '利尻島', 'rebun-island': '禮文島'}

const h = (level, text, answers = []) => ({level, text, facts: [], answers})
// 每頁：H1、主要查詢與次要查詢（大綱用的寫法；含空格的重複變體不列）、標題
const pages = {
  wakkanai: {
    h1: '稚內值得去嗎？稚內旅遊排幾天、幾月去與怎麼接利尻禮文',
    primaryQuery: '稚內',
    secondaryQueries: ['稚內旅遊', '稚內自由行', '稚內值得去嗎', '稚內旅遊的最佳時機', '稚內一日遊'],
    headings: [
      h(2, '稚內值得去嗎？適合什麼樣的稚內旅遊', [0]),
      h(2, '稚內自由行排幾天', [0]),
      h(3, '稚內一日遊與過夜怎麼選', [2]),
      h(2, '稚內旅遊的最佳時機，幾月去最好', [1]),
      h(2, '從稚內怎麼接利尻島、禮文島', [3]),
      h(2, '稚內的交通、住宿、景點與美食'),
    ],
  },
  'wakkanai-transport': {
    h1: '稚內交通，札幌、旭川到稚內與稚內機場、車站怎麼走',
    primaryQuery: '稚內交通',
    secondaryQueries: ['札幌到稚內', '稚內機場', '旭川到稚內', '稚內車站', '稚內租車'],
    headings: [
      h(2, '札幌到稚內，JR 特急與高速巴士', [0]),
      h(3, '旭川到稚內'),
      h(2, '稚內機場到市區的巴士', [1]),
      h(2, '稚內車站、巴士總站與渡輪站的位置', [2]),
      h(2, '稚內租車與市內移動'),
    ],
  },
  'wakkanai-stay': {
    h1: '稚內住宿，飯店價格、訂房管道與搭早船住哪區',
    primaryQuery: '稚內住宿',
    secondaryQueries: ['Dormy Inn 稚內', '稚內住宿推薦'],
    headings: [
      h(2, '稚內住宿推薦，各區飯店與價格', [0]),
      h(3, 'Dormy Inn 稚內'),
      h(2, '搭早班渡輪，稚內住宿該選哪一區', [1]),
      h(2, '稚內住宿的訂房管道', [0]),
    ],
  },
  'wakkanai-sights': {
    h1: '稚內景點，防波堤穹頂、野寒布岬與冬天能去的地方',
    primaryQuery: '稚內景點',
    secondaryQueries: ['北海道稚內景點', '稚內冬天景點', '野寒布岬'],
    headings: [
      h(2, '北海道稚內景點怎麼排', [0]),
      h(3, '稚內港北防波堤穹頂', [0]),
      h(3, '野寒布岬', [0]),
      h(3, '稚內副港市場', [0]),
      h(2, '稚內景點沒車怎麼去', [0]),
      h(2, '稚內冬天景點', [1]),
    ],
  },
  'wakkanai-food': {
    h1: '稚內美食，章魚涮涮鍋、扇貝與稚內拉麵去哪吃',
    primaryQuery: '稚內美食',
    secondaryQueries: ['稚內必買'],
    headings: [
      h(2, '稚內美食有哪些', [0]),
      h(3, '章魚涮涮鍋', [0]),
      h(3, '扇貝', [0]),
      h(3, '稚內拉麵', [0]),
      h(2, '稚內必買的伴手禮'),
    ],
  },
  'wakkanai-festival': {
    h1: '稚內祭典，南極祭煙火、犬橇大會與夏季祭典',
    primaryQuery: '稚內祭典',
    secondaryQueries: [],
    headings: [
      h(2, '稚內港南極祭的日期與煙火', [0]),
      h(2, '稚內冬季的犬橇大會', [1]),
      h(2, '稚內白夜祭與北門神社例大祭', [2]),
      h(2, '稚內祭典與活動月曆'),
    ],
  },
  'wakkanai-weather': {
    h1: '稚內天氣，各月氣溫、降雪與穿著',
    primaryQuery: '稚內天氣',
    secondaryQueries: ['北海道稚內天氣', '稚內氣溫'],
    headings: [
      h(2, '北海道稚內天氣與各月稚內氣溫', [0]),
      h(2, '稚內冬天要穿什麼', [1]),
      h(2, '稚內看得到流冰嗎？', [2]),
      h(2, '稚內夏天也要帶外套嗎？'),
    ],
  },
  'wakkanai-ferry': {
    h1: '稚內到利尻島、禮文島渡輪，班次、票價與網路訂票',
    primaryQuery: '稚內到利尻島',
    secondaryQueries: ['稚內渡輪', '稚內船班', '禮文島船票', 'Heartland Ferry'],
    headings: [
      h(2, '稚內渡輪的航線與各季稚內船班', [0]),
      h(2, '稚內渡輪的票價與兒童票', [1]),
      h(3, '利尻島與禮文島船票', [1]),
      h(2, 'Heartland Ferry 稚內航線的網路訂票與報到時間', [2]),
      h(2, '稚內渡輪停航怎麼知道、怎麼改票', [3]),
      h(2, '稚內渡輪站的售票櫃台在哪', [4]),
    ],
  },
  'cape-soya': {
    h1: '宗谷岬怎麼去、待多久？北海道最北端、宗谷丘陵與白色道路',
    primaryQuery: '宗谷岬',
    secondaryQueries: ['北海道最北端', '宗谷丘陵', '白色道路'],
    headings: [
      h(2, '宗谷岬值得去嗎？北海道最北端要待多久', [0]),
      h(2, '宗谷岬周邊景點', [0]),
      h(2, '宗谷岬旁的宗谷丘陵與白色道路，開放季節', [1]),
      h(2, '冬天能去宗谷岬嗎？', [2]),
      h(2, '宗谷岬的交通與吃飯'),
    ],
  },
  'cape-soya-transport': {
    h1: '宗谷岬交通，稚內到宗谷岬巴士、計程車與自駕',
    primaryQuery: '宗谷岬交通',
    secondaryQueries: ['稚內到宗谷岬巴士', '稚內宗谷岬交通'],
    headings: [
      h(2, '稚內到宗谷岬巴士的班次與末班', [0]),
      h(2, '稚內宗谷岬交通的其他方式，計程車與自駕'),
      h(2, '宗谷岬白色道路沒車怎麼辦', [1]),
    ],
  },
  'rishiri-island': {
    h1: '利尻島旅遊，值得去嗎、住幾晚、幾月去',
    primaryQuery: '利尻島',
    secondaryQueries: ['利尻島旅遊', '北海道利尻島', '利尻島自由行', '利尻島一日遊'],
    headings: [
      h(2, '北海道利尻島旅遊值得去嗎？', [0]),
      h(2, '利尻島自由行住幾晚', [0]),
      h(3, '利尻島一日遊可行嗎？', [0]),
      h(2, '利尻島幾月去最好', [1]),
      h(2, '利尻島和禮文島怎麼一起排', [2]),
      h(2, '利尻島的交通、住宿、登山與美食'),
    ],
  },
  'rishiri-island-transport': {
    h1: '利尻島交通，稚內到利尻島、環島巴士與觀光巴士',
    primaryQuery: '利尻島交通',
    secondaryQueries: ['利尻島觀光巴士', '稚內到利尻島'],
    headings: [
      h(2, '稚內到利尻島，渡輪與飛機', [0]),
      h(2, '利尻島環島巴士與一日券', [1]),
      h(2, '利尻島觀光巴士的路線與季節', [2]),
      h(2, '利尻島租車與租自行車', [3]),
    ],
  },
  'rishiri-island-stay': {
    h1: '利尻島住宿，怎麼選區與冬季休館',
    primaryQuery: '利尻島住宿',
    secondaryQueries: [],
    headings: [
      h(2, '利尻島住宿怎麼選區，鴛泊、沓形與其他', [0]),
      h(2, '利尻島冬季休館的住宿', [1]),
      h(2, '利尻島住宿的訂房管道', [0]),
    ],
  },
  'rishiri-island-hiking': {
    h1: '利尻山登山，兩條路線、時間與攜帶式廁所',
    primaryQuery: '利尻山',
    secondaryQueries: ['利尻山登山', '利尻富士'],
    headings: [
      h(2, '利尻島的利尻山登山路線與所需時間', [0]),
      h(3, '利尻富士的名稱與山頂'),
      h(3, '鴛泊路線', [0]),
      h(3, '沓形路線', [0]),
      h(2, '利尻島登山的攜帶式廁所與登山計畫書', [1]),
      h(2, '利尻島登山季節與住宿接送', [2]),
    ],
  },
  'rishiri-island-sights': {
    h1: '利尻島景點，開放期間與沒車怎麼去',
    primaryQuery: '利尻島景點',
    secondaryQueries: [],
    headings: [
      h(2, '利尻島景點有哪些'),
      h(3, '姬沼'),
      h(3, '白色戀人之丘'),
      h(2, '利尻島景點的開放期間', [0]),
      h(2, '利尻島景點沒車怎麼去', [1]),
    ],
  },
  'rishiri-island-food': {
    h1: '利尻島美食，海膽產季與哪裡吃',
    primaryQuery: '利尻島美食',
    secondaryQueries: [],
    headings: [
      h(2, '利尻島海膽的產季', [0]),
      h(2, '利尻島的拉麵味樂', [1]),
      h(2, '利尻島美食還有什麼'),
    ],
  },
  'rishiri-island-festival': {
    h1: '利尻島祭典，7、8 月的祭典與煙火',
    primaryQuery: '利尻島祭典',
    secondaryQueries: [],
    headings: [
      h(2, '利尻島夏季祭典的日期與地點', [0]),
      h(2, '利尻島祭典期間的住宿與交通'),
    ],
  },
  'rishiri-island-weather': {
    h1: '利尻島天氣，各月氣溫與冬季停航',
    primaryQuery: '利尻島天氣',
    secondaryQueries: [],
    headings: [
      h(2, '利尻島各月氣溫與穿著', [0]),
      h(2, '利尻島冬季的渡輪停航', [1]),
    ],
  },
  'rebun-island': {
    h1: '禮文島旅遊，值得去嗎、住幾晚與一日來回',
    primaryQuery: '禮文島',
    secondaryQueries: ['禮文島旅遊', '北海道禮文島'],
    headings: [
      h(2, '北海道禮文島旅遊值得去嗎？', [0]),
      h(2, '禮文島住幾晚？一日來回可不可行', [0, 2]),
      h(2, '禮文島幾月去最好', [1]),
      h(2, '禮文島和利尻島怎麼一起排'),
      h(2, '禮文島的交通、住宿、步道與美食'),
    ],
  },
  'rebun-island-transport': {
    h1: '禮文島交通，路線巴士、觀光巴士與沒車怎麼去景點',
    primaryQuery: '禮文島交通',
    secondaryQueries: ['禮文島觀光巴士'],
    headings: [
      h(2, '禮文島路線巴士的三條路線與班次', [0]),
      h(2, '禮文島觀光巴士的預約與季節', [1]),
      h(2, '禮文島沒車怎麼去景點', [2]),
      h(3, '敦盛草群生地怎麼去？', [2]),
      h(3, '澄海岬怎麼去？', [2]),
      h(3, '地藏岩怎麼去？', [2]),
      h(2, '稚內到禮文島的渡輪'),
    ],
  },
  'rebun-island-stay': {
    h1: '禮文島住宿，香深或船泊、價格與花季多早訂',
    primaryQuery: '禮文島住宿',
    secondaryQueries: [],
    headings: [
      h(2, '禮文島住宿一覽與價格', [0]),
      h(2, '禮文島住宿選香深還是船泊', [1]),
      h(2, '禮文島花季住宿多早訂', [2]),
    ],
  },
  'rebun-island-hiking': {
    h1: '禮文島健行，各步道時間、起訖點巴士與花季',
    primaryQuery: '禮文島健行',
    secondaryQueries: ['桃岩展望台'],
    headings: [
      h(2, '禮文島健行步道的時間與起訖點', [0]),
      h(3, '桃岩展望台路線', [0]),
      h(2, '禮文島敦盛草群生地的開放期間', [1]),
      h(2, '禮文島步道的冬季封閉', [2]),
    ],
  },
  'rebun-island-sights': {
    h1: '禮文島景點，澄海岬、北方金絲雀公園怎麼去與開放期間',
    primaryQuery: '禮文島景點',
    secondaryQueries: ['澄海岬'],
    headings: [
      h(2, '禮文島景點怎麼去', [0]),
      h(3, '澄海岬', [0]),
      h(3, '北方金絲雀公園', [0]),
      h(2, '禮文島景點的開放期間', [1]),
    ],
  },
  'rebun-island-food': {
    h1: '禮文島美食，海膽產季與花魚怎麼吃',
    primaryQuery: '禮文島美食',
    secondaryQueries: [],
    headings: [
      h(2, '禮文島海膽的產季', [0]),
      h(2, '禮文島的花魚怎麼吃', [1]),
    ],
  },
  'rebun-island-festival': {
    h1: '禮文島祭典，花火大會與敦盛草感謝祭',
    primaryQuery: '禮文島祭典',
    secondaryQueries: [],
    headings: [
      h(2, '禮文島祭典的日期與地點', [0]),
      h(3, '禮文故鄉祭花火大會', [0]),
      h(3, '敦盛草感謝祭', [0]),
    ],
  },
  'rebun-island-weather': {
    h1: '禮文島天氣，各月氣溫與夏天要不要外套',
    primaryQuery: '禮文島天氣',
    secondaryQueries: [],
    headings: [
      h(2, '禮文島各月氣溫', [0]),
      h(2, '禮文島夏天也要帶外套嗎？', [1]),
    ],
  },
}

// 各地點研究結果：research/<地點>.json 與研究者對好事實的標題 research/<地點>-headings.json
const placeIds = ['wakkanai', 'cape-soya', 'rishiri-island', 'rebun-island']
const research = {}
const headingMaps = {}
for (const placeId of placeIds) {
  for (const [store, file] of [[research, `${placeId}.json`], [headingMaps, `${placeId}-headings.json`]]) {
    try {
      store[placeId] = JSON.parse(await readFile(path.join(repo, 'content-planning/hokkaido/research', file), 'utf8'))
    } catch {}
  }
}
const mappedHeadings = (articleId) => {
  for (const map of Object.values(headingMaps)) {
    const page = map?.pages?.[articleId]
    if (page?.headings?.length) {
      return page.headings.map(({level, text, answers = [], facts = []}) => ({level, text, facts, answers}))
    }
  }
  return null
}

// 短頁併入主頁（本主題事實少於 15 筆），依研究結果決定
const merges = {
  'rebun-island-weather': 'rebun-island',
  'rebun-island-festival': 'rebun-island',
}
const resolve = (articleId) => merges[articleId] ?? articleId
const allKeep = specs.items.filter((item) => item.decision === 'keep' || merges[item.articleId])
const keep = allKeep.filter((item) => !merges[item.articleId])
const mergedInto = (mainId) =>
  Object.keys(merges).filter((id) => merges[id] === mainId).map((id) => allKeep.find((item) => item.articleId === id))
const outlinePages = keep.map((item) => {
  const draft = pages[item.articleId]
  if (!draft) throw new Error(`缺少大綱：${item.articleId}`)
  let mustAnswer = [...item.readerTaskContract.mustAnswer]
  let fallback = draft.headings
  for (const merged of mergedInto(item.articleId)) {
    const offset = mustAnswer.length
    mustAnswer = [...mustAnswer, ...merged.readerTaskContract.mustAnswer]
    fallback = [...fallback, ...pages[merged.articleId].headings.map((heading) => ({...heading, answers: heading.answers.map((index) => index + offset)}))]
  }
  const headings = mappedHeadings(item.articleId) ?? fallback
  return {
    articleId: item.articleId,
    pageType: item.pageType,
    placeId: placeOf[item.articleId],
    targetPath: item.targetPath,
    primaryQuery: draft.primaryQuery,
    secondaryQueries: draft.secondaryQueries,
    h1: draft.h1,
    mustAnswer,
    headings,
  }
})

// 分工表
const d = (topicKey, description, owner, summarizedBy = []) => ({topicKey, description, owner, summarizedBy})
const division = [
  d('wakkanai-overview', '稚內值不值得去、排幾天、幾月去、一日遊或過夜', 'wakkanai'),
  d('wakkanai-access', '札幌、旭川到稚內的 JR、高速巴士與飛機；稚內機場巴士', 'wakkanai-transport', ['wakkanai']),
  d('wakkanai-stations-layout', 'JR 稚內站、巴士總站、渡輪站的位置關係與市內移動、租車', 'wakkanai-transport', ['wakkanai-ferry', 'wakkanai-stay']),
  d('heartland-ferry-routes', '稚內、利尻、禮文之間的渡輪航線、各季班次與航程', 'wakkanai-ferry', ['wakkanai', 'rishiri-island-transport', 'rebun-island-transport', 'rishiri-island', 'rebun-island']),
  d('heartland-ferry-fares', '渡輪票價、兒童票、船艙等級', 'wakkanai-ferry', ['rishiri-island-transport', 'rebun-island-transport']),
  d('heartland-ferry-booking', '網路訂票、報到時間、渡輪站售票櫃台', 'wakkanai-ferry', ['rishiri-island-transport', 'rebun-island-transport']),
  d('heartland-ferry-cancellation', '停航怎麼知道、怎麼改票', 'wakkanai-ferry', ['rishiri-island-weather', 'rebun-island-weather', 'rishiri-island-transport', 'rebun-island-transport']),
  d('rishiri-rebun-itinerary', '利尻島與禮文島怎麼一起排、跳島順序與天數', 'rishiri-island', ['rebun-island', 'wakkanai']),
  d('wakkanai-stay-list', '稚內各區住宿、價格、訂房管道；宗谷岬唯一的民宿', 'wakkanai-stay', ['wakkanai', 'cape-soya']),
  d('wakkanai-sights-list', '稚內市區與近郊景點、沒車怎麼去、冬天景點', 'wakkanai-sights', ['wakkanai']),
  d('wakkanai-food-list', '章魚涮涮鍋、扇貝、稚內拉麵與伴手禮', 'wakkanai-food', ['wakkanai']),
  d('wakkanai-events', '南極祭、犬橇大會、白夜祭等活動日期', 'wakkanai-festival', ['wakkanai']),
  d('wakkanai-climate', '稚內與宗谷岬的各月氣溫、降雪、風與穿著、流冰', 'wakkanai-weather', ['wakkanai', 'cape-soya']),
  d('cape-soya-overview', '宗谷岬值不值得去、待多久、周邊景點、冬天能不能去', 'cape-soya', ['wakkanai']),
  d('shiroi-michi-soya-hills', '宗谷丘陵與白色道路的開放季節與風車狀況', 'cape-soya', ['cape-soya-transport']),
  d('cape-soya-access', '稚內到宗谷岬的巴士、計程車、自駕；白色道路沒車怎麼辦', 'cape-soya-transport', ['cape-soya', 'wakkanai-transport']),
  d('rishiri-overview', '利尻島值不值得去、住幾晚、幾月去', 'rishiri-island'),
  d('rishiri-island-moving', '利尻島環島巴士、一日券、觀光巴士、租車與自行車；飛機', 'rishiri-island-transport', ['rishiri-island', 'rishiri-island-sights', 'rishiri-island-hiking']),
  d('rishiri-stay-list', '利尻島住宿選區、冬季休館、訂房管道', 'rishiri-island-stay', ['rishiri-island', 'rishiri-island-hiking']),
  d('rishiri-climb', '利尻山登山路線、時間、攜帶式廁所、登山計畫書、季節', 'rishiri-island-hiking', ['rishiri-island']),
  d('rishiri-sights-list', '利尻島景點、開放期間與沒車怎麼去', 'rishiri-island-sights', ['rishiri-island']),
  d('rishiri-food', '利尻島海膽產季與餐廳', 'rishiri-island-food', ['rishiri-island']),
  d('rishiri-events', '利尻島夏季祭典與煙火', 'rishiri-island-festival', ['rishiri-island']),
  d('rishiri-climate', '利尻島各月氣溫與穿著', 'rishiri-island-weather', ['rishiri-island']),
  d('rebun-overview', '禮文島值不值得去、住幾晚、幾月去、一日來回', 'rebun-island'),
  d('rebun-island-moving', '禮文島路線巴士、觀光巴士、沒車怎麼去景點', 'rebun-island-transport', ['rebun-island', 'rebun-island-hiking', 'rebun-island-sights']),
  d('rebun-stay-list', '禮文島住宿、價格、香深或船泊、花季多早訂', 'rebun-island-stay', ['rebun-island']),
  d('rebun-trails', '禮文島步道時間、起訖點、冬季封閉', 'rebun-island-hiking', ['rebun-island', 'rebun-island-sights']),
  d('rebun-atsumori-colony', '禮文敦盛草群生地的開放期間與花期', 'rebun-island-hiking', ['rebun-island', 'rebun-island-sights', 'rebun-island-festival']),
  d('rebun-sights-list', '禮文島景點、開放期間、怎麼去', 'rebun-island-sights', ['rebun-island']),
  d('rebun-food', '禮文島海膽產季與花魚', 'rebun-island-food', ['rebun-island']),
  d('rebun-events', '禮文島花火大會、敦盛草感謝祭等活動', 'rebun-island-festival', ['rebun-island']),
  d('rebun-climate', '禮文島各月氣溫與夏天穿著', 'rebun-island-weather', ['rebun-island']),
]

for (const entry of division) {
  entry.owner = resolve(entry.owner)
  entry.summarizedBy = [...new Set(entry.summarizedBy.map(resolve))].filter((id) => id !== entry.owner)
}

// 內連表：每個主題頁 ↔ 地點主頁，加上跨頁的決策連結。連結句之後要原樣寫進正文。
const aspectLabel = {
  transport: '交通', stay: '住宿', sight: '景點', food: '美食', festival: '祭典', weather: '天氣',
}
const entrySentence = {
  wakkanai: ['還沒決定要不要排稚內，可以先看稚內值得去嗎。', '稚內值得去嗎'],
  'cape-soya': ['還沒決定要不要排宗谷岬，可以先看宗谷岬值得去嗎。', '宗谷岬值得去嗎'],
  'rishiri-island': ['還沒決定要不要排利尻島，可以先看利尻島值得去嗎。', '利尻島值得去嗎'],
  'rebun-island': ['還沒決定要不要排禮文島，可以先看禮文島值得去嗎。', '禮文島值得去嗎'],
}
const pageTitleFor = (item) => {
  const place = nameZh[placeOf[item.articleId]]
  if (item.articleId === 'wakkanai-ferry') return '稚內到利尻島、禮文島渡輪'
  if (item.articleId === 'rishiri-island-hiking') return '利尻山登山'
  if (item.articleId === 'rebun-island-hiking') return '禮文島健行'
  return `${place}${aspectLabel[item.aspect]}`
}
const links = []
const link = (from, to, purpose, sentence, anchor, section) => {
  from = resolve(from)
  to = resolve(to)
  if (from === to || links.some((other) => other.from === from && other.to === to && other.sentence === sentence)) return
  const entry = {from, to, purpose}
  if (section) entry.section = section
  if (sentence) Object.assign(entry, {sentence, anchor})
  links.push(entry)
}
for (const item of keep.filter((candidate) => candidate.pageType === 'aspect-page')) {
  const placeId = placeOf[item.articleId]
  const entryId = placeId
  const title = pageTitleFor(item)
  const [backSentence, backAnchor] = entrySentence[placeId]
  link(item.articleId, entryId, '開頭連回地點主頁', backSentence, backAnchor)
  const place = nameZh[placeId]
  const lead = item.articleId === 'wakkanai-ferry'
    ? '渡輪班次與票價'
    : {
        transport: `怎麼到${place}、到了怎麼移動`,
        stay: '住宿的價格與訂房管道',
        sight: '各景點怎麼去',
        food: '在地美食去哪吃',
        festival: '各活動的日期',
        weather: '各月氣溫與穿著',
        hiking: '路線與所需時間',
      }[item.aspect]
  link(entryId, item.articleId, `主頁摘要${title}並連過去`, `${lead}，見${title}。`, title)
}
link('wakkanai', 'cape-soya', '稚內主頁介紹順路的宗谷岬', '日本最北端在宗谷岬，怎麼排見宗谷岬值得去嗎。', '宗谷岬值得去嗎')
link('wakkanai', 'rishiri-island', '從稚內接利尻島', '要上利尻島，先看利尻島值得去嗎。', '利尻島值得去嗎')
link('wakkanai', 'rebun-island', '從稚內接禮文島', '要上禮文島，先看禮文島值得去嗎。', '禮文島值得去嗎')
link('cape-soya', 'wakkanai', '宗谷岬的出入口是稚內', '宗谷岬從稚內出發，稚內怎麼排見稚內值得去嗎。', '稚內值得去嗎')
link('wakkanai-transport', 'wakkanai-ferry', '到稚內後轉渡輪', '從稚內搭船去島上，班次與票價見稚內到利尻島、禮文島渡輪。', '稚內到利尻島、禮文島渡輪')
link('wakkanai-transport', 'cape-soya-transport', '稚內轉往宗谷岬', '從稚內去日本最北端，巴士班次見宗谷岬交通。', '宗谷岬交通')
link('rishiri-island-transport', 'wakkanai-ferry', '渡輪班次與票價由渡輪頁負責', '渡輪班次、票價與訂票見稚內到利尻島、禮文島渡輪。', '稚內到利尻島、禮文島渡輪')
link('rebun-island-transport', 'wakkanai-ferry', '渡輪班次與票價由渡輪頁負責', '渡輪班次、票價與訂票見稚內到利尻島、禮文島渡輪。', '稚內到利尻島、禮文島渡輪')
link('wakkanai-ferry', 'rishiri-island-transport', '下船後的島上交通', '到了鴛泊港之後怎麼移動，見利尻島交通。', '利尻島交通')
link('wakkanai-ferry', 'rebun-island-transport', '下船後的島上交通', '到了香深港之後怎麼移動，見禮文島交通。', '禮文島交通')
link('rishiri-island', 'rebun-island', '兩島一起排', '對面的禮文島怎麼排，見禮文島值得去嗎。', '禮文島值得去嗎')
link('rebun-island', 'rishiri-island', '兩島一起排', '兩島怎麼一起排，見利尻島值得去嗎。', '利尻島值得去嗎')
link('rishiri-island-stay', 'rebun-island-stay', '常一起排的島的住宿', '對面島上的住宿見禮文島住宿。', '禮文島住宿')
link('rebun-island-stay', 'rishiri-island-stay', '常一起排的島的住宿', '對面島上的住宿見利尻島住宿。', '利尻島住宿')
link('rishiri-island-weather', 'wakkanai-ferry', '冬季停航與改票', '停航時怎麼知道、怎麼改票，見稚內到利尻島、禮文島渡輪。', '稚內到利尻島、禮文島渡輪')
link('rebun-island-weather', 'wakkanai-ferry', '停航與改票', '停航時怎麼知道、怎麼改票，見稚內到利尻島、禮文島渡輪。', '稚內到利尻島、禮文島渡輪')
link('rishiri-island-festival', 'rishiri-island-stay', '祭典期間住宿容易客滿', '祭典當晚島上住宿容易客滿，住宿見利尻島住宿。', '利尻島住宿')
link('rebun-island-festival', 'rebun-island-stay', '花季與祭典期間住宿容易客滿', '活動期間島上住宿容易客滿，住宿見禮文島住宿。', '禮文島住宿')
link('wakkanai-festival', 'wakkanai-stay', '祭典期間住宿', '活動期間市區住宿容易客滿，住宿見稚內住宿。', '稚內住宿')
link('rishiri-island-hiking', 'rishiri-island-transport', '登山口怎麼去', '沒車怎麼到登山口，見利尻島交通。', '利尻島交通')
link('rebun-island-hiking', 'rebun-island-transport', '步道起訖點的巴士', '起訖點的巴士班次見禮文島交通。', '禮文島交通')
link('rebun-island-sights', 'rebun-island-hiking', '景點與步道重疊', '走步道順遊的景點，見禮文島健行。', '禮文島健行')
link('rishiri-island-sights', 'rishiri-island-transport', '沒車怎麼去景點', '環島巴士與觀光巴士見利尻島交通。', '利尻島交通')
link('cape-soya-transport', 'wakkanai-transport', '先到稚內', '怎麼先到稚內，見稚內交通。', '稚內交通')
link('wakkanai-weather', 'cape-soya', '宗谷岬的風與冬天', '宗谷岬冬天能不能去，見宗谷岬值得去嗎。', '宗谷岬值得去嗎')

const writingOrderAll = [
  'wakkanai-ferry', 'wakkanai-transport', 'cape-soya-transport', 'wakkanai-stay', 'wakkanai-weather', 'wakkanai-sights',
  'wakkanai-food', 'wakkanai-festival', 'cape-soya', 'wakkanai',
  'rebun-island-transport', 'rebun-island-stay', 'rebun-island-hiking', 'rebun-island-sights', 'rebun-island-weather',
  'rebun-island-food', 'rebun-island-festival', 'rebun-island',
  'rishiri-island-transport', 'rishiri-island-hiking', 'rishiri-island-stay', 'rishiri-island-sights', 'rishiri-island-weather',
  'rishiri-island-food', 'rishiri-island-festival', 'rishiri-island',
]

const writingOrder = writingOrderAll.filter((id) => !merges[id])
const outline = {
  schemaVersion: 1,
  groupId: 'hokkaido-wakkanai',
  region: 'hokkaido',
  status: previous?.status ?? 'drafting',
  merged: Object.entries(merges).map(([articleId, into]) => ({articleId, mergedInto: into, reason: '本主題事實少於 15 筆，併進地點主頁寫成一節（短頁規則）'})),
  updatedAt: '2026-10-18',
  approval: {approvedBy: 'darren', approvedAt: '2026-10-18', scope: '26 頁整批核准；大綱細節依規則默許'},
  pages: outlinePages,
  division,
  links,
  writingOrder,
  gaps: collect('gaps'),
  spotCoverage: collect('spotCoverage'),
  experienceLeads: collect('experienceLeads'),
  objectiveConditions: collect('objectiveConditions'),
  mediaPlan: collect('mediaPlan'),
  mergeDecisions: collect('mergeRecommendations'),
  researchStatus: Object.fromEntries(placeIds.map((placeId) => [placeId, research[placeId] ? 'done' : 'pending'])),
}
function collect(field) {
  return placeIds.flatMap((placeId) => (research[placeId]?.[field] ?? []).map((entry) => ({placeId, ...entry})))
}
await writeFile(outPath, `${JSON.stringify(outline, null, 2)}\n`, 'utf8')
console.log(`pages ${outlinePages.length}, division ${division.length}, links ${links.length}`)
