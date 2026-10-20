import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import {
  buildPlaceHubFields,
  buildRegionHubDocument,
  diffPlaceHubFields,
  findPlace,
  getSitePlaces,
} from '../scripts/place-hubs.mjs'
import {siteCategories} from '../src/data/categories.ts'

const projectRoot = path.resolve(import.meta.dirname, '..')
const registry = JSON.parse(await readFile(path.join(projectRoot, 'content-planning', 'places.json'), 'utf8'))

test('地點 Hub 的種類、日文名與所屬地區來自地點清單，鄰近地點只連已存在的 Hub', () => {
  const rishiri = findPlace(registry, 'rishiri-island')
  const fields = buildPlaceHubFields({
    place: rishiri,
    existingHubIds: new Set(['hub-places-wakkanai', 'hub-places-hokkaido']),
  })
  assert.equal(fields.placeKind, 'place')
  assert.equal(fields.nameJa, '利尻島')
  assert.deepEqual(fields.region, {_type: 'reference', _ref: 'hub-places-hokkaido'})
  assert.deepEqual(fields.nearbyPlaces.map((item: {_ref: string}) => item._ref), ['hub-places-wakkanai'])
  assert.deepEqual(fields.gatewayPlaces.map((item: {_ref: string}) => item._ref), ['hub-places-wakkanai'])
})

test('地點欄位不一致時列出要補的欄位，一致時回傳空陣列', () => {
  const fields = buildPlaceHubFields({place: findPlace(registry, 'wakkanai'), existingHubIds: new Set()})
  assert.deepEqual(diffPlaceHubFields({}, fields).sort(), ['nameJa', 'placeKind', 'region'])
  assert.deepEqual(
    diffPlaceHubFields(
      {placeKind: 'place', nameJa: '稚内', regionId: 'hub-places-hokkaido', nearbyPlacesIds: null, gatewayPlacesIds: []},
      fields,
    ),
    [],
  )
})

test('地區 Hub 用清單裡的文案建立，一律先 noindex；缺文案就拒絕', () => {
  const hokkaido = buildRegionHubDocument(findPlace(registry, 'hokkaido'))
  assert.equal(hokkaido._id, 'hub-places-hokkaido')
  assert.equal(hokkaido.placeKind, 'region')
  assert.equal(hokkaido.noindex, true)
  assert.ok(hokkaido.checklist.length >= 3)
  assert.throws(() => buildRegionHubDocument({placeId: 'x', kind: 'region', nameZh: 'x', nameJa: 'x'}), /缺少 hub 文案/)
  assert.throws(() => buildRegionHubDocument(findPlace(registry, 'wakkanai')), /不是地區/)
})

test('網站的地點主題中心跟著地點清單，候選地點不建頁', () => {
  const places = siteCategories.find((category) => category.slug === 'places')
  const slugs = places?.topics.map((topic) => topic.slug) ?? []
  assert.deepEqual(slugs, getSitePlaces(registry).map((place: {placeId: string}) => place.placeId))
  assert.ok(slugs.includes('hokkaido') && slugs.includes('wakkanai'))
  assert.ok(!slugs.includes('sapporo'))
  assert.equal(places?.topics.find((topic) => topic.slug === 'wakkanai')?.title, '稚內')
})
