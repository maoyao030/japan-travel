import type {HubPageData, HubParentReference, HubPlaceReference, PlaceKind} from '../data/hubs'
import type {ArticleTagReference, TagArticleLink, TagHubReference, TagPageData} from '../data/tags'
import type {ArticleAspect} from '../data/listPages'
import type {ArticleBodyBlock} from './portableText'
import {resolveSanityConfig} from '../../site.config.mjs'

const SANITY_API_VERSION = 'v2026-08-26'
let warnedAboutMissingSanity = false

/** Sanity 專案還沒設定時回傳 null；呼叫端會以空內容建置，讓骨架可以先驗證。 */
function getSanityQueryEndpoint() {
  const config = resolveSanityConfig()
  if (!config) {
    if (!warnedAboutMissingSanity) {
      warnedAboutMissingSanity = true
      console.warn('尚未設定 SANITY_PROJECT_ID，網站以沒有任何內容的狀態建置。')
    }
    return null
  }
  return `https://${config.projectId}.api.sanity.io/${SANITY_API_VERSION}/data/query/${config.dataset}`
}

export type ArticleSummary = {
  _id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  authorName?: string
  authorSlug?: string
  hubTitle?: string
  primaryHubId?: string
}

export type PublishedArticle = ArticleSummary & {
  aspect?: ArticleAspect
  months?: number[]
  body: ArticleBodyBlock[]
  canonicalUrl?: string
  cover?: {
    alt: string
    caption?: string
    credit?: string
    height: number
    sourcePageUrl?: string
    url: string
    width: number
  }
  noindex?: boolean
  seoDescription: string
  seoTitle: string
  sponsorName?: string
  sponsored?: boolean
  tags?: ArticleTagReference[]
  updatedAt?: string
}

type SanityHubArticle = {
  _id: string
  excerpt?: string
  slug?: string
  title?: string
}

export type SanityHub = {
  _id: string
  articles?: SanityHubArticle[]
  categorySlug?: string
  checklist?: string[]
  description?: string
  eyebrow?: string
  featuredArticleIds?: string[]
  landingArticleId?: string
  noindex?: boolean
  parentHub?: Partial<HubParentReference>
  publicationState?: 'draft' | 'ready'
  researchValidated?: boolean
  seoDescription?: string
  seoTitle?: string
  slug?: string
  title?: string
  placeKind?: PlaceKind
  nameJa?: string
  region?: Partial<HubPlaceReference>
  nearbyPlaces?: Partial<HubPlaceReference>[]
  gatewayPlaces?: Partial<HubPlaceReference>[]
  bestMonths?: number[]
}

function mapPlaceReference(reference?: Partial<HubPlaceReference>): HubPlaceReference | undefined {
  if (!reference?.id) return undefined
  return {id: reference.id, slug: reference.slug ?? '', title: reference.title ?? ''}
}

export type SanityTag = {
  _id: string
  articles?: Partial<TagArticleLink>[]
  description?: string
  featuredArticleIds?: string[]
  noindex?: boolean
  publicationState?: 'draft' | 'ready'
  relatedHubs?: Partial<TagHubReference>[]
  researchValidated?: boolean
  seoDescription?: string
  seoTitle?: string
  slug?: string
  title?: string
}

async function querySanity<T>(query: string, emptyResult: T): Promise<T> {
  const endpointUrl = getSanityQueryEndpoint()
  if (!endpointUrl) return emptyResult
  const endpoint = new URL(endpointUrl)
  endpoint.searchParams.set('query', query)
  endpoint.searchParams.set('perspective', 'published')

  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(`Sanity 查詢失敗（HTTP ${response.status}）`)
  }

  const payload = (await response.json()) as {result: T}
  return payload.result
}

