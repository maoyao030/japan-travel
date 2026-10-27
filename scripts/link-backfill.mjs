/**
 * 補內連的純函式：在 Portable Text 正文裡把一段錨文字加上連結標記，可見文字一個字都不變。
 * 移植自好材誌 contextual-link-backlog-policy.mjs 的 addContextualLinkToPortableText，
 * 改成可以只給連結句與錨文字，自動找出唯一的區塊。
 */
import {createHash} from 'node:crypto'

const hasText = (value) => typeof value === 'string' && value.trim().length > 0
const isSitePath = (value) => typeof value === 'string' && /^\/[a-z0-9/-]*\/$/.test(value)

export function deterministicKey(prefix, parts) {
  return `${prefix}${createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 10)}`
}

export function blockText(block) {
  return (block?.children ?? []).map((child) => child?.text ?? '').join('')
}

/** 整篇的可見文字，用來證明補連結前後沒有改字。 */
export function visibleText(body) {
  return (body ?? []).filter((block) => block?._type === 'block').map(blockText).join('\n')
}

/** 找出包含連結句（沒有就用錨文字）的唯一段落；找不到或不唯一都拒絕。 */
export function findLinkBlock(body, {sentence, anchorText}) {
  const needle = hasText(sentence) ? sentence : anchorText
  const matches = (body ?? []).filter((block) => block?._type === 'block' && blockText(block).includes(needle))
  if (matches.length === 0) throw new Error(`正文找不到連結句：${needle.slice(0, 40)}`)
  if (matches.length > 1) throw new Error(`連結句在正文出現不只一次：${needle.slice(0, 40)}`)
  if (hasText(sentence) && !sentence.includes(anchorText)) throw new Error('錨文字必須在連結句裡')
  return matches[0]
}

export function addLinkToPortableText(body, proposal) {
  if (!Array.isArray(body)) throw new Error('來源文章正文不是 Portable Text 陣列')
  if (!hasText(proposal?.anchorText)) throw new Error('缺少錨文字 anchorText')
  if (!isSitePath(proposal?.targetPath)) throw new Error('targetPath 必須是以斜線開頭與結尾的站內路徑')
  const block = proposal.blockKey
    ? body.find((candidate) => candidate?._type === 'block' && candidate?._key === proposal.blockKey)
    : findLinkBlock(body, proposal)
  if (!block) throw new Error(`找不到指定正文區塊：${proposal.blockKey}`)

  const linkKeys = new Set((block.markDefs ?? []).filter((definition) => definition?._type === 'link').map((definition) => definition._key))
  if ((block.markDefs ?? []).some((definition) => definition?._type === 'link' && definition.href === proposal.targetPath)) {
    throw new Error('這個段落已經連到同一個網址')
  }
  // 錨文字的位置：有連結句就找連結句裡的錨文字（同一句出現兩次取最後一個，也就是「見○○」那個），
  // 段落前面提到同一個地名不影響；沒有連結句時，錨文字在整段只能出現一次。
  const text = blockText(block)
  let anchorStart
  if (hasText(proposal.sentence)) {
    const sentenceStart = text.indexOf(proposal.sentence)
    if (sentenceStart < 0) throw new Error(`正文找不到連結句：${proposal.sentence.slice(0, 40)}`)
    if (text.indexOf(proposal.sentence, sentenceStart + 1) >= 0) throw new Error('連結句在同一段出現不只一次')
    anchorStart = sentenceStart + proposal.sentence.lastIndexOf(proposal.anchorText)
  } else {
    if (text.split(proposal.anchorText).length - 1 !== 1) throw new Error('錨文字必須完整且只出現在同一個文字片段一次')
    anchorStart = text.indexOf(proposal.anchorText)
  }
  let offset = 0
  let span = null
  let start = -1
  for (const child of block.children ?? []) {
    const length = (child?.text ?? '').length
    if (anchorStart >= offset && anchorStart + proposal.anchorText.length <= offset + length) {
      if (child?._type === 'span' && typeof child.text === 'string') {
        span = child
        start = anchorStart - offset
      }
      break
    }
    offset += length
  }
  if (!span) throw new Error('錨文字必須完整且只出現在同一個文字片段一次')
  if ((span.marks ?? []).some((mark) => linkKeys.has(mark))) throw new Error('錨文字已經在別的連結裡')

  const before = span.text.slice(0, start)
  const after = span.text.slice(start + proposal.anchorText.length)
  const keyParts = [proposal.sourceArticleId ?? '', block._key, proposal.targetPath, proposal.anchorText]
  const linkMarkKey = deterministicKey('link', keyParts)
  const replacement = []
  if (before) replacement.push({...span, text: before})
  replacement.push({
    ...span,
    _key: before ? deterministicKey('span', [...keyParts, 'anchor']) : span._key,
    text: proposal.anchorText,
    marks: [...(span.marks ?? []), linkMarkKey],
  })
  if (after) replacement.push({...span, _key: deterministicKey('span', [...keyParts, 'after']), text: after})

  const children = block.children.flatMap((child) => (child === span ? replacement : [child]))
  const updatedBlock = {...block, children, markDefs: [...(block.markDefs ?? []), {_key: linkMarkKey, _type: 'link', href: proposal.targetPath}]}
  const updatedBody = body.map((candidate) => (candidate === block ? updatedBlock : candidate))
  if (visibleText(updatedBody) !== visibleText(body)) throw new Error('補連結後可見文字改變了，拒絕寫入')
  return {body: updatedBody, linkMarkKey, blockKey: block._key}
}

