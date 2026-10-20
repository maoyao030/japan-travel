/**
 * 規劃檔的格式檢查：全站地點清單、全站分工表、地點事實表、旅行群大綱。
 * 規則來源：選題 Skill 的 selection-workflow.md、next-group.md，寫作 Skill 的 page-types.md、research-record.md。
 */

export const PLACE_KINDS = ['place', 'district', 'region']
export const PLACE_STATUSES = ['candidate', 'planned', 'published', 'merged', 'excluded']
export const MAX_PLACES_PER_GROUP = 6
export const CHANGE_TYPES = [
  'timetable',
  'annual-event',
  'price',
  'stay',
  'shop-hours',
  'seasonal-opening',
  'popularity',
  'climate-normal',
  'stable',
]
// 缺口的原因（2026-10-18）：缺口只記在事實表給重查用，不寫進正文。
export const GAP_KINDS = [
  'no-source', // 沒有官方或經營者網站
  'not-stated', // 有來源，但沒寫這一項
  'not-announced', // 還沒公布（例如明年的日期與班表）
  'unreadable', // 來源存在但這次讀不到（PDF 是圖片、要執行 JavaScript、擋讀取工具）
  'conflicting', // 官方說法不一致
  'not-researched', // 這次沒查到這一格
]
// 這幾種有明確的重查時機，一定要填下次查核日
export const GAP_KINDS_WITH_RECHECK = ['not-announced', 'unreadable', 'conflicting']
export const OUTLINE_PAGE_TYPES = ['place-entry', 'aspect-page', 'cross-place-page', 'topic-page', 'shared-guide']
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const NON_TOPIC_HEADINGS = new Set(['常見問題', '延伸資料', '資料來源'])

const hasText = (value) => typeof value === 'string' && value.trim().length > 0
const isUrl = (value) => /^https?:\/\//.test(value ?? '')

// ---------------------------------------------------------------------------
// 全站地點清單 content-planning/places.json
// ---------------------------------------------------------------------------

export function validatePlaces(document) {
  const issues = []
  if (document?.schemaVersion !== 1) issues.push('places.schemaVersion 必須是 1')
  const places = Array.isArray(document?.places) ? document.places : []
  const groups = Array.isArray(document?.groups) ? document.groups : []
  const ids = new Set()
  for (const [index, place] of places.entries()) {
    const label = `places[${index}]`
    if (!SLUG.test(place?.placeId ?? '')) issues.push(`${label}.placeId 格式錯誤`)
    if (ids.has(place?.placeId)) issues.push(`${label}.placeId 重複：${place?.placeId}`)
    ids.add(place?.placeId)
    if (!hasText(place?.nameZh) || !hasText(place?.nameJa)) issues.push(`${label} 必須有繁中名 nameZh 與日文名 nameJa`)
    if (!PLACE_KINDS.includes(place?.kind)) issues.push(`${label}.kind 必須是 ${PLACE_KINDS.join('、')} 之一`)
    if (!PLACE_STATUSES.includes(place?.status)) issues.push(`${label}.status 必須是 ${PLACE_STATUSES.join('、')} 之一`)
    if (place?.status === 'merged' && !hasText(place?.mergedInto)) issues.push(`${label} 併入鄰近地點時要寫 mergedInto`)
  }
  for (const [index, place] of places.entries()) {
    const label = `places[${index}]`
    for (const field of ['gatewayPlaceIds', 'nearbyPlaceIds']) {
      for (const ref of place?.[field] ?? []) {
        if (!ids.has(ref)) issues.push(`${label}.${field} 指向不存在的地點：${ref}（還沒規劃的地點也要先登記成 candidate）`)
        if (ref === place.placeId) issues.push(`${label}.${field} 不能指向自己`)
      }
    }
    if (place?.mergedInto && !ids.has(place.mergedInto)) issues.push(`${label}.mergedInto 指向不存在的地點`)
  }

  const membership = new Map()
  const groupIds = new Set()
  for (const [index, group] of groups.entries()) {
    const label = `groups[${index}]`
    if (!SLUG.test(group?.groupId ?? '')) issues.push(`${label}.groupId 格式錯誤`)
    if (groupIds.has(group?.groupId)) issues.push(`${label}.groupId 重複`)
    groupIds.add(group?.groupId)
    const members = Array.isArray(group?.placeIds) ? group.placeIds : []
    if (members.length === 0) issues.push(`${label}.placeIds 不得為空`)
    if (members.length > MAX_PLACES_PER_GROUP) issues.push(`${label} 超過 ${MAX_PLACES_PER_GROUP} 個地點，請依出入口拆群`)
    for (const placeId of members) {
      if (!ids.has(placeId)) issues.push(`${label}.placeIds 指向不存在的地點：${placeId}`)
      if (membership.has(placeId)) issues.push(`${label}.placeIds 的 ${placeId} 已經屬於 ${membership.get(placeId)}`)
      membership.set(placeId, group?.groupId)
    }
    const gateways = Array.isArray(group?.gatewayPlaceIds) ? group.gatewayPlaceIds : []
    if (gateways.length === 0) issues.push(`${label} 必須填對外出入口 gatewayPlaceIds`)
    for (const placeId of gateways) if (!ids.has(placeId)) issues.push(`${label}.gatewayPlaceIds 指向不存在的地點：${placeId}`)
    if (!ISO_DATE.test(group?.selectedAt ?? '')) issues.push(`${label}.selectedAt 必須是 YYYY-MM-DD`)
    if (!Array.isArray(group?.reasons) || group.reasons.length === 0) issues.push(`${label}.reasons 要記錄選這一群的理由與證據`)
  }
  for (const [index, place] of places.entries()) {
    if (place?.groupId && membership.get(place.placeId) !== place.groupId) {
      issues.push(`places[${index}].groupId 與 groups 的成員不一致`)
    }
  }
  return issues
}

