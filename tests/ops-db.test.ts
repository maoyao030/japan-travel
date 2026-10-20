import assert from 'node:assert/strict'
import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import {
  acquireAutoPublisherLock,
  getAutoPublisherLock,
  releaseAutoPublisherLock,
} from '../scripts/manage-auto-publisher-lock.mjs'
import {checkProxySetting, createHttpExecutor, createOpsExecutor, readOpsDatabaseConfig, sqlLiteral} from '../scripts/ops-db.mjs'
import {finishRun, startRun} from '../scripts/ops-run.mjs'
import {collectSheetUpdate, markSheetSynced} from '../scripts/ops-sheet-sync.mjs'

const projectRoot = path.resolve(import.meta.dirname, '..')
const migrationsDir = path.join(projectRoot, 'd1', 'migrations')

type Execute = (statements: string[]) => Promise<Record<string, any>[][]>

// 用 Node 內建的 SQLite 跑同一份 migration，模擬 D1；沒有 node:sqlite 的環境就略過。
async function openTestDatabase(): Promise<{execute: Execute; run: (sql: string) => void} | null> {
  let DatabaseSync: any
  try {
    ;({DatabaseSync} = await import('node:sqlite'))
  } catch {
    return null
  }
  const db = new DatabaseSync(':memory:')
  for (const file of (await readdir(migrationsDir)).filter((name) => name.endsWith('.sql')).sort()) {
    db.exec(await readFile(path.join(migrationsDir, file), 'utf8'))
  }
  return {
    execute: async (statements) => statements.map((statement) => db.prepare(statement).all()),
    run: (sql) => db.exec(sql),
  }
}

test('SQL 字面值會跳脫單引號並拒絕不支援的值', () => {
  assert.equal(sqlLiteral("O'Brien"), "'O''Brien'")
  assert.equal(sqlLiteral(null), 'NULL')
  assert.equal(sqlLiteral(3), '3')
  assert.throws(() => sqlLiteral(Number.NaN))
  assert.throws(() => sqlLiteral('a\u0000b'))
  assert.throws(() => sqlLiteral({} as any))
})

test('D1 執行鎖同一時間只給一個執行者，逾時才能接手', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {execute} = db
  const start = new Date('2026-10-17T00:00:00Z')

  const first = await acquireAutoPublisherLock({execute, staleAfterHours: 2, ownerLabel: 'first', now: start})
  assert.equal(first.status, 'acquired')

  const second = await acquireAutoPublisherLock({
    execute,
    staleAfterHours: 2,
    ownerLabel: 'second',
    now: new Date('2026-10-17T01:00:00Z'),
  })
  assert.equal(second.status, 'busy')
  assert.equal(second.owner?.ownerLabel, 'first')

  const later = new Date('2026-10-17T03:00:00Z')
  assert.equal((await getAutoPublisherLock({execute, now: later})).status, 'stale')
  const takeover = await acquireAutoPublisherLock({execute, staleAfterHours: 2, ownerLabel: 'third', now: later})
  assert.equal(takeover.status, 'acquired')
  assert.equal(takeover.owner?.replacedStaleOwner?.ownerLabel, 'first')

  assert.equal((await releaseAutoPublisherLock({execute, token: 'wrong'})).status, 'token-mismatch')
  assert.equal((await releaseAutoPublisherLock({execute, token: takeover.token})).status, 'released')
  assert.equal((await releaseAutoPublisherLock({execute, token: takeover.token})).status, 'missing')
  assert.equal((await getAutoPublisherLock({execute, now: later})).status, 'free')
})

test('每輪紀錄可以開始與結束，種類與結果要在允許清單內', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {execute} = db
  const run = await startRun({execute, kind: 'produce', articleId: 'rebun-island-transport'})
  const finished = await finishRun({execute, runId: run.runId, result: 'accepted'})
  assert.equal(finished.status, 'finished')
  assert.equal(finished.result, 'accepted')
  assert.equal((await finishRun({execute, runId: 'missing', result: 'done'})).status, 'missing')
  await assert.rejects(startRun({execute, kind: 'nap'}))
  await assert.rejects(finishRun({execute, runId: run.runId, result: 'great'}))
})

