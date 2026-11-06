import assert from 'node:assert/strict'
import test from 'node:test'

import {insertCandidates} from '../scripts/preview-article.mjs'

const paragraph = (text: string) => ({_type: 'block', style: 'normal', children: [{_type: 'span', text}]})

test('候選照片插在指定段落後面，同一段的候選照順序排，找不到的列出來', () => {
  const body = [paragraph('第一段講渡輪。'), paragraph('第二段講早餐。')]
  const {body: placed, missing} = insertCandidates(body, [
    {near: '渡輪', label: '候選 1', url: 'https://a.jp/1.webp'},
    {near: '渡輪', label: '候選 2', url: 'https://a.jp/2.webp'},
    {near: '溫泉', label: '候選 3', url: 'https://a.jp/3.webp'},
  ])
  assert.deepEqual(placed.map((block: any) => block._key ?? block.children[0].text), ['第一段講渡輪。', 'candidate-候選 1', 'candidate-候選 2', '第二段講早餐。'])
  assert.deepEqual(missing, ['候選 3'])
})
