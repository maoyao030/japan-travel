/**
 * 站名與網域尚未決定（交接文件第一節）。先用暫定名稱，確定後只改這個檔案與 site.config.mjs。
 */
export const SITE_NAME = '日本旅遊長尾站'
export const EDITORIAL_AUTHOR_NAME = `${SITE_NAME}編輯部`
export const PAGE_TITLE_SEPARATOR = ' - '

/** 一句話說明網站給誰看、寫什麼；會放進 Organization 與 WebSite 結構化資料。 */
export const SITE_DESCRIPTION =
  `${SITE_NAME}是給台灣讀者看的日本旅遊實用資訊網站，整理小型溫泉地與鄉間的住宿選擇、各城市逐月的氣候與穿著、季節活動時間，以及地方料理與交通的實際安排，資料以旅館官網、觀光協會與氣象廳公開數據為準。`

/** 網站標誌檔案，供 Organization.logo 使用；Google 要求至少 112×112 像素、可被抓取的圖檔。 */
export const SITE_LOGO_PATH = '/logo.png'
export const SITE_LOGO_SIZE = 512

/** 官方社群帳號網址（Facebook、Instagram、YouTube 等）。有了再填，會以 Organization.sameAs 輸出。 */
export const ORGANIZATION_SAME_AS: string[] = []

/**
 * 產生 <title> 用的完整標題。
 * 若標題本身已含站名就原樣回傳，否則以「標題 - 站名」格式接上站名。
 */
export function formatPageTitle(title: string) {
  const trimmed = title.trim()
  if (!trimmed) return SITE_NAME
  if (trimmed.includes(SITE_NAME)) return trimmed
  return `${trimmed}${PAGE_TITLE_SEPARATOR}${SITE_NAME}`
}
