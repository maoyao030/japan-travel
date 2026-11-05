/**
 * 標竿優化的第 0 步：把網站上的現行正文抓回 Git 當底稿（線上版為準）。
 * 原本的 reader-preview.md 存成 content-production/<文章>/benchmark/git-before-sync.md，
 * 抓回的版本另存 benchmark/live-<日期>.md，之後的檢查用它當「優化前」。
 * 有沒發布的草稿或還沒同步的後台修改就停下來（先用 pull:studio-edits 處理）。
 *
 * 用法：node scripts/sync-from-live.mjs --article=<文章> [--apply]
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

import {portableTextToMarkdown} from './portable-text-to-markdown.mjs'
import {keepGitSourceLines} from './studio-edits.mjs'
import {hasUnsyncedStudioEdits} from './studio-edit-guard.mjs'

const options = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
  const [key, ...value] = a.slice(2).split('=')
  return [key, value.length > 0 ? value.join('=') : true]
}))
if (typeof options.article !== 'string') throw new Error('必須提供 --article')
const slug = options.article.replace(/^article-/, '')
const root = path.resolve(import.meta.dirname, '..')
const packet = path.join(root, 'content-production', slug)

const query = `*[_id == "article-${slug}"][0]{_id, title, body, studioEditedAt, studioEditsSyncedAt, "hasDraft": defined(*[_id == "drafts.article-${slug}"][0]._id)}`
const url = new URL('https://e8ctf7ee.api.sanity.io/v2026-08-29/data/query/production')
url.searchParams.set('query', query)
const {result: doc} = await (await fetch(url)).json()
if (!doc) throw new Error(`網站上找不到 article-${slug}`)
if (doc.hasDraft) throw new Error('後台有沒發布的草稿，先用 pull:studio-edits --draft 處理')
if (hasUnsyncedStudioEdits(doc)) throw new Error('後台有還沒同步的手動修改，先用 pull:studio-edits 處理')

const gitMarkdown = await readFile(path.join(packet, 'reader-preview.md'), 'utf8').catch(() => null)
const liveMarkdown = keepGitSourceLines(gitMarkdown, portableTextToMarkdown(doc.title, doc.body))
const same = gitMarkdown === liveMarkdown
const day = new Date().toISOString().slice(0, 10)
console.log(JSON.stringify({article: doc._id, gitSameAsLive: same, mode: options.apply ? 'apply' : 'dry-run'}, null, 2))
if (!options.apply) process.exit(0)
await mkdir(path.join(packet, 'benchmark'), {recursive: true})
if (gitMarkdown !== null && !same) await writeFile(path.join(packet, 'benchmark', 'git-before-sync.md'), gitMarkdown)
await writeFile(path.join(packet, 'benchmark', `live-${day}.md`), liveMarkdown)
await writeFile(path.join(packet, 'reader-preview.md'), liveMarkdown)
console.log(`底稿：content-production/${slug}/benchmark/live-${day}.md`)
