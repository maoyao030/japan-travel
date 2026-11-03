/**
 * 文章在網站上的網址，規則和網站的 src/data/hubs.ts getArticlePath 一樣。
 * 後台「開啟預覽」用它打開網站上的這一頁。
 */
export const SITE_URL = 'https://offpathnotes.com'

export type ArticleUrlInput = {
  id: string
  slug?: string | null
  hub?: {
    slug?: string | null
    category?: string | null
    landing?: string | null
    parent?: string | null
  } | null
}

export function articlePath({id, slug, hub}: ArticleUrlInput): string | undefined {
  if (!slug || !hub?.slug || !hub.category) return undefined
  const publishedId = id.replace(/^drafts\./, '')
  const hubPath = `/${hub.category}/${hub.parent ? `${hub.parent}/` : ''}${hub.slug}/`
  if (hub.landing === publishedId) return hubPath
  if (hub.parent) return `/${hub.category}/${hub.parent}/${hub.slug}-${slug}/`
  return `${hubPath}${slug}/`
}
