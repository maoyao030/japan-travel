/**
 * 第 3 階段：把雲端第三版的段落事實表、reference-review 的補充事實、這次在 Google 補讀的評論，
 * 組成每一段給作者、查核、編輯用的 TASK.md 與 facts.md。
 * 依 stay-page.md「流程」第 1 點：作者的事實表只放過門檻（可用）的評論，4travel 單一平台的列與不可用的列都不放。
 * 用法：node content-experiments/stay-local-test-2026-11-16/stage3/build-pieces.mjs
 */
import {readFileSync, writeFileSync, mkdirSync, existsSync} from 'node:fs'
import path from 'node:path'

const here = import.meta.dirname
const v3 = path.join(here, '..', '..', 'asahikawa-stay-full-2026-11-12', 'v3', 'pieces')
const refReview = readFileSync(path.join(here, '..', '..', 'asahikawa-stay-full-2026-11-12', 'packet', 'reference-review.md'), 'utf8')
const read = (p) => readFileSync(p, 'utf8')

const refRow = (id) => {
  const line = refReview.split('\n').find((l) => l.startsWith(`| ${id} |`))
  if (!line) throw new Error(`reference-review 找不到 ${id}`)
  return line
}

// 讀評論檔，只留「可用」的列（一列裡有部分可用的也留，最後一欄當「怎麼用」）
const usableRows = (file, filter) => {
  if (!existsSync(file)) return []
  return read(file).split('\n')
    .filter((l) => /^\| R\d+ \|/.test(l))
    .filter((l) => {
      const cells = l.split('|').map((c) => c.trim())
      const last = cells[cells.length - 2]
      return /(^|[^不])可用/.test(last)
    })
    .filter((l) => !filter || filter.test(l.split('|')[2]))
    .map((l) => {
      const cells = l.split('|').slice(1, -1).map((c) => c.trim())
      return `| ${cells[0]} | ${cells[1]} | ${cells[2]} | ${cells[3]} | ${cells[cells.length - 1]} |`
    })
}

const readHeader = (file) => {
  if (!existsSync(file)) return []
  return read(file).split('\n').filter((l) => /^Google 地圖|^Trip\.com|^4travel/.test(l))
}

