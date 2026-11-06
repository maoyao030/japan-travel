import assert from 'node:assert/strict'
import test from 'node:test'

import {renderContentTable, tableLayout, type ContentTable} from '../src/lib/portableText.ts'

const table = (columns: string[], rows: string[][]): ContentTable => ({
  _type: 'contentTable',
  columns,
  rows: rows.map((cells) => ({cells})),
})

test('表格在手機上的樣子：比較表變卡片、時刻表維持表格、小表格縮到螢幕寬', () => {
  const stay = table(['住宿', '區域', '離車站或港口', '訂房管道', '連結'], [
    ['多美迎稚內', 'JR稚內站周邊', 'JR稚內站走路約3分鐘', '官網、Trip.com、Agoda', '[官網](https://example.jp/)・[地圖](https://example.jp/map)'],
  ])
  const timetable = table(['旭川站', '旭川機場', '道草館', '到旭岳'], [['7:15', '7:50', '8:20', '9:00']])
  const info = table(['項目', '內容'], [['日文名', '宗谷岬']])

  assert.equal(tableLayout(stay), 'cards')
  assert.equal(tableLayout(timetable), 'wide')
  assert.equal(tableLayout(info), 'narrow')

  const html = renderContentTable(stay)
  assert.match(html, /class="article-table-scroll article-table--cards"/)
  assert.match(html, /<td data-label="離車站或港口"><span>JR稚內站走路約3分鐘<\/span><\/td>/)
  assert.doesNotMatch(renderContentTable(timetable), /data-label/)
})

test('天氣表、日數表、步道表的判斷', () => {
  assert.equal(tableLayout(table(['月份', '平均氣溫', '日最高', '降水量'], [['1月', '-8.4°C', '-4.3°C', '32.6mm']])), 'wide')
  assert.equal(tableLayout(table(['月份', '2023年', '2024年', '2025年'], [['1月', '3天', '6天', '3天']])), 'wide')
  assert.equal(
    tableLayout(table(['步道', '起點到終點', '距離', '參考時間', '難度', '起訖點怎麼去'], [['桃岩展望台步道', '桃岩登山口到知床', '5.7公里', '3小時', '★★', '登山口從渡輪站走約40分鐘']])),
    'cards',
  )
  assert.equal(tableLayout(table(['期間', '平均氣溫', '渡輪', '景點與活動'], [['6月～8月', '15°C', '往利尻島、禮文島的渡輪班次一年裡最多', '高山植物的花季步道與夏季祭典都在這時候']])), 'cards')
  assert.equal(tableLayout(table(['旅館', '區域', '位置', '連結'], [['甲旅館', '溫泉街', '巴士總站走路3分鐘', '[官網](https://a.jp/)・[地圖](https://b.jp/)']])), 'cards')
})

test('欄名裡的引號會被跳脫', () => {
  const html = renderContentTable(table(['名"稱', 'B', 'C', 'D'], [['很長的店名在這裡', '很長的地址在這裡', '很長的說明在這裡', '很長的備註在這裡']]))
  assert.match(html, /data-label="名&quot;稱"/)
})
