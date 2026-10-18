/**
 * 口吻與標點檢查：正文讀起來像不像人寫的。
 * 門檻依 2026-10-18 量的好運日本行（GLTJP）三篇文章訂，研究過程見
 * content-experiments/voice-study-2026-10-18/README.md。規則本身寫在 references/writing-guide.md。
 *
 * 用法：node .agents/skills/japan-travel-answer-first/scripts/check-voice.mjs <文章封包資料夾或 .md 檔> [...更多] [--json]
 * 給資料夾時檢查裡面的 reader-preview.md。
 * 只量正文段落：標題、表格、條列、引言、圖片與元件標記、程式區塊、事實編號、資料來源段落都不算。
 * scripts/finalize-release.mjs 會在定稿時呼叫 checkVoice，沒通過就不發布。
 */
import {readFileSync, statSync} from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

const CJK = /[一-鿿]/g
const FACT_TAG = /\[(?:[a-z-]+:)?[FR]\d+(?:\s*,\s*[FR]\d+)*\]/g
const SKIP_LINE = /^(\||[-*+]\s|>|〔|!\[|\d+\.\s)/
const SOURCE_HEADING = /^##\s+(資料來源|參考資料)\s*$/

// 每千字上限（GLTJP 實測值附在旁邊）
export const LIMITS = {
  cjkAsciiSpaces: 2, // GLTJP 0～0.4
  semicolons: 0.5, // GLTJP 0～0.3
  colons: 0.5, // GLTJP 0～0.1
  parentheses: 1, // GLTJP 0.1～0.4
  tildes: 1, // GLTJP 0～0.7；區間在正文寫成「5月到10月」
  avgSentence: 38, // GLTJP 29～33 字
  longSentencePercent: 25, // 超過 50 字的句子比例，GLTJP 12%～17%
  commasPerSentence: 1.8, // GLTJP 0.9～1.4、Funliday 1.5；用「所以」「不然」串事實需要逗號，2026-10-18 從 1.4 放寬
  ifClauses: 2.5, // 「的話」每千字；GLTJP 一整頁只用 1～2 次
  comeHere: 0, // 「來這裡」「來的話」「冬天來」這類現場感用字，改成前往、造訪、抵達
  notFound: 0, // 「官方沒寫」「官方沒有公布」「未查」：查不到的不寫（2026-10-18 Darren 決定）
}
// 句長下限：切太碎也不像人寫的（第 4 輪盲測：平均 26 字讀起來一頓一頓）
export const MIN_AVG_SENTENCE = 28
// 整篇最多一次
export const MAX_BUFANG = 1

const LABELS = {
  cjkAsciiSpaces: '中英數之間的空格每千字',
  semicolons: '分號每千字',
  colons: '冒號每千字',
  parentheses: '括號每千字',
  tildes: '「～」每千字',
  avgSentence: '平均句長',
  longSentencePercent: '超過50字的句子比例（%）',
  commasPerSentence: '每句逗號',
  ifClauses: '「的話」每千字',
  comeHere: '「來這裡」「來的話」這類用字',
  notFound: '「官方沒寫」「未查」這類用字',
}
const HINTS = {
  cjkAsciiSpaces: '寫「約5分鐘」「2026年」「JR稚內站」',
  semicolons: '拆成兩句或用逗號',
  colons: '冒號只放在條列前',
  parentheses: '括號只放原名，補充說明改寫成子句',
  tildes: '正文的區間寫「5月到10月」，「～」留給表格',
  avgSentence: '句子太長，拆句時重新核對每個條件屬於哪個主詞',
  longSentencePercent: '把超過50字的句子拆開',
  commasPerSentence: '一句講一件事',
  ifClauses: '「的話」每段最多一次',
  comeHere: '改成前往、造訪、抵達',
  notFound: '查不到的不寫，會卡住讀者的事改寫成能做的事',
}

export function bodyParagraphs(markdown) {
  const paragraphs = []
  let current = []
  let fenced = false
  let inSources = false
  const flush = () => {
    if (current.length) paragraphs.push(current.join(''))
    current = []
  }
  for (const raw of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (/^(`{3,}|~{3,})/.test(line)) {
      fenced = !fenced
      flush()
      continue
    }
    if (fenced) continue
    if (/^#{1,6}\s/.test(line)) {
      flush()
      inSources = SOURCE_HEADING.test(line)
      continue
    }
    if (inSources || !line || SKIP_LINE.test(line)) {
      flush()
      continue
    }
    current.push(line.replace(FACT_TAG, '').trim())
  }
  flush()
  return paragraphs.filter((paragraph) => (paragraph.match(CJK) || []).length >= 25)
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
    comeHere: (text.match(/來這裡|來的話|冬天來|夏天來|搭火車來(?!回)|開車來(?!回)/g) || []).length,
    bufang: (text.match(/不妨/g) || []).length,
    notFound: (text.match(/官方沒寫|官方沒有公布|官方未公布|官網沒寫|未查/g) || []).length,
    longest: sentences.filter((s) => s.length > 50).sort((a, b) => b.length - a.length).slice(0, 3),
  }
}

export function checkVoice(markdown) {
  const result = measure(bodyParagraphs(markdown))
  const issues = []
  if (result.chars === 0) return {result, issues}
  for (const [key, limit] of Object.entries(LIMITS)) {
    if (result[key] <= limit) continue
    const value = Number.isInteger(result[key]) ? result[key] : result[key].toFixed(1)
    const unit = key === 'avgSentence' ? '字' : key === 'comeHere' || key === 'notFound' ? '次' : ''
    issues.push(`${LABELS[key]}${value}${unit}（上限${limit}），${HINTS[key]}`)
  }
  if (result.avgSentence < MIN_AVG_SENTENCE) {
    issues.push(`平均句長${result.avgSentence.toFixed(1)}字（下限${MIN_AVG_SENTENCE}），句子切太碎，把同一件事的短句併回去`)
  }
  if (result.bufang > MAX_BUFANG) issues.push(`「不妨」${result.bufang}次（整篇最多${MAX_BUFANG}次）`)
  return {result, issues}
}

export function resolveTarget(target) {
  const resolved = path.resolve(target)
  return statSync(resolved).isDirectory() ? path.join(resolved, 'reader-preview.md') : resolved
}

export function checkVoiceTarget(target) {
  const file = resolveTarget(target)
  return {file, ...checkVoice(readFileSync(file, 'utf8'))}
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) {
  const args = process.argv.slice(2)
  const asJson = args.includes('--json')
  const targets = args.filter((arg) => !arg.startsWith('--'))
  if (targets.length === 0) {
    console.error('用法：node check-voice.mjs <文章封包資料夾或 .md 檔> [...更多] [--json]')
    process.exit(2)
  }
  const reports = targets.map((target) => checkVoiceTarget(target))
  if (asJson) {
    console.log(JSON.stringify(reports.map(({file, result, issues}) => ({file, status: issues.length ? 'voice_failed' : 'voice_clear', issues, result})), null, 2))
  } else {
    for (const {file, result, issues} of reports) {
      console.log(`${issues.length ? '未通過' : '通過'}：${file}（正文${result.chars}字）`)
      for (const issue of issues) console.log(`  - ${issue}`)
      for (const sentence of result.longest) console.log(`  長句：${sentence}`)
    }
  }
  if (reports.some(({issues}) => issues.length > 0)) process.exitCode = 1
}
