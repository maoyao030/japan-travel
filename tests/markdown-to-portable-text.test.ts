import assert from 'node:assert/strict'
import test from 'node:test'

import {linkBareUrls, parseMarkdownBody} from '../scripts/markdown-to-portable-text.mjs'

test('延伸資料的名稱變成連結，網址不另外顯示', () => {
  assert.equal(
    linkBareUrls('**運賃表**，各艙等的票價。https://heartlandferry.jp/faretable/'),
    '[運賃表](https://heartlandferry.jp/faretable/)，各艙等的票價。',
  )
  // 句尾漏了句號時補上
  assert.equal(
    linkBareUrls('**稚內～禮文島時刻表**，各季的開船與到港時間 https://heartlandferry.jp/timetable/time1/'),
    '[稚內～禮文島時刻表](https://heartlandferry.jp/timetable/time1/)，各季的開船與到港時間。',
  )
})

test('其他裸網址用網址當連結文字，已經是連結的不重複處理', () => {
  assert.equal(linkBareUrls('詳見 https://example.com/a 。'), '詳見 [https://example.com/a](https://example.com/a) 。')
  assert.equal(linkBareUrls('[官網](https://example.com/)'), '[官網](https://example.com/)')
})

test('轉換後延伸資料每條都有連結', () => {
  const {blocks} = parseMarkdownBody(
    ['# 標題', '', '## 延伸資料', '', '- **運航狀況**，當天是否停航。https://heartlandferry.jp/status/'].join('\n'),
  )
  const item = blocks[1]
  assert.equal(item.listItem, 'bullet')
  assert.deepEqual(item.markDefs.map((mark: {href: string}) => mark.href), ['https://heartlandferry.jp/status/'])
  assert.equal(item.children.map((child: {text: string}) => child.text).join(''), '運航狀況，當天是否停航。')
  assert.equal(item.children[0].marks[0], item.markDefs[0]._key)
})
