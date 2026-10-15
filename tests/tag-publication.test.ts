import assert from 'node:assert/strict'
import test from 'node:test'
import {type HubPageData, getPublishableHubPages} from '../src/data/hubs.ts'
import {
  getArticleTagLinks,
  getPublishableTagPages,
  getTagPublicationIssues,
  type TagPageData,
} from '../src/data/tags.ts'
import {testCategories} from './fixtures/categories.ts'

function createHub(id: string, slug: string, title: string): HubPageData {
  return {
    id,
    categorySlug: 'stay',
    slug,
    title,
    eyebrow: `${title}住宿指南`,
    description: `整理${title}的旅館、房型與訂房管道。`,
    checklist: ['訂房管道', '含餐與房型', '接駁與交通'],
    seoTitle: `${title}住宿指南`,
    seoDescription: `整理${title}的旅館與訂房管道。`,
    articles: [1, 2, 3].map((number) => ({
      id: `${id}-article-${number}`,
      slug: `article-${number}`,
      title: `文章 ${number}`,
      excerpt: `文章 ${number} 摘要`,
      published: true,
    })),
    publicationState: 'ready',
    researchValidated: true,
    noindex: false,
  }
}

function createTag(overrides: Partial<TagPageData> = {}): TagPageData {
  return {
    id: 'tag-family-trip',
    title: '親子旅行',
    slug: 'family-trip',
    description: '整理帶小孩住溫泉旅館時要一起確認的房型、餐食與接駁條件。',
    seoTitle: '親子旅行的日本溫泉住宿注意事項',
    seoDescription: '依主題整理親子旅行的旅館選擇、餐食限制與接駁資訊。',
    articles: [
      {
        id: 'a1',
        hubId: 'hub-ginzan',
        hubTitle: '銀山溫泉',
        slug: 'a1',
        title: '文章一',
        excerpt: '摘要一',
      },
      {
        id: 'a2',
        hubId: 'hub-ginzan',
        hubTitle: '銀山溫泉',
        slug: 'a2',
        title: '文章二',
        excerpt: '摘要二',
      },
      {
        id: 'a3',
        hubId: 'hub-ginzan',
        hubTitle: '銀山溫泉',
        slug: 'a3',
        title: '文章三',
        excerpt: '摘要三',
      },
      {
        id: 'a4',
        hubId: 'hub-kurokawa',
        hubTitle: '黑川溫泉',
        slug: 'a4',
        title: '文章四',
        excerpt: '摘要四',
      },
      {
        id: 'a5',
        hubId: 'hub-kurokawa',
        hubTitle: '黑川溫泉',
        slug: 'a5',
        title: '文章五',
        excerpt: '摘要五',
      },
    ],
    featuredArticleIds: ['a4'],
    relatedHubs: [
      {id: 'hub-ginzan', slug: 'ginzan-onsen', title: '銀山溫泉'},
      {id: 'hub-kurokawa', slug: 'kurokawa-onsen', title: '黑川溫泉'},
    ],
    publicationState: 'ready',
    researchValidated: true,
    noindex: false,
    ...overrides,
  }
}

const publishableHubs = getPublishableHubPages(
  [createHub('hub-ginzan', 'ginzan-onsen', '銀山溫泉'), createHub('hub-kurokawa', 'kurokawa-onsen', '黑川溫泉')],
  testCategories,
)

test('Tag 達到五篇文章、跨兩個 Hub 與內容門檻時可發布', () => {
  const [tag] = getPublishableTagPages([createTag()], publishableHubs)

  assert.equal(tag.articles.length, 5)
  assert.equal(tag.articles[0].id, 'a4')
  assert.equal(tag.articles[0].path, '/stay/kurokawa-onsen/a4/')
})

test('Tag 文章不足或只來自一個 Hub 時會阻擋建置', () => {
  const tag = createTag({articles: createTag().articles.slice(0, 3)})
  const issues = getTagPublicationIssues(tag, publishableHubs).join('、')

  assert.match(issues, /不足 5 篇/)
  assert.match(issues, /至少 2 個/)
  assert.throws(() => getPublishableTagPages([tag], publishableHubs), /Tag 頁未通過發布門檻/)
})

test('文章只會顯示已發布 Tag 的連結', () => {
  const readyTag = createTag()
  const draftTag = createTag({
    id: 'tag-draft',
    slug: 'draft-tag',
    title: '未發布 Tag',
    publicationState: 'draft',
  })
  const publishedTags = getPublishableTagPages([readyTag, draftTag], publishableHubs)
  const links = getArticleTagLinks(
    [
      {id: readyTag.id, slug: readyTag.slug, title: readyTag.title},
      {id: draftTag.id, slug: draftTag.slug, title: draftTag.title},
    ],
    publishedTags,
  )

  assert.deepEqual(links, [
    {
      id: readyTag.id,
      slug: readyTag.slug,
      title: readyTag.title,
      path: '/tags/family-trip/',
    },
  ])
})

test('Tag 連到主題入口文章時使用 Hub 網址', () => {
  const landingHub = createHub('hub-ginzan', 'ginzan-onsen', '銀山溫泉')
  landingHub.landingArticleId = 'a1'
  landingHub.articles[0].id = 'a1'
  const otherHub = createHub('hub-kurokawa', 'kurokawa-onsen', '黑川溫泉')
  const hubs = getPublishableHubPages([landingHub, otherHub], testCategories)
  const [tag] = getPublishableTagPages([createTag()], hubs)

  assert.equal(tag.articles.find((article) => article.id === 'a1')?.path, '/stay/ginzan-onsen/')
})
