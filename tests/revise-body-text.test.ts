import assert from 'node:assert/strict'
import test from 'node:test'

import {checkTextRevision} from '../scripts/check-text-revision.mjs'
import {diffChars, reviseBlockSpans, reviseBodyText} from '../scripts/revise-body-text.mjs'

test('字元比對：留下沒變的字，插入放在正確的位置', () => {
  const {chars, keep, inserts} = diffChars('去ラーメン大王', '去拉麵大王（ラーメン大王）')
  const rebuilt = chars.map((char, index) => inserts[index] + (keep[index] ? char : '')).join('') + inserts[chars.length]
  assert.equal(rebuilt, '去拉麵大王（ラーメン大王）')
})

test('改名字時連結還在，插入的字不會跑進連結', () => {
  const block = {
    _key: 'b1',
    _type: 'block',
    style: 'normal',
    markDefs: [{_key: 'l1', _type: 'link', href: '/places/wakkanai/'}],
    children: [
      {_key: 's1', _type: 'span', marks: [], text: '吃完うろこ亭，可以看'},
      {_key: 's2', _type: 'span', marks: ['l1'], text: '稚內景點'},
      {_key: 's3', _type: 'span', marks: [], text: '。'},
    ],
  }
  const {block: revised, linkTextChanged} = reviseBlockSpans(block, '吃完Uroko亭（うろこ亭），可以看稚內景點。')
  assert.equal(linkTextChanged, false)
  assert.deepEqual(revised.children.map((span) => [span.marks, span.text]), [
    [[], '吃完Uroko亭（うろこ亭），可以看'],
    [['l1'], '稚內景點'],
    [[], '。'],
  ])
  assert.equal(revised.markDefs.length, 1)
})

const before = ['# 稚內美食', '', '中午去ラーメン大王本店。', '', '### 海鮮炉端うろこ亭', '', '| 店名 | 營業 |', '|---|---|', '| ラーメン大王本店 | 11:30 |', '', '沒改的段落。', ''].join('\n')
const after = ['# 稚內美食', '', '中午去拉麵大王本店（ラーメン大王本店）。', '', '### 海鮮爐端Uroko亭', '', '| 店名 | 營業 |', '|---|---|', '| 拉麵大王本店 | 11:30 |', '', '沒改的段落。', ''].join('\n')

const span = (text: string) => [{_key: `s${text.length}`, _type: 'span', marks: [], text}]
const liveBody = () => [
  {_key: 'p1', _type: 'block', style: 'normal', markDefs: [], children: span('中午去ラーメン大王本店。')},
  {_key: 'img', _type: 'image', asset: {_ref: 'image-1'}},
  {_key: 'h1', _type: 'block', style: 'h3', markDefs: [], children: span('海鮮炉端うろこ亭')},
  {_key: 't1', _type: 'contentTable', columns: ['店名', '營業'], rows: [{_key: 'r1', _type: 'contentTableRow', cells: ['ラーメン大王本店', '11:30']}]},
  {_key: 'p2', _type: 'block', style: 'normal', markDefs: [], children: span('沒改的段落。')},
]

test('只改有變的段落、標題與表格格子，照片與其他段落不動', () => {
  const body = liveBody()
  const {body: next, changes, unmatched} = reviseBodyText(body, before, after)
  assert.deepEqual(unmatched, [])
  assert.equal(changes.length, 3)
  assert.equal(next[0].children.map((child) => child.text).join(''), '中午去拉麵大王本店（ラーメン大王本店）。')
  assert.deepEqual(next[1], body[1])
  assert.equal(next[2].children[0].text, '海鮮爐端Uroko亭')
  assert.equal(next[3].rows[0].cells[0], '拉麵大王本店')
  assert.equal(next[3].rows[0]._key, 'r1')
  assert.deepEqual(next[4], body[4])
})

test('線上找不到對應段落時列出來，不猜', () => {
  const body = liveBody()
  body[0] = {...body[0], children: span('中午去ラーメン大王本店，線上已經改過。')}
  const {unmatched} = reviseBodyText(body, before, after)
  assert.equal(unmatched.length, 1)
  assert.equal(unmatched[0].kind, 'text')
})

test('修改前後段落數不同就拒絕', () => {
  assert.throws(() => reviseBodyText(liveBody(), before, after + '\n多一段。\n'), /段落數不同/)
})

const tagged = (name: string, price = '1,600') =>
  ['# 稚內美食', '', `源氏的${name}一份${price}日圓，扇貝來自潮流很快的宗谷海峽。拉麵大王週三公休，只收現金，出發前可以先到觀光案內所確認。[F1, F2]`, '', '## 資料來源', '', '- [源氏](https://example.invalid/)', ''].join('\n')

test('修訂安全檢查：只改名字通過，改了數字或事實編號就擋', () => {
  const ok = checkTextRevision(tagged('バター焼き'), tagged('奶油燒'), tagged('奶油燒').replace(/\[F1, F2\]/, ''))
  assert.deepEqual(ok.issues, [])
  const changedNumber = checkTextRevision(tagged('バター焼き'), tagged('奶油燒', '1,800'), tagged('奶油燒', '1,800').replace(/\[F1, F2\]/, ''))
  assert.ok(changedNumber.issues.some((issue) => issue.startsWith('數字變了')))
  const changedTag = checkTextRevision(tagged('バター焼き'), tagged('奶油燒').replace('[F1, F2]', '[F1]'), tagged('奶油燒').replace(/\[F1, F2\]/, ''))
  assert.ok(changedTag.issues.includes('事實編號的順序或數量變了'))
  const stillJapanese = checkTextRevision(tagged('バター焼き'), tagged('バター焼き'), tagged('バター焼き').replace(/\[F1, F2\]/, ''))
  assert.ok(stillJapanese.issues.some((issue) => issue.includes('括號外有日文')))
})
