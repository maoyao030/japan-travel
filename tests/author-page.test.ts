import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

const projectRoot = new URL('../', import.meta.url)

test('作者頁由 Sanity 作者文件產生，只為有文章的作者建頁', async () => {
  const [page, articlePage, sanity] = await Promise.all([
    readFile(new URL('src/pages/authors/[slug].astro', projectRoot), 'utf8'),
    readFile(new URL('src/components/ArticlePage.astro', projectRoot), 'utf8'),
    readFile(new URL('src/lib/sanity.ts', projectRoot), 'utf8'),
  ])

  assert.match(page, /getPublishedContentRoutes/)
  assert.match(page, /authors\s*\.filter\(\(author\) => author\.slug && author\.slug !== EDITORIAL_TEAM_SLUG\)/)
  assert.match(page, /\.filter\(\(\{authoredArticles\}\) => authoredArticles\.length > 0\)/)
  assert.match(page, /noindex=\{indexableArticles\.length === 0\}/)
  assert.match(page, /createProfilePageStructuredData/)
  assert.match(page, /structuredData=\{structuredData\}/)
  assert.match(page, /type: 'Person'/)
  assert.match(page, /authoredArticles\.map/)
  assert.match(page, /<h3>\{article\.title\}<\/h3>/)
  assert.match(page, /<p>\{article\.excerpt\}<\/p>/)
  assert.doesNotMatch(page, /好材誌|書隅|shu-u/)

  assert.match(articlePage, /article\.authorSlug !== 'editorial-team'/)
  assert.match(articlePage, /`\/authors\/\$\{article\.authorSlug\}\/`/)
  assert.match(articlePage, /authorType: 'Person'/)
  assert.match(sanity, /export async function getSanityAuthors/)
})
