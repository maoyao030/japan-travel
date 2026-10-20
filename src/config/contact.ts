// 收信：Email Routing 把 contact@ 轉寄到 Darren 的 Gmail（2026-10-20 設定並測試）。
export const CONTACT_EMAIL = 'contact@offpathnotes.com'
export const CONTACT_API_PATH = '/api/contact'
/**
 * Turnstile 站台金鑰（公開值，不是機密）。widget「繞路筆記聯絡表單」只允許 offpathnotes.com，
 * 所以 workers.dev 預覽網址上驗證會失敗，這是正常的。secret 放在 Worker Secret TURNSTILE_SECRET_KEY。
 */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFd5xZWZb5SkhzxY'

export const CONTACT_TOPICS = [
  {value: 'correction', label: '旅館、店家或資料更正'},
  {value: 'advertising', label: '廣告與合作提案'},
  {value: 'licensing', label: '內容授權與轉載'},
  {value: 'other', label: '其他聯絡'},
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]['value']
