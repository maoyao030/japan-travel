/**
 * 上線前接內連：在定稿產生的 Sanity 正文（article.json）裡，把大綱連結句接到已經上線的頁面。
 * 只加連結標記，可見文字不變；直接改寫 article.json，之後照常 publish-prepared-article。
 * 找不到句子的連結不擋上線，登記後由補內連處理（找不到就略過並寫例外）。
 *
 * 用法：
 *   node scripts/link-at-publish.mjs .tmp/auto-publisher/<id>/sanity/article.json --article=<id> --outline=<群大綱 JSON> --sanity=.tmp/queue-state.json
 */
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {linkOutlineSentencesAtPublish, visibleText} from './link-backfill.mjs'
import {parseOptions, positionalArguments} from './ops-db.mjs'

export async function linkArticleFileAtPublish({articlePath, articleId, outline, queueState}) {
  const article = JSON.parse(await readFile(articlePath, 'utf8'))
  const items = queueState.items ?? []
  const result = linkOutlineSentencesAtPublish(article.body, {
    outline,
    articleId,
    publishedArticleIds: items.filter((item) => item.status === 'published_indexable').map((item) => item.articleId),
    pagePaths: Object.fromEntries(items.map((item) => [item.articleId, item.targetPath])),
  })
  if (visibleText(result.body) !== visibleText(article.body)) throw new Error('接內連後可見文字改變了，拒絕寫入')
  if (result.linked.length > 0) {
    await writeFile(articlePath, `${JSON.stringify({...article, body: result.body}, null, 2)}\n`, 'utf8')
  }
  return {articlePath, linked: result.linked, alreadyLinked: result.alreadyLinked, notLinked: result.notLinked}
}

async function runCli() {
  const argumentsList = process.argv.slice(2)
  const [articleArgument] = positionalArguments(argumentsList)
  const options = parseOptions(argumentsList)
  if (!articleArgument) throw new Error('必須提供 article.json 路徑')
  for (const name of ['article', 'outline', 'sanity']) if (typeof options[name] !== 'string') throw new Error(`必須提供 --${name}`)
  const result = await linkArticleFileAtPublish({
    articlePath: path.resolve(articleArgument),
    articleId: options.article,
    outline: JSON.parse(await readFile(path.resolve(options.outline), 'utf8')),
    queueState: JSON.parse(await readFile(path.resolve(options.sanity), 'utf8')),
  })
  console.log(JSON.stringify(result, null, 2))
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) {
  runCli().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
