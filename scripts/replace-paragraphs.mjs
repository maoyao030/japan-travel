/**
 * 已上線文章的事實更正：把正文裡指定的段落換成新寫法，其他段落不動。
 * 只換「純文字或只有粗體、沒有連結」的段落，舊段落的文字要跟 Sanity 上一字不差、而且只出現一次。
 * Sanity 端的讀寫在 studio/scripts/replace-article-paragraphs.mjs。
 */
import {parseMarkdownBody} from './markdown-to-portable-text.mjs'

/** 段落的純文字（粗體記號拿掉）。 */
export function blockPlainText(block) {
  return (block?.children ?? []).map((child) => child.text ?? '').join('')
}

/** 去掉事實編號與 Markdown 粗體，給比對用。 */
export function markdownPlainText(markdown) {
  return markdown.replace(/\s*\[F\d+(?:,\s*F\d+)*\]/g, '').replace(/\*\*/g, '').trim()
}

function isPlainBlock(block) {
  if (block?._type !== 'block' || (block.markDefs ?? []).length > 0) return false
  return (block.children ?? []).every((span) => span._type === 'span' && span.marks.every((mark) => mark === 'strong'))
}

/**
 * replacements：[{old, new}]，old 與 new 都是一個段落的 Markdown（可以帶事實編號，會先拿掉）。
 * 回傳 {body, changed}；找不到、找到多個或段落有連結時丟錯，不做部分替換。
 */
export function replaceParagraphs(body, replacements) {
  const next = [...body]
  const changed = []
  for (const replacement of replacements) {
    const oldText = markdownPlainText(replacement.old)
    const newMarkdown = markdownPlainText(replacement.new)
    const matches = next.map((block, index) => ({block, index})).filter(({block}) => blockPlainText(block) === oldText)
    if (matches.length !== 1) throw new Error(`舊段落要剛好出現一次，實際 ${matches.length} 次：${oldText.slice(0, 30)}…`)
    const [{block, index}] = matches
    if (!isPlainBlock(block)) throw new Error(`段落有連結或其他標記，不自動替換：${oldText.slice(0, 30)}…`)
    const parsed = parseMarkdownBody(`# x\n\n${newMarkdown}`).blocks
    if (parsed.length !== 1 || parsed[0]._type !== 'block' || parsed[0].markDefs.length > 0) {
      throw new Error(`新段落要是一個不含連結的段落：${newMarkdown.slice(0, 30)}…`)
    }
    const prefix = block._key
    next[index] = {
      ...block,
      children: parsed[0].children.map((child) => ({...child, _key: `${prefix}${child._key}`})),
      markDefs: [],
    }
    changed.push({blockKey: block._key, before: oldText, after: blockPlainText(next[index])})
  }
  return {body: next, changed}
}
