/**
 * 手動優化紀錄與成效比較（給 scripts/manual-edits-report.mjs 用）。
 *
 * 紀錄的來源有兩個，合併後去掉重複：
 * - 後台文章的 studioEditLog：每次在後台按「發布」加一筆；
 * - Git 的 content-automation/manual-edits-log.json：pull:studio-edits --apply 時寫入，後台紀錄被覆蓋也還在。
 *
 * 成效：用 Search Console 每頁每天的點擊、曝光、平均排名，比較「第一次手動優化」前後各 28 天，
 * 再和同一段時間沒優化過的文章比，扣掉整站自然成長。
 */

export const WINDOW_DAYS = 28
const TAIPEI = 'Asia/Taipei'

/** ISO 時間轉成台北日期 YYYY-MM-DD。 */
export function taipeiDate(iso) {
  return new Intl.DateTimeFormat('en-CA', {timeZone: TAIPEI, year: 'numeric', month: '2-digit', day: '2-digit'}).format(
    new Date(iso),
  )
}

export function addDays(day, days) {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * @param {Array<{id: string, title: string, path?: string, studioEditLog?: Array<{at: string}>, studioEditedAt?: string}>} articles 後台的文章
 * @param {{edits?: Array<{article: string, publishTimes: string[]}>}} gitLog
 * @returns 每篇手動優化過的文章：發布時間、優化的日子（台北日期，同一天算一次）
 */
export function summarizeEdits(articles, gitLog) {
  const times = new Map()
  const add = (id, at) => {
    if (!at || Number.isNaN(Date.parse(at))) return
    if (!times.has(id)) times.set(id, new Set())
    times.get(id).add(new Date(at).toISOString())
  }
  for (const article of articles) {
    for (const entry of article.studioEditLog ?? []) add(article.id, entry?.at)
    if ((article.studioEditLog ?? []).length === 0) add(article.id, article.studioEditedAt)
  }
  for (const entry of gitLog?.edits ?? []) {
    for (const at of entry.publishTimes ?? []) add(entry.article, at)
  }

  const byId = new Map(articles.map((article) => [article.id, article]))
  return [...times.entries()]
    .map(([id, set]) => {
      const publishTimes = [...set].sort()
      const days = [...new Set(publishTimes.map(taipeiDate))]
      const article = byId.get(id)
      return {id, title: article?.title ?? id, path: article?.path, publishTimes, days}
    })
    .sort((a, b) => b.publishTimes.at(-1).localeCompare(a.publishTimes.at(-1)))
}

/** Search Console 的網址轉成站內路徑，和文章路徑比對用。 */
export function pagePath(page) {
  try {
    return new URL(page).pathname
  } catch {
    return page.startsWith('/') ? page : `/${page}`
  }
}

/** 一段日期內的合計：點擊、曝光、依曝光加權的平均排名。 */
function totals(rows) {
  let clicks = 0
  let impressions = 0
  let weighted = 0
  for (const row of rows) {
    clicks += row.clicks
    impressions += row.impressions
    weighted += row.position * row.impressions
  }
  return {clicks, impressions, position: impressions > 0 ? weighted / impressions : null}
}

/**
 * 以優化那天為界，比較前後各 WINDOW_DAYS 天（優化當天不算）。
 * @param {Array<{date: string, page: string, clicks: number, impressions: number, position: number}>} rows
 * @param {Set<string>} paths 要合計的頁面路徑
 * @param {string} editDay 台北日期
 * @param {string} lastDataDay 資料最後一天
 */
export function compareAround(rows, paths, editDay, lastDataDay) {
  const beforeStart = addDays(editDay, -WINDOW_DAYS)
  const afterStart = addDays(editDay, 1)
  const afterEnd = addDays(editDay, WINDOW_DAYS)
  const selected = rows.filter((row) => paths.has(pagePath(row.page)))
  return {
    before: totals(selected.filter((row) => row.date >= beforeStart && row.date < editDay)),
    after: totals(selected.filter((row) => row.date >= afterStart && row.date <= afterEnd)),
    complete: lastDataDay >= afterEnd,
    afterEnd,
  }
}

/** 解析 Search Console 每頁每天的 CSV（欄位 date,page,clicks,impressions,position）。 */
export function parseSearchConsoleCsv(text) {
  const lines = text.replaceAll('\r\n', '\n').split('\n').filter((line) => line.trim() !== '')
  if (lines.length === 0) return []
  const header = lines[0].split(',').map((cell) => cell.trim())
  const column = (name) => {
    const index = header.indexOf(name)
    if (index === -1) throw new Error(`Search Console 資料缺少欄位 ${name}`)
    return index
  }
  const [date, page, clicks, impressions, position] = ['date', 'page', 'clicks', 'impressions', 'position'].map(column)
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    return {
      date: cells[date].trim(),
      page: cells[page].trim(),
      clicks: Number(cells[clicks]),
      impressions: Number(cells[impressions]),
      position: Number(cells[position]),
    }
  })
}

