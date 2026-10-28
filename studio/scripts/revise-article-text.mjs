/**
 * 已上線文章的文字修訂：比對修改前後的 reader-preview.md，只改有變的字，連結、文內照片、索引狀態與相關文章都不動。
 * 標題、SEO 描述與摘要：線上的值等於修改前的 publication.json 時，才換成新的 publication.json。
 * 先 dry-run，再加 --apply。寫入前把原本的正文存成復原檔，用 apply-pending-link.mjs --rollback=<復原檔> 回復正文。
 *
 * 用法（在 studio/ 目錄）：
 *   npx sanity exec scripts/revise-article-text.mjs --with-user-token -- --article=<article-id> --before=<修改前 reader-preview.md> [--before-publication=<修改前 publication.json>] [--apply]
 * 修改後的稿子讀 content-production/<article-id>/reader-preview.md 與 publication.json。
 */
import {createHash} from 'node:crypto'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {reviseBodyText} from '../../scripts/revise-body-text.mjs'

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
if (typeof options.before !== 'string') throw new Error('必須提供 --before')
const slug = options.article.replace(/^article-/, '')
const articleId = `article-${slug}`
const resolve = (file) => (path.isAbsolute(file) ? file : path.resolve(projectRoot, file))
const packetDir = path.join(projectRoot, 'content-production', slug)
const beforeMarkdown = await readFile(resolve(options.before), 'utf8')
const afterMarkdown = await readFile(path.join(packetDir, 'reader-preview.md'), 'utf8')
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

const client = getCliClient({apiVersion: '2026-08-29'})
const [article, draft] = await Promise.all([
  client.fetch('*[_id == $id][0]{_id,_rev,_type,body,title,seoTitle,seoDescription,excerpt}', {id: articleId}),
  client.fetch('*[_id == $id][0]{_id}', {id: `drafts.${articleId}`}),
])
if (article?._type !== 'article') throw new Error(`找不到文章：${articleId}`)
if (draft) throw new Error('文章有未發布草稿，拒絕自動修改')

const {body, changes, unmatched} = reviseBodyText(article.body, beforeMarkdown, afterMarkdown)
const fields = {}
const fieldsSkipped = []
if (beforePublication) {
  for (const field of FIELDS) {
    const h1 = (markdown) => markdown.match(/^# (.+)$/m)?.[1].trim()
    const oldValue = field === 'title' ? h1(beforeMarkdown) : beforePublication[field]
    const newValue = field === 'title' ? h1(afterMarkdown) : afterPublication[field]
    if (!newValue || newValue === article[field]) continue
    if (article[field] !== oldValue) {
      fieldsSkipped.push({field, reason: '線上的值和修改前的 publication.json 不同'})
      continue
    }
    fields[field] = newValue
  }
}
const result = {
  mode: options.apply ? 'apply' : 'dry-run',
  articleId,
  revision: article._rev,
  changedBlocks: changes.length,
  linkTextChanged: changes.filter((change) => change.linkTextChanged).map((change) => change.after),
  unmatched,
  fields,
  fieldsSkipped,
  changes,
}
if (unmatched.length > 0) {
  console.log(JSON.stringify(result, null, 2))
  throw new Error(`有 ${unmatched.length} 段在 Sanity 找不到唯一對應，沒有寫入`)
}
if (!options.apply || (changes.length === 0 && Object.keys(fields).length === 0)) {
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

const recoveryFile = path.join(projectRoot, '.tmp', 'auto-publisher', 'link-recovery', `${slug}-revise-${Date.now()}.json`)
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
console.log(JSON.stringify({...result, changes: undefined, verifiedRevision: verified._rev, recoveryFile}, null, 2))
