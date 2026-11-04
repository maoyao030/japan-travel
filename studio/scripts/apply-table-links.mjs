/**
 * 把連結清單（scripts/table-links.mjs 的 plan）套到已上線文章：
 * 只在現有的表格加「連結」列或欄，其他文字不動（線上版和 Git 稿件不一致的文章也能用）。
 * 同時把 Git 的 reader-preview.md 表格補上同樣的連結。有沒發布的草稿就跳過。
 * 先預覽，--apply 才寫入；寫入前存復原檔（用 apply-pending-link.mjs --rollback 回復正文）。
 *
 * 用法（在 studio/ 目錄）：
 *   npx sanity exec scripts/apply-table-links.mjs --with-user-token -- --plan=<plan.json> [--apply]
 */
import {createHash} from 'node:crypto'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {addLinksToBody, addLinksToMarkdown, linkCell} from '../../scripts/table-links.mjs'

const projectRoot = path.resolve(import.meta.dirname, '../..')
const options = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [key, ...value] = a.slice(2).split('=')
    return [key, value.length > 0 ? value.join('=') : true]
  }),
)
if (typeof options.plan !== 'string') throw new Error('必須提供 --plan')
const plan = JSON.parse(await readFile(path.resolve(projectRoot, options.plan), 'utf8'))
const slug = plan.article
const articleId = `article-${slug}`

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`
  return JSON.stringify(value)
}
const bodyHash = (body) => createHash('sha256').update(canonicalJson(body)).digest('hex')

const client = getCliClient({apiVersion: '2026-08-29'})
const [article, draft] = await Promise.all([
  client.fetch('*[_id == $id][0]{_id,_rev,body}', {id: articleId}),
  client.fetch('*[_id == $id][0]{_id}', {id: `drafts.${articleId}`}, {perspective: 'raw'}),
])
if (!article) throw new Error(`找不到文章：${articleId}`)
if (draft) throw new Error(`${articleId} 有沒發布的草稿，先不加連結`)

const {body, done, missing} = addLinksToBody(article.body, plan)

// Git 稿件：用線上表格的「日文名」與住宿名稱對應
const infoCells = (plan.infoBoxes ?? []).map((item) => {
  const table = article.body.find((block) => block._key === item.tableKey)
  return {ja: table?.rows.find((row) => row.cells[0] === '日文名')?.cells[1], cell: linkCell(item)}
})
const stayCells = new Map((plan.stayTables ?? []).flatMap((table) => Object.entries(table.rows).map(([name, entry]) => [name, linkCell(entry)])))
const previewFile = path.join(projectRoot, 'content-production', slug, 'reader-preview.md')
const markdown = await readFile(previewFile, 'utf8').catch(() => null)
const nextMarkdown = markdown === null ? null : addLinksToMarkdown(markdown, infoCells, stayCells)
const gitTables = markdown === null ? 0 : (nextMarkdown.match(/^\| 連結 \||\| 連結 \|$/gm) ?? []).length

console.log(JSON.stringify({mode: options.apply ? 'apply' : 'dry-run', articleId, done, missing, gitChanged: markdown !== nextMarkdown, gitLinkMarks: gitTables}, null, 2))
if (!options.apply) process.exit(0)
if (done.length === 0) {
  console.log('線上沒有要加的表格')
} else {
  const recoveryFile = path.join(projectRoot, '.tmp', 'auto-publisher', 'link-recovery', `${slug}-table-links-${Date.now()}.json`)
  await mkdir(path.dirname(recoveryFile), {recursive: true})
  await writeFile(recoveryFile, `${JSON.stringify({schemaVersion: 1, sourceDocumentId: articleId, beforeRevision: article._rev, beforeBody: article.body, beforeBodyHash: bodyHash(article.body), expectedAppliedBodyHash: bodyHash(body), createdAt: new Date().toISOString()}, null, 2)}\n`)
  await client.patch(articleId).ifRevisionId(article._rev).set({body}).commit({autoGenerateArrayKeys: false})
  const verified = await client.fetch('*[_id == $id][0]{body}', {id: articleId})
  if (bodyHash(verified.body) !== bodyHash(body)) throw new Error('寫入後的正文與預期不一致，請用 --rollback 回復')
  console.log(JSON.stringify({written: true, recoveryFile}, null, 2))
}
if (nextMarkdown !== null && nextMarkdown !== markdown) await writeFile(previewFile, nextMarkdown)