export async function getLatestArticles(): Promise<ArticleSummary[]> {
  const query = `
    *[_type == "article" && defined(slug.current)]
      | order(publishedAt desc)[0...6] {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        publishedAt,
        "authorName": author->name,
        "authorSlug": author->slug.current,
        "primaryHubId": primaryHub._ref,
        "hubTitle": primaryHub->title
      }
  `
  return querySanity<ArticleSummary[]>(query, [])
}

export async function getPublishedArticles(): Promise<PublishedArticle[]> {
  const query = `
    *[_type == "article" && defined(slug.current)]
      | order(publishedAt desc) {
        _id,
        title,
        "slug": slug.current,
        excerpt,
        aspect,
        months,
        body[]{
          ...,
          _type == "image" => {
            "url": asset->url,
            "width": asset->metadata.dimensions.width,
            "height": asset->metadata.dimensions.height
          }
        },
        publishedAt,
        updatedAt,
        seoTitle,
        seoDescription,
        canonicalUrl,
        noindex,
        sponsored,
        sponsorName,
        "cover": select(defined(cover.asset) => {
          "url": cover.asset->url,
          "width": cover.asset->metadata.dimensions.width,
          "height": cover.asset->metadata.dimensions.height,
          "alt": cover.alt,
          "caption": cover.caption,
          "credit": cover.credit,
          "sourcePageUrl": cover.sourcePageUrl
        }),
        "authorName": author->name,
        "authorSlug": author->slug.current,
        "primaryHubId": primaryHub._ref,
        "hubTitle": primaryHub->title,
        "tags": tags[]->{
          "id": _id,
          title,
          "slug": slug.current
        }
      }
  `

  return querySanity<PublishedArticle[]>(query, [])
}

export function mapSanityHub(hub: SanityHub): HubPageData {
  const featuredOrder = new Map(
    (hub.featuredArticleIds ?? []).map((articleId, index) => [articleId, index]),
  )
  const articles = [...(hub.articles ?? [])].sort((left, right) => {
    const leftOrder = featuredOrder.get(left._id)
    const rightOrder = featuredOrder.get(right._id)

    if (leftOrder !== undefined && rightOrder !== undefined) return leftOrder - rightOrder
    if (leftOrder !== undefined) return -1
    if (rightOrder !== undefined) return 1
    return 0
  })

  const parentHub = hub.parentHub?.id
    ? {
        id: hub.parentHub.id,
        categorySlug: hub.parentHub.categorySlug ?? '',
        slug: hub.parentHub.slug ?? '',
        title: hub.parentHub.title ?? '',
      }
    : undefined

  return {
    id: hub._id,
    categorySlug: hub.categorySlug ?? '',
    slug: hub.slug ?? '',
    title: hub.title ?? '',
    eyebrow: hub.eyebrow ?? '',
    description: hub.description ?? '',
    checklist: hub.checklist ?? [],
    seoTitle: hub.seoTitle ?? '',
    seoDescription: hub.seoDescription ?? '',
    articles: articles.map((article) => ({
      id: article._id,
      slug: article.slug ?? '',
      title: article.title ?? '',
      excerpt: article.excerpt ?? '',
      published: true,
    })),
    landingArticleId: hub.landingArticleId,
    parentHub,
    publicationState: hub.publicationState ?? 'draft',
    researchValidated: hub.researchValidated === true,
    noindex: hub.noindex === true,
    placeKind: hub.placeKind,
    nameJa: hub.nameJa,
    region: mapPlaceReference(hub.region),
    nearbyPlaces: (hub.nearbyPlaces ?? []).flatMap((place) => mapPlaceReference(place) ?? []),
    gatewayPlaces: (hub.gatewayPlaces ?? []).flatMap((place) => mapPlaceReference(place) ?? []),
    bestMonths: hub.bestMonths ?? [],
  }
}

