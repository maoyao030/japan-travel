/**
 * 產生手動優化紀錄與成效報表：content-automation/manual-edits-report.md。
 * 讀後台公開的文章資料（不用權杖）、Git 的 content-automation/manual-edits-log.json，
 * 以及有的話 content-automation/search-console/pages-daily.csv。
 *
 * 用法：npm run report:manual-edits
 */
import {readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

import {articlePath} from '../studio/lib/articleUrl.ts'
import {buildManualEditsReport, parseSearchConsoleCsv, summarizeEdits, taipeiDate} from './manual-edits.mjs'

const projectRoot = path.resolve(import.meta.dirname, '..')
const PROJECT_ID = 'e8ctf7ee'
const QUERY = `*[_type == "article" && !(_id in path("drafts.**"))]{
  _id, title, noindex, studioEditedAt, studioEditLog[]{at},
  "slug": slug.current,
  "hub": primaryHub->{"slug": slug.current, category, "landing": landingArticle._ref, "parent": parentHub->slug.current}
}`

const readOptional = async (file) => {
  try {
    return await readFile(path.join(projectRoot, file), 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

const url = new URL(`https://${PROJECT_ID}.api.sanity.io/v2026-08-29/data/query/production`)
url.searchParams.set('query', QUERY)
const response = await fetch(url)
if (!response.ok) throw new Error(`讀不到後台資料：HTTP ${response.status}`)
const {result} = await response.json()

const articles = result.map((article) => ({
  id: article._id,
  title: article.title,
  noindex: article.noindex,
  path: articlePath({id: article._id, slug: article.slug, hub: article.hub}),
  studioEditLog: article.studioEditLog ?? [],
  studioEditedAt: article.studioEditedAt,
}))
const gitLogText = await readOptional('content-automation/manual-edits-log.json')
const csv = await readOptional('content-automation/search-console/pages-daily.csv')

const report = buildManualEditsReport({
  summaries: summarizeEdits(articles, gitLogText ? JSON.parse(gitLogText) : null),
  livePaths: articles.filter((article) => article.noindex !== true && article.path).map((article) => article.path),
  rows: csv ? parseSearchConsoleCsv(csv) : null,
  today: taipeiDate(new Date().toISOString()),
})
const output = path.join(projectRoot, 'content-automation/manual-edits-report.md')
await writeFile(output, report)
console.log(`已寫入 ${path.relative(projectRoot, output)}`)
