import assert from 'node:assert/strict'
import test from 'node:test'

import {makeRenamer} from '../scripts/rename-terms.mjs'

test('名字改寫：長的先比對、網址不動', () => {
  const rename = makeRenamer([
    {from: 'Uroko亭', to: '鱗亭'},
    {from: '海鮮爐端Uroko亭', to: '海鮮爐端鱗亭'},
    {from: 'Himawari', to: '向日葵'},
  ])
  assert.equal(rename('海鮮爐端Uroko亭（海鮮炉端うろこ亭），之後簡稱Uroko亭。'), '海鮮爐端鱗亭（海鮮炉端うろこ亭），之後簡稱鱗亭。')
  assert.equal(
    rename('拉麵專門Himawari的官網 https://example.jp/Himawari/ 營業到15:00'),
    '拉麵專門向日葵的官網 https://example.jp/Himawari/ 營業到15:00',
  )
  assert.equal(rename(''), '')
})