test('規劃總表同步會列出未同步的例外與即將重查的事實，標記後不再重複', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {execute, run} = db
  const now = new Date('2026-10-17T00:00:00Z')

  run(`
    INSERT INTO exceptions (created_at, kind, subject, detail, action_needed)
      VALUES ('2026-10-16T02:00:00Z', 'parked', 'rebun-island-food', '查不到可以吃海膽丼的店', '決定要不要維持短頁');
    INSERT INTO facts (fact_id, place_id, change_type, source_url, evidence_path, last_checked_at, next_check_at, updated_at) VALUES
      ('rebun-island:F1', 'rebun-island', 'timetable', 'https://example.invalid/ferry', 'content-planning/x.json', '2026-10-01', '2026-11-01', '2026-10-01'),
      ('rebun-island:F2', 'rebun-island', 'price', 'https://example.invalid/ferry', 'content-planning/x.json', '2026-10-01', '2026-11-10', '2026-10-01'),
      ('rebun-island:F3', 'rebun-island', 'stay', 'https://example.invalid/hotel', 'content-planning/x.json', '2026-10-01', '2027-10-01', '2026-10-01'),
      ('rebun-island:F4', 'rebun-island', 'stable', 'https://example.invalid/hotel', 'content-planning/x.json', '2026-10-01', NULL, '2026-10-01');
    INSERT INTO fact_usage (fact_id, article_id) VALUES
      ('rebun-island:F1', 'rebun-island-transport'), ('rebun-island:F1', 'rebun-island'), ('rebun-island:F2', 'rebun-island-transport');
  `)

  const collected = await collectSheetUpdate({execute, now, triggerIntervalHours: 3})
  assert.equal(collected.sheetName, '例外與更新')
  assert.deepEqual(collected.exceptionIds, [1])
  assert.deepEqual(collected.noticeKeys, ['due:rebun-island:2026-11'])
  assert.equal(collected.appendRows.length, 2)
  assert.deepEqual(collected.appendRows[0].slice(0, 3), ['2026-10-16', '停放', 'rebun-island-food'])
  assert.match(collected.appendRows[1][3], /2 筆事實到期（班表 1、價格 1），用在 2 頁，最早 2026-11-01/)
  assert.equal(collected.lastRunStartedAt, null)

  await markSheetSynced({execute, exceptionIds: collected.exceptionIds, noticeKeys: collected.noticeKeys, now})
  const again = await collectSheetUpdate({execute, now, triggerIntervalHours: 3})
  assert.equal(again.appendRows.length, 0)
})

test('routine 太久沒有新紀錄時，同步會新增一筆「routine 沒在跑」的例外', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {execute} = db
  await startRun({execute, kind: 'produce', now: new Date('2026-10-16T00:00:00Z')})

  const fresh = await collectSheetUpdate({execute, now: new Date('2026-10-16T05:00:00Z'), triggerIntervalHours: 3})
  assert.equal(fresh.appendRows.length, 0)

  const stale = await collectSheetUpdate({execute, now: new Date('2026-10-17T00:00:00Z'), triggerIntervalHours: 3})
  assert.equal(stale.appendRows.length, 1)
  assert.equal(stale.appendRows[0][1], 'routine 沒在跑')

  const notDuplicated = await collectSheetUpdate({execute, now: new Date('2026-10-17T06:00:00Z'), triggerIntervalHours: 3})
  assert.deepEqual(notDuplicated.exceptionIds, stale.exceptionIds)
})

