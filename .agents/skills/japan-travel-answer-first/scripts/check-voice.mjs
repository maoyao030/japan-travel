/**
 * 口吻與標點檢查：正文讀起來像不像人寫的。
 * 門檻依 2026-10-18 量的好運日本行（GLTJP）三篇文章訂，研究過程見
 * content-experiments/voice-study-2026-10-18/README.md。規則本身寫在 references/writing-guide.md。
 *
 * 用法：node .agents/skills/japan-travel-answer-first/scripts/check-voice.mjs <文章封包資料夾或 .md 檔> [...更多] [--final] [--json]
 * 給資料夾時檢查裡面的 reader-preview.md。
 * AI 腔句型（「關鍵是」「最先要搞清楚的是兩件事」）每個階段都檢查；用字頻率（所以、記得、…的人）只在潤稿後與定稿檢查（--final），
 * 門檻依 2026-10-18 量的 9 篇台灣旅遊文章訂，見 content-experiments/polish-test-2026-10-18/ai-tone-study.md。
 * 只量正文段落：標題、表格、條列、引言、圖片與元件標記、程式區塊、事實編號、資料來源段落都不算。
 * scripts/finalize-release.mjs 會在定稿時呼叫 checkVoice，沒通過就不發布。
 *
 * 2026-10-30 Darren 決定：數字門檻（句長、逗號、「的話」、標點次數、用字頻率）只記錄在 result，不擋也不提醒。
 * 寫的人照數字對答案會把文章寫彆扭（換字過關、規則互相夾殺），見 content-experiments/polish-compare-2026-10-30/README.md。
 * 照擋的只有「出現就是錯」的東西：AI 腔句型、括號外的日文與日式漢字詞、「官方沒寫」與「來這裡」這類用字。
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
  parentheses: 1, // GLTJP 0.1～0.4；放日文原名的括號不算
  tildes: 1, // GLTJP 0～0.7；區間在正文寫成「5月到10月」
  avgSentence: 38, // GLTJP 29～33 字
  longSentencePercent: 25, // 超過 50 字的句子比例，GLTJP 12%～17%
  commasPerSentence: 1.8, // GLTJP 0.9～1.4、Funliday 1.5；用「所以」「不然」串事實需要逗號，2026-10-18 從 1.4 放寬
  ifClauses: 3.5, // 「的話」每千字；GLTJP 一整頁只用 1～2 次，Funliday 2.7～3.2；潤稿用條件句取代「所以」「…的人」，2026-10-18 從 2.5 放寬
  comeHere: 0, // 「來這裡」「來的話」「冬天來」這類現場感用字，改成前往、造訪、抵達
  notFound: 0, // 「官方沒寫」「官方沒有公布」「未查」：查不到的不寫（2026-10-18 Darren 決定）
}
// 會擋的只有用字禁令；其他數字只記錄（2026-10-30）
export const BLOCKING_LIMITS = new Set(['comeHere', 'notFound'])
// 以下兩個數字也只記錄，不擋（2026-10-30）
// 句長下限：切太碎也不像人寫的（第 4 輪盲測：平均 26 字讀起來一頓一頓）
export const MIN_AVG_SENTENCE = 28
// 整篇最多一次
export const MAX_BUFANG = 1

// AI 腔句型：真人旅遊文章 9 篇、約 4.7 萬字裡合計只出現 6 次，第2次潤稿一篇就有 16 次。一律不用。
export const AI_PHRASES = [
  {label: '「關鍵」', pattern: /關鍵/g, hint: '直接講那件事，不先宣布它很關鍵'},
  {label: '「搞清楚」', pattern: /搞清楚/g, hint: '直接講內容'},
  {label: '「要記住的是」', pattern: /要記住|要記得的是/g, hint: '直接講內容'},
  {label: '「共通點」', pattern: /共通點/g, hint: '直接說「三個站都是1樓買票、2樓上船」'},
  {label: '「有一個好處／例外」', pattern: /(?:有|還有)[一兩幾]?個小?(?:好處|例外|重點|特點|共通點|地方要)/g, hint: '直接說好處或例外本身'},
  {label: '「第一是、第二是」', pattern: /第[一二三四]是|(?:^|[。，\n])(?:第[一二三四]|首先|其次)[，、]/g, hint: '不用簡報式編號，用季節、時間或情境帶出下一件事'},
  {label: '「…方面，」', pattern: /[一-鿿]{1,4}方面[，,]/g, hint: '直接從那件事開始講'},
  {label: '「這條線」', pattern: /這條線/g, hint: '直接寫時間'},
  {label: '「值得注意的是」', pattern: /值得(?:注意|一提)|需要注意的是|要注意的是/g, hint: '直接講要注意的事'},
  {label: '總結轉折語', pattern: /(?:簡單|總的|整體)來說|換句話說|總而言之|也就是說|意味著/g, hint: '刪掉，直接講'},
  {label: '「兩件事」「以下幾點」', pattern: /[兩三幾]件事|以下(?:幾|是)|下面這幾/g, hint: '不預告有幾件事，直接講第一件'},
  {label: '指涉文章版面', pattern: /上一節|下一節|上面.{0,6}(?:清單|列表|段落|表格)|前面提到/g, hint: '直接寫那個時間或條件'},
  {label: '套語', pattern: /一目了然|一應俱全|不容錯過|輕鬆搞定|從容/g, hint: '換成具體的事'},
]

// 頻率在短文裡沒有意義，正文少於這個字數時不檢查用字頻率
export const MIN_RATE_CHARS = 1500

// 潤稿後的用字頻率，每千字參考值。真人 9 篇的最大值附在旁邊；第2次潤稿的值在括號裡。
// 只提醒、不擋：第4輪潤稿者為了過門檻把「預約」改成「訂」、「要」換成「得」，語氣沒變（Fable 審查指出的換字過關）。
// 頻率是結果，不是原因；真正的檢查是盲測、編輯審稿與讀者任務。
export const FINAL_RATES = {
  所以: {pattern: /所以/g, limit: 0.6, hint: '後果直接接在後面，或改用條件句「…的話，…」'}, // 0.43（2.3）
  記得: {pattern: /記得/g, limit: 0.5, hint: '不要每段都提醒，把該做的事直接寫成句子'}, // 0.79（1.34）
  的人: {pattern: /的人/g, limit: 1, hint: '「帶腳踏車的人要…」改成「帶腳踏車的話…」或「如果帶腳踏車，…」'}, // 0.79（4.02）
  要: {pattern: /要/g, limit: 6, hint: '少用指令語氣，規定照寫，提醒改成「最好」「可以」或直接寫後果'}, // 3.88（8.62）
  得: {pattern: /得/g, limit: 2, hint: '把「要」換成「得」語氣沒變，改成「最好」「可以」或直接寫後果'}, // 1.89（2.99），個人部落格 2.76 不計
  先: {pattern: /先/g, limit: 2, hint: '不是每件事都要「先」'}, // 1.25（3.64）
  而且: {pattern: /而且/g, limit: 0.5, hint: '多數時候刪掉，或改用「也」'}, // 0.24（0.96）
  同樣: {pattern: /同樣/g, limit: 0.8, hint: '刪掉或改用「也」'}, // 0.64（1.15）
  也能: {pattern: /也能/g, limit: 0.9, hint: '換說法'}, // 0.79（1.34）
  就能: {pattern: /就能/g, limit: 0.9, hint: '換說法'}, // 0.64（1.34）
  只能: {pattern: /只能/g, limit: 0.9, hint: '換說法'}, // 0.79（0.77）
  不過: {pattern: /不過/g, limit: 0.9, hint: '有時用「但」，有時直接接'}, // 0.67（0.96）
  以免: {pattern: /以免/g, limit: 0.3, hint: '寫出會發生什麼事'}, // 0（0.38）
  // 第3次潤稿加量（真人最大值／第3次潤稿）
  和: {pattern: /和/g, limit: 3, hint: '列舉多用頓號「、」或「與」，不要每個並列都用「和」'}, // 2.7（6.3）
  約: {pattern: /(?<!預)約/g, limit: 6, hint: '同一段不要每個數字都「約」，可以換成「…左右」「大約」，程度一樣'}, // 2.8（9.0）
  公布: {pattern: /公布/g, limit: 0.3, hint: '不寫查資料的過程（「渡輪公司公布了」「樓層圖上標示為」），直接寫事情'}, // 0（0.5）
  逗號: {pattern: /，/g, limit: 40, hint: '短句用逗號一路接下去像條文，把同一件事併成一句，不同的事用句號分開'}, // 部落格與編輯 26～37（43.7）
}

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
    // 放日文原名的括號不算（寫作指南第15條要求第一次出現附原名），只算補充說明
    parentheses: (((text.match(/（[^（）]*）|\([^()]*\)/g) || []).filter((group) => !new RegExp(JAPANESE_CHAR).test(group)).length) / length) * 1000,
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

/** AI 腔句型與（定稿時的）用字頻率。 */
export function checkAiTone(paragraphs, {final = false, showRates = false} = {}) {
  const text = paragraphs.join('\n')
  const issues = []
  const warnings = []
  for (const {label, pattern, hint} of AI_PHRASES) {
    const hits = text.match(pattern) || []
    if (!hits.length) continue
    const sentences = text.split(/(?<=[。！？\n])/).filter((sentence) => sentence.match(pattern)).map((sentence) => sentence.trim())
    issues.push(`AI 腔${label}${hits.length}次，${hint}：${sentences.slice(0, 2).join('／')}`)
  }
  // 用字頻率只記錄（2026-10-30），要看時加 --rates
  if (final && showRates && text.length >= MIN_RATE_CHARS) {
    for (const [word, {pattern, limit, hint}] of Object.entries(FINAL_RATES)) {
      const rate = ((text.match(pattern) || []).length / text.length) * 1000
      if (rate > limit) warnings.push(`「${word}」每千字${rate.toFixed(1)}次（真人文章最多約${limit}），${hint}`)
    }
  }
  return {issues, warnings}
}

