import assert from 'node:assert/strict'
import test from 'node:test'

import {canonicalEmbedUrl, validateEmbedPlan} from '../scripts/embed-plan.mjs'
import {findInsertionKey} from '../scripts/inline-image-placement.mjs'
import {instagramPost, renderPortableText, youtubeVideoId} from '../src/lib/portableText.ts'

const youtubeBlock = {
  _key: 'media-embed-cycling',
  _type: 'mediaEmbed',
  platform: 'youtube',
  url: 'https://www.youtube.com/watch?v=F-lz9aR-Xyg',
  startSeconds: 265,
  title: 'サイクリングinてっぺん宗谷',
  channelName: '北海道公式',
  publishedAt: '2025-05',
  caption: '利尻島自行車道的湾内大橋。',
}

test('YouTube 嵌入先只放縮圖與按鈕，點了才載入 nocookie 播放器', () => {
  const html = renderPortableText([youtubeBlock])
  assert.match(html, /<button type="button" class="article-embed-play" data-embed-src="https:\/\/www\.youtube-nocookie\.com\/embed\/F-lz9aR-Xyg\?autoplay=1&amp;rel=0&amp;start=265"/)
  assert.doesNotMatch(html, /<iframe/)
  assert.match(html, /i\.ytimg\.com\/vi\/F-lz9aR-Xyg\/hqdefault\.jpg" alt="" width="480" height="360" loading="lazy"/)
  assert.match(html, /影片：<a href="https:\/\/www\.youtube\.com\/watch\?v=F-lz9aR-Xyg&amp;t=265s" rel="noopener noreferrer">北海道公式<\/a>（2025）・實際資訊以本文為準/)
})

test('Instagram 嵌入是卡片與載入按鈕，連結到貼文', () => {
  const html = renderPortableText([
    {
      _key: 'media-embed-ig',
      _type: 'mediaEmbed',
      platform: 'instagram',
      url: 'https://www.instagram.com/p/ABC_123-x/',
      title: '冰瀑祭',
      channelName: '層雲峽觀光協會',
      publishedAt: '2026-01',
      caption: '冰瀑祭會場的夜間點燈。',
    },
  ])
  assert.match(html, /data-embed-src="https:\/\/www\.instagram\.com\/p\/ABC_123-x\/embed\/captioned\/"/)
  assert.match(html, /貼文：<a href="https:\/\/www\.instagram\.com\/p\/ABC_123-x\/"/)
  assert.doesNotMatch(html, /<iframe|<script/)
})

test('網址不是影片或貼文、缺欄位時不輸出任何東西', () => {
  assert.equal(renderPortableText([{...youtubeBlock, url: 'https://example.com/watch?v=F-lz9aR-Xyg'}]), '')
  assert.equal(renderPortableText([{...youtubeBlock, caption: ''}]), '')
  assert.equal(renderPortableText([{...youtubeBlock, platform: 'instagram'}]), '')
  assert.equal(youtubeVideoId('https://youtu.be/F-lz9aR-Xyg'), 'F-lz9aR-Xyg')
  assert.equal(youtubeVideoId('https://www.youtube.com/watch?v=short'), null)
  assert.deepEqual(instagramPost('https://www.instagram.com/reel/Cx9/'), {kind: 'reel', code: 'Cx9'})
  assert.equal(instagramPost('https://www.instagram.com/sounkyo_official/'), null)
})

test('文章頁的載入小程式只在有嵌入時輸出，且不先連到對方平台', async () => {
  const {readFile} = await import('node:fs/promises')
  const source = await readFile(new URL('../src/components/ArticlePage.astro', import.meta.url), 'utf8')
  assert.match(source, /block\._type === 'mediaEmbed'\) && \(/)
  assert.match(source, /addEventListener\('click'/)
  assert.doesNotMatch(source, /instagram\.com\/embed\.js|youtube\.com\/iframe_api/)
})

const plan = {
  schemaVersion: 1,
  articleId: 'rishiri-island-transport',
  checkedAt: '2026-10-29',
  embeds: [
    {
      embedId: 'cycling-road-video',
      platform: 'youtube',
      url: 'https://www.youtube.com/watch?v=F-lz9aR-Xyg&t=265s',
      startSeconds: 265,
      title: 'サイクリングinてっぺん宗谷',
      channelName: '北海道公式',
      channelType: 'official',
      publishedAt: '2025-05',
      placement: {heading: '騎自行車繞利尻島一圈', afterBlocks: 2},
      captionDraft: '利尻島自行車道。',
      evidence: '說明欄寫明。',
      checks: {publicAndEmbeddable: true, withinTwoYears: true, contentVerified: true, notMisleadingAd: true},
    },
  ],
}

test('嵌入封包轉成 Sanity 欄位，網址整理成固定格式', () => {
  const [item] = validateEmbedPlan(plan, {articleId: 'rishiri-island-transport'})
  assert.equal(item.key, 'media-embed-cycling-road-video')
  assert.deepEqual(item.fields, {
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=F-lz9aR-Xyg',
    startSeconds: 265,
    title: 'サイクリングinてっぺん宗谷',
    channelName: '北海道公式',
    publishedAt: '2025-05',
    caption: '利尻島自行車道。',
  })
})

test('嵌入封包擋下超過兩年、個人 Instagram、超過兩個與同一節兩個', () => {
  const embed = plan.embeds[0]
  assert.throws(() => validateEmbedPlan({...plan, embeds: [{...embed, publishedAt: '2024-09'}]}), /超過兩年/)
  assert.throws(
    () => validateEmbedPlan({...plan, embeds: [{...embed, platform: 'instagram', url: 'https://www.instagram.com/p/abc/', startSeconds: undefined, channelType: 'individual'}]}),
    /只用官方帳號/,
  )
  assert.throws(() => validateEmbedPlan({...plan, embeds: [embed, {...embed, embedId: 'b'}, {...embed, embedId: 'c'}]}), /最多 2 個/)
  assert.throws(() => validateEmbedPlan({...plan, embeds: [embed, {...embed, embedId: 'b'}]}), /同一節只能放一個/)
  assert.throws(() => validateEmbedPlan({...plan, embeds: [{...embed, checks: {...embed.checks, contentVerified: false}}]}), /contentVerified/)
  assert.throws(() => canonicalEmbedUrl('youtube', 'http://www.youtube.com/watch?v=F-lz9aR-Xyg'), /HTTPS/)
})

test('嵌入算位置時照片算一個區塊，照片位置計算略過嵌入', () => {
  const block = (key: string, style = 'normal', text = '段落') => ({_key: key, _type: 'block', style, children: [{_type: 'span', text}]})
  const body = [
    block('h', 'h3', '騎自行車繞利尻島一圈'),
    block('p1'),
    {_key: 'inline-image-cycling', _type: 'image'},
    {_key: 'media-embed-old', _type: 'mediaEmbed'},
    block('p2'),
  ]
  const placement = {heading: '騎自行車繞利尻島一圈', afterBlocks: 2}
  assert.equal(findInsertionKey(body, placement, {skipPrefixes: ['media-embed-']}), 'inline-image-cycling')
  assert.equal(findInsertionKey(body, placement), 'p2')
})