test('雲端用 REST API 連 D1：不帶權杖時不送 Authorization，交給 network secret 附上', async () => {
  const config = readOpsDatabaseConfig()
  assert.equal(config.databaseId, 'b8f3156c-5129-42db-b48e-85e179bf926b')
  const calls: any[] = []
  const fetchImpl = async (url: string, init: any) => {
    calls.push({url, init})
    return new Response(
      JSON.stringify({success: true, errors: [], result: [{success: true, results: [{owner: 'a'}]}, {success: true, results: []}]}),
      {status: 200, headers: {'content-type': 'application/json'}},
    )
  }
  // Cloudflare Workers Builds 的建置機器本身就帶 CLOUDFLARE_API_TOKEN；這裡要模擬「沒有權杖」，先暫時拿掉。
  const savedToken = process.env.CLOUDFLARE_API_TOKEN
  delete process.env.CLOUDFLARE_API_TOKEN
  let results
  try {
    const execute = createHttpExecutor({fetchImpl: fetchImpl as any, config})
    results = await execute(['SELECT owner FROM run_lock;', 'SELECT 1'])
  } finally {
    if (savedToken !== undefined) process.env.CLOUDFLARE_API_TOKEN = savedToken
  }
  assert.deepEqual(results, [[{owner: 'a'}], []])
  assert.equal(calls[0].url, `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`)
  assert.equal(calls[0].init.headers.authorization, undefined)
  assert.equal(JSON.parse(calls[0].init.body).sql, 'SELECT owner FROM run_lock;\nSELECT 1')

  const withToken = createHttpExecutor({fetchImpl: fetchImpl as any, config, token: 'local-test'})
  await withToken(['SELECT 1'])
  assert.equal(calls[1].init.headers.authorization, 'Bearer local-test')

  const failing = createHttpExecutor({
    fetchImpl: (async () =>
      new Response(JSON.stringify({success: false, errors: [{message: 'Authentication error'}]}), {status: 403})) as any,
    config,
    token: undefined,
  })
  await assert.rejects(failing(['SELECT 1']), /Authentication error/)
})

test('連線方式：--local 用本機、OPS_DB_TRANSPORT=http 用 REST API、其他用 wrangler', () => {
  assert.equal(typeof createOpsExecutor({local: true}), 'function')
  assert.equal(typeof createOpsExecutor({env: {OPS_DB_TRANSPORT: 'http'}}), 'function')
  assert.equal(typeof createOpsExecutor({env: {OPS_DB_TRANSPORT: 'http', HTTPS_PROXY: 'http://127.0.0.1:1', NODE_USE_ENV_PROXY: '1'}}), 'function')
  assert.throws(() => checkProxySetting({HTTPS_PROXY: 'http://127.0.0.1:1'}), /NODE_USE_ENV_PROXY=1/)
  assert.doesNotThrow(() => checkProxySetting({}))
  assert.equal(typeof createOpsExecutor({env: {}}), 'function')
})

test('文章生產狀態：事實錯誤可重寫一次，第二次停放並寫例外；架構問題直接停放', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {execute} = db
  const {startArticle, recordFailure, markAccepted, unparkArticle} = await import('../scripts/ops-article.mjs')
  const base = {execute, articleId: 'rebun-island-transport', groupId: 'hokkaido-wakkanai', targetPath: '/places/rebun-island/transport/'}

  assert.equal((await startArticle(base)).article.attempts, 1)
  const retry = await recordFailure({execute, articleId: base.articleId, kind: 'facts', reason: '班次寫錯'})
  assert.equal(retry.status, 'queued')
  assert.equal((await startArticle(base)).article.attempts, 2)
  const parked = await recordFailure({execute, articleId: base.articleId, kind: 'facts', reason: '班次又寫錯'})
  assert.equal(parked.status, 'parked')
  assert.equal((await startArticle(base)).status, 'refused')
  const [exceptions] = await execute(["SELECT kind, subject FROM exceptions WHERE subject = 'rebun-island-transport'"])
  assert.deepEqual(exceptions.map((row) => ({...row})), [{kind: 'parked', subject: 'rebun-island-transport'}])

  assert.equal((await unparkArticle({execute, articleId: base.articleId})).article.attempts, 0)
  await startArticle(base)
  assert.equal((await markAccepted({execute, articleId: base.articleId})).status, 'accepted')

  await startArticle({...base, articleId: 'rebun-island-food'})
  assert.equal((await recordFailure({execute, articleId: 'rebun-island-food', kind: 'needs-outline', reason: '分工不對'})).parkKind, 'needs-outline')
})

