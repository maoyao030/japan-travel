/**
 * 住宿專門頁（早餐、溫泉、自駕這類）的自動檢查：把讀者驗收六題裡程式看得出來的部分先擋掉。
 * 規則出處：寫作 Skill references/stay-topic-page.md（Darren 2026-11-17、11-18）。
 * 語意類的問題（分組標題是不是組內都有、兩節講同一件事有沒有矛盾、每個搜尋詞有沒有直接答案）程式看不出來，
 * 由「預驗」助手與讀者驗收處理。
 *
 * 用法：node scripts/check-stay-topic.mjs <reader-preview.md 或 final.md> [--json]
 * 有 errors 時結束碼 1；warnings 只提醒。
 */
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const BOOKING_PREFIX = '看房價與訂房：'
const GUEST = /(?<!只)有(?:些)?住客(?:提到|覺得|反應|說|稱讚|遇到|認為)|住客的評價/g
const CHAT_QUESTION = /(幾點|在哪吃|能去哪吃|在哪|多少錢|有嗎)？$/
const POINTING = /(看|請看|可以看)(這|哪|下面|上面|前面|後面)[^。，]{0,8}(一節|那一節|那節)/
const TIME_IN_OPENING = /\d{1,2}[:：]\d{2}|\d{1,2}點|走路約?\d+分/
const MAX_QUESTION_H2 = 3
// 2026-11-18：從 4 放寬到 8（一間仍最多一句），賣點只在住客評論裡的飯店才寫得進去。
const MAX_GUEST_TOTAL = 8
const MAX_REPEAT = 2
// Darren 2026-11-18：「廢話很多」。每間飯店只留第一段、一個主題段與「要注意」，不念規格。
const MAX_BOLD_LABELS_PER_HOTEL = 2
const MAX_HOTEL_BODY_CHARS = 320
// Darren 2026-11-18：刪過頭也不行（「東西也變太少了吧」）。一間飯店正文不到 150 字，多半是把賣點也刪了。
const MIN_HOTEL_BODY_CHARS = 120
const THIN_HOTEL_BODY_CHARS = 150

const stripLinks = (text) => text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')

