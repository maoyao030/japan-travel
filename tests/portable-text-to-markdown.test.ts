import assert from 'node:assert/strict'
import test from 'node:test'

import {parseMarkdownBody} from '../scripts/markdown-to-portable-text.mjs'
import {
  blockPlainText,
  diffParagraphs,
  markdownParagraphs,
  portableTextToMarkdown,
} from '../scripts/portable-text-to-markdown.mjs'

const source = [
  '# 旭川美食推薦',
  '',
  '開頭第一段，**粗體**也在。',
  '',
  '## 旭川拉麵',
  '',
  '### 拉麵村怎麼去',
  '',
  '- 第一家',
  '- 第二家',
  '',
  '| 店家 | 特色 |',
  '|---|---|',
  '| 青葉 | 老店 |',
  '',
  '> 引用一句。',
  '',
  '## 延伸資料',
  '',
  '- [拉麵村官網](https://www.ramenmura.com/)，各店介紹。',
  '',
].join('\n')

test('後台正文轉回 Markdown 後，再轉一次文字完全一樣', () => {
  const {title, blocks} = parseMarkdownBody(source)
  const markdown = portableTextToMarkdown(title, blocks)
  assert.equal(markdown, source)
  const again = parseMarkdownBody(markdown)
  assert.deepEqual(again.blocks.map(blockPlainText), blocks.map(blockPlainText))
})

test('站內連結只留文字、照片與嵌入不輸出，和稿件寫法一致', () => {
  const body = [
    {
      _type: 'block',
      style: 'normal',
      markDefs: [{_key: 'l1', _type: 'link', href: '/places/asahikawa/'}],
      children: [
        {_type: 'span', marks: [], text: '可以先看'},
        {_type: 'span', marks: ['l1'], text: '旭川自由行怎麼排'},
        {_type: 'span', marks: [], text: '。'},
      ],
    },
    {_type: 'image', alt: '拉麵'},
    {_type: 'mediaEmbed', url: 'https://www.youtube.com/watch?v=x'},
  ]
  assert.equal(portableTextToMarkdown('標題', body), '# 標題\n\n可以先看旭川自由行怎麼排。\n')
  assert.equal(
    portableTextToMarkdown('標題', body, {keepSiteLinks: true}),
    '# 標題\n\n可以先看[旭川自由行怎麼排](/places/asahikawa/)。\n',
  )
})

test('逐段比對列出改過、刪掉、新增的段落', () => {
  const before = markdownParagraphs('# T\n\n第一段。\n\n第二段。\n\n第三段。\n')
  const after = ['第一段。', '第二段改過。', '第三段。', '新的一段。']
  assert.deepEqual(diffParagraphs(before, after), [
    {type: 'changed', before: '第二段。', after: '第二段改過。'},
    {type: 'added', after: '新的一段。'},
  ])
  assert.deepEqual(diffParagraphs(after, before.slice(0, 1)), [
    {type: 'removed', before: '第二段改過。'},
    {type: 'removed', before: '第三段。'},
    {type: 'removed', before: '新的一段。'},
  ])
})