// 日文：括號外不能有假名，也不能有日本字形的漢字（稚内、観光、駅前）。Darren 2026-10-28：文章日文太多。
// 專有名詞第一次出現寫「繁中譯名（日文原名）」，之後只寫中文；「」裡是讀者要在畫面或招牌上認的字，可以照原文。
// 「・」「ー」中文也會用，單獨出現不算日文
const KANA = /[\u3040-\u309f\u30a0-\u30fa\u30fd-\u30ff\u31f0-\u31ff\uff66-\uff9f]/
// 和台灣正體寫法不同的日本字形，只收不會誤判的常用字
export const JAPANESE_KANJI = '駅内礼観黒温鉄広沢浜県図関売発歳楽栄覧転営団辺稲来実処気区桜渓炉恵応当両様断経総縄竜亀斎戦変歩銭塩写単弁帯庁滝豊舗継険検権剣価帰駆灯姫焼涙軽拡郷'
const JAPANESE_KANJI_PATTERN = new RegExp(`[${JAPANESE_KANJI}]`)
const JAPANESE_CHAR = `[\\u3040-\\u309f\\u30a0-\\u30fa\\u30fd-\\u30ff\\u31f0-\\u31ff\\uff66-\\uff9f々〆${JAPANESE_KANJI}]`
// 前後最多帶3個漢字，訊息才看得出是哪個名字
const JAPANESE_TERM = new RegExp(`[\\u4e00-\\u9fff]{0,3}(?:${JAPANESE_CHAR}[・ー]*)+(?:[\\u4e00-\\u9fff]{1,3}(?:${JAPANESE_CHAR}[・ー]*)+)*[\\u4e00-\\u9fff]{0,3}`, 'g')
// 「」裡的日文超過這個數字就提醒：只留畫面按鈕、招牌與站牌
export const MAX_QUOTED_JAPANESE = 8

