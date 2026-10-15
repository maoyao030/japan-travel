import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

const argumentsList = process.argv.slice(2)
const applyChanges = argumentsList.includes('--apply')
const updateExisting = argumentsList.includes('--update-existing')
const expectedRevisionArgument = argumentsList.find((argument) =>
  argument.startsWith('--expected-revision='),
)
const expectedRevision = expectedRevisionArgument?.slice('--expected-revision='.length)
const inputArgument = argumentsList.find((argument) => !argument.startsWith('--'))

if (!inputArgument) {
  throw new Error(
    '用法：sanity exec scripts/publish-prepared-article.mjs --with-user-token -- <article.json> [--update-existing] [--expected-revision=<rev>] [--apply]',
  )
}

const articlePath = path.resolve(inputArgument)
const article = JSON.parse(await readFile(articlePath, 'utf8'))

if (article?._type !== 'article' || !article._id || article._id.startsWith('drafts.')) {
  throw new Error('輸入檔必須是具有正式文件 ID 的 Sanity article')
}

for (const field of [
  'title',
  'excerpt',
  'publishedAt',
  'updatedAt',
  'seoTitle',
  'seoDescription',
]) {
  if (typeof article[field] !== 'string' || article[field].trim() === '') {
    throw new Error(`文章缺少必要欄位：${field}`)
  }
}

if (!article.slug?.current) throw new Error('文章缺少 slug.current')
if (!Array.isArray(article.body) || article.body.length === 0) throw new Error('文章正文為空')
if (article.noindex !== true) throw new Error('首次上稿必須維持 noindex=true')

const authorId = article.author?._ref
const primaryHubId = article.primaryHub?._ref
const relatedArticleIds = (article.relatedArticles ?? []).map((reference) => reference?._ref)

if (!authorId) throw new Error('文章缺少作者 reference')
if (!primaryHubId) throw new Error('文章缺少主要 Hub reference')
if (relatedArticleIds.some((id) => !id)) throw new Error('相關文章含有無效 reference')

const client = getCliClient({apiVersion: '2026-08-28'})
const draftId = `drafts.${article._id}`
const referenceIds = [authorId, primaryHubId, ...relatedArticleIds]
const documents = await client.fetch(
  `*[_id in $ids]{
    _id,
    _rev,
    _type,
    title,
    excerpt,
    publishedAt,
    seoTitle,
    seoDescription,
    updatedAt,
    noindex,
    sponsored,
    "slug": slug.current,
    "authorId": author._ref,
    "primaryHubId": primaryHub._ref,
    "relatedArticleIds": relatedArticles[]._ref,
    "coverAssetId": cover.asset._ref,
    "bodyCount": count(body),
    body
  }`,
  {ids: [...referenceIds, article._id, draftId]},
)

const author = documents.find((document) => document._id === authorId)
const primaryHub = documents.find((document) => document._id === primaryHubId)
const existingArticle = documents.find((document) => document._id === article._id)
const existingDraft = documents.find((document) => document._id === draftId)

if (author?._type !== 'author') throw new Error(`找不到作者：${authorId}`)
if (primaryHub?._type !== 'hub') throw new Error(`找不到主要 Hub：${primaryHubId}`)

for (const relatedArticleId of relatedArticleIds) {
  if (documents.find((document) => document._id === relatedArticleId)?._type !== 'article') {
    throw new Error(`找不到相關文章：${relatedArticleId}`)
  }
}

if (existingDraft) {
  throw new Error(`Sanity 已有同 ID 草稿，請先人工判斷：${draftId}`)
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  )
}

function contentHash(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')
}

function sameReferences(left = [], right = []) {
  return left.length === right.length && left.every((id, index) => id === right[index])
}

