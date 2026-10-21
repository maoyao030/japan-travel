import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

import {EDITORIAL_AUTHOR_NAME, SITE_NAME} from '../src/config/site.ts'
import {siteCategories} from '../src/data/categories.ts'

const projectRoot = new URL('../', import.meta.url)

async function readProjectFile(path: string) {
  return readFile(new URL(path, projectRoot), 'utf8')
}

test('站名集中在 src/config/site.ts，版面與後台都引用同一個名稱', async () => {
  assert.ok(SITE_NAME.trim().length > 0)
  assert.equal(EDITORIAL_AUTHOR_NAME, `${SITE_NAME}編輯部`)

  const [layout, studioConfig] = await Promise.all([
    readProjectFile('src/layouts/BaseLayout.astro'),
    readProjectFile('studio/sanity.config.ts'),
  ])

  assert.match(layout, /property="og:site_name" content=\{SITE_NAME\}/)
  assert.match(layout, /<span>\{SITE_NAME\}<\/span>/)
  assert.match(layout, /<p class="footer-title">\{SITE_NAME\}<\/p>/)
  assert.match(studioConfig, /SANITY_STUDIO_PROJECT_ID/)
})

test('公開頁面沒有好材誌或建材的殘留字串', async () => {
  const files = [
    'src/layouts/BaseLayout.astro',
    'src/pages/index.astro',
    'src/pages/[category].astro',
    'src/pages/about.astro',
    'src/pages/contact.astro',
    'src/pages/privacy.astro',
    'src/pages/404.astro',
    'src/pages/tags/[...tag].astro',
    'src/components/ArticlePage.astro',
    'src/components/HubPage.astro',
    'src/components/ClusterHubList.astro',
    'src/data/categories.ts',
    'src/config/site.ts',
  ]
  for (const file of files) {
    const source = await readProjectFile(file)
    assert.doesNotMatch(source, /好材誌|haotsai|建材|裝修|屋主|書隅/, file)
  }
})

test('首頁是車站站牌版型，地點與文章從已發布內容自動列出', async () => {
  const [homepage, layout] = await Promise.all([
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/layouts/BaseLayout.astro'),
  ])

  assert.doesNotMatch(homepage, /先看結論|重點整理|懶人包|TL;DR/)
  // 固定文字不寫特定地區或地點，地區擴充後不必回來改（2026-10-21 Darren 決定）
  for (const source of [homepage, layout]) {
    assert.doesNotMatch(source, /北海道|稚內|利尻|禮文|宗谷/)
  }
  assert.match(homepage, /getPublishedContentRoutes/)
  assert.match(homepage, /class="home-cards"/)
  assert.match(homepage, /class="station-card"/)
  assert.match(layout, /class="shell masthead"/)
  assert.match(layout, /class="line-stripe"/)
})

test('四個分類是地點、季節、神社與祭典、旅行教學的空殼', async () => {
  const categoryPage = await readProjectFile('src/pages/[category].astro')

  assert.deepEqual(
    siteCategories.map((category) => category.slug),
    ['places', 'seasons', 'shrines', 'guides'],
  )
  assert.deepEqual(
    siteCategories.map((category) => category.title),
    ['地點', '季節', '神社與祭典', '旅行教學'],
  )

  for (const category of siteCategories) {
    const publicCopy = [
      category.summary,
      category.description,
      category.questionsHeading,
      ...category.readerQuestions,
    ].join('\n')

    assert.equal(category.readerQuestions.length, 3)
    // 地點分類的主題中心取自地點清單（已核准規劃的旅行群，見 tests/place-hubs.test.ts）；其他分類還沒有核准的主題。
    if (category.slug !== 'places') {
      assert.deepEqual(category.topics, [], `${category.slug} 的主題中心要等 Darren 核准後才填`)
    }
    assert.doesNotMatch(publicCopy, /先看|懶人包|重點整理|這三個問題/)
  }

  assert.match(categoryPage, /\{category\.questionsHeading\}/)
  assert.match(categoryPage, /clusters\.length > 0/)
  assert.match(categoryPage, /clusters\.map/)
  assert.match(categoryPage, /buildCategoryClusters\(category\.slug, publishableHubs\)/)
  assert.match(categoryPage, /<ClusterHubList nodes=\{node\.children\}/)
  assert.match(categoryPage, /createCollectionStructuredData/)
  assert.doesNotMatch(categoryPage, /\/materials\/|category\.topics\.map/)
})

test('正式閱讀畫面不顯示測試站標示', async () => {
  const [layout, homepage, articlePage, categoryPage] = await Promise.all([
    readProjectFile('src/layouts/BaseLayout.astro'),
    readProjectFile('src/pages/index.astro'),
    readProjectFile('src/components/ArticlePage.astro'),
    readProjectFile('src/pages/[category].astro'),
  ])
  const publicTemplates = [layout, homepage, articlePage, categoryPage].join('\n')

  assert.doesNotMatch(publicTemplates, /測試版|測試站說明|內容測試文章|分類預覽|版型示範/)
  assert.match(articlePage, /isHubLanding \? '主題指南' : hub\.title/)
  assert.match(categoryPage, /title=\{`\$\{category\.title\}｜\$\{SITE_NAME\}`\}/)
})
