import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyHubPublicationPreview,
  getArticlePath,
  getHubPath,
  getHubPublicationIssues,
  getMatchingHubPath,
  getPublishableHubPages,
  getRoutableArticles,
  isHubPublishable,
  type HubPageData,
} from '../src/data/hubs.ts'
import {mapSanityHub} from '../src/lib/sanity.ts'
import {testCategories} from './fixtures/categories.ts'

function createHub(overrides: Partial<HubPageData> = {}): HubPageData {
  return {
    id: 'hub-stay-ginzan-onsen',
    categorySlug: 'stay',
    slug: 'ginzan-onsen',
    title: '銀山溫泉',
    eyebrow: '銀山溫泉住宿指南',
    description: '整理銀山溫泉的旅館、房型、接駁與訂房管道，協助旅人決定住哪一間。',
    checklist: ['訂房管道', '含餐與房型', '接駁與交通'],
    seoTitle: '銀山溫泉住宿指南｜測試站',
    seoDescription: '整理銀山溫泉旅館的房型、含餐、接駁與訂房管道。',
    articles: [
      {
        id: 'article-one',
        slug: 'article-one',
        title: '文章一',
        excerpt: '摘要一',
        published: true,
      },
      {
        id: 'article-two',
        slug: 'article-two',
        title: '文章二',
        excerpt: '摘要二',
        published: true,
      },
      {
        id: 'article-three',
        slug: 'article-three',
        title: '文章三',
        excerpt: '摘要三',
        published: true,
      },
    ],
    publicationState: 'ready',
    researchValidated: true,
    noindex: false,
    ...overrides,
  }
}

function createReadyChildHub(
  parent: HubPageData,
  overrides: Partial<HubPageData> = {},
): HubPageData {
  return createHub({
    id: 'hub-stay-ginzan-onsen-ryokan',
    slug: 'ryokan',
    title: '銀山溫泉旅館',
    parentHub: {
      id: parent.id,
      categorySlug: parent.categorySlug,
      slug: parent.slug,
      title: parent.title,
    },
    landingArticleId: 'ryokan-guide',
    articles: [
      {
        id: 'ryokan-guide',
        slug: 'ryokan',
        title: '銀山溫泉旅館完整指南',
        excerpt: '旅館完整指南摘要',
        published: true,
      },
      {
        id: 'ryokan-problems',
        slug: 'problems',
        title: '銀山溫泉旅館常見問題',
        excerpt: '常見問題摘要',
        published: true,
      },
      {
        id: 'ryokan-access',
        slug: 'access',
        title: '銀山溫泉旅館接駁',
        excerpt: '接駁摘要',
        published: true,
      },
    ],
    ...overrides,
  })
}

test('介紹完整的 Hub 可發布', () => {
  assert.equal(isHubPublishable(createHub(), [createHub()], testCategories), true)
  assert.equal(getPublishableHubPages([createHub()], testCategories).length, 1)
})

test('正式分類樹的 topics 還是空的，主題中心要等 Darren 核准後才會通過門檻', () => {
  const hub = createHub({categorySlug: 'seasons'})
  assert.equal(isHubPublishable(hub), false)
  assert.match(getHubPublicationIssues(hub).join('、'), /沒有規劃 ginzan-onsen 這個父主題中心/)
})

test('缺少獨立介紹時，不建立 Hub 頁面', () => {
  const hub = createHub({description: '   '})

  assert.equal(isHubPublishable(hub, [hub], testCategories), false)
  assert.match(getHubPublicationIssues(hub, [hub], testCategories).join('、'), /缺少主題中心自己的介紹/)
})

test('所有主題都必須先完成研究驗證', () => {
  const hub = createHub({
    researchValidated: false,
  })

  assert.equal(isHubPublishable(hub, [hub], testCategories), false)
  assert.match(getHubPublicationIssues(hub, [hub], testCategories).join('、'), /尚未完成搜尋需求與內容邊界驗證/)
})

