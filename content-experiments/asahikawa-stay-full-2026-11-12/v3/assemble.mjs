/** 把 20 段編輯稿組成整篇。比較表、款待券、住宿稅、延伸資料取自第二版並修掉查核抓到的問題。用法：node v3/assemble.mjs */
import {readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'
const dir = import.meta.dirname
const piece = (id) => readFileSync(path.join(dir, 'pieces', id, 'edited.md'), 'utf8').split(/\n## 編輯改了什麼/)[0].trim()
const v2 = readFileSync(path.join(dir, '..', 'v2', 'reader-preview.md'), 'utf8')
const section = (heading) => {
  const start = v2.indexOf(`\n## ${heading}`)
  const end = v2.indexOf('\n## ', start + 5)
  return v2.slice(start + 1, end === -1 ? undefined : end).trim()
}
const others = piece('others')
const [stationOthers, centerOthers] = others.split(/\n(?=### 市中心的其他飯店)/)
let table = section('旭川住宿比較表')
  .replace('24小時內進出一次免費 |', '24小時內進出一次免費，經濟方案除外 |')
let coupon = section('住旭川可以買動物園款待券？').replace('，入園後不限停留時間。', '。')
const rows = table.split('\n').filter((line) => line.startsWith('| ') && line.includes('[官網]'))
const hotelSources = rows.map((row) => {
  const name = row.split('|')[1].trim()
  const url = row.match(/\[官網\]\(([^)]+)\)/)[1]
  return `- [${name}官網](${url})`
})
const sources = `## 資料來源

飯店資訊查核日期：2026年11月12日。

住客的說法整理自4travel的住客評論，2026年11月12日查。

- [旭川市住宿稅說明（旭川市）](https://www.city.asahikawa.hokkaido.jp/kurashi/112/113/1145/d083569.html)
- [北海道住宿稅說明（北海道）](https://www.pref.hokkaido.lg.jp/sm/zim/tax/218623.html)
- [旭山動物園門票與款待券（旭川市）](https://www.city.asahikawa.hokkaido.jp/asahiyamazoo/generalinformation/d052849.html)
- [款待券販售處名單（旭川市）](https://www.city.asahikawa.hokkaido.jp/asahiyamazoo/generalinformation/d052849_d/fil/hotelnadohanndai.pdf)
- [旭山動物園款待券（旭川觀光會議協會）](http://www.atca.jp/omotenashi/)
- [旭川站前乘車處介紹（旭川電氣軌道）](https://www.asahikawa-denkikidou.jp/manage/wp-content/uploads/2026/05/ekimaenoriba_2026.05.10-.pdf)
- [平和通買物公園（旭川市）](https://www.city.asahikawa.hokkaido.jp/kankou/2100/d053286.html)
${hotelSources.join('\n')}`
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
writeFileSync(path.join(dir, 'assembled.md'), parts.join('\n\n') + '\n')
console.log('字數', parts.join('').replace(/\s|https?:\S+/g, '').length)