// ---------------------------------------------------------------------------
// 全站分工表 content-planning/ownership.json
// ---------------------------------------------------------------------------

export function validateOwnership(document) {
  const issues = []
  if (document?.schemaVersion !== 1) issues.push('ownership.schemaVersion 必須是 1')
  const owners = Array.isArray(document?.owners) ? document.owners : []
  const keys = new Set()
  for (const [index, entry] of owners.entries()) {
    const label = `owners[${index}]`
    if (!SLUG.test(entry?.topicKey ?? '')) issues.push(`${label}.topicKey 格式錯誤`)
    if (keys.has(entry?.topicKey)) issues.push(`${label}.topicKey 重複：一件事只能有一頁負責（${entry?.topicKey}）`)
    keys.add(entry?.topicKey)
    if (!hasText(entry?.description)) issues.push(`${label}.description 不得為空`)
    if (!SLUG.test(entry?.ownerArticleId ?? '')) issues.push(`${label}.ownerArticleId 格式錯誤`)
    if ((entry?.summaryArticleIds ?? []).includes(entry?.ownerArticleId)) issues.push(`${label} 負責頁不能同時列在只摘要的頁`)
  }
  return issues
}

// ---------------------------------------------------------------------------
// 地點事實表 content-planning/<地區>/places/<地點>/facts.json
// ---------------------------------------------------------------------------

export function validateFactTable(document) {
  const issues = []
  if (document?.schemaVersion !== 1) issues.push('facts.schemaVersion 必須是 1')
  if (!SLUG.test(document?.placeId ?? '')) issues.push('facts.placeId 格式錯誤')
  const facts = Array.isArray(document?.facts) ? document.facts : []
  const ids = new Set()
  for (const [index, fact] of facts.entries()) {
    const label = `facts[${index}]`
    if (!/^F\d+$/.test(fact?.factId ?? '')) issues.push(`${label}.factId 格式是 F 加數字`)
    if (ids.has(fact?.factId)) issues.push(`${label}.factId 重複：${fact?.factId}（編號一經使用不改號）`)
    ids.add(fact?.factId)
    if (fact?.decision === 'removed') continue
    for (const ref of fact?.derivedFrom ?? []) {
      const local = /^F\d+$/.test(ref)
      if (!local && !/^[a-z0-9-]+:F\d+$/.test(ref)) issues.push(`${label}.derivedFrom 的 ${ref} 格式要是 F12 或 地點:F12`)
      else if (local && !facts.some((other) => other?.factId === ref)) issues.push(`${label}.derivedFrom 指向不存在的 ${ref}`)
    }
    if (fact?.kind === 'gap') {
      if (!hasText(fact?.claim)) issues.push(`${label} 缺口要在 claim 寫缺的是什麼`)
      if (!GAP_KINDS.includes(fact?.gapKind)) issues.push(`${label}.gapKind 必須是 ${GAP_KINDS.join('、')} 之一`)
      if (!ISO_DATE.test(fact?.checkedAt ?? '')) issues.push(`${label}.checkedAt 必須是 YYYY-MM-DD`)
      if (fact?.sourceUrl && !isUrl(fact.sourceUrl)) issues.push(`${label}.sourceUrl 必須是網址`)
      if (GAP_KINDS_WITH_RECHECK.includes(fact?.gapKind)) {
        if (!ISO_DATE.test(fact?.nextCheckAt ?? '')) issues.push(`${label} 這種缺口要填下次查核日 nextCheckAt`)
        else if (fact.nextCheckAt <= fact.checkedAt) issues.push(`${label}.nextCheckAt 必須晚於 checkedAt`)
      }
      continue
    }
    if (fact?.kind && fact.kind !== 'fact') issues.push(`${label}.kind 只能是 fact 或 gap`)
    if (!hasText(fact?.claim) || !hasText(fact?.quote)) issues.push(`${label} 必須有主張 claim 與原文摘錄 quote`)
    if (!isUrl(fact?.sourceUrl)) issues.push(`${label}.sourceUrl 必須是網址`)
    if (!ISO_DATE.test(fact?.checkedAt ?? '')) issues.push(`${label}.checkedAt 必須是 YYYY-MM-DD`)
    if (!CHANGE_TYPES.includes(fact?.changeType)) issues.push(`${label}.changeType 必須是 ${CHANGE_TYPES.join('、')} 之一`)
    if (fact?.changeType === 'stable') {
      if (fact?.nextCheckAt) issues.push(`${label} 不會變的事實不填 nextCheckAt`)
    } else if (!ISO_DATE.test(fact?.nextCheckAt ?? '')) {
      issues.push(`${label}.nextCheckAt 必須是 YYYY-MM-DD（給明年的更新後門）`)
    } else if (fact.nextCheckAt <= fact.checkedAt) {
      issues.push(`${label}.nextCheckAt 必須晚於 checkedAt`)
    }
  }
  return issues
}

