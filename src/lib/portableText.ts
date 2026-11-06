export type PortableTextSpan = {
  _key?: string
  _type: 'span'
  marks?: string[]
  text: string
}

export type PortableTextMarkDefinition = {
  _key: string
  _type: 'link'
  href?: string
}

export type PortableTextBlock = {
  _key?: string
  _type: 'block'
  children?: PortableTextSpan[]
  level?: number
  listItem?: 'bullet' | 'number'
  markDefs?: PortableTextMarkDefinition[]
  style?: 'normal' | 'h2' | 'h3' | 'blockquote'
}

export type ContentTable = {
  _key?: string
  _type: 'contentTable'
  columns?: string[]
  rows?: Array<{_key?: string; cells?: string[]}>
}

export type ArticleImage = {
  _key?: string
  _type: 'image'
  alt?: string
  caption?: string
  credit?: string
  sourcePageUrl?: string
  license?: string
  url?: string
  width?: number
  height?: number
}

export type MediaEmbed = {
  _key?: string
  _type: 'mediaEmbed'
  platform?: 'youtube' | 'instagram'
  url?: string
  startSeconds?: number
  title?: string
  channelName?: string
  publishedAt?: string
  caption?: string
}

export type ArticleBodyBlock =
  | PortableTextBlock
  | ContentTable
  | ArticleImage
  | MediaEmbed
  | {_key?: string; _type: string}

export type ArticleHeading = {
  id: string
  level: 2 | 3
  text: string
}

