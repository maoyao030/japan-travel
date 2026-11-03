/**
 * 後台手動修改的保護。Darren 在 Sanity 後台按「發布」時，後台會記下 studioEditedAt；
 * 抓回手動修改的工具（studio/scripts/pull-studio-edits.mjs）把修改存進 Git 後，記下 studioEditsSyncedAt。
 * 會用 Git 稿件改寫正文的工具，看到還沒同步的手動修改就停下來，不蓋掉。
 */
export function hasUnsyncedStudioEdits(document) {
  const edited = Date.parse(document?.studioEditedAt ?? '')
  if (Number.isNaN(edited)) return false
  const synced = Date.parse(document?.studioEditsSyncedAt ?? '')
  return Number.isNaN(synced) || edited > synced
}

export function assertNoUnsyncedStudioEdits(document) {
  if (!hasUnsyncedStudioEdits(document)) return
  const slug = String(document._id ?? '').replace(/^article-/, '')
  throw new Error(
    [
      `${document._id} 在後台手動改過（${document.studioEditedAt}），還沒同步回 Git，拒絕用 Git 稿件改寫，免得蓋掉手動修改。`,
      `先在 studio/ 跑 npm run pull:studio-edits -- --article=${slug} 看修改內容，確認後加 --apply 把修改寫回稿件，再改稿上傳。`,
    ].join('\n'),
  )
}
