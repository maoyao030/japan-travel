import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import {MODELS_DIR, addModel, kindOf, loadIndex, loadQueueArticles, modelsFor, validateIndex} from '../scripts/page-models.mjs'

const index = () => ({
  schemaVersion: 1,
  maxModelsPerKind: 2,
  kinds: ['place-entry', 'transport', 'stay', 'sights', 'sight-single', 'food', 'weather', 'festival', 'hiking', 'cross-place'].map(
    (id) => ({id, label: `${id} 頁`, models: [] as Record<string, string>[], candidates: [] as Record<string, string>[]}),
  ),
})
const approval = {approvedAt: '2026-11-11', how: 'Darren 口述優化後說可以當範本', learn: '交通講最細，其他一兩句帶過，提醒接在具體事實後面。'}

test('頁型照清單欄位分，景點分成總覽與單一景點', () => {
  assert.equal(kindOf({pageType: 'place-entry', aspect: 'other'}), 'place-entry')
  assert.equal(kindOf({pageType: 'cross-place-page', aspect: 'other'}), 'cross-place')
  assert.equal(kindOf({pageType: 'aspect-page', aspect: 'stay', articleSlug: 'stay'}), 'stay')
  assert.equal(kindOf({pageType: 'aspect-page', aspect: 'transport', articleSlug: 'ferry'}), 'transport')
  assert.equal(kindOf({pageType: 'aspect-page', aspect: 'sight', articleSlug: 'sights'}), 'sights')
  assert.equal(kindOf({pageType: 'aspect-page', aspect: 'sight', articleSlug: 'blue-pond'}), 'sight-single')
  assert.equal(kindOf({pageType: 'aspect-page', aspect: 'other'}), null)
})

test('沒有範本的頁型 ready 是 false，有的列出範本檔與該學什麼', () => {
  const stay = {articleId: 'x-stay', pageType: 'aspect-page', aspect: 'stay', articleSlug: 'stay'}
  assert.equal(modelsFor(index(), stay).ready, false)
  const {index: next} = addModel(index(), {...stay, articleId: 'y-stay'}, approval)
  const info = modelsFor(next, stay)
  assert.equal(info.ready, true)
  assert.equal(info.models[0].file, '.agents/skills/japan-travel-answer-first/references/page-models/stay/y-stay.md')
  assert.equal(info.models[0].learn, approval.learn)
})

test('一種頁型最多兩篇範本，滿了要指定換掉哪一篇；加進範本的文章從候選拿掉', () => {
  const stay = (articleId: string) => ({articleId, pageType: 'aspect-page', aspect: 'stay', articleSlug: 'stay'})
  let current = index()
  current.kinds[2].candidates.push({articleId: 'a-stay', why: 'Darren 改過'})
  current = addModel(current, stay('a-stay'), approval).index
  assert.deepEqual(current.kinds[2].candidates, [])
  current = addModel(current, stay('b-stay'), approval).index
  assert.throws(() => addModel(current, stay('c-stay'), approval), /--replace/)
  assert.throws(() => addModel(current, stay('c-stay'), {...approval, replace: 'z-stay'}), /沒有 z-stay/)
  const replaced = addModel(current, stay('c-stay'), {...approval, replace: 'a-stay'})
  assert.equal(replaced.removed?.articleId, 'a-stay')
  assert.deepEqual(replaced.kind.models.map((model: {articleId: string}) => model.articleId), ['b-stay', 'c-stay'])
  // 同一篇重跑是更新，不會變成兩筆
  assert.equal(addModel(current, stay('b-stay'), approval).kind.models.length, 2)
})

test('登記檔檢查：只有 Darren 認可、有日期、有該學什麼、檔案存在才算', () => {
  const good = addModel(index(), {articleId: 'a-stay', pageType: 'aspect-page', aspect: 'stay'}, approval).index
  assert.deepEqual(validateIndex(good, {fileExists: () => true}), [])
  assert.match(validateIndex(good, {fileExists: () => false}).join('\n'), /找不到範本檔/)
  const bad = structuredClone(good)
  Object.assign(bad.kinds[2].models[0], {approvedBy: 'Claude', approvedAt: '', learn: ''})
  const problems = validateIndex(bad, {fileExists: () => true}).join('\n')
  assert.match(problems, /approvedBy 要是 Darren/)
  assert.match(problems, /缺 approvedAt/)
  assert.match(problems, /缺 learn/)
  assert.match(validateIndex({...good, kinds: good.kinds.slice(1)}, {fileExists: () => true}).join('\n'), /缺頁型：place-entry/)
})

test('repo 裡的登記檔沒有問題，清單每一篇都對得到頁型，範本檔是整篇文章', async () => {
  const real = await loadIndex()
  assert.deepEqual(validateIndex(real), [])
  const {articles} = await loadQueueArticles()
  assert.ok(articles.length > 60)
  for (const article of articles) assert.ok(modelsFor(real, article).label, `${article.articleId} 對不到頁型`)
  for (const kind of real.kinds) {
    for (const model of kind.models) {
      const text = await readFile(path.join(MODELS_DIR, model.file), 'utf8')
      assert.match(text, /^# .+/)
      assert.match(text, /\n## 資料來源\n/)
    }
  }
})

test('流程文件有接上範本：作者讀、沒範本不寫、只有 Darren 說了才登記', async () => {
  const root = path.resolve(import.meta.dirname, '..')
  const read = (file: string) => readFile(path.join(root, file), 'utf8')
  const writer = await read('content-automation/local-writer.md')
  assert.match(writer, /page-models\.mjs --for=/)
  assert.match(writer, /略過：<頁型> 還沒有範本|還沒有範本/)
  assert.match(await read('.agents/skills/japan-travel-answer-first/SKILL.md'), /references\/page-models\/README\.md/)
  assert.match(await read('content-automation/chat-optimize.md'), /## 做範本/)
})