test('來源打不開先延後一天，連續延後超過 3 天就停放', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {execute} = db
  const {startArticle, recordFailure} = await import('../scripts/ops-article.mjs')
  const base = {execute, articleId: 'wakkanai-transport', groupId: 'g', targetPath: '/places/wakkanai/transport/'}
  const day = (n: number) => new Date(Date.parse('2026-10-17T00:00:00Z') + n * 86400000)

  await startArticle({...base, now: day(0)})
  const deferred = await recordFailure({execute, articleId: base.articleId, kind: 'source-unreachable', reason: '503', now: day(0)})
  assert.equal(deferred.status, 'deferred')
  assert.equal(deferred.article.attempts, 0)
  assert.equal((await startArticle({...base, now: day(0.5)})).status, 'refused')
  await startArticle({...base, now: day(2)})
  assert.equal((await recordFailure({execute, articleId: base.articleId, kind: 'source-unreachable', reason: '503', now: day(2)})).status, 'deferred')
  await startArticle({...base, now: day(4)})
  assert.equal((await recordFailure({execute, articleId: base.articleId, kind: 'source-unreachable', reason: '503', now: day(4)})).status, 'parked')
})

test('旅行群核准：意見與狀態優先，例外不默許，到自動核准日才默許', async (t) => {
  const {decideGroupState, evaluateGroup} = await import('../scripts/ops-group.mjs')
  const base = {autoApproveOn: '2026-10-24', today: '2026-10-20'}
  assert.equal(decideGroupState(base).state, 'awaiting-approval')
  assert.deepEqual(decideGroupState({...base, today: '2026-10-24'}), {state: 'approved', approvedBy: 'default'})
  assert.equal(decideGroupState({...base, today: '2026-10-24', exception: '新頁型'}).state, 'awaiting-approval')
  assert.equal(decideGroupState({...base, sheetComment: '利尻先不要做'}).state, 'changes-requested')
  assert.equal(decideGroupState({...base, sheetStatus: '暫停'}).state, 'paused')
  assert.deepEqual(decideGroupState({...base, sheetStatus: '已核准'}), {state: 'approved', approvedBy: 'darren', note: null})
  assert.equal(decideGroupState({...base, sheetStatus: '已核准', sheetComment: '利尻可以晚點寫'}).state, 'approved')

  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const result = await evaluateGroup({execute: db.execute, groupId: 'hokkaido-wakkanai', autoApproveOn: '2026-10-17', now: new Date('2026-10-17T02:00:00Z')})
  assert.equal(result.row.state, 'approved')
  assert.equal(result.row.approved_by, 'default')
})

