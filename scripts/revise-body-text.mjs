/**
 * 已上線文章的文字修訂：比對修改前後的 reader-preview.md，只把有變的字寫進 Sanity 正文。
 * 段落、標題、條列照字元比對改 span，連結、粗體、文內照片與內連都保留；表格只換有變的格子。
 * 用在不改結構的修訂（例如 2026-10-28 把日文名字改成中文寫法）。段落數、表格數不同時丟錯。
 * Sanity 端的讀寫在 studio/scripts/revise-article-text.mjs。
 */
import {parseMarkdownBody} from './markdown-to-portable-text.mjs'
import {blockPlainText} from './replace-paragraphs.mjs'

/** 字元層級的最短編輯：回傳每個舊字元留不留，以及每個間隔（0..n）要插入的字。 */
export function diffChars(before, after) {
  const a = [...before]
  const b = [...after]
  const rows = a.length + 1
  const cols = b.length + 1
  const lcs = Array.from({length: rows}, () => new Uint16Array(cols))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }
  const keep = new Array(a.length).fill(false)
  const inserts = Array.from({length: a.length + 1}, () => '')
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      keep[i] = true
      i += 1
      j += 1
    } else if (j < b.length && (i === a.length || lcs[i][j + 1] >= lcs[i + 1][j])) {
      inserts[i] += b[j]
      j += 1
    } else {
      i += 1
    }
  }
  return {chars: a, keep, inserts}
}

const isPlainSpan = (span) => !(span.marks ?? []).some((mark) => mark !== 'strong')

/**
 * 把 block 的文字從 before 改成 after，盡量保留每個 span 的標記。
 * 插入在兩個 span 交界時放進沒有連結的那一邊，連結文字只有在原本就在連結裡改時才會變。
 */
export function reviseBlockSpans(block, after) {
  const spans = block.children ?? []
  if (spans.some((span) => span._type !== 'span')) throw new Error(`段落裡有非文字元素，不自動修改：${blockPlainText(block).slice(0, 30)}…`)
  const before = spans.map((span) => span.text ?? '').join('')
  const {chars, keep, inserts} = diffChars(before, after)
  const owner = []
  spans.forEach((span, index) => {
    for (const _ of span.text ?? '') owner.push(index)
  })
  const texts = spans.map(() => '')
  const gapOwner = (gap) => {
    if (owner.length === 0) return 0
    if (gap === 0) return owner[0]
    if (gap === owner.length) return owner[owner.length - 1]
    const left = owner[gap - 1]
    const right = owner[gap]
    if (left === right) return left
    if (!isPlainSpan(spans[left]) && isPlainSpan(spans[right])) return right
    return left
  }
  for (let gap = 0; gap <= chars.length; gap += 1) {
    if (inserts[gap]) texts[gapOwner(gap)] += inserts[gap]
    if (gap < chars.length && keep[gap]) texts[owner[gap]] += chars[gap]
  }
  const linkTextChanged = spans.some((span, index) => !isPlainSpan(span) && span.text !== texts[index])
  const children = spans
    .map((span, index) => ({...span, text: texts[index]}))
    .filter((span, index, all) => span.text !== '' || all.length === 1)
  const usedMarks = new Set(children.flatMap((span) => span.marks ?? []))
  const markDefs = (block.markDefs ?? []).filter((definition) => usedMarks.has(definition._key))
  const revised = {...block, children, markDefs}
  if (blockPlainText(revised) !== after) throw new Error(`修改後文字不一致：${after.slice(0, 30)}…`)
  return {block: revised, linkTextChanged}
}

const blockKind = (block) => (block._type === 'contentTable' ? 'table' : block._type === 'block' ? 'text' : block._type)

/**
 * body：Sanity 上的正文；beforeMarkdown、afterMarkdown：修改前後的 reader-preview.md。
 * 回傳 {body, changes, unmatched}。找不到或找到多個對應的段落列在 unmatched，不做部分猜測。
 */
export function reviseBodyText(body, beforeMarkdown, afterMarkdown) {
  const before = parseMarkdownBody(beforeMarkdown).blocks
  const after = parseMarkdownBody(afterMarkdown).blocks
  if (before.length !== after.length) throw new Error(`修改前後的段落數不同（${before.length}／${after.length}），這個工具只處理不改結構的修訂`)
  const next = [...body]
  const changes = []
  const unmatched = []
  before.forEach((oldBlock, index) => {
    const newBlock = after[index]
    if (blockKind(oldBlock) !== blockKind(newBlock)) throw new Error(`第 ${index + 1} 段的種類不同，不自動修改`)
    if (blockKind(oldBlock) === 'text') {
      const oldText = blockPlainText(oldBlock)
      const newText = blockPlainText(newBlock)
      if (oldText === newText) return
      // 早期上線的延伸資料，標籤是連結、網址還留在句尾當文字；這種只多一個網址的也算同一段
      const trailingUrl = (block) => {
        const text = blockPlainText(block)
        if (text === oldText) return ''
        const rest = text.startsWith(oldText) ? text.slice(oldText.length) : null
        return rest !== null && /^https?:\/\/\S+$/.test(rest) ? rest : null
      }
      const matches = next.map((block, position) => ({block, position})).filter(({block}) => block._type === 'block' && trailingUrl(block) !== null)
      if (matches.length !== 1) {
        unmatched.push({kind: 'text', count: matches.length, before: oldText, after: newText})
        return
      }
      const [{block, position}] = matches
      const {block: revised, linkTextChanged} = reviseBlockSpans(block, newText + trailingUrl(block))
      next[position] = revised
      changes.push({kind: 'text', blockKey: block._key, style: block.style, before: oldText, after: newText, linkTextChanged})
      return
    }
    if (blockKind(oldBlock) === 'table') {
      const same = (left, right) => JSON.stringify(left) === JSON.stringify(right)
      if (same(oldBlock.columns, newBlock.columns) && same(oldBlock.rows.map((row) => row.cells), newBlock.rows.map((row) => row.cells))) return
      if (oldBlock.rows.length !== newBlock.rows.length) throw new Error(`表格「${oldBlock.columns.join('｜')}」列數不同`)
      const matches = next
        .map((block, position) => ({block, position}))
        .filter(({block}) => block._type === 'contentTable' && same(block.columns, oldBlock.columns) && same(block.rows.map((row) => row.cells), oldBlock.rows.map((row) => row.cells)))
      if (matches.length !== 1) {
        unmatched.push({kind: 'table', count: matches.length, before: oldBlock.columns.join('｜'), after: newBlock.columns.join('｜')})
        return
      }
      const [{block, position}] = matches
      next[position] = {
        ...block,
        columns: newBlock.columns,
        rows: block.rows.map((row, rowIndex) => ({...row, cells: newBlock.rows[rowIndex].cells})),
      }
      const cellChanges = []
      oldBlock.rows.forEach((row, rowIndex) =>
        row.cells.forEach((cell, cellIndex) => {
          const updated = newBlock.rows[rowIndex].cells[cellIndex]
          if (cell !== updated) cellChanges.push({before: cell, after: updated})
        }),
      )
      oldBlock.columns.forEach((cell, cellIndex) => {
        if (cell !== newBlock.columns[cellIndex]) cellChanges.push({before: cell, after: newBlock.columns[cellIndex]})
      })
      changes.push({kind: 'table', blockKey: block._key, cells: cellChanges})
    }
  })
  return {body: next, changes, unmatched}
}
