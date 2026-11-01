/**
 * 已上線文章整篇換正文：用 content-production/<id>/reader-preview.md 重建正文，
 * 線上的文內照片、嵌入與站內連結搬過來（scripts/replace-body.mjs）；索引狀態、封面、相關文章都不動。
 * 只改字、段落數不變的修訂用 revise-article-text.mjs。
 * 標題、SEO 描述與摘要：線上的值等於修改前的 publication.json 時，才換成新的 publication.json。
 * 先 dry-run，再加 --apply。有搬不過去的照片、嵌入或連結就不寫入。
 * 寫入前把原本的正文存成復原檔，用 apply-pending-link.mjs --rollback=<復原檔> 回復正文。
 *
 * 用法（在 studio/ 目錄）：
 *   npx sanity exec scripts/replace-article-body.mjs --with-user-token -- --article=<article-id> [--before-publication=<修改前 publication.json>] [--apply]
 */
import {createHash} from 'node:crypto'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {rebuildBody} from '../../scripts/replace-body.mjs'

const projectRoot = path.resolve(import.meta.dirname, '../..')
const options = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((argument) => argument.startsWith('--'))
    .map((argument) => {
      const [key, ...value] = argument.slice(2).split('=')
      return [key, value.length > 0 ? value.join('=') : true]
    }),
)
if (typeof options.article !== 'string') throw new Error('必須提供 --article')
const slug = options.article.replace(/^article-/, '')
const articleId = `article-${slug}`
const resolve = (file) => (path.isAbsolute(file) ? file : path.resolve(projectRoot, file))
const packetDir = path.join(projectRoot, 'content-production', slug)
const markdown = await readFile(path.join(packetDir, 'reader-preview.md'), 'utf8')
const FIELDS = ['title', 'seoTitle', 'seoDescription', 'excerpt']
const beforePublication = typeof options['before-publication'] === 'string' ? JSON.parse(await readFile(resolve(options['before-publication']), 'utf8')) : null
const afterPublication = JSON.parse(await readFile(path.join(packetDir, 'publication.json'), 'utf8'))

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
const bodyHash = (body) => createHash('sha256').update(canonicalJson(body)).digest('hex')
const externalHrefs = (body) =>
  new Set((body ?? []).flatMap((block) => (block.markDefs ?? []).filter((definition) => /^https?:/.test(definition.href ?? '')).map((definition) => definition.href)))

const client = getCliClient({apiVersion: '2026-08-29'})
const [article, draft] = await Promise.all([
  client.fetch('*[_id == $id][0]{_id,_rev,_type,body,title,seoTitle,seoDescription,excerpt}', {id: articleId}),
  client.fetch('*[_id == $id][0]{_id}', {id: `drafts.${articleId}`}),
])
if (article?._type !== 'article') throw new Error(`找不到文章：${articleId}`)
if (draft) throw new Error('文章有未發布草稿，拒絕自動修改')

const h1 = markdown.match(/^# (.+)$/m)?.[1].trim()
if (h1 !== article.title) throw new Error(`H1 和線上標題不同，這支程式不改標題：\n新稿：${h1}\n線上：${article.title}`)

const {body, carried, notCarried} = rebuildBody(article.body, markdown, {articleId: slug})
const liveExternal = externalHrefs(article.body)
const newExternal = externalHrefs(body)
const externalDropped = [...liveExternal].filter((href) => !newExternal.has(href))
const externalAdded = [...newExternal].filter((href) => !liveExternal.has(href))

const fields = {}
const fieldsSkipped = []
if (beforePublication) {
  for (const field of FIELDS.filter((name) => name !== 'title')) {
    const newValue = afterPublication[field]
    if (!newValue || newValue === article[field]) continue
    if (article[field] !== beforePublication[field]) {
      fieldsSkipped.push({field, reason: '線上的值和修改前的 publication.json 不同', live: article[field]})
      continue
    }
    fields[field] = newValue
  }
}

const result = {
  mode: options.apply ? 'apply' : 'dry-run',
  articleId,
  revision: article._rev,
  blocks: {before: article.body.length, after: body.length},
  carried,
  notCarried,
  externalDropped,
  externalAdded,
  fields,
  fieldsSkipped,
}
console.log(JSON.stringify(result, null, 2))
if (notCarried.length > 0) throw new Error(`有 ${notCarried.length} 個照片、嵌入或連結搬不過去，沒有寫入`)
if (!options.apply) process.exit(0)

const recoveryFile = path.join(projectRoot, '.tmp', 'auto-publisher', 'link-recovery', `${slug}-replace-${Date.now()}.json`)
const recovery = {
  schemaVersion: 1,
  sourceDocumentId: articleId,
  beforeRevision: article._rev,
  beforeBody: article.body,
  beforeBodyHash: bodyHash(article.body),
  beforeFields: Object.fromEntries(Object.keys(fields).map((field) => [field, article[field]])),
  expectedAppliedBodyHash: bodyHash(body),
  createdAt: new Date().toISOString(),
}
await mkdir(path.dirname(recoveryFile), {recursive: true})
await writeFile(recoveryFile, `${JSON.stringify(recovery, null, 2)}\n`)
await client.patch(articleId).ifRevisionId(article._rev).set({body, ...fields}).commit({autoGenerateArrayKeys: false})

const verified = await client.fetch('*[_id == $id][0]{_rev, body}', {id: articleId})
if (bodyHash(verified?.body) !== recovery.expectedAppliedBodyHash) throw new Error('寫入後的正文與預期不一致，請用 --rollback 回復')
console.log(JSON.stringify({verifiedRevision: verified._rev, recoveryFile}, null, 2))
