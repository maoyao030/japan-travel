import {CONTACT_EMAIL} from '../config/contact.ts'
import {
  ORGANIZATION_SAME_AS,
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_LOGO_SIZE,
  SITE_NAME,
} from '../config/site.ts'
import type {ArticleFaqItem} from './portableText.ts'

const LANGUAGE = 'zh-Hant-TW'

export type BreadcrumbItem = {
  name: string
  url: string
}

export type StructuredImage = {
  url: string
  width?: number
  height?: number
  caption?: string
}

export function getOrganizationId(siteUrl: string) {
  return `${siteUrl}#organization`
}

export function getWebSiteId(siteUrl: string) {
  return `${siteUrl}#website`
}

function createImageObject(image: StructuredImage) {
  return {
    '@type': 'ImageObject',
    url: image.url,
    contentUrl: image.url,
    ...(image.width ? {width: image.width} : {}),
    ...(image.height ? {height: image.height} : {}),
    ...(image.caption ? {caption: image.caption} : {}),
  }
}

/**
 * 網站本身的 Organization 節點。全站每一頁都放同一份、同一個 @id，
 * 讓搜尋引擎把首頁、文章、主題頁上的「發布者」認成同一個實體。
 */
export function createOrganizationNode(siteUrl: string) {
  return {
    '@type': 'Organization',
    '@id': getOrganizationId(siteUrl),
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    email: CONTACT_EMAIL,
    logo: createImageObject({
      url: new URL(SITE_LOGO_PATH, siteUrl).href,
      width: SITE_LOGO_SIZE,
      height: SITE_LOGO_SIZE,
      caption: SITE_NAME,
    }),
    ...(ORGANIZATION_SAME_AS.length > 0 ? {sameAs: [...ORGANIZATION_SAME_AS]} : {}),
  }
}

export function createWebSiteNode(siteUrl: string) {
  return {
    '@type': 'WebSite',
    '@id': getWebSiteId(siteUrl),
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_DESCRIPTION,
    inLanguage: LANGUAGE,
    publisher: {'@id': getOrganizationId(siteUrl)},
  }
}

function createBreadcrumbNode(id: string, breadcrumbs: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': id,
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

type ArticleStructuredDataInput = {
  authorHref?: string
  authorName: string
  authorType?: 'Organization' | 'Person'
  breadcrumbs: BreadcrumbItem[]
  canonicalUrl: string
  cover?: StructuredImage
  /** 相容舊呼叫方式；有 cover 時以 cover 為準。 */
  coverUrl?: string
  dateModified: string
  datePublished: string
  description: string
  faqItems: ArticleFaqItem[]
  headline: string
  keywords?: string[]
  section?: string
  siteUrl: string
  sponsorName?: string
}

export function createArticleStructuredData(input: ArticleStructuredDataInput) {
  const articleId = `${input.canonicalUrl}#article`
  const breadcrumbId = `${input.canonicalUrl}#breadcrumb`
  const publisherId = getOrganizationId(input.siteUrl)
  const cover = input.cover ?? (input.coverUrl ? {url: input.coverUrl} : undefined)
  const keywords = (input.keywords ?? []).map((item) => item.trim()).filter(Boolean)
  const isEditorialAuthor =
    input.authorName === SITE_NAME || input.authorName === `${SITE_NAME}編輯部`
  const article = {
    '@type': 'Article',
    '@id': articleId,
    headline: input.headline,
    description: input.description,
    inLanguage: LANGUAGE,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    mainEntityOfPage: input.canonicalUrl,
    isPartOf: {'@id': getWebSiteId(input.siteUrl)},
    author: isEditorialAuthor
      ? {'@id': publisherId}
      : {
          '@type': input.authorType ?? 'Person',
          ...(input.authorHref ? {'@id': `${input.authorHref}#author`} : {}),
          name: input.authorName,
          ...(input.authorHref ? {url: input.authorHref} : {}),
        },
    publisher: {'@id': publisherId},
    breadcrumb: {'@id': breadcrumbId},
    ...(cover
      ? {image: cover.width && cover.height ? createImageObject(cover) : cover.url}
      : {}),
    ...(input.section ? {articleSection: input.section} : {}),
    ...(keywords.length > 0 ? {keywords} : {}),
    ...(input.sponsorName ? {sponsor: {'@type': 'Organization', name: input.sponsorName}} : {}),
  }
  const breadcrumb = createBreadcrumbNode(breadcrumbId, input.breadcrumbs)
  const faqPage = input.faqItems.length > 0
    ? {
        '@type': 'FAQPage',
        '@id': `${input.canonicalUrl}#faq`,
        url: input.canonicalUrl,
        inLanguage: LANGUAGE,
        mainEntity: input.faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : null

  return {
    '@context': 'https://schema.org',
    '@graph': [
      article,
      breadcrumb,
      ...(faqPage ? [faqPage] : []),
      createOrganizationNode(input.siteUrl),
      createWebSiteNode(input.siteUrl),
    ],
  }
}

export function createWebSiteStructuredData(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [createWebSiteNode(siteUrl), createOrganizationNode(siteUrl)],
  }
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll(' ', '\\u2028')
    .replaceAll(' ', '\\u2029')
}

export type CollectionListItem = {
  name: string
  url: string
}

type CollectionStructuredDataInput = {
  breadcrumbs: BreadcrumbItem[]
  canonicalUrl: string
  description: string
  items: CollectionListItem[]
  name: string
  siteUrl: string
}

/** 分類頁、主題頁、情境標籤頁共用：CollectionPage + 麵包屑 + 頁面上的連結清單。 */
export function createCollectionStructuredData(input: CollectionStructuredDataInput) {
  const pageId = `${input.canonicalUrl}#webpage`
  const breadcrumbId = `${input.canonicalUrl}#breadcrumb`
  const listId = `${input.canonicalUrl}#list`
  const page = {
    '@type': 'CollectionPage',
    '@id': pageId,
    url: input.canonicalUrl,
    name: input.name,
    description: input.description,
    inLanguage: LANGUAGE,
    isPartOf: {'@id': getWebSiteId(input.siteUrl)},
    publisher: {'@id': getOrganizationId(input.siteUrl)},
    breadcrumb: {'@id': breadcrumbId},
    ...(input.items.length > 0 ? {mainEntity: {'@id': listId}} : {}),
  }
  const breadcrumb = createBreadcrumbNode(breadcrumbId, input.breadcrumbs)
  const itemList = input.items.length > 0
    ? {
        '@type': 'ItemList',
        '@id': listId,
        numberOfItems: input.items.length,
        itemListElement: input.items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          url: item.url,
        })),
      }
    : null

  return {
    '@context': 'https://schema.org',
    '@graph': [
      page,
      breadcrumb,
      ...(itemList ? [itemList] : []),
      createOrganizationNode(input.siteUrl),
      createWebSiteNode(input.siteUrl),
    ],
  }
}

