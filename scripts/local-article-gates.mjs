// 本機寫作流程的定稿檢查：不產生定稿檔，只把 finalize-release 的各道門檻跑一遍。
// 用法：node scripts/local-article-gates.mjs <articleId>（在專案根目錄執行）
// 全部通過時印出 gates_clear 並以 0 結束；任一門檻有問題時列出並以 1 結束。
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import path from 'node:path'
import {inspectReaderPreview, inspectVoice, inspectReview, inspectPublication} from './finalize-release.mjs'
import {validateFactCheck} from '../.agents/skills/japan-travel-acceptance/scripts/validate-fact-check.mjs'

const articleId = process.argv[2]
if (!articleId) {
  console.error('用法：node scripts/local-article-gates.mjs <articleId>')
  process.exit(2)
}
const queue = JSON.parse(readFileSync('content-automation/article-queue.json', 'utf8'))
const item = queue.batches.flatMap((batch) => batch.items).find((entry) => entry.articleId === articleId)
if (!item) {
  console.error(`清單裡沒有 ${articleId}`)
  process.exit(2)
}
const dir = path.join('content-production', articleId)
const read = (file) => readFileSync(path.join(dir, file), 'utf8')
const preview = read('reader-preview.md')
const sha = createHash('sha256').update(preview.replace(/\r\n/g, '\n')).digest('hex')
const inspected = inspectReaderPreview(preview, item)
const fact = validateFactCheck(JSON.parse(read('fact-check.json')), sha)
const result = {
  preview: inspected.issues,
  voice: inspectVoice(preview).issues,
  review: inspectReview(read('review.md'), sha).issues,
  publication: inspectPublication(JSON.parse(read('publication.json')), {h1: inspected.h1, referenceReview: read('reference-review.md'), articleId}).issues,
  fact: [...fact.errors, ...fact.blocking],
}
const problems = Object.entries(result).filter(([, issues]) => issues.length)
console.log(`SHA-256（LF）：${sha}`)
if (!problems.length) {
  console.log('gates_clear')
} else {
  for (const [gate, issues] of problems) for (const issue of issues) console.log(`${gate}：${typeof issue === 'string' ? issue : JSON.stringify(issue)}`)
  process.exitCode = 1
}
