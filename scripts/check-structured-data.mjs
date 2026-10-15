import {access, readdir, readFile} from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {resolveSanityConfig} from '../site.config.mjs'

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, {withFileTypes: true})
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? listHtmlFiles(entryPath) : [entryPath]
    }),
  )
  return files.flat().filter((filePath) => filePath.endsWith('.html'))
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function getGraphNodes(document) {
  if (Array.isArray(document?.['@graph'])) return document['@graph']
  return document && typeof document === 'object' ? [document] : []
}

function parseJsonLdNodes(html, errors) {
  const scripts = [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  const nodes = []

  for (const [index, script] of scripts.entries()) {
    try {
      nodes.push(...getGraphNodes(JSON.parse(script[1])))
    } catch (error) {
      errors.push(`第 ${index + 1} 組 JSON-LD 無法解析：${error.message}`)
    }
  }

  return {nodes, scriptCount: scripts.length}
}

function isNoindexPage(html) {
  return /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)
}

function isArticlePage(html) {
  return /<meta\s+property=["']og:type["']\s+content=["']article["']/i.test(html)
}

function validateBreadcrumb(nodes, errors, {minimumDepth = 2} = {}) {
  const breadcrumbs = nodes.filter((node) => node?.['@type'] === 'BreadcrumbList')
  if (breadcrumbs.length !== 1) {
    errors.push(`BreadcrumbList 必須正好一組，目前為 ${breadcrumbs.length}`)
    return
  }

  const breadcrumbItems = breadcrumbs[0]?.itemListElement
  if (!Array.isArray(breadcrumbItems) || breadcrumbItems.length < minimumDepth) {
    errors.push(`BreadcrumbList 至少需要 ${minimumDepth} 層`)
    return
  }

  breadcrumbItems.forEach((item, index) => {
    if (item?.position !== index + 1 || !nonEmptyString(item?.name) || !nonEmptyString(item?.item)) {
      errors.push(`BreadcrumbList 第 ${index + 1} 層不完整`)
    }
  })
}

function validateOrganization(nodes, errors) {
  const organizations = nodes.filter(
    (node) => node?.['@type'] === 'Organization' && nonEmptyString(node?.['@id']) && node['@id'].endsWith('#organization'),
  )
  if (organizations.length !== 1) {
    errors.push(`網站 Organization 節點必須正好一組，目前為 ${organizations.length}`)
    return
  }

  const organization = organizations[0]
  if (!nonEmptyString(organization.name) || !nonEmptyString(organization.url)) {
    errors.push('Organization 缺少 name 或 url')
  }
  if (!nonEmptyString(organization.logo?.url)) errors.push('Organization 缺少 logo.url')
}

function validateArticlePage(nodes, errors) {
  const articles = nodes.filter((node) => node?.['@type'] === 'Article')
  const faqPages = nodes.filter((node) => node?.['@type'] === 'FAQPage')

  if (articles.length !== 1) errors.push(`Article 必須正好一組，目前為 ${articles.length}`)
  if (faqPages.length > 1) errors.push(`FAQPage 最多一組，目前為 ${faqPages.length}`)

  const article = articles[0]
  if (article) {
    for (const field of ['headline', 'description', 'datePublished', 'dateModified']) {
      if (!nonEmptyString(article[field])) errors.push(`Article 缺少 ${field}`)
    }
    if (!nonEmptyString(article.mainEntityOfPage)) errors.push('Article 缺少 mainEntityOfPage')
    if (!article.author || !article.publisher) errors.push('Article 缺少 author 或 publisher')
  }

  validateBreadcrumb(nodes, errors)

  const faqItems = faqPages[0]?.mainEntity
  if (faqPages.length === 1) {
    if (!Array.isArray(faqItems) || faqItems.length === 0) {
      errors.push('FAQPage 不得為空')
    } else {
      const questions = new Set()
      faqItems.forEach((item, index) => {
        const question = item?.name
        const answer = item?.acceptedAnswer?.text
        if (item?.['@type'] !== 'Question' || !nonEmptyString(question)) {
          errors.push(`FAQPage 第 ${index + 1} 題缺少 Question 或 name`)
        }
        if (item?.acceptedAnswer?.['@type'] !== 'Answer' || !nonEmptyString(answer)) {
          errors.push(`FAQPage 第 ${index + 1} 題缺少 acceptedAnswer`)
        }
        if (questions.has(question)) errors.push(`FAQPage 問題重複：${question}`)
        questions.add(question)
      })
    }
  }

  return {faqCount: Array.isArray(faqItems) ? faqItems.length : 0}
}

const PAGE_TYPES = ['WebSite', 'CollectionPage', 'AboutPage', 'ProfilePage']

function validateWebPage(nodes, errors) {
  const pageNodes = nodes.filter((node) => PAGE_TYPES.includes(node?.['@type']))
  const pageType = pageNodes.find((node) => node['@type'] !== 'WebSite')?.['@type']
    ?? pageNodes.find((node) => node['@type'] === 'WebSite')?.['@type']

  if (!pageType) {
    errors.push(`找不到頁面型別（${PAGE_TYPES.join('、')}）`)
    return {pageType: null}
  }

  const page = pageNodes.find((node) => node['@type'] === pageType)
  if (!nonEmptyString(page.name) || !nonEmptyString(page.url)) {
    errors.push(`${pageType} 缺少 name 或 url`)
  }

  if (pageType !== 'WebSite') validateBreadcrumb(nodes, errors)

  if (pageType === 'ProfilePage') {
    const entityId = page.mainEntity?.['@id']
    const entity = nodes.find((node) => node?.['@id'] === entityId)
    if (!entity || !nonEmptyString(entity.name)) errors.push('ProfilePage 缺少 mainEntity 或其 name')
  }

  if (pageType === 'CollectionPage' && page.mainEntity?.['@id']) {
    const list = nodes.find((node) => node?.['@id'] === page.mainEntity['@id'])
    if (list?.['@type'] !== 'ItemList' || !Array.isArray(list.itemListElement) || list.itemListElement.length === 0) {
      errors.push('CollectionPage 的 mainEntity 必須是非空的 ItemList')
    }
  }

  return {pageType}
}

export async function checkStructuredData(directory, {requireArticles = resolveSanityConfig() !== null} = {}) {
  const htmlFiles = await listHtmlFiles(directory)
  const counts = {
    articleCount: 0,
    faqPageCount: 0,
    faqQuestionCount: 0,
    webSiteCount: 0,
    collectionPageCount: 0,
    aboutPageCount: 0,
    profilePageCount: 0,
  }
  const failures = []
  let logoPath = null

  for (const filePath of htmlFiles) {
    const html = await readFile(filePath, 'utf8')
    const errors = []
    const {nodes, scriptCount} = parseJsonLdNodes(html, errors)

    if (scriptCount === 0) {
      // 允許搜尋引擎索引的頁面，一律必須有結構化資料；noindex 的頁面可以沒有。
      if (!isNoindexPage(html)) errors.push('可索引頁面沒有任何 JSON-LD 結構化資料')
    } else if (isArticlePage(html)) {
      const result = validateArticlePage(nodes, errors)
      validateOrganization(nodes, errors)
      counts.articleCount += 1
      if (result.faqCount > 0) counts.faqPageCount += 1
      counts.faqQuestionCount += result.faqCount
    } else {
      const {pageType} = validateWebPage(nodes, errors)
      validateOrganization(nodes, errors)
      if (pageType === 'WebSite') counts.webSiteCount += 1
      if (pageType === 'CollectionPage') counts.collectionPageCount += 1
      if (pageType === 'AboutPage') counts.aboutPageCount += 1
      if (pageType === 'ProfilePage') counts.profilePageCount += 1
    }

    const organization = nodes.find((node) => node?.['@type'] === 'Organization' && nonEmptyString(node?.logo?.url))
    if (organization && !logoPath) {
      logoPath = new URL(organization.logo.url).pathname
    }

    if (errors.length > 0) {
      failures.push(`${filePath}\n${errors.map((error) => `- ${error}`).join('\n')}`)
    }
  }

  if (failures.length > 0) throw new Error(failures.join('\n\n'))
  // Sanity 已設定卻沒有任何文章頁，多半是查詢或設定壞了；還沒接 Sanity 的骨架則允許零篇。
  if (requireArticles && counts.articleCount === 0) throw new Error('建置結果沒有可驗證的文章頁')
  if (counts.webSiteCount === 0) throw new Error('建置結果沒有帶 WebSite 結構化資料的首頁')

  if (logoPath) {
    try {
      await access(path.join(directory, logoPath))
    } catch {
      throw new Error(`Organization.logo 指向的檔案不存在於建置結果：${logoPath}`)
    }
  }

  return counts
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isCli) {
  const directory = path.resolve(process.argv[2] ?? 'dist')
  const result = await checkStructuredData(directory)
  console.log(
    `結構化資料檢查通過：${result.articleCount} 篇文章、${result.faqPageCount} 組 FAQPage、${result.faqQuestionCount} 題 FAQ、` +
      `${result.webSiteCount} 個首頁 WebSite、${result.collectionPageCount} 個 CollectionPage、` +
      `${result.aboutPageCount} 個 AboutPage、${result.profilePageCount} 個 ProfilePage`,
  )
}
