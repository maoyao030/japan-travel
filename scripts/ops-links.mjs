/**
 * 待補內連（維護資料庫 D1 的 pending_links）：連結句已經寫在正文，目標頁上線後只把錨文字加上連結。
 *
 * 用法：
 *   node scripts/ops-links.mjs register --article=<剛上線的文章> --outline=<群大綱 JSON> --sanity=.tmp/queue-state.json
 *   node scripts/ops-links.mjs ready --sanity=.tmp/queue-state.json      列出目標已上線、可以補的連結
 *   node scripts/ops-links.mjs linked --id=<link_id>                    補好後標記
 * 加 --local 改用本機資料庫。
 */
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {pendingLinksFromOutline} from './link-backfill.mjs'
import {createOpsExecutor, parseOptions, positionalArguments, sqlLiteral} from './ops-db.mjs'

export async function registerPendingLinks({execute, links, now = new Date()}) {
  if (links.length === 0) return {registered: 0}
  const at = sqlLiteral(now.toISOString())
  await execute(
    links.map(
      (link) => `INSERT INTO pending_links (from_article_id, to_article_id, section, sentence, anchor_text, target_path, source, created_at)
        SELECT ${sqlLiteral(link.fromArticleId)}, ${sqlLiteral(link.toArticleId)}, ${sqlLiteral(link.section)}, ${sqlLiteral(link.sentence)},
          ${sqlLiteral(link.anchorText)}, ${sqlLiteral(link.targetPath)}, ${sqlLiteral(link.source)}, ${at}
        WHERE NOT EXISTS (
          SELECT 1 FROM pending_links WHERE from_article_id = ${sqlLiteral(link.fromArticleId)}
            AND to_article_id = ${sqlLiteral(link.toArticleId)} AND sentence = ${sqlLiteral(link.sentence)}
        )`,
    ),
  )
  return {registered: links.length}
}

/** 目標文章已開放索引、來源文章也已開放索引，而且還沒補的連結。 */
export async function listReadyLinks({execute, publishedArticleIds}) {
  const [rows] = await execute(['SELECT * FROM pending_links WHERE linked_at IS NULL ORDER BY link_id'])
  const published = new Set(publishedArticleIds)
  return rows.filter((row) => published.has(row.to_article_id) && published.has(row.from_article_id))
}

export async function markLinked({execute, linkId, now = new Date()}) {
  if (!Number.isInteger(linkId)) throw new Error('linkId 必須是整數')
  const results = await execute([
    `UPDATE pending_links SET linked_at = ${sqlLiteral(now.toISOString())} WHERE link_id = ${linkId} AND linked_at IS NULL`,
    `SELECT link_id, linked_at FROM pending_links WHERE link_id = ${linkId}`,
  ])
  return results[1]?.[0] ?? null
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
    const links = pendingLinksFromOutline({outline, articleId: options.article, publishedArticleIds: published, pagePaths: paths})
    console.log(JSON.stringify({...(await registerPendingLinks({execute, links})), links}, null, 2))
    return
  }
  if (command === 'ready') {
    if (typeof options.sanity !== 'string') throw new Error('ready 必須提供 --sanity')
    const {published} = await publishedIdsFrom(options.sanity)
    console.log(JSON.stringify(await listReadyLinks({execute, publishedArticleIds: published}), null, 2))
    return
  }
  if (command === 'linked') {
    const row = await markLinked({execute, linkId: Number(options.id)})
    console.log(JSON.stringify(row, null, 2))
    if (!row?.linked_at) process.exitCode = 1
    return
  }
  throw new Error('用法：ops-links.mjs register|ready|linked ...')
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) await runCli()
