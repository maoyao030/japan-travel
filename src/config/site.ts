/**
 * 站名「繞路筆記」、網域 offpathnotes.com（Darren 2026-10-20 決定）。要改站名只改這個檔案。
 */
export const SITE_NAME = '繞路筆記'
export const EDITORIAL_AUTHOR_NAME = `${SITE_NAME}編輯部`
export const PAGE_TITLE_SEPARATOR = ' - '

/**
 * 網站簡介，放進 Organization 與 WebSite 結構化資料，也是首頁的 meta description。
 * 只寫網站一直不變的事，不寫特定地區，也不寫還沒有文章的題材。
 * 範圍是全日本，大城市和小地方都寫（Darren 2026-10-21）。
 */
export const SITE_DESCRIPTION =
  `${SITE_NAME}是寫給台灣旅人的日本自由行資料，大城市和小地方都寫。每篇列出時刻表、票價與訂票步驟，也寫停航或錯過末班車時怎麼辦。`

/** 網站的其他名稱，放進 WebSite 結構化資料，讓 Google 把網域和站名認成同一個網站。 */
export const SITE_ALTERNATE_NAMES = ['offpathnotes.com']

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
