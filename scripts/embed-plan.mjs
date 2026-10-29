// 嵌入影片與 Instagram 貼文的封包（content-production/<id>/images/embed-plan.json）：檢查與轉成 Sanity 正文區塊。
// 格式見 .agents/skills/japan-travel-image-finder/references/embed-plan.md。

import {MEDIA_EMBED_KEY_PREFIX} from './inline-image-placement.mjs'

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/
const MAX_EMBEDS = 2

export function mediaEmbedKey(embedId) {
  if (!/^[a-z0-9-]+$/.test(embedId ?? '')) throw new Error(`embedId 只能用小寫英數與連字號：${embedId}`)
  return `${MEDIA_EMBED_KEY_PREFIX}${embedId}`
}

/** 把網址整理成固定格式；格式不對就丟錯。 */
export function canonicalEmbedUrl(platform, value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(`嵌入網址格式不對：${value}`)
  }
  if (url.protocol !== 'https:') throw new Error(`嵌入網址要用 HTTPS：${value}`)
  const host = url.hostname.replace(/^www\.|^m\./, '')
  if (platform === 'youtube') {
    const id = host === 'youtube.com' && url.pathname === '/watch' ? url.searchParams.get('v') : host === 'youtu.be' ? url.pathname.slice(1) : null
    if (!id || !YOUTUBE_ID.test(id)) throw new Error(`不是 YouTube 影片網址：${value}`)
    return `https://www.youtube.com/watch?v=${id}`
  }
  if (platform === 'instagram') {
    const match = host === 'instagram.com' ? url.pathname.match(/^\/(p|reel)\/([A-Za-z0-9_-]+)\/?$/) : null
    if (!match) throw new Error(`不是 Instagram 貼文網址：${value}`)
    return `https://www.instagram.com/${match[1]}/${match[2]}/`
  }
  throw new Error(`platform 只能是 youtube 或 instagram：${platform}`)
}

function monthsBetween(fromMonth, toDate) {
  const [year, month] = fromMonth.split('-').map(Number)
  const [toYear, toMonth] = toDate.split('-').map(Number)
  return (toYear - year) * 12 + (toMonth - month)
}

/** 檢查封包，回傳 [{embed, key, fields}]。 */
export function validateEmbedPlan(plan, {articleId} = {}) {
  if (plan?.schemaVersion !== 1) throw new Error('embed-plan.json 的 schemaVersion 必須是 1')
  if (articleId && plan.articleId !== articleId) throw new Error('embed-plan.json 的 articleId 與資料夾名稱不一致')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(plan.checkedAt ?? '')) throw new Error('checkedAt 要寫 YYYY-MM-DD')
  const embeds = plan.embeds ?? []
  if (!Array.isArray(embeds) || embeds.length === 0) throw new Error('embed-plan.json 沒有嵌入')
  if (embeds.length > MAX_EMBEDS) throw new Error(`一篇最多 ${MAX_EMBEDS} 個嵌入`)

  const headings = new Set()
  const ids = new Set()
  return embeds.map((embed) => {
    const key = mediaEmbedKey(embed.embedId)
    if (ids.has(embed.embedId)) throw new Error(`embedId 重複：${embed.embedId}`)
    ids.add(embed.embedId)
    const url = canonicalEmbedUrl(embed.platform, embed.url)
    for (const field of ['title', 'channelName', 'captionDraft', 'evidence']) {
      if (typeof embed[field] !== 'string' || embed[field].trim() === '') throw new Error(`${embed.embedId} 缺少 ${field}`)
    }
    if (!['official', 'individual'].includes(embed.channelType)) throw new Error(`${embed.embedId} 的 channelType 只能是 official 或 individual`)
    if (embed.platform === 'instagram' && embed.channelType !== 'official') throw new Error(`${embed.embedId}：Instagram 只用官方帳號`)
    if (!/^\d{4}-\d{2}$/.test(embed.publishedAt ?? '')) throw new Error(`${embed.embedId} 的 publishedAt 要寫 YYYY-MM`)
    const age = monthsBetween(embed.publishedAt, plan.checkedAt)
    if (age < 0 || age > 24) throw new Error(`${embed.embedId} 發布超過兩年或日期在查核日之後（${embed.publishedAt}）`)
    const checks = embed.checks ?? {}
    for (const check of ['publicAndEmbeddable', 'withinTwoYears', 'contentVerified', 'notMisleadingAd']) {
      if (checks[check] !== true) throw new Error(`${embed.embedId} 的 checks.${check} 不是 true`)
    }
    const heading = embed.placement?.heading
    if (typeof heading !== 'string' || heading.trim() === '') throw new Error(`${embed.embedId} 缺少 placement.heading`)
    if (headings.has(heading)) throw new Error(`同一節只能放一個嵌入：${heading}`)
    headings.add(heading)
    let startSeconds
    if (embed.platform === 'youtube') {
      startSeconds = embed.startSeconds ?? 0
      if (!Number.isInteger(startSeconds) || startSeconds < 0) throw new Error(`${embed.embedId} 的 startSeconds 要是 0 以上的整數`)
    } else if (embed.startSeconds !== undefined) {
      throw new Error(`${embed.embedId}：Instagram 不用 startSeconds`)
    }

    const fields = {
      platform: embed.platform,
      url,
      ...(startSeconds ? {startSeconds} : {}),
      title: embed.title,
      channelName: embed.channelName,
      publishedAt: embed.publishedAt,
      caption: embed.captionDraft,
    }
    return {embed, key, fields}
  })
}
