import {createHash} from 'node:crypto'
import {mkdir, readFile, stat, writeFile} from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'

const argumentsList = process.argv.slice(2)
const packetArgument = argumentsList.find((argument) => !argument.startsWith('--'))
const downloadSource = argumentsList.includes('--download')

if (!packetArgument) {
  throw new Error('用法：node scripts/prepare-selected-cover.mjs <文章封包資料夾> [--download]')
}

const projectRoot = path.resolve(import.meta.dirname, '..')
const packetDirectory = path.resolve(packetArgument)
const planPath = path.join(packetDirectory, 'images', 'image-plan.json')
const plan = JSON.parse(await readFile(planPath, 'utf8'))

if (plan.status !== 'selected') throw new Error('圖片封包尚未選定封面')
if (path.basename(packetDirectory) !== plan.articleId) {
  throw new Error('文章封包資料夾名稱與 image-plan.json 的 articleId 不一致')
}

const coverSlot = plan.slots?.find((slot) => slot.slotId === 'cover' && slot.kind === 'cover')
const selectedCandidateId = plan.selectedCandidateIds?.cover
const candidate = coverSlot?.candidates?.find((item) => item.candidateId === selectedCandidateId)
const preparation = coverSlot?.preparation

if (!coverSlot || !candidate || !preparation) {
  throw new Error('圖片封包缺少已選定封面或 preparation 設定')
}
if (candidate.sourceType !== 'stock-photo' && candidate.sourceType !== 'ai-generated') {
  throw new Error('封面來源類型無法處理')
}

const sourceFile = preparation.sourceFile
if (typeof sourceFile !== 'string' || path.basename(sourceFile) !== sourceFile) {
  throw new Error('preparation.sourceFile 必須是單一檔名')
}

const temporaryDirectory = path.join(projectRoot, '.tmp', 'image-selection', plan.articleId)
const sourcePath = path.join(temporaryDirectory, sourceFile)
const outputPath = path.join(temporaryDirectory, 'cover.webp')
const recordPath = path.join(temporaryDirectory, 'prepared-cover.json')
await mkdir(temporaryDirectory, {recursive: true})

if (downloadSource) {
  try {
    await stat(sourcePath)
    console.log(`保留既有原圖，不重複下載：${sourcePath}`)
  } catch {
    const sourceDownloadUrl = preparation.sourceDownloadUrl
    if (typeof sourceDownloadUrl !== 'string' || !sourceDownloadUrl.startsWith('https://')) {
      throw new Error('圖片封包缺少 HTTPS sourceDownloadUrl')
    }
    const response = await fetch(sourceDownloadUrl)
    if (!response.ok) throw new Error(`原圖下載失敗（HTTP ${response.status}）`)
    await writeFile(sourcePath, Buffer.from(await response.arrayBuffer()), {
      flag: 'wx',
    })
  }
}

const sourceBuffer = await readFile(sourcePath)
const metadata = await sharp(sourceBuffer).metadata()
const rotatesDimensions = [5, 6, 7, 8].includes(metadata.orientation ?? 1)
const sourceWidth = rotatesDimensions ? metadata.height : metadata.width
const sourceHeight = rotatesDimensions ? metadata.width : metadata.height

if (!sourceWidth || !sourceHeight) throw new Error('無法讀取原圖尺寸')
if (sourceWidth < coverSlot.minimumWidth) {
  throw new Error(`原圖寬度 ${sourceWidth}px，小於封面最低寬度 ${coverSlot.minimumWidth}px`)
}

const output = preparation.output
if (output?.format !== 'webp') throw new Error('目前封面輸出格式必須是 webp')

const targetRatio = output.width / output.height
let cropWidth = sourceWidth
let cropHeight = Math.round(cropWidth / targetRatio)
if (cropHeight > sourceHeight) {
  cropHeight = sourceHeight
  cropWidth = Math.round(cropHeight * targetRatio)
}

const focalX = preparation.focalPoint.x * sourceWidth
const focalY = preparation.focalPoint.y * sourceHeight
const left = Math.max(0, Math.min(sourceWidth - cropWidth, Math.round(focalX - cropWidth / 2)))
const top = Math.max(0, Math.min(sourceHeight - cropHeight, Math.round(focalY - cropHeight / 2)))

await sharp(sourceBuffer)
  .rotate()
  .extract({left, top, width: cropWidth, height: cropHeight})
  .resize(output.width, output.height)
  .webp({quality: output.quality, smartSubsample: true})
  .toFile(outputPath)

const outputBuffer = await readFile(outputPath)
const outputMetadata = await sharp(outputBuffer).metadata()
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex')
const preparedAt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

const record = {
  schemaVersion: 1,
  articleId: plan.articleId,
  selectedCandidateId,
  sourcePageUrl: candidate.sourcePageUrl ?? null,
  licenseUrl: candidate.licenseUrl ?? null,
  licenseCheckedAt: candidate.licenseCheckedAt ?? null,
  preparedAt,
  source: {
    file: sourceFile,
    width: sourceWidth,
    height: sourceHeight,
    sha256: hash(sourceBuffer),
  },
  crop: {left, top, width: cropWidth, height: cropHeight},
  output: {
    file: path.basename(outputPath),
    width: outputMetadata.width,
    height: outputMetadata.height,
    format: outputMetadata.format,
    bytes: outputBuffer.byteLength,
    sha256: hash(outputBuffer),
  },
}

await writeFile(recordPath, `${JSON.stringify(record, null, 2)}\n`)
console.log(JSON.stringify({...record, outputPath}, null, 2))
