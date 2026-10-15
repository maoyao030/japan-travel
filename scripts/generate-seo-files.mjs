import {readFile, readdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {resolveSiteUrl} from '../site.config.mjs'

async function listFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath]
    }),
  )

  return files.flat()
}

function routeForHtmlFile(filePath, outputDirectory) {
  const relativePath = path.relative(outputDirectory, filePath).split(path.sep).join('/')

  if (relativePath === 'index.html') return '/'
  if (relativePath.endsWith('/index.html')) {
    return `/${relativePath.slice(0, -'index.html'.length)}`
  }

  return `/${relativePath}`
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
}

function getAttribute(tag, name) {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'),
  )
  return match ? decodeHtmlAttribute(match[1] ?? match[2] ?? '') : null
}

function hasNoindex(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].some((match) => {
    const name = getAttribute(match[0], 'name')?.toLowerCase()
    const content = getAttribute(match[0], 'content')?.toLowerCase() ?? ''
    return name === 'robots' && /(?:^|[\s,])noindex(?:$|[\s,])/.test(content)
  })
}

function getCanonical(html) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = getAttribute(match[0], 'rel')?.toLowerCase().split(/\s+/) ?? []
    if (rel.includes('canonical')) return getAttribute(match[0], 'href')
  }

  return null
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function renderSitemap(urls) {
  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}

function renderRobots(siteUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${new URL('/sitemap.xml', siteUrl)}`,
    '',
  ].join('\n')
}

export async function generateSeoFiles(outputDirectory, configuredSiteUrl = resolveSiteUrl()) {
  const absoluteOutputDirectory = path.resolve(outputDirectory)
  const siteUrl = new URL(configuredSiteUrl)
  const files = await listFiles(absoluteOutputDirectory)
  const htmlFiles = files.filter((file) => file.endsWith('.html'))
  const sitemapUrls = new Set()
  let excludedNoindex = 0
  let excludedNonCanonical = 0

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, 'utf8')

    if (hasNoindex(html)) {
      excludedNoindex += 1
      continue
    }

    const route = routeForHtmlFile(htmlFile, absoluteOutputDirectory)
    const canonicalValue = getCanonical(html)

    if (!canonicalValue) {
      throw new Error(`允許索引的頁面缺少 canonical：${route}`)
    }

    const canonicalUrl = new URL(canonicalValue, siteUrl)
    const pageUrl = new URL(route, siteUrl)

    if (canonicalUrl.href !== pageUrl.href) {
      excludedNonCanonical += 1
      continue
    }

    sitemapUrls.add(canonicalUrl.href)
  }

  const sortedUrls = [...sitemapUrls].sort()
  await Promise.all([
    writeFile(path.join(absoluteOutputDirectory, 'sitemap.xml'), renderSitemap(sortedUrls)),
    writeFile(path.join(absoluteOutputDirectory, 'robots.txt'), renderRobots(siteUrl)),
  ])

  return {
    htmlPages: htmlFiles.length,
    sitemapUrls: sortedUrls,
    excludedNoindex,
    excludedNonCanonical,
  }
}

async function runCli() {
  const outputDirectory = process.argv[2] ?? 'dist'
  const result = await generateSeoFiles(outputDirectory)
  console.log(
    `SEO 發布檔案已產生：${result.sitemapUrls.length} 個可索引網址、${result.excludedNoindex} 個 noindex 頁面未列入 Sitemap`,
  )
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await runCli()
}
