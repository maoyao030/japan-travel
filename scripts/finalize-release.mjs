/**
 * 發布封包定稿：把驗收通過的文章封包轉成 Sanity 正文，並寫出帶清單預先授權的 manifest。
 * 從好材誌的 finalize-answer-first-release.mjs 移植，改成本站的驗收檔案：
 * 事實查核紀錄 fact-check.json、標題檢查 heading-review.json、AI 圖或示意圖的 images/image-review.json。
 *
 * 用法：node scripts/finalize-release.mjs content-production/<article-id> [--sanity-output=<dir>] [--queue=<path>]
 * 任何門檻沒過就失敗，不寫出任何檔案；routine 依失敗原因呼叫 ops-article.mjs fail。
 */
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {access, mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {validateFactCheck} from '../.agents/skills/japan-travel-acceptance/scripts/validate-fact-check.mjs'
import {validateImageReview} from '../.agents/skills/japan-travel-acceptance/scripts/validate-image-review.mjs'
import {findQueueItem, getItemAuthorization, loadArticleQueue} from './article-automation-policy.mjs'

export const RELEASE_SCHEMA_VERSION = 'answer-first-release-1'
export const WORKFLOW = 'japan-travel-answer-first'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const answerFirstScripts = path.join(projectRoot, '.agents/skills/japan-travel-answer-first/scripts')
const prepareSanityContentPath = path.join(projectRoot, 'scripts/prepare-sanity-content.mjs')

const BANNED_SUMMARY_LABELS = ['先看結論', '重點先看', '重點整理', '懶人包', 'TL;DR']

const hasText = (value) => typeof value === 'string' && value.trim().length > 0
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')
const normalizeNewlines = (text) => text.replaceAll('\r\n', '\n')
const containsBannedLabel = (text) => BANNED_SUMMARY_LABELS.find((label) => text.includes(label)) ?? null

function resolvePython() {
  if (process.env.PYTHON) return process.env.PYTHON
  return process.platform === 'win32' ? 'python' : 'python3'
}

function runPython(script, args) {
  const run = spawnSync(resolvePython(), [path.join(answerFirstScripts, script), ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8'},
  })
  if (run.error) throw new Error(`無法執行 ${script}：${run.error.message}`)
  return run
}

export function inspectReaderPreview(markdown, item) {
  const issues = []
  const text = normalizeNewlines(markdown)
  const lines = text.split('\n')
  const h1Lines = lines.filter((line) => /^# \S/.test(line))
  if (h1Lines.length !== 1) issues.push(`reader-preview.md 必須恰好有一個 H1，目前有 ${h1Lines.length} 個`)
  const h1 = h1Lines[0]?.slice(2).trim() ?? ''
  if (/[:：]/.test(h1)) issues.push('H1 不得用冒號切開主題與說明')
  if (lines.some((line) => /^#{4,}\s/.test(line))) issues.push('正文不得使用 H4 以下標題；Sanity 轉換只支援 H2 與 H3')
  if (!lines.some((line) => /^## 資料來源\s*$/.test(line))) issues.push('正文缺少文末 `## 資料來源` 段落')
  if (/!\[[^\]]*\]\(/.test(text) || /<(img|script|iframe|video)\b/i.test(text)) {
    issues.push('正文不得內嵌圖片或 HTML；圖片由圖片封包另外處理')
  }
  if (/\[[FR]\d+(?:\s*,\s*[FR]\d+)*\]/.test(text)) issues.push('reader-preview.md 還留著事實編號標記，請用 fact_tags.py 產生')
  if (hasText(item?.primaryQuery) && !text.includes(item.primaryQuery)) {
    issues.push(`正文沒有出現完整的主要查詢「${item.primaryQuery}」`)
  }
  const sourcesIndex = text.search(/^## 資料來源\s*$/m)
  const bodyText = sourcesIndex >= 0 ? text.slice(0, sourcesIndex) : text
  const sourcesText = sourcesIndex >= 0 ? text.slice(sourcesIndex) : ''
  const bannedLabel = containsBannedLabel(bodyText) ?? containsBannedLabel(sourcesText.replace(/\[[^\]]*\]\([^)]*\)/g, ''))
  if (bannedLabel) issues.push(`正文出現制式摘要標籤「${bannedLabel}」`)

  const internalLinks = [...text.matchAll(/\]\((\/[^)\s]*)\)/g)].map((match) => match[1])
  for (const link of internalLinks) {
    if (item?.targetPath && link === item.targetPath) issues.push(`正文不得連到文章自己的網址：${link}`)
    if (!link.endsWith('/')) issues.push(`站內連結必須以斜線結尾：${link}`)
  }
  return {issues, h1, internalLinks}
}

export function inspectReview(reviewMarkdown, readerPreviewSha256) {
  const issues = []
  const text = normalizeNewlines(reviewMarkdown)
  if (!text.toLowerCase().includes(readerPreviewSha256.toLowerCase())) {
    issues.push('review.md 沒有記錄目前 reader-preview.md 的 SHA-256；驗收報告不對應這份成稿')
  }
  if (!/驗收者|驗收 agent|子代理|驗收人/.test(text)) issues.push('review.md 沒有記錄驗收者身分')
  if (!/\bmechanical_clear\b/.test(text)) issues.push('review.md 沒有記錄格式結果 `mechanical_clear`')
  const factTokens = [...text.matchAll(/\b(verified|not_checked)\b/g)].map((match) => match[1])
  if (!factTokens.includes('verified')) issues.push('review.md 沒有記錄事實與條件 `verified`')
  const tokens = [...text.matchAll(/\b(ready_for_user_preview|rejected|needs_review)\b/g)].map((match) => match[1])
  const result = tokens.at(-1) ?? null
  if (result !== 'ready_for_user_preview') {
    issues.push(`review.md 的最終結果必須是 \`ready_for_user_preview\`，目前為 ${result ?? '未記錄'}`)
  }
  if (factTokens.at(-1) === 'not_checked' && result === 'ready_for_user_preview') {
    issues.push('review.md 最後記錄的事實與條件仍是 `not_checked`，卻宣告 `ready_for_user_preview`')
  }
  return {issues, result}
}

export function inspectPublication(publication, {h1, referenceReview, articleId}) {
  const issues = []
  if (publication?.articleId && publication.articleId !== articleId) issues.push('publication.json 的 articleId 與封包資料夾不一致')
  for (const [field, min, max] of [
    ['seoTitle', 8, 70],
    ['seoDescription', 30, 160],
    ['excerpt', 30, 200],
  ]) {
    const value = publication?.[field]
    if (!hasText(value)) {
      issues.push(`publication.json 缺少 ${field}`)
      continue
    }
    const length = value.trim().length
    if (length < min || length > max) issues.push(`publication.json 的 ${field} 長度必須在 ${min}～${max} 字之間，目前 ${length} 字`)
    const bannedLabel = containsBannedLabel(value)
    if (bannedLabel) issues.push(`publication.json 的 ${field} 出現制式摘要標籤「${bannedLabel}」`)
  }
  if (hasText(publication?.seoTitle)) {
    const seoTitle = publication.seoTitle.trim()
    if (/[:：]/.test(seoTitle)) issues.push('SEO Title 不得用冒號切開主題與說明')
    if (seoTitle !== h1 && !normalizeNewlines(referenceReview ?? '').includes(seoTitle)) {
      issues.push('SEO Title 必須是研究記錄文章計畫中並列的 SEO Title，或與 H1 相同')
    }
  }
  if (publication?.publishedAt !== undefined && Number.isNaN(new Date(publication.publishedAt).getTime())) {
    issues.push('publication.json 的 publishedAt 不是有效時間')
  }
  return {issues}
}

export function buildReleaseManifest({item, queue, h1, publication, readerPreviewSha256, audit, today}) {
  const authorizedAt = getItemAuthorization(queue, item).recordedAt
  return {
    schemaVersion: RELEASE_SCHEMA_VERSION,
    articleId: item.articleId,
    workingTitle: item.workingTitle,
    primaryKeyword: item.primaryKeyword,
    primaryQuery: item.primaryQuery,
    targetUrl: item.targetPath,
    primaryHub: item.primaryHubId,
    planning: {
      source: 'content-automation/article-queue.json',
      recordId: item.articleId,
      status: 'keep',
      publicationAuthorization: 'authorized',
      authorizedAt,
      topicDirection: item.topicDirection,
      pageRole: item.pageRole,
      contentBoundary: item.contentBoundary,
      primaryHubId: item.primaryHubId,
    },
    market: 'TW',
    searchLocale: 'zh-TW',
    status: 'approved',
    approvedAt: today,
    approval: {
      mode: 'standing-authorization',
      queue: 'content-automation/article-queue.json',
      authorizedAt,
      approvedAt: today,
      workflow: WORKFLOW,
    },
    h1,
    seoTitle: publication.seoTitle.trim(),
    seoDescription: publication.seoDescription.trim(),
    excerpt: publication.excerpt.trim(),
    review: {readerPreviewSha256, result: 'ready_for_user_preview', mechanical: audit.status},
    files: {
      research: 'reference-review.md',
      preview: 'reader-preview.md',
      review: 'review.md',
      factCheck: 'fact-check.json',
      headingReview: 'heading-review.json',
      publication: 'publication.json',
      audit: 'audit.json',
      sanitySync: 'sanity-sync.json',
      images: 'images/image-plan.json',
    },
  }
}

export function buildSanitySyncConfig({item, h1, publication, publishedAt}) {
  return {
    source: 'reader-preview.md',
    authorRef: item.authorId,
    primaryHubRef: item.primaryHubId,
    article: {
      _id: item.documentId,
      title: h1,
      slug: item.articleSlug,
      excerpt: publication.excerpt.trim(),
      publishedAt,
      updatedAt: publishedAt,
      seoTitle: publication.seoTitle.trim(),
      seoDescription: publication.seoDescription.trim(),
      relatedArticles: (item.relatedArticleIds ?? []).map((documentId) => ({_type: 'reference', _ref: documentId})),
      noindex: true,
      sponsored: false,
    },
  }
}

async function readJsonIfExists(filePath) {
  try {
    await access(filePath)
  } catch {
    return null
  }
  return JSON.parse(await readFile(filePath, 'utf8'))
}

export async function finalizeRelease({
  packetDirectory,
  queuePath = path.join(projectRoot, 'content-automation', 'article-queue.json'),
  sanityOutputDirectory,
  now = new Date(),
}) {
  const packetDir = path.resolve(packetDirectory)
  const articleId = path.basename(packetDir)
  const queue = await loadArticleQueue(queuePath, projectRoot)
  const item = findQueueItem(queue, articleId)
  if (!item) throw new Error(`文章不在自動發布清單內：${articleId}`)

  const existingManifest = await readJsonIfExists(path.join(packetDir, 'manifest.json'))
  if (existingManifest && existingManifest.schemaVersion !== RELEASE_SCHEMA_VERSION) {
    throw new Error(`content-production/${articleId}/ 已有舊格式的封包，不得覆寫；請停止並回報`)
  }

  const files = {}
  for (const fileName of ['reader-preview.md', 'reference-review.md', 'review.md', 'publication.json', 'fact-check.json', 'heading-review.json']) {
    try {
      files[fileName] = await readFile(path.join(packetDir, fileName))
    } catch {
      throw new Error(`封包缺少 ${fileName}`)
    }
  }
  const readerPreview = files['reader-preview.md'].toString('utf8')
  const readerPreviewSha256 = sha256(files['reader-preview.md'])
  const referenceReview = files['reference-review.md'].toString('utf8')
  let publication
  let factCheck
  try {
    publication = JSON.parse(files['publication.json'].toString('utf8'))
    factCheck = JSON.parse(files['fact-check.json'].toString('utf8'))
  } catch (error) {
    throw new Error(`publication.json 或 fact-check.json 不是有效 JSON：${error.message}`)
  }

  const issues = []
  const previewResult = inspectReaderPreview(readerPreview, item)
  issues.push(...previewResult.issues)
  issues.push(...inspectReview(files['review.md'].toString('utf8'), readerPreviewSha256).issues)
  issues.push(...inspectPublication(publication, {h1: previewResult.h1, referenceReview, articleId}).issues)

  const factResult = validateFactCheck(factCheck, readerPreviewSha256)
  issues.push(...factResult.errors.map((error) => `fact-check.json：${error}`))
  if ((factResult.blocking ?? []).length > 0) issues.push(`事實查核有擋路項目：${factResult.blocking.join('、')}`)

  const headingRun = runPython('heading_review.py', [packetDir, '--json'])
  if (headingRun.status !== 0) issues.push(`標題檢查未通過：${(headingRun.stdout || headingRun.stderr).slice(0, 300)}`)

  const imagePlan = await readJsonIfExists(path.join(packetDir, 'images', 'image-plan.json'))
  const imageReview = await readJsonIfExists(path.join(packetDir, 'images', 'image-review.json'))
  if (imagePlan && imageReview) {
    issues.push(...validateImageReview({plan: imagePlan, review: imageReview, factCheck}).map((error) => `image-review.json：${error}`))
  }

  const auditRun = runPython('audit_answer_first.py', [
    path.join(packetDir, 'reader-preview.md'),
    '--json',
    '--reference-review',
    path.join(packetDir, 'reference-review.md'),
  ])
  let audit
  try {
    audit = JSON.parse(auditRun.stdout)
  } catch {
    throw new Error(`格式檢查器輸出不是 JSON：${(auditRun.stdout || auditRun.stderr).slice(0, 200)}`)
  }
  if (audit.status !== 'mechanical_clear') {
    issues.push(`格式檢查為 ${audit.status}：${(audit.issues ?? []).map((issue) => `${issue.code ?? ''} ${issue.message ?? ''}`.trim()).join('；')}`)
  }

  if (issues.length > 0) throw new Error(`發布封包定稿失敗：\n- ${issues.join('\n- ')}`)

  const today = now.toISOString().slice(0, 10)
  const publishedAt = publication.publishedAt ? new Date(publication.publishedAt).toISOString() : now.toISOString()
  const manifest = buildReleaseManifest({item, queue, h1: previewResult.h1, publication, readerPreviewSha256, audit, today})
  const sanitySync = buildSanitySyncConfig({item, h1: previewResult.h1, publication, publishedAt})
  await writeFile(path.join(packetDir, 'audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8')
  await writeFile(path.join(packetDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  await writeFile(path.join(packetDir, 'sanity-sync.json'), `${JSON.stringify(sanitySync, null, 2)}\n`, 'utf8')

  const outputDirectory = path.resolve(sanityOutputDirectory ?? path.join(projectRoot, '.tmp', 'auto-publisher', articleId, 'sanity'))
  await mkdir(outputDirectory, {recursive: true})
  const prepareRun = spawnSync(process.execPath, [prepareSanityContentPath, path.join(packetDir, 'sanity-sync.json'), outputDirectory], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
  if (prepareRun.status !== 0) throw new Error(`Sanity 文件轉換失敗：${prepareRun.stderr || prepareRun.stdout}`)
  const articleJsonPath = path.join(outputDirectory, 'article.json')
  const article = JSON.parse(await readFile(articleJsonPath, 'utf8'))
  if (!article.body.some((block) => block.style === 'h2')) throw new Error('轉換後的 Sanity 正文沒有任何 H2 區塊')
  const leakedMarkup = article.body.find((block) =>
    (block.children ?? []).some((child) => /<!--|-->|<\/?[a-z][^>]*>/i.test(child.text ?? '')),
  )
  if (leakedMarkup) throw new Error('轉換後的 Sanity 正文含有 HTML 註解或標籤，會直接顯示給讀者')

  return {
    articleId,
    documentId: item.documentId,
    targetUrl: item.targetPath,
    h1: previewResult.h1,
    seoTitle: manifest.seoTitle,
    readerPreviewSha256,
    internalLinks: previewResult.internalLinks,
    manifestPath: path.join(packetDir, 'manifest.json'),
    sanityArticlePath: articleJsonPath,
    bodyCount: article.body.length,
    coverPlan: imagePlan ? (imagePlan.status === 'selected' ? 'selected' : `present:${imagePlan.status}`) : 'missing',
    status: 'release-packet-ready',
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  const argumentsList = process.argv.slice(2)
  const packetArgument = argumentsList.find((argument) => !argument.startsWith('--'))
  const optionValue = (name) => argumentsList.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3)
  if (!packetArgument) {
    console.error('用法：node scripts/finalize-release.mjs content-production/<article-id> [--sanity-output=<dir>] [--queue=<path>]')
    process.exit(1)
  }
  try {
    const result = await finalizeRelease({
      packetDirectory: packetArgument,
      queuePath: optionValue('queue') ? path.resolve(optionValue('queue')) : undefined,
      sanityOutputDirectory: optionValue('sanity-output'),
    })
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
