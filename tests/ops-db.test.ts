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
  const execute = createHttpExecutor({fetchImpl: fetchImpl as any, config, token: undefined})
  const results = await execute(['SELECT owner FROM run_lock;', 'SELECT 1'])
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
