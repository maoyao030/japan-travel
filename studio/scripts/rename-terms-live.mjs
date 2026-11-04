/**
 * 把名字改寫（content-planning/name-kanji-2026-11-04.json）直接套到網站上的文章與主題中心：
 * 只改文字欄位（正文、表格、圖說、標題、摘要），網址、連結目標、slug、圖片不動。
 * 有沒發布的草稿就跳過（不然草稿發布時會蓋回舊寫法），列在結果裡。
 * 先預覽，加 --apply 才寫入；寫入前把每篇原本的內容存成復原檔。
 *
 * 用法（在 studio/ 目錄）：npx sanity exec scripts/rename-terms-live.mjs --with-user-token -- [--apply]
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {makeRenamer} from '../../scripts/rename-terms.mjs'

const projectRoot = path.resolve(import.meta.dirname, '../..')
const apply = process.argv.includes('--apply')
const {renames} = JSON.parse(await readFile(path.join(projectRoot, 'content-planning/name-kanji-2026-11-04.json'), 'utf8'))
const rename = makeRenamer(renames)
const SKIP_KEYS = new Set(['_id', '_type', '_key', '_ref', '_rev', '_createdAt', '_updatedAt', 'href', 'url', 'slug', 'current', 'asset', 'targetPath', 'embedUrl'])

function renameDeep(value) {
  if (typeof value === 'string') return rename(value)
  if (Array.isArray(value)) return value.map(renameDeep)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, SKIP_KEYS.has(key) ? inner : renameDeep(inner)]))
  }
  return value
}

const client = getCliClient({apiVersion: '2026-08-29'})
const docs = await client.fetch('*[_type in ["article", "hub"] && !(_id in path("drafts.**"))]{..., "hasDraft": defined(*[_id == "drafts." + ^._id][0]._id)}')
const changes = []
const skipped = []
for (const doc of docs) {
  const {hasDraft, ...original} = doc
  const fields = {}
  for (const [key, value] of Object.entries(original)) {
    if (SKIP_KEYS.has(key) || key.startsWith('_')) continue
    const next = renameDeep(value)
    if (JSON.stringify(next) !== JSON.stringify(value)) fields[key] = next
  }
  if (Object.keys(fields).length === 0) continue
  if (hasDraft) {
    skipped.push({id: doc._id, reason: '有沒發布的草稿'})
    continue
  }
  const before = JSON.stringify(Object.fromEntries(Object.keys(fields).map((key) => [key, original[key]])))
  const after = JSON.stringify(fields)
  const pairs = renames.filter((r) => before.includes(r.from)).map((r) => `${r.from}→${r.to}`)
  changes.push({id: doc._id, rev: doc._rev, fields, original, names: pairs})
}

console.log(JSON.stringify({mode: apply ? 'apply' : 'dry-run', documents: changes.map((c) => ({id: c.id, fields: Object.keys(c.fields), names: c.names})), skipped}, null, 2))
if (!apply) process.exit(0)

const recoveryDir = path.join(projectRoot, '.tmp', 'rename-terms', String(Date.now()))
await mkdir(recoveryDir, {recursive: true})
for (const change of changes) {
  await writeFile(
    path.join(recoveryDir, `${change.id}.json`),
    `${JSON.stringify({id: change.id, rev: change.rev, before: Object.fromEntries(Object.keys(change.fields).map((key) => [key, change.original[key]]))}, null, 2)}\n`,
  )
  await client.patch(change.id).ifRevisionId(change.rev).set(change.fields).commit({autoGenerateArrayKeys: false})
}
console.log(JSON.stringify({written: changes.length, recoveryDir}, null, 2))
