import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {CONTACT_EMAIL} from '../src/config/contact.ts'
import {SITE_NAME} from '../src/config/site.ts'
import type {ArticleBodyBlock, PortableTextBlock} from '../src/lib/portableText.ts'
import {getArticleFaqItems} from '../src/lib/portableText.ts'
import {
  createAboutPageStructuredData,
  createArticleStructuredData,
  createCollectionStructuredData,
  createOrganizationNode,
  createProfilePageStructuredData,
  createWebSiteStructuredData,
  serializeJsonLd,
} from '../src/lib/structuredData.ts'

function block(style: PortableTextBlock['style'], text: string): PortableTextBlock {
  return {
    _type: 'block',
    style,
    children: [{_type: 'span', text}],
  }
}

test('從可見文章正文擷取 FAQ，且不把結尾段落併入最後一題', () => {
  const body: ArticleBodyBlock[] = [
    block('h2', '銀山溫泉住宿常見問題'),
    block('h3', '能在 Agoda 訂到嗎？'),
    block('normal', '部分旅館有上架，其餘只接受官網或電話預約。'),
    block('h3', '冬天會停駛接駁嗎？'),
    block('normal', '大雪時可能停駛，出發前要向旅館確認。'),
    block('normal', '以上資訊以查核日期為準。'),
    block('h2', '參考資料'),
  ]

  assert.deepEqual(getArticleFaqItems(body), [
    {question: '能在 Agoda 訂到嗎？', answer: '部分旅館有上架，其餘只接受官網或電話預約。'},
    {question: '冬天會停駛接駁嗎？', answer: '大雪時可能停駛，出發前要向旅館確認。'},
  ])
})

test('沒有 FAQ 的文章不產生 FAQ 項目', () => {
  assert.deepEqual(
    getArticleFaqItems([block('h2', '交通方式'), block('normal', '從山形站搭巴士。')]),
    [],
  )
})

test('FAQ 缺少答案或問題重複時阻擋建置', () => {
  assert.throws(
    () => getArticleFaqItems([block('h2', '常見問題'), block('h3', '沒有答案嗎？')]),
    /缺少答案/,
  )
  assert.throws(
    () =>
      getArticleFaqItems([
        block('h2', '常見問題'),
        block('h3', '問題重複嗎？'),
        block('normal', '第一個答案。'),
        block('h3', '問題重複嗎？'),
        block('normal', '第二個答案。'),
      ]),
    /問題重複/,
  )
})

test('文章結構化資料包含 Article、BreadcrumbList 與條件式 FAQPage', () => {
  const data = createArticleStructuredData({
    authorName: `${SITE_NAME}編輯部`,
    breadcrumbs: [
      {name: '首頁', url: 'https://example.com/'},
      {name: '住宿', url: 'https://example.com/stay/'},
      {name: '測試文章', url: 'https://example.com/stay/test/'},
    ],
    canonicalUrl: 'https://example.com/stay/test/',
    coverUrl: 'https://cdn.sanity.io/images/test/cover.webp',
    dateModified: '2026-08-29T12:00:00.000Z',
    datePublished: '2026-08-29T10:00:00.000Z',
    description: '測試描述',
    faqItems: [{question: '測試問題？', answer: '測試答案。'}],
    headline: '測試文章',
    siteUrl: 'https://example.com/',
  })

  assert.deepEqual(
    data['@graph'].map((item) => item['@type']),
    ['Article', 'BreadcrumbList', 'FAQPage', 'Organization', 'WebSite'],
  )
  assert.equal(data['@graph'][2].mainEntity[0].name, '測試問題？')
  assert.equal(data['@graph'][2].mainEntity[0].acceptedAnswer.text, '測試答案。')
  assert.equal(data['@graph'][0].image, 'https://cdn.sanity.io/images/test/cover.webp')
  assert.deepEqual(data['@graph'][0].publisher, {'@id': 'https://example.com/#organization'})
  assert.deepEqual(data['@graph'][0].author, {'@id': 'https://example.com/#organization'})
  assert.deepEqual(data['@graph'][0].isPartOf, {'@id': 'https://example.com/#website'})

  const withoutFaq = createArticleStructuredData({...dataInput(), faqItems: []})
  assert.deepEqual(
    withoutFaq['@graph'].map((item) => item['@type']),
    ['Article', 'BreadcrumbList', 'Organization', 'WebSite'],
  )
})

