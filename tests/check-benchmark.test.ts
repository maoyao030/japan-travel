import assert from 'node:assert/strict'
import test from 'node:test'

import {headingProblems, nameProblems, numbersMissing, recommendationWarnings, tableLinkProblems} from '../scripts/check-benchmark.mjs'

test('標竿檢查：數字不見會被抓到，網址裡的數字不算', () => {
  const before = '# A\n\n末班車19:42，車資880日圓。https://x.jp/2026/05/a.pdf'
  assert.deepEqual(numbersMissing(before, '# A\n\n末班車19:42，車資880日圓。'), [])
  assert.deepEqual(numbersMissing(before, '# A\n\n末班車19:42。'), ['880日圓（原本 1 次，現在 0 次）'])
})

test('標竿檢查：標題跳級、宣傳語、H2 沒地名', () => {
  const md = '# 東川町景點，道草館不能錯過\n\n## 東川怎麼去？\n\n#### 細節\n\n## 交通方式'
  const problems = headingProblems(md, '東川')
  assert.ok(problems.some((p) => p.includes('宣傳語')))
  assert.ok(problems.some((p) => p.includes('跳級')))
  assert.ok(problems.some((p) => p.includes('「交通方式」')))
})

test('標竿檢查：景點欄與住宿表要有連結', () => {
  const md = '| 項目 | 內容 |\n|---|---|\n| 日文名 | 宗谷岬 |\n\n| 名稱 | 訂房管道 |\n|---|---|\n| 甲 | 官網 |'
  assert.equal(tableLinkProblems(md).length, 2)
})

test('標竿檢查：舊寫法與原文括號、推薦句數', () => {
  const terms = [{ja: 'うろこ亭', zh: '鱗亭', previousZh: 'Uroko亭'}, {ja: 'せんとぴゅあ', zh: '仙都皮亞'}]
  const result = nameProblems('# A\n\nUroko亭在港邊，仙都皮亞在北町。', terms)
  assert.equal(result.errors.length, 1)
  assert.equal(result.warnings.length, 1)
  assert.equal(recommendationWarnings('# A\n\n## 甲\n\n如果有到這裡可以試試。喜歡的人蠻值得來看看。').length, 1)
})
