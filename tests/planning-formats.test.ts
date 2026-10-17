import assert from 'node:assert/strict'
import test from 'node:test'

import {checkPlanning} from '../scripts/check-planning.mjs'
import {validateFactTable, validateOutline, validateOwnership, validatePlaces} from '../scripts/planning-formats.mjs'

type AnyRecord = Record<string, any>

function place(placeId: string, nameZh: string, overrides: AnyRecord = {}): AnyRecord {
  return {placeId, nameZh, nameJa: nameZh, kind: 'place', region: 'hokkaido', groupId: 'g', status: 'planned', gatewayPlaceIds: [], nearbyPlaceIds: [], ...overrides}
}

function placesDoc(overrides: AnyRecord = {}): AnyRecord {
  return {
    schemaVersion: 1,
    places: [place('rebun-island', '禮文島', {gatewayPlaceIds: ['wakkanai']}), place('wakkanai', '稚內')],
    groups: [{groupId: 'g', label: '稚內群', placeIds: ['rebun-island', 'wakkanai'], gatewayPlaceIds: ['wakkanai'], selectedAt: '2026-10-16', reasons: ['第一群']}],
    ...overrides,
  }
}

function factTable(): AnyRecord {
  return {
    schemaVersion: 1,
    placeId: 'rebun-island',
    facts: [
      {factId: 'F1', claim: '稚內到香深約 1 小時 55 分', quote: '所要時間 1時間55分', sourceUrl: 'https://example.invalid/t', checkedAt: '2026-10-16', changeType: 'timetable', nextCheckAt: '2027-03-31'},
      {factId: 'F2', claim: '香深港在島南端', quote: '島の南部', sourceUrl: 'https://example.invalid/m', checkedAt: '2026-10-16', changeType: 'stable'},
    ],
  }
}

function outline(overrides: AnyRecord = {}): AnyRecord {
  return {
    schemaVersion: 1,
    groupId: 'g',
    pages: [
      {
        articleId: 'rebun-island-transport',
        pageType: 'aspect-page',
        placeId: 'rebun-island',
        targetPath: '/places/rebun-island/transport/',
        primaryQuery: '禮文島交通',
        secondaryQueries: ['禮文島觀光巴士'],
        h1: '禮文島交通，渡輪與觀光巴士',
        mustAnswer: ['從稚內怎麼去'],
        headings: [
          {level: 2, text: '禮文島怎麼去？', facts: ['rebun-island:F1'], answers: [0]},
          {level: 2, text: '禮文島觀光巴士'},
          {level: 2, text: '資料來源'},
        ],
      },
      {
        articleId: 'rebun-island',
        pageType: 'place-entry',
        placeId: 'rebun-island',
        targetPath: '/places/rebun-island/',
        primaryQuery: '禮文島',
        h1: '禮文島自由行，值不值得去',
        mustAnswer: [],
        headings: [{level: 2, text: '禮文島值得去嗎？', facts: ['rebun-island:F2']}],
      },
    ],
    division: [{topicKey: 'rebun-ferry-timetable', description: '稚內到香深的班次', owner: 'rebun-island-transport', summarizedBy: ['rebun-island']}],
    links: [
      {from: 'rebun-island-transport', to: 'rebun-island', purpose: '回總覽'},
      {from: 'rebun-island', to: 'rebun-island-transport', purpose: '看班次'},
    ],
    writingOrder: ['rebun-island-transport', 'rebun-island'],
    ...overrides,
  }
}

const context = () => ({places: placesDoc(), ownership: {schemaVersion: 1, owners: []}, factTables: {'rebun-island': factTable()}})

test('repo 內的規劃檔都通過檢查', async () => {
  for (const {file, issues} of await checkPlanning()) assert.deepEqual(issues, [], file)
})

test('全站地點清單：一群最多 6 個地點、必填對外出入口、參照的地點要先登記', () => {
  assert.deepEqual(validatePlaces(placesDoc()), [])
  const many = placesDoc()
  many.places.push(...['a', 'b', 'c', 'd', 'e'].map((id) => place(id, id)))
  many.groups[0].placeIds.push('a', 'b', 'c', 'd', 'e')
  assert.match(validatePlaces(many).join('\n'), /超過 6 個地點/)
  const noGateway = placesDoc()
  noGateway.groups[0].gatewayPlaceIds = []
  assert.match(validatePlaces(noGateway).join('\n'), /必須填對外出入口/)
  const unknown = placesDoc()
  unknown.places[0].nearbyPlaceIds = ['monbetsu']
  assert.match(validatePlaces(unknown).join('\n'), /指向不存在的地點：monbetsu/)
})

test('全站分工表：一件事只能有一頁負責', () => {
  const entry = {topicKey: 'rebun-ferry', description: '渡輪班次', ownerArticleId: 'rebun-island-transport', summaryArticleIds: []}
  assert.deepEqual(validateOwnership({schemaVersion: 1, owners: [entry]}), [])
  assert.match(validateOwnership({schemaVersion: 1, owners: [entry, entry]}).join('\n'), /只能有一頁負責/)
})

test('地點事實表：會變的事實要有下次查核日，不會變的不填', () => {
  assert.deepEqual(validateFactTable(factTable()), [])
  const missing = factTable()
  delete missing.facts[0].nextCheckAt
  assert.match(validateFactTable(missing).join('\n'), /nextCheckAt 必須是 YYYY-MM-DD/)
  const stable = factTable()
  stable.facts[1].nextCheckAt = '2027-01-01'
  assert.match(validateFactTable(stable).join('\n'), /不會變的事實不填 nextCheckAt/)
})

test('群大綱：標題、必答問題、事實編號、分工、內連與寫作順序', () => {
  assert.deepEqual(validateOutline(outline(), context()), [])

  const badH1 = outline()
  badH1.pages[0].h1 = '渡輪與觀光巴士：怎麼搭'
  const h1Issues = validateOutline(badH1, context()).join('\n')
  assert.match(h1Issues, /h1 不得用冒號/)
  assert.match(h1Issues, /h1 必須包含主要查詢/)

  const noPlace = outline()
  noPlace.pages[0].headings[1].text = '觀光巴士'
  const placeIssues = validateOutline(noPlace, context()).join('\n')
  assert.match(placeIssues, /正文 H2 要帶地名「禮文島」/)
  assert.match(placeIssues, /次要查詢「禮文島觀光巴士」不在任何 H2／H3/)

  const unanswered = outline()
  unanswered.pages[0].headings[0].answers = []
  assert.match(validateOutline(unanswered, context()).join('\n'), /必答問題沒有對應的標題：從稚內怎麼去/)

  const badFact = outline()
  badFact.pages[0].headings[0].facts = ['rebun-island:F99']
  assert.match(validateOutline(badFact, context()).join('\n'), /F99 不在事實表/)

  const taken = context()
  taken.ownership.owners.push({topicKey: 'rebun-ferry-timetable', description: '班次', ownerArticleId: 'wakkanai-transport', summaryArticleIds: []})
  assert.match(validateOutline(outline(), taken).join('\n'), /已由 wakkanai-transport 負責/)

  const noBackLink = outline({links: [{from: 'rebun-island', to: 'rebun-island-transport', purpose: '看班次'}]})
  assert.match(validateOutline(noBackLink, context()).join('\n'), /要連回地點主頁 rebun-island/)

  const entryFirst = outline({writingOrder: ['rebun-island', 'rebun-island-transport']})
  assert.match(validateOutline(entryFirst, context()).join('\n'), /地點主頁 rebun-island 要排在 rebun-island-transport 之後/)
})
