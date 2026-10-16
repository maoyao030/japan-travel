#!/usr/bin/env node
/**
 * 檢查日本旅遊站文章的圖片封包 image-plan.json。
 * 用法：node validate-image-packet.mjs <文章資料夾或 image-plan.json>
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

const POLICY = 'real-photo-first-ai-if-none'
const AUTO_SELECTION_MODE = 'criteria-based-auto-selection'
const OUTCOMES = new Set(['not-run', 'qualified-photo-found', 'no-qualified-photo'])
const STATUSES = new Set(['planning', 'selected', 'blocked'])
const ARTICLE_SOURCES = new Set(['sanity-published', 'approved-reader-preview', 'provisional-draft'])
const REAL_TYPES = new Set(['commons-photo', 'stock-photo', 'official-material', 'own-photo'])
const LICENSE_FRESH_DAYS = 30

const STOCK_PROVIDERS = {
  Unsplash: {
    hostnames: ['unsplash.com', 'www.unsplash.com'],
    licenseName: 'Unsplash License',
    licenseUrl: 'https://unsplash.com/license',
    sourcePath: /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?photos\//i,
  },
  Pexels: {
    hostnames: ['pexels.com', 'www.pexels.com'],
    licenseName: 'Pexels License',
    licenseUrl: 'https://www.pexels.com/license/',
    sourcePath: /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?photo\//i,
  },
  Pixabay: {
    hostnames: ['pixabay.com', 'www.pixabay.com'],
    licenseName: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    sourcePath: /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?photos\//i,
  },
}

export const COMMONS_LICENSES = new Set([
  'CC0',
  'Public domain',
  ...['2.0', '2.5', '3.0', '4.0'].flatMap((version) => [`CC BY ${version}`, `CC BY-SA ${version}`]),
])
const ATTRIBUTION_REQUIRED = /^CC BY/
const REAL_CHECKS = ['fullImageInspected', 'officialSourcePage', 'licenseVerified', 'notAiGenerated', 'noWatermark']
const AI_CHECKS = ['fullImageInspected', 'noWatermark', 'aiDisclosureReady', 'technicalClaimsAvoided']
const AI_FORBIDDEN = [
  'sourcePageUrl',
  'creatorName',
  'licenseName',
  'licenseUrl',
  'licenseCheckedAt',
  'termsUrl',
  'photographer',
]

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function taipeiToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function validatePlan(plan, {today = taipeiToday()} = {}) {
  const errors = []
  const fail = (location, message) => errors.push(`${location}: ${message}`)

  const requireString = (object, field, location) => {
    if (typeof object?.[field] !== 'string' || object[field].trim() === '') {
      fail(`${location}.${field}`, '必須是非空白字串')
      return ''
    }
    return object[field].trim()
  }
  const parseDate = (value, location) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      fail(location, '日期必須使用 YYYY-MM-DD')
      return null
    }
    const date = new Date(`${value}T00:00:00Z`)
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      fail(location, '不是有效日期')
      return null
    }
    return date
  }
  const ageInDays = (date) =>
    Math.floor((new Date(`${today}T00:00:00Z`).getTime() - date.getTime()) / 86400000)
  const requireFreshDate = (value, location) => {
    const date = parseDate(value, location)
    if (!date) return
    const age = ageInDays(date)
    if (age < 0) fail(location, '不能是未來日期')
    if (age > LICENSE_FRESH_DAYS) fail(location, `查核已超過 ${LICENSE_FRESH_DAYS} 天，請重新確認`)
  }
  const parseUrl = (value, location) => {
    try {
      const url = new URL(value)
      if (url.protocol !== 'https:') throw new Error('not https')
      return url
    } catch {
      fail(location, '必須是有效的 HTTPS 網址')
      return null
    }
  }
  const requireChecks = (candidate, location, fields) => {
    for (const field of fields) {
      if (candidate?.checks?.[field] !== true) fail(`${location}.checks.${field}`, '必須為 true')
    }
  }
  const rejectRestrictiveLicense = (name, location) => {
    if (/\bNC\b|NonCommercial|非商業/i.test(name)) fail(location, '非商業授權不能用在本站')
    if (/\bND\b|NoDerivatives|禁止改作/i.test(name)) fail(location, '禁止改作的授權不能用，封面需要裁切')
  }

  const validateRealCommon = (candidate, location, slot) => {
    if (candidate.assetType !== 'photo') fail(`${location}.assetType`, '實拍必須是 photo')
    if (!['exact', 'contextual'].includes(candidate.matchType)) {
      fail(`${location}.matchType`, '實拍必須是 exact 或 contextual')
    }
    if (slot.kind === 'inline' && candidate.matchType !== 'exact') {
      fail(`${location}.matchType`, '文內圖只能使用 exact')
    }
    if (candidate.matchType === 'contextual') requireString(candidate, 'matchLimits', location)
    if (candidate.sourceType !== 'own-photo') requireChecks(candidate, location, REAL_CHECKS)
    else requireChecks(candidate, location, ['fullImageInspected', 'notAiGenerated'])
  }

  const validateCandidate = (candidate, location, slot) => {
    if (!isObject(candidate)) {
      fail(location, '候選必須是物件')
      return null
    }
    const candidateId = requireString(candidate, 'candidateId', location)
    for (const field of ['width', 'height']) {
      if (!Number.isInteger(candidate[field]) || candidate[field] <= 0) {
        fail(`${location}.${field}`, '必須是正整數')
      }
    }
    if (Number.isInteger(candidate.width) && candidate.width < slot.minimumWidth) {
      fail(`${location}.width`, `小於此位置最低寬度 ${slot.minimumWidth}px`)
    }
    requireString(candidate, 'whyItFits', location)
    requireString(candidate, 'altDraft', location)
    const credit = requireString(candidate, 'creditDraft', location)
    if (candidate.commercialReview?.risk !== 'low') {
      fail(`${location}.commercialReview.risk`, '必須是 low，否則請剔除')
    }

    switch (candidate.sourceType) {
      case 'commons-photo': {
        if (candidate.provider !== 'Wikimedia Commons') fail(`${location}.provider`, '必須是 Wikimedia Commons')
        const url = parseUrl(candidate.sourcePageUrl, `${location}.sourcePageUrl`)
        if (url && (url.hostname !== 'commons.wikimedia.org' || !/^\/wiki\/File:/.test(decodeURI(url.pathname)))) {
          fail(`${location}.sourcePageUrl`, '必須是 commons.wikimedia.org/wiki/File: 單張檔案頁')
        }
        const license = requireString(candidate, 'licenseName', location)
        rejectRestrictiveLicense(license, `${location}.licenseName`)
        if (license && !COMMONS_LICENSES.has(license)) {
          fail(`${location}.licenseName`, `只接受 ${[...COMMONS_LICENSES].join('、')}`)
        }
        parseUrl(candidate.licenseUrl, `${location}.licenseUrl`)
        requireFreshDate(candidate.licenseCheckedAt, `${location}.licenseCheckedAt`)
        const creator = requireString(candidate, 'creatorName', location)
        if (ATTRIBUTION_REQUIRED.test(license) && credit && (!credit.includes(license) || (creator && !credit.includes(creator)))) {
          fail(`${location}.creditDraft`, 'CC BY 與 CC BY-SA 的署名必須包含作者與授權名稱')
        }
        validateRealCommon(candidate, location, slot)
        break
      }
      case 'stock-photo': {
        const provider = STOCK_PROVIDERS[candidate.provider]
        if (!provider) fail(`${location}.provider`, '免費圖庫只接受 Unsplash、Pexels 或 Pixabay')
        const url = parseUrl(candidate.sourcePageUrl, `${location}.sourcePageUrl`)
        if (url && provider && (!provider.hostnames.includes(url.hostname) || !provider.sourcePath.test(url.pathname))) {
          fail(`${location}.sourcePageUrl`, '必須是該圖庫官方網域的單張照片頁')
        }
        requireString(candidate, 'creatorName', location)
        if (provider && candidate.licenseName !== provider.licenseName) {
          fail(`${location}.licenseName`, `必須是 ${provider.licenseName}`)
        }
        if (provider && String(candidate.licenseUrl ?? '').replace(/\/$/, '') !== provider.licenseUrl.replace(/\/$/, '')) {
          fail(`${location}.licenseUrl`, '必須是該圖庫的官方授權頁')
        }
        requireFreshDate(candidate.licenseCheckedAt, `${location}.licenseCheckedAt`)
        validateRealCommon(candidate, location, slot)
        break
      }
      case 'official-material': {
        requireString(candidate, 'provider', location)
        parseUrl(candidate.sourcePageUrl, `${location}.sourcePageUrl`)
        parseUrl(candidate.termsUrl, `${location}.termsUrl`)
        requireFreshDate(candidate.termsCheckedAt, `${location}.termsCheckedAt`)
        if (candidate.commercialUseAllowed !== true) {
          fail(`${location}.commercialUseAllowed`, '利用規約必須明確允許商業網站使用')
        }
        if (candidate.modificationAllowed !== true) {
          fail(`${location}.modificationAllowed`, '利用規約必須允許裁切')
        }
        requireString(candidate, 'creditRequirement', location)
        if (typeof candidate.applicationRequired !== 'boolean') {
          fail(`${location}.applicationRequired`, '必須寫明是否需要事前申請')
        } else if (candidate.applicationRequired) {
          parseDate(candidate.applicationApprovedAt, `${location}.applicationApprovedAt`)
        }
        validateRealCommon(candidate, location, slot)
        break
      }
      case 'own-photo': {
        requireString(candidate, 'photographer', location)
        requireString(candidate, 'takenAt', location)
        validateRealCommon(candidate, location, slot)
        break
      }
      case 'ai-generated': {
        if (candidate.provider !== 'OpenAI ImageGen') fail(`${location}.provider`, 'AI 備援只接受 OpenAI ImageGen')
        if (candidate.assetType !== 'generated-image') fail(`${location}.assetType`, '必須是 generated-image')
        if (candidate.matchType !== 'illustrative') fail(`${location}.matchType`, 'AI 圖必須是 illustrative')
        parseDate(candidate.generatedAt, `${location}.generatedAt`)
        for (const field of ['promptSummary', 'matchLimits', 'factualLimits']) requireString(candidate, field, location)
        for (const field of ['captionDraft', 'disclosureDraft', 'creditDraft']) {
          const value = requireString(candidate, field, location)
          if (value && !/AI/i.test(value)) fail(`${location}.${field}`, '必須明確包含 AI 標示')
        }
        for (const field of AI_FORBIDDEN) {
          if (Object.hasOwn(candidate, field)) fail(`${location}.${field}`, 'AI 圖不得填寫來源或授權欄位')
        }
        requireChecks(candidate, location, AI_CHECKS)
        break
      }
      default:
        fail(`${location}.sourceType`, `必須是 ${[...REAL_TYPES, 'ai-generated'].join('、')}`)
    }
    return candidateId
  }

  if (!isObject(plan)) {
    fail('root', '必須是 JSON 物件')
    return errors
  }
  if (plan.schemaVersion !== 1) fail('schemaVersion', '目前只接受 1')
  requireString(plan, 'articleId', 'root')
  requireString(plan, 'articleTitle', 'root')
  const targetUrl = requireString(plan, 'targetUrl', 'root')
  const segments = targetUrl.split('/').filter(Boolean)
  if (!targetUrl.startsWith('/') || !targetUrl.endsWith('/') || segments.length < 2 || segments.length > 3) {
    fail('root.targetUrl', '必須是兩層或三層的正式網址')
  }
  if (!ARTICLE_SOURCES.has(plan.articleSource)) fail('articleSource', '值不在允許清單')
  parseDate(plan.articleSourceCheckedAt, 'articleSourceCheckedAt')
  if (!STATUSES.has(plan.status)) fail('status', '必須是 planning、selected 或 blocked')
  if (plan.status === 'blocked') requireString(plan, 'blockedReason', 'root')
  if (plan.selectionMode !== AUTO_SELECTION_MODE) fail('selectionMode', `必須是 ${AUTO_SELECTION_MODE}`)
  const selected = isObject(plan.selectedCandidateIds) ? plan.selectedCandidateIds : {}

  if (!Array.isArray(plan.slots) || plan.slots.length === 0) {
    fail('slots', '至少需要一個圖片位置')
    return errors
  }
  const slotIds = new Set()
  const sourceUrls = new Set()
  for (const [slotIndex, slot] of plan.slots.entries()) {
    const location = `slots[${slotIndex}]`
    const slotId = requireString(slot, 'slotId', location)
    if (slotIds.has(slotId)) fail(`${location}.slotId`, '不能重複')
    slotIds.add(slotId)
    if (!['cover', 'inline'].includes(slot?.kind)) fail(`${location}.kind`, '必須是 cover 或 inline')
    requireString(slot, 'purpose', location)
    for (const field of ['mustShow', 'mustNotShow']) {
      if (!Array.isArray(slot?.[field]) || slot[field].length === 0) fail(`${location}.${field}`, '至少一項')
    }
    if (!Number.isInteger(slot?.minimumWidth) || slot.minimumWidth <= 0) fail(`${location}.minimumWidth`, '必須是正整數')
    if (plan.status === 'selected') requireString(slot, 'selectionNotes', location)

    const sourcing = slot?.sourcing
    if (sourcing?.policy !== POLICY) fail(`${location}.sourcing.policy`, `必須是 ${POLICY}`)
    const outcome = sourcing?.photoSearchOutcome
    if (!OUTCOMES.has(outcome)) fail(`${location}.sourcing.photoSearchOutcome`, `必須是 ${[...OUTCOMES].join('、')}`)
    requireString(sourcing, 'photoSearchNotes', `${location}.sourcing`)
    if (outcome && outcome !== 'not-run') parseDate(sourcing.photoSearchCheckedAt, `${location}.sourcing.photoSearchCheckedAt`)

    const candidates = Array.isArray(slot?.candidates) ? slot.candidates : []
    if (!Array.isArray(slot?.candidates)) fail(`${location}.candidates`, '必須是陣列')
    if (candidates.length === 0 && plan.status === 'selected') fail(`${location}.candidates`, '至少需要一張候選')
    const candidateIds = new Set()
    for (const [index, candidate] of candidates.entries()) {
      const candidateLocation = `${location}.candidates[${index}]`
      const id = validateCandidate(candidate, candidateLocation, slot)
      if (id) {
        if (candidateIds.has(id)) fail(`${candidateLocation}.candidateId`, '同一位置不能重複')
        candidateIds.add(id)
      }
      if (typeof candidate?.sourcePageUrl === 'string') {
        if (sourceUrls.has(candidate.sourcePageUrl)) fail(`${candidateLocation}.sourcePageUrl`, '同一封包不能重複使用')
        sourceUrls.add(candidate.sourcePageUrl)
      }
    }

    const hasReal = candidates.some((candidate) => REAL_TYPES.has(candidate?.sourceType))
    const hasAi = candidates.some((candidate) => candidate?.sourceType === 'ai-generated')
    if (hasReal && hasAi) fail(`${location}.candidates`, '同一位置不能混放實拍與 AI 圖')
    if (outcome === 'not-run' && candidates.length > 0) fail(`${location}.candidates`, '搜尋尚未完成前不能建立候選')
    if (outcome === 'qualified-photo-found' && !hasReal) fail(`${location}.candidates`, '已找到合格實拍時必須保留實拍候選')
    if (hasAi && outcome !== 'no-qualified-photo') {
      fail(`${location}.candidates`, '必須先完成實拍搜尋並記錄 no-qualified-photo，才可使用 AI')
    }
    if (outcome === 'no-qualified-photo' && hasReal) fail(`${location}.candidates`, 'no-qualified-photo 不能保留實拍候選')

    if (plan.status === 'selected') {
      const selectedId = selected[slotId]
      const selectedCandidate = candidates.find((candidate) => candidate?.candidateId === selectedId)
      if (!selectedCandidate) {
        fail(`selectedCandidateIds.${slotId}`, '必須指向此位置的現有候選')
      } else {
        const hasExact = candidates.some((candidate) => REAL_TYPES.has(candidate?.sourceType) && candidate.matchType === 'exact')
        if (hasExact && selectedCandidate.matchType === 'contextual') {
          fail(`selectedCandidateIds.${slotId}`, '同一位置已有 exact 實拍，不能改選 contextual')
        }
        if (slot.kind === 'cover') {
          const preparation = slot.preparation
          if (!isObject(preparation)) fail(`${location}.preparation`, '已選定的封面必須提供裁切設定')
          else {
            requireString(preparation, 'sourceFile', `${location}.preparation`)
            const needsDownload = ['commons-photo', 'stock-photo', 'official-material'].includes(selectedCandidate.sourceType)
            if (needsDownload) parseUrl(preparation.sourceDownloadUrl, `${location}.preparation.sourceDownloadUrl`)
            else if (preparation.sourceDownloadUrl != null) {
              fail(`${location}.preparation.sourceDownloadUrl`, '自己拍的照片與 AI 圖使用本機原檔，不填下載網址')
            }
            if (preparation.output?.format !== 'webp') fail(`${location}.preparation.output.format`, '必須是 webp')
          }
        }
      }
    }
  }
  if (plan.status === 'selected') parseDate(plan.selectedAt, 'selectedAt')
  return errors
}

function runCli() {
  const input = process.argv[2]
  if (!input) {
    console.error('用法：node validate-image-packet.mjs <文章資料夾或 image-plan.json>')
    process.exit(2)
  }
  const resolved = path.resolve(input)
  const planPath = resolved.endsWith('.json') ? resolved : path.join(resolved, 'images', 'image-plan.json')
  if (!fs.existsSync(planPath)) {
    console.error(`找不到圖片封包：${planPath}`)
    process.exit(2)
  }
  let plan
  try {
    plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
  } catch (error) {
    console.error(`無法讀取 JSON：${error.message}`)
    process.exit(2)
  }
  const errors = validatePlan(plan)
  if (errors.length > 0) {
    console.error(`圖片封包驗證失敗（${errors.length} 項）：`)
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log(`圖片封包驗證通過：${planPath}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli()
