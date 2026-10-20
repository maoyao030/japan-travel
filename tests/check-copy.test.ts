import assert from 'node:assert/strict'
import test from 'node:test'

import {findCopies} from '../.agents/skills/japan-travel-polish/scripts/check-copy.mjs'

const reference = '從小松機場前往金澤站，主要有幾種交通方式，每種方式都有各自的優缺點，可以依預算與行程挑選。'

test('和參考文章連續相同 12 字以上就抓出來，標點與數字不算', () => {
  const copied = '# 標題\n\n從稚內前往港口，每種方式都有各自的優缺點，可以依預算與行程挑選。\n'
  const hits = findCopies(copied, [{name: 'glt.txt', text: reference}])
  assert.equal(hits.length, 1)
  assert.match(hits[0].text, /每種方式都有各自的優缺點/)
  assert.equal(hits[0].source, 'glt.txt')
})

test('只學講法、句子不同就通過；標題、表格與時間價格不算抄', () => {
  const own = '# 每種方式都有各自的優缺點可以依預算與行程挑選\n\n| 每種方式都有各自的優缺點可以依預算與行程挑選 |\n\n從稚內搭船到利尻島約1小時40分，2等大人3,590日圓，怎麼選要看你哪個季節去。\n'
  assert.deepEqual(findCopies(own, [{name: 'glt.txt', text: reference}]), [])
})
