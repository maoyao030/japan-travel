/**
 * 每日優化提醒：每天挑一篇還沒手動優化過的上線文章，推給 Darren。
 * 不用記狀態：照優先順序排好，從 START_DAY 起每天往下一篇，排完再從頭；優化過的文章自動不再出現。
 * 段落提示只用字數與逗號算，不做 AI 判斷，讓 Darren 知道先從哪幾段下手。
 */
import {addDays, taipeiDate} from './manual-edits.mjs'

export const START_DAY = '2026-11-04'
export const STUDIO_URL = 'https://offpathnotes.sanity.studio'
export const SITE_URL = 'https://offpathnotes.com'

// 住宿頁是收入主幹，排最前面；其次是讀者最常卡住的交通，天氣這類流量頁放後面。
const ASPECT_ORDER = ['stay', 'transport', 'sight', 'hiking', 'food', 'festival', 'weather', 'other']
export const ASPECT_NAMES = {
  stay: '住宿',
  transport: '交通',
  sight: '景點',
  hiking: '登山與步道',
  food: '美食',
  festival: '祭典',
  weather: '天氣',
  other: '地點主頁或其他',
}

// 後台的「面向」欄位目前沒填，從網址代稱判斷頁型；沒對到的是地點主頁或跨地點頁。
const SLUG_ASPECTS = {
  stay: 'stay',
  transport: 'transport',
  ferry: 'transport',
  sights: 'sight',
  ropeway: 'sight',
  hiking: 'hiking',
  food: 'food',
  festival: 'festival',
  weather: 'weather',
}
export const aspectOf = (article) =>
  ASPECT_ORDER.includes(article.aspect) ? article.aspect : (SLUG_ASPECTS[article.slug] ?? 'other')

const isEdited = (article) => (article.studioEditLog ?? []).length > 0 || Boolean(article.studioEditedAt)

/** 還沒優化的上線文章，照優先順序排：面向，再來是越早上線的越前面。 */
export function rankCandidates(articles) {
  const order = (aspect) => {
    const index = ASPECT_ORDER.indexOf(aspect)
    return index === -1 ? ASPECT_ORDER.length : index
  }
  return articles
    .filter((article) => article.noindex !== true && article.path && !isEdited(article))
    .sort(
      (a, b) =>
        order(aspectOf(a)) - order(aspectOf(b)) ||
        String(a.publishedAt ?? '').localeCompare(String(b.publishedAt ?? '')) ||
        a.id.localeCompare(b.id),
    )
}

/**
 * 今天輪到哪一篇。扣掉已經優化的篇數，優化掉一篇後隔天接著下一篇，不會跳過；沒優化就照常往下一篇。
 */
export function pickForDay(candidates, day, editedCount = 0) {
  if (candidates.length === 0) return null
  const days = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${START_DAY}T00:00:00Z`)) / 86400000)
  const step = days - editedCount
  const index = ((step % candidates.length) + candidates.length) % candidates.length
  return candidates[index]
}

/** 逗號最密、最長的幾段，給 Darren 當起點。 */
export function paragraphHints(body, limit = 3) {
  const paragraphs = (body ?? [])
    .filter((block) => block._type === 'block' && (block.style ?? 'normal') === 'normal' && !block.listItem)
    .map((block) => (block.children ?? []).map((child) => child.text ?? '').join('').trim())
    .filter((text) => text.length >= 60)
  return paragraphs
    .map((text) => {
      const sentences = Math.max(1, text.split(/[。！？]/).filter((part) => part.trim() !== '').length)
      const commas = (text.match(/，/g) ?? []).length
      return {text, length: text.length, commasPerSentence: commas / sentences}
    })
    .sort((a, b) => b.commasPerSentence * Math.sqrt(b.length) - a.commasPerSentence * Math.sqrt(a.length))
    .slice(0, limit)
}

export function buildDailyMessage({articles, day}) {
  const live = articles.filter((article) => article.noindex !== true && article.path)
  const candidates = rankCandidates(articles)
  const editedCount = live.filter(isEdited).length
  const pick = pickForDay(candidates, day, editedCount)
  if (!pick) {
    return `今天（${day}）沒有要提醒的文章：上線的 ${live.length} 篇都手動優化過了。`
  }
  const position = candidates.indexOf(pick) + 1
  const lines = [
    `今天（${day}）這篇還沒優化：${pick.title}`,
    '',
    `- 為什麼是這篇：${ASPECT_NAMES[aspectOf(pick)]}頁，還沒優化的 ${candidates.length} 篇裡排第 ${position}（住宿最前，其次交通、景點）。`,
    `- 網站上的樣子：${SITE_URL}${pick.path}`,
    `- 在後台改：${STUDIO_URL}/structure/live-articles;${pick.id}`,
    `- 進度：上線 ${live.length} 篇，已優化 ${editedCount} 篇。`,
  ]
  const hints = paragraphHints(pick.body)
  if (hints.length > 0) {
    lines.push('', '可以先看這幾段（句子裡逗號最多、讀起來最容易卡）：')
    hints.forEach((hint, index) => {
      const opening = hint.text.length > 40 ? `${hint.text.slice(0, 40)}…` : hint.text
      lines.push(`${index + 1}. 「${opening}」（${hint.length} 字，平均每句 ${hint.commasPerSentence.toFixed(1)} 個逗號）`)
    })
  }
  lines.push('', `改完在後台按「發布」就會記成一次優化；明天（${addDays(day, 1)}）換下一篇。`)
  return lines.join('\n')
}

export {taipeiDate}
