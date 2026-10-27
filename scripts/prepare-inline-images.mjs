// 下載並縮小已選定的文內照片，產生 webp 與雜湊紀錄，給 studio/scripts/publish-article-inline-images.mjs 上傳。
import {createHash} from 'node:crypto'
import {mkdir, readFile, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

import {selectedInlineSlots} from './inline-image-placement.mjs'

const argumentsList = process.argv.slice(2)
const packetArgument = argumentsList.find((argument) => !argument.startsWith('--'))
const downloadSource = argumentsList.includes('--download')

if (!packetArgument) {
  throw new Error('用法：node scripts/prepare-inline-images.mjs <文章封包資料夾> [--download]')
}

const projectRoot = path.resolve(import.meta.dirname, '..')
const packetDirectory = path.resolve(packetArgument)
const plan = JSON.parse(await readFile(path.join(packetDirectory, 'images', 'image-plan.json'), 'utf8'))
if (path.basename(packetDirectory) !== plan.articleId) {
  throw new Error('文章封包資料夾名稱與 image-plan.json 的 articleId 不一致')
}

const slots = selectedInlineSlots(plan)
if (slots.length === 0) throw new Error('圖片封包沒有標好位置（placement）的文內照片')

const temporaryDirectory = path.join(projectRoot, '.tmp', 'image-selection', plan.articleId, 'inline')
await mkdir(temporaryDirectory, {recursive: true})
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex')
const DOWNLOAD_TYPES = new Set(['commons-photo', 'stock-photo', 'official-material'])
const records = []

for (const {slot, candidate} of slots) {
  if (candidate.sourceType === 'ai-generated') throw new Error(`${slot.slotId} 是 AI 圖，要 Darren 親眼確認，這支程式不處理`)
  const preparation = slot.preparation
  const sourceFile = preparation.sourceFile
  if (typeof sourceFile !== 'string' || path.basename(sourceFile) !== sourceFile) {
    throw new Error(`${slot.slotId} 的 preparation.sourceFile 必須是單一檔名`)
  }
  const sourcePath = path.join(temporaryDirectory, `${slot.slotId}-${sourceFile}`)
  const outputPath = path.join(temporaryDirectory, `${slot.slotId}.webp`)

  if (downloadSource && DOWNLOAD_TYPES.has(candidate.sourceType)) {
    try {
      await stat(sourcePath)
      console.log(`保留既有原圖，不重複下載：${sourcePath}`)
    } catch {
      const url = preparation.sourceDownloadUrl
      if (typeof url !== 'string' || !url.startsWith('https://')) throw new Error(`${slot.slotId} 缺少 HTTPS sourceDownloadUrl`)
      // 維基共享資源會擋沒有 User-Agent 的請求。
      const response = await fetch(url, {headers: {'User-Agent': 'offpathnotes-image-prep/1.0 (https://offpathnotes.com/)'}})
      if (!response.ok) throw new Error(`${slot.slotId} 原圖下載失敗（HTTP ${response.status}）`)
      await writeFile(sourcePath, Buffer.from(await response.arrayBuffer()), {flag: 'wx'})
    }
  }

  const sourceBuffer = await readFile(sourcePath)
  const metadata = await sharp(sourceBuffer).metadata()
  const rotates = [5, 6, 7, 8].includes(metadata.orientation ?? 1)
  const sourceWidth = rotates ? metadata.height : metadata.width
  const sourceHeight = rotates ? metadata.width : metadata.height
  if (!sourceWidth || !sourceHeight) throw new Error(`${slot.slotId} 無法讀取原圖尺寸`)
  if (sourceWidth < slot.minimumWidth) {
    throw new Error(`${slot.slotId} 原圖寬度 ${sourceWidth}px，小於最低寬度 ${slot.minimumWidth}px`)
  }

  const output = preparation.output ?? {}
  if (output.format !== 'webp') throw new Error(`${slot.slotId} 的輸出格式必須是 webp`)
  // 只縮小、不裁切：文內照片要看到完整畫面，比例照原圖。
  const width = Math.min(output.maxWidth ?? 1600, sourceWidth)
  await sharp(sourceBuffer)
    .rotate()
    .resize({width, withoutEnlargement: true})
    .webp({quality: output.quality ?? 82, smartSubsample: true})
    .toFile(outputPath)

  const outputBuffer = await readFile(outputPath)
  const outputMetadata = await sharp(outputBuffer).metadata()
  records.push({
    slotId: slot.slotId,
    selectedCandidateId: candidate.candidateId,
    sourcePageUrl: candidate.sourcePageUrl ?? null,
    licenseUrl: candidate.licenseUrl ?? null,
    source: {file: path.basename(sourcePath), width: sourceWidth, height: sourceHeight, sha256: hash(sourceBuffer)},
    output: {
      file: path.basename(outputPath),
      width: outputMetadata.width,
      height: outputMetadata.height,
      format: outputMetadata.format,
      bytes: outputBuffer.byteLength,
      sha256: hash(outputBuffer),
    },
  })
}

const preparedAt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())
const record = {schemaVersion: 1, articleId: plan.articleId, preparedAt, images: records}
await writeFile(path.join(temporaryDirectory, 'prepared-inline.json'), `${JSON.stringify(record, null, 2)}\n`)
console.log(JSON.stringify({...record, outputDirectory: temporaryDirectory}, null, 2))
