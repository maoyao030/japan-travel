// 信箱要先在 Cloudflare Email Routing 設好收信才能公開；Turnstile 金鑰還沒有。
export const CONTACT_EMAIL = 'contact@offpathnotes.com'
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
