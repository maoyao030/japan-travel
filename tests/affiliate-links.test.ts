import assert from 'node:assert/strict'
import test from 'node:test'
import {isAffiliateHref, renderPortableText} from '../src/lib/portableText.ts'

function linkBlock(href: string) {
  return {
    _type: 'block',
    style: 'normal',
    markDefs: [{_key: 'l1', _type: 'link', href}],
    children: [{_type: 'span', text: '訂房頁', marks: ['l1']}],
  }
}

test('Trip.com 與 Agoda 連結標 sponsored', () => {
  for (const href of [
    'https://tw.trip.com/hotels/wakkanai-hotel-detail-123/',
    'https://www.agoda.com/zh-tw/some-hotel/hotel/wakkanai-jp.html',
  ]) {
    assert.equal(isAffiliateHref(href), true)
    assert.match(renderPortableText([linkBlock(href)] as never), /rel="sponsored noopener noreferrer"/)
  }
})

test('其他外部連結與相似網域不標 sponsored', () => {
  for (const href of ['https://heartlandferry.jp/', 'https://notrip.com/', 'https://trip.com.example.org/']) {
    assert.equal(isAffiliateHref(href), false)
    const html = renderPortableText([linkBlock(href)] as never)
    assert.doesNotMatch(html, /sponsored/)
    assert.match(html, /rel="noopener noreferrer"/)
  }
  assert.doesNotMatch(renderPortableText([linkBlock('/places/wakkanai/')] as never), /rel=/)
})
