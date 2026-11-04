import assert from 'node:assert/strict'
import test from 'node:test'

import {addLinksToBody, addLinksToMarkdown, linkCell, mapsUrl} from '../scripts/table-links.mjs'

test('連結格子：有官網放官網＋地圖，沒有官網只放地圖', () => {
  assert.equal(mapsUrl('宗谷岬 稚内市'), 'https://www.google.com/maps/search/?api=1&query=%E5%AE%97%E8%B0%B7%E5%B2%AC%20%E7%A8%9A%E5%86%85%E5%B8%82')
  assert.equal(linkCell({official: 'https://a.jp/', mapQuery: 'A'}), '[官網](https://a.jp/)・[地圖](https://www.google.com/maps/search/?api=1&query=A)')
  assert.equal(linkCell({official: null, mapQuery: 'A'}), '[地圖](https://www.google.com/maps/search/?api=1&query=A)')
})

test('線上表格加連結：景點欄加一列、住宿表加一欄，重跑不重複', () => {
  const body = [
    {_key: 'p', _type: 'block'},
    {_key: 'i', _type: 'contentTable', columns: ['項目', '內容'], rows: [{_key: 'r1', _type: 'contentTableRow', cells: ['日文名', '宗谷岬']}]},
    {_key: 's', _type: 'contentTable', columns: ['名稱', '訂房管道'], rows: [{_key: 'r2', _type: 'contentTableRow', cells: ['甲', '官網']}, {_key: 'r3', _type: 'contentTableRow', cells: ['乙', 'Trip.com']}]},
  ]
  const plan = {infoBoxes: [{tableKey: 'i', official: null, mapQuery: '宗谷岬'}], stayTables: [{tableKey: 's', rows: {甲: {official: 'https://a.jp/', mapQuery: '甲'}}}]}
  const first = addLinksToBody(body, plan)
  assert.equal(first.body[1].rows.at(-1).cells[0], '連結')
  assert.deepEqual(first.body[2].columns, ['名稱', '訂房管道', '連結'])
  assert.equal(first.body[2].rows[1].cells[2], '')
  assert.deepEqual(first.missing, [{table: 's', name: '乙'}])
  const again = addLinksToBody(first.body, plan)
  assert.deepEqual(again.body, first.body)
  assert.equal(again.done.length, 0)
})

test('Git 稿件加連結：用日文名對景點欄、用名稱對住宿列', () => {
  const md = ['段落', '', '| 項目 | 內容 |', '|---|---|', '| 日文名 | 宗谷岬 |', '', '| 名稱 | 訂房管道 |', '|---|---|', '| 甲 | 官網 |'].join('\n')
  const result = addLinksToMarkdown(md, [{ja: '宗谷岬', cell: '[地圖](x)'}], new Map([['甲', '[官網](y)']]))
  assert.equal(
    result,
    ['段落', '', '| 項目 | 內容 |', '|---|---|', '| 日文名 | 宗谷岬 |', '| 連結 | [地圖](x) |', '', '| 名稱 | 訂房管道 | 連結 |', '|---|---|---|', '| 甲 | 官網 | [官網](y) |'].join('\n'),
  )
})
