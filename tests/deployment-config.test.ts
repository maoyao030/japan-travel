import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const projectRoot = path.resolve(import.meta.dirname, '..')

function parseJsonc(source: string) {
  return JSON.parse(source.replace(/^\s*\/\/.*$/gm, ''))
}

test('Cloudflare CI 會先跑完整測試，再建置網站', async () => {
  const packageJson = JSON.parse(
    await readFile(path.join(projectRoot, 'package.json'), 'utf8'),
  )

  assert.equal(packageJson.scripts.ci, 'npm test && npm run build')
  assert.match(packageJson.scripts.build, /check:schema/)
  assert.match(packageJson.scripts.build, /generate:seo/)
  assert.match(packageJson.scripts.build, /check:links/)
})

test('Workers 靜態資產與分支預覽設定保持啟用，正式網域尚未綁定', async () => {
  const wranglerConfig = parseJsonc(
    await readFile(path.join(projectRoot, 'wrangler.jsonc'), 'utf8'),
  )

  assert.equal(wranglerConfig.name, 'japan-travel')
  assert.equal(wranglerConfig.main, 'workers/site/src/index.ts')
  assert.equal(wranglerConfig.workers_dev, true)
  assert.equal(wranglerConfig.preview_urls, true)
  assert.equal('routes' in wranglerConfig, false)
  assert.equal(wranglerConfig.assets.directory, './dist')
  assert.equal(wranglerConfig.assets.binding, 'ASSETS')
  assert.equal(wranglerConfig.assets.not_found_handling, '404-page')
  assert.equal(wranglerConfig.assets.run_worker_first, true)
  assert.equal(wranglerConfig.send_email[0].name, 'CONTACT_EMAIL')
  assert.equal(wranglerConfig.observability.enabled, true)
})

test('環境變數範例列出 Sanity、網址與表單設定，不含真實機密', async () => {
  const envExample = await readFile(path.join(projectRoot, '.env.example'), 'utf8')

  for (const key of [
    'SANITY_PROJECT_ID',
    'SANITY_DATASET',
    'SITE_URL',
    'PUBLIC_TURNSTILE_SITE_KEY',
    'CONTACT_FORM_RECIPIENT',
    'TURNSTILE_SECRET_KEY',
    'SANITY_AUTH_TOKEN',
  ]) {
    assert.match(envExample, new RegExp(`^${key}=`, 'm'))
  }
  assert.doesNotMatch(envExample, /^SANITY_AUTH_TOKEN=.+$/m)
})
