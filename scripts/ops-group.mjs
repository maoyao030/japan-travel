/**
 * 旅行群的核准狀態（維護資料庫 D1 的 group_status）：Darren 明確核准，或到自動核准日沒有反對就默許。
 * routine 用 Google Sheets 連接器讀規劃總表「群清單」那一列的狀態與意見，再交給 evaluate 判斷。
 *
 * 用法：
 *   node scripts/ops-group.mjs evaluate --group=<id> --auto-approve-on=<YYYY-MM-DD> [--sheet-status=<狀態欄>] [--sheet-comment=<意見欄>] [--exception=<原因>]
 *   node scripts/ops-group.mjs list
 * 加 --local 改用本機資料庫。
 */
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {createOpsExecutor, parseOptions, positionalArguments, sqlLiteral, taipeiDate} from './ops-db.mjs'

/**
 * 依規劃總表的回覆決定群的狀態。順序：已經核准的維持核准；Darren 的意見或狀態優先；
 * 例外不默許；到了自動核准日才默許。
 */
export function decideGroupState({current = null, sheetStatus = '', sheetComment = '', exception = '', autoApproveOn, today}) {
  const status = (sheetStatus ?? '').trim()
  const comment = (sheetComment ?? '').trim()
  if (current?.state === 'approved') return {state: 'approved', approvedBy: current.approved_by, changed: false}
  if (status === '暫停') return {state: 'paused', note: comment || 'Darren 把狀態改成暫停'}
  if (status === '已核准') return {state: 'approved', approvedBy: 'darren', note: comment || null}
  if (status === '要改' || comment) return {state: 'changes-requested', note: comment || 'Darren 把狀態改成要改'}
  if (exception) return {state: 'awaiting-approval', note: `例外不默許：${exception}`}
  if (today >= autoApproveOn) return {state: 'approved', approvedBy: 'default'}
  return {state: 'awaiting-approval', note: `自動核准日 ${autoApproveOn}`}
}

export async function evaluateGroup({execute, groupId, autoApproveOn, sheetStatus, sheetComment, exception, now = new Date()}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(autoApproveOn ?? '')) throw new Error('autoApproveOn 必須是 YYYY-MM-DD')
  const [rows] = await execute([`SELECT * FROM group_status WHERE group_id = ${sqlLiteral(groupId)}`])
  const current = rows?.[0] ?? null
  const decision = decideGroupState({current, sheetStatus, sheetComment, exception, autoApproveOn, today: taipeiDate(now)})
  if (decision.changed === false) return {groupId, ...decision, row: current}
  const at = now.toISOString()
  const approvedAt = decision.state === 'approved' ? at : null
  const results = await execute([
    `INSERT INTO group_status (group_id, state, auto_approve_on, approved_at, approved_by, note, updated_at)
      VALUES (${sqlLiteral(groupId)}, ${sqlLiteral(decision.state)}, ${sqlLiteral(autoApproveOn)}, ${sqlLiteral(approvedAt)},
        ${sqlLiteral(decision.approvedBy ?? null)}, ${sqlLiteral(decision.note ?? null)}, ${sqlLiteral(at)})
      ON CONFLICT(group_id) DO UPDATE SET
        state = excluded.state, auto_approve_on = excluded.auto_approve_on, approved_at = excluded.approved_at,
        approved_by = excluded.approved_by, note = excluded.note, updated_at = excluded.updated_at`,
    `SELECT * FROM group_status WHERE group_id = ${sqlLiteral(groupId)}`,
  ])
  return {groupId, ...decision, changed: true, row: results[1]?.[0] ?? null}
}

export async function listGroupStatuses({execute}) {
  const [rows] = await execute(['SELECT * FROM group_status ORDER BY updated_at DESC'])
  return rows
}

async function runCli() {
  const argumentsList = process.argv.slice(2)
  const [command] = positionalArguments(argumentsList)
  const options = parseOptions(argumentsList)
  const execute = createOpsExecutor({local: Boolean(options.local)})
  const text = (value) => (typeof value === 'string' ? value : '')

  if (command === 'evaluate') {
    if (typeof options.group !== 'string') throw new Error('evaluate 必須提供 --group')
    const result = await evaluateGroup({
      execute,
      groupId: options.group,
      autoApproveOn: text(options['auto-approve-on']),
      sheetStatus: text(options['sheet-status']),
      sheetComment: text(options['sheet-comment']),
      exception: text(options.exception),
    })
    console.log(JSON.stringify(result, null, 2))
    return
  }
  if (command === 'list') {
    console.log(JSON.stringify(await listGroupStatuses({execute}), null, 2))
    return
  }
  throw new Error('用法：ops-group.mjs evaluate --group=... --auto-approve-on=... | list')
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