const stripParentheses = (text) => {
  let previous
  let current = text
  do {
    previous = current
    current = current.replace(/（[^（）]*）|\([^()]*\)/g, '')
  } while (current !== previous)
  return current
}

// 表格裡專門放原文的欄或列（「畫面上的日文」欄、基本資訊欄的「日文名」列）可以照原文
const ORIGINAL_LABEL = /日文|原文|畫面|按鈕|招牌上|站牌|上的名稱/
const tableCells = (line) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())

// 日文漢字詞直接搬進中文、台灣讀者會看錯或覺得怪的詞（Darren 2026-10-29：「檢討」不是台灣用語）。
// 只檢查括號、「」與資料來源以外的正文；放原名的括號照樣可以寫日文。
export const JAPANESE_STYLE_WORDS = {
  檢討: '評估、研議（台灣的「檢討」是反省錯誤）',
  運休: '停駛、停航',
  欠航: '停航、取消',
  運賃: '車資、票價',
  料金: '費用、票價',
  割引: '折扣、優惠',
  片道: '單程',
  往復: '來回',
  見學: '參觀',
  混雜: '擁擠',
  最寄: '最近的',
  入場料: '門票',
}
const JAPANESE_STYLE_PATTERN = new RegExp(Object.keys(JAPANESE_STYLE_WORDS).join('|'), 'g')

