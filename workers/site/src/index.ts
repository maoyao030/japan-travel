import {
  CONTACT_EMAIL,
  CONTACT_TOPICS,
  type ContactTopic,
} from '../../../src/config/contact.ts'
import {SITE_NAME} from '../../../src/config/site.ts'

const CONTACT_PATH = '/api/contact'
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])
const MAX_BODY_BYTES = 32 * 1024
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TURNSTILE_ACTION = 'contact_form'

export type ContactRuntimeEnv = SiteEnv & {
  CONTACT_FORM_RECIPIENT: string
  TURNSTILE_SECRET_KEY: string
}

export type ContactSubmission = {
  name: string
  email: string
  organization: string
  topic: ContactTopic
  subject: string
  message: string
}

type TurnstileResult = {
  success: boolean
  action?: string
}

type ContactServices = {
  validateTurnstile: (
    token: string,
    remoteIp: string | null,
    secret: string,
  ) => Promise<TurnstileResult>
  sendEmail: (
    env: ContactRuntimeEnv,
    submission: ContactSubmission,
    requestId: string,
  ) => Promise<void>
}

class BodyTooLargeError extends Error {}

function jsonResponse(
  body: {ok: boolean; message: string},
  status = 200,
): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function structuredLog(
  level: 'log' | 'error',
  event: string,
  requestId: string,
  details: Record<string, unknown> = {},
) {
  console[level](JSON.stringify({event, requestId, ...details}))
}

async function readBoundedBody(request: Request): Promise<string> {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength) {
    const parsedLength = Number(declaredLength)
    if (!Number.isFinite(parsedLength) || parsedLength > MAX_BODY_BYTES) {
      throw new BodyTooLargeError('Request body exceeds the contact form limit')
    }
  }

  if (!request.body) return ''

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const result = await reader.read()
    if (result.done) break

    totalBytes += result.value.byteLength
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel('Request body exceeds the contact form limit')
      throw new BodyTooLargeError('Request body exceeds the contact form limit')
    }
    chunks.push(result.value)
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(body)
}

function singleLine(params: URLSearchParams, name: string, maxLength: number): string {
  const value = params.get(name)?.trim() ?? ''
  if (value.length > maxLength || /[\r\n\u0000]/u.test(value)) return ''
  return value
}

function messageValue(params: URLSearchParams): string {
  const value = params.get('message')?.trim() ?? ''
  if (value.length > 3000 || /\u0000/u.test(value)) return ''
  return value
}

function isEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value)
}

function isContactTopic(value: string): value is ContactTopic {
  return CONTACT_TOPICS.some((topic) => topic.value === value)
}

export function parseContactSubmission(params: URLSearchParams):
  | {ok: true; submission: ContactSubmission; turnstileToken: string}
  | {ok: false; honeypot?: boolean; message: string} {
  if (params.get('website')?.trim()) {
    return {ok: false, honeypot: true, message: '提案已送出，謝謝你的來信。'}
  }

  const name = singleLine(params, 'name', 60)
  const email = singleLine(params, 'email', 254)
  const organization = singleLine(params, 'organization', 100)
  const topic = singleLine(params, 'topic', 40)
  const subject = singleLine(params, 'subject', 120)
  const message = messageValue(params)
  const turnstileToken = params.get('cf-turnstile-response')?.trim() ?? ''

  if (!name || !isEmail(email) || !isContactTopic(topic) || subject.length < 2) {
    return {ok: false, message: '請檢查姓名、電子郵件、合作類型與提案主題。'}
  }

  if (message.length < 10) {
    return {ok: false, message: '合作內容請至少填寫 10 個字。'}
  }

  if (params.get('consent') !== 'yes') {
    return {ok: false, message: '請先確認同意隱私權說明。'}
  }

  if (!turnstileToken || turnstileToken.length > 2048) {
    return {ok: false, message: '請完成安全驗證後再送出。'}
  }

  return {
    ok: true,
    turnstileToken,
    submission: {name, email, organization, topic, subject, message},
  }
}

export async function validateTurnstile(
  token: string,
  remoteIp: string | null,
  secret: string,
): Promise<TurnstileResult> {
  const body = new URLSearchParams({
    secret,
    response: token,
    idempotency_key: crypto.randomUUID(),
  })
  if (remoteIp) body.set('remoteip', remoteIp)

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body,
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return {success: false}

    const result = asRecord(await response.json())
    return {
      success: result?.success === true,
      action: typeof result?.action === 'string' ? result.action : undefined,
    }
  } catch {
    return {success: false}
  }
}

function topicLabel(topic: ContactTopic): string {
  return CONTACT_TOPICS.find((candidate) => candidate.value === topic)?.label ?? topic
}

