import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'

import {SITE_NAME, formatPageTitle} from '../src/config/site.ts'

const projectRoot = new URL('../', import.meta.url)

test('文章與主題頁標題以「標題 - 站名」格式接上站名', () => {
  assert.equal(
    formatPageTitle('銀山溫泉住宿怎麼訂，官網、Trip.com 與 Agoda 能訂到的旅館'),
    `銀山溫泉住宿怎麼訂，官網、Trip.com 與 Agoda 能訂到的旅館 - ${SITE_NAME}`,
  )
  assert.equal(
    formatPageTitle('東京11月天氣｜氣溫、降雨與穿著'),
    `東京11月天氣｜氣溫、降雨與穿著 - ${SITE_NAME}`,
  )
})

test('標題已含站名時不重複接上', () => {
  assert.equal(formatPageTitle(`住宿｜${SITE_NAME}`), `住宿｜${SITE_NAME}`)
  assert.equal(formatPageTitle(`聯絡與合作｜${SITE_NAME}`), `聯絡與合作｜${SITE_NAME}`)
  assert.equal(formatPageTitle('  '), SITE_NAME)
})

test('BaseLayout 的 <title> 使用 formatPageTitle，og:title 維持原標題', async () => {
  const layout = await readFile(new URL('src/layouts/BaseLayout.astro', projectRoot), 'utf8')
  assert.match(layout, /const documentTitle = formatPageTitle\(title\)/)
  assert.match(layout, /<title>\{documentTitle\}<\/title>/)
  assert.match(layout, /property="og:title" content=\{title\}/)
})
