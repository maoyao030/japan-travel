// 正式信箱與 Turnstile 金鑰都還沒有；網域確定後再填。
export const CONTACT_EMAIL = 'contact@japan-travel.example'
export const CONTACT_API_PATH = '/api/contact'
/** Turnstile 站台金鑰（公開值）。留空時聯絡表單停用，只顯示信箱。 */
export const TURNSTILE_SITE_KEY = ''

export const CONTACT_TOPICS = [
  {value: 'correction', label: '旅館、店家或資料更正'},
  {value: 'advertising', label: '廣告與合作提案'},
  {value: 'licensing', label: '內容授權與轉載'},
  {value: 'other', label: '其他聯絡'},
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]['value']
