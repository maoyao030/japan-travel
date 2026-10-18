/**
 * 潤稿前後比對：潤稿只能改語氣與句子，不能改事實。
 * 整篇比對：事實編號、數字（含時間、價格、日期）、日文片段的集合要一樣；各 H2 段落之間刪重複或搬動會列出來，交給意義比對；
 * 標題、表格要一字不差；大綱內連表的連結句要原樣出現在潤稿後的正文。
 *
 * 用法：node .agents/skills/japan-travel-polish/scripts/check-polish.mjs <潤稿前 draft-tagged.md> <潤稿後 draft-tagged.md> [--article=<articleId>] [--outline=<群大綱.json>]
 * 有差異時結束碼為 1。用集合比較（不比次數），合併句子時重複的編號或數字少寫一次不算錯。
 */
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

const TAG = /\[((?:[a-z-]+:)?[FR]\d+(?:\s*,\s*(?:[a-z-]+:)?[FR]\d+)*)\]/g
const NUMBER = /\d[\d,]*(?:[.:]\d+)?/g
// 只抓連續的假名：夾著漢字的長串會把中文也抓進去（「アマポーラ宗谷號和サイプリア」），潤稿就不能改中間的中文
const KANA = /[぀-ヿー・]{2,}/g

const normalize = (text) => text.replace(/\r\n/g, '\n')
const stripTags = (text) => text.replace(TAG, '').replace(/\s+(?=[。，、！？])/g, '')

/** 依 H2 切段（maxLevel=3 時連 H3 也切）；第一個標題之前的開頭算一段「開頭」。 */
export function sections(markdown, maxLevel = 2) {
  const result = []
  let current = {title: '開頭', lines: []}
  for (const line of normalize(markdown).split('\n')) {
    const level = (line.match(/^(#{2,6})\s+/) || [])[1]?.length
    if (level && level <= maxLevel) {
      result.push(current)
      current = {title: line.replace(/^#+\s+/, '').trim(), lines: []}
    } else current.lines.push(line)
  }
  result.push(current)
  return result
}

function factIds(text) {
  const ids = new Set()
  for (const match of text.matchAll(TAG)) for (const id of match[1].split(/\s*,\s*/)) ids.add(id.trim())
  return ids
}

function numbers(text) {
  // 只看正文，不看網址；網址的數字由延伸資料與資料來源段負責
  const body = stripTags(text).replace(/https?:\/\/\S+/g, '')
  return new Set((body.match(NUMBER) ?? []).map((value) => value.replace(/,/g, '')))
}

function kana(text) {
  return new Set(stripTags(text).match(KANA) ?? [])
}

const headings = (markdown) => normalize(markdown).split('\n').filter((line) => /^#{1,6}\s+/.test(line))
const tables = (markdown) => normalize(markdown).split('\n').filter((line) => line.trim().startsWith('|')).map((line) => line.trim())

function diff(label, before, after) {
  const missing = [...before].filter((value) => !after.has(value))
  const added = [...after].filter((value) => !before.has(value))
  const issues = []
  if (missing.length) issues.push(`${label}少了：${missing.join('、')}`)
  if (added.length) issues.push(`${label}多了：${added.join('、')}`)
  return issues
}

export function checkPolish(beforeText, afterText, {linkSentences = []} = {}) {
  const issues = []
  const before = normalize(beforeText)
  const after = normalize(afterText)

  const beforeHeadings = headings(before)
  const afterHeadings = headings(after)
  if (beforeHeadings.join('\n') !== afterHeadings.join('\n')) {
    issues.push('標題改變了：潤稿不能改標題或層級')
  }
  const beforeTables = tables(before)
  const afterTables = tables(after)
  if (beforeTables.join('\n') !== afterTables.join('\n')) issues.push('表格改變了：潤稿不能改表格')

  // 整篇的事實編號、數字、日文要一樣。各段可以刪掉別段已經寫過的重複內容，或把內容搬到別段，
  // 但段裡少掉的東西整篇一定還在、段裡多出來的東西潤稿前一定寫過。搬動是否合理交給意義比對。
  const whole = (text) => ({ids: factIds(text), nums: numbers(text), kana: kana(text)})
  const beforeAll = whole(before)
  const afterAll = whole(after)
  for (const issue of [
    ...diff('事實編號', beforeAll.ids, afterAll.ids),
    ...diff('數字', beforeAll.nums, afterAll.nums),
    ...diff('日文', beforeAll.kana, afterAll.kana),
  ]) issues.push(`整篇${issue}`)

  const beforeSections = sections(before)
  const afterSections = sections(after)
  const afterByTitle = new Map(afterSections.map((section) => [section.title, section]))
  for (const section of beforeSections) {
    if (!afterByTitle.has(section.title)) issues.push(`段落「${section.title}」不見了`)
  }
  // 搬動與刪重複以 H3 為單位列出，同一個 H2 底下不同小節之間的刪重複也看得到
  const moves = []
  const afterSubsections = new Map(sections(after, 3).map((section) => [section.title, section]))
  for (const section of sections(before, 3)) {
    const match = afterSubsections.get(section.title)
    if (!match) continue
    const b = whole(section.lines.join('\n'))
    const a = whole(match.lines.join('\n'))
    for (const [label, key] of [['事實編號', 'ids'], ['數字', 'nums'], ['日文', 'kana']]) {
      const removed = [...b[key]].filter((value) => !a[key].has(value) && afterAll[key].has(value))
      const added = [...a[key]].filter((value) => !b[key].has(value) && beforeAll[key].has(value))
      if (removed.length) moves.push(`「${section.title}」刪掉或搬走的${label}（別段還有）：${removed.join('、')}`)
      if (added.length) moves.push(`「${section.title}」從別段搬來的${label}：${added.join('、')}`)
    }
  }

  const plainAfter = stripTags(after)
  for (const sentence of linkSentences) {
    if (!plainAfter.includes(sentence)) issues.push(`內連句沒有原樣出現：${sentence}`)
  }
  return {status: issues.length ? 'polish_changed_facts' : 'polish_safe', issues, moves}
}

function linkSentencesFor(outlinePath, articleId) {
  const outline = JSON.parse(readFileSync(outlinePath, 'utf8'))
  return (outline.links ?? []).filter((link) => link.from === articleId && link.sentence).map((link) => link.sentence)
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) {
  const args = process.argv.slice(2)
  const files = args.filter((arg) => !arg.startsWith('--'))
  const option = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
  if (files.length !== 2) {
    console.error('用法：check-polish.mjs <潤稿前.md> <潤稿後.md> [--article=<id>] [--outline=<群大綱.json>]')
    process.exit(2)
  }
  const articleId = option('article')
  const outlinePath = option('outline') ?? 'content-planning/hokkaido/hokkaido-wakkanai-outline.json'
  const linkSentences = articleId ? linkSentencesFor(outlinePath, articleId) : []
  const result = checkPolish(readFileSync(files[0], 'utf8'), readFileSync(files[1], 'utf8'), {linkSentences})
  console.log(result.status === 'polish_safe' ? `通過：潤稿沒有改到事實（檢查了 ${linkSentences.length} 句內連句）` : '未通過：潤稿改到了事實')
  for (const issue of result.issues) console.log(`  - ${issue}`)
  if (result.moves.length) console.log('跨段刪重複或搬動（交給意義比對確認）：')
  for (const move of result.moves) console.log(`  · ${move}`)
  if (result.issues.length) process.exitCode = 1
}
