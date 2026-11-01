# asahikawa 驗收紀錄

- 文章：旭川地點主頁（`/places/asahikawa/`，place-entry，地點 `asahikawa`，旭川・大雪群）
- 日期：2026-10-27（人工 session，Darren 要求接著寫旭川・大雪群的 4 篇地點主頁；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`afd966629718b757821c9171d633118ce29280ceaabeeb2259dd88620eb03d5d`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`
- 備註：
  - 標題檢查建議把「幾月去旭川」改成「旭川各月的天氣與活動」；協調者為保留讀者搜尋的「幾月去」問法，改成「旭川幾月去？」，作者修改時把下一段第一句改成直接回答。
  - 讀者最終判定（對 `ed0d44e5…`）剩 1 條必修（4 月休園起日）；事實查核第 2 輪另有 3 項（C21 同一句、C53 會場方位、C55 公車延長是往年做法）。協調者只改這 3 句，查核者換回原句比對雜湊確認只差這幾處，讀者也在 reader-final.md 的收斂確認判 acceptable，以 `afd96662…` 定稿。
  - 潤稿時刻意刪掉和面向頁重複的細節來縮短篇幅；check-polish 用只做刪減的 `trim-baseline-draft-tagged.md` 比對。
  - 作者為了讓 heading_review.py 能比對，把 heading-review.json 補成逐條列出（沒改的 before 等於 after）。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，place-entry） |
| 標題 | `acceptable`（改 5 個標題；heading_review.py `headings_applied`；大綱 headings 與內連 section 同步） |
| 讀者價值 | `acceptable`（reader-final.md 收斂確認，剩餘必修 0） |
| 事實與條件 | `verified`（fact-check.json 第 3 輪 116 項全部 verified） |
| 口吻 | check-voice --final 通過 |
| 事實編號 | tags_clear，事實表 128 筆、正文用 87 筆 |
| 防抄襲 | check-copy 通過（潤稿時比對 GLTJP 3 篇、MATCHA 2 篇） |
| 圖片 | 這次沒有選圖 |

## 身分

| 角色 | 身分 |
|---|---|
| 研究者 | 子代理（Opus 5.5），寫作前補研究，判定 `ready` |
| 作者 | 另一個子代理（Opus 5.5），寫初稿與驗收後第 1 輪 |
| 潤稿者 | 另一個子代理（Opus 5.5），沒寫過這篇 |
| 編輯挑錯 | 另一個子代理（Opus 5.5） |
| 意義比對 | 另一個子代理（Opus 5.5） |
| 標題檢查 | 另一個子代理（Opus 5.5） |
| 事實查核 | 另一個子代理（Opus 5.5），唯讀 |
| 讀者驗收 | 另一個子代理（Opus 5.5），唯讀 |
| 協調者 | 人工 session 主代理（Opus 5.5）；改 1 個標題建議、同步標題與內連 section；收斂時照查核與讀者意見改 3 句 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | `ready`；從地點事實表挑 70 筆、從面向頁與其他地點複製 F600～F632、新查 F609 與 F640～F655（2027 冬まつり與夏まつり日期、食べマルシェ、JR 上行末班）；F107 照主辦單位更正為沒有接駁巴士 |
| 作者 | 初稿 mechanical_clear |
| 潤稿 | 讀 GLTJP 3 篇、MATCHA 2 篇；正文 3,302 → 2,698 字；五項檢查通過 |
| 意義比對 | 不可接受 2、遺失 3（祭典時間），已補回 |
| 事實查核第 1 輪 | 108 項，非 verified 9（C3、C34、C37、C43、C50 走到常磐公園 20 分、C56 乘車處編號、C58、C59、C90） |
| 讀者驗收 | 第一階段 needs_revision 必修 7；第二階段最終必修 15 |
| 作者驗收後第 1 輪 | 15 條必修處理，新增 F656～F664（乘車處 PDF、動物園冬期與休園、夜間開園回程、特急宗谷時刻、食べマルシェ） |
| 讀者最終 | 剩必修 1 |
| 事實查核第 2 輪 | 116 項，非 verified 3（C21、C53、C55） |
| 收斂 | 協調者改 3 句；查核第 3 輪 116 項全部 verified；讀者收斂確認 acceptable |

## 查不到所以正文沒寫的

- 2026～27 冬季企鵝散步的開始日與時刻（動物園還沒公布，歸動物園頁）。
- 2027 年冬まつり會場時間、煙火日期與會場配置；2027 年花火大會與食べマルシェ日期（正文寫 2026 年並標年份，或請讀者出發前看官網）。
- 冬まつり常磐公園前下車後走到會場要幾分鐘。

## 留給之後的事

- 事實表待同步回 `places/asahikawa/facts.json`：F19、F36、F38、F128 更正版，F107、F108、F111、F112、F115 更新，F609、F640～F664；F659 計程車車資照動物園官網更正為約 4,800 日圓（正文沒寫車資）。
- 企鵝散步日期公布後（12/10 前）重查；2027 年冬まつり、夏まつり花火、食べマルシェ日期公布後重查。
- 道北巴士官網連不上，層雲峽巴士時刻用官方販售網站核對，恢復後重查。

最終結果：`ready_for_user_preview`