const v3Header = (id) => {
  const text = read(path.join(v3, id, 'facts.md'))
  const m = text.match(/## 用這份事實表前要知道\n([\s\S]*?)\n## /)
  return m ? m[1].trim() : ''
}

// 雲端事實表裡「官網」的部分（不含住客評論那幾節）
const v3OfficialSections = (id) => {
  const text = read(path.join(v3, id, 'facts.md'))
  const parts = text.split(/\n(?=## )/).slice(1)
  return parts.filter((p) => !/^## 用這份事實表前要知道/.test(p) && !/住客評論/.test(p.split('\n')[0])).map((p) => p.trim())
}

const COMMON = [
  'F 是飯店官網（與官方資料）的事實；R 是住客評論的歸納，都已經過門檻（兩個平台以上、合計三則以上），可以用。',
  'R 列寫成住客的說法（「有住客反應…」「有些住客覺得…」「評價比較兩極」輪著用），不寫則數，不寫成本站的結論。R 列沒寫到的細節不要自己補。',
  '房價、早餐價格、一泊二食價格不能寫；停車費與設施加收的費用（官網有寫的）可以寫。',
  'F 列的「主張」欄裡「官網沒寫…」「沒寫…」是研究筆記，不是事實：正文不寫「官網沒寫」這類話，也不能把官網沒提到的推成「沒有」。',
]

const reviewsDir = path.join(here, 'reviews')
const prevStage = path.join(here, '..')

const HOTELS = [
  {id: 'cabin', title: '天然溫泉Premier Hotel-CABIN-旭川', area: '旭川站前的飯店', extra: ['F137', 'F405']},
  {id: 'wbf-grande', title: 'Hotel WBF Grande旭川', area: '旭川站前的飯店', extra: []},
  {id: 'route-inn-grand', title: '露櫻Grand旭川站前', area: '旭川站前的飯店', extra: ['F137', 'F403']},
  {id: 'super-hotel', title: 'Super Hotel旭川', area: '旭川站前的飯店', extra: []},
  {id: 'amanek', title: 'HOTEL AMANEK旭川', area: '旭川站前的飯店', extra: ['F137', 'F406']},
  {id: 'court', title: 'Court Hotel旭川', area: '旭川站前的飯店', extra: ['F137']},
  {id: 'toyoko', title: '東橫INN旭川站東口與旭川站前一條通', area: '旭川站前的飯店', extra: ['F408', 'F409']},
  {id: '9c', title: '9C Hotel旭川', area: '旭川站前的飯店', extra: []},
  {id: 'art-hotel', title: 'Art Hotel旭川', area: '旭川市中心的飯店', extra: ['F412', 'F430']},
  {id: 'crescent', title: 'Hotel Crescent旭川', area: '旭川市中心的飯店', extra: []},
]

// 訂房連結那一行：依 listing-check.md 填（Trip.com、Agoda 有上架才列）
const BOOKING = JSON.parse(read(path.join(here, 'booking-lines.json')))

const officialHeader = '| 編號 | 主張 | 日文原文摘錄 | 來源網址 | 查閱日期 | 適用條件 | 變動類型 | 下次查核 | 採用決定 |\n|---|---|---|---|---|---|---|---|---|'
const reviewHeader = '| 編號 | 主張 | 來源 | 查閱日期 | 怎麼用（只能用寫可用的部分） |\n|---|---|---|---|---|'

const write = (id, task, facts) => {
  const dir = path.join(here, id)
  mkdirSync(dir, {recursive: true})
  writeFileSync(path.join(dir, 'TASK.md'), task)
  writeFileSync(path.join(dir, 'facts.md'), facts)
}

const numbered = (lines) => lines.filter(Boolean).map((l, i) => `${i + 1}. ${l}`).join('\n')

for (const h of HOTELS) {
  const reviewFile = path.join(reviewsDir, `${h.id}.md`)
  const rows = usableRows(reviewFile)
  const notes = [`只寫${h.title}${h.id === 'toyoko' ? '這兩間' : '這一間'}。`, ...COMMON, ...v3Header(h.id).split('\n').filter(Boolean)]
  const extra = h.extra.length ? `## 補充的官方事實\n\n${officialHeader}\n${h.extra.map(refRow).join('\n')}` : ''
  const facts = [
    `# ${h.title}｜這一段的事實表`,
    `## 用這份事實表前要知道\n\n${numbered(notes)}`,
    ...v3OfficialSections(h.id),
    extra,
    `## 住客評論歸納\n\n${readHeader(reviewFile).join('\n')}\n4travel（2026-11-12 讀）的說法，Google 也有提到的才放在這裡。\n\n${rows.length ? `${reviewHeader}\n${rows.join('\n')}` : '（這一間沒有過門檻的住客評論，不寫住客的說法。）'}`,
  ].filter(Boolean).join('\n\n') + '\n'
  const task = `# 這次要寫的段落：${h.title}

這是〈旭川住宿〉這一頁裡，「${h.area}」底下介紹${h.id === 'toyoko' ? '這兩間' : '這一間'}飯店的段落。照 \`stay-page.md\`「版面」的「介紹一間飯店的段落」寫，從事實表直接寫，沒有舊稿。${h.id === 'toyoko' ? '兩間一起寫，版面照事實表開頭的說明。' : ''}

同一頁另外有一張比較表列規格（走路時間、停車、早餐、大浴場、怎麼訂），也有「依需求選」的小節會點到這間，所以這裡要做的是：讓讀者讀完知道這間適不適合自己。

最後${h.id === 'toyoko' ? '兩行' : '一行'}訂房連結照這樣寫：
${BOOKING[h.id].map((l) => `\`${l}\``).join('\n')}

## 輸出

第一行是 \`### ${h.title}\`，接著是段落。不要加說明、筆記或事實編號。
`
  write(h.id, task, facts)
  console.log(h.id, '可用評論', rows.length)
}

// 「依需求選」三節：官方事實照雲端，評論換成全部飯店過門檻、主題相符的列
const allReviewFiles = [
  ...HOTELS.map((h) => path.join(reviewsDir, `${h.id}.md`)),
  path.join(reviewsDir, 'others.md'),
  path.join(prevStage, 'stage1', 'dormy-inn', 'facts.md'),
  path.join(prevStage, 'stage2', 'omo7', 'facts.md'),
  path.join(prevStage, 'stage2', 'jr-inn', 'facts.md'),
]
const stage12Usable = (file, filter) => {
  // 第 1、2 階段的表最後一欄也有「可用／不可用」；第 1 階段 Dormy Inn 的表另外處理
  return usableRows(file, filter)
}

const NEEDS = [
  {id: 'need-parking', title: '開車去旭川，哪些飯店好停車？', filter: /停車|車位|停車場/},
  {id: 'need-breakfast', title: '重視早餐的人選哪幾間？', filter: /早餐/},
  {id: 'need-group', title: '三人以上同住，或想住便宜一點', filter: /房間大小|寬|三人|3 人|家庭|親子|人數|床/},
]
for (const n of NEEDS) {
  const rows = allReviewFiles.flatMap((f) => stage12Usable(f, n.filter))
  const oldTask = read(path.join(v3, n.id, 'TASK.md'))
  const specific = oldTask.split('\n').slice(-2).join('\n').trim()
  const notes = [...COMMON, '這一節點到的每一間，這一頁後面都有自己的段落或比較表，這裡只讓讀者知道該看哪幾間、哪幾間要小心。', ...specific.split('\n').filter(Boolean)]
  const facts = [
    `# ${n.title}｜這一節的事實表`,
    `## 用這份事實表前要知道\n\n${numbered(notes)}`,
    ...v3OfficialSections(n.id),
    `## 住客評論歸納\n\n各飯店過門檻的住客評論裡，和這一節主題有關的列。\n\n${rows.length ? `${reviewHeader}\n${rows.join('\n')}` : '（沒有過門檻的住客評論。）'}`,
  ].join('\n\n') + '\n'
  const task = `# 這次要寫的小節：${n.title}

這是〈旭川住宿〉這一頁裡「旭川飯店怎麼挑，依需求選」底下的一個小節。照 \`stay-page.md\`「版面」的「依需求選的小節」寫，從事實表直接寫，沒有舊稿。

這一頁後面，主要的飯店各有自己的段落會講細節，所以這裡只要讓讀者知道「我這種需求該看哪幾間、哪幾間要小心」。

## 輸出

第一行是 \`### ${n.title}\`，接著是內文。不要加說明、筆記或事實編號。
`
  write(n.id, task, facts)
  console.log(n.id, '可用評論', rows.length)
}

// 其他飯店：評論換成 Google 補讀後過門檻的列
{
  const rows = usableRows(path.join(reviewsDir, 'others.md'))
  const notes = [...COMMON, ...v3Header('others').split('\n').filter(Boolean).map((l) => l.replace('只有 Tabist、Tetora、露櫻一條通、Y\'s、吳竹、旭川Toyo 有住客評論可用，每間最多帶一句。', '住客評論只能用下面「住客評論歸納」裡的列，每間最多帶一句。'))]
  const facts = [
    '# 沒有自己段落的其他飯店｜這一節的事實表',
    `## 用這份事實表前要知道\n\n${numbered(notes)}`,
    ...v3OfficialSections('others'),
    `## 住客評論歸納\n\n${rows.length ? `${reviewHeader}\n${rows.join('\n')}` : '（沒有過門檻的住客評論。）'}`,
  ].join('\n\n') + '\n'
  const task = read(path.join(v3, 'others', 'TASK.md'))
    .replace('寫法照 `RULES.md` 的「句子」「用語」「內容」。', '寫法照 `stay-page.md` 的「句子」「用語」「內容」。')
    .replace('用 Write 工具寫到指定的檔案，內容：', '內容：')
  write('others', task, facts)
  console.log('others 可用評論', rows.length)
}

// 開頭與郊外：沒有要補的評論，事實表照雲端（開頭那一列 4travel 評論不放）
for (const id of ['intro', 'suburb']) {
  // 這兩段的事實表之後手動補過（開頭的 OMO7 巴士說明、郊外的上架確認），已經有就不覆蓋
  if (existsSync(path.join(here, id, 'facts.md'))) { console.log(id, '已存在，不覆蓋'); continue }
  let facts = read(path.join(v3, id, 'facts.md'))
  facts = facts.split('\n').filter((l) => !/^\| R\d+ \|/.test(l)).join('\n')
  const task = read(path.join(v3, id, 'TASK.md'))
    .replaceAll('`RULES.md`', '`stay-page.md`')
    .replace('用 Write 工具寫到指定的檔案，內容：', '內容：')
    .replace('用 Write 工具寫到指定的檔案。', '')
  write(id, task, facts)
  console.log(id, 'ok')
}
