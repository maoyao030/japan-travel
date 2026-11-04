import assert from 'node:assert/strict'
import test from 'node:test'

import {renderTableCell} from '../src/lib/portableText.ts'

test('表格格子的連結：外部網址加 rel，訂房網站加 sponsored，壞網址照原文', () => {
  assert.equal(
    renderTableCell('[官網](https://example.jp/)・[地圖](https://www.google.com/maps/search/?api=1&query=A%20B)'),
    '<a href="https://example.jp/" rel="noopener noreferrer">官網</a>・<a href="https://www.google.com/maps/search/?api=1&amp;query=A%20B" rel="noopener noreferrer">地圖</a>',
  )
  assert.equal(renderTableCell('[Trip.com](https://www.trip.com/hotels/1/)'), '<a href="https://www.trip.com/hotels/1/" rel="sponsored noopener noreferrer">Trip.com</a>')
  assert.equal(renderTableCell('[站內](/places/a/)'), '<a href="/places/a/">站內</a>')
  assert.equal(renderTableCell('[壞的](javascript:alert)'), '[壞的](javascript:alert)')
  assert.equal(renderTableCell('10:00～17:00 <週三>'), '10:00～17:00 &lt;週三&gt;')
})
