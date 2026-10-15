import {siteCategories, type SiteCategory} from './categories.ts'

export type HubParentReference = {
  id: string
  categorySlug: string
  slug: string
  title: string
}

export type HubArticleLink = {
  id?: string
  slug: string
  title: string
  excerpt: string
  readTime?: string
  published: boolean
  path?: string
}

export type HubNavigationLink = {
  id: string
  slug: string
  title: string
  description: string
  path: string
}

export type HubPageData = {
  id: string
  categorySlug: string
  slug: string
  title: string
  eyebrow: string
  description: string
  checklist: string[]
  seoTitle: string
  seoDescription: string
  articles: HubArticleLink[]
  childHubs?: HubNavigationLink[]
  landingArticleId?: string
  parentHub?: HubParentReference
  publicationState: 'draft' | 'ready'
  researchValidated: boolean
  noindex: boolean
  publicationPreview?: boolean
}

export type HubRoutedArticle = {
  _id: string
  slug: string
  title: string
  noindex?: boolean
  primaryHubId?: string
}

export type RoutableArticle<T extends HubRoutedArticle> = {
  article: T
  hub: HubPageData
  path: string
}

export function applyHubPublicationPreview(
  hubs: HubPageData[],
  previewHubIds: Iterable<string>,
) {
  const requestedIds = new Set(
    [...previewHubIds].map((id) => id.trim()).filter((id) => id.length > 0),
  )

  if (requestedIds.size === 0) return hubs

  const availableIds = new Set(hubs.map((hub) => hub.id))
  const missingIds = [...requestedIds].filter((id) => !availableIds.has(id))

  if (missingIds.length > 0) {
    throw new Error(`找不到要預覽的主題中心：${missingIds.join('、')}`)
  }

  return hubs.map((hub) =>
    requestedIds.has(hub.id)
      ? {
          ...hub,
          publicationState: 'ready' as const,
          noindex: true,
          publicationPreview: true,
        }
      : hub,
  )
}

function hasText(value: string) {
  return value.trim().length > 0
}

function getPublishedHubArticles(hub: HubPageData) {
  return hub.articles.filter((article) => article.published)
}

function getBaseHubPublicationIssues(hub: HubPageData, categories: SiteCategory[]): string[] {
  const issues: string[] = []
  const category = categories.find((item) => item.slug === hub.categorySlug)

  if (!category) {
    issues.push(`找不到大分類：${hub.categorySlug}`)
  } else if (!hub.parentHub) {
    const plannedHub = category.topics.find((item) => item.slug === hub.slug)

    if (!plannedHub) {
      issues.push(`「${category.title}」分類中沒有規劃 ${hub.slug} 這個父主題中心`)
    } else if (plannedHub.title !== hub.title) {
      issues.push(`主題名稱應與架構資料一致：${plannedHub.title}`)
    }
  }

  if (
    hub.parentHub?.categorySlug !== undefined &&
    hub.parentHub.categorySlug !== hub.categorySlug
  ) {
    issues.push('子主題中心與父主題中心的大分類不一致')
  }

  if (hub.parentHub?.id === hub.id) {
    issues.push('主題中心不能把自己設為父主題中心')
  }

  if (!hub.researchValidated) {
    issues.push('尚未完成搜尋需求與內容邊界驗證')
  }

  if (!hasText(hub.description)) {
    issues.push('缺少主題中心自己的介紹')
  }

  if (!hasText(hub.seoTitle)) {
    issues.push('缺少 SEO 標題')
  }

  if (!hasText(hub.seoDescription)) {
    issues.push('缺少 SEO 描述')
  }

  if (hub.checklist.length === 0 || hub.checklist.some((item) => !hasText(item))) {
    issues.push('缺少完整的主題閱讀重點')
  }

  const publishedArticles = getPublishedHubArticles(hub)

  if (
    hub.landingArticleId &&
    !publishedArticles.some((article) => article.id === hub.landingArticleId)
  ) {
    issues.push('入口內容必須是歸屬這個主題中心的已發布文章')
  }

  const articleSlugs = publishedArticles.map((article) => article.slug)
  if (new Set(articleSlugs).size !== articleSlugs.length) {
    issues.push('已發布文章有重複網址代稱')
  }

  if (
    publishedArticles.some(
      (article) => !hasText(article.slug) || !hasText(article.title) || !hasText(article.excerpt),
    )
  ) {
    issues.push('已發布文章缺少網址、標題或摘要')
  }

  return issues
}

function findParentHub(hub: HubPageData, allHubs: HubPageData[]) {
  if (!hub.parentHub) return null

  return allHubs.find((candidate) => candidate.id === hub.parentHub?.id) ?? null
}

/**
 * 主題中心的發布門檻。`categories` 預設是 src/data/categories.ts 的分類樹：
 * 父主題中心的 slug 必須先列在分類的 topics 裡（Darren 核准後才填），Sanity 裡的 Hub 才會建頁。
 */
