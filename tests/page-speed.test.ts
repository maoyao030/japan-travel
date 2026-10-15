import assert from 'node:assert/strict'
import test from 'node:test'

import {getResponsiveImage} from '../src/lib/images.ts'

const sanityCover =
  'https://cdn.sanity.io/images/example/production/d058cb0a37f9bed8e25ca6c3f8097f261da76874-1600x900.webp'

test('Sanity 封面產生多種寬度，手機不必下載 1600px 原圖', () => {
  const image = getResponsiveImage(sanityCover, 1600)
  assert.equal(image.src, `${sanityCover}?w=1200&auto=format`)
  assert.equal(
    image.srcset,
    [480, 800, 1200, 1600].map((width) => `${sanityCover}?w=${width}&auto=format ${width}w`).join(', '),
  )
})

test('原圖較窄時不放大超過原始寬度', () => {
  const image = getResponsiveImage(sanityCover, 1000)
  assert.equal(image.src, `${sanityCover}?w=1000&auto=format`)
  assert.match(image.srcset ?? '', /w=1000&auto=format 1000w$/)
  assert.doesNotMatch(image.srcset ?? '', /w=1200/)
})

test('非 Sanity 圖片維持原網址', () => {
  assert.deepEqual(getResponsiveImage('/og.png', 1200), {src: '/og.png'})
  assert.deepEqual(getResponsiveImage('https://example.com/a.jpg', 1200), {
    src: 'https://example.com/a.jpg',
  })
})

test('小標籤用色對淺底對比至少 4.5，分類卡不以 aria-label 蓋掉可見文字', async () => {
  const {readFile} = await import('node:fs/promises')
  const root = new URL('../', import.meta.url)
  const css = await readFile(new URL('src/styles/global.css', root), 'utf8')
  assert.match(css, /--clay: #a4532d;/)
  for (const page of ['src/pages/index.astro', 'src/pages/[category].astro']) {
    const source = await readFile(new URL(page, root), 'utf8')
    assert.doesNotMatch(source, /home-category-item"[^>]*aria-label/)
  }
})

test('全站使用裝置內建中文字體，不下載 Google Fonts 網頁字型', async () => {
  const {readFile} = await import('node:fs/promises')
  const root = new URL('../', import.meta.url)
  const layout = await readFile(new URL('src/layouts/BaseLayout.astro', root), 'utf8')
  const css = await readFile(new URL('src/styles/global.css', root), 'utf8')
  assert.doesNotMatch(layout, /fonts\.(googleapis|gstatic)\.com/)
  assert.match(css, /--font-sans: "PingFang TC", "Noto Sans CJK TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;/)
})
