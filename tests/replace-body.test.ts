import assert from 'node:assert/strict'
import test from 'node:test'

import {blockText} from '../scripts/link-backfill.mjs'
import {carriedBlockPlacements, rebuildBody, siteLinks} from '../scripts/replace-body.mjs'

const span = (key: string, text: string, marks: string[] = []) => ({_key: key, _type: 'span', marks, text})
const liveBody = [
  {_key: 'h1', _type: 'block', style: 'h2', markDefs: [], children: [span('a', '怎麼去')]},
  {_key: 'p1', _type: 'block', style: 'normal', markDefs: [], children: [span('b', '搭41號公車。')]},
  {_key: 'inline-image-gate', _type: 'image', asset: {_type: 'reference', _ref: 'image-1'}},
  {
    _key: 'p2',
    _type: 'block',
    style: 'normal',
    markDefs: [{_key: 'l1', _type: 'link', href: '/places/asahikawa/transport/'}],
    children: [span('c', '從札幌過來，可以看'), span('d', '旭川交通', ['l1']), span('e', '。')],
  },
  {_key: 'h2', _type: 'block', style: 'h2', markDefs: [], children: [span('f', '企鵝散步')]},
  {_key: 'p3', _type: 'block', style: 'normal', markDefs: [], children: [span('g', '冬天積雪後舉行。')]},
  {_key: 'inline-image-penguin', _type: 'image', asset: {_type: 'reference', _ref: 'image-2'}},
  {_key: 'media-embed-video', _type: 'mediaEmbed', url: 'https://www.youtube.com/watch?v=x'},
]

test('記下照片與嵌入在哪個標題底下、前面有幾段', () => {
  assert.deepEqual(
    carriedBlockPlacements(liveBody).map(({block, heading, afterBlocks}) => [block._key, heading, afterBlocks]),
    [
      ['inline-image-gate', '怎麼去', 1],
      ['inline-image-penguin', '企鵝散步', 1],
      ['media-embed-video', '企鵝散步', 1],
    ],
  )
})

test('站內連結記下錨文字與所在句子', () => {
  assert.deepEqual(siteLinks(liveBody), [{anchorText: '旭川交通', targetPath: '/places/asahikawa/transport/', sentence: '從札幌過來，可以看旭川交通。'}])
})

test('整篇換正文：照片、嵌入放回原位，連結句沒變就接上連結', () => {
  const markdown = ['# 旭山動物園', '', '開頭。', '', '## 怎麼去', '', '旭川站前搭41號公車，約40分鐘。', '', '從札幌過來，可以看旭川交通。', '', '## 企鵝散步', '', '只在冬天積雪後舉行。', '', '一天兩次。', ''].join('\n')
  const {body, carried, notCarried} = rebuildBody(liveBody, markdown, {articleId: 'asahiyama-zoo'})
  assert.deepEqual(notCarried, [])
  assert.deepEqual(
    body.map((block: any) => block._type === 'block' ? blockText(block) : block._key),
    ['開頭。', '怎麼去', '旭川站前搭41號公車，約40分鐘。', 'inline-image-gate', '從札幌過來，可以看旭川交通。', '企鵝散步', '只在冬天積雪後舉行。', 'inline-image-penguin', 'media-embed-video', '一天兩次。'],
  )
  const linked = body.find((block: any) => blockText(block).startsWith('從札幌'))
  assert.equal(linked.markDefs[0].href, '/places/asahikawa/transport/')
  assert.equal(carried.filter((item: any) => item.kind === 'link')[0].how, 'sentence')
})

test('句子改了只剩錨文字時也接得上；錨文字不唯一就列出來', () => {
  const changed = ['# 旭山動物園', '', '## 怎麼去', '', '要從札幌出發的話，先看旭川交通。', '', '## 企鵝散步', '', '冬天。', ''].join('\n')
  assert.equal(rebuildBody(liveBody, changed).notCarried.length, 0)
  const twice = ['# 旭山動物園', '', '## 怎麼去', '', '旭川交通很方便，詳見旭川交通。', '', '## 企鵝散步', '', '冬天。', ''].join('\n')
  const result = rebuildBody(liveBody, twice)
  assert.equal(result.notCarried.length, 1)
  assert.equal(result.notCarried[0].kind, 'link')
})

test('標題不見了的照片列在搬不過去', () => {
  const markdown = ['# 旭山動物園', '', '## 怎麼去', '', '搭公車，可以看旭川交通。', ''].join('\n')
  const {notCarried} = rebuildBody(liveBody, markdown)
  assert.deepEqual(notCarried.map((item: any) => item.key), ['inline-image-penguin', 'media-embed-video'])
})

test('連結句改寫過：照新舊對照找新句，錨文字出現兩次也接得上', () => {
  const markdown = ['# 旭山動物園', '', '## 怎麼去', '', '旭川交通很方便。還要從札幌先到旭川站的話，旭川交通整理了各種走法。', '', '## 企鵝散步', '', '冬天。', ''].join('\n')
  const renamedSentences = [{to: 'asahikawa-transport', old: '從札幌過來，可以看旭川交通。', new: '還要從札幌先到旭川站的話，旭川交通整理了各種走法。', anchor: '旭川交通'}]
  const {body, notCarried} = rebuildBody(liveBody, markdown, {renamedSentences})
  assert.equal(notCarried.filter((item: any) => item.kind === 'link').length, 0)
  const block = body.find((candidate: any) => candidate.markDefs?.length)
  const linked = block.children.find((child: any) => child.marks?.length)
  assert.equal(linked.text, '旭川交通')
  assert.ok(blockText(block).indexOf('旭川交通整理') > 0)
})
