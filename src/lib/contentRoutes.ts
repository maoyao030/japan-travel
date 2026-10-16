import {
  applyHubPublicationPreview,
  getPublishableHubPages,
  getRoutableArticles,
} from '../data/hubs'
import {getAspectDirectories, getMonthPages} from '../data/listPages'
import {getPublishableTagPages} from '../data/tags'
import {
  getPublishedArticles,
  getSanityAuthors,
  getSanityHubPages,
  getSanityTagPages,
} from './sanity'

function getPublicationPreviewHubIds() {
  return (process.env.HUB_PUBLICATION_PREVIEW_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
}

export async function getContentHubPages() {
  return applyHubPublicationPreview(
    await getSanityHubPages(),
    getPublicationPreviewHubIds(),
  )
}

export type PublishedContentRoutes = Awaited<ReturnType<typeof loadPublishedContentRoutes>>

let publishedContentRoutesPromise: Promise<PublishedContentRoutes> | null = null

/**
 * 建置時所有頁面（含版型的導覽列）都需要同一份已發布內容，
 * 這裡把查詢結果快取起來，避免每頁都重新向 Sanity 取資料。
 */
export function getPublishedContentRoutes() {
  if (!publishedContentRoutesPromise) {
    publishedContentRoutesPromise = loadPublishedContentRoutes().catch((error) => {
      publishedContentRoutesPromise = null
      throw error
    })
  }
  return publishedContentRoutesPromise
}

async function loadPublishedContentRoutes() {
  const [articles, hubs, tags, authors] = await Promise.all([
    getPublishedArticles(),
    getContentHubPages(),
    getSanityTagPages(),
    getSanityAuthors(),
  ])
  const publishableHubs = getPublishableHubPages(hubs)
  const previewHubIds = new Set(
    publishableHubs.filter((hub) => hub.publicationPreview).map((hub) => hub.id),
  )
  const safeArticles = articles.map((article) =>
    article.primaryHubId && previewHubIds.has(article.primaryHubId)
      ? {...article, noindex: true}
      : article,
  )
  const landingArticles = publishableHubs.flatMap((hub) => {
    if (!hub.landingArticleId) return []

    const article = safeArticles.find((candidate) => candidate._id === hub.landingArticleId)
    if (!article) {
      throw new Error(`主題中心找不到入口內容：${hub.title}`)
    }

    return [{article, hub}]
  })
  const routableArticles = getRoutableArticles(safeArticles, publishableHubs)
  const publishableTags = getPublishableTagPages(tags, publishableHubs)
  // 主題頁是否可索引：有入口文章時看入口文章，否則看主題中心自己的 noindex 設定。
  const indexableHubs = publishableHubs.filter((hub) => {
    const landing = landingArticles.find((entry) => entry.hub.id === hub.id)
    return landing ? landing.article.noindex !== true : !hub.noindex
  })

  const listSource = {landingArticles, routableArticles, publishableHubs}

  return {
    aspectDirectories: getAspectDirectories(listSource),
    authors,
    indexableHubs,
    landingArticles,
    monthPages: getMonthPages(listSource),
    publishableHubs,
    publishableTags,
    routableArticles,
  }
}