function matchesPreparedArticle(document) {
  return (
    document?.title === article.title &&
    document?.excerpt === article.excerpt &&
    document?.publishedAt === article.publishedAt &&
    document?.updatedAt === article.updatedAt &&
    document?.seoTitle === article.seoTitle &&
    document?.seoDescription === article.seoDescription &&
    document?.slug === article.slug.current &&
    document?.authorId === authorId &&
    document?.primaryHubId === primaryHubId &&
    document?.noindex === true &&
    document?.sponsored === article.sponsored &&
    sameReferences(document?.relatedArticleIds, relatedArticleIds) &&
    document?.bodyCount === article.body.length &&
    contentHash(document?.body) === contentHash(article.body)
  )
}

if (existingArticle && !matchesPreparedArticle(existingArticle) && !updateExisting) {
  throw new Error(`Sanity 已有內容不同的正式文件，拒絕覆寫：${article._id}`)
}

if (existingArticle && updateExisting) {
  if (
    existingArticle.slug !== article.slug.current ||
    existingArticle.authorId !== authorId ||
    existingArticle.primaryHubId !== primaryHubId ||
    existingArticle.publishedAt !== article.publishedAt ||
    existingArticle.sponsored !== article.sponsored
  ) {
    throw new Error('既有文章的 slug、作者、主要 Hub、首次發布時間或業配狀態不同，拒絕自動更新')
  }
  if (expectedRevision && expectedRevision !== existingArticle._rev) {
    throw new Error(`Sanity 版本已變更；目前為 ${existingArticle._rev}，不是 ${expectedRevision}`)
  }
  if (applyChanges && !matchesPreparedArticle(existingArticle) && !expectedRevision) {
    throw new Error('更新既有文章時，--apply 必須同時提供 --expected-revision=<目前版本>')
  }
}

const action = !existingArticle
  ? 'create'
  : matchesPreparedArticle(existingArticle)
    ? 'already-matching'
    : 'update-approved-fields'

console.log(
  JSON.stringify(
    {
      mode: applyChanges ? 'apply' : 'dry-run',
      articleId: article._id,
      action,
      currentRevision: existingArticle?._rev ?? null,
      primaryHubId,
      authorId,
      bodyCount: article.body.length,
      bodySha256: contentHash(article.body),
      noindex: article.noindex,
      existingCoverAssetId: existingArticle?.coverAssetId ?? null,
    },
    null,
    2,
  ),
)

if (!applyChanges) {
  console.log('目前為預覽模式；加上 --apply 才會寫入 Sanity。')
} else {
  if (!existingArticle) {
    await client.create(article)
  } else if (!matchesPreparedArticle(existingArticle)) {
    await client
      .patch(article._id)
      .ifRevisionId(expectedRevision)
      .set({
        title: article.title,
        excerpt: article.excerpt,
        updatedAt: article.updatedAt,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        body: article.body,
        relatedArticles: article.relatedArticles ?? [],
        noindex: true,
      })
      .commit()
  }

  const verified = await client.fetch(
    `*[_id == $id][0]{
      _id,
      _rev,
      _type,
      title,
      excerpt,
      publishedAt,
      seoTitle,
      seoDescription,
      updatedAt,
      noindex,
      sponsored,
      "slug": slug.current,
      "authorId": author._ref,
      "primaryHubId": primaryHub._ref,
      "relatedArticleIds": relatedArticles[]._ref,
      "coverAssetId": cover.asset._ref,
      "bodyCount": count(body),
      body
    }`,
    {id: article._id},
  )

  if (!matchesPreparedArticle(verified)) {
    throw new Error('Sanity 寫入後的文章欄位驗證失敗')
  }
  if (existingArticle?.coverAssetId && verified.coverAssetId !== existingArticle.coverAssetId) {
    throw new Error('文章更新後封面資產發生非預期變更')
  }

  console.log(
    JSON.stringify(
      {
        articleId: verified._id,
        articleRevision: verified._rev,
        bodySha256: contentHash(verified.body),
        coverAssetId: verified.coverAssetId ?? null,
        status: action === 'update-approved-fields' ? 'updated-and-verified' : 'published-and-verified',
      },
      null,
      2,
    ),
  )
}
