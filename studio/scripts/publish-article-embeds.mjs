// 把 content-production/<id>/images/embed-plan.json 的 YouTube 影片與 Instagram 貼文插進已發布文章正文的指定位置。
// 預設只預覽；--apply 才寫入；--remove 把這份封包插過的嵌入拿掉（復原用）。
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {validateEmbedPlan} from '../../scripts/embed-plan.mjs'
import {findInsertionKey, MEDIA_EMBED_KEY_PREFIX} from '../../scripts/inline-image-placement.mjs'

const argumentsList = process.argv.slice(2)
const applyChanges = argumentsList.includes('--apply')
const removeEmbeds = argumentsList.includes('--remove')
const packetArgument = argumentsList.find((argument) => !argument.startsWith('--'))

if (!packetArgument) {
  throw new Error(
    '用法：sanity exec scripts/publish-article-embeds.mjs --with-user-token -- <文章封包資料夾> [--apply | --remove --apply]',
  )
}

const packetDirectory = path.resolve(packetArgument)
const articleSlug = path.basename(packetDirectory)
const plan = JSON.parse(await readFile(path.join(packetDirectory, 'images', 'embed-plan.json'), 'utf8'))
const items = validateEmbedPlan(plan, {articleId: articleSlug})

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

if (removeEmbeds) {
  const present = items.filter(({key}) => existing.has(key))
  console.log(JSON.stringify({mode: applyChanges ? 'apply' : 'dry-run', action: 'remove', articleId, remove: present.map(({key}) => key)}, null, 2))
  if (!applyChanges) {
    console.log('目前為預覽模式；加上 --apply 才會拿掉嵌入。')
  } else if (present.length > 0) {
    await client.patch(articleId).ifRevisionId(article._rev).unset(present.map(({key}) => `body[_key=="${key}"]`)).commit()
    console.log('已拿掉嵌入。')
  }
  process.exit(0)
}

const work = items.map(({embed, key, fields}) => {
  const current = existing.get(key)
  if (current) {
    const same = current._type === 'mediaEmbed' && Object.entries(fields).every(([field, value]) => current[field] === value)
    if (!same) throw new Error(`${key} 已在正文裡但欄位不同，拒絕自動覆寫；先用 --remove 拿掉再重放`)
    return {embedId: embed.embedId, key, action: 'already-matching'}
  }
  return {
    embedId: embed.embedId,
    key,
    action: 'insert',
    heading: embed.placement.heading,
    afterKey: findInsertionKey(body, {afterBlocks: 1, ...embed.placement}, {skipPrefixes: [MEDIA_EMBED_KEY_PREFIX]}),
    fields,
  }
})

console.log(JSON.stringify({mode: applyChanges ? 'apply' : 'dry-run', articleId, articleTitle: article.title, embeds: work}, null, 2))

const toInsert = work.filter((item) => item.action === 'insert')
if (!applyChanges) {
  console.log('目前為預覽模式；加上 --apply 才會更新文章。')
} else if (toInsert.length === 0) {
  console.log('Sanity 已有相同的嵌入，不重複放。')
} else {
  const transaction = client.transaction()
  toInsert.forEach((item, index) => {
    transaction.patch(articleId, (patch) => {
      const next = patch.insert('after', `body[_key=="${item.afterKey}"]`, [{_key: item.key, _type: 'mediaEmbed', ...item.fields}])
      return index === 0 ? next.ifRevisionId(article._rev) : next
    })
  })
  await transaction.commit()

  const verified = await client.fetch(`*[_id == $id][0]{_rev, "embeds": body[_type == "mediaEmbed"]}`, {id: articleId})
  for (const item of toInsert) {
    const block = verified.embeds.find((candidate) => candidate._key === item.key)
    const ok = block && Object.entries(item.fields).every(([field, value]) => block[field] === value)
    if (!ok) throw new Error(`${item.key} 寫入後驗證失敗`)
  }
  console.log(
    JSON.stringify(
      {
        articleId,
        articleRevision: verified._rev,
        status: 'embeds-published-and-verified',
        inserted: toInsert.map(({key, heading}) => ({key, heading})),
      },
      null,
      2,
    ),
  )
}