export async function getSanityHubPages(): Promise<HubPageData[]> {
  const query = `
    *[_type == "hub" && defined(slug.current)]
      | order(title asc) {
        _id,
        title,
        "slug": slug.current,
        "categorySlug": category,
        eyebrow,
        "description": pt::text(introduction),
        checklist,
        seoTitle,
        seoDescription,
        publicationState,
        researchValidated,
        noindex,
        "landingArticleId": landingArticle._ref,
        "parentHub": parentHub->{
          "id": _id,
          title,
          "slug": slug.current,
          "categorySlug": category
        },
        placeKind,
        nameJa,
        bestMonths,
        "region": region->{"id": _id, title, "slug": slug.current},
        "nearbyPlaces": nearbyPlaces[]->{"id": _id, title, "slug": slug.current},
        "gatewayPlaces": gatewayPlaces[]->{"id": _id, title, "slug": slug.current},
        "featuredArticleIds": featuredArticles[]._ref,
        "articles": *[
          _type == "article" &&
          defined(slug.current) &&
          primaryHub._ref == ^._id
        ] | order(publishedAt desc) {
          _id,
          title,
          "slug": slug.current,
          excerpt
        }
      }
  `

  const hubs = await querySanity<SanityHub[]>(query, [])
  return hubs.map(mapSanityHub)
}

export function mapSanityTag(tag: SanityTag): TagPageData {
  return {
    id: tag._id,
    title: tag.title ?? '',
    slug: tag.slug ?? '',
    description: tag.description ?? '',
    seoTitle: tag.seoTitle ?? '',
    seoDescription: tag.seoDescription ?? '',
    articles: (tag.articles ?? []).map((article) => ({
      id: article.id ?? '',
      excerpt: article.excerpt ?? '',
      hubId: article.hubId ?? '',
      hubTitle: article.hubTitle ?? '',
      slug: article.slug ?? '',
      title: article.title ?? '',
    })),
    featuredArticleIds: tag.featuredArticleIds ?? [],
    relatedHubs: (tag.relatedHubs ?? []).map((hub) => ({
      id: hub.id ?? '',
      slug: hub.slug ?? '',
      title: hub.title ?? '',
    })),
    publicationState: tag.publicationState ?? 'draft',
    researchValidated: tag.researchValidated === true,
    noindex: tag.noindex === true,
  }
}

export async function getSanityTagPages(): Promise<TagPageData[]> {
  const query = `
    *[_type == "tag" && defined(slug.current)]
      | order(title asc) {
        _id,
        title,
        "slug": slug.current,
        "description": pt::text(description),
        seoTitle,
        seoDescription,
        publicationState,
        researchValidated,
        noindex,
        "featuredArticleIds": featuredArticles[]._ref,
        "relatedHubs": relatedHubs[]->{
          "id": _id,
          title,
          "slug": slug.current
        },
        "articles": *[
          _type == "article" &&
          defined(slug.current) &&
          references(^._id)
        ] | order(publishedAt desc) {
          "id": _id,
          title,
          "slug": slug.current,
          excerpt,
          "hubId": primaryHub._ref,
          "hubTitle": primaryHub->title
        }
      }
  `

  const tags = await querySanity<SanityTag[]>(query, [])
  return tags.map(mapSanityTag)
}

export type SanityAuthor = {
  _id: string
  name: string
  slug: string
  bio?: string
  expertise?: string
  photo?: {
    alt?: string
    height: number
    url: string
    width: number
  }
  links?: Array<{label?: string; url?: string}>
}

/** 作者頁用：所有有網址代稱的作者文件。 */
export async function getSanityAuthors(): Promise<SanityAuthor[]> {
  const query = `
    *[_type == "author" && defined(slug.current)]
      | order(name asc) {
        _id,
        name,
        "slug": slug.current,
        bio,
        expertise,
        "photo": select(defined(photo.asset) => {
          "url": photo.asset->url,
          "width": photo.asset->metadata.dimensions.width,
          "height": photo.asset->metadata.dimensions.height,
          "alt": photo.alt
        }),
        links[]{label, url}
      }
  `
  return querySanity<SanityAuthor[]>(query, [])
}