/**
 * 文章上線時，從群大綱找出「從這篇出發」的連結，全部登記成待補內連。
 * 目標已經上線的也登記：文章可能在目標上線前就寫好（積壓的稿子、同一批上線），連結句還是純文字；
 * 補內連時正文已經有連結的，apply-pending-link 會回「已經連到同一個網址」，標記已補即可。
 * publishedArticleIds：保留參數，相容舊的呼叫；pagePaths：articleId → 網址。
 */
export function pendingLinksFromOutline({outline, articleId, pagePaths = {}}) {
  return (outline?.links ?? [])
    .filter((link) => link.from === articleId && hasText(link.sentence) && hasText(link.anchor))
    .map((link) => ({
      fromArticleId: link.from,
      toArticleId: link.to,
      section: link.section ?? null,
      sentence: link.sentence,
      anchorText: link.anchor,
      targetPath: pagePaths[link.to] ?? (outline.pages ?? []).find((page) => page.articleId === link.to)?.targetPath ?? null,
      source: link.external ? 'cross-group' : 'outline',
    }))
}

/** 這條連結句所在的段落是不是已經連到目標網址。找不到或不唯一的句子算沒連上。 */
export function isLinkInBody(body, link) {
  try {
    const block = findLinkBlock(body, {sentence: link.sentence, anchorText: link.anchorText})
    return (block.markDefs ?? []).some((definition) => definition?._type === 'link' && definition.href === link.targetPath)
  } catch {
    return false
  }
}

/**
 * 文章上線前，把大綱裡「從這篇出發、目標已經上線」的連結句直接加上連結，不用等之後補內連。
 * 已經有連結的跳過；找不到句子的不改字，留給之後登記與補內連處理。
 * publishedArticleIds：已開放索引的文章；pagePaths：articleId → 網址。
 */
export function linkOutlineSentencesAtPublish(body, {outline, articleId, publishedArticleIds = [], pagePaths = {}}) {
  const published = new Set(publishedArticleIds)
  const candidates = pendingLinksFromOutline({outline, articleId, pagePaths}).filter(
    (link) => link.toArticleId !== articleId && published.has(link.toArticleId) && link.targetPath,
  )
  let current = body
  const linked = []
  const alreadyLinked = []
  const notLinked = []
  for (const link of candidates) {
    const summary = {toArticleId: link.toArticleId, targetPath: link.targetPath, anchorText: link.anchorText}
    if (isLinkInBody(current, link)) {
      alreadyLinked.push(summary)
      continue
    }
    try {
      current = addLinkToPortableText(current, {
        sourceArticleId: articleId,
        targetPath: link.targetPath,
        anchorText: link.anchorText,
        sentence: link.sentence,
      }).body
      linked.push(summary)
    } catch (error) {
      notLinked.push({...summary, reason: error.message})
    }
  }
  return {body: current, linked, alreadyLinked, notLinked}
}
