/**
 * 把七批研究結果（research/batch-*.json）與原本旭川住宿的事實表合併成一份 reference-review.md，
 * 給這次樣本的兩位作者共用。只是這次實驗的工具，不是正式流程。
 *
 * 用法：node content-experiments/asahikawa-stay-full-2026-11-12/build-reference.mjs
 */
import {readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import path from 'node:path'

const here = import.meta.dirname
const root = path.resolve(here, '..', '..')
const read = (file) => JSON.parse(readFileSync(path.join(here, 'research', file), 'utf8'))

// 這次樣本用的中文寫法（暫定，還沒進 glossary.json）。已在譯名表的 12 間照譯名表。
const NAMES = {
  'jr-inn-asahikawa': 'JR Inn旭川',
  'court-hotel-asahikawa': 'Court Hotel旭川',
  'premier-hotel-cabin-asahikawa': '天然溫泉Premier Hotel-CABIN-旭川',
  'hotel-wbf-grande-asahikawa': 'Hotel WBF Grande旭川',
  'ys-hotel-asahikawa-ekimae': "Y's Hotel旭川站前",
  'koko-hotel-asahikawa-ekimae': 'KOKO HOTEL旭川站前',
  'asahikawa-sun-hotel': '旭川Sun Hotel',
  'hotel-mates-asahikawa': 'Hotel Mates旭川',
  'toyoko-inn-asahikawa-eki-higashiguchi': '東橫INN旭川站東口',
  'toyoko-inn-asahikawa-ekimae-ichijodori': '東橫INN旭川站前一條通',
  'super-hotel-asahikawa': 'Super Hotel旭川',
  'r-hotels-inn-hokkaido-asahikawa': 'R Hotels Inn北海道旭川',
  '9c-hotel-asahikawa': '9C Hotel旭川',
  'hotel-amanek-asahikawa': 'HOTEL AMANEK旭川',
  'tabist-asahikawa-station-hotel': 'Tabist旭川Station Hotel',
  'route-inn-grand-asahikawa-ekimae': '露櫻Grand旭川站前',
  'route-inn-asahikawa-ekimae-ichijodori': '露櫻旭川站前一條通',
  'hotel-tetora-asahikawa-ekimae': 'Hotel Tetora旭川站前',
  'kuretake-inn-asahikawa': '吳竹Inn旭川',
  'platon-hotel': 'Platon Hotel',
  'omo7-asahikawa': 'OMO7旭川',
  'art-hotel-asahikawa': 'Art Hotel旭川',
  'hotel-crescent-asahikawa': 'Hotel Crescent旭川',
  'asahikawa-toyo-hotel': '旭川Toyo Hotel',
  'dormy-inn-asahikawa': 'Dormy Inn旭川',
  'guesthouse-asahikawa-ride': 'Asahikawa Ride',
  toukaen: '東花苑',
  'wafu-ryokan-sensyoen': '扇松園',
  'oyado-matsueda': 'Matsueda旅館',
  'takasago-onsen': '高砂溫泉',
  'tatsunoyu-onsen': '龍乃湯溫泉',
  'auberge-sondre': 'Auberge Sondre',
}
// 不進這次文章的（官網完全讀不到又沒有其他官方事實，或官網只導到 Airbnb）
const SKIP_HOTELS = new Set(['osper-spa-sauna', 'guesthouse-sumile'])
// 評論不能用的：全部早於重新裝修、太舊、新舊名混在一起、則數太少
const NO_REVIEWS = {
  'asahikawa-sun-hotel': '讀到的評論都在 2022-06 以前，官網寫客房已全部重新裝修',
  'hotel-mates-asahikawa': '評論都早於 2026-05-08 重新裝修',
  'platon-hotel': '最新一則是 2020-08',
  'r-hotels-inn-hokkaido-asahikawa': '最新一則是 2024-09，早餐 2026-10 已改制',
  'koko-hotel-asahikawa-ekimae': '新名稱頁只有 6 則，其餘是換牌前舊名頁的評論',
  'guesthouse-asahikawa-ride': '只有 1 則，而且是 2013 年',
  toukaen: '只有 2 則',
  'wafu-ryokan-sensyoen': '只有 3 則，其中 1 則不是住宿',
  'tatsunoyu-onsen': '只有 13 則，年代從 2011 年起很分散',
}
const LABELS = {
  access: '位置與交通',
  parking: '停車',
  breakfast: '早餐',
  bath: '大浴場與溫泉',
  roomBath: '客房浴室',
  laundry: '洗衣',
  rooms: '房型',
  booking: '訂房',
  closures: '休館與停用',
}
const cell = (text) => String(text ?? '—').replace(/\|/g, '｜').replace(/\s*\n\s*/g, ' ').trim() || '—'
const isFact = (entry) => entry && entry.value && !/^(not-stated|unreadable)/i.test(String(entry.value).trim())

const list = read('hotel-list.json')
const listById = Object.fromEntries(list.hotels.map((hotel) => [hotel.id, hotel]))
const batches = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'].flatMap((id) => read(`batch-${id}.json`).hotels)

const facts = []
const reviews = []
const index = []
let factNumber = 501
let reviewNumber = 1
const addFact = (claim, quote, url, condition) => {
  const id = `F${factNumber++}`
  facts.push(`| ${id} | ${cell(claim)} | ${cell(quote)} | ${cell(url)} | 2026-11-12 | ${cell(condition)} | stay | 2027-11-12 | 完整版樣本 |`)
  return id
}
const addReview = (claim, url, condition) => {
  const id = `R${reviewNumber++}`
  reviews.push(`| ${id} | ${cell(claim)} | ${cell(url)} | 2026-11-12 | ${cell(condition)} |`)
  return id
}

for (const hotel of batches) {
  if (SKIP_HOTELS.has(hotel.id)) continue
  const name = NAMES[hotel.id]
  if (!name) throw new Error(`沒有中文寫法：${hotel.id}`)
  const base = listById[hotel.id] ?? {}
  const official = hotel.official ?? {}
  const entry = {id: hotel.id, name, nameJa: hotel.nameJa, area: base.area, type: base.type, officialUrl: base.officialUrl, facts: [], reviews: [], notes: []}
  if (base.address) {
    entry.facts.push(addFact(`${name}（${hotel.nameJa}）的地址是${base.address}；類型：${base.type}；區域：${base.area}。${base.walkFromStation ? `官網寫的走法：${base.walkFromStation}` : ''}`, base.walkFromStation, base.walkSourceUrl ?? base.officialUrl, '名單階段查到的地址與走法'))
  }
  for (const [key, label] of Object.entries(LABELS)) {
    if (isFact(official[key])) entry.facts.push(addFact(`${name}｜${label}：${official[key].value}`, official[key].quote, official[key].url, '飯店官網'))
  }
  for (const item of official.notable ?? []) {
    if (isFact(item)) entry.facts.push(addFact(`${name}｜官網主打：${item.value}`, item.quote, item.url, '飯店官網'))
  }
  if ((hotel.officialUnreadable ?? []).length > 0 && entry.facts.length <= 1) entry.notes.push('官網這次讀不到，設施沒有官方事實')
  const review = hotel.reviews4travel ?? {}
  if (NO_REVIEWS[hotel.id]) entry.notes.push(`評論不用：${NO_REVIEWS[hotel.id]}`)
  else {
    for (const theme of review.themes ?? []) {
      const total = (theme.positive ?? 0) + (theme.negative ?? 0)
      if (total < 3) continue
      entry.reviews.push(addReview(`${name}｜${theme.theme}：正面約 ${theme.positive} 則、負面約 ${theme.negative} 則。${theme.detail}`, review.url, `4travel 單一平台；讀 ${review.readReviews} 則／全部 ${review.totalReviews} 則；旅行時期 ${review.period}；總評分 ${review.overallScore}`))
    }
  }
  index.push(entry)
}

// 前一輪已經讀過的兩間（4travel；JR Inn 的 Jalan 統計因亂碼不可靠，這裡不用）
const manualReviews = {
  'jr-inn-asahikawa': {
    url: 'https://4travel.jp/dm_hotel-11373594/tips',
    condition: '4travel 單一平台；讀 20 則／全部 103 則；旅行時期 2024-03～2026-10；總評分 3.96；分項：交通 4.69、客房 4.15、浴場 4.11、接客 4.06、划算 3.89、餐點 3.52',
    themes: [
      ['位置、車站直結、AEON', 20, 0, '車站直結或隔壁，AEON 在樓下，吃飯購物方便'],
      ['大浴場', 15, 3, '多數只提到有大浴場、好用、早上可以泡；負面是和退房客共用電梯、外國客多時擠（也有一則說反而很空）'],
      ['清潔', 10, 0, '房間乾淨、整潔'],
      ['休息室', 9, 1, '免費咖啡、茶、漫畫、寬敞；一則說被團體客占據很吵'],
      ['房間大小、床', 7, 4, '房間寬、床舒適、可選枕頭；約 3 則說房間偏小'],
      ['早餐', 4, 3, '自助餐食材多、有在地料理；負面是會場擠要等、品項少'],
      ['高樓層景觀', 6, 0, '看得到鐵路與大雪山'],
      ['櫃台與服務', 4, 2, '櫃台親切、可寄放行李；入住時排隊久'],
      ['外國旅客多', 1, 5, '大浴場擠、入住排隊、休息區吵'],
      ['停車', 2, 2, '直結 AEON 停車場方便；傍晚飯店入口附近常滿、停好要走很遠才到櫃台'],
      ['洗衣', 3, 0, '有洗衣間，連住方便'],
    ],
  },
  'dormy-inn-asahikawa': {
    url: 'https://4travel.jp/dm_hotel-10667735/tips',
    condition: '4travel 單一平台；讀 30 則／全部 127 則；旅行時期 2020-07～2026-10；總評分 3.93',
    themes: [
      ['位置', 8, 10, '負面：離車站約 1 公里、走路 10 到 15 分鐘，多數人覺得偏遠，冬天雪路拖行李辛苦，有人改搭計程車或巴士。正面：附近有超商與餐飲街，機場巴士站就在附近'],
      ['天然溫泉大浴場', 20, 2, '頂樓大浴場最多人稱讚，說比一般商務旅館好'],
      ['露天風呂', 8, 0, '冬天下雪時泡露天最多人提到'],
      ['三溫暖與冷水池', 5, 0, '常一起被提到'],
      ['泡湯後的免費冰品與乳酸飲料', 10, 0, '冰品約 6 則、乳酸飲料約 4 則'],
      ['宵夜拉麵', 13, 0, '幾乎都說好，常被當成住這間的理由'],
      ['早餐', 12, 5, '海鮮丼最多人提到，多數稱讚；也有人說期待過高；餐廳不大，有人遇到分批入場'],
      ['房間', 4, 2, '雙床房與和洋室有人說寬敞，也有人覺得商務房偏小；另有約 4 則說建築有點舊'],
      ['清潔', 4, 0, '乾淨明亮'],
      ['停車場', 4, 3, '平面停車場就在旁邊、好停；入口窄，冬天戶外車位要自己除雪'],
    ],
  },
}
for (const entry of index) {
  const manual = manualReviews[entry.id]
  if (!manual) continue
  for (const [theme, positive, negative, detail] of manual.themes) {
    entry.reviews.push(addReview(`${entry.name}｜${theme}：正面約 ${positive} 則、負面約 ${negative} 則。${detail}`, manual.url, manual.condition))
  }
}

// 動物園款待券的完整販售名單（旭川市 PDF，2026-05-01 版；2026-11-11 下載讀過）
const omotenashiId = addFact(
  '旭川市公布的動物園票券販售處（令和8年5月1日時點）裡，賣 1 泊 2 日券（おもてなし券）的住宿有 25 間：東花苑、ファミリーホテルオノデラ、美松荘旅館、OMO7旭川、Art Hotel旭川、Court Hotel旭川、Hotel Crescent旭川、旭川Toyo Hotel、天然溫泉Premier Hotel-CABIN-旭川、JR Inn旭川、Hotel WBF Grande旭川、Y\'s Hotel旭川站前、KOKO HOTEL旭川站前、旭川Sun Hotel、キャピタルホテル、Hotel Mates旭川、Platon Hotel、東橫INN旭川站東口、東橫INN旭川站前一條通、Super Hotel旭川、吳竹Inn旭川、R Hotels Inn北海道旭川、9C Hotel旭川、扇松園、高砂溫泉；JR 旭川站內的旭川觀光物產情報中心也有賣。這次寫的飯店裡不在名單上的：Dormy Inn旭川、HOTEL AMANEK旭川、露櫻Grand旭川站前、露櫻旭川站前一條通、Tabist旭川Station Hotel、Hotel Tetora旭川站前、Asahikawa Ride、Matsueda旅館、龍乃湯溫泉、Auberge Sondre。',
  '令和8年度動物園チケット販売箇所 令和8年5月1日時点（旭川観光コンベンション協会取扱分）… 1泊2日券（おもてなし券）販売箇所数 28',
  'https://www.city.asahikawa.hokkaido.jp/asahiyamazoo/generalinformation/d052849_d/fil/hotelnadohanndai.pdf',
  '名單每年更新；販售處 28 處含 25 間住宿、三浦庭園、旭川觀光物產情報中心、旭川觀光會議協會',
)

const previous = readFileSync(path.join(root, 'content-production', 'asahikawa-stay', 'reference-review.md'), 'utf8')
const previousRows = previous.split('\n').filter((line) => /^\|\s*F\d+\s*\|/.test(line))

const lines = [
  '# 旭川住宿完整版樣本｜事實表（2026-11-12）',
  '',
  '這份由 `build-reference.mjs` 從 `research/` 的七批研究結果合併產生，不要手動改；要改就改研究檔或產生程式再重跑。',
  '寫作時只能用這份的事實。寫作規則與哪些不能寫，見同資料夾的 `WRITER-BRIEF.md`。',
  '',
  '## 飯店索引',
  '',
  '每間列出中文寫法、日文原名、區域、類型、官網，以及它的事實編號（F）與住客評論編號（R）。',
  '',
  '| 中文寫法 | 日文原名 | 區域 | 類型 | 官網 | 事實 | 住客評論 | 注意 |',
  '|---|---|---|---|---|---|---|---|',
  ...index.map((entry) => `| ${entry.name} | ${cell(entry.nameJa)} | ${entry.area ?? '—'} | ${entry.type ?? '—'} | ${entry.officialUrl ?? '—'} | ${entry.facts.join('、') || '—'} | ${entry.reviews.join('、') || '—'} | ${entry.notes.join('；') || '—'} |`),
  '',
  '## 事實表',
  '',
  `動物園款待券的完整販售名單是 ${omotenashiId}。`,
  '',
  'F11～F431 是原本線上〈旭川住宿〉的事實（2026-10-26～11-01 查），住宿稅、動物園款待券、訂房平台上架與 12 間的位置都在這裡。F501 起是 2026-11-12 這次查的官網設施。',
  '',
  '| 編號 | 主張 | 日文原文摘錄 | 來源網址 | 查閱日期 | 適用條件 | 變動類型 | 下次查核 | 採用決定 |',
  '|---|---|---|---|---|---|---|---|---|',
  ...previousRows,
  ...facts,
  '',
  '## 評論統整',
  '',
  '只有 4travel 一個平台（Jalan 用讀取工具是亂碼，其他平台要瀏覽器才讀得到），所以還不符合本站「兩個平台以上」的門檻，這篇樣本不能直接上線。這裡只收正面加負面三則以上的主題；每列的「正面／負面」是讀到的則數，寫作時照則數決定「多數、不少、有人」。',
  '',
  '| 編號 | 主張 | 來源網址 | 查閱日期 | 適用條件 |',
  '|---|---|---|---|---|',
  ...reviews,
  '',
]
mkdirSync(path.join(here, 'packet'), {recursive: true})
writeFileSync(path.join(here, 'packet', 'reference-review.md'), lines.join('\n'))
console.log(JSON.stringify({hotels: index.length, previousFacts: previousRows.length, newFacts: facts.length, reviewRows: reviews.length, withReviews: index.filter((entry) => entry.reviews.length > 0).length}, null, 2))
