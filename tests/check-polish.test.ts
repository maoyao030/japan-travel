import assert from 'node:assert/strict'
import test from 'node:test'

import {checkPolish, pendingLinkSentences} from '../.agents/skills/japan-travel-polish/scripts/check-polish.mjs'

const before = [
  '# 渡輪',
  '',
  '開頭說末班船17:10[F2]。',
  '',
  '## 票價',
  '',
  '2等3,590日圓[F14]。末班船17:10[F2]。',
  '',
  '### 船上',
  '',
  'アマポーラ宗谷有行李間[F221]。',
].join('\n')

test('整篇事實一樣時，跨小節刪重複只列出來，不算錯', () => {
  const after = before.replace('2等3,590日圓[F14]。末班船17:10[F2]。', '2等3,590日圓[F14]。')
  const result = checkPolish(before, after)
  assert.equal(result.status, 'polish_safe')
  assert.ok(result.moves.some((move) => move.includes('票價') && move.includes('F2')))
})

test('整篇少了數字或日文就不通過；日文只比連續假名', () => {
  const lost = checkPolish(before, before.replace('17:10[F2]。', '[F2]。').replace('末班船17:10[F2]。', '末班船[F2]。'))
  assert.equal(lost.status, 'polish_changed_facts')
  assert.match(lost.issues.join('\n'), /整篇數字少了：17:10/)
  const reworded = checkPolish(before, before.replace('アマポーラ宗谷有行李間', 'アマポーラ宗谷號有免費行李間'))
  assert.equal(reworded.status, 'polish_safe', reworded.issues.join('\n'))
})

test('研究記錄的待補內連句要原樣保留，句尾括號註記不算', () => {
  const review = [
    '### 待補內連',
    '',
    '| 正文句子（照大綱，字不改） | 目標頁 ID | 所在小節 |',
    '|---|---|---|',
    '| 兩島的先後順序與天數，整理在利尻島。（大綱外，第 5 輪加入） | `rishiri-island` | 島間航線 |',
    '',
    '### 其他',
    '',
    '| 不是連結句。 | x | y |',
  ].join('\n')
  const sentences = pendingLinkSentences(review)
  assert.deepEqual(sentences, ['兩島的先後順序與天數，整理在利尻島。'])
  const result = checkPolish(before, before, {linkSentences: sentences})
  assert.match(result.issues.join('\n'), /內連句沒有原樣出現：兩島的先後順序與天數，整理在利尻島。/)
})
