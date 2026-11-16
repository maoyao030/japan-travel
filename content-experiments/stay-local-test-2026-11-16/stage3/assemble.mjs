/**
 * 第 3 階段：把各段編輯稿組成整篇旭川住宿。
 * 段落來源：stage3/<段>/edited.md；Dormy Inn 用 stage1，OMO7 與「想泡溫泉」用 stage2。
 * 比較表、款待券、住宿稅、延伸資料沿用 v2（照 v3 的兩處修正），比較表「怎麼訂」欄改成 listing-check.md（2026-11-16）的結果。
 * 用法：node stage3/assemble.mjs → 輸出 stage3/assembled.md
 */
import {readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'

const here = import.meta.dirname
const root = path.join(here, '..')
const v3dir = path.join(root, '..', 'asahikawa-stay-full-2026-11-12', 'v3')
const read = (p) => readFileSync(p, 'utf8')
const clean = (text) => text.split(/\n## 編輯改了什麼/)[0].trim()
const piece = (id) => {
  if (id === 'dormy-inn') return clean(read(path.join(root, 'stage1', 'dormy-inn', 'edited.md')))
  if (id === 'omo7' || id === 'need-bath') return clean(read(path.join(root, 'stage2', id, 'edited.md')))
  return clean(read(path.join(here, id, 'edited.md')))
}

const v2 = read(path.join(v3dir, '..', 'v2', 'reader-preview.md'))
const section = (heading) => {
  const start = v2.indexOf(`\n## ${heading}`)
  if (start === -1) throw new Error(`v2 找不到 ${heading}`)
  const end = v2.indexOf('\n## ', start + 5)
  return v2.slice(start + 1, end === -1 ? undefined : end).trim()
}

// 比較表「怎麼訂」欄：Trip.com「有」才寫；Agoda「有」才寫（連鎖館的「疑似有」沿用 v2 已寫的）。
// 旭川Sun Hotel 兩個 Trip.com 頁互相衝突、龍乃湯溫泉的 Trip.com 頁還沒核對，先不寫。
const HOW_TO_BOOK = {
  'Y\'s Hotel旭川站前': 'Trip.com、Agoda、官網',
  'KOKO HOTEL旭川站前': 'Trip.com、官網',
  'Court Hotel旭川': 'Trip.com、Agoda、官網',
  'Hotel WBF Grande旭川': 'Trip.com、Agoda；官網只能電話或聯絡表單',
  '9C Hotel旭川': 'Trip.com、Agoda、官網',
  'Super Hotel旭川': 'Trip.com、Agoda、官網',
  'Tabist旭川Station Hotel': 'Trip.com、官網',
  'R Hotels Inn北海道旭川': 'Trip.com、Agoda、官網',
  'Hotel Tetora旭川站前': 'Trip.com、Agoda、官網',
  'Hotel Mates旭川': 'Trip.com',
  '吳竹Inn旭川': 'Trip.com、Agoda',
  'Asahikawa Ride': 'Trip.com、官網',
  'Hotel Crescent旭川': 'Trip.com、Agoda、官網',
  '旭川Toyo Hotel': 'Trip.com、Agoda、官網',
  'Platon Hotel': 'Trip.com、電話',
  '扇松園': 'Trip.com、官網，也可打電話',
  '高砂溫泉': 'Trip.com、官網，也可打電話',
}
let table = section('旭川住宿比較表')
  .replace('24小時內進出一次免費 |', '24小時內進出一次免費，經濟方案除外 |')
  .replace('飯店資訊的查核日期是2026年11月12日。', '飯店資訊的查核日期是2026年11月12日，訂房網站有沒有上架是2026年11月16日確認。')
const seen = new Set()
table = table.split('\n').map((line) => {
  if (!line.startsWith('| ') || !line.includes('[官網]')) return line
  const cells = line.split('|')
  const name = cells[1].trim()
  if (HOW_TO_BOOK[name]) {
    cells[6] = ` ${HOW_TO_BOOK[name]} `
    seen.add(name)
  }
  return cells.join('|')
}).join('\n')
const missing = Object.keys(HOW_TO_BOOK).filter((name) => !seen.has(name))
if (missing.length) throw new Error(`比較表找不到：${missing.join('、')}`)

const coupon = section('住旭川可以買動物園款待券？').replace('，入園後不限停留時間。', '。')
const hotelSources = table.split('\n')
  .filter((line) => line.startsWith('| ') && line.includes('[官網]'))
  .map((row) => `- [${row.split('|')[1].trim()}官網](${row.match(/\[官網\]\(([^)]+)\)/)[1]})`)

const sources = `## 資料來源

飯店資訊查核日期：2026年11月12日；訂房網站上架情形：2026年11月16日。

住客的說法整理自Google地圖、4travel與Trip.com的住客評論，2026年11月12日與16日查，只寫兩個平台以上、三則以上都提到的。

- [旭川市住宿稅說明（旭川市）](https://www.city.asahikawa.hokkaido.jp/kurashi/112/113/1145/d083569.html)
- [北海道住宿稅說明（北海道）](https://www.pref.hokkaido.lg.jp/sm/zim/tax/218623.html)
- [旭山動物園門票與款待券（旭川市）](https://www.city.asahikawa.hokkaido.jp/asahiyamazoo/generalinformation/d052849.html)
- [款待券販售處名單（旭川市）](https://www.city.asahikawa.hokkaido.jp/asahiyamazoo/generalinformation/d052849_d/fil/hotelnadohanndai.pdf)
- [旭山動物園款待券（旭川觀光會議協會）](http://www.atca.jp/omotenashi/)
- [旭川站前乘車處介紹（旭川電氣軌道）](https://www.asahikawa-denkikidou.jp/manage/wp-content/uploads/2026/05/ekimaenoriba_2026.05.10-.pdf)
- [平和通買物公園（旭川市）](https://www.city.asahikawa.hokkaido.jp/kankou/2100/d053286.html)
${hotelSources.join('\n')}`

const others = piece('others')
const [stationOthers, centerOthers] = others.split(/\n(?=### 市中心的其他飯店)/)
if (!centerOthers) throw new Error('others 缺「### 市中心的其他飯店」')

const parts = [
  '# 旭川住宿推薦，站前與市中心怎麼選，停車、溫泉與早餐比較',
  piece('intro'),
  '## 旭川飯店怎麼挑，依需求選',
  piece('need-parking'), piece('need-bath'), piece('need-breakfast'), piece('need-group'),
  table,
  '## 旭川站前的飯店',
  ...['jr-inn', 'cabin', 'wbf-grande', 'route-inn-grand', 'super-hotel', 'amanek', 'court', 'toyoko', '9c'].map(piece),
  stationOthers.trim(),
  '## 旭川市中心的飯店',
  ...['dormy-inn', 'omo7', 'art-hotel', 'crescent'].map(piece),
  centerOthers.trim(),
  piece('suburb'),
  coupon,
  section('旭川住宿稅怎麼算？'),
  section('延伸資料'),
  sources,
]
const out = parts.join('\n\n') + '\n'
writeFileSync(path.join(here, 'assembled.md'), out)
console.log('字數', out.replace(/\s|https?:\S+/g, '').length)
