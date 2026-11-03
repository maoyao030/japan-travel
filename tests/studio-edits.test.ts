import assert from 'node:assert/strict'
import test from 'node:test'

import {parseMarkdownBody} from '../scripts/markdown-to-portable-text.mjs'
import {assertNoUnsyncedStudioEdits, hasUnsyncedStudioEdits} from '../scripts/studio-edit-guard.mjs'
import {applyFieldChanges, buildStudioEditReport, editFolderName, keepGitSourceLines} from '../scripts/studio-edits.mjs'
import {articlePath} from '../studio/lib/articleUrl.ts'

test('後台改過、還沒同步回 Git 時，改寫正文的工具會停下來', () => {
  assert.equal(hasUnsyncedStudioEdits({_id: 'article-a'}), false)
  assert.equal(hasUnsyncedStudioEdits({studioEditedAt: '2026-11-03T04:12:00.000Z'}), true)
  assert.equal(
    hasUnsyncedStudioEdits({studioEditedAt: '2026-11-03T04:12:00.000Z', studioEditsSyncedAt: '2026-11-03T04:12:00.000Z'}),
    false,
  )
  assert.equal(
    hasUnsyncedStudioEdits({studioEditedAt: '2026-11-04T01:00:00.000Z', studioEditsSyncedAt: '2026-11-03T04:12:00.000Z'}),
    true,
  )
  assert.throws(
    () => assertNoUnsyncedStudioEdits({_id: 'article-soya-misaki', studioEditedAt: '2026-11-03T04:12:00.000Z'}),
    /pull:studio-edits -- --article=soya-misaki/,
  )
  assert.doesNotThrow(() => assertNoUnsyncedStudioEdits({_id: 'article-a'}))
})

test('修改前後對照列出標題、摘要與正文的改動', () => {
  const git = '# 宗谷岬怎麼去\n\n第一段。\n\n第二段。\n'
  const studio = parseMarkdownBody('# 宗谷岬交通\n\n第一段。\n\n第二段改得更清楚。\n')
  const article = {
    _id: 'article-cape-soya-transport',
    title: studio.title,
    body: studio.blocks,
    seoTitle: '新的 SEO 標題',
    seoDescription: '一樣的描述',
    excerpt: '一樣的摘要',
    studioEditedAt: '2026-11-03T04:12:30.000Z',
  }
  const publication = {articleId: 'cape-soya-transport', seoTitle: '舊的 SEO 標題', seoDescription: '一樣的描述', excerpt: '一樣的摘要'}
  const {studioMarkdown, fieldChanges, paragraphChanges, report} = buildStudioEditReport(article, git, publication)

  assert.equal(studioMarkdown, '# 宗谷岬交通\n\n第一段。\n\n第二段改得更清楚。\n')
  assert.deepEqual(
    fieldChanges.map((change: {field: string}) => change.field),
    ['title', 'seoTitle'],
  )
  assert.deepEqual(paragraphChanges, [{type: 'changed', before: '第二段。', after: '第二段改得更清楚。'}])
  assert.match(report, /修改前：\n\n> 第二段。\n\n修改後：\n\n> 第二段改得更清楚。/)
  assert.deepEqual(applyFieldChanges(publication, fieldChanges), {...publication, seoTitle: '新的 SEO 標題'})
  assert.equal(editFolderName(article.studioEditedAt), '2026-11-03T0412Z')
})

test('後台的「開啟預覽」網址和網站的文章網址規則一致', () => {
  const hub = {slug: 'asahikawa', category: 'places', landing: 'article-asahikawa', parent: null}
  assert.equal(articlePath({id: 'article-asahikawa-food', slug: 'food', hub}), '/places/asahikawa/food/')
  assert.equal(articlePath({id: 'drafts.article-asahikawa', slug: 'asahikawa', hub}), '/places/asahikawa/')
  assert.equal(
    articlePath({id: 'article-x', slug: 'stay', hub: {slug: 'sounkyo', category: 'places', parent: 'hokkaido'}}),
    '/places/hokkaido/sounkyo-stay/',
  )
  assert.equal(articlePath({id: 'article-x', slug: 'stay', hub: null}), undefined)
})

test('抓回後台版本時，沒改的資料來源條目維持 Git 原本的寫法', () => {
  const git = ['## 延伸資料', '', '- **東川觀光協會**，官方介紹。https://example.jp/', '- **道草館**，開館時間。https://example.jp/m/'].join('\n')
  const studio = ['## 延伸資料', '', '- [東川觀光協會](https://example.jp/)，官方介紹。', '- [道草館](https://example.jp/other/)，開館時間。'].join('\n')
  assert.equal(
    keepGitSourceLines(git, studio),
    ['## 延伸資料', '', '- **東川觀光協會**，官方介紹。https://example.jp/', '- [道草館](https://example.jp/other/)，開館時間。'].join('\n'),
  )
  assert.equal(keepGitSourceLines(null, studio), studio)
})
