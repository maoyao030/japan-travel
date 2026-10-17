/**
 * 補一個待補內連：在來源文章正文把錨文字加上連結，可見文字不變。先 dry-run，再加 --apply。
 * 寫入前把原本的正文存成復原檔；寫入後網站 CI 失敗時用 --rollback 回復。
 * 移植自好材誌 apply-contextual-link-backfill.mjs，候選改由 D1 pending_links 提供（ops-links.mjs ready）。
 *
 * 用法（在 studio/ 目錄）：
 *   npx sanity exec scripts/apply-pending-link.mjs --with-user-token -- --source=<article-id> --target=<article-id> --target-path=<網址> --anchor=<錨文字> [--sentence=<連結句>] [--apply]
 *   npx sanity exec scripts/apply-pending-link.mjs --with-user-token -- --rollback=<apply 輸出的 recoveryFile>
 * 同一篇文章補了好幾個連結又要回復時，從最後補的那一個開始依序回復（每次回復都會核對目前正文）。
 */
import {createHash} from 'node:crypto'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {addLinkToPortableText} from '../../scripts/link-backfill.mjs'

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

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
const bodyHash = (body) => createHash('sha256').update(canonicalJson(body)).digest('hex')
const articleId = (value) => (value.startsWith('article-') ? value : `article-${value}`)

const client = getCliClient({apiVersion: '2026-08-29'})

if (typeof options.rollback === 'string') {
  // 復原檔路徑可以是絕對路徑（apply 輸出的就是），或相對於專案根目錄。
  const recoveryPath = path.isAbsolute(options.rollback) ? options.rollback : path.resolve(projectRoot, options.rollback)
  const recovery = JSON.parse(await readFile(recoveryPath, 'utf8'))
  const current = await client.fetch(`{"article": *[_id == $id][0]{_id,_rev,body}, "draft": *[_id == $draftId][0]{_id}}`, {
    id: recovery.sourceDocumentId,
    draftId: `drafts.${recovery.sourceDocumentId}`,
  })
  if (current.draft) throw new Error('來源文章目前有草稿，拒絕自動回復')
  if (bodyHash(current.article?.body) !== recovery.expectedAppliedBodyHash) {
    throw new Error('來源文章在補連結後又有其他變更，拒絕用舊復原檔覆寫')
  }
  await client.patch(recovery.sourceDocumentId).ifRevisionId(current.article._rev).set({body: recovery.beforeBody}).commit({autoGenerateArrayKeys: false})
  const restored = await client.fetch('*[_id == $id][0]{_rev, body}', {id: recovery.sourceDocumentId})
  if (bodyHash(restored?.body) !== recovery.beforeBodyHash) throw new Error('回復後的正文驗證失敗')
  console.log(JSON.stringify({status: 'rolled-back', sourceDocumentId: recovery.sourceDocumentId, revision: restored._rev}, null, 2))
  process.exit(0)
}

for (const name of ['source', 'target', 'target-path', 'anchor']) {
  if (typeof options[name] !== 'string' || options[name] === '') throw new Error(`必須提供 --${name}`)
}
const sourceId = articleId(options.source)
const targetId = articleId(options.target)
const snapshot = await client.fetch('*[_id in $ids]{_id,_rev,_type,noindex,body}', {
  ids: [sourceId, targetId, `drafts.${sourceId}`, `drafts.${targetId}`],
})
const byId = new Map(snapshot.map((document) => [document._id, document]))
if (byId.has(`drafts.${sourceId}`) || byId.has(`drafts.${targetId}`)) throw new Error('來源或目標文章有未發布草稿，拒絕自動補連結')
const source = byId.get(sourceId)
const target = byId.get(targetId)
if (source?._type !== 'article' || source.noindex !== false) throw new Error('來源文章尚未開放索引')
if (target?._type !== 'article' || target.noindex !== false) throw new Error('目標文章尚未開放索引')

const update = addLinkToPortableText(source.body, {
  sourceArticleId: options.source,
  targetPath: options['target-path'],
  anchorText: options.anchor,
  sentence: typeof options.sentence === 'string' ? options.sentence : undefined,
})
const result = {
  mode: options.apply ? 'apply' : 'dry-run',
  sourceDocumentId: sourceId,
  sourceRevision: source._rev,
  targetDocumentId: targetId,
  targetPath: options['target-path'],
  blockKey: update.blockKey,
  anchorText: options.anchor,
  linkMarkKey: update.linkMarkKey,
}
if (!options.apply) {
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

// 每個連結一個復原檔（同一段落補兩個連結也不會互相覆蓋）。同一篇補了多個連結時，回復要從最後補的那個開始。
const recoveryFile = path.join(projectRoot, '.tmp', 'auto-publisher', 'link-recovery', `${options.source}-${update.linkMarkKey}.json`)
const recovery = {
  schemaVersion: 1,
  sourceDocumentId: sourceId,
  targetPath: options['target-path'],
  beforeRevision: source._rev,
  beforeBody: source.body,
  beforeBodyHash: bodyHash(source.body),
  expectedAppliedBodyHash: bodyHash(update.body),
  createdAt: new Date().toISOString(),
}
await mkdir(path.dirname(recoveryFile), {recursive: true})
await writeFile(recoveryFile, `${JSON.stringify(recovery, null, 2)}\n`)
await client.patch(sourceId).ifRevisionId(source._rev).set({body: update.body}).commit({autoGenerateArrayKeys: false})

const verified = await client.fetch('*[_id == $id][0]{_rev, body}', {id: sourceId})
if (bodyHash(verified?.body) !== recovery.expectedAppliedBodyHash) throw new Error('寫入後的正文與預期不一致，請用 --rollback 回復')
console.log(JSON.stringify({...result, verifiedRevision: verified._rev, recoveryFile}, null, 2))
