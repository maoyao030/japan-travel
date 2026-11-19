# 驗收紀錄：sounkyo-stay（2026-11-18，舊住宿頁重跑一輪）

- 文章：`content-production/sounkyo-stay/reader-preview.md`（層雲峽住宿推薦，住溫泉街還是上川站？）
- SHA-256（換行統一成 LF 後計算）：`e95c88772cff18d1925cddce1301b14840703b6e95c5704e32bbec8c5367311c`
- 規則：`content-experiments/stay-rerun-2026-11-18/RUNBOOK.md`、寫作 Skill `references/stay-page.md`、`sentence-rhythm.md`、`stay-topic-page.md`「自動化」「廢話要在流程裡擋掉」「份量檢查」。舊版封包在 `pre-rerun-2026-11-18/`。
- 研究：`content-experiments/stay-rerun-2026-11-18/sounkyo/` 的 `queries.md`、`facts.md`、`facts-extra.md`、`facts-reviews.md`、`booking-links.md`。住客評論由查核角色的子代理（Opus 5.5）2026-11-18 用瀏覽器讀（Trip.com、4travel、Google 地圖，沒登入）。
- 寫作：五段各一位作者（Sonnet 5.5）→ 四位分段編輯（Opus 5.5）→ 一位接縫編輯兼句子節奏與份量檢查（Opus 5.5，`seam-notes.md`，六間細寫的旅館都判剛好）。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作與編輯），3 輪：第 1 輪 121 筆裡 6 筆 incorrect、2 筆 unsupported、1 筆 not-stated；改完第 2 輪剩 1 筆；第 3 輪全部 verified。
- 讀者驗收：讀者驗收子代理（Opus 5.5，沒寫過、沒查核過），七題驗收 2 次（`acceptance1.md` 七題都過；照查核改 14 處後 `acceptance2.md` 仍七題都過）。
- 協調：人工 session（Claude Code），照岔路的預設，沒有問 Darren。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py`） |
| 標題 | `acceptable`（七題第 6 題過） |
| 讀者價值 | `acceptable`（七題都過，含第 7 題份量） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，121 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文約 4,550 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 圖片 | 沿用線上的封面與文內照片；每間細寫的旅館各找 1 則 Instagram 貼文 |

**最終結果：`ready_for_user_preview`。** 換掉線上的舊版。

## 協調者的決定

- H1 從「層雲峽住宿，溫泉街各旅館的位置、接駁巴士與訂房管道」改成「層雲峽住宿推薦，住溫泉街還是上川站？」，仍包含主要查詢「層雲峽住宿」。
- 巴士時間照經營者道北巴士（上川站約 30 分、旭川約 2 小時），不照飯店交通頁的說法。
- 大雪飯店「房間保養得不錯」只有一個平台，拿掉。
- 湯元銀泉閣冬天營不營業沒有官方來源，不寫；只寫現在官方訂房沒有開放預約。
- 有 5 個來源頁要執行 JavaScript（大雪飯店常見問題、KUMOI 訂房日曆、銀泉閣訂房頁、層雲閣方案列表、Agoda 館名），查核照研究時用瀏覽器讀到的紀錄判定。

## 留給之後的事

- 層雲閣號的出發地、時間與費用官方沒有寫清楚；層雲峽觀光飯店接駁的車資、比較表層雲閣的位置與停車是空格。
- 朝陽亭冬季接駁、冰瀑祭是這一季的資料，下一季重查。

## 2026-11-19 補「住客怎麼說」小段

- Darren 看了達門檻卻沒寫進去的住客說法後說「這些都是很棒的資訊啊，可以都放啊」，取消一間一句的上限；每間細寫的旅館多一個「住客怎麼說」小段，官方事實與住客說法分開。紀錄在研究資料夾的 `guest/notes.md`。
- 事實查核（同一位查核子代理，Opus 5.5）逐點對評論紀錄：擋 3 句（「最多人」說過頭、車位多只有一個平台），另拿掉只靠評論標籤的一句；最後 159 項全部 verified。
- 讀者驗收沒有重做：只加了住客說法小段，標題、結構、官方事實沒有變。
- 上一版 SHA：`fc8054ed51fbf562f9ca99b4ef50c09a3066017a6eea3602a8c5831f574eaf3c`。
