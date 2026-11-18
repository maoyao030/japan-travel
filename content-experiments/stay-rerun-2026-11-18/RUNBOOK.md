# 舊住宿頁重跑一輪（Darren 2026-11-18）

Darren：「我覺得可以排定工作了，不過在這之前，可以把舊的住宿的文章都先重新 re 過一輪嗎？」排定工作等這一輪做完才打開。協調者是人工 session（Claude Code），全程不問 Darren，照 `stay-topic-page.md`「自動化」的岔路預設。

## 對象（都已上線）

| 順序 | 文章 | 網址 | 現況 | 進度 |
|---|---|---|---|---|
| 1 | asahikawa-stay | /places/asahikawa/stay/ | 11-16 有一份照新格式改寫的主頁稿（`content-experiments/stay-local-test-2026-11-16/hub/final.md`），沒上線；底下三頁專門頁已上線 | 進行中 |
| 2 | sounkyo-stay | /places/sounkyo/stay/ | 舊格式，沒有住客說法 | |
| 3 | asahidake-stay | /places/asahidake/stay/ | 舊格式 | |
| 4 | wakkanai-stay | /places/wakkanai/stay/ | 舊格式，沒有住客說法 | |
| 5 | rishiri-island-stay | /places/rishiri-island/stay/ | 舊格式，表格 30 列 | |
| 6 | rebun-island-stay | /places/rebun-island/stay/ | 舊格式，「打電話問／問櫃台」7 處 | |

## 每一篇做什麼

目標：照寫作 Skill `references/stay-page.md`（住宿頁的寫法）與 `sentence-rhythm.md` 重寫，事實重查，住客說法由查核者用瀏覽器讀，過了全部關卡就換上線上的正文。

1. **讀線上版與既有研究**：`content-production/<id>/reader-preview.md`（線上稿）、`reference-review.md`、地點事實表。
2. **查問法**：中文自動完成（地名＋住宿／飯店）；中文延伸詞少於 5 組或被點名搜的飯店少於 3 間，就把日文自動完成查到一樣深當參考。
3. **讀者列問題** → 4. **補研究**：會變的資料（營業期間、休館、接送、訂房管道、能不能線上訂）全部重開官網核對；官網最後更新時間與官方社群最近的貼文也看一眼。**住客評論**由事實查核者角色用瀏覽器讀（Trip.com 3 頁、4travel 第 1 頁、Google 地圖沒登入的 5 則），兩個平台以上、合計三則以上才可用。訂房連結逐間在 Trip.com、Agoda 確認。
5. **規格**：版面照 `stay-page.md` 與旭川主頁的結構（開頭 → 住哪一區？ → 依需求挑 → 各區推薦的飯店，每間一個 H3：開頭一句、為什麼選這間、訂房前的注意事項、訂房行 → 三人以上或帶小孩 → 比較表 → 這個地方特有的事，例如住宿稅、入湯稅、冬季休館）。細寫的間數看事實夠不夠，小地方 5 到 8 間就好。底下已有專門頁的（旭川）連過去，不重複寫細節。H1 要包含原本的主要查詢。
6. **動筆前檢查規格** → 7. **作者**（Sonnet 5.5）→ **編輯與句子節奏**（Opus 5.5）
8. **程式檢查**：`check-voice.mjs --final`、`audit_answer_first.py`、`check-benchmark.mjs`。
9. **預驗**（分組標題、同一件事寫法一致、每個搜尋詞有直接答案）。
10. **事實查核**（逐條開官方來源）與 **讀者驗收**（六題，主頁版：能不能決定住哪一區與先看哪幾間、能不能直接去訂、搜尋詞有沒有直接答案、有沒有矛盾、開頭與每節有沒有先帶情境、標題對不對），同時跑，最多退四次。
11. **換上線**：`review.md`、`local-article-gates.mjs`；`studio` 的 `replace-article-body.mjs`（先 dry-run；後台有還沒同步的手動修改就停，照規定不繞過）；標題有改時一併處理；CI；推 `main`；確認線上。封面、文內照片沿用線上的。
12. 在 `content-automation/unattended-summary.md` 加一段。

工作檔放 `content-experiments/stay-rerun-2026-11-18/<地點>/`。
