/**
 * 印出今天的優化提醒（每日排定工作用，也可以自己跑）。只讀後台公開資料，不改任何東西。
 * 用法：npm run optimize:today            （今天，台北日期）
 *       npm run optimize:today -- --day=2026-11-05
 */
import {articlePath} from '../studio/lib/articleUrl.ts'
import {buildDailyMessage, taipeiDate} from './daily-optimize.mjs'

const dayOption = process.argv.find((argument) => argument.startsWith('--day='))
const day = dayOption ? dayOption.slice('--day='.length) : taipeiDate(new Date().toISOString())

const QUERY = `*[_type == "article" && !(_id in path("drafts.**"))]{
  _id, title, aspect, noindex, publishedAt, studioEditedAt, studioEditLog[]{at}, body,
  "slug": slug.current,
  "hub": primaryHub->{"slug": slug.current, category, "landing": landingArticle._ref, "parent": parentHub->slug.current}
}`
const url = new URL('https://e8ctf7ee.api.sanity.io/v2026-08-29/data/query/production')
url.searchParams.set('query', QUERY)
const response = await fetch(url)
if (!response.ok) throw new Error(`讀不到後台資料：HTTP ${response.status}`)
const {result} = await response.json()

const articles = result.map((article) => ({
  ...article,
  id: article._id,
  path: articlePath({id: article._id, slug: article.slug, hub: article.hub}),
}))
console.log(buildDailyMessage({articles, day}))
