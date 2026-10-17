# content-automation

自動寫文與發布流程的清單與紀錄。routine 尚未建立，這裡目前只有空殼。

- `article-queue.json`：已核准的文章清單。一個主題中心（Hub）一個批次（`batches[]`），每篇文章由 Darren 核准後才列入；進度不寫回 Git，由 Sanity 文件狀態判斷。清單規則寫在 `scripts/article-automation-policy.mjs`，`npm run queue:validate` 可以檢查。
- 批次欄位範例見 `tests/article-automation-policy.test.ts` 的 `createBatch()`。本站比好材誌多兩條規則：
  - 住宿分類的每篇文章要有 `bookingChannels`（official／trip.com／agoda／jalan-only）與 `factCheck`（`lastVerifiedAt` 查核日期、`nextReviewDue` 一年後重查、`sources` 官網來源）。
  - `keywordValidation.provider` 沒有連 Ahrefs 時只能填 `SERP observation`，`ahrefsVerified` 必須是 false；`serpIntentConfirmed` 要確認搜尋結果是日本而非台灣同名地名。
- `publicationCadence`：Darren 於 2026-10-16 決定每 3 小時一輪、每輪 1 篇，每日上限 8 篇。
- `auto-publisher-run-log.md`：routine 啟用後才建立，每輪結束前更新。
- 執行鎖、每輪紀錄、停放與事實查核狀態放在維護資料庫（Cloudflare D1），每輪開頭用 `npm run queue:lock -- acquire`、`npm run ops:run -- start` 記錄，結尾放鎖並記錄結果；每週用 `npm run ops:sheet-sync -- collect` 同步到規劃總表。細節見 `d1/README.md`。
