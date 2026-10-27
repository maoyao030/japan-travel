// 把 scripts/prepare-inline-images.mjs 準備好的文內照片上傳到 Sanity，插進已發布文章正文的指定位置。
// 預設只預覽；--apply 才上傳；--remove 把這份圖片封包插過的照片拿掉（復原用）。
import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {
  findInsertionKey,
  inlineImageFields,
  selectedInlineSlots,
} from '../../scripts/inline-image-placement.mjs'

const argumentsList = process.argv.slice(2)
const applyChanges = argumentsList.includes('--apply')
const removeImages = argumentsList.includes('--remove')
const packetArgument = argumentsList.find((argument) => !argument.startsWith('--'))

if (!packetArgument) {
  throw new Error(
    '用法：sanity exec scripts/publish-article-inline-images.mjs --with-user-token -- <文章封包資料夾> [--apply | --remove --apply]',
  )
}

const projectRoot = path.resolve(import.meta.dirname, '../..')
const packetDirectory = path.resolve(packetArgument)
const plan = JSON.parse(await readFile(path.join(packetDirectory, 'images', 'image-plan.json'), 'utf8'))
if (path.basename(packetDirectory) !== plan.articleId) {
  throw new Error('文章封包資料夾名稱與 articleId 不一致')
}
const slots = selectedInlineSlots(plan)
if (slots.length === 0) throw new Error('圖片封包沒有標好位置（placement）的文內照片')

const articleId = `article-${plan.articleId}`
const draftId = `drafts.${articleId}`
const client = getCliClient({apiVersion: '2026-08-28'})
const documents = await client.fetch(`*[_id in $ids]{_id, _rev, _type, title, body}`, {ids: [articleId, draftId]})
const article = documents.find((document) => document._id === articleId)
if (article?._type !== 'article') throw new Error(`找不到 Sanity 文章：${articleId}`)
if (documents.some((document) => document._id === draftId)) {
  throw new Error(`Sanity 有未發布草稿，請先人工判斷：${draftId}`)
}

const body = article.body ?? []
const existing = new Map(body.filter((block) => block._key).map((block) => [block._key, block]))

if (removeImages) {
  const present = slots.filter(({key}) => existing.has(key))
  console.log(JSON.stringify({mode: applyChanges ? 'apply' : 'dry-run', action: 'remove', articleId, remove: present.map(({key}) => key)}, null, 2))
  if (!applyChanges) {
    console.log('目前為預覽模式；加上 --apply 才會拿掉照片。')
  } else if (present.length > 0) {
    await client
      .patch(articleId)
      .ifRevisionId(article._rev)
      .unset(present.map(({key}) => `body[_key=="${key}"]`))
      .commit()
    console.log('已拿掉文內照片（圖檔本身留在 Sanity，不影響網站）。')
  }
  process.exit(0)
}

const preparedDirectory = path.join(projectRoot, '.tmp', 'image-selection', plan.articleId, 'inline')
const record = JSON.parse(await readFile(path.join(preparedDirectory, 'prepared-inline.json'), 'utf8'))
if (record.articleId !== plan.articleId) throw new Error('準備紀錄與圖片封包不一致，請重新執行 prepare-inline-images')

const work = []
for (const {slot, candidate, key} of slots) {
  const fields = inlineImageFields(slot, candidate)
  const current = existing.get(key)
  if (current) {
    const same = Object.entries(fields).every(([field, value]) => current[field] === value) && current.asset?._ref
    if (!same) throw new Error(`${key} 已在正文裡但文字欄位不同，拒絕自動覆寫；先用 --remove 拿掉再重傳`)
    work.push({slotId: slot.slotId, key, action: 'already-matching'})
    continue
  }

  const prepared = record.images?.find((image) => image.slotId === slot.slotId)
  if (!prepared || prepared.selectedCandidateId !== candidate.candidateId) {
    throw new Error(`${slot.slotId} 沒有對應的準備紀錄，請重新執行 prepare-inline-images`)
  }
  const buffer = await readFile(path.join(preparedDirectory, prepared.output.file))
  if (createHash('sha256').update(buffer).digest('hex') !== prepared.output.sha256) {
    throw new Error(`${prepared.output.file} 與準備紀錄的雜湊不一致，拒絕上傳`)
  }
  if (prepared.output.width < slot.minimumWidth) {
    throw new Error(`${slot.slotId} 寬度 ${prepared.output.width}px，小於最低寬度 ${slot.minimumWidth}px`)
  }
  work.push({
    slotId: slot.slotId,
    key,
    action: 'upload-and-insert',
    afterKey: findInsertionKey(body, slot.placement),
    heading: slot.placement.heading,
    size: `${prepared.output.width}×${prepared.output.height}`,
    buffer,
    fields,
  })
}

console.log(
  JSON.stringify(
    {
      mode: applyChanges ? 'apply' : 'dry-run',
      articleId,
      articleTitle: article.title,
      images: work.map(({buffer, ...item}) => item),
    },
    null,
    2,
  ),
)

const toInsert = work.filter((item) => item.action === 'upload-and-insert')
if (!applyChanges) {
  console.log('目前為預覽模式；加上 --apply 才會上傳照片並更新文章。')
} else if (toInsert.length === 0) {
  console.log('Sanity 已有相同的文內照片，不重複上傳。')
} else {
  for (const item of toInsert) {
    const asset = await client.assets.upload('image', item.buffer, {
      filename: `${plan.articleId}-${item.slotId}.webp`,
    })
    item.assetId = asset._id
  }

  const transaction = client.transaction()
  toInsert.forEach((item, index) => {
    transaction.patch(articleId, (patch) => {
      const block = {
        _key: item.key,
        _type: 'image',
        asset: {_type: 'reference', _ref: item.assetId},
        ...item.fields,
      }
      const next = patch.insert('after', `body[_key=="${item.afterKey}"]`, [block])
      return index === 0 ? next.ifRevisionId(article._rev) : next
    })
  })
  await transaction.commit()

  const verified = await client.fetch(
    `*[_id == $id][0]{_rev, "images": body[_type == "image"]{_key, "assetId": asset._ref, alt, caption, credit, sourcePageUrl, license}}`,
    {id: articleId},
  )
  for (const item of toInsert) {
    const image = verified.images.find((candidate) => candidate._key === item.key)
    const ok =
      image?.assetId === item.assetId &&
      Object.entries(item.fields).every(([field, value]) => image[field] === value)
    if (!ok) throw new Error(`${item.key} 寫入後驗證失敗`)
  }
  console.log(
    JSON.stringify(
      {
        articleId,
        articleRevision: verified._rev,
        status: 'inline-images-published-and-verified',
        inserted: toInsert.map(({key, assetId, heading}) => ({key, assetId, heading})),
      },
      null,
      2,
    ),
  )
}
