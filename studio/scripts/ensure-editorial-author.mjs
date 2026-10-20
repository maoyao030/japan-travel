// 建立全站預設作者「繞路筆記編輯部」（publish-prepared-article 需要 author-editorial-team）。
// 用法：npx sanity exec scripts/ensure-editorial-author.mjs [--with-user-token] -- [--apply]；已存在就不動。
import {getCliClient} from 'sanity/cli'
const client = getCliClient({apiVersion: '2026-08-26'})
const apply = process.argv.includes('--apply')
const doc = {
  _id: 'author-editorial-team',
  _type: 'author',
  name: '繞路筆記編輯部',
  slug: {_type: 'slug', current: 'editorial-team'},
  bio: '繞路筆記編輯部負責研究、撰寫與驗收全站文章。交通、住宿與季節資訊以日文官方來源為準，每篇經過事實查核與讀者驗收才發布，並標示查核日期。',
}
const existing = await client.getDocument(doc._id)
console.log(JSON.stringify({mode: apply ? 'apply' : 'dry-run', exists: Boolean(existing), doc}, null, 2))
if (apply && !existing) {
  await client.createIfNotExists(doc)
  console.log('created')
}
