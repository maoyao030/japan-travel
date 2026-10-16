import {readFile, readdir} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

/**
 * 網址最多三層（`/places/hakodate/stay/`），可索引的頁面從首頁點三下以內要到得了。
 * 2026-10-16 Darren 確認：不開第四層；需要更細時升格成獨立地點，或在第三層用連字號代稱。
 */
export const MAX_URL_SEGMENTS = 3
export const MAX_CLICK_DEPTH = 3

const SITE_ORIGIN = 'https://site-depth-check.invalid'

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      if (entry.isDirectory()) return listHtmlFiles(entryPath)
      return entry.name.endsWith('.html') ? [entryPath] : []
    }),
  )
  return files.flat()
}

function routeForHtmlFile(filePath, outputDirectory) {
  const relativePath = path.relative(outputDirectory, filePath).split(path.sep).join('/')
  if (relativePath === 'index.html') return '/'
  if (relativePath.endsWith('/index.html')) return `/${relativePath.slice(0, -'index.html'.length)}`
  return `/${relativePath}`
}

function hasNoindex(html) {
  return [...html.matchAll(/<meta\b[^>]*>/gi)].some((match) => {
    const tag = match[0]
    return /name\s*=\s*["']robots["']/i.test(tag) && /content\s*=\s*["'][^"']*noindex/i.test(tag)
  })
}

function extractHrefs(html) {
  return [...html.matchAll(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map((match) =>
    (match[1] ?? match[2] ?? '').replaceAll('&amp;', '&'),
  )
}

export function countUrlSegments(route) {
  return route.split('/').filter(Boolean).length
}

/** pages：[{route, html}]。回傳超過網址層數、點擊深度過深或從首頁到不了的可索引頁面。 */
export function checkSiteDepth(pages) {
  const issues = []
  const byRoute = new Map(pages.map((page) => [page.route, page]))
  const isContentPage = (route) => route !== '/404.html'

  for (const {route} of pages) {
    if (!isContentPage(route)) continue
    const segments = countUrlSegments(route)
    if (segments > MAX_URL_SEGMENTS) {
      issues.push({route, reason: `網址有 ${segments} 層，最多 ${MAX_URL_SEGMENTS} 層`})
    }
  }

  const depth = new Map([['/', 0]])
  const queue = ['/']
  while (queue.length > 0) {
    const route = queue.shift()
    const page = byRoute.get(route)
    if (!page) continue
    for (const href of extractHrefs(page.html)) {
      let target
      try {
        target = new URL(href, new URL(route, SITE_ORIGIN))
      } catch {
        continue
      }
      if (target.origin !== SITE_ORIGIN) continue
      const targetRoute = target.pathname
      if (!byRoute.has(targetRoute) || depth.has(targetRoute)) continue
      depth.set(targetRoute, depth.get(route) + 1)
      queue.push(targetRoute)
    }
  }

  for (const {route, html} of pages) {
    if (!isContentPage(route) || hasNoindex(html)) continue
    const clicks = depth.get(route)
    if (clicks === undefined) issues.push({route, reason: '可索引，但從首頁點不到'})
    else if (clicks > MAX_CLICK_DEPTH) {
      issues.push({route, reason: `從首頁要點 ${clicks} 下，最多 ${MAX_CLICK_DEPTH} 下`})
    }
  }

  return {pages: pages.length, issues}
}

async function runCli() {
  const outputDirectory = path.resolve(process.argv[2] ?? 'dist')
  const files = await listHtmlFiles(outputDirectory)
  const pages = await Promise.all(
    files.map(async (file) => ({
      route: routeForHtmlFile(file, outputDirectory),
      html: await readFile(file, 'utf8'),
    })),
  )
  const result = checkSiteDepth(pages)

  if (result.issues.length > 0) {
    console.error(`網址與點擊深度檢查失敗：發現 ${result.issues.length} 個問題`)
    for (const issue of result.issues) console.error(`- ${issue.route}（${issue.reason}）`)
    process.exitCode = 1
    return
  }
  console.log(`網址與點擊深度檢查通過：${result.pages} 個 HTML 頁面，網址最多 ${MAX_URL_SEGMENTS} 層、點擊最多 ${MAX_CLICK_DEPTH} 下`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await runCli()
}
