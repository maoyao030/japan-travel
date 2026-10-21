import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

import {siteCategories} from '../src/data/categories.ts'
import {getPublishedCategories} from '../src/data/hubs.ts'

const projectRoot = new URL('../', import.meta.url)

async function readProjectFile(path: string) {
  return readFile(new URL(path, projectRoot), 'utf8')
}

test('只有已有公開主題的大分類會出現在導覽', () => {
  const published = getPublishedCategories([
    {categorySlug: 'places'},
    {categorySlug: 'places'},
    {categorySlug: 'unknown'},
  ])

  assert.deepEqual(
    published.map((category) => category.slug),
    ['places'],
  )
  assert.deepEqual(getPublishedCategories([]), [])
  assert.equal(
    getPublishedCategories(siteCategories.map((category) => ({categorySlug: category.slug}))).length,
    siteCategories.length,
  )
})

test('導覽列、首頁與 404 只列出有內容的分類，並連到關於頁', async () => {
  const [layout, homepage, notFound] = await Promise.all([
    readProjectFile('src/layouts/BaseLayout.astro'),
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/pages/404.astro'),
  ])

  assert.match(layout, /getPublishedCategories\(publishableHubs\)/)
  assert.match(layout, /navCategories\.map/)
  assert.doesNotMatch(layout, /siteCategories\.map/)
  assert.match(layout, /<a href="\/about\/">關於\{SITE_NAME\}<\/a>/)

  assert.match(homepage, /getPublishedCategories\(publishableHubs\)/)
  assert.match(homepage, /homeCategories\s*\n?\s*\.filter/)
  assert.doesNotMatch(homepage, /siteCategories\.map/)

  assert.match(notFound, /getPublishedCategories\(publishableHubs\)/)
  assert.doesNotMatch(notFound, /siteCategories\.map/)
})

test('沒有公開主題的分類頁設為 noindex，有主題時列出文章', async () => {
  const categoryPage = await readProjectFile('src/pages/[category].astro')

  assert.match(categoryPage, /noindex=\{clusters\.length === 0\}/)
  assert.match(categoryPage, /clusters\.map/)
  assert.match(categoryPage, /<ClusterHubList nodes=\{node\.children\}/)
  assert.match(categoryPage, /getPublishedCategories\(publishableHubs\)/)
})

test('首頁依地區與分類列出地點站牌', async () => {
  const homepage = await readProjectFile('src/pages/index.astro')

  assert.match(homepage, /signGroups\.map/)
  assert.match(homepage, /regionHubs\.map/)
  assert.match(homepage, /countArticles\(hub\) > 0/)
})

test('關於頁說明編輯方針、資料來源與廣告揭露，且可索引', async () => {
  const [about, articlePage, consent] = await Promise.all([
    readProjectFile('src/pages/about.astro'),
    readProjectFile('src/components/ArticlePage.astro'),
    readProjectFile('src/components/AnalyticsConsent.astro'),
  ])

  assert.match(about, /noindex=\{false\}/)
  assert.match(about, /內容怎麼產出與查證/)
  assert.match(about, /資料來源/)
  assert.match(about, /訂房連結與合作揭露/)
  assert.match(about, /Trip\.com 與 Agoda/)
  assert.match(about, /更正與聯絡/)
  assert.match(about, /href="\/contact\/"/)
  assert.match(about, /href="\/privacy\/"/)

  assert.match(articlePage, /const authorHref = article\.authorSlug/)
  assert.match(articlePage, /`\/authors\/\$\{article\.authorSlug\}\/`/)
  assert.match(articlePage, /<a href=\{authorHref\}>\{authorName\}<\/a>/)
  assert.doesNotMatch(consent, /<h2/)
  assert.match(consent, /id="analytics-consent-title"/)
})
