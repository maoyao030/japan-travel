/**
 * 標竿優化的自動檢查（Darren 2026-11-05：以東川為標竿，分輪優化已上線文章）。
 * 用法：node scripts/check-benchmark.mjs --before=<優化前.md> --after=<優化後.md> --place=<地名>
 * 錯誤（數字不見、標題、表格連結、舊寫法）會讓程式以 1 結束；提醒只列出來給人看。
 */
import {readFile} from 'node:fs/promises'
import path from 'node:path'

const LINK = '連結'
const PROMO = /不能錯過|必去|必吃|必買|懶人包|攻略大全|完整指南|重點整理|先看結論/
const RECOMMEND = /如果有到|蠻值得|可以點一|很推薦|值得來看看|值得繞過去/
const GENERIC = new Set(['遊客中心', '觀光案內所', '休息站', '便利商店'])
const NUMBER = /\d{1,2}:\d{2}|\d[\d,]*(?:\.\d+)?\s*(?:日圓|分鐘|小時|公里|公尺|台|人|間|班|號|度|月|日|年|歲|公分|%)?/g

const stripUrls = (text) => text.replace(/\(https?:\/\/[^)]*\)|https?:\/\/\S+/g, '')
const bodyOf = (markdown) => {
  const end = markdown.search(/^## (延伸資料|資料來源)/m)
  return end === -1 ? markdown : markdown.slice(0, end)
}

export function numbersMissing(before, after) {
  const count = (text) => {
    const map = new Map()
    for (const match of stripUrls(bodyOf(text)).matchAll(NUMBER)) {
      const key = match[0].replace(/\s/g, '')
      if (!/\D/.test(key) && key.length < 2) continue
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }
  const a = count(before)
  const b = count(after)
  return [...a.entries()].filter(([key, n]) => (b.get(key) ?? 0) < n).map(([key, n]) => `${key}（原本 ${n} 次，現在 ${b.get(key) ?? 0} 次）`)
}

export function headingProblems(markdown, place) {
  const problems = []
  const headings = [...bodyOf(markdown).matchAll(/^(#{1,6}) (.+)$/gm)].map((m) => ({level: m[1].length, text: m[2].trim()}))
  const h1 = headings.filter((h) => h.level === 1)
  if (h1.length !== 1) problems.push(`H1 要剛好一個，現在 ${h1.length} 個`)
  let previous = 1
  const seen = new Set()
  for (const heading of headings) {
    if (heading.level > previous + 1) problems.push(`標題跳級：「${heading.text}」是 H${heading.level}，上一層是 H${previous}`)
    previous = heading.level
    if (/[:：]/.test(heading.text)) problems.push(`標題用了冒號：「${heading.text}」`)
    if (PROMO.test(heading.text)) problems.push(`標題用了宣傳語或制式標籤：「${heading.text}」`)
    if (seen.has(heading.text)) problems.push(`標題重複：「${heading.text}」`)
    seen.add(heading.text)
    if (heading.level === 2 && place && !heading.text.includes(place)) problems.push(`H2 沒帶地名「${place}」：「${heading.text}」`)
  }
  return problems
}

export function tableLinkProblems(markdown) {
  const problems = []
  const lines = markdown.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('|') || !lines[i + 1]?.match(/^\|\s*-/) || (i > 0 && lines[i - 1].startsWith('|'))) continue
    const table = []
    for (let j = i; j < lines.length && lines[j].startsWith('|'); j++) table.push(lines[j])
    const cells = table.map((line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
    const ja = cells.find((row) => row[0] === '日文名')
    if (ja && !cells.some((row) => row[0] === LINK)) problems.push(`景點資訊欄「${ja[1]}」沒有「連結」列`)
    if (cells[0].some((c) => c.includes('訂房')) && !cells[0].includes(LINK)) problems.push(`住宿表（${cells[0].join('、')}）沒有「連結」欄`)
  }
  return problems
}

export function nameProblems(markdown, terms) {
  const errors = []
  const warnings = []
  const text = stripUrls(bodyOf(markdown))
  for (const term of terms) {
    if (term.previousZh && term.previousZh !== term.zh && text.includes(term.previousZh)) errors.push(`還有舊寫法「${term.previousZh}」，應寫「${term.zh}」`)
    // 只看日文有假名的名字（音譯、意譯、假名改漢字），讀者沒有原文對不上招牌；一般名詞不算。
    if (!term.zh || term.zh.length < 3 || GENERIC.has(term.zh) || !/[\u3040-\u30ff]/.test(term.ja)) continue
    const index = text.indexOf(term.zh)
    if (index === -1) continue
    const lineStart = text.lastIndexOf('\n', index) + 1
    if (text.slice(lineStart, lineStart + 1) === '#' || text.slice(lineStart, lineStart + 1) === '|') continue
    if (!/^[^（\n，。]{0,6}（/.test(text.slice(index + term.zh.length))) warnings.push(`「${term.zh}」第一次出現沒附原文（${term.ja}）`)
  }
  return {errors, warnings}
}

export function recommendationWarnings(markdown) {
  const warnings = []
  for (const section of bodyOf(markdown).split(/^#{2,3} /m).slice(1)) {
    const title = section.split('\n')[0]
    const count = section.split(/[。！？]/).filter((sentence) => RECOMMEND.test(sentence)).length
    if (count > 1) warnings.push(`「${title}」這節有 ${count} 句推薦，一節最多一句`)
  }
  return warnings
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')))
  const root = path.resolve(import.meta.dirname, '..')
  const after = await readFile(options.after, 'utf8')
  const before = options.before ? await readFile(options.before, 'utf8') : null
  const {terms} = JSON.parse(await readFile(path.join(root, 'content-planning/glossary.json'), 'utf8'))
  const names = nameProblems(after, terms)
  const errors = [
    ...(before ? numbersMissing(before, after).map((m) => `數字不見了：${m}`) : []),
    ...headingProblems(after, options.place),
    ...tableLinkProblems(after),
    ...names.errors,
  ]
  const warnings = [...names.warnings, ...recommendationWarnings(after)]
  console.log(JSON.stringify({file: options.after, errors, warnings}, null, 2))
  process.exit(errors.length > 0 ? 1 : 0)
}
