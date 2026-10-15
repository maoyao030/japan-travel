import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

const argumentsList = process.argv.slice(2)
const applyChanges = argumentsList.includes('--apply')
const packetArgument = argumentsList.find((argument) => !argument.startsWith('--'))

if (!packetArgument) {
  throw new Error(
    '用法：sanity exec scripts/publish-article-cover.mjs --with-user-token -- <文章封包資料夾> [--apply]',
  )
}

const projectRoot = path.resolve(import.meta.dirname, '../..')
const packetDirectory = path.resolve(packetArgument)
const planPath = path.join(packetDirectory, 'images', 'image-plan.json')
const plan = JSON.parse(await readFile(planPath, 'utf8'))

if (plan.status !== 'selected') throw new Error('圖片封包尚未選定封面')
if (path.basename(packetDirectory) !== plan.articleId) {
  throw new Error('文章封包資料夾名稱與 articleId 不一致')
}

const coverSlot = plan.slots?.find((slot) => slot.slotId === 'cover' && slot.kind === 'cover')
const selectedCandidateId = plan.selectedCandidateIds?.cover
const candidate = coverSlot?.candidates?.find((item) => item.candidateId === selectedCandidateId)

if (!coverSlot || !candidate || !coverSlot.preparation) {
  throw new Error('圖片封包缺少已選定封面或 preparation 設定')
}
for (const field of ['altDraft', 'captionDraft', 'creditDraft']) {
  if (typeof candidate[field] !== 'string' || candidate[field].trim() === '') {
    throw new Error(`已選定封面缺少 ${field}`)
  }
}
if (
  candidate.sourceType === 'stock-photo' &&
  (typeof candidate.sourcePageUrl !== 'string' || candidate.sourcePageUrl.trim() === '')
) {
  throw new Error('免費實拍封面缺少 sourcePageUrl')
}

const preparedDirectory = path.join(projectRoot, '.tmp', 'image-selection', plan.articleId)
const coverPath = path.join(preparedDirectory, 'cover.webp')
const recordPath = path.join(preparedDirectory, 'prepared-cover.json')
const [coverBuffer, recordSource] = await Promise.all([
  readFile(coverPath),
  readFile(recordPath, 'utf8'),
])
const record = JSON.parse(recordSource)
const coverSha256 = createHash('sha256').update(coverBuffer).digest('hex')

if (record.articleId !== plan.articleId || record.selectedCandidateId !== selectedCandidateId) {
  throw new Error('最佳化紀錄與圖片封包不一致，請重新產生封面')
}
if (record.output?.sha256 !== coverSha256) {
  throw new Error('cover.webp 與最佳化紀錄的雜湊不一致，拒絕上傳')
}
if (record.output?.width !== 1600 || record.output?.height !== 900) {
  throw new Error('目前文章封面必須是 1600×900')
}

const articleId = `article-${plan.articleId}`
const draftId = `drafts.${articleId}`
const client = getCliClient({apiVersion: '2026-08-28'})
const documents = await client.fetch(
  `*[_id in $ids]{
    _id,
    _rev,
    _type,
    title,
    noindex,
    cover{
      "assetId": asset._ref,
      alt,
      caption,
      credit,
      sourcePageUrl
    }
  }`,
  {ids: [articleId, draftId]},
)
const article = documents.find((document) => document._id === articleId)
const draft = documents.find((document) => document._id === draftId)

if (article?._type !== 'article') throw new Error(`找不到 Sanity 文章：${articleId}`)
if (draft) throw new Error(`Sanity 有未發布草稿，請先人工判斷：${draftId}`)
if (article.noindex !== true) throw new Error('封面上稿期間文章必須維持 noindex=true')

const expectedCover = {
  alt: candidate.altDraft,
  caption: candidate.captionDraft,
  credit: candidate.creditDraft,
  ...(candidate.sourcePageUrl ? {sourcePageUrl: candidate.sourcePageUrl} : {}),
}
const existingMatches =
  article.cover?.assetId &&
  article.cover.alt === expectedCover.alt &&
  article.cover.caption === expectedCover.caption &&
  article.cover.credit === expectedCover.credit &&
  (article.cover.sourcePageUrl ?? undefined) === expectedCover.sourcePageUrl

if (article.cover?.assetId && !existingMatches) {
  throw new Error('文章已有不同封面，拒絕自動覆寫')
}

console.log(
  JSON.stringify(
    {
      mode: applyChanges ? 'apply' : 'dry-run',
      articleId,
      articleTitle: article.title,
      action: existingMatches ? 'already-matching' : 'upload-and-patch',
      selectedCandidateId,
      output: record.output,
      noindex: article.noindex,
      sourcePageUrl: candidate.sourcePageUrl,
    },
    null,
    2,
  ),
)

if (!applyChanges) {
  console.log('目前為預覽模式；加上 --apply 才會上傳圖片並更新文章。')
} else if (existingMatches) {
  console.log('Sanity 已有相同封面，不重複上傳。')
} else {
  const asset = await client.assets.upload('image', coverBuffer, {
    filename: `${plan.articleId}-cover.webp`,
  })
  await client
    .patch(articleId)
    .ifRevisionId(article._rev)
    .set({
      cover: {
        _type: 'image',
        asset: {_type: 'reference', _ref: asset._id},
        ...expectedCover,
      },
    })
    .commit()

  const verified = await client.fetch(
    `*[_id == $id][0]{
      _id,
      _rev,
      noindex,
      cover{
        "assetId": asset._ref,
        "width": asset->metadata.dimensions.width,
        "height": asset->metadata.dimensions.height,
        alt,
        caption,
        credit,
        sourcePageUrl
      }
    }`,
    {id: articleId},
  )

  if (
    verified?.cover?.assetId !== asset._id ||
    verified.cover.width !== 1600 ||
    verified.cover.height !== 900 ||
    verified.cover.alt !== expectedCover.alt ||
    verified.cover.caption !== expectedCover.caption ||
    verified.cover.credit !== expectedCover.credit ||
    verified.cover.sourcePageUrl !== expectedCover.sourcePageUrl ||
    verified.noindex !== true
  ) {
    throw new Error('Sanity 封面寫入後驗證失敗')
  }

  console.log(
    JSON.stringify(
      {
        articleId: verified._id,
        articleRevision: verified._rev,
        assetId: asset._id,
        status: 'cover-published-and-verified',
        noindex: verified.noindex,
      },
      null,
      2,
    ),
  )
}