test('每輪只做一件事：續做、補登記、補內連、規劃、核准檢查、生產、重查、摘要依序判斷', async () => {
  const {decideNextAction} = await import('../scripts/routine-next-action.mjs')
  const now = new Date('2026-10-20T00:00:00Z')
  const items = [
    {articleId: 'guide', groupId: 'g1', batchId: 'b1', targetPath: '/guides/x/', sanityStatus: 'published_indexable'},
    {articleId: 'a', groupId: 'g1', batchId: 'b2', targetPath: '/places/a/', sanityStatus: 'unpublished'},
    {articleId: 'b', groupId: 'g1', batchId: 'b2', targetPath: '/places/b/', sanityStatus: 'unpublished'},
  ]
  const groups = [{id: 'g1', autoApproveOn: '2026-10-19'}]
  const approved = {g1: {state: 'approved'}}
  const recent = '2026-10-19T00:00:00Z'
  const base = {items, groups, groupStates: approved, plannedToday: true, lastSummaryAt: recent, now}

  assert.equal(decideNextAction({...base, items: [{...items[1], sanityStatus: 'staged_noindex'}]}).action, 'resume')
  assert.equal(
    decideNextAction({...base, items: [{...items[1], sanityStatus: 'staged_noindex'}], articleStates: {a: {state: 'parked'}}}).action,
    'idle',
  )
  assert.equal(decideNextAction({...base, items: [{...items[1], sanityStatus: 'staged_noindex'}]}).resumeFrom, 'staged')
  const finalize = decideNextAction({...base, articleStates: {a: {state: 'accepted'}}})
  assert.deepEqual([finalize.action, finalize.resumeFrom, finalize.articleId], ['resume', 'finalize', 'a'])
  const landing = decideNextAction({...base, items: [{...items[1], routeMode: 'hub-landing', sanityStatus: 'staged_noindex'}]})
  assert.equal(landing.routeMode, 'hub-landing')
  const catchUp = decideNextAction({...base, articleStates: {guide: {state: 'accepted'}}})
  assert.deepEqual([catchUp.action, catchUp.articleId], ['catch-up', 'guide'])
  assert.equal(decideNextAction({...base, articleStates: {guide: {state: 'parked'}}}).action, 'produce')
  assert.equal(decideNextAction({...base, readyLinkCount: 1}).action, 'backfill-links')

  const produce = decideNextAction(base)
  assert.deepEqual([produce.action, produce.articleId, produce.batchId, produce.targetPath], ['produce', 'a', 'b2', '/places/a/'])
  assert.equal(decideNextAction({...base, articleStates: {a: {state: 'parked'}}}).articleId, 'b')
  assert.equal(decideNextAction({...base, articleStates: {a: {state: 'deferred', defer_until: '2026-10-21T00:00:00Z'}}}).articleId, 'b')

  assert.equal(decideNextAction({...base, plannedToday: false}).action, 'plan-next-group')
  assert.equal(decideNextAction({...base, plannedToday: false, dailyCap: 1, items: [...items, ...Array.from({length: 8}, (_, i) => ({...items[1], articleId: `x${i}`}))]}).action, 'produce')

  const awaiting = decideNextAction({...base, groupStates: {}})
  assert.deepEqual([awaiting.action, awaiting.groupId, awaiting.autoApproveOn], ['evaluate-group', 'g1', '2026-10-19'])
  const checked = {g1: {state: 'awaiting-approval', checkedToday: true}}
  assert.equal(decideNextAction({...base, groupStates: checked, dueFactCount: 2}).action, 'recheck-facts')
  assert.equal(decideNextAction({...base, groupStates: checked, lastSummaryAt: null}).action, 'weekly-summary')
  assert.equal(decideNextAction({...base, groupStates: checked}).action, 'idle')
  assert.equal(decideNextAction({...base, groupStates: {g1: {state: 'paused', checkedToday: false}}}).action, 'evaluate-group')

  assert.equal(decideNextAction({...base, remainingDailyCapacity: 0}).action, 'idle')
})

test('補內連只加連結標記，可見文字不變；找不到或不唯一就拒絕', async () => {
  const {addLinkToPortableText, visibleText, pendingLinksFromOutline} = await import('../scripts/link-backfill.mjs')
  const body = [
    {_type: 'block', _key: 'b1', style: 'normal', markDefs: [], children: [{_type: 'span', _key: 's1', text: '訂船票前先看渡輪訂票教學，再決定班次。', marks: []}]},
    {_type: 'block', _key: 'b2', style: 'normal', markDefs: [], children: [{_type: 'span', _key: 's2', text: '島上巴士只收現金。', marks: []}]},
  ]
  const result = addLinkToPortableText(body, {sourceArticleId: 'rebun-island-transport', targetPath: '/guides/heartland-ferry-booking/', anchorText: '渡輪訂票教學', sentence: '訂船票前先看渡輪訂票教學'})
  assert.equal(visibleText(result.body), visibleText(body))
  assert.equal(result.blockKey, 'b1')
  const block = result.body[0]
  assert.deepEqual(block.children.map((child: any) => child.text), ['訂船票前先看', '渡輪訂票教學', '，再決定班次。'])
  assert.equal(block.markDefs[0].href, '/guides/heartland-ferry-booking/')
  assert.throws(() => addLinkToPortableText(result.body, {targetPath: '/guides/heartland-ferry-booking/', anchorText: '渡輪訂票教學'}), /已經連到同一個網址/)
  assert.throws(() => addLinkToPortableText(body, {targetPath: '/x/', anchorText: '不存在的句子'}), /找不到連結句/)
  assert.throws(() => addLinkToPortableText(body, {targetPath: 'no-slash', anchorText: '巴士'}), /站內路徑/)

  const outline = {
    pages: [{articleId: 'rebun-island-transport', targetPath: '/places/rebun-island/transport/'}, {articleId: 'heartland-ferry-booking', targetPath: '/guides/heartland-ferry-booking/'}],
    links: [{from: 'rebun-island-transport', to: 'heartland-ferry-booking', purpose: '怎麼訂票', sentence: '訂船票前先看渡輪訂票教學', anchor: '渡輪訂票教學'}],
  }
  const pending = pendingLinksFromOutline({outline, articleId: 'rebun-island-transport', publishedArticleIds: ['rebun-island-transport']})
  assert.equal(pending.length, 1)
  assert.equal(pending[0].targetPath, '/guides/heartland-ferry-booking/')
  assert.equal(pendingLinksFromOutline({outline, articleId: 'rebun-island-transport', publishedArticleIds: ['heartland-ferry-booking']}).length, 0)
})

