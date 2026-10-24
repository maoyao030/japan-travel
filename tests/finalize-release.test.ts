import assert from 'node:assert/strict'
import test from 'node:test'

import {findQueueItem, validateStandingApproval} from '../scripts/article-automation-policy.mjs'
import {
  buildReleaseManifest,
  buildSanitySyncConfig,
  inspectPublication,
  inspectReaderPreview,
  inspectReview,
} from '../scripts/finalize-release.mjs'
import {createQueue} from './fixtures/queue.ts'

const preview = [
  '# 銀山溫泉住宿怎麼訂，官網與 Agoda 能訂到的旅館',
  '',
  '銀山溫泉 住宿多半要在官網預約。',
  '',
  '## 銀山溫泉的旅館',
  '',
  '內容。',
  '',
  '## 資料來源',
  '',
  '- [銀山温泉組合](https://example.invalid/)',
  '',
].join('\n')

test('定稿前檢查成稿：一個 H1、資料來源、主要查詢，不能留事實編號', () => {
  const queue = createQueue()
  const item = findQueueItem(queue, 'ginzan-onsen-ryokan')
  assert.deepEqual(inspectReaderPreview(preview, item).issues, [])
  assert.match(inspectReaderPreview(preview.replace('內容。', '內容 [F12]。'), item).issues.join('\n'), /事實編號標記/)
  assert.match(inspectReaderPreview(preview.replace('## 資料來源', '## 參考'), item).issues.join('\n'), /資料來源/)
  assert.match(inspectReaderPreview(preview.replace('銀山溫泉 住宿多半', '這裡多半'), item).issues.join('\n'), /主要查詢/)
})

test('驗收報告要對應目前成稿的指紋，最終結果是 ready_for_user_preview', () => {
  const sha = 'a'.repeat(64)
  const review = `- 文章 SHA-256：${sha}\n- 驗收者：讀者驗收 agent\n- 格式 mechanical_clear\n- 事實 verified\n\nready_for_user_preview`
  assert.deepEqual(inspectReview(review, sha).issues, [])
  assert.match(inspectReview(review, 'b'.repeat(64)).issues.join('\n'), /SHA-256/)
  assert.match(inspectReview(review.replace('ready_for_user_preview', 'rejected'), sha).issues.join('\n'), /rejected/)
})

test('SEO Title 不能用冒號，長度要在範圍內', () => {
  const h1 = '銀山溫泉住宿怎麼訂，官網與 Agoda 能訂到的旅館'
  const publication = {seoTitle: h1, seoDescription: '整理銀山溫泉旅館的房型、含餐、接駁與訂房管道，以及哪些只能在官網訂。', excerpt: '銀山溫泉的旅館多半只能在官網或 Jalan 訂，這篇整理每間的房型、含餐與訂房方式。'}
  assert.deepEqual(inspectPublication(publication, {h1, referenceReview: '', articleId: 'ginzan-onsen-ryokan'}).issues, [])
  assert.match(inspectPublication({...publication, seoTitle: '銀山溫泉住宿：怎麼訂'}, {h1, referenceReview: '', articleId: 'x'}).issues.join('\n'), /冒號/)
})

test('定稿寫出的 manifest 符合清單預先授權的檢查，Sanity 首次寫入一律 noindex', () => {
  const queue = createQueue()
  const item = findQueueItem(queue, 'ginzan-onsen-ryokan')
  const today = new Date().toISOString().slice(0, 10)
  const publication = {seoTitle: 'x'.repeat(10), seoDescription: 'd', excerpt: 'e'}
  const manifest = buildReleaseManifest({item, queue, h1: 'H1', publication, readerPreviewSha256: 'a'.repeat(64), audit: {status: 'mechanical_clear'}, today})
  assert.deepEqual(validateStandingApproval(manifest, queue, item), [])
  const sync = buildSanitySyncConfig({item, h1: 'H1', publication, publishedAt: '2026-11-01T00:00:00.000Z'})
  assert.equal(sync.article.noindex, true)
  assert.equal(sync.article._id, 'article-ginzan-onsen-ryokan')
})

test('正文教日文會話時擋下，畫面上的日文單詞不擋', async () => {
  const {findJapanesePhraseLesson} = await import('../scripts/finalize-release.mjs')
  assert.match(findJapanesePhraseLesson('## 在禮文島可以指給對方看的日文') ?? '', /指給/)
  assert.match(findJapanesePhraseLesson('- 「この船は香深に行きますか？」：這班船會到香深嗎？') ?? '', /行きますか/)
  assert.match(findJapanesePhraseLesson('どうぞよろしくお願いいたします。') ?? '', /お願いいたします/)
  assert.equal(findJapanesePhraseLesson('| この内容で予約する | 用這個內容預約 | 確認後按下 |'), null)
  assert.equal(findJapanesePhraseLesson('售票櫃台在1樓「発券カウンター」。'), null)
})
