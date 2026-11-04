/**
 * 把對照表的名字改寫套到 Git 的稿件與規劃檔（不動歷史快照：before-*、pre-rewrite、studio-edits）。
 * 用法：node scripts/rename-terms-git.mjs [--apply]
 */
import {readFile, readdir, writeFile} from 'node:fs/promises'
import path from 'node:path'

import {makeRenamer} from './rename-terms.mjs'

const root = path.resolve(import.meta.dirname, '..')
const apply = process.argv.includes('--apply')
const {renames} = JSON.parse(await readFile(path.join(root, 'content-planning/name-kanji-2026-11-04.json'), 'utf8'))
const rename = makeRenamer(renames)

const files = []
const PACKET_FILES = new Set(['reader-preview.md', 'draft-tagged.md', 'publication.json', 'manifest.json', 'link-sentences.json'])
for (const id of await readdir(path.join(root, 'content-production'))) {
  const dir = path.join(root, 'content-production', id)
  const names = await readdir(dir).catch(() => [])
  for (const name of names) if (PACKET_FILES.has(name)) files.push(path.join(dir, name))
}
async function walk(dir) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full)
    else if (/\.(json|md)$/.test(entry.name) && !entry.name.startsWith('name-kanji-')) files.push(full)
  }
}
await walk(path.join(root, 'content-planning'))
files.push(path.join(root, '.agents/skills/japan-travel-answer-first/references/examples.md'))

let changed = 0
const report = []
for (const file of files) {
  const text = await readFile(file, 'utf8')
  let next
  if (file.endsWith('glossary.json')) {
    // 詞庫的日文原名與來源不動，其他欄位照改，並記下舊寫法。
    const glossary = JSON.parse(text)
    for (const term of glossary.terms) {
      const zh = rename(term.zh)
      if (zh !== term.zh) {
        term.previousZh = term.zh
        term.zh = zh
        term.note = `${rename(term.note ?? '')}；2026-11-04 改成漢字或台灣慣用譯名（content-planning/name-kanji-2026-11-04.json）`
      }
    }
    next = `${JSON.stringify(glossary, null, 2)}\n`
  } else {
    next = rename(text)
  }
  if (next !== text) {
    changed += 1
    report.push(path.relative(root, file))
    if (apply) await writeFile(file, next)
  }
}
console.log(JSON.stringify({mode: apply ? 'apply' : 'dry-run', changedFiles: changed, files: report}, null, 2))
