import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

import {CONTACT_EMAIL} from '../src/config/contact.ts'
import siteWorker, {
  handleContactRequest,
  parseContactSubmission,
  type ContactRuntimeEnv,
  type ContactSubmission,
} from '../workers/site/src/index.ts'

const projectRoot = new URL('../', import.meta.url)

async function readProjectFile(path: string) {
  return readFile(new URL(path, projectRoot), 'utf8')
}

function validForm(overrides: Record<string, string> = {}) {
  return new URLSearchParams({
    name: '王先生',
    email: 'partner@example.com',
    organization: '示範旅館',
    topic: 'correction',
    subject: '旅館營業資訊更正',
    message: '旅館今年起改為只接受官網預約，以下附上官網公告連結。',
    consent: 'yes',
    'cf-turnstile-response': 'valid-turnstile-token',
    ...overrides,
  })
}

function createRequest(body = validForm()) {
  return new Request('https://japan-travel.example/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Origin: 'https://japan-travel.example',
      'CF-Connecting-IP': '203.0.113.10',
    },
    body,
  })
}

function createEnv(onSend?: (message: EmailMessageBuilder) => void) {
  return {
    CONTACT_FORM_RECIPIENT: 'verified@example.com',
    TURNSTILE_SECRET_KEY: 'turnstile-test-secret',
    CONTACT_EMAIL: {
      async send(message: EmailMessageBuilder) {
        onSend?.(message)
        return {messageId: 'test-message-id'}
      },
    },
    ASSETS: {
      async fetch() {
        return new Response('asset fallback')
      },
      connect() {
        throw new Error('Not used in this test')
      },
    },
  } as ContactRuntimeEnv
}

test('頁尾、聯絡頁與隱私權政策都提供正式聯絡入口', async () => {
  const [layout, contactPage, privacyPage] = await Promise.all([
    readProjectFile('src/layouts/BaseLayout.astro'),
    readProjectFile('src/pages/contact.astro'),
    readProjectFile('src/pages/privacy.astro'),
  ])

  assert.match(CONTACT_EMAIL, /^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  assert.match(layout, /href="\/contact\/">聯絡與合作/)
  assert.match(layout, /href=\{`mailto:\$\{CONTACT_EMAIL\}`\}/)
  assert.match(contactPage, /action=\{CONTACT_API_PATH\}/)
  assert.match(contactPage, /name="cf-turnstile-response"|class="cf-turnstile"/)
  assert.match(contactPage, /data-action="contact_form"/)
  assert.match(contactPage, /不接受以購買可傳遞排名權重連結為目的的提案/)
  assert.match(privacyPage, /聯絡與合作表單/)
  assert.match(privacyPage, /Cloudflare Turnstile/)
  assert.match(privacyPage, /Cloudflare Email Service/)
})

test('合作表單會拒絕缺欄、錯誤信箱、未同意與過短內容', () => {
  assert.equal(parseContactSubmission(validForm()).ok, true)
  assert.equal(parseContactSubmission(validForm({email: 'not-an-email'})).ok, false)
  assert.equal(parseContactSubmission(validForm({consent: ''})).ok, false)
  assert.equal(parseContactSubmission(validForm({message: '太短'})).ok, false)
  assert.equal(
    parseContactSubmission(validForm({'cf-turnstile-response': ''})).ok,
    false,
  )
})

test('藏欄位有內容時回傳成功訊息但不寄信', async () => {
  let emailCount = 0
  let verificationCount = 0
  const response = await handleContactRequest(
    createRequest(validForm({website: 'https://spam.example'})),
    createEnv(() => {
      emailCount += 1
    }),
    {
      async validateTurnstile() {
        verificationCount += 1
        return {success: true, action: 'contact_form'}
      },
      async sendEmail() {
        emailCount += 1
      },
    },
  )

  assert.equal(response.status, 200)
  assert.equal(emailCount, 0)
  assert.equal(verificationCount, 0)
})

test('驗證成功後寄出純文字提案，回覆地址使用提案者信箱', async () => {
  let sentSubmission: ContactSubmission | undefined
  let sentRequestId = ''
  const response = await handleContactRequest(createRequest(), createEnv(), {
    async validateTurnstile(token, remoteIp, secret) {
      assert.equal(token, 'valid-turnstile-token')
      assert.equal(remoteIp, '203.0.113.10')
      assert.equal(secret, 'turnstile-test-secret')
      return {success: true, action: 'contact_form'}
    },
    async sendEmail(_env, submission, requestId) {
      sentSubmission = submission
      sentRequestId = requestId
    },
  })
  const result = await response.json() as {ok: boolean; message: string}

  assert.equal(response.status, 200)
  assert.equal(result.ok, true)
  assert.equal(sentSubmission?.email, 'partner@example.com')
  assert.equal(sentSubmission?.topic, 'correction')
  assert.match(sentRequestId, /^[0-9a-f-]{36}$/)
})

test('來源、格式、Turnstile action 與執行環境設定都有防呆', async () => {
  const wrongOrigin = createRequest()
  wrongOrigin.headers.set('Origin', 'https://attacker.example')
  assert.equal((await handleContactRequest(wrongOrigin, createEnv())).status, 403)

  const wrongContentType = createRequest()
  wrongContentType.headers.set('Content-Type', 'application/json')
  assert.equal((await handleContactRequest(wrongContentType, createEnv())).status, 415)

  const wrongAction = await handleContactRequest(createRequest(), createEnv(), {
    async validateTurnstile() {
      return {success: true, action: 'different_form'}
    },
    async sendEmail() {
      throw new Error('Should not send')
    },
  })
  assert.equal(wrongAction.status, 400)

  const missingSecrets = createEnv()
  missingSecrets.TURNSTILE_SECRET_KEY = ''
  assert.equal((await handleContactRequest(createRequest(), missingSecrets)).status, 503)
})

test('非表單網址仍交回靜態網站處理', async () => {
  const response = await siteWorker.fetch(
    new Request('https://japan-travel.example/missing/'),
    createEnv(),
    {} as ExecutionContext,
  )

  assert.equal(await response.text(), 'asset fallback')
})
