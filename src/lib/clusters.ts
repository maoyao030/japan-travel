import {getArticlePath, getHubPath, type HubArticleLink, type HubPageData} from '../data/hubs.ts'
import type {TagPageData} from '../data/tags.ts'

export type ClusterArticleLink = {
  id?: string
  title: string
  excerpt: string
  path: string
}

export type ClusterNode = {
  id: string
  slug: string
  title: string
  description: string
  path: string
  hasLandingArticle: boolean
  articles: ClusterArticleLink[]
  articleCount: number
  children: ClusterNode[]
}

type DatedArticle = {publishedAt: string}

type CategoryArticleSource<T extends DatedArticle> = {
  landingArticles: {article: T; hub: HubPageData}[]
  routableArticles: {article: T; hub: HubPageData; path: string}[]
}

export type CategoryArticleEntry<T extends DatedArticle> = {
  article: T
  hub: HubPageData
  path: string
}

function getFirstParagraph(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .find((paragraph) => paragraph.length > 0) ?? ''
}

function toArticleLink(article: HubArticleLink, hub: HubPageData): ClusterArticleLink {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    path: article.path ?? getArticlePath(article.slug, hub, article.id),
  }
}

export function buildClusterNode(hub: HubPageData, allHubs: HubPageData[]): ClusterNode {
  const publishedArticles = hub.articles.filter((article) => article.published)
  const hasLandingArticle = Boolean(
    hub.landingArticleId &&
      publishedArticles.some((article) => article.id === hub.landingArticleId),
  )
  const supportArticles = publishedArticles.filter(
    (article) => !hasLandingArticle || article.id !== hub.landingArticleId,
  )
  const children = hub.parentHub
    ? []
    : allHubs
        .filter((candidate) => candidate.parentHub?.id === hub.id)
        .map((child) => buildClusterNode(child, allHubs))

  return {
    id: hub.id,
    slug: hub.slug,
    title: hub.title,
    description: getFirstParagraph(hub.description),
    path: getHubPath(hub),
    hasLandingArticle,
    articles: supportArticles.map((article) => toArticleLink(article, hub)),
    articleCount: publishedArticles.length,
    children,
  }
}

export function buildCategoryClusters(categorySlug: string, publishableHubs: HubPageData[]) {
  return publishableHubs
    .filter((hub) => hub.categorySlug === categorySlug && !hub.parentHub)
    .map((hub) => buildClusterNode(hub, publishableHubs))
}

export function countClusterHubs(nodes: ClusterNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countClusterHubs(node.children), 0)
}

export function countClusterArticles(nodes: ClusterNode[]): number {
  return nodes.reduce(
    (total, node) => total + node.articleCount + countClusterArticles(node.children),
    0,
  )
}

export function getLatestCategoryArticles<T extends DatedArticle>(
  categorySlug: string,
  source: CategoryArticleSource<T>,
  limit: number,
): CategoryArticleEntry<T>[] {
  const entries: CategoryArticleEntry<T>[] = [
    ...source.landingArticles.map(({article, hub}) => ({article, hub, path: getHubPath(hub)})),
    ...source.routableArticles.map(({article, hub, path}) => ({article, hub, path})),
  ]

  return entries
    .filter(({hub}) => hub.categorySlug === categorySlug)
    .sort(
      (left, right) =>
        Date.parse(right.article.publishedAt) - Date.parse(left.article.publishedAt),
    )
    .slice(0, limit)
}

export function getCategoryTags(
  categorySlug: string,
  publishableHubs: HubPageData[],
  tags: TagPageData[],
) {
  const hubIds = new Set(
    publishableHubs.filter((hub) => hub.categorySlug === categorySlug).map((hub) => hub.id),
  )

  return tags.filter((tag) => tag.relatedHubs.some((hub) => hubIds.has(hub.id)))
}
