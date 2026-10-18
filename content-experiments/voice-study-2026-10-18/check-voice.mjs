/**
 * 檢查正文讀起來像不像人寫的：標點密度、句長、中英數之間的空格。
 * 門檻依 2026-10-18 量的好運日本行（GLTJP）三篇文章訂，GLTJP 的數字見 README「像人寫的」一節。
 *
 * 用法：node content-experiments/voice-study-2026-10-18/check-voice.mjs <文章.md> [...更多檔案]
 * 只看正文段落：標題、表格、條列、引言、圖片與元件標記、事實編號都不算。
 */
import {readFileSync} from 'node:fs'

const CJK = /[一-鿿]/g
// 每千字上限（GLTJP 實測值附在旁邊）
export const LIMITS = {
  cjkAsciiSpaces: 2, // GLTJP 0～0.4
  semicolons: 0.5, // GLTJP 0～0.3
  colons: 0.5, // GLTJP 0～0.1
  parentheses: 1, // GLTJP 0.1～0.4
  tildes: 1, // GLTJP 0～0.7；區間在正文寫成「5月到10月」
  avgSentence: 38, // GLTJP 29～33 字
  longSentencePercent: 25, // 超過 50 字的句子比例，GLTJP 12%～17%
  commasPerSentence: 1.4, // GLTJP 0.9～1.4
  ifClauses: 2.5, // 「的話」每千字；GLTJP 一整頁只用 1～2 次
  comeHere: 0, // 「來這裡」「來的話」「冬天來」這類現場感用字，改成前往、造訪、抵達
  notFound: 0, // 「官方沒寫」「官方沒有公布」「未查」：查不到的不寫（2026-10-18 Darren 決定）
}
// 句長下限：切太碎也不像人寫的（第 4 輪盲測：平均 26 字讀起來一頓一頓）
export const MIN_AVG_SENTENCE = 28
// 整篇最多一次
export const MAX_BUFANG = 1

export function bodyParagraphs(markdown) {
  return markdown
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block && !/^(#|\||-|>|〔|```|\d+\.)/.test(block))
    .map((block) => block.replace(/\[(?:[a-z-]+:)?[FR]\d+\]/g, '').trim())
    .filter((block) => (block.match(CJK) || []).length >= 25)
}

export function measure(paragraphs) {
  const text = paragraphs.join('\n')
  const length = text.length || 1
  const per1k = (pattern) => ((text.match(pattern) || []).length / length) * 1000
  const sentences = text.split(/[。！？\n]/).map((s) => s.trim()).filter((s) => s.length > 3)
  const count = sentences.length || 1
  return {
    chars: text.length,
    cjkAsciiSpaces: per1k(/[一-鿿] [0-9A-Za-z]|[0-9A-Za-z] [一-鿿]/g),
    semicolons: per1k(/；/g),
    colons: per1k(/：/g),
    parentheses: per1k(/（|\(/g),
    tildes: per1k(/[～~]/g),
    avgSentence: sentences.reduce((sum, s) => sum + s.length, 0) / count,
    longSentencePercent: (sentences.filter((s) => s.length > 50).length / count) * 100,
    commasPerSentence: sentences.reduce((sum, s) => sum + (s.match(/，|,(?!\d)/g) || []).length, 0) / count,
    ifClauses: per1k(/的話/g),
    comeHere: (text.match(/來這裡|來的話|冬天來|夏天來|搭火車來|開車來/g) || []).length,
    bufang: (text.match(/不妨/g) || []).length,
    notFound: (text.match(/官方沒寫|官方沒有公布|官方未公布|官網沒寫|未查/g) || []).length,
    longest: sentences.filter((s) => s.length > 50).sort((a, b) => b.length - a.length).slice(0, 3),
  }
}

export function checkVoice(markdown) {
  const result = measure(bodyParagraphs(markdown))
  const issues = Object.entries(LIMITS)
    .filter(([key, limit]) => result[key] > limit)
    .map(([key, limit]) => `${key} ${result[key].toFixed(1)}（上限 ${limit}）`)
  if (result.chars > 0 && result.avgSentence < MIN_AVG_SENTENCE) issues.push(`avgSentence ${result.avgSentence.toFixed(1)}（下限 ${MIN_AVG_SENTENCE}，句子切太碎）`)
  if (result.bufang > MAX_BUFANG) issues.push(`「不妨」${result.bufang} 次（整篇最多 ${MAX_BUFANG} 次）`)
  return {result, issues}
}

const isCli = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())
if (isCli) {
  let failed = false
  for (const file of process.argv.slice(2)) {
    const {result, issues} = checkVoice(readFileSync(file, 'utf8'))
    console.log(`${issues.length ? '未通過' : '通過'}：${file}（正文 ${result.chars} 字）`)
    for (const issue of issues) console.log(`  - ${issue}`)
    for (const sentence of result.longest) console.log(`  長句：${sentence}`)
    if (issues.length) failed = true
  }
  if (failed) process.exitCode = 1
}