test('待補內連登記不重複，兩端都上線才列為可以補', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {registerPendingLinks, listReadyLinks, markLinked} = await import('../scripts/ops-links.mjs')
  const link = {fromArticleId: 'a', toArticleId: 'b', section: null, sentence: '先看 B 頁', anchorText: 'B 頁', targetPath: '/b/', source: 'outline'}
  await registerPendingLinks({execute: db.execute, links: [link]})
  await registerPendingLinks({execute: db.execute, links: [link]})
  const [rows] = await db.execute(['SELECT COUNT(*) AS n FROM pending_links'])
  assert.equal(rows[0].n, 1)
  assert.equal((await listReadyLinks({execute: db.execute, publishedArticleIds: ['a']})).length, 0)
  const ready = await listReadyLinks({execute: db.execute, publishedArticleIds: ['a', 'b']})
  assert.equal(ready.length, 1)
  assert.ok((await markLinked({execute: db.execute, linkId: ready[0].link_id}))?.linked_at)
  assert.equal((await listReadyLinks({execute: db.execute, publishedArticleIds: ['a', 'b']})).length, 0)
})

test('事實同步與重查：依來源網址分組列出到期事實，官方資料改變時寫例外', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {syncFacts, listDueFacts, recordCheck} = await import('../scripts/ops-facts.mjs')
  const table = {
    schemaVersion: 1,
    placeId: 'rebun-island',
    facts: [
      {factId: 'F1', claim: '班次', quote: 'q', sourceUrl: 'https://example.invalid/ferry', checkedAt: '2026-10-16', changeType: 'timetable', nextCheckAt: '2027-03-31'},
      {factId: 'F2', claim: '票價', quote: 'q', sourceUrl: 'https://example.invalid/ferry', checkedAt: '2026-10-16', changeType: 'price', nextCheckAt: '2027-03-15'},
      {factId: 'F3', claim: '港口位置', quote: 'q', sourceUrl: 'https://example.invalid/map', checkedAt: '2026-10-16', changeType: 'stable'},
    ],
  }
  const outline = {pages: [{articleId: 'rebun-island-transport', headings: [{facts: ['rebun-island:F1', 'rebun-island:F2']}]}]}
  assert.deepEqual(await syncFacts({execute: db.execute, factTables: [{table, evidencePath: 'content-planning/hokkaido/places/rebun-island/facts.json'}], outlines: [outline]}), {facts: 3, usage: 2})

  assert.deepEqual(await listDueFacts({execute: db.execute, today: '2027-03-01'}), [])
  const due = await listDueFacts({execute: db.execute, today: '2027-03-01', withinDays: 30})
  assert.equal(due.length, 1)
  assert.equal(due[0].sourceUrl, 'https://example.invalid/ferry')
  assert.deepEqual(due[0].facts.map((fact: any) => fact.fact_id), ['rebun-island:F2', 'rebun-island:F1'])
  assert.deepEqual(due[0].facts[0].articles, ['rebun-island-transport'])

  const unchanged = await recordCheck({execute: db.execute, factId: 'rebun-island:F2', result: 'unchanged', nextCheckAt: '2028-03-15', now: new Date('2027-03-10T00:00:00Z')})
  assert.equal(unchanged.next_check_at, '2028-03-15')
  assert.equal(unchanged.last_checked_at, '2027-03-10')
  const changed = await recordCheck({execute: db.execute, factId: 'rebun-island:F1', result: 'changed', nextCheckAt: '2027-10-01', note: '夏季班表改成 4 班'})
  assert.equal(changed.status, 'changed')
  const [exceptions] = await db.execute(["SELECT kind FROM exceptions WHERE subject = 'rebun-island:F1'"])
  assert.equal(exceptions[0].kind, 'big-change')
  await assert.rejects(recordCheck({execute: db.execute, factId: 'rebun-island:F1', result: 'unchanged'}), /下次查核日/)
})