export function getHubPublicationIssues(
  hub: HubPageData,
  allHubs: HubPageData[] = [hub],
  categories: SiteCategory[] = siteCategories,
): string[] {
  const issues = getBaseHubPublicationIssues(hub, categories)

  if (!hub.parentHub) return issues

  const parent = findParentHub(hub, allHubs)

  if (!parent) {
    issues.push(`找不到父主題中心：${hub.parentHub.title || hub.parentHub.id}`)
    return issues
  }

  if (parent.parentHub) {
    issues.push('主題中心最多只允許父、子兩層')
  }

  if (parent.categorySlug !== hub.categorySlug) {
    issues.push('父、子主題中心實際所屬的大分類不一致')
  }

  if (parent.slug !== hub.parentHub.slug || parent.title !== hub.parentHub.title) {
    issues.push('父主題中心的網址或名稱資料不一致')
  }

  return issues
}

export function isHubPublishable(
  hub: HubPageData,
  allHubs: HubPageData[] = [hub],
  categories: SiteCategory[] = siteCategories,
) {
  return (
    hub.publicationState === 'ready' &&
    getHubPublicationIssues(hub, allHubs, categories).length === 0
  )
}

/**
 * 只回傳已有公開主題中心的大分類，供導覽列、首頁與 404 頁使用，
 * 避免把還沒有內容的分類頁露出給讀者與搜尋引擎。
 */
export function getPublishedCategories(publishableHubs: Pick<HubPageData, 'categorySlug'>[]) {
  const categorySlugs = new Set(publishableHubs.map((hub) => hub.categorySlug))
  return siteCategories.filter((category) => categorySlugs.has(category.slug))
}

export function getHubPath(hub: Pick<HubPageData, 'categorySlug' | 'slug' | 'parentHub'>) {
  const parentSegment = hub.parentHub ? `${hub.parentHub.slug}/` : ''
  return `/${hub.categorySlug}/${parentSegment}${hub.slug}/`
}

export function getArticleEntrySlug(
  articleSlug: string,
  hub: Pick<HubPageData, 'slug' | 'parentHub'>,
) {
  return hub.parentHub ? `${hub.slug}-${articleSlug}` : articleSlug
}

export function getArticlePath(articleSlug: string, hub: HubPageData, articleId?: string) {
  if (articleId && hub.landingArticleId === articleId) return getHubPath(hub)
  const parentPath = hub.parentHub
    ? `/${hub.categorySlug}/${hub.parentHub.slug}/`
    : getHubPath(hub)
  return `${parentPath}${getArticleEntrySlug(articleSlug, hub)}/`
}

export function getMatchingHubPath(
  reference: {id?: string; categorySlug?: string; slug?: string},
  availableHubs: HubPageData[],
) {
  const matchingHub = availableHubs.find(
    (hub) =>
      (reference.id && hub.id === reference.id) ||
      (reference.categorySlug === hub.categorySlug && reference.slug === hub.slug),
  )

  return matchingHub ? getHubPath(matchingHub) : null
}

export function getPublishableHubPages(
  hubs: HubPageData[],
  categories: SiteCategory[] = siteCategories,
) {
  const readyHubs = hubs.filter((hub) => hub.publicationState === 'ready')
  const invalidReadyHubs = readyHubs
    .map((hub) => ({hub, issues: getHubPublicationIssues(hub, hubs, categories)}))
    .filter(({issues}) => issues.length > 0)

  if (invalidReadyHubs.length > 0) {
    const details = invalidReadyHubs
      .map(({hub, issues}) => `${getHubPath(hub)}：${issues.join('、')}`)
      .join('\n')
    throw new Error(`主題中心未通過發布門檻：\n${details}`)
  }

  return readyHubs.map((hub) => ({
    ...hub,
    articles: hub.articles.map((article) => ({
      ...article,
      path: getArticlePath(article.slug, hub, article.id),
    })),
    childHubs: readyHubs
      .filter((candidate) => candidate.parentHub?.id === hub.id)
      .map((child) => ({
        id: child.id,
        slug: child.slug,
        title: child.title,
        description: child.description,
        path: getHubPath(child),
      })),
  }))
}

export function getRoutableArticles<T extends HubRoutedArticle>(
  articles: T[],
  publishableHubs: HubPageData[],
): RoutableArticle<T>[] {
  const routes: RoutableArticle<T>[] = []

  for (const article of articles) {
    const hub = publishableHubs.find((candidate) => candidate.id === article.primaryHubId)

    if (!hub) continue

    if (hub.landingArticleId === article._id) continue

    routes.push({article, hub, path: getArticlePath(article.slug, hub)})
  }

  const paths = routes.map((route) => route.path)
  if (new Set(paths).size !== paths.length) {
    throw new Error('文章產生了重複網址')
  }

  return routes
}
