/**
 * 文章的生產狀態（維護資料庫 D1 的 article_status）。發布與索引狀態仍以 Sanity 為準，這裡只記生產過程。
 * 規則見 content-automation/routine-architecture.md「文章的生命週期」。
 *
 * 用法：
 *   node scripts/ops-article.mjs start --article=<id> [--group=<groupId>] --path=<targetPath> [--rules=<git sha>]
 *   node scripts/ops-article.mjs accepted --article=<id>
 *   node scripts/ops-article.mjs published --article=<id>
 *   node scripts/ops-article.mjs fail --article=<id> --kind=facts|needs-outline|source-unreachable|publish|other --reason=<說明>
 *   node scripts/ops-article.mjs unpark --article=<id>
 *   node scripts/ops-article.mjs list
 * 加 --local 改用本機資料庫。
 */
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {createOpsExecutor, parseOptions, positionalArguments, sqlLiteral} from './ops-db.mjs'

export const MAX_ATTEMPTS = 2
export const MAX_DEFER_DAYS = 3
export const MAX_PUBLISH_FAILURES = 3
export const FAILURE_KINDS = ['facts', 'needs-outline', 'source-unreachable', 'publish', 'other']
export const UNGROUPED = 'ungrouped'
const DAY = 24 * 60 * 60 * 1000

function selectSql(articleId) {
  return `SELECT * FROM article_status WHERE article_id = ${sqlLiteral(articleId)}`
}

async function readStatus(execute, articleId) {
  const [rows] = await execute([selectSql(articleId)])
  return rows?.[0] ?? null
}

function exceptionSql({now, kind, subject, detail, action}) {
  return `INSERT INTO exceptions (created_at, kind, subject, detail, action_needed)
    VALUES (${sqlLiteral(now)}, ${sqlLiteral(kind)}, ${sqlLiteral(subject)}, ${sqlLiteral(detail)}, ${sqlLiteral(action)})`
}

/** 開始寫一篇：停放中的不能開始；輪數加一。 */
export async function startArticle({execute, articleId, groupId = UNGROUPED, targetPath, rulesVersion = null, now = new Date()}) {
  const current = await readStatus(execute, articleId)
  if (current?.state === 'parked') return {status: 'refused', reason: '這篇停放中，要先 unpark'}
  if (current?.state === 'published') return {status: 'refused', reason: '這篇已經發布'}
  if (current?.state === 'deferred' && current.defer_until && current.defer_until > now.toISOString()) {
    return {status: 'refused', reason: `延後到 ${current.defer_until}`}
  }
  const at = sqlLiteral(now.toISOString())
  await execute([
    `INSERT INTO article_status (article_id, group_id, target_path, state, attempts, rules_version, updated_at)
      VALUES (${sqlLiteral(articleId)}, ${sqlLiteral(groupId)}, ${sqlLiteral(targetPath)}, 'writing', 1, ${sqlLiteral(rulesVersion)}, ${at})
      ON CONFLICT(article_id) DO UPDATE SET
        state = 'writing', attempts = article_status.attempts + 1, rules_version = excluded.rules_version,
        defer_until = NULL, updated_at = excluded.updated_at`,
  ])
  return {status: 'writing', article: await readStatus(execute, articleId)}
}

async function setState(execute, articleId, state, now) {
  const resetPublishFailures = state === 'published' ? ', publish_failures = 0' : ''
  const results = await execute([
    `UPDATE article_status SET state = ${sqlLiteral(state)}, first_deferred_at = NULL, defer_until = NULL${resetPublishFailures},
      updated_at = ${sqlLiteral(now.toISOString())} WHERE article_id = ${sqlLiteral(articleId)}`,
    selectSql(articleId),
  ])
  const row = results[1]?.[0] ?? null
  return row ? {status: state, article: row} : {status: 'missing'}
}

export const markAccepted = ({execute, articleId, now = new Date()}) => setState(execute, articleId, 'accepted', now)
export const markPublished = ({execute, articleId, now = new Date()}) => setState(execute, articleId, 'published', now)

/**
 * 記錄失敗並決定下一步：
 * - facts：還沒到 MAX_ATTEMPTS 回到 queued 讓下一輪重寫；到了就停放。
 * - needs-outline、other：直接停放。
 * - source-unreachable：延後一天；從第一次延後起超過 MAX_DEFER_DAYS 天就停放。這一輪不算一次寫作（輪數減回去）。
 * - publish（定稿、上稿、CI 等非內容失敗）：狀態不變，下一輪續做；累積 MAX_PUBLISH_FAILURES 次就停放。
 * 停放時同時寫一筆例外，每週同步到規劃總表。
 */