test('缺口也登記重查；來源事實改變時推算的事實一起標記；缺口查到資料時寫例外', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {syncFacts, listDueFacts, recordCheck} = await import('../scripts/ops-facts.mjs')
  const table = {
    schemaVersion: 1,
    placeId: 'cape-soya',
    facts: [
      {factId: 'F72', claim: '到達時間', quote: 'q', sourceUrl: 'https://example.invalid/bus', checkedAt: '2026-10-18', changeType: 'timetable', nextCheckAt: '2027-03-31'},
      {factId: 'F75', claim: '三種排法', quote: 'q', sourceUrl: 'https://example.invalid/bus', checkedAt: '2026-10-18', changeType: 'timetable', nextCheckAt: '2027-03-31', derivedFrom: ['F72']},
      {factId: 'F98', kind: 'gap', gapKind: 'not-announced', claim: '2027 年元旦接駁巴士', checkedAt: '2026-10-18', nextCheckAt: '2026-12-01'},
      {factId: 'F99', kind: 'gap', gapKind: 'no-source', claim: '計程車車資', checkedAt: '2026-10-18'},
    ],
  }
  await syncFacts({execute: db.execute, factTables: [{table, evidencePath: 'x'}], outlines: []})
  const due = await listDueFacts({execute: db.execute, today: '2026-12-01'})
  assert.deepEqual(due.flatMap((group: any) => group.facts.map((fact: any) => [fact.fact_id, fact.kind, fact.gap_kind])), [['cape-soya:F98', 'gap', 'not-announced']])

  await recordCheck({execute: db.execute, factId: 'cape-soya:F72', result: 'changed', nextCheckAt: '2027-10-01', note: '改點'})
  const [[derived]] = await db.execute(["SELECT status FROM facts WHERE fact_id = 'cape-soya:F75'"])
  assert.equal(derived.status, 'changed')

  await recordCheck({execute: db.execute, factId: 'cape-soya:F98', result: 'found', nextCheckAt: '2027-12-01', note: '2027 年接駁巴士公布'})
  const [exceptions] = await db.execute(["SELECT kind, action_needed FROM exceptions WHERE subject = 'cape-soya:F98'"])
  assert.equal(exceptions[0].kind, 'other')
  assert.match(exceptions[0].action_needed, /補進地點事實表/)

  // 缺口補成一般事實後重新同步，狀態回到 ok
  table.facts[2] = {factId: 'F98', claim: '2027 年元旦接駁巴士 6:00 出發', quote: 'q', sourceUrl: 'https://example.invalid/new', checkedAt: '2026-12-02', changeType: 'annual-event', nextCheckAt: '2027-12-01'}
  await syncFacts({execute: db.execute, factTables: [{table, evidencePath: 'x'}], outlines: []})
  const [[filled]] = await db.execute(["SELECT kind, status FROM facts WHERE fact_id = 'cape-soya:F98'"])
  assert.deepEqual({...filled}, {kind: 'fact', status: 'ok'})
})

