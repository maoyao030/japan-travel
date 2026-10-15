import assert from 'node:assert/strict'
import {access, readFile} from 'node:fs/promises'
import test from 'node:test'

import {
  GOOGLE_ADSENSE_PUBLISHER_ID,
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
} from '../src/config/google.ts'

const projectRoot = new URL('../', import.meta.url)

async function readProjectFile(path: string) {
  return readFile(new URL(path, projectRoot), 'utf8')
}

test('GA4 只在設定評估 ID 且訪客同意後載入，廣告相關儲存維持停用', async () => {
  const [layout, consent] = await Promise.all([
    readProjectFile('src/layouts/BaseLayout.astro'),
    readProjectFile('src/components/AnalyticsConsent.astro'),
  ])

  assert.ok(
    GOOGLE_ANALYTICS_MEASUREMENT_ID === '' || /^G-[A-Z0-9]+$/.test(GOOGLE_ANALYTICS_MEASUREMENT_ID),
  )
  assert.match(layout, /\{GOOGLE_ANALYTICS_MEASUREMENT_ID && <AnalyticsConsent \/>\}/)
  assert.match(layout, /\{GOOGLE_ANALYTICS_MEASUREMENT_ID && \(\s*<button type="button" data-open-analytics-consent>/)
  assert.match(consent, /preference === 'granted'/)
  assert.match(consent, /googletagmanager\.com\/gtag\/js/)
  assert.match(consent, /analytics_storage: 'denied'/)
  assert.match(consent, /ad_storage: 'denied'/)
  assert.match(consent, /ad_user_data: 'denied'/)
  assert.match(consent, /ad_personalization: 'denied'/)
  assert.match(consent, /window\.gtag\('consent', 'update', \{\s*analytics_storage: 'granted'/)
  assert.doesNotMatch(layout, /googletagmanager\.com\/gtag\/js/)
})

test('AdSense 先不申請：沒有發布商 ID、沒有 ads.txt、所有權標記只在設定後輸出', async () => {
  const layout = await readProjectFile('src/layouts/BaseLayout.astro')

  assert.equal(GOOGLE_ADSENSE_PUBLISHER_ID, '')
  assert.match(
    layout,
    /\{GOOGLE_ADSENSE_PUBLISHER_ID && \(\s*<meta name="google-adsense-account" content=\{GOOGLE_ADSENSE_PUBLISHER_ID\} \/>/,
  )
  assert.doesNotMatch(layout, /pagead2\.googlesyndication\.com/)
  await assert.rejects(access(new URL('public/ads.txt', projectRoot)))
})

test('網站提供隱私權說明，並揭露訂房分潤連結', async () => {
  const [layout, privacyPage] = await Promise.all([
    readProjectFile('src/layouts/BaseLayout.astro'),
    readProjectFile('src/pages/privacy.astro'),
  ])

  assert.match(layout, /href="\/privacy\/">隱私權政策<\/a>/)
  assert.match(privacyPage, /Google Analytics 流量分析/)
  assert.match(privacyPage, /訂房分潤連結/)
  assert.match(privacyPage, /Trip\.com 與 Agoda/)
  assert.match(privacyPage, /Google AdSense/)
  assert.match(privacyPage, /尚未載入廣告程式/)
})