type AboutPageStructuredDataInput = {
  breadcrumbs: BreadcrumbItem[]
  canonicalUrl: string
  description: string
  name: string
  siteUrl: string
}

/** 關於頁：AboutPage 的主體就是網站這個 Organization。 */
export function createAboutPageStructuredData(input: AboutPageStructuredDataInput) {
  const breadcrumbId = `${input.canonicalUrl}#breadcrumb`
  const page = {
    '@type': 'AboutPage',
    '@id': `${input.canonicalUrl}#webpage`,
    url: input.canonicalUrl,
    name: input.name,
    description: input.description,
    inLanguage: LANGUAGE,
    isPartOf: {'@id': getWebSiteId(input.siteUrl)},
    publisher: {'@id': getOrganizationId(input.siteUrl)},
    about: {'@id': getOrganizationId(input.siteUrl)},
    mainEntity: {'@id': getOrganizationId(input.siteUrl)},
    breadcrumb: {'@id': breadcrumbId},
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      page,
      createBreadcrumbNode(breadcrumbId, input.breadcrumbs),
      createOrganizationNode(input.siteUrl),
      createWebSiteNode(input.siteUrl),
    ],
  }
}

export type ProfileEntity = {
  type: 'Organization' | 'Person'
  name: string
  alternateName?: string
  description?: string
  email?: string
  telephone?: string
  image?: StructuredImage
  founder?: {name: string; jobTitle?: string}
  knowsAbout?: string[]
  sameAs?: string[]
}

type ProfilePageStructuredDataInput = {
  breadcrumbs: BreadcrumbItem[]
  canonicalUrl: string
  dateModified?: string
  description: string
  entity: ProfileEntity
  name: string
  siteUrl: string
}

/** 作者頁：ProfilePage，主體是該作者（工作室或個人），@id 與文章的 author 節點相同。 */
export function createProfilePageStructuredData(input: ProfilePageStructuredDataInput) {
  const breadcrumbId = `${input.canonicalUrl}#breadcrumb`
  const entityId = `${input.canonicalUrl}#author`
  const {entity} = input
  const mainEntity = {
    '@type': entity.type,
    '@id': entityId,
    name: entity.name,
    url: input.canonicalUrl,
    ...(entity.alternateName ? {alternateName: entity.alternateName} : {}),
    ...(entity.description ? {description: entity.description} : {}),
    ...(entity.email ? {email: entity.email} : {}),
    ...(entity.telephone ? {telephone: entity.telephone} : {}),
    ...(entity.image
      ? entity.type === 'Organization'
        ? {logo: createImageObject(entity.image), image: createImageObject(entity.image)}
        : {image: createImageObject(entity.image)}
      : {}),
    ...(entity.founder
      ? {
          founder: {
            '@type': 'Person',
            name: entity.founder.name,
            ...(entity.founder.jobTitle ? {jobTitle: entity.founder.jobTitle} : {}),
          },
        }
      : {}),
    ...(entity.knowsAbout && entity.knowsAbout.length > 0 ? {knowsAbout: entity.knowsAbout} : {}),
    ...(entity.sameAs && entity.sameAs.length > 0 ? {sameAs: entity.sameAs} : {}),
  }
  const page = {
    '@type': 'ProfilePage',
    '@id': `${input.canonicalUrl}#webpage`,
    url: input.canonicalUrl,
    name: input.name,
    description: input.description,
    inLanguage: LANGUAGE,
    ...(input.dateModified ? {dateModified: input.dateModified} : {}),
    isPartOf: {'@id': getWebSiteId(input.siteUrl)},
    publisher: {'@id': getOrganizationId(input.siteUrl)},
    mainEntity: {'@id': entityId},
    breadcrumb: {'@id': breadcrumbId},
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      page,
      mainEntity,
      createBreadcrumbNode(breadcrumbId, input.breadcrumbs),
      createOrganizationNode(input.siteUrl),
      createWebSiteNode(input.siteUrl),
    ],
  }
}