const percent = (before, after) => {
  if (before === 0) return after === 0 ? '0%' : '新出現'
  const change = Math.round(((after - before) / before) * 100)
  return `${change > 0 ? '+' : ''}${change}%`
}
const rank = (value) => (value === null ? '—' : value.toFixed(1))

/**
 * @param {{summaries: ReturnType<typeof summarizeEdits>, livePaths: string[], rows: Array | null, today: string}} input
 */
export function buildManualEditsReport({summaries, livePaths, rows, today}) {
  const lines = [
    '# 手動優化紀錄與成效',
    '',
    `更新：${today}（台北）。由 \`npm run report:manual-edits\` 產生，不要手動改這份檔案。`,
    '',
    '「優化幾次」照日子算，同一天在後台按好幾次「發布」算一次；「發布次數」是實際按了幾次。',
    '',
    '## 手動優化過的文章',
    '',
  ]

  if (summaries.length === 0) {
    lines.push('還沒有手動優化過的文章。', '')
  } else {
    lines.push('| 文章 | 優化幾次 | 發布次數 | 優化的日子 |', '|---|---|---|---|')
    for (const summary of summaries) {
      const name = summary.path ? `[${summary.title}](https://offpathnotes.com${summary.path})` : summary.title
      lines.push(`| ${name} | ${summary.days.length} | ${summary.publishTimes.length} | ${summary.days.join('、')} |`)
    }
    lines.push('')
  }

  lines.push('## 成效', '')
  if (!rows || rows.length === 0) {
    lines.push(
      '還沒有 Search Console 資料。資料放進 `content-automation/search-console/pages-daily.csv`（欄位 date,page,clicks,impressions,position，每頁每天一列）後重跑報表，這裡就會出現優化前後的比較。',
      '',
    )
    return `${lines.join('\n')}\n`
  }

  const lastDataDay = rows.map((row) => row.date).sort().at(-1)
  const editedPaths = new Set(summaries.map((summary) => summary.path).filter(Boolean))
  const controlPaths = new Set(livePaths.filter((path) => !editedPaths.has(path)))
  lines.push(
    `比較第一次手動優化前後各 ${WINDOW_DAYS} 天（優化當天不算）。平均排名數字越小越前面。「沒優化的文章」是同一段時間其他上線文章的合計，用來扣掉整站自然成長：優化的文章變化比它好，才算優化有效。資料到 ${lastDataDay}。`,
    '',
    '| 文章 | 第一次優化 | 點擊 前→後 | 曝光 前→後 | 平均排名 前→後 | 沒優化的文章同期曝光 | 狀態 |',
    '|---|---|---|---|---|---|---|',
  )
  for (const summary of summaries) {
    if (!summary.path) continue
    const editDay = summary.days[0]
    const own = compareAround(rows, new Set([summary.path]), editDay, lastDataDay)
    const control = compareAround(rows, controlPaths, editDay, lastDataDay)
    const status = own.complete ? '可以判斷' : `累積中，${own.afterEnd} 後再看`
    lines.push(
      `| ${summary.title} | ${editDay} | ${own.before.clicks}→${own.after.clicks}（${percent(own.before.clicks, own.after.clicks)}） | ${own.before.impressions}→${own.after.impressions}（${percent(own.before.impressions, own.after.impressions)}） | ${rank(own.before.position)}→${rank(own.after.position)} | ${percent(control.before.impressions, control.after.impressions)} | ${status} |`,
    )
  }
  lines.push(
    '',
    '注意：網站還很新，前幾週每頁的點擊與曝光很少，一兩次的差距就會讓百分比跳很大，要累積幾篇、幾個月一起看。優化前後如果同一篇也被 AI 重寫或補了照片，成效會混在一起。',
    '',
  )
  return `${lines.join('\n')}\n`
}