test('上稿或 CI 失敗不停放、下一輪續做，連續 3 次才停放；略過的待補內連不再列出', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {startArticle, markAccepted, recordFailure, markPublished} = await import('../scripts/ops-article.mjs')
  const {registerPendingLinks, listReadyLinks, skipLink} = await import('../scripts/ops-links.mjs')
  const base = {execute: db.execute, articleId: 'rebun-island-stay', targetPath: '/places/rebun-island/stay/'}
  const started = await startArticle(base)
  assert.equal(started.article.group_id, 'ungrouped')
  await markAccepted(base)
  assert.equal((await recordFailure({...base, kind: 'publish', reason: 'CI 失敗'})).status, 'accepted')
  assert.equal((await recordFailure({...base, kind: 'publish', reason: 'CI 失敗'})).publishFailures, 2)
  assert.equal((await recordFailure({...base, kind: 'publish', reason: 'CI 失敗'})).status, 'parked')
  const {unparkArticle} = await import('../scripts/ops-article.mjs')
  assert.equal((await unparkArticle(base)).article.publish_failures, 0)
  await startArticle({...base, articleId: 'other'})
  await markAccepted({...base, articleId: 'other'})
  await recordFailure({...base, articleId: 'other', kind: 'publish', reason: 'x'})
  assert.equal((await markPublished({...base, articleId: 'other'})).article.publish_failures, 0)

  await registerPendingLinks({execute: db.execute, links: [{fromArticleId: 'a', toArticleId: 'b', section: null, sentence: '看 B', anchorText: 'B', targetPath: '/b/', source: 'outline'}]})
  const [ready] = await listReadyLinks({execute: db.execute, publishedArticleIds: ['a', 'b']})
  assert.ok((await skipLink({execute: db.execute, linkId: ready.link_id, reason: '連結句被改掉'}))?.skipped_at)
  assert.equal((await listReadyLinks({execute: db.execute, publishedArticleIds: ['a', 'b']})).length, 0)
  const [exceptions] = await db.execute(["SELECT subject FROM exceptions WHERE kind = 'other'"])
  assert.equal(exceptions[0].subject, 'a → b')
})

test('補內連後 CI 連續失敗 3 次就略過；登記時沒有網址的跨群連結用清單網址補上', async (t) => {
  const db = await openTestDatabase()
  if (!db) return t.skip('這個 Node 版本沒有 node:sqlite')
  const {registerPendingLinks, listReadyLinks, recordLinkFailure} = await import('../scripts/ops-links.mjs')
  await registerPendingLinks({
    execute: db.execute,
    links: [
      {fromArticleId: 'a', toArticleId: 'b', section: null, sentence: '看 B', anchorText: 'B', targetPath: '/b/', source: 'outline'},
      {fromArticleId: 'a', toArticleId: 'c', section: null, sentence: '看 C', anchorText: 'C', targetPath: null, source: 'cross-group'},
    ],
  })
  const published = ['a', 'b', 'c']
  assert.deepEqual((await listReadyLinks({execute: db.execute, publishedArticleIds: published})).map((row) => row.to_article_id), ['b'])
  const withPaths = await listReadyLinks({execute: db.execute, publishedArticleIds: published, pagePaths: {c: '/c/'}})
  assert.deepEqual(withPaths.map((row) => [row.to_article_id, row.target_path]), [['b', '/b/'], ['c', '/c/']])

  const linkId = withPaths[0].link_id
  assert.equal((await recordLinkFailure({execute: db.execute, linkId, reason: 'CI 失敗'}))?.failures, 1)
  assert.equal((await recordLinkFailure({execute: db.execute, linkId, reason: 'CI 失敗'}))?.failures, 2)
  assert.ok((await recordLinkFailure({execute: db.execute, linkId, reason: 'CI 失敗'}))?.skipped_at)
  assert.deepEqual(
    (await listReadyLinks({execute: db.execute, publishedArticleIds: published, pagePaths: {c: '/c/'}})).map((row) => row.to_article_id),
    ['c'],
  )
  const [exceptions] = await db.execute(["SELECT detail FROM exceptions WHERE kind = 'other'"])
  assert.match(exceptions[0].detail, /CI 連續失敗 3 次/)
})
