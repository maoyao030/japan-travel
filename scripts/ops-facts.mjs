/**
 * 事實查核狀態（維護資料庫 D1 的 facts、fact_usage、fact_checks）：給明年的更新後門。
 * 事實本身（主張、日文原文摘錄）在 Git 的地點事實表；這裡用同一個編號 `<地點>:F12` 記變動類型、
 * 下次查核日、來源網址與哪幾頁用到，到期時依來源網址分批重查。
 *
 * 用法：
 *   node scripts/ops-facts.mjs sync                   把所有地點事實表與群大綱的引用登記到 D1
 *   node scripts/ops-facts.mjs due [--days=0]         列出到期（或 N 天內到期）的事實，依來源網址分組
 *   node scripts/ops-facts.mjs checked --fact=<地點:F12> --result=unchanged|changed|unreachable|removed --next=<YYYY-MM-DD> [--note=...]
 * 加 --local 改用本機資料庫。
 */
import {readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {createOpsExecutor, parseOptions, positionalArguments, projectRoot, sqlLiteral, taipeiDate} from './ops-db.mjs'

const planningRoot = path.join(projectRoot, 'content-planning')
const toPosix = (file) => file.split(path.sep).join('/')
export const CHECK_RESULTS = ['unchanged', 'changed', 'unreachable', 'removed']

async function walk(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const files = []
  for (const entry of entries) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else files.push(full)
  }
  return files
}

/** 從地點事實表與群大綱算出要登記的事實與引用；純函式。 */
export function buildFactRecords({factTables, outlines}) {
  const facts = []
  for (const {table, evidencePath} of factTables) {
    for (const fact of table.facts ?? []) {
      facts.push({
        factId: `${table.placeId}:${fact.factId}`,
        placeId: table.placeId,
        changeType: fact.changeType ?? 'stable',
        sourceUrl: fact.sourceUrl ?? '',
        evidencePath,
        lastCheckedAt: fact.checkedAt ?? '1970-01-01',
        nextCheckAt: fact.decision === 'removed' || fact.changeType === 'stable' ? null : fact.nextCheckAt ?? null,
        status: fact.decision === 'removed' ? 'removed' : 'ok',
      })
    }
  }
  const known = new Set(facts.map((fact) => fact.factId))
  const usage = []
  for (const outline of outlines) {
    for (const page of outline.pages ?? []) {
      const refs = new Set((page.headings ?? []).flatMap((heading) => heading.facts ?? []))
      for (const ref of refs) if (known.has(ref)) usage.push({factId: ref, articleId: page.articleId})
    }
  }
  return {facts, usage}
}

export async function syncFacts({execute, factTables, outlines, now = new Date()}) {
  const {facts, usage} = buildFactRecords({factTables, outlines})
  const at = sqlLiteral(now.toISOString())
  const statements = facts.map(
    (fact) => `INSERT INTO facts (fact_id, place_id, change_type, source_url, evidence_path, last_checked_at, next_check_at, status, updated_at)
      VALUES (${sqlLiteral(fact.factId)}, ${sqlLiteral(fact.placeId)}, ${sqlLiteral(fact.changeType)}, ${sqlLiteral(fact.sourceUrl)},
        ${sqlLiteral(fact.evidencePath)}, ${sqlLiteral(fact.lastCheckedAt)}, ${sqlLiteral(fact.nextCheckAt)}, ${sqlLiteral(fact.status)}, ${at})
      ON CONFLICT(fact_id) DO UPDATE SET
        change_type = excluded.change_type, source_url = excluded.source_url, evidence_path = excluded.evidence_path,
        status = CASE WHEN excluded.status = 'removed' THEN 'removed' ELSE facts.status END,
        last_checked_at = CASE WHEN excluded.last_checked_at > facts.last_checked_at THEN excluded.last_checked_at ELSE facts.last_checked_at END,
        next_check_at = CASE WHEN excluded.last_checked_at > facts.last_checked_at OR excluded.status = 'removed' THEN excluded.next_check_at ELSE facts.next_check_at END,
        updated_at = excluded.updated_at`,
  )
  statements.push(
    ...usage.map(
      (entry) => `INSERT OR IGNORE INTO fact_usage (fact_id, article_id) VALUES (${sqlLiteral(entry.factId)}, ${sqlLiteral(entry.articleId)})`,
    ),
  )
  if (statements.length > 0) await execute(statements)
  return {facts: facts.length, usage: usage.length}
}

