import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {renderPortableText} from '../src/lib/portableText.ts'

test('文內圖輸出 figure、尺寸與署名，有來源頁時署名連到來源頁', () => {
  const html = renderPortableText([
    {
      _type: 'image',
      url: 'https://cdn.sanity.io/images/x/production/a.webp',
      width: 1600,
      height: 900,
      alt: '香深港渡輪售票處',
      caption: '售票處在碼頭大樓一樓。',
      credit: '照片：Example／Wikimedia Commons／CC BY-SA 4.0',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
    },
  ])
  assert.match(html, /<figure class="article-image"><img src="https:\/\/cdn\.sanity\.io[^"]+" alt="香深港渡輪售票處" width="1600" height="900" loading="lazy"/)
  assert.match(html, /<figcaption><span>售票處在碼頭大樓一樓。<\/span>/)
  assert.match(html, /<a href="https:\/\/commons\.wikimedia\.org\/wiki\/File:Example\.jpg" rel="noopener noreferrer">照片：Example/)

  const diagram = renderPortableText([
    {_type: 'image', url: 'https://cdn.sanity.io/images/x/production/b.svg', alt: '渡輪路線示意圖', credit: '本站製作示意圖'},
  ])
  assert.match(diagram, /<small class="article-image-credit">本站製作示意圖<\/small>/)
  assert.doesNotMatch(diagram, /<a /)

  assert.equal(renderPortableText([{_type: 'image', alt: '沒有網址'}]), '')
})

test('Sanity 文內圖要求署名，並保存來源頁與授權', async () => {
  const schema = await readFile(new URL('../studio/schemaTypes/article.ts', import.meta.url), 'utf8')
  const body = schema.slice(schema.indexOf("name: 'body'"), schema.indexOf("name: 'cover'"))
  for (const field of ['credit', 'sourcePageUrl', 'license']) {
    assert.match(body, new RegExp(`name: '${field}'`))
  }
  assert.match(body, /請填寫圖片署名/)
  const query = await readFile(new URL('../src/lib/sanity.ts', import.meta.url), 'utf8')
  assert.match(query, /_type == "image" => \{\s*"url": asset->url/)
})
