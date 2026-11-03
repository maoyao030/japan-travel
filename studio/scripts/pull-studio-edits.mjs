/**
 * 把 Darren 在後台手動改過的文章抓回 Git。
 * 預設只列出修改、在 content-production/<文章>/studio-edits/<時間>/ 存下後台版本（studio-version.md）與修改前後對照（changes.md），不動稿件也不動 Sanity。
 * 加 --apply：把原本的稿件存成同一資料夾的 git-before.md，後台版本寫進 reader-preview.md，標題與摘要寫進 publication.json，
 * 在 content-automation/manual-edits-log.json 加一筆優化紀錄，再在 Sanity 記下 studioEditsSyncedAt（之後自動工具才會再改這篇）。
 *
 * 用法（在 studio/ 目錄）：
 *   npm run pull:studio-edits                         # 列出所有還沒同步的手動修改
 *   npm run pull:studio-edits -- --article=<文章>     # 只看一篇
 *   npm run pull:studio-edits -- --article=<文章> --apply
 *
 * 加 --draft：改抓後台還沒按「發布」的草稿（Darren 在後台改到一半，改到對話裡繼續優化時用）。
 * --draft --apply 只寫 Git（reader-preview.md、publication.json），不動 Sanity、不記優化紀錄；
 * 草稿的版本記在 content-production/<文章>/chat-optimize.json，上傳時
 * replace-article-body.mjs --manual --discard-draft 確認草稿沒再改過才清掉（流程見 content-automation/chat-optimize.md）。
 */
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {getCliClient} from 'sanity/cli'

import {applyFieldChanges, buildStudioEditReport, editFolderName, keepGitSourceLines} from '../../scripts/studio-edits.mjs'

const projectRoot = path.resolve(import.meta.dirname, '../..')
const options = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((argument) => argument.startsWith('--'))
    .map((argument) => {
      const [key, ...value] = argument.slice(2).split('=')
      return [key, value.length > 0 ? value.join('=') : true]
    }),
)
const applyChanges = options.apply === true
const onlySlug = typeof options.article === 'string' ? options.article.replace(/^article-/, '') : null
if (applyChanges && !onlySlug) throw new Error('--apply 一次只處理一篇，請加 --article=<文章>')
const draftMode = options.draft === true
if (draftMode && !onlySlug) throw new Error('--draft 一次只處理一篇，請加 --article=<文章>')

