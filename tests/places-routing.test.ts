import assert from 'node:assert/strict'
import test from 'node:test'

import {checkSiteDepth, countUrlSegments} from '../scripts/check-site-depth.mjs'
import {siteCategories, type SiteCategory} from '../src/data/categories.ts'
import {
  getBreadcrumbParent,
  getHubPublicationIssues,
  getPublishableHubPages,
  type HubPageData,
} from '../src/data/hubs.ts'
import {
  ARTICLE_ASPECTS,
  getAspectDirectories,
  getMonthPages,
  getRegionPlaces,
} from '../src/data/listPages.ts'

const placeCategories: SiteCategory[] = [
  {
    slug: 'places',
    title: '地點',
    summary: '地點摘要',
    description: '地點說明',
    questionsHeading: '交通與住宿',
    readerQuestions: ['問題一', '問題二', '問題三'],
    topics: ['hokkaido', 'wakkanai', 'rishiri-island', 'rebun-island', 'hakodate'].map((slug) => ({
      slug,
      title: slug,
      status: '保留' as const,
    })),
  },
]

function place(slug: string, overrides: Partial<HubPageData> = {}): HubPageData {
  return {
    id: `hub-places-${slug}`,
    categorySlug: 'places',
    slug,
    title: slug,
    eyebrow: '地點條目',
    description: `${slug} 的交通、住宿與季節。`,
    checklist: ['交通', '住宿', '季節'],
    seoTitle: slug,
    seoDescription: `${slug} 摘要`,
    articles: [],
    publicationState: 'ready',
    researchValidated: true,
    noindex: false,
    placeKind: 'place',
    nameJa: slug,
    region: {id: 'hub-places-hokkaido', slug: 'hokkaido', title: 'hokkaido'},
    bestMonths: [],
    ...overrides,
  }
}

const hokkaido = place('hokkaido', {placeKind: 'region', region: undefined})

test('地點分類不用子 Hub，地點要有種類、日文原名與所屬地區', () => {
  const hubs = [hokkaido, place('wakkanai')]
  assert.deepEqual(getHubPublicationIssues(place('wakkanai'), hubs, placeCategories), [])
  assert.deepEqual(getHubPublicationIssues(hokkaido, hubs, placeCategories), [])

  const child = place('wakkanai', {
    parentHub: {id: hokkaido.id, categorySlug: 'places', slug: 'hokkaido', title: 'hokkaido'},
  })
  assert.match(getHubPublicationIssues(child, [hokkaido, child], placeCategories).join('、'), /地點分類不使用子主題中心/)

  const issues = getHubPublicationIssues(
    place('wakkanai', {placeKind: undefined, nameJa: '', region: undefined, bestMonths: [13]}),
    hubs,
    placeCategories,
  ).join('、')
  assert.match(issues, /必須選擇地區或地點/)
  assert.match(issues, /缺少日文原名/)
  assert.match(issues, /適合月份必須是 1～12/)

  const placeAsRegion = place('rishiri-island', {region: {id: 'hub-places-wakkanai', slug: 'wakkanai', title: 'wakkanai'}})
  assert.match(
    getHubPublicationIssues(placeAsRegion, [...hubs, placeAsRegion], placeCategories).join('、'),
    /所屬地區必須是地點分類裡的地區/,
  )
})

test('地點網址是平的，麵包屑經過已發布的地區；未發布的地區與鄰近地點不連結', () => {
  const wakkanai = place('wakkanai', {
    nearbyPlaces: [{id: 'hub-places-rishiri-island', slug: 'rishiri-island', title: 'rishiri-island'}],
  })
  const published = getPublishableHubPages([hokkaido, wakkanai, place('rishiri-island')], placeCategories)
  const resolved = published.find((hub) => hub.slug === 'wakkanai')!
  assert.deepEqual(getBreadcrumbParent(resolved), {title: 'hokkaido', path: '/places/hokkaido/'})
  assert.equal(resolved.nearbyPlaces?.[0].path, '/places/rishiri-island/')

  const withoutRegion = getPublishableHubPages(
    [{...hokkaido, publicationState: 'draft'}, wakkanai],
    placeCategories,
  ).find((hub) => hub.slug === 'wakkanai')!
  assert.equal(getBreadcrumbParent(withoutRegion), null)
  assert.deepEqual(withoutRegion.nearbyPlaces, [])
})

