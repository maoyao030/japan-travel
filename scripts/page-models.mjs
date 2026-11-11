/**
 * 頁型範本（Darren 2026-11-11）：每種頁型先有 Darren 親自改到滿意的整篇範本，作者寫作前讀同頁型的範本。
 * 範本與登記檔在 .agents/skills/japan-travel-answer-first/references/page-models/，說明見那裡的 README.md。
 *
 * 用法：
 *   node scripts/page-models.mjs                      每種頁型有幾篇範本、還缺哪些、清單裡還沒寫的文章各等哪種範本
 *   node scripts/page-models.mjs --for=<articleId>    這篇文章該讀哪幾篇範本（JSON；ready 是 false 表示這種頁型還沒有範本）
 *   node scripts/page-models.mjs --check              檢查登記檔與範本檔（有問題結束碼 1）
 *   node scripts/page-models.mjs --add=<articleId> --approved-at=<YYYY-MM-DD> --how="…" --learn="…" [--replace=<舊 articleId>]
 *       把 content-production/<articleId>/reader-preview.md 存成範本。只有 Darren 親口說可以當範本才跑；
 *       先用 sync-from-live.mjs 確認 Git 稿件和線上一樣。
 */
import {copyFile, mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

const root = path.resolve(import.meta.dirname, '..')
export const MODELS_DIR = path.join(root, '.agents', 'skills', 'japan-travel-answer-first', 'references', 'page-models')
const INDEX_PATH = path.join(MODELS_DIR, 'index.json')
const QUEUE_PATH = path.join(root, 'content-automation', 'article-queue.json')

const ASPECT_KINDS = ['transport', 'stay', 'food', 'weather', 'festival', 'hiking']

/** 文章清單的一列屬於哪種頁型。景點分兩種：一個地點的景點總覽（網址結尾 sights），與單一景點自己一頁。 */
export function kindOf(article) {
  if (article.pageType === 'place-entry') return 'place-entry'
  if (article.pageType === 'cross-place-page') return 'cross-place'
  if (ASPECT_KINDS.includes(article.aspect)) return article.aspect
  if (article.aspect === 'sight') return article.articleSlug === 'sights' ? 'sights' : 'sight-single'
  return null
}

export function modelsFor(index, article) {
  const kindId = kindOf(article)
  const kind = index.kinds.find((entry) => entry.id === kindId)
  if (!kind) return {articleId: article.articleId, kind: kindId, label: null, ready: false, models: []}
  return {
    articleId: article.articleId,
    kind: kind.id,
    label: kind.label,
    ready: kind.models.length > 0,
    models: kind.models.map((model) => ({
      articleId: model.articleId,
      file: path.posix.join('.agents/skills/japan-travel-answer-first/references/page-models', model.file),
      learn: model.learn,
    })),
  }
}

/** 登記檔的問題清單；空陣列表示沒問題。fileExists 可換掉方便測試。 */
export function validateIndex(index, {fileExists = (file) => existsSync(path.join(MODELS_DIR, file))} = {}) {
  const problems = []
  const max = index.maxModelsPerKind
  if (!Number.isInteger(max) || max < 1) problems.push('maxModelsPerKind 要是正整數')
  const seenKinds = new Set()
  const seenArticles = new Set()
  for (const kind of index.kinds ?? []) {
    if (seenKinds.has(kind.id)) problems.push(`頁型重複：${kind.id}`)
    seenKinds.add(kind.id)
    if (!kind.label) problems.push(`${kind.id} 缺 label`)
    if (kind.models.length > max) problems.push(`${kind.id} 有 ${kind.models.length} 篇範本，最多 ${max} 篇`)
    for (const model of kind.models) {
      const where = `${kind.id}/${model.articleId}`
      if (seenArticles.has(model.articleId)) problems.push(`${where} 重複登記`)
      seenArticles.add(model.articleId)
      if (model.approvedBy !== 'Darren') problems.push(`${where} 的 approvedBy 要是 Darren（只有他親口認可的才算範本）`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(model.approvedAt ?? '')) problems.push(`${where} 缺 approvedAt（YYYY-MM-DD）`)
      if (!model.how) problems.push(`${where} 缺 how（Darren 怎麼認可的）`)
      if (!model.learn || model.learn.length < 20) problems.push(`${where} 缺 learn（這篇該學什麼，至少一句話）`)
      if (model.file !== `${kind.id}/${model.articleId}.md`) problems.push(`${where} 的 file 要是 ${kind.id}/${model.articleId}.md`)
      else if (!fileExists(model.file)) problems.push(`${where} 找不到範本檔 ${model.file}`)
    }
    for (const candidate of kind.candidates ?? []) {
      if (!candidate.articleId || !candidate.why) problems.push(`${kind.id} 的候選要有 articleId 與 why`)
    }
  }
  for (const id of ['place-entry', 'cross-place', 'sights', 'sight-single', ...ASPECT_KINDS]) {
    if (!seenKinds.has(id)) problems.push(`缺頁型：${id}`)
  }
  return problems
}

/** 回傳加了範本之後的登記檔（不改原物件）。已滿而且沒指定 replace 就丟錯。 */
export function addModel(index, article, {approvedAt, how, learn, replace} = {}) {
  const kindId = kindOf(article)
  const next = structuredClone(index)
  const kind = next.kinds.find((entry) => entry.id === kindId)
  if (!kind) throw new Error(`${article.articleId} 對不到頁型`)
  let removed = null
  kind.models = kind.models.filter((model) => model.articleId !== article.articleId)
  if (replace) {
    removed = kind.models.find((model) => model.articleId === replace) ?? null
    if (!removed) throw new Error(`${kind.label} 的範本裡沒有 ${replace}`)
    kind.models = kind.models.filter((model) => model.articleId !== replace)
  }
  if (kind.models.length >= next.maxModelsPerKind) {
    throw new Error(`${kind.label} 已經有 ${kind.models.length} 篇範本（${kind.models.map((m) => m.articleId).join('、')}），要換掉哪一篇請加 --replace=<articleId>`)
  }
  kind.models.push({
    articleId: article.articleId,
    file: `${kind.id}/${article.articleId}.md`,
    approvedBy: 'Darren',
    approvedAt,
    how,
    learn,
  })
  kind.candidates = (kind.candidates ?? []).filter((candidate) => candidate.articleId !== article.articleId)
  return {index: next, kind, removed}
}

export async function loadIndex() {
  return JSON.parse(await readFile(INDEX_PATH, 'utf8'))
}

export async function loadQueueArticles() {
  const queue = JSON.parse(await readFile(QUEUE_PATH, 'utf8'))
  const articles = queue.batches.flatMap((batch) => batch.items ?? [])
  return {queue, articles}
}

function statusReport(index, queue, articles) {
  const lines = ['頁型範本（Darren 親自改到滿意的整篇文章）', '']
  for (const kind of index.kinds) {
    const models = kind.models.map((model) => `${model.articleId}（${model.approvedAt}）`).join('、') || '還沒有'
    const candidates = (kind.candidates ?? []).map((candidate) => candidate.articleId).join('、')
    lines.push(`- ${kind.label}：${models}${candidates ? `｜候選：${candidates}` : ''}`)
  }
  const byId = new Map(articles.map((article) => [article.articleId, article]))
  const waiting = new Map()
  for (const group of queue.travelGroups ?? []) {
    for (const id of group.writingOrder ?? []) {
      const article = byId.get(id)
      if (!article || existsSync(path.join(root, 'content-production', id, 'review.md'))) continue
      const info = modelsFor(index, article)
      if (info.ready) continue
      const key = info.label ?? '對不到頁型'
      waiting.set(key, [...(waiting.get(key) ?? []), id])
    }
  }
  lines.push('', '清單裡還沒寫、在等範本的文章：')
  if (waiting.size === 0) lines.push('- 沒有')
  for (const [label, ids] of waiting) lines.push(`- ${label}（${ids.length} 篇）：${ids.join('、')}`)
  return lines.join('\n')
}

async function main() {
  const options = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [key, ...value] = a.slice(2).split('=')
    return [key, value.length > 0 ? value.join('=') : true]
  }))
  const index = await loadIndex()
  const {queue, articles} = await loadQueueArticles()
  const find = (id) => {
    const slug = String(id).replace(/^article-/, '')
    const article = articles.find((entry) => entry.articleId === slug)
    if (!article) throw new Error(`文章清單裡找不到 ${slug}`)
    return article
  }

  if (options.check) {
    const problems = validateIndex(index)
    console.log(JSON.stringify({ok: problems.length === 0, problems}, null, 2))
    process.exit(problems.length === 0 ? 0 : 1)
  }
  if (typeof options.for === 'string') {
    console.log(JSON.stringify(modelsFor(index, find(options.for)), null, 2))
    return
  }
  if (typeof options.add === 'string') {
    const article = find(options.add)
    for (const key of ['approved-at', 'how', 'learn']) {
      if (typeof options[key] !== 'string') throw new Error(`必須提供 --${key}`)
    }
    const source = path.join(root, 'content-production', article.articleId, 'reader-preview.md')
    if (!existsSync(source)) throw new Error(`找不到 ${source}`)
    const {index: next, kind, removed} = addModel(index, article, {
      approvedAt: options['approved-at'],
      how: options.how,
      learn: options.learn,
      replace: typeof options.replace === 'string' ? options.replace.replace(/^article-/, '') : undefined,
    })
    const target = path.join(MODELS_DIR, kind.id, `${article.articleId}.md`)
    await mkdir(path.dirname(target), {recursive: true})
    await copyFile(source, target)
    if (removed) await rm(path.join(MODELS_DIR, removed.file), {force: true})
    const problems = validateIndex(next)
    if (problems.length > 0) throw new Error(`登記檔有問題：${problems.join('；')}`)
    await writeFile(INDEX_PATH, `${JSON.stringify(next, null, 2)}\n`)
    console.log(`已把 ${article.articleId} 存成「${kind.label}」的範本${removed ? `，換掉 ${removed.articleId}` : ''}。`)
    return
  }
  console.log(statusReport(index, queue, articles))
}

// Windows 的 argv[1] 是 C:\\... 路徑，要先轉成 file:// 才對得上 import.meta.url
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main()
}
