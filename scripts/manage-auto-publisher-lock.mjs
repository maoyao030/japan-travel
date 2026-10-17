/**
 * 自動發布的執行鎖：同一時間只允許一個 routine 在生產或維護。
 * 鎖放在維護資料庫（Cloudflare D1）的 run_lock 表；雲端每次全新下載也看得到同一把鎖。
 * 超過 lockStaleAfterHours 的鎖視為逾時，可以被下一輪接手。
 *
 * 用法：
 *   node scripts/manage-auto-publisher-lock.mjs acquire [--owner=<名稱>] [--local]
 *   node scripts/manage-auto-publisher-lock.mjs release --token=<acquire 回傳的 token> [--local]
 *   node scripts/manage-auto-publisher-lock.mjs status [--local]
 */
import {randomUUID} from 'node:crypto'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {loadArticleQueue} from './article-automation-policy.mjs'
import {createOpsExecutor, parseOptions, positionalArguments, projectRoot, sqlLiteral} from './ops-db.mjs'

export const LOCK_NAME = 'auto-publisher'
const queuePath = path.join(projectRoot, 'content-automation', 'article-queue.json')

function selectLockSql(name) {
  return `SELECT name, owner, token, acquired_at, expires_at FROM run_lock WHERE name = ${sqlLiteral(name)}`
}

function toOwner(row) {
  return row ? {ownerLabel: row.owner, token: row.token, startedAt: row.acquired_at, expiresAt: row.expires_at} : null
}

/** 搶鎖：沒有人持有，或持有者已逾時，才寫得進去；最後一句讀回目前持有者。 */
export function buildAcquireStatements({name = LOCK_NAME, ownerLabel, token, now, expiresAt}) {
  return [
    selectLockSql(name),
    `INSERT INTO run_lock (name, owner, token, acquired_at, expires_at)
      VALUES (${sqlLiteral(name)}, ${sqlLiteral(ownerLabel)}, ${sqlLiteral(token)}, ${sqlLiteral(now)}, ${sqlLiteral(expiresAt)})
      ON CONFLICT(name) DO UPDATE SET
        owner = excluded.owner, token = excluded.token, acquired_at = excluded.acquired_at, expires_at = excluded.expires_at
      WHERE run_lock.expires_at < excluded.acquired_at`,
    selectLockSql(name),
  ]
}

export async function acquireAutoPublisherLock({
  execute,
  staleAfterHours,
  ownerLabel = 'scheduled-auto-publisher',
  now = new Date(),
  name = LOCK_NAME,
}) {
  if (!Number.isFinite(staleAfterHours) || staleAfterHours <= 0) {
    throw new Error('staleAfterHours 必須是正數')
  }
  const token = randomUUID()
  const startedAt = now.toISOString()
  const expiresAt = new Date(now.getTime() + staleAfterHours * 60 * 60 * 1000).toISOString()
  const results = await execute(buildAcquireStatements({name, ownerLabel, token, now: startedAt, expiresAt}))
  const before = results[0]?.[0] ?? null
  const after = results[2]?.[0] ?? null

  if (after?.token !== token) {
    const ageMilliseconds = after ? Math.max(0, now.getTime() - Date.parse(after.acquired_at)) : 0
    return {status: 'busy', owner: toOwner(after), ageMilliseconds}
  }
  const owner = toOwner(after)
  if (before) owner.replacedStaleOwner = toOwner(before)
  return {status: 'acquired', token, owner}
}

export async function releaseAutoPublisherLock({execute, token, name = LOCK_NAME}) {
  const results = await execute([
    selectLockSql(name),
    `DELETE FROM run_lock WHERE name = ${sqlLiteral(name)} AND token = ${sqlLiteral(token)}`,
  ])
  const before = results[0]?.[0] ?? null
  if (!before) return {status: 'missing'}
  if (before.token !== token) return {status: 'token-mismatch', owner: toOwner(before)}
  return {status: 'released'}
}

export async function getAutoPublisherLock({execute, name = LOCK_NAME, now = new Date()}) {
  const [rows] = await execute([selectLockSql(name)])
  const row = rows?.[0] ?? null
  if (!row) return {status: 'free'}
  return {status: row.expires_at < now.toISOString() ? 'stale' : 'held', owner: toOwner(row)}
}

async function runCli() {
  const argumentsList = process.argv.slice(2)
  const [command] = positionalArguments(argumentsList)
  const options = parseOptions(argumentsList)
  const execute = createOpsExecutor({local: Boolean(options.local)})

  if (command === 'acquire') {
    const queue = await loadArticleQueue(queuePath, projectRoot)
    const result = await acquireAutoPublisherLock({
      execute,
      staleAfterHours: queue.publicationCadence.lockStaleAfterHours,
      ownerLabel: typeof options.owner === 'string' ? options.owner : 'scheduled-auto-publisher',
    })
    console.log(JSON.stringify(result, null, 2))
    if (result.status === 'busy') process.exitCode = 1
    return
  }

  if (command === 'release') {
    if (typeof options.token !== 'string') throw new Error('release 必須提供 --token=<acquire token>')
    const result = await releaseAutoPublisherLock({execute, token: options.token})
    console.log(JSON.stringify(result, null, 2))
    if (result.status === 'token-mismatch') process.exitCode = 1
    return
  }

  if (command === 'status') {
    console.log(JSON.stringify(await getAutoPublisherLock({execute}), null, 2))
    return
  }

  throw new Error('用法：manage-auto-publisher-lock.mjs acquire|release|status [--token=...] [--local]')
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
