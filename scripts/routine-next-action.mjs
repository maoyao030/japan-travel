/**
 * 決定 routine 這一輪只做哪一件事。優先順序見 content-automation/routine-architecture.md「一輪做什麼」：
 * 續做 → 補內連 → 核准檢查 → 生產一篇 → 規劃下一群 → 事實重查 → 每週摘要 → 略過。
 *
 * 用法（先在 studio/ 執行 inspect-article-queue.mjs，把輸出存成檔案）：
 *   node scripts/routine-next-action.mjs --sanity=.tmp/queue-state.json [--local]
 */
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {getItemTravelGroup, getProductionOrderedItems, getTravelGroups, loadArticleQueue} from './article-automation-policy.mjs'
import {createOpsExecutor, parseOptions, projectRoot, sqlLiteral, taipeiDate} from './ops-db.mjs'

export const PLANNING_LEAD_DAYS = 7
export const DEFAULT_DAILY_CAP_FOR_PLANNING = 2
export const SUMMARY_INTERVAL_DAYS = 7
const DAY = 24 * 60 * 60 * 1000
const queuePath = path.join(projectRoot, 'content-automation', 'article-queue.json')

function isWaiting(articleState, now) {
  if (!articleState) return false
  if (articleState.state === 'parked' || articleState.state === 'published') return true
  return articleState.state === 'deferred' && Boolean(articleState.defer_until) && articleState.defer_until > now.toISOString()
}

/**
 * 純判斷，不讀寫任何東西。
 * items：依生產順序，每項 {articleId, groupId, sanityStatus}；groupId 為 null 表示不屬於旅行群（批次本身的常設授權）。
 */
export function decideNextAction({
  items,
  groups = [],
  articleStates = {},
  groupStates = {},
  remainingDailyCapacity = Number.POSITIVE_INFINITY,
  dailyCap = null,
  readyLinkCount = 0,
  openBackfillCount = 0,
  dueFactCount = 0,
  lastSummaryAt = null,
  now = new Date(),
}) {
  const notes = []
  const blocked = items.filter((item) => item.sanityStatus?.startsWith('blocked_'))
  if (blocked.length > 0) notes.push(`Sanity 狀態異常，已略過：${blocked.map((item) => item.articleId).join('、')}`)

  const staged = items.find((item) => item.sanityStatus === 'staged_noindex')
  if (staged) return {action: 'resume', articleId: staged.articleId, groupId: staged.groupId, notes}

  if (readyLinkCount + openBackfillCount > 0) {
    return {action: 'backfill-links', readyLinkCount, openBackfillCount, notes}
  }

  const groupState = (groupId) => (groupId ? groupStates[groupId]?.state ?? 'unknown' : 'approved')
  const open = items.filter(
    (item) => item.sanityStatus === 'unpublished' && !isWaiting(articleStates[item.articleId], now),
  )

  for (const item of open) {
    const state = groupState(item.groupId)
    if (state === 'changes-requested' || state === 'paused') continue
    if (state !== 'approved') {
      const group = groups.find((candidate) => candidate.id === item.groupId)
      return {action: 'evaluate-group', groupId: item.groupId, autoApproveOn: group?.autoApproveOn ?? null, notes}
    }
    if (remainingDailyCapacity < 1) {
      notes.push('今天的篇數已經用完')
      break
    }
    return {action: 'produce', articleId: item.articleId, groupId: item.groupId, notes}
  }

  const pendingGroups = groups.filter((group) => groupState(group.id) !== 'approved')
  const remainingApproved = open.filter((item) => groupState(item.groupId) === 'approved').length
  const cap = Number.isFinite(dailyCap) && dailyCap > 0 ? dailyCap : DEFAULT_DAILY_CAP_FOR_PLANNING
  if (groups.length > 0 && pendingGroups.length === 0 && remainingApproved <= PLANNING_LEAD_DAYS * cap) {
    return {action: 'plan-next-group', remainingApproved, threshold: PLANNING_LEAD_DAYS * cap, notes}
  }
  if (pendingGroups.length > 0) notes.push(`有旅行群在等核准或修改：${pendingGroups.map((group) => group.id).join('、')}`)

  if (dueFactCount > 0) return {action: 'recheck-facts', dueFactCount, notes}

  if (!lastSummaryAt || now.getTime() - Date.parse(lastSummaryAt) >= SUMMARY_INTERVAL_DAYS * DAY) {
    return {action: 'weekly-summary', notes}
  }

  if (groups.length === 0 && items.length === 0) notes.push('清單是空的；地區的第一群要和 Darren 一起規劃')
  return {action: 'idle', notes}
}

async function loadInputs({execute, sanityStatePath, now}) {
  const queue = await loadArticleQueue(queuePath, projectRoot)
  const sanityState = JSON.parse(await readFile(path.resolve(sanityStatePath), 'utf8'))
  const sanityById = new Map((sanityState.items ?? []).map((item) => [item.articleId, item.status]))
  const items = getProductionOrderedItems(queue).map((item) => ({
    articleId: item.articleId,
    groupId: getItemTravelGroup(queue, item)?.id ?? null,
    sanityStatus: sanityById.get(item.articleId) ?? 'unknown',
  }))
  const groups = getTravelGroups(queue).map((group) => ({id: group.id, autoApproveOn: group.approval?.autoApproveOn ?? null}))
  const today = taipeiDate(now)
  const [articleRows, groupRows, linkRows, [backfill], [facts], [summary]] = await execute([
    'SELECT article_id, state, defer_until FROM article_status',
    'SELECT group_id, state FROM group_status',
    'SELECT DISTINCT to_article_id FROM pending_links WHERE linked_at IS NULL',
    "SELECT COUNT(*) AS n FROM backfill_tasks WHERE status = 'open'",
    `SELECT COUNT(*) AS n FROM facts WHERE next_check_at IS NOT NULL AND next_check_at <= ${sqlLiteral(today)} AND status != 'removed'`,
    "SELECT MAX(started_at) AS last FROM runs WHERE kind = 'summary' AND result = 'done'",
  ])
  const remaining = sanityState.cadence?.remainingDailyCapacity
  return {
    items,
    groups,
    articleStates: Object.fromEntries(articleRows.map((row) => [row.article_id, row])),
    groupStates: Object.fromEntries(groupRows.map((row) => [row.group_id, row])),
    remainingDailyCapacity: typeof remaining === 'number' ? remaining : Number.POSITIVE_INFINITY,
    dailyCap: queue.publicationCadence.maxArticlesPerDay,
    readyLinkCount: linkRows.filter((row) => sanityById.get(row.to_article_id) === 'published_indexable').length,
    openBackfillCount: backfill?.n ?? 0,
    dueFactCount: facts?.n ?? 0,
    lastSummaryAt: summary?.last ?? null,
    now,
  }
}

async function runCli() {
  const options = parseOptions(process.argv.slice(2))
  if (typeof options.sanity !== 'string') throw new Error('必須提供 --sanity=<inspect-article-queue.mjs 的輸出檔>')
  const execute = createOpsExecutor({local: Boolean(options.local)})
  const now = new Date()
  const decision = decideNextAction(await loadInputs({execute, sanityStatePath: options.sanity, now}))
  console.log(JSON.stringify(decision, null, 2))
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
