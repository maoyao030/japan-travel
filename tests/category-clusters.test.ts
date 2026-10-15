import assert from 'node:assert/strict'
import test from 'node:test'
import {getPublishableHubPages, type HubPageData} from '../src/data/hubs.ts'
import type {TagPageData} from '../src/data/tags.ts'
import {
  buildCategoryClusters,
  buildClusterNode,
  countClusterArticles,
  countClusterHubs,
  getCategoryTags,
  getLatestCategoryArticles,
} from '../src/lib/clusters.ts'
import {testCategories} from './fixtures/categories.ts'

function createHub(overrides: Partial<HubPageData> = {}): HubPageData {
  return {
    id: 'hub-ginzan',
    categorySlug: 'stay',
    slug: 'ginzan-onsen',
    title: '銀山溫泉',
    eyebrow: '銀山溫泉住宿指南',
    description: '第一段介紹。\n\n第二段只在主題頁顯示。',
    checklist: ['訂房管道', '含餐', '接駁'],
    seoTitle: '銀山溫泉｜測試站',
    seoDescription: '銀山溫泉住宿。',
    articles: [
      {id: 'booking', slug: 'booking', title: '銀山溫泉訂房管道', excerpt: '摘要', published: true},
      {id: 'access', slug: 'access', title: '銀山溫泉交通', excerpt: '摘要', published: true},
    ],
    publicationState: 'ready',
    researchValidated: true,
    noindex: false,
    ...overrides,
  }
}

function createChildHub(parent: HubPageData, overrides: Partial<HubPageData> = {}): HubPageData {
  return createHub({
    id: 'hub-ryokan',
    slug: 'ryokan',
    title: '銀山溫泉旅館',
    description: '旅館介紹。',
    parentHub: {id: parent.id, categorySlug: parent.categorySlug, slug: parent.slug, title: parent.title},
    landingArticleId: 'ryokan-guide',
    articles: [
      {id: 'ryokan-guide', slug: 'ryokan', title: '旅館完整指南', excerpt: '摘要', published: true},
      {id: 'ryokan-problems', slug: 'problems', title: '旅館常見問題', excerpt: '摘要', published: true},
      {id: 'ryokan-meals', slug: 'meals', title: '旅館餐食', excerpt: '摘要', published: true},
    ],
    ...overrides,
  })
}

function createPublishedSet() {
  const parent = createHub()
  const child = createChildHub(parent)
  const tokyo = createHub({
    id: 'hub-tokyo',
    categorySlug: 'weather',
    slug: 'tokyo',
    title: '東京天氣',
    articles: [{id: 'tokyo-november', slug: 'november', title: '東京11月天氣', excerpt: '摘要', published: true}],
  })

  return getPublishableHubPages([parent, child, tokyo], testCategories)
}

test('分類主題地圖只收同分類的父主題，並把子主題與文章掛在底下', () => {
  const clusters = buildCategoryClusters('stay', createPublishedSet())

  assert.equal(clusters.length, 1)
  const [ginzan] = clusters
  assert.equal(ginzan.path, '/stay/ginzan-onsen/')
  assert.equal(ginzan.description, '第一段介紹。')
  assert.equal(ginzan.hasLandingArticle, false)
  assert.deepEqual(
    ginzan.articles.map((article) => article.path),
    ['/stay/ginzan-onsen/booking/', '/stay/ginzan-onsen/access/'],
  )
  assert.equal(ginzan.children.length, 1)

  const [ryokan] = ginzan.children
  assert.equal(ryokan.path, '/stay/ginzan-onsen/ryokan/')
  assert.equal(ryokan.hasLandingArticle, true)
  assert.equal(ryokan.articleCount, 3)
  assert.deepEqual(
    ryokan.articles.map((article) => article.path),
    ['/stay/ginzan-onsen/ryokan-problems/', '/stay/ginzan-onsen/ryokan-meals/'],
  )
  assert.equal(countClusterHubs(clusters), 2)
  assert.equal(countClusterArticles(clusters), 5)
})

test('沒有主題中心的分類會得到空的主題地圖', () => {
  assert.deepEqual(buildCategoryClusters('food', createPublishedSet()), [])
})

test('子主題節點不再往下找孫層', () => {
  const hubs = createPublishedSet()
  const child = hubs.find((hub) => hub.id === 'hub-ryokan')

  assert.ok(child)
  assert.deepEqual(buildClusterNode(child, hubs).children, [])
})

test('分類最新文章依發布時間排序，入口文章使用主題頁網址', () => {
  const hubs = createPublishedSet()
  const ginzan = hubs.find((hub) => hub.id === 'hub-ginzan')
  const ryokan = hubs.find((hub) => hub.id === 'hub-ryokan')
  const tokyo = hubs.find((hub) => hub.id === 'hub-tokyo')
  assert.ok(ginzan && ryokan && tokyo)

  const latest = getLatestCategoryArticles(
    'stay',
    {
      landingArticles: [{article: {publishedAt: '2026-09-01T00:00:00Z', title: '旅館完整指南'}, hub: ryokan}],
      routableArticles: [
        {article: {publishedAt: '2026-09-10T00:00:00Z', title: '銀山溫泉訂房管道'}, hub: ginzan, path: '/stay/ginzan-onsen/booking/'},
        {article: {publishedAt: '2026-09-12T00:00:00Z', title: '東京11月天氣'}, hub: tokyo, path: '/weather/tokyo/november/'},
      ],
    },
    5,
  )

  assert.deepEqual(
    latest.map((entry) => entry.path),
    ['/stay/ginzan-onsen/booking/', '/stay/ginzan-onsen/ryokan/'],
  )
})

test('只挑出與同分類主題中心相關的使用情境', () => {
  const hubs = createPublishedSet()
  const tag = (id: string, hubIds: string[]): TagPageData => ({
    id,
    title: id,
    slug: id,
    description: '',
    seoTitle: '',
    seoDescription: '',
    articles: [],
    featuredArticleIds: [],
    relatedHubs: hubIds.map((hubId) => ({id: hubId, slug: hubId, title: hubId})),
    publicationState: 'ready',
    researchValidated: true,
    noindex: false,
  })

  const tags = getCategoryTags('stay', hubs, [
    tag('family', ['hub-ryokan', 'hub-tokyo']),
    tag('weather-only', ['hub-tokyo']),
  ])

  assert.deepEqual(tags.map((item) => item.id), ['family'])
})