export async function sendContactEmail(
  env: ContactRuntimeEnv,
  submission: ContactSubmission,
  requestId: string,
): Promise<void> {
  const label = topicLabel(submission.topic)
  const organization = submission.organization || '未填寫'
  const text = [
    `${SITE_NAME}收到一份新的聯絡訊息。`,
    '',
    `姓名或稱呼：${submission.name}`,
    `電子郵件：${submission.email}`,
    `公司或品牌：${organization}`,
    `合作類型：${label}`,
    `提案主題：${submission.subject}`,
    '',
    '合作內容',
    submission.message,
    '',
    `提交編號：${requestId}`,
  ].join('\n')

  await env.CONTACT_EMAIL.send({
    to: env.CONTACT_FORM_RECIPIENT,
    from: {name: `${SITE_NAME}聯絡表單`, email: CONTACT_EMAIL},
    replyTo: submission.email,
    subject: `[${SITE_NAME}聯絡表單] ${label}｜${submission.subject}`,
    text,
  })
}

export function httpsRedirect(request: Request): Response | null {
  const url = new URL(request.url)
  if (url.protocol !== 'http:' || LOCAL_HOSTNAMES.has(url.hostname)) return null

  url.protocol = 'https:'
  return new Response(null, {
    status: 301,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'public, max-age=86400',
    },
  })
}

const defaultServices: ContactServices = {
  validateTurnstile,
  sendEmail: sendContactEmail,
}

export async function handleContactRequest(
  request: Request,
  env: ContactRuntimeEnv,
  services: ContactServices = defaultServices,
): Promise<Response> {
  const requestId = crypto.randomUUID()
  const url = new URL(request.url)

  if (request.method !== 'POST') {
    return new Response(null, {status: 405, headers: {Allow: 'POST'}})
  }

  if (request.headers.get('origin') !== url.origin) {
    structuredLog('error', 'contact_origin_rejected', requestId)
    return jsonResponse({ok: false, message: '無法確認表單來源，請重新整理後再試。'}, 403)
  }

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  if (!contentType.startsWith('application/x-www-form-urlencoded')) {
    return jsonResponse({ok: false, message: '表單格式不正確，請重新整理後再試。'}, 415)
  }

  let params: URLSearchParams
  try {
    params = new URLSearchParams(await readBoundedBody(request))
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return jsonResponse({ok: false, message: '表單內容過長，請縮短後再送出。'}, 413)
    }
    structuredLog('error', 'contact_body_read_failed', requestId)
    return jsonResponse({ok: false, message: '目前無法讀取表單，請稍後再試。'}, 400)
  }

  const parsed = parseContactSubmission(params)
  if (!parsed.ok) {
    if (parsed.honeypot) {
      structuredLog('log', 'contact_honeypot_ignored', requestId)
      return jsonResponse({ok: true, message: parsed.message})
    }
    return jsonResponse({ok: false, message: parsed.message}, 400)
  }

  if (!env.TURNSTILE_SECRET_KEY || !isEmail(env.CONTACT_FORM_RECIPIENT)) {
    structuredLog('error', 'contact_runtime_not_configured', requestId)
    return jsonResponse(
      {ok: false, message: `表單寄送尚未完成設定，請直接寄信至 ${CONTACT_EMAIL}。`},
      503,
    )
  }

  const verification = await services.validateTurnstile(
    parsed.turnstileToken,
    request.headers.get('CF-Connecting-IP'),
    env.TURNSTILE_SECRET_KEY,
  )
  if (!verification.success || verification.action !== TURNSTILE_ACTION) {
    structuredLog('log', 'contact_turnstile_rejected', requestId)
    return jsonResponse({ok: false, message: '安全驗證未通過，請重新驗證後再送出。'}, 400)
  }

  try {
    await services.sendEmail(env, parsed.submission, requestId)
    structuredLog('log', 'contact_submission_sent', requestId)
    return jsonResponse({ok: true, message: '提案已送出，謝謝你的來信。'})
  } catch (error) {
    const errorRecord = asRecord(error)
    structuredLog('error', 'contact_email_send_failed', requestId, {
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorCode: typeof errorRecord?.code === 'string' ? errorRecord.code : undefined,
    })
    return jsonResponse(
      {ok: false, message: `目前無法寄出表單，請直接寄信至 ${CONTACT_EMAIL}。`},
      503,
    )
  }
}

export default {
  async fetch(request: Request, env: ContactRuntimeEnv): Promise<Response> {
    const redirect = httpsRedirect(request)
    if (redirect) return redirect

    const url = new URL(request.url)
    if (url.pathname === CONTACT_PATH) {
      return handleContactRequest(request, env)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<ContactRuntimeEnv>
