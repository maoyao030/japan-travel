import assert from 'node:assert/strict'
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {checkInternalLinks} from '../scripts/check-internal-links.mjs'

async function createSite(files: Record<string, string>) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'japan-travel-links-'))

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = path.join(directory, relativePath)
    await mkdir(path.dirname(filePath), {recursive: true})
    await writeFile(filePath, content)
  }

  return directory
}

test('存在的頁面、資源與段落連結會通過', async (context) => {
  const directory = await createSite({
    'index.html': '<a href="/stay/">住宿</a><a href="#about">關於</a><div id="about"></div>',
    'stay/index.html': '<a href="/">首頁</a><a href="/stay/ginzan-onsen/ryokan/#price">旅館</a>',
    'stay/ginzan-onsen/ryokan/index.html': '<h2 id="price">房價</h2><a href="https://example.com">外部來源</a>',
  })
  context.after(() => rm(directory, {recursive: true, force: true}))

  const result = await checkInternalLinks(directory)

  assert.equal(result.htmlPages, 3)
  assert.equal(result.checkedLinks, 4)
  assert.deepEqual(result.issues, [])
})

test('不存在的頁面會指出來源與錯誤網址', async (context) => {
  const directory = await createSite({
    'index.html': '<a href="/stay/ginzan-onsen/">尚未發布的住宿 Hub</a>',
  })
  context.after(() => rm(directory, {recursive: true, force: true}))

  const result = await checkInternalLinks(directory)

  assert.deepEqual(result.issues, [
    {
      sourceRoute: '/',
      href: '/stay/ginzan-onsen/',
      reason: '找不到 /stay/ginzan-onsen/',
    },
  ])
})

test('不存在的頁面段落會被攔下', async (context) => {
  const directory = await createSite({
    'index.html': '<a href="/stay/ginzan-onsen/ryokan/#missing">錯誤段落</a>',
    'stay/ginzan-onsen/ryokan/index.html': '<h2 id="price">房價</h2>',
  })
  context.after(() => rm(directory, {recursive: true, force: true}))

  const result = await checkInternalLinks(directory)

  assert.equal(result.issues.length, 1)
  assert.equal(result.issues[0].reason, '找不到頁面段落 #missing')
})
