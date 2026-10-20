// 網站的根網址與 Sanity 專案設定。正式網域 offpathnotes.com（2026-10-20 購買）；
// 要換網域時改這裡的 DEFAULT_SITE_URL（或在 Cloudflare 設 SITE_URL 環境變數）。
export const DEFAULT_SITE_URL = 'https://offpathnotes.com/'

export function resolveSiteUrl(value = process.env.SITE_URL) {
  const siteUrl = new URL(value || DEFAULT_SITE_URL)

  if (!['http:', 'https:'].includes(siteUrl.protocol)) {
    throw new Error('SITE_URL 必須使用 http 或 https')
  }

  if (
    siteUrl.username ||
    siteUrl.password ||
    siteUrl.pathname !== '/' ||
    siteUrl.search ||
    siteUrl.hash
  ) {
    throw new Error('SITE_URL 必須是網站根網址，不能包含帳密、路徑、查詢參數或段落')
  }

  return new URL(siteUrl.origin + '/').href
}

// Sanity 專案 ID（公開 dataset，不是機密）。寫死預設值是記取好材誌的教訓：
// 建置環境漏設變數時，網站會「靜悄悄建成空站」照樣部署。
export const DEFAULT_SANITY_PROJECT_ID = 'e8ctf7ee'

/**
 * Sanity 是存文章的後台。預設用本站專案 e8ctf7ee、dataset production；
 * 環境變數 SANITY_PROJECT_ID／SANITY_DATASET 可以覆寫。
 * 只有明確設成 SANITY_PROJECT_ID=none 時才回傳 null，以「沒有任何文章」的狀態建置（測試骨架用）。
 */
export function resolveSanityConfig(env = process.env) {
  const rawProjectId = (env.SANITY_PROJECT_ID ?? '').trim()
  if (rawProjectId === 'none') return null
  const projectId = rawProjectId || DEFAULT_SANITY_PROJECT_ID
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    throw new Error('SANITY_PROJECT_ID 只能包含小寫英文、數字與連字號')
  }
  const dataset = (env.SANITY_DATASET ?? '').trim() || 'production'
  if (!/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error('SANITY_DATASET 只能包含小寫英文、數字、底線與連字號')
  }
  return {projectId, dataset}
}
