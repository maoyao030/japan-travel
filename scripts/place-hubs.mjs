// 地點分類的 Hub 欄位：從全站地點清單 content-planning/places.json 產生。
// 網站的發布門檻要求地點 Hub 有地點種類、日文原名與所屬地區（src/data/hubs.ts），
// prepare-parent-hub.mjs 建立或補齊 Hub 時用這裡的函式，網站的分類樹也從同一份清單取出。

/** 這些狀態的地點才會在網站上建頁；candidate 只是候選、merged 已併入別的地點。 */
export const SITE_PLACE_STATUSES = ['planned', 'published']

export function placeHubId(placeId) {
  return `hub-places-${placeId}`
}

export function getSitePlaces(registry) {
  const places = Array.isArray(registry?.places) ? registry.places : []
  return places.filter((place) => SITE_PLACE_STATUSES.includes(place?.status))
}

export function findPlace(registry, placeId) {
  return (registry?.places ?? []).find((place) => place?.placeId === placeId) ?? null
}

function placeReferences(placeIds, existingHubIds) {
  return (placeIds ?? [])
    .filter((placeId) => existingHubIds.has(placeHubId(placeId)))
    .map((placeId) => ({_key: placeId, _type: 'reference', _ref: placeHubId(placeId)}))
}

/**
 * 地點 Hub 應有的地點欄位。鄰近地點與出入口只連到 Sanity 已經存在的 Hub
 * （之後新群建好，再跑一次 prepare-parent-hub 就會補上）。
 */
export function buildPlaceHubFields({place, existingHubIds = new Set()}) {
  if (!place) throw new Error('地點清單裡找不到這個地點')
  const placeKind = place.kind === 'region' ? 'region' : 'place'
  const fields = {
    placeKind,
    nameJa: place.nameJa,
    nearbyPlaces: placeReferences(place.nearbyPlaceIds, existingHubIds),
    gatewayPlaces: placeReferences(place.gatewayPlaceIds, existingHubIds),
  }
  if (placeKind === 'place') {
    if (!place.region) throw new Error(`地點 ${place.placeId} 沒有填所屬地區 region`)
    fields.region = {_type: 'reference', _ref: placeHubId(place.region)}
  }
  return fields
}

function referenceIds(references) {
  return (references ?? []).map((reference) => reference?._ref ?? reference).filter(Boolean).sort()
}

/** Sanity 上的 Hub 和應有的地點欄位是否一致（回傳不一致的欄位名稱）。 */
export function diffPlaceHubFields(hub, fields) {
  const differences = []
  if (hub?.placeKind !== fields.placeKind) differences.push('placeKind')
  if (hub?.nameJa !== fields.nameJa) differences.push('nameJa')
  const hubRegion = hub?.regionId ?? hub?.region?._ref ?? null
  if (hubRegion !== (fields.region?._ref ?? null)) differences.push('region')
  for (const field of ['nearbyPlaces', 'gatewayPlaces']) {
    const hubIds = hub?.[`${field}Ids`] ?? referenceIds(hub?.[field])
    if (JSON.stringify([...hubIds].sort()) !== JSON.stringify(referenceIds(fields[field]))) {
      differences.push(field)
    }
  }
  return differences
}

function paragraphsToBlocks(paragraphs, prefix) {
  return paragraphs.map((paragraph, index) => ({
    _key: `${prefix}-intro-${String(index + 1).padStart(2, '0')}`,
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [
      {_key: `${prefix}-span-${String(index + 1).padStart(2, '0')}`, _type: 'span', marks: [], text: paragraph},
    ],
  }))
}

/** 地區 Hub（例如北海道）的完整文件，文案來自地點清單裡這個地區的 hub 欄位。一律先 noindex。 */
export function buildRegionHubDocument(regionPlace) {
  if (!regionPlace || regionPlace.kind !== 'region') throw new Error('不是地區，不能建立地區 Hub')
  const copy = regionPlace.hub
  if (
    !copy ||
    !copy.eyebrow ||
    !Array.isArray(copy.introduction) ||
    copy.introduction.length === 0 ||
    !Array.isArray(copy.checklist) ||
    copy.checklist.length < 3 ||
    !copy.seoTitle ||
    !copy.seoDescription
  ) {
    throw new Error(`地區 ${regionPlace.placeId} 在地點清單裡缺少 hub 文案（eyebrow、introduction、至少 3 條 checklist、seoTitle、seoDescription）`)
  }
  return {
    _id: placeHubId(regionPlace.placeId),
    _type: 'hub',
    title: regionPlace.nameZh,
    slug: {_type: 'slug', current: regionPlace.placeId},
    category: 'places',
    placeKind: 'region',
    nameJa: regionPlace.nameJa,
    eyebrow: copy.eyebrow,
    introduction: paragraphsToBlocks(copy.introduction, `region-${regionPlace.placeId}`),
    checklist: copy.checklist,
    seoTitle: copy.seoTitle,
    seoDescription: copy.seoDescription,
    publicationState: 'ready',
    researchValidated: true,
    noindex: true,
  }
}