export async function recordFailure({execute, articleId, kind, reason, now = new Date()}) {
  if (!FAILURE_KINDS.includes(kind)) throw new Error(`kind 必須是 ${FAILURE_KINDS.join('、')} 之一`)
  const current = await readStatus(execute, articleId)
  if (!current) return {status: 'missing'}
  const at = now.toISOString()
  const park = async (parkKind, detail) => {
    await execute([
      `UPDATE article_status SET state = 'parked', park_kind = ${sqlLiteral(parkKind)}, park_reason = ${sqlLiteral(detail)},
        defer_until = NULL, updated_at = ${sqlLiteral(at)} WHERE article_id = ${sqlLiteral(articleId)}`,
      exceptionSql({
        now: at,
        kind: 'parked',
        subject: articleId,
        detail,
        action: parkKind === 'needs-outline' ? '大綱或分工要調整，請開 session 處理' : '請開 session 看原因後決定重寫或放棄',
      }),
    ])
    return {status: 'parked', parkKind, article: await readStatus(execute, articleId)}
  }

  if (kind === 'facts') {
    if (current.attempts >= MAX_ATTEMPTS) return park('facts', `寫了 ${current.attempts} 次仍判退：${reason}`)
    await execute([
      `UPDATE article_status SET state = 'queued', park_reason = ${sqlLiteral(reason)}, first_deferred_at = NULL, updated_at = ${sqlLiteral(at)}
        WHERE article_id = ${sqlLiteral(articleId)}`,
    ])
    return {status: 'queued', retry: true, article: await readStatus(execute, articleId)}
  }

  if (kind === 'source-unreachable') {
    const firstDeferredAt = current.first_deferred_at ?? at
    if (now.getTime() - Date.parse(firstDeferredAt) > MAX_DEFER_DAYS * DAY) {
      return park('source-unreachable', `來源連續 ${MAX_DEFER_DAYS} 天以上打不開：${reason}`)
    }
    const deferUntil = new Date(now.getTime() + DAY).toISOString()
    await execute([
      `UPDATE article_status SET state = 'deferred', defer_until = ${sqlLiteral(deferUntil)}, attempts = MAX(attempts - 1, 0),
        first_deferred_at = ${sqlLiteral(firstDeferredAt)}, park_reason = ${sqlLiteral(reason)}, updated_at = ${sqlLiteral(at)}
        WHERE article_id = ${sqlLiteral(articleId)}`,
    ])
    return {status: 'deferred', deferUntil, article: await readStatus(execute, articleId)}
  }

  if (kind === 'publish') {
    const failures = (current.publish_failures ?? 0) + 1
    if (failures >= MAX_PUBLISH_FAILURES) return park('other', `定稿、上稿或 CI 連續失敗 ${failures} 次：${reason}`)
    await execute([
      `UPDATE article_status SET publish_failures = ${failures}, park_reason = ${sqlLiteral(reason)}, updated_at = ${sqlLiteral(at)}
        WHERE article_id = ${sqlLiteral(articleId)}`,
    ])
    return {status: current.state, publishFailures: failures, retry: true, article: await readStatus(execute, articleId)}
  }

  return park(kind, reason)
}

/** 人工處理完停放原因後，讓文章回到清單；輪數與上稿失敗次數歸零。 */
export async function unparkArticle({execute, articleId, now = new Date()}) {
  const results = await execute([
    `UPDATE article_status SET state = 'queued', attempts = 0, publish_failures = 0, park_kind = NULL, park_reason = NULL,
      defer_until = NULL, first_deferred_at = NULL, updated_at = ${sqlLiteral(now.toISOString())}
      WHERE article_id = ${sqlLiteral(articleId)}`,
    selectSql(articleId),
  ])
  const row = results[1]?.[0] ?? null
  return row ? {status: 'queued', article: row} : {status: 'missing'}
}

export async function listArticleStatuses({execute}) {
  const [rows] = await execute(['SELECT * FROM article_status ORDER BY updated_at DESC'])
  return rows
}

async function runCli() {
  const argumentsList = process.argv.slice(2)
  const [command] = positionalArguments(argumentsList)
  const options = parseOptions(argumentsList)
  const execute = createOpsExecutor({local: Boolean(options.local)})
  const articleId = typeof options.article === 'string' ? options.article : null
  const need = (value, name) => {
    if (typeof value !== 'string' || value === '') throw new Error(`必須提供 --${name}`)
    return value
  }

  let result
  if (command === 'start') {
    result = await startArticle({
      execute,
      articleId: need(articleId, 'article'),
      groupId: typeof options.group === 'string' && options.group !== '' ? options.group : UNGROUPED,
      targetPath: need(options.path, 'path'),
      rulesVersion: typeof options.rules === 'string' ? options.rules : null,
    })
  } else if (command === 'accepted') {
    result = await markAccepted({execute, articleId: need(articleId, 'article')})
  } else if (command === 'published') {
    result = await markPublished({execute, articleId: need(articleId, 'article')})
  } else if (command === 'fail') {
    result = await recordFailure({
      execute,
      articleId: need(articleId, 'article'),
      kind: need(options.kind, 'kind'),
      reason: need(options.reason, 'reason'),
    })
  } else if (command === 'unpark') {
    result = await unparkArticle({execute, articleId: need(articleId, 'article')})
  } else if (command === 'list') {
    result = await listArticleStatuses({execute})
  } else {
    throw new Error('用法：ops-article.mjs start|accepted|published|fail|unpark|list ...')
  }
  console.log(JSON.stringify(result, null, 2))
  if (result?.status === 'refused' || result?.status === 'missing') process.exitCode = 1
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
