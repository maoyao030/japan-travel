import assert from 'node:assert/strict'
import test from 'node:test'

import {DEFAULT_SANITY_PROJECT_ID, resolveSanityConfig} from '../site.config.mjs'
import {sanityHasPublishedArticles} from '../scripts/check-structured-data.mjs'

test('沒設 SANITY_PROJECT_ID 時用本站專案，不會建成空站', () => {
  assert.equal(DEFAULT_SANITY_PROJECT_ID, 'e8ctf7ee')
  assert.deepEqual(resolveSanityConfig({}), {projectId: 'e8ctf7ee', dataset: 'production'})
  assert.deepEqual(resolveSanityConfig({SANITY_PROJECT_ID: ' ', SANITY_DATASET: ''}), {
    projectId: 'e8ctf7ee',
    dataset: 'production',
  })
})

test('只有明確設成 none 才以沒有內容的狀態建置', () => {
  assert.equal(resolveSanityConfig({SANITY_PROJECT_ID: 'none'}), null)
})

test('Sanity 還沒有文章時，建置檢查不要求文章頁', async () => {
  const config = {projectId: 'e8ctf7ee', dataset: 'production'}
  const reply = (result: unknown, ok = true) => async () =>
    ({ok, status: ok ? 200 : 500, json: async () => ({result})}) as Response

  assert.equal(await sanityHasPublishedArticles(config, reply(0)), false)
  assert.equal(await sanityHasPublishedArticles(config, reply(3)), true)
  assert.equal(await sanityHasPublishedArticles(null, reply(3)), false)
  await assert.rejects(sanityHasPublishedArticles(config, reply(0, false)), /HTTP 500/)
  await assert.rejects(sanityHasPublishedArticles(config, reply('x')), /格式不對/)
})
