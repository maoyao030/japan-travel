// 文內照片插在正文哪裡、長什麼樣子。準備程式與 Sanity 上傳程式共用。

export const INLINE_IMAGE_KEY_PREFIX = 'inline-image-'
export const MEDIA_EMBED_KEY_PREFIX = 'media-embed-'

export function inlineImageKey(slotId) {
  if (!/^[a-z0-9-]+$/.test(slotId)) throw new Error(`slotId 只能用小寫英數與連字號：${slotId}`)
  return `${INLINE_IMAGE_KEY_PREFIX}${slotId}`
}

function blockText(block) {
  return (block?.children ?? []).map((child) => child.text ?? '').join('').trim()
}

function isHeading(block) {
  return block?._type === 'block' && (block.style === 'h2' || block.style === 'h3')
}

/**
 * 找出照片要接在哪個區塊後面。
 * placement.heading：照片所在那一節的 H2 或 H3 全文。
 * placement.afterBlocks：從標題往下數第幾個區塊之後（預設 1，就是標題下第一段之後）。
 * 已經插過的文內照片與嵌入不算進區塊數，重跑時位置不變。
 * skipPrefixes：不算進區塊數的 _key 前綴；嵌入用時只略過嵌入，照片照算（放在照片之後）。
 */
export function findInsertionKey(body, placement, {skipPrefixes = [INLINE_IMAGE_KEY_PREFIX, MEDIA_EMBED_KEY_PREFIX]} = {}) {
  if (!Array.isArray(body)) throw new Error('文章正文不是陣列')
  const heading = placement?.heading
  if (typeof heading !== 'string' || heading.trim() === '') throw new Error('placement.heading 必須填標題全文')
  const afterBlocks = placement.afterBlocks ?? 1
  if (!Number.isInteger(afterBlocks) || afterBlocks < 0) throw new Error('placement.afterBlocks 必須是 0 以上的整數')

  const matches = body.flatMap((block, index) => (isHeading(block) && blockText(block) === heading ? [index] : []))
  if (matches.length === 0) throw new Error(`正文找不到標題「${heading}」`)
  if (matches.length > 1) throw new Error(`正文有 ${matches.length} 個標題都叫「${heading}」`)

  let index = matches[0]
  let counted = 0
  while (counted < afterBlocks) {
    index += 1
    const block = body[index]
    if (!block) throw new Error(`「${heading}」底下不到 ${afterBlocks} 個區塊`)
    if (skipPrefixes.some((prefix) => block._key?.startsWith(prefix))) continue
    if (isHeading(block)) throw new Error(`「${heading}」底下不到 ${afterBlocks} 個區塊就到下一個標題`)
    counted += 1
  }
  const key = body[index]._key
  if (typeof key !== 'string' || key === '') throw new Error(`「${heading}」底下的區塊沒有 _key`)
  return key
}

/** 圖片封包裡的文字欄位轉成 Sanity 正文的圖片區塊（不含 asset）。 */
export function inlineImageFields(slot, candidate) {
  for (const field of ['altDraft', 'captionDraft', 'creditDraft']) {
    if (typeof candidate?.[field] !== 'string' || candidate[field].trim() === '') {
      throw new Error(`${slot.slotId} 已選定的照片缺少 ${field}`)
    }
  }
  return {
    alt: candidate.altDraft,
    caption: candidate.captionDraft,
    credit: candidate.creditDraft,
    ...(candidate.sourcePageUrl ? {sourcePageUrl: candidate.sourcePageUrl} : {}),
    ...(candidate.licenseName ? {license: candidate.licenseName} : {}),
  }
}

/** 圖片封包裡已選定、而且有 placement 與 preparation 的文內照片。 */
export function selectedInlineSlots(plan) {
  if (plan.status !== 'selected') throw new Error('圖片封包尚未選定')
  return (plan.slots ?? []).flatMap((slot) => {
    if (slot.kind !== 'inline' || !slot.placement) return []
    const candidateId = plan.selectedCandidateIds?.[slot.slotId]
    const candidate = slot.candidates?.find((item) => item.candidateId === candidateId)
    if (!candidate) throw new Error(`${slot.slotId} 有 placement 但沒有已選定的候選`)
    if (!slot.preparation) throw new Error(`${slot.slotId} 有 placement 但沒有 preparation`)
    return [{slot, candidate, key: inlineImageKey(slot.slotId)}]
  })
}