const readOptional = async (file) => {
  try {
    return await readFile(file, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

const client = getCliClient({apiVersion: '2026-08-29'})
if (draftMode) await pullDraft()
const articles = await client.fetch(
  `*[_type == "article" && !(_id in path("drafts.**")) && defined(studioEditedAt)
    && (!defined(studioEditsSyncedAt) || dateTime(studioEditedAt) > dateTime(studioEditsSyncedAt))
    && ($id == null || _id == $id)]{
    _id, _rev, title, seoTitle, seoDescription, excerpt, body, studioEditedAt, studioEditsSyncedAt, studioEditLog[]{at},
    "hasDraft": defined(*[_id == "drafts." + ^._id][0]._id)
  } | order(studioEditedAt desc)`,
  {id: onlySlug ? `article-${onlySlug}` : null},
)

if (articles.length === 0) {
  console.log(JSON.stringify({message: onlySlug ? `article-${onlySlug} 沒有還沒同步的手動修改` : '沒有還沒同步的手動修改'}, null, 2))
  process.exit(0)
}

const summary = []
for (const article of articles) {
  const slug = article._id.replace(/^article-/, '')
  const packetDir = path.join(projectRoot, 'content-production', slug)
  const previewFile = path.join(packetDir, 'reader-preview.md')
  const publicationFile = path.join(packetDir, 'publication.json')
  const gitMarkdown = await readOptional(previewFile)
  const publicationText = await readOptional(publicationFile)
  const publication = publicationText ? JSON.parse(publicationText) : null

  const {studioMarkdown, fieldChanges, paragraphChanges, report} = buildStudioEditReport(article, gitMarkdown, publication)
  const editDir = path.join(packetDir, 'studio-edits', editFolderName(article.studioEditedAt))
  await mkdir(editDir, {recursive: true})
  await writeFile(path.join(editDir, 'studio-version.md'), studioMarkdown)
  await writeFile(path.join(editDir, 'changes.md'), report)

  const item = {
    article: article._id,
    studioEditedAt: article.studioEditedAt,
    changedFields: fieldChanges.map((change) => change.field),
    changedParagraphs: paragraphChanges.length,
    hasUnpublishedDraft: article.hasDraft,
    changesFile: path.relative(projectRoot, path.join(editDir, 'changes.md')),
  }

  if (applyChanges) {
    if (article.hasDraft) throw new Error(`${article._id} 在後台還有沒發布的草稿，請先在後台按「發布」或捨棄草稿`)
    if (gitMarkdown !== null) await writeFile(path.join(editDir, 'git-before.md'), gitMarkdown)
    await writeFile(previewFile, keepGitSourceLines(gitMarkdown, studioMarkdown))
    if (publication && fieldChanges.length > 0) {
      await writeFile(publicationFile, `${JSON.stringify(applyFieldChanges(publication, fieldChanges), null, 2)}\n`)
    }
    // 手動優化紀錄寫進 Git，後台的紀錄之後被覆蓋也還查得到（報表：npm run report:manual-edits）。
    const previousSync = Date.parse(article.studioEditsSyncedAt ?? '') || 0
    const publishTimes = (article.studioEditLog ?? [])
      .map((entry) => entry?.at)
      .filter((at) => at && Date.parse(at) > previousSync)
    const logFile = path.join(projectRoot, 'content-automation', 'manual-edits-log.json')
    const log = JSON.parse((await readOptional(logFile)) ?? '{"edits": []}')
    log.edits.push({
      article: article._id,
      pulledAt: new Date().toISOString(),
      publishTimes: publishTimes.length > 0 ? publishTimes : [article.studioEditedAt],
      changedParagraphs: paragraphChanges.length,
      changedFields: fieldChanges.map((change) => change.field),
      changesFile: item.changesFile,
    })
    await writeFile(logFile, `${JSON.stringify(log, null, 2)}\n`)

    await client
      .patch(article._id)
      .ifRevisionId(article._rev)
      .set({studioEditsSyncedAt: article.studioEditedAt})
      .commit()
    item.applied = true
  }
  summary.push(item)
}

console.log(JSON.stringify({mode: applyChanges ? 'apply' : 'preview', articles: summary}, null, 2))
if (!applyChanges) console.log('\n看過 changes.md 後，用 --article=<文章> --apply 把修改寫回稿件並標記已同步。')

async function pullDraft() {
  const draftId = `drafts.article-${onlySlug}`
  const draft = await client.fetch(
    '*[_id == $id][0]{_id, _rev, _updatedAt, title, seoTitle, seoDescription, excerpt, body}',
    {id: draftId},
    {perspective: 'raw'},
  )
  if (!draft) {
    console.log(JSON.stringify({message: `article-${onlySlug} 在後台沒有草稿`}, null, 2))
    process.exit(0)
  }
  const packetDir = path.join(projectRoot, 'content-production', onlySlug)
  const previewFile = path.join(packetDir, 'reader-preview.md')
  const publicationFile = path.join(packetDir, 'publication.json')
  const gitMarkdown = await readOptional(previewFile)
  const publicationText = await readOptional(publicationFile)
  const publication = publicationText ? JSON.parse(publicationText) : null
  const {studioMarkdown, fieldChanges, paragraphChanges, report} = buildStudioEditReport(
    {...draft, _id: `article-${onlySlug}`, studioEditedAt: draft._updatedAt},
    gitMarkdown,
    publication,
  )
  const editDir = path.join(packetDir, 'studio-edits', `draft-${editFolderName(draft._updatedAt)}`)
  await mkdir(editDir, {recursive: true})
  await writeFile(path.join(editDir, 'studio-version.md'), studioMarkdown)
  await writeFile(path.join(editDir, 'changes.md'), report.replace('- 後台發布時間：', '- 後台草稿最後修改：'))
  const item = {
    article: `article-${onlySlug}`,
    draftRev: draft._rev,
    draftUpdatedAt: draft._updatedAt,
    changedFields: fieldChanges.map((change) => change.field),
    changedParagraphs: paragraphChanges.length,
    changesFile: path.relative(projectRoot, path.join(editDir, 'changes.md')),
  }
  if (applyChanges) {
    if (gitMarkdown !== null) await writeFile(path.join(editDir, 'git-before.md'), gitMarkdown)
    await writeFile(previewFile, keepGitSourceLines(gitMarkdown, studioMarkdown))
    if (publication && fieldChanges.length > 0) {
      await writeFile(publicationFile, `${JSON.stringify(applyFieldChanges(publication, fieldChanges), null, 2)}\n`)
    }
    const stateFile = path.join(packetDir, 'chat-optimize.json')
    const state = JSON.parse((await readOptional(stateFile)) ?? '{}')
    await writeFile(
      stateFile,
      `${JSON.stringify({...state, draftRev: draft._rev, draftPulledAt: new Date().toISOString(), draftChangesFile: item.changesFile}, null, 2)}\n`,
    )
    item.applied = true
  }
  console.log(JSON.stringify({mode: applyChanges ? 'draft-apply' : 'draft-preview', ...item}, null, 2))
  process.exit(0)
}
