import assert from 'node:assert/strict'
import test from 'node:test'
import {
  findInsertionKey,
  inlineImageFields,
  inlineImageKey,
  selectedInlineSlots,
} from '../scripts/inline-image-placement.mjs'

const heading = (key: string, text: string, style = 'h3') => ({
  _key: key,
  _type: 'block',
  style,
  children: [{_type: 'span', text}],
})
const paragraph = (key: string) => ({_key: key, _type: 'block', style: 'normal', children: [{_type: 'span', text: '段落'}]})

const body = [
  heading('h2a', '抵達利尻島之後', 'h2'),
  heading('h3a', '抵達鴛泊港與沓形港'),
  paragraph('p1'),
  paragraph('p2'),
  heading('h3b', '從利尻機場搭空港專用巴士'),
  paragraph('p3'),
]

test('文內照片接在指定標題下第幾個區塊之後', () => {
  assert.equal(findInsertionKey(body, {heading: '抵達鴛泊港與沓形港'}), 'p1')
  assert.equal(findInsertionKey(body, {heading: '抵達鴛泊港與沓形港', afterBlocks: 2}), 'p2')
  assert.equal(findInsertionKey(body, {heading: '抵達鴛泊港與沓形港', afterBlocks: 0}), 'h3a')
})

test('已插過的照片不算區塊數，重跑位置不變', () => {
  const withImage = [...body.slice(0, 3), {_key: inlineImageKey('terminal'), _type: 'image'}, ...body.slice(3)]
  assert.equal(findInsertionKey(withImage, {heading: '抵達鴛泊港與沓形港', afterBlocks: 2}), 'p2')
})

test('找不到標題、標題重複或超過該節區塊數都拒絕', () => {
  assert.throws(() => findInsertionKey(body, {heading: '不存在'}), /找不到標題/)
  assert.throws(() => findInsertionKey([...body, heading('dup', '抵達鴛泊港與沓形港')], {heading: '抵達鴛泊港與沓形港'}), /2 個標題/)
  assert.throws(() => findInsertionKey(body, {heading: '抵達鴛泊港與沓形港', afterBlocks: 3}), /下一個標題/)
})

test('圖片區塊帶替代文字、圖說、署名、來源頁與授權', () => {
  const fields = inlineImageFields(
    {slotId: 'terminal'},
    {
      altDraft: '鴛泊港渡輪站',
      captionDraft: '渡輪站入口。',
      creditDraft: '照片：A／Wikimedia Commons／CC BY-SA 4.0',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:A.jpg',
      licenseName: 'CC BY-SA 4.0',
    },
  )
  assert.deepEqual(fields, {
    alt: '鴛泊港渡輪站',
    caption: '渡輪站入口。',
    credit: '照片：A／Wikimedia Commons／CC BY-SA 4.0',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:A.jpg',
    license: 'CC BY-SA 4.0',
  })
  assert.throws(() => inlineImageFields({slotId: 'x'}, {altDraft: 'a', captionDraft: 'b'}), /creditDraft/)
})

test('只處理有 placement 的已選定文內照片，缺圖與封面不處理', () => {
  const plan = {
    status: 'selected',
    selectedCandidateIds: {cover: 'c1', terminal: 't1'},
    slots: [
      {slotId: 'cover', kind: 'cover', candidates: [{candidateId: 'c1'}]},
      {slotId: 'terminal', kind: 'inline', placement: {heading: 'H'}, preparation: {}, candidates: [{candidateId: 't1'}]},
      {slotId: 'bus', kind: 'inline', missingImageId: 'bus'},
    ],
  }
  assert.deepEqual(
    selectedInlineSlots(plan).map((item) => item.key),
    ['inline-image-terminal'],
  )
  const noPreparation = structuredClone(plan)
  delete noPreparation.slots[1].preparation
  assert.throws(() => selectedInlineSlots(noPreparation), /preparation/)
})
