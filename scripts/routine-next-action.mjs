/**
 * 決定 routine 這一輪只做哪一件事。優先順序見 content-automation/routine-architecture.md「一輪做什麼」：
 * 續做 → 補登記 → 補內連 → 規劃下一群（每天最多一次）→ 核准檢查 → 生產一篇 → 事實重查 → 每週摘要 → 略過。
 *
 * 用法（先在 studio/ 執行 inspect-article-queue.mjs，把輸出存成檔案）：
 *   node scripts/routine-next-action.mjs --sanity=.tmp/queue-state.json [--local]
 */
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {getItemBatch, getItemTravelGroup, getProductionOrderedItems, getTravelGroups, loadArticleQueue} from './article-automation-policy.mjs'
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

const describe = (item) => ({articleId: item.articleId, groupId: item.groupId, batchId: item.batchId ?? null, targetPath: item.targetPath ?? null})

/**
 * 純判斷，不讀寫任何東西。
 * items：依生產順序，每項 {articleId, groupId, batchId, targetPath, sanityStatus}；groupId 為 null 表示不屬於旅行群。
 * groupStates：{groupId: {state, checkedToday}}；checkedToday 表示今天已經讀過規劃總表。
 * lastPlanAt：今天（台北日期）是否已經跑過規劃，用 plannedToday 表示。
 */
export function decideNextAction({
  items,
  groups = [],
  articleStates = {},
  groupStates = {},
  remainingDailyCapacity = Number.POSITIVE_INFINITY,
  dailyCap = null,
  readyLinkCount = 0,
  dueFactCount = 0,
  lastSummaryAt = null,
  plannedToday = false,
  now = new Date(),
}) {
  const notes = []
  const blocked = items.filter((item) => item.sanityStatus?.startsWith('blocked_'))
  if (blocked.length > 0) notes.push(`Sanity 狀態異常，已略過：${blocked.map((item) => item.articleId).join('、')}`)

  // 1 續做：已暫存 noindex 的文章（停放的除外）。
  const staged = items.find((item) => item.sanityStatus === 'staged_noindex' && articleStates[item.articleId]?.state !== 'parked')
  if (staged) return {action: 'resume', ...describe(staged), notes}

  // 2 補登記：Sanity 已開放索引，但 D1 還沒記成已發布（上一輪在登記前中斷）。
  const unregistered = items.find(
    (item) =>
      item.sanityStatus === 'published_indexable' &&
      articleStates[item.articleId] &&
      articleStates[item.articleId].state !== 'published',
  )
  if (unregistered) return {action: 'catch-up', ...describe(unregistered), notes}

  // 3 補內連。
  if (readyLinkCount > 0) return {action: 'backfill-links', readyLinkCount, notes}

  const groupState = (groupId) => (groupId ? groupStates[groupId]?.state ?? 'unknown' : 'approved')
  const checkedToday = (groupId) => Boolean(groupId && groupStates[groupId]?.checkedToday)
  const open = items.filter((item) => item.sanityStatus === 'unpublished' && !isWaiting(articleStates[item.articleId], now))

  // 4 規劃下一群：目前已核准、還沒寫的篇數約剩 7 天的量，而且沒有在等核准的群；每天最多試一次。
  const pendingGroups = groups.filter((group) => groupState(group.id) !== 'approved')
  const remainingApproved = open.filter((item) => groupState(item.groupId) === 'approved').length
  const cap = Number.isFinite(dailyCap) && dailyCap > 0 ? dailyCap : DEFAULT_DAILY_CAP_FOR_PLANNING
  const threshold = PLANNING_LEAD_DAYS * cap
  if (groups.length > 0 && pendingGroups.length === 0 && remainingApproved <= threshold && !plannedToday) {
    return {action: 'plan-next-group', remainingApproved, threshold, notes}
  }
  if (pendingGroups.length > 0) notes.push(`有旅行群還沒核准：${pendingGroups.map((group) => group.id).join('、')}`)

  // 5 核准檢查與 6 生產：沒核准的群每天讀一次規劃總表；今天讀過還沒核准，就略過那一群的文章。
  for (const item of open) {
    const state = groupState(item.groupId)
    if (state !== 'approved') {
      if (checkedToday(item.groupId)) continue
      const group = groups.find((candidate) => candidate.id === item.groupId)
      return {action: 'evaluate-group', groupId: item.groupId, autoApproveOn: group?.autoApproveOn ?? null, notes}
    }
    if (remainingDailyCapacity < 1) {
      notes.push('今天的篇數已經用完')
      break
    }
    return {action: 'produce', ...describe(item), notes}
  }

  // 7 事實重查、8 每週摘要。
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
    batchId: getItemBatch(queue, item)?.id ?? null,
    targetPath: item.targetPath,
    sanityStatus: sanityById.get(item.articleId) ?? 'unknown',
  }))
  const groups = getTravelGroups(queue).map((group) => ({id: group.id, autoApproveOn: group.approval?.autoApproveOn ?? null}))
  const today = taipeiDate(now)
  const [articleRows, groupRows, linkRows, [facts], [summary], [plan]] = await execute([
    'SELECT article_id, state, defer_until FROM article_status',
    'SELECT group_id, state, updated_at FROM group_status',
    'SELECT from_article_id, to_article_id FROM pending_links WHERE linked_at IS NULL AND skipped_at IS NULL',
    `SELECT COUNT(*) AS n FROM facts WHERE next_check_at IS NOT NULL AND next_check_at <= ${sqlLiteral(today)} AND status != 'removed'`,
    "SELECT MAX(started_at) AS last FROM runs WHERE kind = 'summary' AND result IN ('done', 'no-work')",
    "SELECT MAX(started_at) AS last FROM runs WHERE kind = 'plan'",
  ])
  const published = (articleId) => sanityById.get(articleId) === 'published_indexable'
  const remaining = sanityState.cadence?.remainingDailyCapacity
  return {
    items,
    groups,
    articleStates: Object.fromEntries(articleRows.map((row) => [row.article_id, row])),
    groupStates: Object.fromEntries(
      groupRows.map((row) => [row.group_id, {state: row.state, checkedToday: taipeiDate(new Date(row.updated_at)) === today}]),
    ),
    remainingDailyCapacity: typeof remaining === 'number' ? remaining : Number.POSITIVE_INFINITY,
    dailyCap: queue.publicationCadence.maxArticlesPerDay,
    readyLinkCount: linkRows.filter((row) => published(row.from_article_id) && published(row.to_article_id)).length,
    dueFactCount: facts?.n ?? 0,
    lastSummaryAt: summary?.last ?? null,
    plannedToday: Boolean(plan?.last) && taipeiDate(new Date(plan.last)) === today,
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
