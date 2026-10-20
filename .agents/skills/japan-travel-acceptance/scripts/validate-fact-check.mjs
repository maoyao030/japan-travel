#!/usr/bin/env node
/**
 * 檢查事實查核紀錄 fact-check.json 是否完整，並確認它對應目前的 reader-preview.md。
 * 只檢查紀錄格式與一致性，不能代替查核者實際打開來源。
 *
 * 用法：node validate-fact-check.mjs <文章資料夾>
 */
import {createHash} from 'node:crypto'
import {existsSync, readFileSync} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

export const VERDICTS = ['verified', 'incorrect', 'unsupported', 'outdated', 'unreachable', 'not-stated']
const BLOCKING = new Set(['incorrect', 'unsupported', 'outdated', 'unreachable'])

/** 部分官方網站（例如宗谷巴士）只有 http 能連，來源網址接受 http 與 https。 */
function isHttpsUrl(value) {
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateFactCheck(record, articleSha256) {
  const errors = []
  if (record?.schemaVersion !== 1) errors.push('schemaVersion 必須是 1')
  if (!hasText(record?.articleId)) errors.push('articleId 不得為空')
  if (!hasText(record?.checker)) errors.push('checker 不得為空，需記錄查核者身分')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record?.checkedAt ?? '')) errors.push('checkedAt 必須是 YYYY-MM-DD')
  if (articleSha256 && record?.articleSha256 !== articleSha256) {
    errors.push('articleSha256 和目前的 reader-preview.md 不一致，查核紀錄不是這一版文章')
  }

  const claims = Array.isArray(record?.claims) ? record.claims : null
  if (!claims || claims.length === 0) {
    errors.push('claims 至少要有一筆事實')
    return {errors, blocking: []}
  }

  const ids = new Set()
  const counts = Object.fromEntries(VERDICTS.map((verdict) => [verdict, 0]))
  const blocking = []
  for (const [index, claim] of claims.entries()) {
    const label = `claims[${index}]`
    if (!hasText(claim?.claimId)) errors.push(`${label}.claimId 不得為空`)
    else if (ids.has(claim.claimId)) errors.push(`${label}.claimId 重複：${claim.claimId}`)
    ids.add(claim?.claimId)
    if (!hasText(claim?.articleExcerpt)) errors.push(`${label}.articleExcerpt 必須引用正文原句`)
    if (!VERDICTS.includes(claim?.verdict)) {
      errors.push(`${label}.verdict 必須是 ${VERDICTS.join('、')}`)
      continue
    }
    counts[claim.verdict] += 1
    if (!isHttpsUrl(claim?.sourceUrl)) errors.push(`${label}.sourceUrl 必須是 HTTPS 網址`)
    if (claim.verdict === 'verified') {
      if (!hasText(claim?.sourceQuote)) errors.push(`${label} 標為 verified 但沒有日文原文摘錄 sourceQuote`)
      if (!hasText(claim?.sourceTitle)) errors.push(`${label}.sourceTitle 不得為空`)
    }
    if (claim.verdict === 'not-stated' && !hasText(claim?.notes)) {
      errors.push(`${label} 標為 not-stated 但 notes 沒寫查過哪些頁面`)
    }
    if (BLOCKING.has(claim.verdict)) blocking.push(`${claim.claimId}：${claim.verdict}`)
  }

  for (const verdict of VERDICTS) {
    if (record?.summary?.[verdict] !== counts[verdict]) {
      errors.push(`summary.${verdict} 應為 ${counts[verdict]}`)
    }
  }
  return {errors, blocking}
}

function runCli() {
  const input = process.argv[2]
  if (!input) {
    console.error('用法：node validate-fact-check.mjs <文章資料夾>')
    process.exit(2)
  }
  const directory = path.resolve(input)
  const recordPath = path.join(directory, 'fact-check.json')
  const articlePath = path.join(directory, 'reader-preview.md')
  if (!existsSync(recordPath) || !existsSync(articlePath)) {
    console.error('文章資料夾缺少 fact-check.json 或 reader-preview.md')
    process.exit(2)
  }
  // 換行先統一成 LF 再算：Windows 存成 CRLF、Git 存成 LF，雲端檢出時位元組不同，雜湊才對得上
  const articleSha256 = createHash('sha256').update(readFileSync(articlePath, 'utf8').replace(/\r\n/g, '\n')).digest('hex')
  let record
  try {
    record = JSON.parse(readFileSync(recordPath, 'utf8'))
  } catch (error) {
    console.error(`fact-check.json 無法解析：${error.message}`)
    process.exit(2)
  }
  const {errors, blocking} = validateFactCheck(record, articleSha256)
  if (errors.length > 0) {
    console.error(`事實查核紀錄不完整（${errors.length} 項）：`)
    for (const error of errors) console.error(`- ${error}`)
    process.exit(1)
  }
  if (blocking.length > 0) {
    console.log(`事實查核紀錄完整，但有 ${blocking.length} 項未通過，事實與條件應判為 reject 或 not_checked：`)
    for (const item of blocking) console.log(`- ${item}`)
    process.exit(3)
  }
  console.log(`事實查核紀錄完整，${record.claims.length} 項事實均已查證。`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runCli()
