#!/usr/bin/env node
/**
 * 檢查圖片驗收紀錄 image-review.json：圖片封包裡每一張選定的 AI 圖與自製示意圖都要被看過，
 * 示意圖的事實要在 fact-check.json 裡已查證。
 * 用法：node validate-image-review.mjs <文章資料夾>
 */
import {existsSync, readFileSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

/** 試點期間每張 AI 圖都要 Darren 親眼確認。試點結束後由 Darren 決定是否改成 false。 */
export const AI_HUMAN_CONFIRMATION_REQUIRED = true

export const REQUIRED_CHECKS = {
  ai: ['noFakeText', 'japanFactsCorrect', 'matchesArticle', 'notMistakableForRealPlace', 'noLikenessOrBrand', 'disclosureVisible', 'allowedNeed'],
  diagram: ['matchesDataFile', 'factsVerified', 'scaleNotePresent', 'readableOnPhone'],
}

export function collectGeneratedSelections(plan) {
  const selected = plan?.selectedCandidateIds ?? {}
  const results = []
  for (const slot of plan?.slots ?? []) {
    const candidate = (slot.candidates ?? []).find((item) => item.candidateId === selected[slot.slotId])
    if (candidate?.sourceType === 'ai-generated') results.push({slot, candidate, kind: 'ai'})
    if (candidate?.sourceType === 'diagram') results.push({slot, candidate, kind: 'diagram'})
  }
  return results
}

export function validateImageReview({plan, review, factCheck, diagramData = {}}) {
  const errors = []
  const generated = collectGeneratedSelections(plan)
  if (generated.length === 0) return errors
  if (!review) return ['圖片封包有 AI 圖或自製示意圖，但缺少 image-review.json']
  if (review.schemaVersion !== 1) errors.push('schemaVersion 必須是 1')
  if (typeof review.reviewer !== 'string' || !review.reviewer.trim()) errors.push('reviewer 不得為空')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt ?? '')) errors.push('reviewedAt 必須是 YYYY-MM-DD')

  const verifiedClaims = new Set(
    (factCheck?.claims ?? []).filter((claim) => claim.verdict === 'verified').map((claim) => claim.claimId),
  )
  for (const {slot, candidate, kind} of generated) {
    const label = `${slot.slotId}/${candidate.candidateId}`
    const item = (review.items ?? []).find((entry) => entry.candidateId === candidate.candidateId)
    if (!item) {
      errors.push(`${label} 沒有圖片驗收紀錄`)
      continue
    }
    if (item.kind !== kind) errors.push(`${label}.kind 應為 ${kind}`)
    const failedChecks = REQUIRED_CHECKS[kind].filter((field) => item.checks?.[field] !== true)
    if (item.verdict !== 'pass') errors.push(`${label} 圖片驗收未通過`)
    else if (failedChecks.length > 0) errors.push(`${label} 標為 pass，但這些檢查不是 true：${failedChecks.join('、')}`)
    if (kind === 'ai' && AI_HUMAN_CONFIRMATION_REQUIRED && !/^\d{4}-\d{2}-\d{2}$/.test(item.darrenConfirmedAt ?? '')) {
      errors.push(`${label} 是 AI 圖，試點期間需要 Darren 確認日期 darrenConfirmedAt`)
    }
    if (kind === 'diagram') {
      const data = diagramData[candidate.dataFile]
      const factIds = [...(data?.nodes ?? []), ...(data?.edges ?? [])].map((entry) => entry.factId)
      if (!data) errors.push(`${label} 找不到資料檔 ${candidate.dataFile}`)
      const unverified = factIds.filter((id) => !verifiedClaims.has(id))
      if (unverified.length > 0) {
        errors.push(`${label} 的示意圖用到未在 fact-check.json 查證的事實：${unverified.join('、')}`)
      }
    }
  }
  return errors
}

function readJson(filePath) {
  return existsSync(filePath) ? JSON.parse(readFileSync(filePath, 'utf8')) : null
}

function runCli() {
  const input = process.argv[2]
  if (!input) {
    console.error('用法：node validate-image-review.mjs <文章資料夾>')
    process.exit(2)
  }
  const directory = path.resolve(input)
  const plan = readJson(path.join(directory, 'images', 'image-plan.json'))
  if (!plan) {
    console.error('找不到 images/image-plan.json')
    process.exit(2)
  }
  const diagramData = {}
  for (const {candidate} of collectGeneratedSelections(plan)) {
    if (candidate.dataFile) diagramData[candidate.dataFile] = readJson(path.join(directory, candidate.dataFile))
  }
  const errors = validateImageReview({
    plan,
    review: readJson(path.join(directory, 'images', 'image-review.json')),
    factCheck: readJson(path.join(directory, 'fact-check.json')),
    diagramData,
  })
  if (errors.length > 0) {
    console.error(`圖片驗收未通過（${errors.length} 項）：`)
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  console.log('圖片驗收通過。')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli()
