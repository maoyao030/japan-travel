/**
 * 文字修訂的安全檢查：修改前後的 draft-tagged.md 只能改字，不能改事實。
 * 檢查事實編號的順序、數字的順序、段落與表格的結構都一樣，修改後的 reader-preview.md 要通過 check-voice.mjs --final。
 *
 * 用法：node scripts/check-text-revision.mjs <修改前 draft-tagged.md> <文章封包資料夾>
 */
import {readFileSync} from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'

import {checkVoice} from '../.agents/skills/japan-travel-answer-first/scripts/check-voice.mjs'
import {parseMarkdownBody} from './markdown-to-portable-text.mjs'

const FACT_TAG = /\[(?:[a-z-]+:)?[FR]\d+(?:\s*,\s*(?:[a-z-]+:)?[FR]\d+)*\]/g
// 只比正文；資料來源一節不改
const bodyPart = (markdown) => markdown.replace(/\r\n/g, '\n').split(/\n## 資料來源\s*\n/)[0]
const sourcesPart = (markdown) => markdown.replace(/\r\n/g, '\n').split(/\n## 資料來源\s*\n/)[1] ?? ''
// 數字：網址拿掉，全形數字照算
const numbers = (markdown) =>
  (bodyPart(markdown).replace(FACT_TAG, '').replace(/https?:\/\/\S+/g, '').match(/\d+(?:[.,:]\d+)*/g) || []).join(' ')
const structure = (markdown) =>
  parseMarkdownBody(bodyPart(markdown).replace(FACT_TAG, ''))
    .blocks.map((block) => (block._type === 'contentTable' ? `table${block.columns.length}x${block.rows.length}` : `${block.style ?? block._type}${block.listItem ? `-${block.listItem}` : ''}`))
    .join(' ')

export function checkTextRevision(beforeTagged, afterTagged, afterPreview) {
  const issues = []
  const tagsBefore = (bodyPart(beforeTagged).match(FACT_TAG) || []).join(' ')
  const tagsAfter = (bodyPart(afterTagged).match(FACT_TAG) || []).join(' ')
  if (tagsBefore !== tagsAfter) issues.push('事實編號的順序或數量變了')
  if (numbers(beforeTagged) !== numbers(afterTagged)) {
    const a = numbers(beforeTagged).split(' ')
    const b = numbers(afterTagged).split(' ')
    const at = a.findIndex((value, index) => value !== b[index])
    issues.push(`數字變了（第 ${at + 1} 個：${a[at]} → ${b[at]}）`)
  }
  if (structure(beforeTagged) !== structure(afterTagged)) issues.push('段落、標題、條列或表格的結構變了')
  if (sourcesPart(beforeTagged).trim() !== sourcesPart(afterTagged).trim()) issues.push('資料來源一節不要改')
  if ((beforeTagged.match(/^# .+$/m) || [])[0] !== (afterTagged.match(/^# .+$/m) || [])[0]) issues.push('H1 不要改')
  const voice = checkVoice(afterPreview, {final: true})
  issues.push(...voice.issues.map((issue) => `check-voice：${issue}`))
  return {issues, warnings: voice.warnings}
}

const isCli = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
if (isCli) {
  const [beforeFile, packetDir] = process.argv.slice(2)
  if (!beforeFile || !packetDir) {
    console.error('用法：node scripts/check-text-revision.mjs <修改前 draft-tagged.md> <文章封包資料夾>')
    process.exit(2)
  }
  const {issues, warnings} = checkTextRevision(
    readFileSync(beforeFile, 'utf8'),
    readFileSync(path.join(packetDir, 'draft-tagged.md'), 'utf8'),
    readFileSync(path.join(packetDir, 'reader-preview.md'), 'utf8'),
  )
  console.log(issues.length ? `未通過：${packetDir}` : `通過：${packetDir}`)
  for (const issue of issues) console.log(`  - ${issue}`)
  for (const warning of warnings) console.log(`  提醒：${warning}`)
  if (issues.length) process.exitCode = 1
}
