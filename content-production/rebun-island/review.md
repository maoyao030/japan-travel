# 驗收紀錄：rebun-island（2026-11-24，地點主頁改版）

- 文章：`content-production/rebun-island/reader-preview.md`（禮文島旅遊攻略，敦盛草、澄海岬、海膽與一日來回排法）
- SHA-256（換行統一成 LF 後計算）：`d4d80b1f506d17c6c0ac2d48382e3b9bb36d91141732ce77fbcacd7e04bb594c`
- 規則：寫作 Skill `references/place-entry-page.md`（Darren 2026-11-21 同意）、`sentence-rhythm.md`、`heading-style.md`。研究與樣本在 `content-experiments/place-entry-study-2026-11-19/sample-rebun-island/`（`spec.md`、`new.md`、`facts-used.md`、`moved.md`、`gaps.md`、`hook-review.md`）。舊版封包在 `pre-place-entry/`。
- 寫作：一位作者子代理，事實只用本地點主頁與五個子頁（交通、住宿、景點、美食、健行）、利尻島與稚內主頁已查證的稿；摘要放在 `publication.json` 的 excerpt。讀者驗收後的修改也由作者處理。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作），共 3 輪。第 1 輪約 95 處裡 5 處要改，作者照最小改法改；第 2 輪改句全部成立（`content-experiments/.../fact-check-round1.md`、`fact-check-round2.md`）。讀者驗收後作者改了約 30 處，第 3 輪逐句重查，4 處不成立由查核者照最小改法直接改在 `draft-tagged.md`（花魚鏘鏘燒小標題的「元祖」加引號、B 線那句補「2等艙的」、保護區「船泊本町一帶」改「船泊一帶」、5 月下旬到 6 月中旬的「17:10的末班船」改「末班船」），見 `fact-check-round3.md`。吸引力審查第四輪退回兩處（序言第一段、海膽小標題與第一句），作者改完，第 4 輪複查：「從藍綠色變到翡翠色」說過頭，由查核者改回「變成藍綠色或翡翠色」，其餘成立（`fact-check-round4.md`）。Darren 看過成品確認九處有問題，作者改了 H1、摘要、序言、四個小標題、新增北方金絲雀公園看點、刪掉薄雪之湯小段等；第 5 輪逐句複查全部成立，查核者補了北方金絲雀公園的 F310 與景點頁連結句的 F436、F435、F440 標記（`fact-check-round5.md`）。最後 `fact-check.json` 117 項全部 verified。查核對的是已上線子頁與事實表的原文摘錄，沒有重新開官方網址。
- 讀者驗收：讀者驗收子代理（沒寫過、沒查核過），八題驗收 1 次（`acceptance-place-entry.md`）：總判定小修後通過，六處要改，作者改完由查核者確認改句（第 3 輪），驗收者表示不用再送讀者驗收。
- 協調：人工 session（Claude Code）。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type place-entry`；1 個提醒：溫泉美食健行的價格沒寫含稅或未稅） |
| 標題 | `acceptable`（讀者驗收過；`heading_review.py` 只改 H1；`planning:check` 通過） |
| 讀者價值 | `acceptable`（小修後通過，六處已改） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，117 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs` 通過（正文 4487 字；開頭到第 6 節 3274 字，第 1～6 節 3100 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤；1 個提醒「電影（北のカナリアたち）」是誤報（譯名表的中文寫法本身含原名），見 `fact-check-round5.md` |
| 事實編號 | `tags_clear`（正文用到 87 筆） |
| 圖片 | 沒動；文內照片與嵌入因標題全換，要重新規劃後上傳（`rewrite-carry.json` 還指著舊標題） |

**最終結果：`ready_for_user_preview`。**

## 轉成封包時的決定

- 子頁的 F 編號就是地點事實表 `rebun-island:Fxx` 的編號，抄進研究記錄時沿用原編號，沒有接著 F501 往下重編（重編會和地點事實表已有的 F502～F601 撞號）。地點事實表沒有的 7 筆暫編 F602～F608（住宿重跑事實表 K15、K34、K42，利尻島 F5、F188、F189、F47）。
- 大綱 `rebun-island` 的 h1、headings、links 換成現在的標題樹與連結句；連結句對照在 `link-sentences.json`（舊句取自改版前）。

## 待辦（不擋這一版）

- F602～F608 補進地點事實表與 D1。
- 文內照片與嵌入照新標題重新規劃。
- 溫泉美食健行的價格要不要標含稅或未稅（官網有標示再補）。
- 子頁彼此對不上的地方列在 `fact-check-round1.md` 最後一節（群生地開園期間、利尻到禮文船程等），舊版主頁 reader-preview 寫群生地 5/11、事實表 F31 已更正為 5/15，這次都沒有動。