export function factIdsOf(document) {
  return new Set((document?.facts ?? []).filter((fact) => fact?.decision !== 'removed').map((fact) => fact.factId))
}

export function gapIdsOf(document) {
  return new Set((document?.facts ?? []).filter((fact) => fact?.kind === 'gap' && fact?.decision !== 'removed').map((fact) => fact.factId))
}

// ---------------------------------------------------------------------------
// 旅行群大綱 content-planning/<地區>/<群>-outline.json
// ---------------------------------------------------------------------------

/**
 * places：validatePlaces 用的同一份清單；ownership：全站分工表；factTables：{placeId: 事實表}。
 * 大綱裡的事實編號寫成「<地點>:F12」，跨地點引用也能檢查。
 */
export function validateOutline(outline, {places = {places: []}, ownership = {owners: []}, factTables = {}} = {}) {
  const issues = []
  if (outline?.schemaVersion !== 1) issues.push('outline.schemaVersion 必須是 1')
  if (!SLUG.test(outline?.groupId ?? '')) issues.push('outline.groupId 格式錯誤')
  const placeById = new Map((places.places ?? []).map((place) => [place.placeId, place]))
  const pages = Array.isArray(outline?.pages) ? outline.pages : []
  const pageById = new Map()
  for (const page of pages) pageById.set(page?.articleId, page)

  for (const [index, page] of pages.entries()) {
    const label = `pages[${index}]（${page?.articleId ?? '?'}）`
    if (!SLUG.test(page?.articleId ?? '')) issues.push(`${label}.articleId 格式錯誤`)
    if (!OUTLINE_PAGE_TYPES.includes(page?.pageType)) issues.push(`${label}.pageType 不正確`)
    if (!hasText(page?.targetPath)) issues.push(`${label}.targetPath 不得為空`)
    const place = page?.placeId ? placeById.get(page.placeId) : null
    if (['place-entry', 'aspect-page'].includes(page?.pageType) && !place) issues.push(`${label}.placeId 要對到全站地點清單`)

    if (!hasText(page?.h1)) issues.push(`${label}.h1 不得為空`)
    else {
      if (/[:：]/.test(page.h1)) issues.push(`${label}.h1 不得用冒號`)
      if (hasText(page?.primaryQuery) && !page.h1.includes(page.primaryQuery)) issues.push(`${label}.h1 必須包含主要查詢「${page.primaryQuery}」`)
    }

    const headings = Array.isArray(page?.headings) ? page.headings : []
    let seenH2 = false
    const answered = new Set()
    for (const [headingIndex, heading] of headings.entries()) {
      const headingLabel = `${label}.headings[${headingIndex}]`
      if (heading?.level === 2) seenH2 = true
      else if (heading?.level === 3) {
        if (!seenH2) issues.push(`${headingLabel} H3 前面必須先有 H2`)
      } else issues.push(`${headingLabel}.level 只能是 2 或 3`)
      if (!hasText(heading?.text)) {
        issues.push(`${headingLabel}.text 不得為空`)
        continue
      }
      if (/[:：]/.test(heading.text)) issues.push(`${headingLabel} 標題不得用冒號`)
      if (heading.level === 2 && place && !NON_TOPIC_HEADINGS.has(heading.text) && !heading.text.includes(place.nameZh)) {
        issues.push(`${headingLabel}「${heading.text}」正文 H2 要帶地名「${place.nameZh}」`)
      }
      for (const factRef of heading?.facts ?? []) {
        const [factPlace, factId] = String(factRef).split(':')
        const table = factTables[factPlace]
        if (!table) issues.push(`${headingLabel} 引用的 ${factRef} 找不到地點事實表`)
        else if (!factIdsOf(table).has(factId)) issues.push(`${headingLabel} 引用的 ${factRef} 不在事實表`)
        else if (gapIdsOf(table).has(factId)) issues.push(`${headingLabel} 引用的 ${factRef} 是缺口；查不到的不寫進正文`)
      }
      for (const answerIndex of heading?.answers ?? []) answered.add(answerIndex)
    }
    for (const [answerIndex, question] of (page?.mustAnswer ?? []).entries()) {
      if (!answered.has(answerIndex)) issues.push(`${label} 必答問題沒有對應的標題：${question}`)
    }
    const headingText = headings.map((heading) => heading.text ?? '').join('\n')
    for (const query of page?.secondaryQueries ?? []) {
      if (!headingText.includes(query)) issues.push(`${label} 次要查詢「${query}」不在任何 H2／H3`)
    }
  }

  // 分工：大綱內一件事只有一頁負責，而且不能搶全站分工表裡別頁已負責的事。
  const siteOwners = new Map((ownership.owners ?? []).map((entry) => [entry.topicKey, entry.ownerArticleId]))
  const outlineKeys = new Set()
  for (const [index, entry] of (outline?.division ?? []).entries()) {
    const label = `division[${index}]（${entry?.topicKey ?? '?'}）`
    if (outlineKeys.has(entry?.topicKey)) issues.push(`${label} 同一件事有兩個負責頁`)
    outlineKeys.add(entry?.topicKey)
    const siteOwner = siteOwners.get(entry?.topicKey)
    if (siteOwner && siteOwner !== entry?.owner) issues.push(`${label} 已由 ${siteOwner} 負責（先上線的負責），本群只能摘要並連過去`)
    if (!siteOwner && !pageById.has(entry?.owner)) issues.push(`${label}.owner 不是本群的頁面`)
    for (const summary of entry?.summarizedBy ?? []) {
      if (summary === entry?.owner) issues.push(`${label} 負責頁不能同時只摘要`)
      if (!pageById.has(summary)) issues.push(`${label}.summarizedBy 的 ${summary} 不是本群的頁面`)
    }
  }

  // 內連：主題頁連回主頁、主頁連到同地點每個主題頁；連結的兩端要是本群頁面，或標明是群外頁面。
  const links = Array.isArray(outline?.links) ? outline.links : []
  const hasLink = (from, to) => links.some((link) => link.from === from && link.to === to)
  for (const [index, link] of links.entries()) {
    if (!pageById.has(link?.from)) issues.push(`links[${index}].from 不是本群的頁面`)
    if (!pageById.has(link?.to) && link?.external !== true) issues.push(`links[${index}].to 不是本群的頁面；群外頁面要標 external`)
    if (!hasText(link?.purpose)) issues.push(`links[${index}].purpose 要寫這句連結的用途`)
    if (hasText(link?.sentence) !== hasText(link?.anchor)) issues.push(`links[${index}] 連結句 sentence 與錨文字 anchor 要一起填`)
    else if (hasText(link?.sentence) && !link.sentence.includes(link.anchor)) issues.push(`links[${index}].anchor 必須在連結句裡`)
  }
  for (const page of pages) {
    if (page.pageType !== 'aspect-page') continue
    const entry = pages.find((candidate) => candidate.pageType === 'place-entry' && candidate.placeId === page.placeId)
    if (!entry) continue
    if (!hasLink(page.articleId, entry.articleId)) issues.push(`${page.articleId} 要連回地點主頁 ${entry.articleId}`)
    if (!hasLink(entry.articleId, page.articleId)) issues.push(`地點主頁 ${entry.articleId} 要連到 ${page.articleId}`)
  }

  // 寫作順序：涵蓋所有頁面；同地點的主頁排在該地點所有主題頁之後。
  const order = Array.isArray(outline?.writingOrder) ? outline.writingOrder : []
  const missing = pages.map((page) => page.articleId).filter((articleId) => !order.includes(articleId))
  if (missing.length > 0) issues.push(`writingOrder 缺少：${missing.join('、')}`)
  for (const page of pages.filter((candidate) => candidate.pageType === 'place-entry')) {
    const entryPosition = order.indexOf(page.articleId)
    const laterAspects = pages
      .filter((candidate) => candidate.pageType === 'aspect-page' && candidate.placeId === page.placeId)
      .filter((candidate) => order.indexOf(candidate.articleId) > entryPosition)
    if (laterAspects.length > 0) issues.push(`地點主頁 ${page.articleId} 要排在 ${laterAspects.map((candidate) => candidate.articleId).join('、')} 之後`)
  }
  return issues
}
