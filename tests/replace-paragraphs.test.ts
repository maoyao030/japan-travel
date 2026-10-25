import assert from 'node:assert/strict'
import test from 'node:test'

import {markdownPlainText, replaceParagraphs} from '../scripts/replace-paragraphs.mjs'

const block = (key: string, text: string, extra: Record<string, unknown> = {}) => ({
  _key: key,
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{_key: `${key}s`, _type: 'span', marks: [], text}],
  ...extra,
})

test('事實編號與粗體會先拿掉再比對', () => {
  assert.equal(markdownPlainText('風場已停止運轉[F98]。拆除中[F41, F42]。'), '風場已停止運轉。拆除中。')
  assert.equal(markdownPlainText('**鴛泊**：旅館雪国'), '鴛泊：旅館雪国')
})

test('只換指定段落，保留段落的 key 與其他段落', () => {
  const body = [block('a', '第一段。'), block('b', '舊的風車句。'), block('c', '第三段。')]
  const {body: next, changed} = replaceParagraphs(body, [{old: '舊的風車句[F41]。', new: '新的風車句[F98]。'}])
  assert.equal(next[0], body[0])
  assert.equal(next[2], body[2])
  assert.equal(next[1]._key, 'b')
  assert.equal(next[1].children.map((child: {text: string}) => child.text).join(''), '新的風車句。')
  assert.deepEqual(changed, [{blockKey: 'b', before: '舊的風車句。', after: '新的風車句。'}])
})

test('找不到或段落有連結時不替換', () => {
  const body = [block('a', '有連結的段落。', {markDefs: [{_key: 'm', _type: 'link', href: '/x/'}]})]
  assert.throws(() => replaceParagraphs(body, [{old: '不存在。', new: '新。'}]), /剛好出現一次/)
  assert.throws(() => replaceParagraphs(body, [{old: '有連結的段落。', new: '新。'}]), /有連結/)
})
