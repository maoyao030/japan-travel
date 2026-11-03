/**
 * 把 Sanity 文章正文（Portable Text）轉回本站稿件用的 Markdown，給「抓回後台手動修改」用。
 * 寫法照 reader-preview.md：站內連結只留文字（上線時才由工具加連結），站外連結寫成 [文字](網址)，
 * 照片與嵌入不輸出（換正文的工具會把線上的照片與嵌入搬到同一個位置）。
 * 輸出可以再用 markdown-to-portable-text.mjs 轉回去。
 */
import {parseMarkdownBody} from './markdown-to-portable-text.mjs'

function inlineText(block, {keepSiteLinks = false} = {}) {
  const linkDefs = new Map((block.markDefs ?? []).map((definition) => [definition._key, definition]))
  return (block.children ?? [])
    .map((child) => {
      let text = child.text ?? ''
      if (text === '') return ''
      const marks = child.marks ?? []
      const link = marks.map((mark) => linkDefs.get(mark)).find((definition) => definition?.href)
      if (marks.includes('strong') && !link) text = `**${text}**`
      if (link) {
        const isSiteLink = link.href.startsWith('/')
        if (!isSiteLink || keepSiteLinks) text = `[${text}](${link.href})`
      }
      return text
    })
    .join('')
}

/** 段落的純文字（不含任何標記），比對修改前後用。 */
export function blockPlainText(block) {
  if (block?._type === 'contentTable') {
    return [block.columns ?? [], ...(block.rows ?? []).map((row) => row.cells ?? [])]
      .map((cells) => cells.join('｜'))
      .join('\n')
  }
  if (block?._type !== 'block') return ''
  return (block.children ?? []).map((child) => child.text ?? '').join('')
}

function tableToMarkdown(block) {
  const row = (cells) => `| ${cells.map((cell) => String(cell ?? '').replaceAll('|', '｜')).join(' | ')} |`
  const columns = block.columns ?? []
  return [row(columns), `|${columns.map(() => '---').join('|')}|`, ...(block.rows ?? []).map((item) => row(item.cells ?? []))].join('\n')
}

/**
 * @param {string} title 文章 H1
 * @param {Array} body Sanity 的 body 陣列
 * @param {{keepSiteLinks?: boolean}} [options]
 */
export function portableTextToMarkdown(title, body, options = {}) {
  const chunks = [`# ${title}`]
  let previousList = null

  for (const block of body ?? []) {
    if (block._type === 'contentTable') {
      chunks.push(tableToMarkdown(block))
      previousList = null
      continue
    }
    if (block._type !== 'block') continue

    const text = inlineText(block, options).trim()
    if (text === '') continue

    if (block.listItem) {
      const line = `${block.listItem === 'number' ? '1.' : '-'} ${text}`
      if (previousList === block.listItem) chunks[chunks.length - 1] += `\n${line}`
      else chunks.push(line)
      previousList = block.listItem
      continue
    }
    previousList = null

    if (block.style === 'h2') chunks.push(`## ${text}`)
    else if (block.style === 'h3') chunks.push(`### ${text}`)
    else if (block.style === 'blockquote') chunks.push(`> ${text}`)
    else chunks.push(text)
  }

  return `${chunks.join('\n\n')}\n`
}

/**
 * 逐段比對兩份正文的純文字，列出改過、刪掉、新增的段落。
 * 回傳 [{type: 'changed'|'removed'|'added', before?, after?}]
 */
export function diffParagraphs(beforeParagraphs, afterParagraphs) {
  const n = beforeParagraphs.length
  const m = afterParagraphs.length
  const lcs = Array.from({length: n + 1}, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i][j] =
        beforeParagraphs[i] === afterParagraphs[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const steps = []
  let i = 0
  let j = 0
  while (i < n || j < m) {
    if (i < n && j < m && beforeParagraphs[i] === afterParagraphs[j]) {
      steps.push({type: 'same'})
      i += 1
      j += 1
    } else if (j < m && (i === n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      steps.push({type: 'added', after: afterParagraphs[j]})
      j += 1
    } else {
      steps.push({type: 'removed', before: beforeParagraphs[i]})
      i += 1
    }
  }

  // 相鄰的「刪掉一段、新增一段」合併成「改過」，讀起來才像修改前後對照。
  const result = []
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index]
    if (step.type === 'same') continue
    const removed = []
    const added = []
    while (index < steps.length && steps[index].type !== 'same') {
      if (steps[index].type === 'removed') removed.push(steps[index].before)
      else added.push(steps[index].after)
      index += 1
    }
    index -= 1
    const pairs = Math.min(removed.length, added.length)
    for (let k = 0; k < pairs; k += 1) result.push({type: 'changed', before: removed[k], after: added[k]})
    for (const before of removed.slice(pairs)) result.push({type: 'removed', before})
    for (const after of added.slice(pairs)) result.push({type: 'added', after})
  }
  return result
}

/** 把 Markdown 稿照網站的轉換規則拆成逐段純文字，和 blockPlainText 的結果可以直接比。 */
export function markdownParagraphs(markdown) {
  return parseMarkdownBody(markdown).blocks.map(blockPlainText).filter((text) => text !== '')
}
