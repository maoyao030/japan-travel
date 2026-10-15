import assert from 'node:assert/strict'
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {generateSeoFiles} from '../scripts/generate-seo-files.mjs'

async function createSite(files: Record<string, string>) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'japan-travel-seo-'))

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(directory, relativePath)
    await mkdir(path.dirname(filePath), {recursive: true})
    await writeFile(filePath, content)
  }

  return directory
}

test('Sitemap 只列出允許索引且 canonical 指向自己的頁面', async (context) => {
  const siteUrl = new URL('https://example.com/')
  const directory = await createSite({
    'index.html': '<link rel="canonical" href="https://example.com/">',
    'draft/index.html': '<meta name="robots" content="noindex, nofollow"><link rel="canonical" href="https://example.com/draft/">',
    'duplicate/index.html': '<link rel="canonical" href="https://example.com/">',
  })
  context.after(() => rm(directory, {recursive: true, force: true}))

  const result = await generateSeoFiles(directory, siteUrl)
  const sitemap = await readFile(path.join(directory, 'sitemap.xml'), 'utf8')
  const robots = await readFile(path.join(directory, 'robots.txt'), 'utf8')

  assert.deepEqual(result.sitemapUrls, ['https://example.com/'])
  assert.equal(result.excludedNoindex, 1)
  assert.equal(result.excludedNonCanonical, 1)
  assert.match(sitemap, /<loc>https:\/\/example\.com\/<\/loc>/)
  assert.doesNotMatch(sitemap, /draft|duplicate/)
  assert.equal(
    robots,
    'User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n',
  )
})

test('允許索引的頁面缺少 canonical 時會阻擋建置', async (context) => {
  const directory = await createSite({'index.html': '<title>缺少 canonical</title>'})
  context.after(() => rm(directory, {recursive: true, force: true}))

  await assert.rejects(
    generateSeoFiles(directory, new URL('https://example.com/')),
    /允許索引的頁面缺少 canonical：\//,
  )
})
