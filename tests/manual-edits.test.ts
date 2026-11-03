import assert from 'node:assert/strict'
import test from 'node:test'

import {
  addDays,
  buildManualEditsReport,
  compareAround,
  parseSearchConsoleCsv,
  summarizeEdits,
  taipeiDate,
} from '../scripts/manual-edits.mjs'

test('優化次數照台北日期算，後台與 Git 的紀錄合併去重', () => {
  assert.equal(taipeiDate('2026-11-03T17:30:00.000Z'), '2026-11-04')
  const articles = [
    {
      id: 'article-a',
      title: 'A 篇',
      path: '/places/a/',
      studioEditLog: [{at: '2026-11-03T01:00:00.000Z'}, {at: '2026-11-03T02:00:00.000Z'}],
    },
    {id: 'article-b', title: 'B 篇', path: '/places/b/'},
  ]
  const gitLog = {
    edits: [
      {article: 'article-a', publishTimes: ['2026-11-03T02:00:00.000Z', '2026-11-10T03:00:00.000Z']},
    ],
  }
  const [a, ...rest] = summarizeEdits(articles, gitLog)
  assert.equal(rest.length, 0)
  assert.equal(a.id, 'article-a')
  assert.equal(a.publishTimes.length, 3)
  assert.deepEqual(a.days, ['2026-11-03', '2026-11-10'])
})

test('成效比較優化前後各 28 天，不算優化當天', () => {
  const rows = parseSearchConsoleCsv(
    [
      'date,page,clicks,impressions,position',
      '2026-11-01,https://offpathnotes.com/places/a/,1,10,8',
      '2026-11-03,https://offpathnotes.com/places/a/,5,50,1',
      '2026-11-05,https://offpathnotes.com/places/a/,3,30,4',
      '2026-11-05,https://offpathnotes.com/places/b/,2,20,6',
    ].join('\n'),
  )
  const result = compareAround(rows, new Set(['/places/a/']), '2026-11-03', '2026-11-05')
  assert.deepEqual(result.before, {clicks: 1, impressions: 10, position: 8})
  assert.deepEqual(result.after, {clicks: 3, impressions: 30, position: 4})
  assert.equal(result.complete, false)
  assert.equal(result.afterEnd, addDays('2026-11-03', 28))
  assert.equal(compareAround(rows, new Set(['/places/a/']), '2026-11-03', '2026-12-01').complete, true)
})

test('報表列出優化過的文章，有資料時附上和沒優化文章的比較', () => {
  const summaries = [
    {id: 'article-a', title: 'A 篇', path: '/places/a/', publishTimes: ['2026-11-03T01:00:00.000Z'], days: ['2026-11-03']},
  ]
  const empty = buildManualEditsReport({summaries, livePaths: ['/places/a/', '/places/b/'], rows: null, today: '2026-11-03'})
  assert.match(empty, /\| \[A 篇\]\(https:\/\/offpathnotes\.com\/places\/a\/\) \| 1 \| 1 \| 2026-11-03 \|/)
  assert.match(empty, /還沒有 Search Console 資料/)

  const rows = [
    {date: '2026-11-01', page: 'https://offpathnotes.com/places/a/', clicks: 1, impressions: 10, position: 8},
    {date: '2026-11-04', page: 'https://offpathnotes.com/places/a/', clicks: 4, impressions: 20, position: 5},
    {date: '2026-11-01', page: 'https://offpathnotes.com/places/b/', clicks: 1, impressions: 10, position: 9},
    {date: '2026-11-04', page: 'https://offpathnotes.com/places/b/', clicks: 1, impressions: 11, position: 9},
  ]
  const report = buildManualEditsReport({summaries, livePaths: ['/places/a/', '/places/b/'], rows, today: '2026-11-05'})
  assert.match(report, /\| A 篇 \| 2026-11-03 \| 1→4（\+300%） \| 10→20（\+100%） \| 8\.0→5\.0 \| \+10% \| 累積中，2026-12-01 後再看 \|/)
})