test('文章封面帶尺寸時輸出 ImageObject，並附上主題、標籤與贊助資訊', () => {
  const data = createArticleStructuredData({
    ...dataInput(),
    cover: {url: 'https://cdn.sanity.io/images/test/cover.webp', width: 1600, height: 900, caption: '封面'},
    faqItems: [],
    keywords: ['溫泉', ' ', '親子'],
    section: '住宿',
    sponsorName: '測試廠商',
  })
  const article = data['@graph'][0]

  assert.deepEqual(article.image, {
    '@type': 'ImageObject',
    url: 'https://cdn.sanity.io/images/test/cover.webp',
    contentUrl: 'https://cdn.sanity.io/images/test/cover.webp',
    width: 1600,
    height: 900,
    caption: '封面',
  })
  assert.equal(article.articleSection, '住宿')
  assert.deepEqual(article.keywords, ['溫泉', '親子'])
  assert.deepEqual(article.sponsor, {'@type': 'Organization', name: '測試廠商'})

  const plain = createArticleStructuredData({...dataInput(), faqItems: []})['@graph'][0]
  assert.equal('articleSection' in plain, false)
  assert.equal('keywords' in plain, false)
  assert.equal('sponsor' in plain, false)
})

test('外部作者結構化資料保留作者頁連結與作者類型', () => {
  const data = createArticleStructuredData({
    ...dataInput(),
    authorHref: 'https://example.com/authors/darren/',
    authorName: 'Darren',
    authorType: 'Person',
    faqItems: [],
  })
  const article = data['@graph'][0]

  assert.deepEqual(article.author, {
    '@type': 'Person',
    '@id': 'https://example.com/authors/darren/#author',
    name: 'Darren',
    url: 'https://example.com/authors/darren/',
  })
})

test('Organization 節點帶 logo、簡介與聯絡信箱，且全站 @id 一致', () => {
  const organization = createOrganizationNode('https://example.com/')

  assert.equal(organization['@id'], 'https://example.com/#organization')
  assert.equal(organization.name, SITE_NAME)
  assert.equal(organization.email, CONTACT_EMAIL)
  assert.match(organization.description, /台灣讀者/)
  assert.equal(organization.logo.url, 'https://example.com/logo.png')
  assert.equal(organization.logo.width, 512)
  assert.equal(organization.logo.height, 512)
  assert.equal('sameAs' in organization, false)
})

test('主題頁與分類頁共用的 CollectionPage 含麵包屑、ItemList 與發布者', () => {
  const data = createCollectionStructuredData({
    breadcrumbs: [
      {name: '首頁', url: 'https://example.com/'},
      {name: '住宿', url: 'https://example.com/stay/'},
      {name: '銀山溫泉', url: 'https://example.com/stay/ginzan-onsen/'},
    ],
    canonicalUrl: 'https://example.com/stay/ginzan-onsen/',
    description: '銀山溫泉說明',
    items: [{name: '銀山溫泉旅館', url: 'https://example.com/stay/ginzan-onsen/ryokan/'}],
    name: '銀山溫泉',
    siteUrl: 'https://example.com/',
  })
  const nodes = data['@graph'] as Array<Record<string, any>>

  assert.deepEqual(
    nodes.map((node) => node['@type']),
    ['CollectionPage', 'BreadcrumbList', 'ItemList', 'Organization', 'WebSite'],
  )
  assert.deepEqual(nodes[0].mainEntity, {'@id': 'https://example.com/stay/ginzan-onsen/#list'})
  assert.deepEqual(nodes[0].publisher, {'@id': 'https://example.com/#organization'})
  assert.equal(nodes[2].numberOfItems, 1)
  assert.equal(nodes[1].itemListElement.length, 3)

  const empty = createCollectionStructuredData({
    breadcrumbs: [{name: '首頁', url: 'https://example.com/'}],
    canonicalUrl: 'https://example.com/stay/',
    description: '',
    items: [],
    name: '住宿',
    siteUrl: 'https://example.com/',
  })
  assert.equal('mainEntity' in empty['@graph'][0], false)
  assert.equal(empty['@graph'].some((node) => node['@type'] === 'ItemList'), false)
})

test('關於頁 AboutPage 的主體指向網站 Organization', () => {
  const data = createAboutPageStructuredData({
    breadcrumbs: [
      {name: '首頁', url: 'https://example.com/'},
      {name: `關於${SITE_NAME}`, url: 'https://example.com/about/'},
    ],
    canonicalUrl: 'https://example.com/about/',
    description: '關於頁描述',
    name: `關於${SITE_NAME}`,
    siteUrl: 'https://example.com/',
  })
  const nodes = data['@graph'] as Array<Record<string, any>>

  assert.deepEqual(
    nodes.map((node) => node['@type']),
    ['AboutPage', 'BreadcrumbList', 'Organization', 'WebSite'],
  )
  assert.deepEqual(nodes[0].mainEntity, {'@id': 'https://example.com/#organization'})
  assert.deepEqual(nodes[0].about, {'@id': 'https://example.com/#organization'})
})

