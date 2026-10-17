# 自動化 routine 架構（2026-10-17）

本站 routine 的整體設計。文章品質（寫作與驗收怎麼做）是另一條流程，本文件只管「routine 怎麼跑、資料放哪、每一步由哪支程式負責」。主流程沿用好材誌自動發布（固定清單、Sanity 狀態判斷進度、一輪一篇、noindex 暫存、CI 後開放索引），再加上本站需要的旅行群、默許核准、停放、補內連與事實重查。

## 資料放哪

| 位置 | 內容 | 誰會改 |
|---|---|---|
| Git `content-planning/` | 規格、群大綱、全站地點清單、全站分工表、地點事實表（原文證據） | 規劃 session |
| Git `content-automation/article-queue.json` | 已規劃的文章清單、旅行群與寫作順序、自動核准日 | 規劃 session（routine 不改） |
| Git `content-production/<article-id>/` | 每篇的文章封包 | routine |
| Sanity（公開） | 文章、Hub、作者；文章是否已暫存、已開放索引 | routine（透過 studio/scripts） |
| D1（私有） | 執行鎖、每輪紀錄、文章生產狀態與停放、旅行群核准狀態、事實查核狀態、待補內連、跨群回補、例外 | routine 與規劃 session（透過 scripts/ops-*.mjs） |
| Google Sheet「日本站規劃總表」 | 給 Darren 看與回覆意見的窗口 | routine 寫入；Darren 寫意見 |

routine 每次都是全新下載的雲端 session，進度只看 Sanity 與 D1，不看 Git 裡有沒有檔案。

## 一輪做什麼

每輪先拿 D1 執行鎖、記錄開始，再由 `scripts/routine-next-action.mjs` 依固定優先順序決定**只做一件事**，做完記錄結果、放鎖：

1. **續做**：有 `staged_noindex`（已暫存未開放索引）的文章，先把它做完。
2. **補內連**：有目標頁已上線的待補內連或跨群回補，先補（只加連結，不改字）。
3. **生產一篇**：清單裡下一篇可以開始的文章。可以開始的條件：所屬旅行群已核准（Darren 明確核准，或到自動核准日沒有反對且不是例外）、文章不是停放中、不在延後期間、當日額度還有剩。
4. **規劃下一群**：目前的群剩下的篇數約夠寫 7 天、而且還沒有待核准的群時，執行選題 Skill 的找下一群流程，寫大綱、更新規劃總表、在日曆提醒 Darren。
5. **事實重查**：有到期的事實時，依來源網址分批重查。
6. **每週摘要**：每週一次把例外與即將重查的事實同步到規劃總表。
7. 都沒有就略過，記錄原因。

順序的理由：先收尾已經做一半的，再處理不改字、風險最低的內連，然後才產新內容；規劃與維護放在生產之後，避免搶走寫文章的額度。

## 文章的生命週期

狀態記在 D1 `article_status`；發布與索引狀態以 Sanity 為準。

| 狀態 | 意思 | 下一步 |
|---|---|---|
| `queued` | 在清單裡，還沒開始 | 輪到時開始寫 |
| `writing` | 這一輪正在寫；`attempts` 加一 | 驗收通過 → `accepted`；失敗見下 |
| `accepted` | 驗收通過，準備定稿與上稿 | 上稿暫存 → Sanity `staged_noindex` |
| `published` | Sanity 已開放索引 | 觸發補內連與事實登記 |
| `deferred` | 來源網站打不開，`defer_until` 前不挑它 | 到期再試；連續延後超過 3 天改停放 |
| `parked` | 停放，不再自動挑中 | 寫一筆例外到規劃總表，等人處理 |

失敗的處理：

- **事實錯誤**（驗收判退，原因是事實或條件）：可以再寫一次；同一篇最多 2 次，第 2 次還是判退就停放（`park_kind=facts`）。
- **架構問題**（缺事實、分工不對、大綱和實際資料對不上）：直接停放（`park_kind=needs-outline`），不自己改分工。
- **來源打不開**：延後一天（`deferred`），換下一篇。
- 停放或延後的文章不會擋住清單，routine 直接挑下一篇。

## 旅行群與默許核准

- 清單的 `travelGroups[]` 記每一群的成員批次、寫作順序（被最多頁連到的先寫，地點主頁最後）與自動核准日。一群可以跨多個 Hub（每個地點一個 Hub，加上共用教學頁的 Hub）。
- 核准狀態記在 D1 `group_status`：`awaiting-approval` → `approved`（`approved_by` 是 `darren` 或 `default`）；Darren 在規劃總表寫意見或改狀態時變成 `changes-requested` 或 `paused`。
- routine 每次要開始一群的第一篇前，讀規劃總表那一列：有意見就不開始；到了自動核准日、沒有意見、不是例外，就記成 `approved`（`default`）。

## 程式分工

| 程式 | 做什麼 | 狀態 |
|---|---|---|
| `scripts/manage-auto-publisher-lock.mjs` | D1 執行鎖 | 已完成 |
| `scripts/ops-run.mjs` | 每輪開始與結束紀錄 | 已完成 |
| `scripts/ops-sheet-sync.mjs` | 例外與到期事實同步到規劃總表 | 已完成 |
| `scripts/article-automation-policy.mjs` | 清單規則、旅行群、生產順序 | 本輪改版 |
| `scripts/ops-article.mjs` | 文章生產狀態轉換（開始、通過、停放、延後、發布） | 本輪新增 |
| `scripts/ops-group.mjs` | 旅行群核准狀態 | 本輪新增 |
| `scripts/routine-next-action.mjs` | 決定這一輪做哪一件事 | 本輪新增 |
| `studio/scripts/inspect-article-queue.mjs` | Sanity 狀態與下一篇 | 已有，改成依旅行群順序 |
| `studio/scripts/publish-*.mjs`、`release-indexable-article.mjs`、`prepare-parent-hub.mjs` | 上稿、封面、開放索引、建 Hub | 已有 |
| 定稿工具（文章封包 → Sanity 正文） | 從好材誌移植，改成本站的驗收檔案 | 待做 |
| 補內連工具 | 讀 D1 待補內連，只加連結標記 | 待做 |
| 地點事實表同步 | 把事實的變動類型與下次查核日寫進 D1 | 待做 |
| `content-automation/routine-prompt.md` | routine 的提示全文 | 待做 |

## 不做的事

- routine 不改程式、清單、Skill 或規則文件；這些回到一般 session 處理。
- routine 不自己改分工、改網址、改 Hub，也不為了篇數補題。
- 每輪最多新寫一篇；任何門檻失敗依上面的規則停放或延後，不降低門檻。
