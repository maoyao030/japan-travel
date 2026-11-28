# 驗收紀錄：rebun-island-festival（2026-11-28，多活動祭典頁樣本）

- 文章：`content-production/rebun-island-festival/reader-preview.md`（禮文島祭典有哪些？2027最新禮文島祭典指南）
- SHA-256（換行統一成 LF 後計算）：`9236d0c12ccf36fa80c552fba0bf4342fdeecbe30e0025f42e2e7f8268e39d8a`
- 規則：寫作 Skill `references/festival-calendar-page.md`（Darren 2026-11-27 定的方向：平鋪直敘，有哪些、什麼時候、逐個介紹特色、配圖片或 IG）、`core-style.md`、`preference-review.md`（A～O 題）、`sentence-rhythm.md`、`heading-style.md`；驗收 Skill `references/festival-calendar-acceptance.md`。研究與樣本的每一輪在 `content-experiments/festival-multi-study-2026-11-27/`；改寫前的草稿在 `pre-calendar-page/`。
- 寫作：一位作者（Sonnet 5.5），事實只用本封包 `reference-review.md`（研究者 2026-11-27 補研究，F937～F963，加從別頁搬來的列）。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作），實際打開來源，每次改句子後複查，共十多輪：第 1 輪 53 項裡 14 項沒過，最後 43 項全部 verified，沒有 unreachable。查核中更正了 4 筆事實、新增 2 筆（2022 年水產祭中止、800 公尺的出處）。
- 偏好審查：1 個審查子代理（Opus 5.5，不是作者、查核者、驗收者），11 輪（樣本資料夾 `preference-review.md`）：第 1 輪退回 23 處；第 8 輪起用 Darren 新講的話（N、O 題）重審；第 11 輪的 3 處都已套用。
- 讀者驗收：1 個讀者驗收子代理（Opus 5.5），八題驗收 7 次（樣本資料夾 `acceptance-calendar.md`）：第 4、5 次 `acceptable`；Darren 改成平鋪直敘後第 6 次 `needs_revision`（敦盛草與花火兩段只重講表格），第 7 次 `acceptable`。
- 標題檢查：1 個標題檢查子代理（Opus 5.5），`heading-review.json`，改動 0 個標題。
- 協調：人工 session（Claude Code）。Darren 看了三版：第一版說「大標題感覺很怪，然後哪幾天配合，聽起來也很怪」；第二版說「疫情開放跟遊客要去哪也沒有吸引力」「title 這麼長有什麼用，SEO 有寬度限制」；第三版說「大標題這樣子也不對，這個東西好像可以平鋪直敘的說」並給了結構。2026-11-28 他收到平鋪直敘版的整篇之後說「沒問題」。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`，沒有問題與審查訊號） |
| 標題 | `acceptable`（`heading_review.py` 改動 0 個） |
| 讀者價值 | `acceptable`（第 7 次驗收） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，43 項全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文 1,613 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤；兩個警告（「禮文敦盛草群生地」「海膽祭」第一次出現沒附原文）不改：前者同一節已附「禮文敦盛草」的說明，後者是利尻島的活動、本頁只提一次並連到利尻島祭典頁 |
| 圖片 | 封面、敦盛草文內照片與 4 個嵌入（IG 3 則、YouTube 1 支）見 `images/` |

**最終結果：`ready_for_user_preview`。**

## 協調者的決定

- 禮文神社祭查不到內容，不設小標題，只在時間表後一句；海峽祭事實太少，併在花火那個小標題最後一段。
- 馬拉松、溫泉美食健行、湖畔祭、秋季祭不放（要報名、不是祭典、或 2019 年後沒再辦）。
- 2027 年的日期都還沒公布：時間表寫每年的規則；固定日期的寫 2027 年是星期幾（日曆推算）；水產祭不替 2027 年算日子。
- 疫情、群眾募資、屆數、封路、路名、免費巴士、抓章魚、徽章不寫（主辦的辛苦不是賣點，或只有單屆、預定公告的依據）。
- 查不到所以沒寫：嚴島神社祭的遶境幾點出發與路線、花火從哪裡看最好、祭典期間住宿與船票難不難訂、花火為什麼辦在 8 月 10 日。

## 待辦

- 2027 年各祭典日期公布後重查（禮文町公所與觀光協會通常在春天公布），更新時間表與開頭。
- 海峽祭沒有照片或貼文；觀光協會官網打不開，延伸資料沒有放它的網址。
- 禮文島主頁換成六節版（`content-production/rebun-island/phase2-six-sections/`），並把連到本頁的連結改成連結行。
