import assert from 'node:assert/strict'
import test from 'node:test'

// @ts-expect-error 純 JS 模組
import {checkStayTopic} from '../scripts/check-stay-topic.mjs'

const page = (overrides: {opening?: string; h3?: string; booking?: string; extra?: string; tail?: string} = {}) =>
  [
    '# 旭川飯店早餐推薦，兩間飯店的早餐比較',
    '',
    overrides.opening ?? '冬天早上不想出門找早餐，所以很多人挑飯店時會順便看早餐。這一頁整理了兩間飯店的早餐。',
    '',
    '## 旭川飯店早餐吃得到海鮮丼的兩間',
    '',
    `### ${overrides.h3 ?? '甲飯店旭川早餐'}`,
    '',
    '海鮮丼自己盛。有住客覺得好吃。',
    '',
    overrides.booking ?? '看房價與訂房：[Trip.com](https://tw.trip.com/hotels/detail-1/)｜[官網](https://example.com/a)',
    '',
    overrides.extra ?? '',
    '',
    '## 旭川飯店早餐比較表',
    '',
    '| 飯店 | 早餐時間 | 連結 |',
    '|---|---|---|',
    '| 甲飯店旭川 | 6:30～9:30 | [官網](https://example.com/a) |',
    '',
    '## 資料來源',
    '',
    '- [甲飯店旭川官網](https://example.com/a)',
    '',
    overrides.tail ?? '資料更新：2026年11月',
    '',
  ].join('\n')

test('合格的住宿專門頁通過', () => {
  assert.deepEqual(checkStayTopic(page()).errors, [])
})

test('開頭點飯店名或時間、H3 用問句、少了訂房行都擋下', () => {
  assert.match(checkStayTopic(page({opening: '甲飯店旭川早上6點半就開。'})).errors.join('\n'), /開頭/)
  assert.match(checkStayTopic(page({h3: '甲飯店旭川早餐幾點？'})).errors.join('\n'), /不用問句/)
  assert.match(checkStayTopic(page({booking: ''})).errors.join('\n'), /看房價與訂房/)
  assert.match(checkStayTopic(page({tail: ''})).errors.join('\n'), /資料更新/)
})

test('只有住客能泡不算住客說法；一間兩句住客說法才擋', () => {
  assert.deepEqual(checkStayTopic(page({extra: '大浴場只有住客能泡。'})).errors, [])
  const two = page().replace('有住客覺得好吃。', '有住客覺得好吃。有住客提到早上人多。')
  assert.match(checkStayTopic(two).errors.join('\n'), /一間最多一句/)
})
