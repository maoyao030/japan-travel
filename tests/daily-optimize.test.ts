import assert from 'node:assert/strict'
import test from 'node:test'

import {aspectOf, buildDailyMessage, paragraphHints, pickForDay, rankCandidates} from '../scripts/daily-optimize.mjs'

const article = (id: string, slug: string, publishedAt: string, extra = {}) => ({
  id,
  slug,
  title: `${id} 標題`,
  path: `/places/x/${slug}/`,
  publishedAt,
  body: [],
  ...extra,
})

test('還沒優化的上線文章照頁型排，住宿最前；優化過與沒開放搜尋的不列', () => {
  const ranked = rankCandidates([
    article('article-x-weather', 'weather', '2026-10-20'),
    article('article-x-stay', 'stay', '2026-10-25'),
    article('article-x-ferry', 'ferry', '2026-10-21'),
    article('article-x', 'x', '2026-10-19'),
    article('article-y-stay', 'stay', '2026-10-22', {studioEditLog: [{at: '2026-11-03T01:00:00Z'}]}),
    article('article-z-stay', 'stay', '2026-10-22', {noindex: true}),
  ])
  assert.deepEqual(
    ranked.map((item: {id: string}) => item.id),
    ['article-x-stay', 'article-x-ferry', 'article-x-weather', 'article-x'],
  )
  assert.equal(aspectOf({slug: 'sights'}), 'sight')
  assert.equal(aspectOf({slug: 'rebun-island'}), 'other')
})

test('每天換下一篇；優化掉一篇後隔天接著下一篇，不跳過', () => {
  const list = ['a', 'b', 'c']
  assert.equal(pickForDay(list, '2026-11-04'), 'a')
  assert.equal(pickForDay(list, '2026-11-05'), 'b')
  assert.equal(pickForDay(list, '2026-11-07'), 'a')
  // 11/4 優化了 a，11/5 清單剩 b、c，輪到 b
  assert.equal(pickForDay(['b', 'c'], '2026-11-05', 1), 'b')
  assert.equal(pickForDay([], '2026-11-05'), null)
})

test('提醒訊息附網站與後台連結，並指出逗號最多的段落', () => {
  const dense = '這段很長，逗號很多，讀起來會卡，因為每一句都接了好幾個條件，再加上一些說明，最後才講到重點。下一句也一樣，接了條件，又接了例外，還有補充。'
  const plain = '這段比較短也比較順。只是為了湊滿六十個字所以多寫幾句。沒有什麼逗號。讀起來很輕鬆。再多寫一句就好了。真的。'
  const body = [dense, plain].map((text, index) => ({
    _type: 'block',
    style: 'normal',
    children: [{_type: 'span', text}],
    _key: `b${index}`,
  }))
  assert.equal(paragraphHints(body)[0].text, dense)
  const message = buildDailyMessage({
    articles: [article('article-x-stay', 'stay', '2026-10-25', {body})],
    day: '2026-11-04',
  })
  assert.match(message, /這篇還沒優化：article-x-stay 標題/)
  assert.match(message, /https:\/\/offpathnotes\.com\/places\/x\/stay\//)
  assert.match(message, /https:\/\/offpathnotes\.sanity\.studio\/structure\/live-articles;article-x-stay/)
  assert.match(message, /1\. 「這段很長/)
  assert.match(buildDailyMessage({articles: [], day: '2026-11-04'}), /都手動優化過了/)
})
