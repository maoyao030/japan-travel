/**
 * 把已上線文章正文裡的裸網址改成連結（延伸資料的「**名稱**，用途。https://…」變成名稱可點、網址不顯示）。
 * 只改含裸網址、而且沒有其他連結的段落；其他段落與欄位不動。先 dry-run，再加 --apply。
 * 寫入前把原本的正文存成復原檔，用 apply-pending-link.mjs --rollback=<復原檔> 回復。
 *
 * 用法（在 studio/ 目錄）：
 *   npx sanity exec scripts/link-bare-urls.mjs --with-user-token -- --article=<article-id> [--apply]
 */
import {createHash} from 'node:crypto'
import {mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {parseMarkdownBody} from '../../scripts/markdown-to-portable-text.mjs'

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
const articleId = options.article.startsWith('article-') ? options.article : `article-${options.article}`

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
const bodyHash = (body) => createHash('sha256').update(canonicalJson(body)).digest('hex')

/** 段落只有一般文字與粗體時，還原成 Markdown 再重新轉換；有其他標記的不碰。 */
function relinkBlock(block) {
  if (block?._type !== 'block' || (block.markDefs ?? []).length > 0) return null
  const spans = block.children ?? []
  if (spans.some((span) => span._type !== 'span' || span.marks.some((mark) => mark !== 'strong'))) return null
  const markdown = spans.map((span) => (span.marks.includes('strong') ? `**${span.text}**` : span.text)).join('')
  if (!/https?:\/\//.test(markdown)) return null
  const [parsed] = parseMarkdownBody(`# x\n\n${markdown}`).blocks
  const prefix = block._key
  return {
    ...block,
    children: parsed.children.map((child) => ({...child, _key: `${prefix}${child._key}`, marks: child.marks.map((mark) => (mark === 'strong' ? mark : `${prefix}${mark}`))})),
    markDefs: parsed.markDefs.map((mark) => ({...mark, _key: `${prefix}${mark._key}`})),
  }
}

const client = getCliClient({apiVersion: '2026-08-29'})
const [article, draft] = await Promise.all([
  client.fetch('*[_id == $id][0]{_id,_rev,_type,body}', {id: articleId}),
  client.fetch('*[_id == $id][0]{_id}', {id: `drafts.${articleId}`}),
])
if (article?._type !== 'article') throw new Error(`找不到文章：${articleId}`)
if (draft) throw new Error('文章有未發布草稿，拒絕自動修改')

const changed = []
const body = article.body.map((block) => {
  const updated = relinkBlock(block)
  if (!updated) return block
  changed.push({blockKey: block._key, text: updated.children.map((child) => child.text).join(''), hrefs: updated.markDefs.map((mark) => mark.href)})
  return updated
})

const result = {mode: options.apply ? 'apply' : 'dry-run', articleId, revision: article._rev, changedBlocks: changed}
if (!options.apply || changed.length === 0) {
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

const recoveryFile = path.join(projectRoot, '.tmp', 'auto-publisher', 'link-recovery', `${options.article}-bare-urls-${Date.now()}.json`)
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
