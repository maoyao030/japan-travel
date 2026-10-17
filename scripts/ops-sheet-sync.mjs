/**
 * 把維護資料庫（D1）的例外與即將重查的事實，整理成規劃總表「例外與更新」分頁要新增的列。
 *
 * 寫入 Google Sheet 由 routine 用 Google Sheets 連接器做（這支程式不碰 Google 權杖），所以分兩步：
 *   1. node scripts/ops-sheet-sync.mjs collect --out=.tmp/sheet-sync.json [--local]
 *      讀 D1，必要時新增「routine 沒在跑」的例外，輸出要附加的列。
 *   2. routine 把 appendRows 附加到試算表 sheetName 分頁的最後。
 *   3. node scripts/ops-sheet-sync.mjs mark --from=.tmp/sheet-sync.json [--local]
 *      寫入成功後，把這些例外與通知標成已同步，下次不再重複。
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {loadArticleQueue} from './article-automation-policy.mjs'
import {
  createWranglerExecutor,
  parseOptions,
  positionalArguments,
  projectRoot,
  sqlLiteral,
  taipeiDate,
} from './ops-db.mjs'

export const PLANNING_SPREADSHEET_ID = '19ejoyytu_5JZ8Toa1-Me6Y5HG2pe0iXT1DqAEX01vps'
export const EXCEPTIONS_SHEET_NAME = '例外與更新'
export const DUE_WINDOW_DAYS = 30

const EXCEPTION_LABELS = {
  parked: '停放',
  'source-gone': '來源不見',
  'big-change': '重查發現大改動',
  'outline-exception': '大綱例外',
  'stale-run': 'routine 沒在跑',
  other: '其他',
}
const CHANGE_TYPE_LABELS = {
  timetable: '班表',
  'annual-event': '年度活動',
  price: '價格',
  stay: '住宿',
  'shop-hours': '店家營業',
  'seasonal-opening': '季節開放',
  popularity: '人氣',
  'climate-normal': '平年值',
}
const queuePath = path.join(projectRoot, 'content-automation', 'article-queue.json')

/** routine 超過「啟動間隔的兩倍」沒有新紀錄，就算沒在跑。還沒跑過任何一輪時不判斷。 */
export function staleThresholdHours(triggerIntervalHours) {
  return triggerIntervalHours * 2
}

async function ensureStaleRunException({execute, now, thresholdHours}) {
  const [[latest], [openStale]] = await execute([
    'SELECT MAX(started_at) AS last_started_at FROM runs',
    "SELECT exception_id FROM exceptions WHERE kind = 'stale-run' AND status = 'open' LIMIT 1",
  ])
  const lastStartedAt = latest?.last_started_at ?? null
  if (!lastStartedAt || openStale) return lastStartedAt
  const ageHours = (now.getTime() - Date.parse(lastStartedAt)) / (60 * 60 * 1000)
  if (ageHours <= thresholdHours) return lastStartedAt
  await execute([
    `INSERT INTO exceptions (created_at, kind, subject, detail, action_needed)
      VALUES (${sqlLiteral(now.toISOString())}, 'stale-run', 'routine',
        ${sqlLiteral(`最後一次執行是 ${taipeiDate(new Date(lastStartedAt))}，已經超過 ${Math.round(ageHours)} 小時沒有新紀錄`)},
        '看一下 routine 是否被暫停或一直失敗')`,
  ])
  return lastStartedAt
}

function exceptionRow(row) {
  return [
    taipeiDate(new Date(row.created_at)),
    EXCEPTION_LABELS[row.kind] ?? row.kind,
    row.subject,
    row.detail,
    row.action_needed ?? '',
    '待處理',
  ]
}

function dueNotices({typeRows, pageRows, now}) {
  const byPlace = new Map()
  for (const row of typeRows) {
    const entry = byPlace.get(row.place_id) ?? {placeId: row.place_id, total: 0, types: [], earliest: row.earliest}
    entry.total += row.fact_count
    entry.types.push(`${CHANGE_TYPE_LABELS[row.change_type] ?? row.change_type} ${row.fact_count}`)
    if (row.earliest < entry.earliest) entry.earliest = row.earliest
    byPlace.set(row.place_id, entry)
  }
  const pagesByPlace = new Map(pageRows.map((row) => [row.place_id, row.page_count]))
  return [...byPlace.values()]
    .sort((left, right) => left.earliest.localeCompare(right.earliest))
    .map((entry) => ({
      noticeKey: `due:${entry.placeId}:${entry.earliest.slice(0, 7)}`,
      row: [
        taipeiDate(now),
        '即將重查',
        entry.placeId,
        `未來 ${DUE_WINDOW_DAYS} 天有 ${entry.total} 筆事實到期（${entry.types.join('、')}），用在 ${pagesByPlace.get(entry.placeId) ?? 0} 頁，最早 ${entry.earliest}`,
        '不用處理，routine 會自動重查；來源不見或改動影響文章架構時才會另列例外',
        '待處理',
      ],
    }))
}

