import assert from 'node:assert/strict'
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {checkStructuredData} from '../scripts/check-structured-data.mjs'

function articleHtml(graph: unknown) {
  return `<meta property="og:type" content="article"><script type="application/ld+json">${JSON.stringify(graph)}</script>`
}

function validGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: '測試文章',
        description: '測試描述',
        datePublished: '2026-08-29T10:00:00.000Z',
        dateModified: '2026-08-29T12:00:00.000Z',
        mainEntityOfPage: 'https://example.com/article/',
        author: {'@id': 'https://example.com/#organization'},
        publisher: {'@id': 'https://example.com/#organization'},
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {'@type': 'ListItem', position: 1, name: '首頁', item: 'https://example.com/'},
          {
            '@type': 'ListItem',
            position: 2,
            name: '測試文章',
            item: 'https://example.com/article/',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '測試問題？',
            acceptedAnswer: {'@type': 'Answer', text: '測試答案。'},
          },
        ],
      },
      organizationNode(),
    ],
  }
}

function organizationNode() {
  return {
    '@type': 'Organization',
    '@id': 'https://example.com/#organization',
    name: '測試站',
    url: 'https://example.com/',
    logo: {'@type': 'ImageObject', url: 'https://example.com/logo.png', width: 512, height: 512},
  }
}

function homeHtml() {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {'@type': 'WebSite', '@id': 'https://example.com/#website', name: '測試站', url: 'https://example.com/'},
      organizationNode(),
    ],
  }
  return `<meta property="og:type" content="website"><script type="application/ld+json">${JSON.stringify(graph)}</script>`
}

function collectionHtml(items: number) {
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://example.com/stay/#webpage',
        name: '住宿',
        url: 'https://example.com/stay/',
        ...(items > 0 ? {mainEntity: {'@id': 'https://example.com/stay/#list'}} : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {'@type': 'ListItem', position: 1, name: '首頁', item: 'https://example.com/'},
          {'@type': 'ListItem', position: 2, name: '住宿', item: 'https://example.com/stay/'},
        ],
      },
      ...(items > 0
        ? [{
            '@type': 'ItemList',
            '@id': 'https://example.com/stay/#list',
            itemListElement: Array.from({length: items}, (_, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: `主題 ${index + 1}`,
              url: `https://example.com/stay/topic-${index + 1}/`,
            })),
          }]
        : []),
      organizationNode(),
    ],
  }
  return `<meta property="og:type" content="website"><script type="application/ld+json">${JSON.stringify(graph)}</script>`
}

async function createSite(html: string, extraPages: Record<string, string> = {}) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'building-stay-schema-'))
  await writeFile(path.join(directory, 'index.html'), homeHtml())
  await writeFile(path.join(directory, 'logo.png'), 'png')
  const articleDirectory = path.join(directory, 'article')
  await mkdir(articleDirectory)
  await writeFile(path.join(articleDirectory, 'index.html'), html)
  for (const [name, pageHtml] of Object.entries(extraPages)) {
    const pageDirectory = path.join(directory, name)
    await mkdir(pageDirectory, {recursive: true})
    await writeFile(path.join(pageDirectory, 'index.html'), pageHtml)
  }
  return directory
}

test('建置後檢查會統計 Article、BreadcrumbList 與 FAQPage', async (context) => {
  const directory = await createSite(articleHtml(validGraph()))
  context.after(() => rm(directory, {recursive: true, force: true}))

  assert.deepEqual(await checkStructuredData(directory), {
    articleCount: 1,
    faqPageCount: 1,
    faqQuestionCount: 1,
    webSiteCount: 1,
    collectionPageCount: 0,
    aboutPageCount: 0,
    profilePageCount: 0,
  })
})

test('建置後檢查會驗證主題頁、關於頁與作者頁的結構化資料', async (context) => {
  const directory = await createSite(articleHtml(validGraph()), {
    stay: collectionHtml(2),
    'stay/empty': collectionHtml(0),
  })
  context.after(() => rm(directory, {recursive: true, force: true}))

  const result = await checkStructuredData(directory)
  assert.equal(result.collectionPageCount, 2)
  assert.equal(result.webSiteCount, 1)
})

test('可索引頁面沒有 JSON-LD 時會阻擋建置，noindex 頁面則可以沒有', async (context) => {
  const blocked = await createSite(articleHtml(validGraph()), {
    contact: '<meta name="robots" content="noindex, nofollow"><p>聯絡</p>',
    tags: '<p>沒有結構化資料的可索引頁</p>',
  })
  context.after(() => rm(blocked, {recursive: true, force: true}))

  await assert.rejects(checkStructuredData(blocked), /tags[\s\S]*可索引頁面沒有任何 JSON-LD/)

  const allowed = await createSite(articleHtml(validGraph()), {
    contact: '<meta name="robots" content="noindex, nofollow"><p>聯絡</p>',
  })
  context.after(() => rm(allowed, {recursive: true, force: true}))

  assert.equal((await checkStructuredData(allowed)).articleCount, 1)
})

test('Organization 缺少 logo 或 logo 檔案不存在時會阻擋建置', async (context) => {
  const graph = validGraph()
  const organization = graph['@graph'].find((item) => item['@type'] === 'Organization') as Record<string, unknown>
  delete organization.logo
  const missingLogo = await createSite(articleHtml(graph))
  context.after(() => rm(missingLogo, {recursive: true, force: true}))

  await assert.rejects(checkStructuredData(missingLogo), /Organization 缺少 logo\.url/)

  const missingFile = await createSite(articleHtml(validGraph()))
  context.after(() => rm(missingFile, {recursive: true, force: true}))
  await rm(path.join(missingFile, 'logo.png'))

  await assert.rejects(checkStructuredData(missingFile), /logo 指向的檔案不存在/)
})

test('缺少 Article 或 FAQ 答案時會阻擋建置', async (context) => {
  const graph = validGraph()
  graph['@graph'] = graph['@graph'].filter((item) => item['@type'] !== 'Article')
  graph['@graph'][1].mainEntity[0].acceptedAnswer.text = ''
  const directory = await createSite(articleHtml(graph))
  context.after(() => rm(directory, {recursive: true, force: true}))

  await assert.rejects(checkStructuredData(directory), /Article 必須正好一組/)
})
