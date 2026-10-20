/**
 * 防抄襲檢查：潤稿時參考了別人的文章（好運日本行、MATCHA），確認正文沒有照抄。
 * 找出正文與參考文章之間連續相同的中文片段（預設 12 個字以上，不算空白與標點）。
 *
 * 用法：node .agents/skills/japan-travel-polish/scripts/check-copy.mjs <reader-preview.md> <參考文章.txt> [...更多] [--min=12]
 * 參考文章是執行時讀下來、放在暫存區的純文字，不進 repo。有相同片段時結束碼為 1。
 */
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

// 只保留文字：去掉空白、標點、數字與英文，避免時間、價格、站名這類必然相同的資訊被算成抄襲
const normalize = (text) => text.replace(/[\s\p{P}\p{S}0-9A-Za-z]/gu, '')

export function findCopies(article, references, {min = 12} = {}) {
  const body = article.replace(/\r\n/g, '\n').split('\n').filter((line) => !/^(#|\||- \*\*|- \[)/.test(line.trim())).join('\n')
  const target = normalize(body)
  const refs = references.map(({name, text}) => ({name, text: normalize(text)}))
  const hits = []
  let i = 0
  while (i + min <= target.length) {
    const window = target.slice(i, i + min)
    const ref = refs.find((candidate) => candidate.text.includes(window))
    if (!ref) {
      i += 1
      continue
    }
    let end = i + min
    while (end < target.length && ref.text.includes(target.slice(i, end + 1))) end += 1
    hits.push({text: target.slice(i, end), source: ref.name})
    i = end
  }
  return hits
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) {
  const args = process.argv.slice(2)
  const files = args.filter((arg) => !arg.startsWith('--'))
  const min = Number(args.find((arg) => arg.startsWith('--min='))?.slice(6) ?? 12)
  if (files.length < 2) {
    console.error('用法：check-copy.mjs <reader-preview.md> <參考文章.txt> [...更多] [--min=12]')
    process.exit(2)
  }
  const references = files.slice(1).map((file) => ({name: path.basename(file), text: readFileSync(file, 'utf8')}))
  const hits = findCopies(readFileSync(files[0], 'utf8'), references, {min})
  if (!hits.length) console.log(`通過：沒有和參考文章連續相同 ${min} 字以上的片段（比對 ${references.length} 篇）`)
  else {
    console.log(`未通過：有 ${hits.length} 處和參考文章連續相同 ${min} 字以上`)
    for (const hit of hits) console.log(`  - ${hit.text}（${hit.source}）`)
    process.exitCode = 1
  }
}
