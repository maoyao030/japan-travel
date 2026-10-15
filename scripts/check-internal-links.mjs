import {access, readFile, readdir} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const SITE_ORIGIN = 'https://internal-link-check.invalid'

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

function extractHrefs(html) {
  return [...html.matchAll(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)].map((match) =>
    decodeHtmlAttribute(match[1] ?? match[2] ?? ''),
  )
}

function extractFragmentIds(html) {
  const ids = new Set()

  for (const match of html.matchAll(/\b(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)) {
    ids.add(decodeHtmlAttribute(match[1] ?? match[2] ?? ''))
  }

  return ids
}

function candidateFilesForPathname(pathname, outputDirectory) {
  const decodedPathname = decodeURIComponent(pathname)
  const relativePath = decodedPathname.replace(/^\/+/, '')

  if (decodedPathname.endsWith('/')) {
    return [path.join(outputDirectory, relativePath, 'index.html')]
  }

  return [
    path.join(outputDirectory, relativePath),
    path.join(outputDirectory, relativePath, 'index.html'),
  ]
}

async function firstExistingFile(candidates) {
  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      // Continue until a matching generated file is found.
    }
  }

  return null
}

export async function checkInternalLinks(outputDirectory) {
  const absoluteOutputDirectory = path.resolve(outputDirectory)
  const files = await listFiles(absoluteOutputDirectory)
  const htmlFiles = files.filter((file) => file.endsWith('.html'))
  const htmlCache = new Map()
  const issues = []
  let checkedLinks = 0

  for (const sourceFile of htmlFiles) {
    const sourceHtml = await readFile(sourceFile, 'utf8')
    const sourceRoute = routeForHtmlFile(sourceFile, absoluteOutputDirectory)

    for (const href of extractHrefs(sourceHtml)) {
      if (!href || href.startsWith('//')) continue

      let targetUrl
      try {
        targetUrl = new URL(href, new URL(sourceRoute, SITE_ORIGIN))
      } catch {
        issues.push({sourceRoute, href, reason: '網址格式無法解析'})
        continue
      }

      if (targetUrl.origin !== SITE_ORIGIN) continue
      checkedLinks += 1

      const targetFile = await firstExistingFile(
        candidateFilesForPathname(targetUrl.pathname, absoluteOutputDirectory),
      )

      if (!targetFile) {
        issues.push({sourceRoute, href, reason: `找不到 ${targetUrl.pathname}`})
        continue
      }

      if (!targetUrl.hash || !targetFile.endsWith('.html')) continue

      let targetHtml = htmlCache.get(targetFile)
      if (!targetHtml) {
        targetHtml = await readFile(targetFile, 'utf8')
        htmlCache.set(targetFile, targetHtml)
      }

      const fragment = decodeURIComponent(targetUrl.hash.slice(1))
      if (!extractFragmentIds(targetHtml).has(fragment)) {
        issues.push({sourceRoute, href, reason: `找不到頁面段落 #${fragment}`})
      }
    }
  }

  return {htmlPages: htmlFiles.length, checkedLinks, issues}
}

async function runCli() {
  const outputDirectory = process.argv[2] ?? 'dist'
  const result = await checkInternalLinks(outputDirectory)

  if (result.issues.length > 0) {
    console.error(`站內連結檢查失敗：發現 ${result.issues.length} 個問題`)
    for (const issue of result.issues) {
      console.error(`- ${issue.sourceRoute} → ${issue.href}（${issue.reason}）`)
    }
    process.exitCode = 1
    return
  }

  console.log(
    `站內連結檢查通過：${result.htmlPages} 個 HTML 頁面、${result.checkedLinks} 個站內連結`,
  )
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await runCli()
}