/** 正文、標題、表格、條列、延伸資料裡括號外的日文。資料來源、圖片與程式區塊不算。 */
export function checkJapanese(markdown) {
  const styleWords = []
  const terms = []
  const quoted = []
  let fenced = false
  let inSources = false
  let header = null
  for (const raw of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (/^(`{3,}|~{3,})/.test(line)) {
      fenced = !fenced
      continue
    }
    if (fenced) continue
    if (/^#{1,6}\s/.test(line)) inSources = SOURCE_HEADING.test(line)
    if (!line.startsWith('|')) header = null
    if (inSources || !line || /^(!\[|〔|<)/.test(line)) continue
    let text = line
    if (line.startsWith('|')) {
      if (/^\|[\s:|-]+\|$/.test(line)) continue
      const cells = tableCells(line)
      if (!header) header = cells
      text = cells
        .filter((cell, index) => !ORIGINAL_LABEL.test(header[index] || '') && !(index > 0 && ORIGINAL_LABEL.test(cells[0])))
        .join('｜')
    }
    text = text
      .replace(FACT_TAG, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
    text = stripParentheses(text)
    text = text.replace(/「[^「」]*」/g, (match) => {
      if (KANA.test(match) || JAPANESE_KANJI_PATTERN.test(match)) quoted.push(match)
      return ''
    })
    terms.push(...(text.match(JAPANESE_TERM) || []))
    styleWords.push(...(text.match(JAPANESE_STYLE_PATTERN) || []))
  }
  const unique = [...new Set(terms)]
  const issues = []
  const warnings = []
  if (terms.length) {
    issues.push(
      `括號外有日文${terms.length}處，店名、旅館名、菜名、站名第一次寫「繁中譯名（日文原名）」，之後只寫中文，譯名照 content-planning/glossary.json：${unique.slice(0, 12).join('、')}`,
    )
  }
  if (styleWords.length) {
    issues.push(
      `日式用詞${styleWords.length}處，改成台灣說法：${[...new Set(styleWords)].map((word) => `${word}→${JAPANESE_STYLE_WORDS[word]}`).join('；')}`,
    )
  }
  if (quoted.length > MAX_QUOTED_JAPANESE) {
    warnings.push(`「」裡的日文有${quoted.length}處，只留讀者要在畫面或招牌上認的字：${[...new Set(quoted)].slice(0, 8).join('')}`)
  }
  return {issues, warnings, terms: unique, quoted, styleWords: [...new Set(styleWords)]}
}

export function checkVoice(markdown, {final = false, showRates = false} = {}) {
  const paragraphs = bodyParagraphs(markdown)
  const result = measure(paragraphs)
  const issues = []
  if (result.chars === 0) return {result, issues, warnings: []}
  const tone = checkAiTone(paragraphs, {final, showRates})
  issues.push(...tone.issues)
  const warnings = [...tone.warnings]
  const japanese = checkJapanese(markdown)
  issues.push(...japanese.issues)
  warnings.push(...japanese.warnings)
  for (const [key, limit] of Object.entries(LIMITS)) {
    if (!BLOCKING_LIMITS.has(key)) continue
    if (result[key] <= limit) continue
    const value = Number.isInteger(result[key]) ? result[key] : result[key].toFixed(1)
    const unit = key === 'avgSentence' ? '字' : key === 'comeHere' || key === 'notFound' ? '次' : ''
    issues.push(`${LABELS[key]}${value}${unit}（上限${limit}），${HINTS[key]}`)
  }
  return {result, issues, warnings}
}

export function resolveTarget(target) {
  const resolved = path.resolve(target)
  return statSync(resolved).isDirectory() ? path.join(resolved, 'reader-preview.md') : resolved
}

export function checkVoiceTarget(target, options = {}) {
  const file = resolveTarget(target)
  return {file, ...checkVoice(readFileSync(file, 'utf8'), options)}
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) {
  const args = process.argv.slice(2)
  const asJson = args.includes('--json')
  const final = args.includes('--final')
  const showRates = args.includes('--rates')
  const targets = args.filter((arg) => !arg.startsWith('--'))
  if (targets.length === 0) {
    console.error('用法：node check-voice.mjs <文章封包資料夾或 .md 檔> [...更多] [--final] [--json]')
    process.exit(2)
  }
  const reports = targets.map((target) => checkVoiceTarget(target, {final, showRates}))
  if (asJson) {
    console.log(JSON.stringify(reports.map(({file, result, issues, warnings}) => ({file, status: issues.length ? 'voice_failed' : 'voice_clear', issues, warnings, result})), null, 2))
  } else {
    for (const {file, result, issues, warnings} of reports) {
      console.log(`${issues.length ? '未通過' : '通過'}：${file}（正文${result.chars}字）`)
      for (const issue of issues) console.log(`  - ${issue}`)
      for (const warning of warnings) console.log(`  提醒：${warning}`)
      if (showRates) for (const sentence of result.longest) console.log(`  長句：${sentence}`)
    }
  }
  if (reports.some(({issues}) => issues.length > 0)) process.exitCode = 1
}