test('草稿 Hub 不會進入正式路由，也不會阻擋建置', () => {
  const draft = createHub({publicationState: 'draft', articles: []})

  assert.equal(isHubPublishable(draft, [draft], testCategories), false)
  assert.deepEqual(getPublishableHubPages([draft], testCategories), [])
})

test('發布前預覽只開放指定 Hub，並強制維持 noindex', () => {
  const parent = createHub({publicationState: 'draft', noindex: false})
  const child = createReadyChildHub(parent, {publicationState: 'draft', noindex: false})
  const untouched = createHub({
    id: 'hub-stay-kurokawa-onsen',
    slug: 'kurokawa-onsen',
    title: '黑川溫泉',
    publicationState: 'draft',
  })
  const previewHubs = applyHubPublicationPreview(
    [parent, child, untouched],
    [parent.id, child.id],
  )
  const previewParent = previewHubs.find((hub) => hub.id === parent.id)
  const previewChild = previewHubs.find((hub) => hub.id === child.id)
  const untouchedHub = previewHubs.find((hub) => hub.id === untouched.id)

  assert.equal(previewParent?.publicationState, 'ready')
  assert.equal(previewParent?.noindex, true)
  assert.equal(previewParent?.publicationPreview, true)
  assert.equal(previewChild?.publicationState, 'ready')
  assert.equal(previewChild?.noindex, true)
  assert.equal(previewChild?.publicationPreview, true)
  assert.equal(untouchedHub?.publicationState, 'draft')
  assert.equal(untouchedHub?.publicationPreview, undefined)
  assert.equal(getPublishableHubPages(previewHubs, testCategories).length, 2)
})

test('發布前預覽指定不存在的 Hub 時停止建置', () => {
  assert.throws(
    () => applyHubPublicationPreview([createHub()], ['missing-hub']),
    /找不到要預覽的主題中心：missing-hub/,
  )
})

test('文章只會連到通過發布門檻的 Hub', () => {
  const reference = {categorySlug: 'stay', slug: 'ginzan-onsen'}
  const readyHub = createHub()
  const draftHub = createHub({publicationState: 'draft', articles: []})

  assert.equal(
    getMatchingHubPath(reference, getPublishableHubPages([readyHub], testCategories)),
    '/stay/ginzan-onsen/',
  )
  assert.equal(getMatchingHubPath(reference, getPublishableHubPages([draftHub], testCategories)), null)
})

test('Sanity Hub 會帶入已發布文章，並把精選文章排在前面', () => {
  const hub = mapSanityHub({
    _id: 'hub-ginzan',
    categorySlug: 'stay',
    slug: 'ginzan-onsen',
    title: '銀山溫泉',
    eyebrow: '銀山溫泉住宿指南',
    description: '整理銀山溫泉的旅館、房型與訂房管道。',
    checklist: ['訂房管道', '含餐與房型', '接駁與交通'],
    seoTitle: '銀山溫泉住宿指南｜測試站',
    seoDescription: '整理銀山溫泉旅館的房型、含餐、接駁與訂房管道。',
    publicationState: 'ready',
    researchValidated: true,
    noindex: false,
    featuredArticleIds: ['article-two'],
    landingArticleId: 'article-one',
    articles: [
      {
        _id: 'article-one',
        slug: 'article-one',
        title: '文章一',
        excerpt: '摘要一',
      },
      {
        _id: 'article-two',
        slug: 'article-two',
        title: '文章二',
        excerpt: '摘要二',
      },
      {
        _id: 'article-three',
        slug: 'article-three',
        title: '文章三',
        excerpt: '摘要三',
      },
    ],
  })

  assert.deepEqual(
    hub.articles.map((article) => article.slug),
    ['article-two', 'article-one', 'article-three'],
  )
  assert.equal(isHubPublishable(hub, [hub], testCategories), true)
  assert.equal(hub.landingArticleId, 'article-one')
})

