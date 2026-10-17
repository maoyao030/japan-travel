/**
 * routine 每一輪的開始與結束紀錄，寫進維護資料庫（D1）的 runs 表。
 * 最新一筆的時間就是「最後執行時間」；太久沒有新紀錄，每週同步會列成例外。
 *
 * 用法：
 *   node scripts/ops-run.mjs start --kind=produce|maintain|plan|summary [--article=<articleId>] [--local]
 *   node scripts/ops-run.mjs finish --run=<start 回傳的 runId> --result=<結果> [--note=<說明>] [--local]
 */
import {randomUUID} from 'node:crypto'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {createOpsExecutor, parseOptions, positionalArguments, sqlLiteral} from './ops-db.mjs'

export const RUN_KINDS = ['produce', 'maintain', 'plan', 'summary']
export const RUN_RESULTS = ['accepted', 'published', 'fixed', 'parked', 'deferred', 'failed', 'no-work', 'done']

export async function startRun({execute, kind, articleId = null, now = new Date()}) {
  if (!RUN_KINDS.includes(kind)) throw new Error(`kind 必須是 ${RUN_KINDS.join('、')} 之一`)
  const runId = randomUUID()
  const startedAt = now.toISOString()
  await execute([
    `INSERT INTO runs (run_id, kind, started_at, article_id)
      VALUES (${sqlLiteral(runId)}, ${sqlLiteral(kind)}, ${sqlLiteral(startedAt)}, ${sqlLiteral(articleId)})`,
  ])
  return {runId, kind, startedAt}
}

export async function finishRun({execute, runId, result, note = null, now = new Date()}) {
  if (!RUN_RESULTS.includes(result)) throw new Error(`result 必須是 ${RUN_RESULTS.join('、')} 之一`)
  const results = await execute([
    `UPDATE runs SET finished_at = ${sqlLiteral(now.toISOString())}, result = ${sqlLiteral(result)}, note = ${sqlLiteral(note)}
      WHERE run_id = ${sqlLiteral(runId)} AND finished_at IS NULL`,
    `SELECT run_id, finished_at, result FROM runs WHERE run_id = ${sqlLiteral(runId)}`,
  ])
  const row = results[1]?.[0] ?? null
  if (!row) return {status: 'missing'}
  return {status: 'finished', runId, finishedAt: row.finished_at, result: row.result}
}

async function runCli() {
  const argumentsList = process.argv.slice(2)
  const [command] = positionalArguments(argumentsList)
  const options = parseOptions(argumentsList)
  const execute = createOpsExecutor({local: Boolean(options.local)})

  if (command === 'start') {
    const result = await startRun({
      execute,
      kind: options.kind,
      articleId: typeof options.article === 'string' ? options.article : null,
    })
    console.log(JSON.stringify(result, null, 2))
    return
  }
  if (command === 'finish') {
    if (typeof options.run !== 'string') throw new Error('finish 必須提供 --run=<runId>')
    const result = await finishRun({
      execute,
      runId: options.run,
      result: options.result,
      note: typeof options.note === 'string' ? options.note : null,
    })
    console.log(JSON.stringify(result, null, 2))
    if (result.status === 'missing') process.exitCode = 1
    return
  }
  throw new Error('用法：ops-run.mjs start --kind=... | finish --run=... --result=... [--local]')
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