export function parseSections(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const sections = []
  let current = {level: 0, title: '', lines: [], start: 0}
  for (const [index, line] of lines.entries()) {
    const match = /^(#{1,3})\s+(.+?)\s*$/.exec(line)
    if (match) {
      sections.push(current)
      current = {level: match[1].length, title: match[2], lines: [], start: index + 1}
    } else current.lines.push(line)
  }
  sections.push(current)
  return sections.filter((section) => section.level > 0)
}

export function checkStayTopic(markdown) {
  const errors = []
  const warnings = []
  const all = parseSections(markdown)
  const sourceIndex = all.findIndex((section) => section.level === 2 && section.title === '資料來源')
  const sections = sourceIndex >= 0 ? all.slice(0, sourceIndex) : all
  const h1 = sections.find((section) => section.level === 1)
  if (!h1) return {errors: ['找不到 H1'], warnings}

  // 1. 開頭不點飯店名、時間、走路幾分鐘，不指路。
  const tableNames = []
  for (const section of sections) {
    for (const line of section.lines) {
      if (!line.startsWith('|') || /^\|\s*-/.test(line)) continue
      const first = stripLinks(line.split('|')[1] ?? '').trim()
      if (first && first !== '飯店' && first !== '旅館' && !tableNames.includes(first)) tableNames.push(first)
    }
  }
  const opening = stripLinks(h1.lines.join('\n'))
  if (TIME_IN_OPENING.test(opening)) errors.push('開頭寫了時間或走路幾分鐘；這些留給各節與比較表')
  const namedInOpening = tableNames.filter((name) => name.length >= 4 && opening.includes(name.replace(/（.*$/, '')))
  if (namedInOpening.length > 0) errors.push(`開頭點了飯店名：${namedInOpening.join('、')}`)

  // 2. 標題：共通問題用問句（最多三個、不用聊天短問），單一飯店的 H3 不用問句。
  const h2s = sections.filter((section) => section.level === 2)
  const questionH2 = h2s.filter((section) => /[？?]$/.test(section.title))
  if (questionH2.length > MAX_QUESTION_H2) errors.push(`問句 H2 有 ${questionH2.length} 個，最多 ${MAX_QUESTION_H2} 個`)
  for (const section of sections) {
    if (/\?$/.test(section.title)) errors.push(`問句要用全形「？」：${section.title}`)
    if (section.level === 3 && /[？?]$/.test(section.title)) errors.push(`單一飯店的小標題用「飯店名＋主題」，不用問句：${section.title}`)
    if (section.level === 2 && CHAT_QUESTION.test(section.title) && section.title.length <= 12) {
      errors.push(`問句標題太像聊天的短問：${section.title}`)
    }
  }

  // 3. 比較表放在飯店介紹之後。
  const firstH3 = sections.findIndex((section) => section.level === 3)
  const tableH2 = sections.findIndex((section) => section.level === 2 && section.title.includes('比較表'))
  if (tableH2 >= 0 && (firstH3 < 0 || tableH2 < firstH3)) errors.push('比較表要放在飯店介紹之後')
  if (tableH2 < 0) warnings.push('沒有標題含「比較表」的 H2')

  // 4. 每間飯店的小節都要有點得下去的訂房行；H3 的飯店要出現在比較表。
  const h3s = sections.filter((section) => section.level === 3)
  for (const section of h3s) {
    const booking = section.lines.find((line) => line.startsWith(BOOKING_PREFIX))
    if (!booking) errors.push(`「${section.title}」沒有「${BOOKING_PREFIX}」那一行`)
    else if (!/\]\(https?:\/\/[^)]+\)/.test(booking)) errors.push(`「${section.title}」的訂房行沒有連結`)
    const inTable = tableNames.some((name) => {
      const short = name.replace(/（.*$/, '')
      return section.title.includes(short) || short.includes(section.title.replace(/（.*$/, '').replace(/(早餐|大浴場|天然溫泉|溫泉|停車場|泡湯設施|早餐時間)$/, ''))
    })
    if (tableNames.length > 0 && !inTable) errors.push(`「${section.title}」的飯店不在比較表裡`)
    const hotelBody = section.lines.filter((line) => line.trim() !== '' && !line.startsWith(BOOKING_PREFIX) && !line.startsWith('|'))
    const boldLabels = hotelBody.filter((line) => /^\*\*[^*]+\*\*[：:]/.test(line))
    if (boldLabels.length > MAX_BOLD_LABELS_PER_HOTEL) {
      errors.push(`「${section.title}」有 ${boldLabels.length} 個粗體小段，一間最多 ${MAX_BOLD_LABELS_PER_HOTEL} 個（一個主題段加「要注意」）；把查到的設施一樣一樣列出來就是念規格`)
    }
    const hotelChars = stripLinks(hotelBody.join('')).replace(/\*\*/g, '').replace(/\s/g, '').length
    if (hotelChars < MIN_HOTEL_BODY_CHARS) errors.push(`「${section.title}」正文只有 ${hotelChars} 字，一間至少 ${MIN_HOTEL_BODY_CHARS} 字；讓人想選這間的具體賣點（具體的菜、浴池、房型、位置好處）要寫出來`)
    else if (hotelChars < THIN_HOTEL_BODY_CHARS) warnings.push(`「${section.title}」正文只有 ${hotelChars} 字，偏少；份量檢查時確認賣點有沒有寫出來`)
    if (hotelChars > MAX_HOTEL_BODY_CHARS) errors.push(`「${section.title}」正文 ${hotelChars} 字，一間最多 ${MAX_HOTEL_BODY_CHARS} 字；逐行問拿掉會不會影響選擇`)
    const first = stripLinks(section.lines.find((line) => line.trim() !== '') ?? '')
    if (/^[^。]{0,12}(是|為)[^。]{0,20}的自助[，。]/.test(first)) warnings.push(`「${section.title}」第一句像資料句，先講最讓人想選它的那件事`)
  }

  // 5. 住客說法：全頁最多八句、一間最多一句。
  let guestTotal = 0
  for (const section of sections) {
    const count = (stripLinks(section.lines.join('\n')).match(GUEST) ?? []).length
    guestTotal += count
    if (section.level === 3 && count > 1) errors.push(`「${section.title}」的住客說法有 ${count} 句，一間最多一句`)
  }
  if (guestTotal > MAX_GUEST_TOTAL) errors.push(`住客說法全頁有 ${guestTotal} 句，最多 ${MAX_GUEST_TOTAL} 句`)

  // 6. 同一句提醒不重複三次以上（「入住時問櫃台」這類）。
  const body = stripLinks(
    sections
      .flatMap((section) => section.lines)
      .filter((line) => !line.startsWith('|') && !line.startsWith(BOOKING_PREFIX))
      .join('\n'),
  )
  const clauseCount = new Map()
  for (const clause of body.split(/[，。；：？！\n]/)) {
    const text = clause.replace(/\*\*/g, '').trim()
    if (text.length < 7) continue
    clauseCount.set(text, (clauseCount.get(text) ?? 0) + 1)
  }
  for (const [text, count] of clauseCount) {
    if (count > MAX_REPEAT + 1) errors.push(`同一句出現 ${count} 次：「${text}」`)
    else if (count > MAX_REPEAT) warnings.push(`同一句出現 ${count} 次：「${text}」`)
  }
  for (const phrase of ['問櫃台', '寫信問', '打電話問']) {
    const count = body.split(phrase).length - 1
    if (count > 4) warnings.push(`「${phrase}」出現 ${count} 次，看看是不是用同一句提醒在補位`)
  }

  const aliasCount = (body.match(/在(?:Trip\.com|Agoda)[^。，]{0,12}上叫/g) ?? []).length
  if (aliasCount > 1) errors.push(`「在訂房網站上叫○○」出現 ${aliasCount} 次；每間重複同一句是廢話，別名放標題或只提一次`)

  // 7. 不指路、不寫「官網寫」。
  for (const line of body.split('\n')) {
    if (POINTING.test(line)) errors.push(`不指導讀者在這一頁往哪看：${line.trim().slice(0, 40)}`)
  }
  const officialSays = body.split('官網寫').length - 1
  if (officialSays > 1) warnings.push(`「官網寫」出現 ${officialSays} 次，直接寫事實`)

  // 8. 最後一行是「資料更新：」。
  const lastLine = markdown.replace(/\r\n/g, '\n').trimEnd().split('\n').at(-1) ?? ''
  if (!/^資料更新：\d{4}年\d{1,2}月$/.test(lastLine)) errors.push('最後一行要是「資料更新：○年○月」')

  return {errors, warnings}
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  const file = process.argv.slice(2).find((argument) => !argument.startsWith('--'))
  if (!file) {
    console.error('用法：node scripts/check-stay-topic.mjs <reader-preview.md> [--json]')
    process.exit(2)
  }
  const result = checkStayTopic(readFileSync(file, 'utf8'))
  if (process.argv.includes('--json')) console.log(JSON.stringify({file, ...result}, null, 2))
  else {
    for (const error of result.errors) console.log(`錯誤：${error}`)
    for (const warning of result.warnings) console.log(`提醒：${warning}`)
    console.log(result.errors.length === 0 ? `通過：${file}` : `未通過：${file}（${result.errors.length} 項）`)
  }
  if (result.errors.length > 0) process.exitCode = 1
}
