import {getArticlePath, getHubPath, type HubPageData} from './hubs.ts'

export const MIN_PUBLISHED_ARTICLES_PER_TAG = 5
export const MIN_HUBS_PER_TAG = 2

export type TagHubReference = {
  id: string
  slug: string
  title: string
}

export type TagArticleLink = {
  id: string
  excerpt: string
  hubId: string
  hubPath?: string
  hubTitle: string
  path?: string
  slug: string
  title: string
}

export type TagPageData = {
  id: string
  title: string
  slug: string
  description: string
  seoTitle: string
  seoDescription: string
  articles: TagArticleLink[]
  featuredArticleIds: string[]
  relatedHubs: TagHubReference[]
  publicationState: 'draft' | 'ready'
  researchValidated: boolean
  noindex: boolean
}

export type ArticleTagReference = {
  id: string
  slug: string
  title: string
}

export type ArticleTagLink = ArticleTagReference & {path: string}

function hasText(value: string) {
  return value.trim().length > 0
}

function sortFeaturedArticles(tag: TagPageData, articles: TagArticleLink[]) {
  const featuredOrder = new Map(
    tag.featuredArticleIds.map((articleId, index) => [articleId, index]),
  )

  return [...articles].sort((left, right) => {
    const leftOrder = featuredOrder.get(left.id)
    const rightOrder = featuredOrder.get(right.id)

    if (leftOrder !== undefined && rightOrder !== undefined) return leftOrder - rightOrder
    if (leftOrder !== undefined) return -1
    if (rightOrder !== undefined) return 1
    return 0
  })
}

export function getTagPath(tag: Pick<TagPageData, 'slug'>) {
  return `/tags/${tag.slug}/`
}

export function getTagPublicationIssues(
  tag: TagPageData,
  publishableHubs: HubPageData[],
): string[] {
  const issues: string[] = []

  if (!hasText(tag.title) || !hasText(tag.slug)) {
    issues.push('缺少 Tag 名稱或網址代稱')
  }

  if (!hasText(tag.description)) {
    issues.push('缺少 Tag 的獨立介紹與內容範圍')
  }

  if (!hasText(tag.seoTitle) || !hasText(tag.seoDescription)) {
    issues.push('缺少完整 SEO 欄位')
  }

  if (!tag.researchValidated) {
    issues.push('尚未完成搜尋需求與內容邊界驗證')
  }

  const routedArticles = tag.articles.flatMap((article) => {
    const hub = publishableHubs.find((candidate) => candidate.id === article.hubId)
    return hub
      ? [
          {
            ...article,
            hubPath: getHubPath(hub),
            path: getArticlePath(article.slug, hub, article.id),
          },
        ]
      : []
  })

  if (routedArticles.length < MIN_PUBLISHED_ARTICLES_PER_TAG) {
    issues.push(`可正常開啟的文章不足 ${MIN_PUBLISHED_ARTICLES_PER_TAG} 篇`)
  }

  const hubIds = new Set(routedArticles.map((article) => article.hubId))
  if (hubIds.size < MIN_HUBS_PER_TAG) {
    issues.push(`文章未涵蓋至少 ${MIN_HUBS_PER_TAG} 個已發布主題中心`)
  }

  const relatedHubIds = tag.relatedHubs.map((hub) => hub.id)
  const publishableRelatedHubIds = new Set(
    relatedHubIds.filter((hubId) => publishableHubs.some((hub) => hub.id === hubId)),
  )
  if (publishableRelatedHubIds.size < MIN_HUBS_PER_TAG) {
    issues.push(`相關主題中心未列出至少 ${MIN_HUBS_PER_TAG} 個已發布 Hub`)
  }

  if (new Set(relatedHubIds).size !== relatedHubIds.length) {
    issues.push('相關主題中心有重複項目')
  }

  const articleIds = routedArticles.map((article) => article.id)
  if (new Set(articleIds).size !== articleIds.length) {
    issues.push('Tag 收錄了重複文章')
  }

  return issues
}

export function getPublishableTagPages(tags: TagPageData[], publishableHubs: HubPageData[]) {
  const readyTags = tags.filter((tag) => tag.publicationState === 'ready')
  const invalidReadyTags = readyTags
    .map((tag) => ({
      tag,
      issues: getTagPublicationIssues(tag, publishableHubs),
    }))
    .filter(({issues}) => issues.length > 0)

  if (invalidReadyTags.length > 0) {
    const details = invalidReadyTags
      .map(({tag, issues}) => `${getTagPath(tag)}：${issues.join('、')}`)
      .join('\n')
    throw new Error(`Tag 頁未通過發布門檻：\n${details}`)
  }

  return readyTags.map((tag) => ({
    ...tag,
    articles: sortFeaturedArticles(
      tag,
      tag.articles.map((article) => {
        const hub = publishableHubs.find((candidate) => candidate.id === article.hubId)
        if (!hub) throw new Error(`Tag 文章找不到已發布主題中心：${article.title}`)
        return {
          ...article,
          hubPath: getHubPath(hub),
          path: getArticlePath(article.slug, hub, article.id),
        }
      }),
    ),
  }))
}

export function getArticleTagLinks(
  articleTags: ArticleTagReference[] | undefined,
  publishableTags: TagPageData[],
): ArticleTagLink[] {
  return (articleTags ?? []).flatMap((reference) => {
    const tag = publishableTags.find((candidate) => candidate.id === reference.id)
    return tag ? [{...reference, path: getTagPath(tag)}] : []
  })
}
