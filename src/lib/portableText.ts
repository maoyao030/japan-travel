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

export type ArticleBodyBlock =
  | PortableTextBlock
  | ContentTable
  | ArticleImage
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
            html = `<a href="${escapeHtml(href)}"${external ? ' rel="noopener noreferrer"' : ''}>${html}</a>`
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
      const columns = (block.columns ?? []).map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join('')
      const rows = (block.rows ?? [])
        .map(
          (row) =>
            `<tr>${(row.cells ?? []).map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`,
        )
        .join('')
      html += `<div class="article-table-scroll" tabindex="0"><table><thead><tr>${columns}</tr></thead><tbody>${rows}</tbody></table></div>`
      continue
    }

    if (block._type === 'image') {
      closeList()
      html += renderImage(block as ArticleImage)
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
