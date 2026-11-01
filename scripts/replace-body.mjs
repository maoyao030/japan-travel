/**
 * 已上線文章整篇換正文（2026-11-01，讀競品與先刪再調的重寫稿換上網站時建立）。
 * 改字的修訂用 revise-body-text.mjs；段落數或句子結構整個變了時用這裡：
 * 從新的 reader-preview.md 重建正文，再把線上正文的文內照片、嵌入與站內連結搬過來。
 * - 照片與嵌入：記下它在線上正文的哪個 H2／H3 底下、前面有幾個一般區塊，放回新正文的同一個位置。
 * - 站內連結：用線上的錨文字與所在的句子找新正文；句子改了就只找錨文字（全文只能出現一次）。
 * 搬不過去的列在 notCarried，交給呼叫的程式決定要不要寫入。
 * Sanity 端的讀寫在 studio/scripts/replace-article-body.mjs。
 */
import {addLinkToPortableText, blockText, visibleText} from './link-backfill.mjs'
import {parseMarkdownBody} from './markdown-to-portable-text.mjs'

const isSitePath = (value) => typeof value === 'string' && /^\/[a-z0-9/-]*\/$/.test(value)
const isHeading = (block) => block?._type === 'block' && (block.style === 'h2' || block.style === 'h3')
/** markdown 轉不出來、要從線上搬過來的區塊（照片、嵌入等）。 */
const isCarried = (block) => block?._type !== 'block' && block?._type !== 'contentTable'

/** 線上正文的照片與嵌入，各自在哪個標題底下、前面有幾個一般區塊。 */
export function carriedBlockPlacements(body) {
  const placements = []
  let heading = null
  let counted = 0
  for (const block of body ?? []) {
    if (isHeading(block)) {
      heading = blockText(block).trim()
      counted = 0
    } else if (isCarried(block)) {
      placements.push({block, heading, afterBlocks: counted})
    } else counted += 1
  }
  return placements
}

function insertCarried(body, {block, heading, afterBlocks}) {
  const start = heading === null ? -1 : body.findIndex((candidate) => isHeading(candidate) && blockText(candidate).trim() === heading)
  if (heading !== null && start < 0) return {body, error: `新正文找不到標題「${heading}」`}
  if (heading !== null && body.filter((candidate) => isHeading(candidate) && blockText(candidate).trim() === heading).length > 1) {
    return {body, error: `新正文有不只一個標題叫「${heading}」`}
  }
  let index = start
  let counted = 0
  // 往下數 afterBlocks 個一般區塊；前面已經放回去的照片或嵌入也跳過，同一節的順序不變
  while (index + 1 < body.length && !isHeading(body[index + 1]) && (counted < afterBlocks || isCarried(body[index + 1]))) {
    index += 1
    if (!isCarried(body[index])) counted += 1
  }
  const shortened = counted < afterBlocks
  return {body: [...body.slice(0, index + 1), block, ...body.slice(index + 1)], shortened}
}

/** 線上正文的站內連結：錨文字、網址與所在的句子。 */
export function siteLinks(body) {
  const links = []
  for (const block of body ?? []) {
    if (block?._type !== 'block') continue
    const hrefs = new Map((block.markDefs ?? []).filter((definition) => definition?._type === 'link').map((definition) => [definition._key, definition.href]))
    const text = blockText(block)
    let offset = 0
    for (const child of block.children ?? []) {
      const childText = child?.text ?? ''
      const href = (child?.marks ?? []).map((mark) => hrefs.get(mark)).find(Boolean)
      if (isSitePath(href)) {
        const sentenceStart = Math.max(...['。', '！', '？', '\n'].map((mark) => text.lastIndexOf(mark, offset - 1))) + 1
        const ends = ['。', '！', '？'].map((mark) => text.indexOf(mark, offset + childText.length)).filter((position) => position >= 0)
        const sentenceEnd = ends.length ? Math.min(...ends) + 1 : text.length
        links.push({anchorText: childText, targetPath: href, sentence: text.slice(sentenceStart, sentenceEnd)})
      }
      offset += childText.length
    }
  }
  return links
}

function hasLink(body, {anchorText, targetPath}) {
  return body.some((block) => {
    if (block?._type !== 'block') return false
    const keys = new Set((block.markDefs ?? []).filter((definition) => definition?._type === 'link' && definition.href === targetPath).map((definition) => definition._key))
    return (block.children ?? []).some((child) => child.text === anchorText && (child.marks ?? []).some((mark) => keys.has(mark)))
  })
}

export function rebuildBody(liveBody, markdown, {articleId} = {}) {
  let body = parseMarkdownBody(markdown).blocks
  const text = visibleText(body)
  const carried = []
  const notCarried = []

  for (const link of siteLinks(liveBody)) {
    if (hasLink(body, link)) {
      carried.push({kind: 'link', ...link, how: 'already'})
      continue
    }
    const attempts = [{sentence: link.sentence}, {sentence: undefined}]
    let done = false
    for (const attempt of attempts) {
      try {
        body = addLinkToPortableText(body, {sourceArticleId: articleId, targetPath: link.targetPath, anchorText: link.anchorText, sentence: attempt.sentence}).body
        carried.push({kind: 'link', ...link, how: attempt.sentence ? 'sentence' : 'anchor'})
        done = true
        break
      } catch {
        // 換下一種找法
      }
    }
    if (!done) notCarried.push({kind: 'link', ...link, reason: '新正文找不到同一句，錨文字也不是只出現一次'})
  }

  for (const placement of carriedBlockPlacements(liveBody)) {
    const result = insertCarried(body, placement)
    const summary = {kind: placement.block._type, key: placement.block._key, heading: placement.heading, afterBlocks: placement.afterBlocks}
    if (result.error) notCarried.push({...summary, reason: result.error})
    else {
      body = result.body
      carried.push({...summary, ...(result.shortened ? {note: '這一節的段落變少，放在這一節最後'} : {})})
    }
  }
  if (visibleText(body) !== text) throw new Error('搬連結後可見文字改變了')
  return {body, carried, notCarried}
}
