import assert from 'node:assert/strict'
import test from 'node:test'

import siteWorker, {httpsRedirect, type ContactRuntimeEnv} from '../workers/site/src/index.ts'

function createEnv(): ContactRuntimeEnv {
  return {
    CONTACT_FORM_RECIPIENT: 'verified@example.com',
    TURNSTILE_SECRET_KEY: 'turnstile-test-secret',
    CONTACT_EMAIL: {
      async send() {
        throw new Error('Not used in this test')
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
  } as unknown as ContactRuntimeEnv
}

test('http 網址會 301 轉到相同路徑的 https 網址', async () => {
  const response = await siteWorker.fetch(
    new Request('http://japan-travel.example/stay/ginzan-onsen/?page=2'),
    createEnv(),
    {} as ExecutionContext,
  )

  assert.equal(response.status, 301)
  assert.equal(response.headers.get('Location'), 'https://japan-travel.example/stay/ginzan-onsen/?page=2')
})

test('https 網址與本機開發網址不會被轉址', async () => {
  assert.equal(httpsRedirect(new Request('https://japan-travel.example/stay/')), null)
  assert.equal(httpsRedirect(new Request('http://localhost:8787/materials/')), null)
  assert.equal(httpsRedirect(new Request('http://127.0.0.1:8787/')), null)

  const response = await siteWorker.fetch(
    new Request('https://japan-travel.example/stay/'),
    createEnv(),
    {} as ExecutionContext,
  )
  assert.equal(await response.text(), 'asset fallback')
})

test('http 的表單網址先轉址，不會直接處理表單', async () => {
  const response = await siteWorker.fetch(
    new Request('http://japan-travel.example/api/contact', {method: 'POST'}),
    createEnv(),
    {} as ExecutionContext,
  )

  assert.equal(response.status, 301)
  assert.equal(response.headers.get('Location'), 'https://japan-travel.example/api/contact')
})

test('workers.dev 測試網址加上 noindex，正式網域不加', async () => {
  const preview = await siteWorker.fetch(
    new Request('https://japan-travel.example.workers.dev/places/'),
    createEnv(),
    {} as ExecutionContext,
  )
  assert.equal(preview.headers.get('X-Robots-Tag'), 'noindex, nofollow')
  assert.equal(await preview.text(), 'asset fallback')

  const production = await siteWorker.fetch(
    new Request('https://offpathnotes.com/places/'),
    createEnv(),
    {} as ExecutionContext,
  )
  assert.equal(production.headers.get('X-Robots-Tag'), null)
})
