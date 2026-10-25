/**
 * 已上線文章的事實更正：只替換正文裡指定的段落，其他段落、欄位、索引狀態與相關文章都不動。
 * （publish-prepared-article.mjs --update-existing 會把文章改回 noindex、清掉相關文章，所以不用它。）
 * 先 dry-run，再加 --apply。寫入前把原本的正文存成復原檔，用 apply-pending-link.mjs --rollback=<復原檔> 回復。
 *
 * replacements 檔是 JSON 陣列 [{"old": "舊段落", "new": "新段落"}]，段落用 draft-tagged.md 的寫法（事實編號會自動拿掉）。
 *
 * 用法（在 studio/ 目錄）：
 *   npx sanity exec scripts/replace-article-paragraphs.mjs --with-user-token -- --article=<article-id> --replacements=<json 檔> [--apply]
 */
import {createHash} from 'node:crypto'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {replaceParagraphs} from '../../scripts/replace-paragraphs.mjs'

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
if (typeof options.replacements !== 'string') throw new Error('必須提供 --replacements')
const articleId = options.article.startsWith('article-') ? options.article : `article-${options.article}`
const replacementsPath = path.isAbsolute(options.replacements) ? options.replacements : path.resolve(projectRoot, options.replacements)
const replacements = JSON.parse(await readFile(replacementsPath, 'utf8'))

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
  client.fetch('*[_id == $id][0]{_id,_rev,_type,body}', {id: articleId}),
  client.fetch('*[_id == $id][0]{_id}', {id: `drafts.${articleId}`}),
])
if (article?._type !== 'article') throw new Error(`找不到文章：${articleId}`)
if (draft) throw new Error('文章有未發布草稿，拒絕自動修改')

const {body, changed} = replaceParagraphs(article.body, replacements)
const result = {mode: options.apply ? 'apply' : 'dry-run', articleId, revision: article._rev, changedBlocks: changed}
if (!options.apply) {
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

const recoveryFile = path.join(projectRoot, '.tmp', 'auto-publisher', 'link-recovery', `${options.article}-replace-${Date.now()}.json`)
const recovery = {
  schemaVersion: 1,
  sourceDocumentId: articleId,
  beforeRevision: article._rev,
  beforeBody: article.body,
  beforeBodyHash: bodyHash(article.body),
  expectedAppliedBodyHash: bodyHash(body),
  createdAt: new Date().toISOString(),
}
await mkdir(path.dirname(recoveryFile), {recursive: true})
await writeFile(recoveryFile, `${JSON.stringify(recovery, null, 2)}\n`)
await client.patch(articleId).ifRevisionId(article._rev).set({body}).commit({autoGenerateArrayKeys: false})

const verified = await client.fetch('*[_id == $id][0]{_rev, body}', {id: articleId})
if (bodyHash(verified?.body) !== recovery.expectedAppliedBodyHash) throw new Error('寫入後的正文與預期不一致，請用 --rollback 回復')
console.log(JSON.stringify({...result, verifiedRevision: verified._rev, recoveryFile}, null, 2))