export type ArticleFaqItem = {
  question: string
  answer: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function textFromBlock(block: PortableTextBlock) {
  return (block.children ?? []).map((child) => child.text).join('')
}

function normalizePlainText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function isFaqSectionHeading(block: PortableTextBlock) {
  if (block.style !== 'h2') return false
  return /(?:常見問題|\bfaq\b)/i.test(normalizePlainText(textFromBlock(block)))
}

function safeHref(value?: string) {
  if (!value) return null
  if (value.startsWith('/')) return value

  try {
    const url = new URL(value)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? value : null
  } catch {
    return null
  }
}

// 訂房分潤平台的網域；連到這些網站的連結要標 sponsored，讓搜尋引擎知道是有分潤的連結。
const AFFILIATE_HOSTS = ['trip.com', 'agoda.com']

export function isAffiliateHref(href: string) {
  try {
    const host = new URL(href).hostname.toLowerCase()
    return AFFILIATE_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

function externalRel(href: string) {
  return isAffiliateHref(href) ? 'sponsored noopener noreferrer' : 'noopener noreferrer'
}

// 表格格子可以放「[文字](網址)」連結（Darren 2026-11-04：住宿與景點的官網、Google 地圖）。
const CELL_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g

export function renderTableCell(cell: string) {
  let html = ''
  let last = 0
  for (const match of cell.matchAll(CELL_LINK)) {
    const href = safeHref(match[2])
    html += escapeHtml(cell.slice(last, match.index))
    html += href
      ? `<a href="${escapeHtml(href)}"${href.startsWith('/') ? '' : ` rel="${externalRel(href)}"`}>${escapeHtml(match[1])}</a>`
      : escapeHtml(match[0])
    last = (match.index ?? 0) + match[0].length
  }
  return html + escapeHtml(cell.slice(last))
}

function renderSpans(block: PortableTextBlock) {
  const definitions = new Map((block.markDefs ?? []).map((definition) => [definition._key, definition]))

  return (block.children ?? [])
    .map((span) => {
      let html = escapeHtml(span.text)

      for (const mark of span.marks ?? []) {
        if (mark === 'strong') html = `<strong>${html}</strong>`
        else if (mark === 'em') html = `<em>${html}</em>`
        else if (mark === 'code') html = `<code>${html}</code>`
        else {
          const href = safeHref(definitions.get(mark)?.href)
          if (href) {
            const external = href.startsWith('http')
            html = `<a href="${escapeHtml(href)}"${external ? ` rel="${externalRel(href)}"` : ''}>${html}</a>`
          }
        }
      }

      return html
    })
    .join('')
}

function renderImage(image: ArticleImage) {
  if (!image.url || !image.alt) return ''
  const size =
    image.width && image.height ? ` width="${image.width}" height="${image.height}"` : ''
  const source = image.sourcePageUrl ? safeHref(image.sourcePageUrl) : null
  const credit = image.credit
    ? source
      ? `<a href="${escapeHtml(source)}" rel="noopener noreferrer">${escapeHtml(image.credit)}</a>`
      : escapeHtml(image.credit)
    : ''
  const caption = [
    image.caption ? `<span>${escapeHtml(image.caption)}</span>` : '',
    credit ? `<small class="article-image-credit">${credit}</small>` : '',
  ].join('')
  return `<figure class="article-image"><img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt)}"${size} loading="lazy" decoding="async">${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`
}

/** YouTube 網址取出 11 碼影片 ID；不是 YouTube 影片網址就回傳 null。 */
// 格子是時間、數字或星等（「06:30」「-8.4°C」「5.7公里」「1小時30分」「★★」），不是一段說明
const UNIT_WORDS = /公里|小時|分鐘|日圓|[分天圓年月日時約班次人倍]/g
const CJK_CHAR = /[぀-ヿ一-鿿]/g
function isDataCell(cell: string) {
  const text = cell.trim()
  if (text === '' || text === '—' || text === '-') return true
  if (!/[\d★]/.test(text)) return false
  return (text.replace(UNIT_WORDS, '').match(CJK_CHAR) ?? []).length <= 1
}

// 表格在手機上的樣子（Darren 2026-11-06：住宿比較表在手機上擠成一格兩三個字）。
// 4 欄以上的比較表（住宿、店家、景點、步道）在手機上一列變成一張卡片；
// 時刻表、天氣表維持表格、左右滑：第一欄是時間或月份，或其他格子幾乎都是數字。
// 3 欄以下的表在手機上縮到螢幕寬，不用左右滑。
export function tableLayout(table: ContentTable): 'cards' | 'wide' | 'narrow' {
  const columnCount = table.columns?.length ?? 0
  if (columnCount <= 3) return 'narrow'
  const rows = table.rows ?? []
  const share = (cells: string[]) => (cells.length ? cells.filter(isDataCell).length / cells.length : 1)
  const firstColumn = share(rows.map((row) => row.cells?.[0] ?? ''))
  const otherColumns = share(rows.flatMap((row) => (row.cells ?? []).slice(1)))
  // 格子大多是一段說明（平均 12 個字以上）的，就算第一欄是月份也變卡片，例如「各季節的天氣與活動」
  const others = rows.flatMap((row) => (row.cells ?? []).slice(1)).map((cell) => cell.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'))
  const averageLength = others.length ? others.reduce((sum, cell) => sum + cell.length, 0) / others.length : 0
  if (averageLength >= 12) return 'cards'
  return firstColumn >= 0.5 || otherColumns >= 0.75 ? 'wide' : 'cards'
}

export function renderContentTable(table: ContentTable) {
  const columnNames = table.columns ?? []
  const layout = tableLayout(table)
  const columns = columnNames.map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join('')
  const rows = (table.rows ?? [])
    .map((row) => {
      const cells = (row.cells ?? [])
        .map((cell, index) => {
          const label = layout === 'cards' && columnNames[index] ? ` data-label="${escapeHtml(columnNames[index])}"` : ''
          const content = renderTableCell(cell)
          // 卡片的每一格是「欄名｜內容」兩欄，內容包成一塊，「官網・地圖」才不會被拆開
          return layout === 'cards' ? `<td${label}><span>${content}</span></td>` : `<td>${content}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    })
    .join('')
  return `<div class="article-table-scroll article-table--${layout}" tabindex="0"><table><thead><tr>${columns}</tr></thead><tbody>${rows}</tbody></table></div>`
}

export function youtubeVideoId(value?: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\.|^m\./, '')
    let id: string | null = null
    if (host === 'youtube.com') {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : (url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null)
    } else if (host === 'youtu.be') {
      id = url.pathname.slice(1)
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
  } catch {
    return null
  }
}

/** Instagram 貼文網址取出貼文類型與代碼；不是貼文網址就回傳 null。 */
export function instagramPost(value?: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.hostname.replace(/^www\./, '') !== 'instagram.com') return null
    const match = url.pathname.match(/^\/(p|reel)\/([A-Za-z0-9_-]+)\/?$/)
    return match ? {kind: match[1], code: match[2]} : null
  } catch {
    return null
  }
}

// 嵌入只先放縮圖或按鈕，讀者點了才載入 YouTube 或 Instagram（ArticlePage 的小程式負責換成 iframe）。
function renderEmbed(embed: MediaEmbed) {
  if (!embed.caption || !embed.channelName || !embed.title) return ''
  const year = /^\d{4}/.exec(embed.publishedAt ?? '')?.[0]
  const yearText = year ? `（${year}）` : ''

  if (embed.platform === 'youtube') {
    const id = youtubeVideoId(embed.url)
    if (!id) return ''
    const start = Number.isInteger(embed.startSeconds) && (embed.startSeconds ?? 0) > 0 ? (embed.startSeconds as number) : 0
    const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0${start ? `&start=${start}` : ''}`
    const watch = `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ''}`
    return `<figure class="article-embed article-embed-youtube"><div class="article-embed-frame"><button type="button" class="article-embed-play" data-embed-src="${escapeHtml(src)}" data-embed-title="${escapeHtml(embed.title)}"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async"><span class="article-embed-icon" aria-hidden="true"></span><span class="visually-hidden">播放 YouTube 影片：${escapeHtml(embed.title)}</span></button></div><figcaption><span>${escapeHtml(embed.caption)}</span><small class="article-embed-credit">影片：<a href="${escapeHtml(watch)}" rel="noopener noreferrer">${escapeHtml(embed.channelName)}</a>${yearText}・實際資訊以本文為準</small></figcaption></figure>`
  }

  if (embed.platform === 'instagram') {
    const post = instagramPost(embed.url)
    if (!post) return ''
    const permalink = `https://www.instagram.com/${post.kind}/${post.code}/`
    const src = `${permalink}embed/captioned/`
    return `<figure class="article-embed article-embed-instagram"><div class="article-embed-card"><p class="article-embed-card-title">Instagram 貼文・${escapeHtml(embed.channelName)}</p><button type="button" class="article-embed-load" data-embed-src="${escapeHtml(src)}" data-embed-title="${escapeHtml(embed.title)}">載入貼文</button><a href="${escapeHtml(permalink)}" rel="noopener noreferrer">在 Instagram 開啟</a></div><figcaption><span>${escapeHtml(embed.caption)}</span><small class="article-embed-credit">貼文：<a href="${escapeHtml(permalink)}" rel="noopener noreferrer">${escapeHtml(embed.channelName)}</a>${yearText}・實際資訊以本文為準</small></figcaption></figure>`
  }

  return ''
}

export function getArticleHeadings(blocks: ArticleBodyBlock[]): ArticleHeading[] {
  let headingNumber = 0

  return blocks.flatMap((block) => {
    if (block._type !== 'block' || (block.style !== 'h2' && block.style !== 'h3')) return []
    headingNumber += 1
    return [
      {
        id: `section-${headingNumber}`,
        level: block.style === 'h2' ? 2 : 3,
        text: textFromBlock(block),
      },
    ]
  })
}

export function getArticleFaqItems(blocks: ArticleBodyBlock[]): ArticleFaqItem[] {
  const faqItems: ArticleFaqItem[] = []
  const questions = new Set<string>()
  let inFaqSection = false

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index]
    if (block._type !== 'block') continue

    if (block.style === 'h2') {
      inFaqSection = isFaqSectionHeading(block)
      continue
    }
    if (!inFaqSection || block.style !== 'h3') continue

    const question = normalizePlainText(textFromBlock(block))
    if (!question) throw new Error('FAQ 含有空白問題')
    if (questions.has(question)) throw new Error(`FAQ 問題重複：${question}`)

    let answer = ''
    for (let answerIndex = index + 1; answerIndex < blocks.length; answerIndex += 1) {
      const answerBlock = blocks[answerIndex]
      if (
        answerBlock._type === 'block' &&
        (answerBlock.style === 'h2' || answerBlock.style === 'h3')
      ) {
        break
      }
      if (answerBlock._type !== 'block') continue

      answer = normalizePlainText(textFromBlock(answerBlock))
      if (answer) break
    }

    if (!answer) throw new Error(`FAQ 問題缺少答案：${question}`)
    questions.add(question)
    faqItems.push({question, answer})
  }

  return faqItems
}

export function renderPortableText(blocks: ArticleBodyBlock[]) {
  let html = ''
  let headingNumber = 0
  let activeList: 'bullet' | 'number' | null = null

  const closeList = () => {
    if (!activeList) return
    html += activeList === 'number' ? '</ol>' : '</ul>'
    activeList = null
  }

  for (const block of blocks) {
    if (block._type === 'contentTable') {
      closeList()
      html += renderContentTable(block as ContentTable)
      continue
    }

    if (block._type === 'image') {
      closeList()
      html += renderImage(block as ArticleImage)
      continue
    }

    if (block._type === 'mediaEmbed') {
      closeList()
      html += renderEmbed(block as MediaEmbed)
      continue
    }

    if (block._type !== 'block') continue

    const content = renderSpans(block)
    if (block.listItem) {
      if (activeList !== block.listItem) {
        closeList()
        activeList = block.listItem
        html += activeList === 'number' ? '<ol>' : '<ul>'
      }
      html += `<li>${content}</li>`
      continue
    }

    closeList()

    if (block.style === 'h2' || block.style === 'h3') {
      headingNumber += 1
      const tag = block.style
      html += `<${tag} id="section-${headingNumber}">${content}</${tag}>`
    } else if (block.style === 'blockquote') {
      html += `<blockquote>${content}</blockquote>`
    } else {
      html += `<p>${content}</p>`
    }
  }

  closeList()
  return html
}