test('地區條目的地點清單滿 3 個地點才顯示', () => {
  const two = getPublishableHubPages([hokkaido, place('wakkanai'), place('rishiri-island')], placeCategories)
  assert.deepEqual(getRegionPlaces(two.find((hub) => hub.slug === 'hokkaido')!, two), [])

  const three = getPublishableHubPages(
    [hokkaido, place('wakkanai'), place('rishiri-island'), place('rebun-island')],
    placeCategories,
  )
  assert.deepEqual(
    getRegionPlaces(three.find((hub) => hub.slug === 'hokkaido')!, three).map((item) => item.path),
    ['/places/wakkanai/', '/places/rishiri-island/', '/places/rebun-island/'],
  )
})

function articles(count: number, fields: Record<string, unknown>) {
  const hub = place('hakodate')
  return Array.from({length: count}, (_, index) => ({
    article: {
      title: `文章 ${index}`,
      excerpt: '摘要',
      noindex: false,
      publishedAt: `2026-10-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
      ...fields,
    },
    hub,
    path: `/places/hakodate/a${index}/`,
  }))
}

test('面向目錄滿 5 篇、月份頁滿 5 個項目才建立，「其他」不建目錄', () => {
  const four = {landingArticles: [], routableArticles: articles(4, {aspect: 'stay'}), publishableHubs: []}
  assert.deepEqual(getAspectDirectories(four), [])

  const five = {landingArticles: [], routableArticles: articles(5, {aspect: 'stay'}), publishableHubs: []}
  const [stay] = getAspectDirectories(five)
  assert.equal(stay.path, '/stay/')
  assert.equal(stay.items.length, 5)
  assert.equal(stay.items[0].path, '/places/hakodate/a4/', '最新的排最前面')

  const hidden = {landingArticles: [], routableArticles: articles(5, {aspect: 'stay', noindex: true}), publishableHubs: []}
  assert.deepEqual(getAspectDirectories(hidden), [], '禁止索引的文章不算進門檻')

  const other = {landingArticles: [], routableArticles: articles(6, {aspect: 'other'}), publishableHubs: []}
  assert.deepEqual(getAspectDirectories(other), [])

  const reserved = new Set(siteCategories.map((category) => category.slug))
  for (const aspect of ARTICLE_ASPECTS) assert.equal(reserved.has(aspect.slug), false, aspect.slug)

  const december = {
    landingArticles: [],
    routableArticles: articles(3, {months: [12]}),
    publishableHubs: [place('wakkanai', {bestMonths: [12]}), place('rebun-island', {bestMonths: [6]})],
  }
  assert.deepEqual(getMonthPages(december), [])
  december.publishableHubs.push(place('hakodate', {bestMonths: [12, 1]}))
  const pages = getMonthPages(december)
  assert.deepEqual(pages.map((page) => page.path), ['/months/december/'])
  assert.equal(pages[0].items.filter((item) => item.kind === 'place').length, 2)
})

test('網址超過三層、或可索引頁從首頁要點超過三下時建置失敗', () => {
  assert.equal(countUrlSegments('/places/hakodate/stay/'), 3)

  const noindex = '<meta name="robots" content="noindex, follow">'
  const ok = checkSiteDepth([
    {route: '/', html: '<a href="/places/">地點</a>'},
    {route: '/places/', html: '<a href="/places/hakodate/">函館</a>'},
    {route: '/places/hakodate/', html: '<a href="/places/hakodate/stay/">住宿</a>'},
    {route: '/places/hakodate/stay/', html: ''},
    {route: '/404.html', html: ''},
  ])
  assert.deepEqual(ok.issues, [])

  const tooDeep = checkSiteDepth([
    {route: '/', html: '<a href="/places/">地點</a>'},
    {route: '/places/', html: '<a href="/places/hokkaido/">北海道</a>'},
    {route: '/places/hokkaido/', html: '<a href="/places/wakkanai/">稚內</a>'},
    {route: '/places/wakkanai/', html: '<a href="/places/wakkanai/ferry/">渡輪</a>'},
    {route: '/places/wakkanai/ferry/', html: ''},
    {route: '/places/a/b/c/', html: ''},
    {route: '/drafts/', html: noindex},
  ])
  const reasons = tooDeep.issues.map((issue) => `${issue.route} ${issue.reason}`).join('\n')
  assert.match(reasons, /\/places\/wakkanai\/ferry\/ 從首頁要點 4 下/)
  assert.match(reasons, /\/places\/a\/b\/c\/ 網址有 4 層/)
  assert.match(reasons, /\/places\/a\/b\/c\/ 可索引，但從首頁點不到/)
  assert.doesNotMatch(reasons, /drafts/)
})
