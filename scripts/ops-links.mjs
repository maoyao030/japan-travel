/**
 * 待補內連（維護資料庫 D1 的 pending_links）：連結句已經寫在正文，目標頁上線後只把錨文字加上連結。
 *
 * 用法：
 *   node scripts/ops-links.mjs register --article=<剛上線的文章> --outline=<群大綱 JSON> --sanity=.tmp/queue-state.json [--body=<article.json>]
 *     有 --body 時，正文裡已經接好的連結（上線前 link-at-publish 接的）直接登記成已補。
 *   node scripts/ops-links.mjs ready --sanity=.tmp/queue-state.json      列出目標已上線、可以補的連結
 *   node scripts/ops-links.mjs linked --id=<link_id>                    補好後標記
 *   node scripts/ops-links.mjs skip --id=<link_id> --reason=<原因>       補不上時略過，寫一筆例外，之後不再挑它
 *   node scripts/ops-links.mjs failed --id=<link_id> --reason=<原因>     補上後 CI 失敗已回復：記一次，滿 MAX_LINK_FAILURES 次自動略過
 * 加 --local 改用本機資料庫。
 */
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {isLinkInBody, pendingLinksFromOutline} from './link-backfill.mjs'
import {createOpsExecutor, parseOptions, positionalArguments, sqlLiteral} from './ops-db.mjs'

export const MAX_LINK_FAILURES = 3

export async function registerPendingLinks({execute, links, now = new Date()}) {
  if (links.length === 0) return {registered: 0, alreadyLinked: 0}
  const at = sqlLiteral(now.toISOString())
  const sameLink = (link) => `from_article_id = ${sqlLiteral(link.fromArticleId)}
            AND to_article_id = ${sqlLiteral(link.toArticleId)} AND sentence = ${sqlLiteral(link.sentence)}`
  await execute(
    links.flatMap((link) => [
      `INSERT INTO pending_links (from_article_id, to_article_id, section, sentence, anchor_text, target_path, source, created_at, linked_at)
        SELECT ${sqlLiteral(link.fromArticleId)}, ${sqlLiteral(link.toArticleId)}, ${sqlLiteral(link.section)}, ${sqlLiteral(link.sentence)},
          ${sqlLiteral(link.anchorText)}, ${sqlLiteral(link.targetPath)}, ${sqlLiteral(link.source)}, ${at}, ${link.linked ? at : 'NULL'}
        WHERE NOT EXISTS (SELECT 1 FROM pending_links WHERE ${sameLink(link)})`,
      // 之前登記過、這次正文已經接好的，也標成已補。
      ...(link.linked ? [`UPDATE pending_links SET linked_at = ${at} WHERE ${sameLink(link)} AND linked_at IS NULL`] : []),
    ]),
  )
  return {registered: links.length, alreadyLinked: links.filter((link) => link.linked).length}
}

/**
 * 目標文章已開放索引、來源文章也已開放索引，而且還沒補的連結。
 * 登記時目標還不在清單裡（跨群）的連結沒有網址，這裡用目前的清單網址補上；補不到的不列出。
 */
export async function listReadyLinks({execute, publishedArticleIds, pagePaths = {}}) {
  const [rows] = await execute(['SELECT * FROM pending_links WHERE linked_at IS NULL AND skipped_at IS NULL ORDER BY link_id'])
  const published = new Set(publishedArticleIds)
  return rows
    .filter((row) => published.has(row.to_article_id) && published.has(row.from_article_id))
    .map((row) => ({...row, target_path: row.target_path ?? pagePaths[row.to_article_id] ?? null}))
    .filter((row) => row.target_path)
}

export async function markLinked({execute, linkId, now = new Date()}) {
  if (!Number.isInteger(linkId)) throw new Error('linkId 必須是整數')
  const results = await execute([
    `UPDATE pending_links SET linked_at = ${sqlLiteral(now.toISOString())} WHERE link_id = ${linkId} AND linked_at IS NULL`,
    `SELECT link_id, linked_at FROM pending_links WHERE link_id = ${linkId}`,
  ])
  return results[1]?.[0] ?? null
}