/** 到期的事實依來源網址分組：同一個網址開一次就能核對多筆。 */
export async function listDueFacts({execute, today, withinDays = 0}) {
  const until = new Date(Date.parse(`${today}T00:00:00Z`) + withinDays * 86400000).toISOString().slice(0, 10)
  const [rows] = await execute([
    `SELECT f.fact_id, f.place_id, f.change_type, f.source_url, f.evidence_path, f.next_check_at, f.source_fingerprint,
        (SELECT GROUP_CONCAT(article_id) FROM fact_usage u WHERE u.fact_id = f.fact_id) AS articles
      FROM facts f WHERE f.next_check_at IS NOT NULL AND f.next_check_at <= ${sqlLiteral(until)} AND f.status != 'removed'
      ORDER BY f.source_url, f.next_check_at`,
  ])
  const bySource = new Map()
  for (const row of rows) {
    const group = bySource.get(row.source_url) ?? {sourceUrl: row.source_url, facts: []}
    group.facts.push({...row, articles: row.articles ? String(row.articles).split(',') : []})
    bySource.set(row.source_url, group)
  }
  return [...bySource.values()]
}

/**
 * 記錄一次重查。unchanged：只更新查核日與下次查核日；changed：標成 changed 並寫例外，
 * 讓人更新地點事實表與用到的文章；unreachable：下次查核日照填（通常是明天），不改狀態；removed：停用。
 */
export async function recordCheck({execute, factId, result, nextCheckAt = null, note = null, runId = null, now = new Date()}) {
  if (!CHECK_RESULTS.includes(result)) throw new Error(`result 必須是 ${CHECK_RESULTS.join('、')} 之一`)
  if (result !== 'removed' && !/^\d{4}-\d{2}-\d{2}$/.test(nextCheckAt ?? '')) throw new Error('必須提供下次查核日 --next=YYYY-MM-DD')
  const at = now.toISOString()
  const status = {unchanged: 'ok', changed: 'changed', unreachable: 'unreachable', removed: 'removed'}[result]
  const statements = [
    `INSERT INTO fact_checks (fact_id, run_id, checked_at, result, note)
      VALUES (${sqlLiteral(factId)}, ${sqlLiteral(runId)}, ${sqlLiteral(at)}, ${sqlLiteral(result)}, ${sqlLiteral(note)})`,
    `UPDATE facts SET status = ${sqlLiteral(status)}, next_check_at = ${sqlLiteral(result === 'removed' ? null : nextCheckAt)},
      last_checked_at = ${result === 'unchanged' ? sqlLiteral(taipeiDate(now)) : 'last_checked_at'}, updated_at = ${sqlLiteral(at)}
      WHERE fact_id = ${sqlLiteral(factId)}`,
  ]
  if (result === 'changed') {
    statements.push(
      `INSERT INTO exceptions (created_at, kind, subject, detail, action_needed)
        VALUES (${sqlLiteral(at)}, 'big-change', ${sqlLiteral(factId)}, ${sqlLiteral(note ?? '重查發現官方資料改變')},
          '更新地點事實表與用到這筆事實的文章')`,
    )
  }
  const results = await execute([...statements, `SELECT * FROM facts WHERE fact_id = ${sqlLiteral(factId)}`])
  return results.at(-1)?.[0] ?? null
}

export async function loadPlanningFacts(root = planningRoot) {
  const files = (await walk(root)).map((file) => ({file, posix: toPosix(file)}))
  const factTables = []
  for (const {file, posix} of files.filter(({posix}) => /\/places\/[^/]+\/facts\.json$/.test(posix))) {
    factTables.push({table: JSON.parse(await readFile(file, 'utf8')), evidencePath: toPosix(path.relative(projectRoot, file))})
  }
  const outlines = []
  for (const {file} of files.filter(({posix}) => posix.endsWith('-outline.json'))) outlines.push(JSON.parse(await readFile(file, 'utf8')))
  return {factTables, outlines}
}

async function runCli() {
  const argumentsList = process.argv.slice(2)
  const [command] = positionalArguments(argumentsList)
  const options = parseOptions(argumentsList)
  const execute = createOpsExecutor({local: Boolean(options.local)})
  let result
  if (command === 'sync') {
    result = await syncFacts({execute, ...(await loadPlanningFacts())})
  } else if (command === 'due') {
    result = await listDueFacts({execute, today: taipeiDate(new Date()), withinDays: Number(options.days ?? 0)})
  } else if (command === 'checked') {
    if (typeof options.fact !== 'string') throw new Error('checked 必須提供 --fact')
    result = await recordCheck({
      execute,
      factId: options.fact,
      result: options.result,
      nextCheckAt: typeof options.next === 'string' ? options.next : null,
      note: typeof options.note === 'string' ? options.note : null,
    })
  } else {
    throw new Error('用法：ops-facts.mjs sync | due [--days=N] | checked --fact=... --result=... --next=...')
  }
  console.log(JSON.stringify(result, null, 2))
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
