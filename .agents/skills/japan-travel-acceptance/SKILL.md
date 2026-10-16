---
name: japan-travel-acceptance
description: Independently accept or reject a finished Japan travel reader preview in four layers — run the format checker, dispatch a fact-check agent that opens every Japanese source and records the original-text quote for each claim, dispatch a reader agent that walks the trip as a first-time Taiwanese traveler who cannot read Japanese, and dispatch an image reviewer for every AI illustration and self-made diagram. Use after japan-travel-answer-first finishes a reader-preview.md, or when the user asks to verify, review, or accept an article. Read-only: never edits the article, publishes, or approves publication.
---

# 日本旅遊長尾站文章驗收

驗收不是替作者核銷清單，而是用兩個沒寫過這篇的 agent，各自從不同角度找出讀者會被誤導或卡住的地方。格式正確、資料很多、符合計畫，都不足以證明文章合格。

## 四層驗收

| 層 | 誰做 | 看什麼 |
|---|---|---|
| 1 | 檢查程式 | 標題規則、冒號、制式摘要、H 樹、資料來源段落、正文外部連結 |
| 2 | 事實查核 agent | 每個事實：日期、價格、班次、營業狀態、譯名、年號、含稅與否、限制條件、按鈕與招牌的日文 |
| 3 | 讀者驗收 agent | 是否回答讀者問題、開頭是否直接回答、保母等級是否到位、H 樹與 FAQ |
| 4 | 圖片驗收 agent | 實際看每一張 AI 圖與自製示意圖；實拍照片不需要這一層 |

驗收 agent 都不能是作者；圖片驗收 agent 也不能是生圖的人。彼此不共用結論。同一個模型的 agent 容易有相同盲點，提高可靠度靠的是給不同的輸入、做不同的工作，以及要求附上原文證據，不是增加 agent 數量。

## 流程

1. 確認 `content-production/<article-id>/reader-preview.md` 與 `reference-review.md` 都存在，計算 `reader-preview.md` 的 SHA-256。
2. 執行 `python3 .agents/skills/japan-travel-answer-first/scripts/audit_answer_first.py content-production/<article-id>/reader-preview.md --json --reference-review content-production/<article-id>/reference-review.md`。`mechanical_failed` 就直接判退，不派 agent。
3. 派事實查核 agent（`run_in_background: false`），交給它：文章、研究記錄、頁面規格、[事實查核規則](references/fact-check-contract.md)。它要實際打開每個日文來源，輸出 `fact-check.json`。
4. 執行 `node .agents/skills/japan-travel-acceptance/scripts/validate-fact-check.mjs content-production/<article-id>`。驗證失敗代表查核紀錄不完整，退回事實查核 agent 補齊，不能直接放行。
5. 派讀者驗收 agent（`run_in_background: false`）。第一階段只給原始任務、文章與 [讀者驗收規則](references/reader-acceptance.md)，請它記下閱讀判斷；第二階段才給研究記錄與 `fact-check.json`。
6. 圖片封包有 AI 圖或自製示意圖時，派圖片驗收 agent（`run_in_background: false`），交給它圖片、圖片封包、示意圖資料檔、`fact-check.json` 與 [圖片驗收規則](references/image-review-contract.md)，輸出 `images/image-review.json`。再執行 `node .agents/skills/japan-travel-acceptance/scripts/validate-image-review.mjs content-production/<article-id>`。試點期間 AI 圖要等 Darren 確認後才通過。
7. 依下方判斷寫 `review.md`。

所有驗收 agent 都只讀不改。驗收者發現問題時寫明位置與原因，不能自己改稿；作者也不能把判退後修正冒充首次成稿。

## 判斷

`review.md` 記錄：文章路徑與 SHA-256、輪次、作者與兩位驗收者身分（能取得才記）、格式結果、事實查核結果摘要、讀者驗收第一與第二階段判斷、主要缺陷、最終結果。

分開回報四項：

- 格式：`mechanical_clear` 或 `mechanical_failed`
- 標題：`acceptable`、`reject` 或 `not_checked`
- 讀者價值：`acceptable`、`reject` 或 `not_checked`
- 事實與條件：`verified`、`reject` 或 `not_checked`

只有格式通過、標題與讀者價值可接受、事實為 `verified`、`fact-check.json` 驗證通過，而且有生成圖時圖片驗收也通過，才標 `ready_for_user_preview`。任一明確失敗為 `rejected`；資料不足為 `needs_review`。這些都不是 Darren 的核准或發布授權。

## 人工抽查

前 30 篇試點，Darren 每週抽 2～3 篇看 `fact-check.json` 的原文摘錄，確認查核品質。抽查結果記在 `PROJECT_STATUS.md`；連續穩定後再由 Darren 決定是否減少。

## 完成條件

`review.md` 與 `fact-check.json` 都已寫入文章資料夾；`fact-check.json` 對應目前文章的 SHA-256 並通過驗證；有生成圖時 `image-review.json` 通過驗證；驗收者都不是作者或生圖者；最終結果與各項判斷有具體依據。