/** 找不到連結句或錨文字不唯一時略過：不改字，交給人處理。 */
export async function skipLink({execute, linkId, reason, now = new Date()}) {
  if (!Number.isInteger(linkId)) throw new Error('linkId 必須是整數')
  const at = sqlLiteral(now.toISOString())
  const results = await execute([
    `UPDATE pending_links SET skipped_at = ${at}, skip_reason = ${sqlLiteral(reason)} WHERE link_id = ${linkId} AND linked_at IS NULL AND skipped_at IS NULL`,
    `INSERT INTO exceptions (created_at, kind, subject, detail, action_needed)
      SELECT ${at}, 'other', from_article_id || ' → ' || to_article_id, ${sqlLiteral(`補內連略過：${reason}`)}, '連結句要人工調整後重新登記'
      FROM pending_links WHERE link_id = ${linkId} AND skipped_at = ${at}`,
    `SELECT link_id, skipped_at, skip_reason FROM pending_links WHERE link_id = ${linkId}`,
  ])
  return results[2]?.[0] ?? null
}

/** 補上後 CI 失敗、已經回復：記一次；累積 MAX_LINK_FAILURES 次就略過，不再每輪重挑。 */
export async function recordLinkFailure({execute, linkId, reason, now = new Date()}) {
  if (!Number.isInteger(linkId)) throw new Error('linkId 必須是整數')
  const results = await execute([
    `UPDATE pending_links SET failures = failures + 1 WHERE link_id = ${linkId} AND linked_at IS NULL AND skipped_at IS NULL`,
    `SELECT link_id, failures, skipped_at FROM pending_links WHERE link_id = ${linkId}`,
  ])
  const row = results[1]?.[0] ?? null
  if (!row || row.skipped_at) return row
  if (row.failures >= MAX_LINK_FAILURES) {
    return skipLink({execute, linkId, reason: `補上後 CI 連續失敗 ${row.failures} 次：${reason}`, now})
  }
  return row
}

async function publishedIdsFrom(sanityStatePath) {
  const state = JSON.parse(await readFile(path.resolve(sanityStatePath), 'utf8'))
  return {
    published: (state.items ?? []).filter((item) => item.status === 'published_indexable').map((item) => item.articleId),
    paths: Object.fromEntries((state.items ?? []).map((item) => [item.articleId, item.targetPath])),
  }
}

async function runCli() {
  const argumentsList = process.argv.slice(2)
  const [command] = positionalArguments(argumentsList)
  const options = parseOptions(argumentsList)
  const execute = createOpsExecutor({local: Boolean(options.local)})

  if (command === 'register') {
    for (const name of ['article', 'outline', 'sanity']) if (typeof options[name] !== 'string') throw new Error(`register 必須提供 --${name}`)
    const outline = JSON.parse(await readFile(path.resolve(options.outline), 'utf8'))
    const {published, paths} = await publishedIdsFrom(options.sanity)
    const body = typeof options.body === 'string' ? JSON.parse(await readFile(path.resolve(options.body), 'utf8')).body : null
    const links = pendingLinksFromOutline({outline, articleId: options.article, publishedArticleIds: published, pagePaths: paths}).map((link) =>
      body && link.targetPath && isLinkInBody(body, link) ? {...link, linked: true} : link,
    )
    console.log(JSON.stringify({...(await registerPendingLinks({execute, links})), links}, null, 2))
    return
  }
  if (command === 'ready') {
    if (typeof options.sanity !== 'string') throw new Error('ready 必須提供 --sanity')
    const {published, paths} = await publishedIdsFrom(options.sanity)
    console.log(JSON.stringify(await listReadyLinks({execute, publishedArticleIds: published, pagePaths: paths}), null, 2))
    return
  }
  if (command === 'linked') {
    const row = await markLinked({execute, linkId: Number(options.id)})
    console.log(JSON.stringify(row, null, 2))
    if (!row?.linked_at) process.exitCode = 1
    return
  }
  if (command === 'skip') {
    if (typeof options.reason !== 'string') throw new Error('skip 必須提供 --reason')
    const row = await skipLink({execute, linkId: Number(options.id), reason: options.reason})
    console.log(JSON.stringify(row, null, 2))
    if (!row?.skipped_at) process.exitCode = 1
    return
  }
  if (command === 'failed') {
    if (typeof options.reason !== 'string') throw new Error('failed 必須提供 --reason')
    const row = await recordLinkFailure({execute, linkId: Number(options.id), reason: options.reason})
    console.log(JSON.stringify(row, null, 2))
    if (!row) process.exitCode = 1
    return
  }
  throw new Error('用法：ops-links.mjs register|ready|linked|skip|failed ...')
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
