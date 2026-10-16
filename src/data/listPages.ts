import {getHubPath, PLACES_CATEGORY_SLUG, type HubPageData} from './hubs.ts'

/**
 * 列表頁依 Sanity 欄位自動產生，負責承載內連；內容不足的列表頁不建立、不進 Sitemap、不被連結。
 * 三個門檻都是暫定值，跑完北海道第一輪後再依實際內容調整。
 */
export const ASPECT_DIRECTORY_MIN_ITEMS = 5
export const MONTH_PAGE_MIN_ITEMS = 5
export const REGION_PLACE_LIST_MIN_PLACES = 3

export const ARTICLE_ASPECTS = [
  {slug: 'stay', title: '住宿', summary: '各地旅館的房型、含餐、接駁與訂房管道。'},
  {slug: 'food', title: '美食', summary: '各地代表料理、店家營業資訊與公開榜單。'},
  {slug: 'transport', title: '交通', summary: '前往各地的鐵路、巴士、渡輪與轉乘時間。'},
  {slug: 'weather', title: '天氣', summary: '各地逐月氣溫、降雨與穿著準備。'},
  {slug: 'hiking', title: '登山與步道', summary: '步道路線、所需時間、開放期間與裝備。'},
  {slug: 'festival', title: '祭典與花火', summary: '祭典與花火大會的日期、交通與觀賞位置。'},
  {slug: 'sight', title: '景點', summary: '各地景點的開放時間、門票與交通。'},
  {slug: 'other', title: '其他', summary: ''},
] as const

export type ArticleAspect = (typeof ARTICLE_ASPECTS)[number]['slug']

/** 「其他」只是 Sanity 的填寫選項，不建立目錄頁。 */
const DIRECTORY_ASPECTS = ARTICLE_ASPECTS.filter((aspect) => aspect.slug !== 'other')

export const MONTH_SLUGS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const

export type ListItem = {
  title: string
  excerpt: string
  path: string
  kind: 'article' | 'place'
}

type ListedArticle = {
  title: string
  excerpt: string
  aspect?: string
  months?: number[]
  noindex?: boolean
  publishedAt: string
}

export type ListSource<T extends ListedArticle> = {
  landingArticles: {article: T; hub: HubPageData}[]
  routableArticles: {article: T; hub: HubPageData; path: string}[]
  publishableHubs: HubPageData[]
}

export type AspectDirectory = {
  slug: string
  title: string
  summary: string
  path: string
  items: ListItem[]
}

export type MonthPage = {
  month: number
  slug: string
  title: string
  path: string
  items: ListItem[]
}

function articleEntries<T extends ListedArticle>(source: ListSource<T>) {
  // 列表頁會進 Sitemap，只收錄可索引的文章，門檻也只算這些。
  return [
    ...source.landingArticles.map(({article, hub}) => ({article, path: getHubPath(hub)})),
    ...source.routableArticles.map(({article, path}) => ({article, path})),
  ]
    .filter(({article}) => article.noindex === false)
    .sort((left, right) => Date.parse(right.article.publishedAt) - Date.parse(left.article.publishedAt))
}

function toArticleItem({article, path}: {article: ListedArticle; path: string}): ListItem {
  return {title: article.title, excerpt: article.excerpt, path, kind: 'article'}
}

export function getAspectDirectoryPath(slug: string) {
  return `/${slug}/`
}

export function getMonthPath(month: number) {
  return `/months/${MONTH_SLUGS[month - 1]}/`
}

export function getAspectDirectories<T extends ListedArticle>(source: ListSource<T>): AspectDirectory[] {
  const entries = articleEntries(source)

  return DIRECTORY_ASPECTS.flatMap((aspect) => {
    const items = entries.filter(({article}) => article.aspect === aspect.slug).map(toArticleItem)
    if (items.length < ASPECT_DIRECTORY_MIN_ITEMS) return []
    return [{...aspect, path: getAspectDirectoryPath(aspect.slug), items}]
  })
}

export function getMonthPages<T extends ListedArticle>(source: ListSource<T>): MonthPage[] {
  const entries = articleEntries(source)
  const places = source.publishableHubs.filter(
    (hub) => hub.categorySlug === PLACES_CATEGORY_SLUG && !hub.noindex,
  )

  return MONTH_SLUGS.flatMap((slug, index) => {
    const month = index + 1
    const items: ListItem[] = [
      ...places
        .filter((hub) => (hub.bestMonths ?? []).includes(month))
        .map((hub) => ({
          title: hub.title,
          excerpt: hub.seoDescription,
          path: getHubPath(hub),
          kind: 'place' as const,
        })),
      ...entries.filter(({article}) => (article.months ?? []).includes(month)).map(toArticleItem),
    ]
    const uniqueItems = items.filter(
      (item, itemIndex) => items.findIndex((candidate) => candidate.path === item.path) === itemIndex,
    )
    if (uniqueItems.length < MONTH_PAGE_MIN_ITEMS) return []
    return [{month, slug, title: `${month}月`, path: getMonthPath(month), items: uniqueItems}]
  })
}

/** 地區條目底下的地點清單：已發布、所屬地區是這個地區的地點滿 3 個才顯示。 */
export function getRegionPlaces(region: HubPageData, publishableHubs: HubPageData[]) {
  if (region.categorySlug !== PLACES_CATEGORY_SLUG || region.placeKind !== 'region') return []
  const places = publishableHubs
    .filter((hub) => hub.region?.id === region.id)
    .map((hub) => ({id: hub.id, title: hub.title, description: hub.seoDescription, path: getHubPath(hub)}))
  return places.length >= REGION_PLACE_LIST_MIN_PLACES ? places : []
}