export async function collectSheetUpdate({execute, now = new Date(), triggerIntervalHours}) {
  const lastRunStartedAt = await ensureStaleRunException({
    execute,
    now,
    thresholdHours: staleThresholdHours(triggerIntervalHours),
  })
  const dueBefore = new Date(now.getTime() + DUE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dueFilter = (alias) =>
    `${alias}next_check_at IS NOT NULL AND ${alias}next_check_at <= ${sqlLiteral(dueBefore)} AND ${alias}status != 'removed'`
  const [exceptions, typeRows, pageRows, notices] = await execute([
    'SELECT exception_id, created_at, kind, subject, detail, action_needed FROM exceptions WHERE synced_to_sheet_at IS NULL ORDER BY created_at, exception_id',
    `SELECT place_id, change_type, COUNT(*) AS fact_count, MIN(next_check_at) AS earliest
      FROM facts WHERE ${dueFilter('')} GROUP BY place_id, change_type ORDER BY place_id, earliest, change_type`,
    `SELECT f.place_id AS place_id, COUNT(DISTINCT u.article_id) AS page_count
      FROM facts f JOIN fact_usage u ON u.fact_id = f.fact_id WHERE ${dueFilter('f.')}
      GROUP BY f.place_id`,
    "SELECT notice_key FROM sheet_notices WHERE notice_key LIKE 'due:%'",
  ])
  const syncedNotices = new Set(notices.map((row) => row.notice_key))
  const newNotices = dueNotices({typeRows, pageRows, now}).filter((notice) => !syncedNotices.has(notice.noticeKey))

  return {
    spreadsheetId: PLANNING_SPREADSHEET_ID,
    sheetName: EXCEPTIONS_SHEET_NAME,
    collectedAt: now.toISOString(),
    lastRunStartedAt,
    appendRows: [...exceptions.map(exceptionRow), ...newNotices.map((notice) => notice.row)],
    exceptionIds: exceptions.map((row) => row.exception_id),
    noticeKeys: newNotices.map((notice) => notice.noticeKey),
  }
}

export async function markSheetSynced({execute, exceptionIds, noticeKeys, now = new Date()}) {
  const syncedAt = sqlLiteral(now.toISOString())
  const statements = []
  if (exceptionIds.length > 0) {
    if (!exceptionIds.every((id) => Number.isInteger(id))) throw new Error('exceptionIds 必須是整數')
    statements.push(
      `UPDATE exceptions SET synced_to_sheet_at = ${syncedAt} WHERE exception_id IN (${exceptionIds.join(', ')})`,
    )
  }
  for (const key of noticeKeys) {
    statements.push(`INSERT OR IGNORE INTO sheet_notices (notice_key, synced_at) VALUES (${sqlLiteral(key)}, ${syncedAt})`)
  }
  if (statements.length > 0) await execute(statements)
  return {status: 'marked', exceptions: exceptionIds.length, notices: noticeKeys.length}
}

async function runCli() {
  const argumentsList = process.argv.slice(2)
  const [command] = positionalArguments(argumentsList)
  const options = parseOptions(argumentsList)
  const execute = createWranglerExecutor({remote: !options.local})

  if (command === 'collect') {
    const queue = await loadArticleQueue(queuePath, projectRoot)
    const result = await collectSheetUpdate({
      execute,
      triggerIntervalHours: queue.publicationCadence.triggerIntervalHours,
    })
    const json = `${JSON.stringify(result, null, 2)}\n`
    if (typeof options.out === 'string') {
      await mkdir(path.dirname(path.resolve(options.out)), {recursive: true})
      await writeFile(path.resolve(options.out), json)
    }
    process.stdout.write(json)
    return
  }
  if (command === 'mark') {
    if (typeof options.from !== 'string') throw new Error('mark 必須提供 --from=<collect 輸出的檔案>')
    const collected = JSON.parse(await readFile(path.resolve(options.from), 'utf8'))
    const result = await markSheetSynced({
      execute,
      exceptionIds: collected.exceptionIds ?? [],
      noticeKeys: collected.noticeKeys ?? [],
    })
    console.log(JSON.stringify(result, null, 2))
    return
  }
  throw new Error('用法：ops-sheet-sync.mjs collect [--out=...] | mark --from=... [--local]')
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