test('作者頁 ProfilePage 的主體 @id 與文章 author 節點一致', () => {
  const data = createProfilePageStructuredData({
    breadcrumbs: [
      {name: '首頁', url: 'https://example.com/'},
      {name: '作者介紹', url: 'https://example.com/authors/darren/'},
    ],
    canonicalUrl: 'https://example.com/authors/darren/',
    dateModified: '2026-09-01T00:00:00.000Z',
    description: '作者頁描述',
    entity: {
      type: 'Person',
      name: 'Darren',
      description: '作者頁描述',
      image: {url: 'https://cdn.sanity.io/images/example/production/photo.jpg', width: 520, height: 520},
      sameAs: ['https://example.com/darren'],
    },
    name: 'Darren',
    siteUrl: 'https://example.com/',
  })
  const nodes = data['@graph'] as Array<Record<string, any>>

  assert.deepEqual(
    nodes.map((node) => node['@type']),
    ['ProfilePage', 'Person', 'BreadcrumbList', 'Organization', 'WebSite'],
  )
  assert.deepEqual(nodes[0].mainEntity, {'@id': 'https://example.com/authors/darren/#author'})
  assert.equal(nodes[0].dateModified, '2026-09-01T00:00:00.000Z')
  assert.equal(nodes[1]['@id'], 'https://example.com/authors/darren/#author')
  assert.equal(nodes[1].image.url, 'https://cdn.sanity.io/images/example/production/photo.jpg')
  assert.deepEqual(nodes[1].sameAs, ['https://example.com/darren'])
  assert.equal('logo' in nodes[1], false)
  assert.equal(nodes[3]['@id'], 'https://example.com/#organization')

  const article = createArticleStructuredData({
    ...dataInput(),
    authorHref: 'https://example.com/authors/darren/',
    authorName: 'Darren',
    authorType: 'Person',
    faqItems: [],
  })['@graph'][0]
  assert.equal(article.author['@id'], nodes[1]['@id'])
})

test('主題頁、關於頁、作者頁與情境頁都把結構化資料交給版面輸出', async () => {
  const files = await Promise.all(
    [
      'src/components/HubPage.astro',
      'src/pages/about.astro',
      'src/pages/authors/[slug].astro',
      'src/pages/tags/[...tag].astro',
    ].map((file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8')),
  )
  const [hubPage, aboutPage, authorPage, tagPage] = files

  assert.match(hubPage, /createCollectionStructuredData/)
  assert.match(aboutPage, /createAboutPageStructuredData/)
  assert.match(authorPage, /createProfilePageStructuredData/)
  assert.match(tagPage, /createCollectionStructuredData/)
  for (const file of files) assert.match(file, /structuredData=\{structuredData\}/)
})

test('JSON-LD 序列化會避開 script 結束標籤注入', () => {
  const serialized = serializeJsonLd({text: '</script><script>alert(1)</script>'})
  assert.doesNotMatch(serialized, /<\/script>/)
  assert.match(serialized, /\\u003c\/script>/)
})

function dataInput() {
  return {
    authorName: `${SITE_NAME}編輯部`,
    breadcrumbs: [{name: '首頁', url: 'https://example.com/'}],
    canonicalUrl: 'https://example.com/stay/test/',
    dateModified: '2026-08-29T12:00:00.000Z',
    datePublished: '2026-08-29T10:00:00.000Z',
    description: '測試描述',
    headline: '測試文章',
    siteUrl: 'https://example.com/',
  }
}

test('首頁 WebSite 結構化資料宣告站名', async () => {
  const siteUrl = 'https://example.com/'
  const data = createWebSiteStructuredData(siteUrl)
  const nodes = data['@graph'] as Array<Record<string, unknown>>
  const webSite = nodes.find((node) => node['@type'] === 'WebSite')
  const organization = nodes.find((node) => node['@type'] === 'Organization')

  assert.equal(data['@context'], 'https://schema.org')
  assert.ok(webSite)
  assert.equal(webSite.name, SITE_NAME)
  assert.equal(webSite.url, siteUrl)
  assert.equal(webSite['@id'], `${siteUrl}#website`)
  assert.deepEqual(webSite.publisher, {'@id': `${siteUrl}#organization`})
  assert.ok(organization)
  assert.equal(organization.name, SITE_NAME)
  assert.equal(organization['@id'], `${siteUrl}#organization`)
  assert.equal((organization.logo as Record<string, unknown>).url, `${siteUrl}logo.png`)

  const homepage = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8')
  assert.match(homepage, /createWebSiteStructuredData\(siteUrl\)/)
  assert.match(homepage, /structuredData=\{structuredData\}/)
})