test('子 Hub 會建立分層網址並掛在父 Hub 的子主題入口', () => {
  const parent = createHub()
  const child = createHub({
    id: 'hub-stay-ginzan-onsen-ryokan',
    slug: 'ryokan',
    title: '銀山溫泉旅館',
    parentHub: {
      id: parent.id,
      categorySlug: parent.categorySlug,
      slug: parent.slug,
      title: parent.title,
    },
  })
  const publishable = getPublishableHubPages([parent, child], testCategories)
  const publishedParent = publishable.find((hub) => hub.id === parent.id)

  assert.equal(getHubPath(child), '/stay/ginzan-onsen/ryokan/')
  assert.equal(isHubPublishable(child, [parent, child], testCategories), true)
  assert.equal(publishedParent?.childHubs?.[0]?.path, '/stay/ginzan-onsen/ryokan/')
})

test('父 Hub 尚未發布時，ready 子 Hub 仍可獨立發布', () => {
  const parent = createHub({publicationState: 'draft'})
  const child = createHub({
    id: 'hub-stay-ginzan-onsen-ryokan',
    slug: 'ryokan',
    title: '銀山溫泉旅館',
    parentHub: {
      id: parent.id,
      categorySlug: parent.categorySlug,
      slug: parent.slug,
      title: parent.title,
    },
  })
  const publishable = getPublishableHubPages([parent, child], testCategories)

  assert.equal(isHubPublishable(child, [parent, child], testCategories), true)
  assert.deepEqual(
    publishable.map((hub) => hub.id),
    [child.id],
  )
})

test('文章網址會跟著主要 Hub 層級建立，不再使用 articles 空層', () => {
  const hub = createHub()
  const article = {
    _id: 'article-one',
    title: '文章一',
    slug: 'article-one',
    primaryHubId: hub.id,
    noindex: false,
  }
  const [route] = getRoutableArticles([article], getPublishableHubPages([hub], testCategories))

  assert.equal(getArticlePath(article.slug, hub), '/stay/ginzan-onsen/article-one/')
  assert.equal(route.path, '/stay/ginzan-onsen/article-one/')
})

test('子 Hub 支援文章使用完整名稱的三層網址', () => {
  const parent = createHub()
  const child = createReadyChildHub(parent)
  const article = {
    _id: 'ryokan-problems',
    title: '銀山溫泉旅館常見問題',
    slug: 'problems',
    primaryHubId: child.id,
    noindex: false,
  }
  const publishableHubs = getPublishableHubPages([parent, child], testCategories)
  const [route] = getRoutableArticles([article], publishableHubs)

  assert.equal(getArticlePath(article.slug, child), '/stay/ginzan-onsen/ryokan-problems/')
  assert.equal(route.path, '/stay/ginzan-onsen/ryokan-problems/')
})

test('入口文章直接使用 Hub 網址，不再產生同名的下一層文章網址', () => {
  const hub = createHub({landingArticleId: 'article-one'})
  const article = {
    _id: 'article-one',
    title: '銀山溫泉住宿完整指南',
    slug: 'ginzan-onsen',
    primaryHubId: hub.id,
    noindex: false,
  }
  const publishableHubs = getPublishableHubPages([hub], testCategories)

  assert.equal(
    getArticlePath(article.slug, publishableHubs[0], article._id),
    '/stay/ginzan-onsen/',
  )
  assert.deepEqual(getRoutableArticles([article], publishableHubs), [])
})

test('入口內容不是目前 Hub 的已發布文章時會阻擋建置', () => {
  const hub = createHub({landingArticleId: 'missing-article'})

  assert.match(getHubPublicationIssues(hub, [hub], testCategories).join('、'), /入口內容必須是歸屬這個主題中心/)
  assert.throws(() => getPublishableHubPages([hub], testCategories), /入口內容必須是歸屬這個主題中心/)
})

test('找不到主要 Hub 的文章只是不建立路由，不阻擋建置', () => {
  const article = {
    _id: 'article-orphan',
    title: '孤立文章',
    slug: 'orphan',
    primaryHubId: 'missing-hub',
    noindex: false,
  }

  assert.deepEqual(getRoutableArticles([article], []), [])
})
