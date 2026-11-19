# 驗收紀錄：wakkanai-stay（2026-11-19，舊住宿頁重跑一輪）

- 文章：`content-production/wakkanai-stay/reader-preview.md`（稚內住宿推薦，住稚內站前還是南稚內？）
- SHA-256（換行統一成 LF 後計算）：`306c67332d9f3474687d76263512f3e9e38e393aac1fa6b576c802a844217f3b`
- 規則：`content-experiments/stay-rerun-2026-11-18/RUNBOOK.md`、寫作 Skill `references/stay-page.md`、`sentence-rhythm.md`、`stay-topic-page.md`「自動化」「廢話要在流程裡擋掉」「份量檢查」。舊版封包在 `pre-rerun-2026-11-18/`。
- 研究：`content-experiments/stay-rerun-2026-11-18/wakkanai/` 的 `queries.md`、`facts.md`、`facts-extra.md`、`facts-reviews.md`、`booking-links.md`。住客評論由查核角色的子代理（Opus 5.5）2026-11-19 用瀏覽器讀（Trip.com、4travel、Google 地圖，沒登入）。
- 寫作：規格助手（Opus 5.5）→ 五段各一位作者（Sonnet 5.5）→ 四位分段編輯（Opus 5.5）→ 一位接縫編輯兼句子節奏與份量檢查（Opus 5.5，`seam-notes.md`，細寫六間都判剛好）。
- 事實查核：1 個事實查核子代理（Opus 5.5，沒參與寫作與編輯），3 輪：第 1 輪 124 筆裡 1 筆 incorrect、6 筆 unsupported、1 筆 unreachable；第 2 輪剩 5 筆；第 3 輪 121 筆全部 verified。
- 讀者驗收：讀者驗收子代理（Opus 5.5，沒寫過、沒查核過），七題驗收 2 次（`acceptance1.md` 第 4、5 題不過；`acceptance2.md` 七題都過）。第 2 次之後只照查核改了 TRUNK 兩句、比較表一格與 SURFEEL 連結，由事實查核第 3 輪確認。
- 協調：人工 session（Claude Code），照岔路的預設，沒有問 Darren。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py`） |
| 標題 | `acceptable`（七題第 6 題過） |
| 讀者價值 | `acceptable`（七題都過，含第 7 題份量；退回一次後過關） |
| 事實與條件 | `verified`（`validate-fact-check.mjs` 通過，121 項 claim 全部 verified） |
| 口吻與標點 | `check-voice.mjs --final` 通過（正文約 3,975 字） |
| 名字與表格連結 | `check-benchmark.mjs` 沒有錯誤 |
| 圖片 | 沿用線上的封面與文內照片；細寫的六間各找 1 則 Instagram 貼文 |

**最終結果：`ready_for_user_preview`。** 換掉線上的舊版。

## 協調者的決定

- H1 從「稚內住宿，各區飯店、訂房管道與搭早船住哪區」改成「稚內住宿推薦，住稚內站前還是南稚內？」，仍包含主要查詢「稚內住宿」。
- Hotel Miyuki 改寫成「美雪飯店」（照 2026-11-04 的命名順序，也是台灣讀者搜尋與訂房網站的叫法），譯名表一起改。
- SURFEEL 的溫泉鑽探工期到 2027 年 3 月底、目前沒有大浴場，會影響這一季選不選，照官方公告寫成限制並標年份。
- HOTEL TRUNK 的「端到座位的和食膳早餐」「有沙發床的雙床房」只出現在擋讀取工具的訂房頁，查核者沒辦法重開，拿掉；年底年初訂不到但沒有公告，不寫。
- Hotel Meguma 在 Trip.com 不接受預訂，訂房行不放 Trip.com。
- 國民宿舍冰雪莊官方寫不接受外語，整頁不列；一季的冬季電子券活動不寫。
- 機場巴士照宗谷巴士時刻表寫一天 3 班（飯店官網還寫 1 班）。

## 留給之後的事

- 宗谷巴士機場線時刻表只到 2027-01-31，2 月後重查；渡輪 2027 年時刻表公布後重查第一班時間。
- 稚內市住宿稅 2027-03-01 起加收，生效後把寫法改成現況。
- SURFEEL 新溫泉完工後重寫那一間；HOTEL TRUNK 年底年初的營業 12 月中旬前重查。

## 2026-11-19 補「住客怎麼說」小段

- Darren 看了達門檻卻沒寫進去的住客說法後說「這些都是很棒的資訊啊，可以都放啊」，取消一間一句的上限；每間細寫的旅館多一個「住客怎麼說」小段，官方事實與住客說法分開。紀錄在研究資料夾的 `guest/notes.md`。
- 事實查核（同一位查核子代理，Opus 5.5）逐點對評論紀錄：第 4 輪擋 6 句、第 5 輪擋 1 句（只有一個平台或一兩則的點都拿掉）；最後 158 項全部 verified。
- 讀者驗收沒有重做：只加了住客說法小段，標題、結構、官方事實沒有變。
- 上一版 SHA：`104804622cfb1a1c76eed8f2bdbfe6baeeaf5ed1f52c1bd3691b6775295b78d2`。
- 2026-11-19 補記：Darren 看了段落版後說「列點的清楚一點」，「住客怎麼說」改成一句一條的條列，句子沒改；查核者確認後更新雜湊（上一版 `90cb19c1dc71995b8a84fecd3a8b3836c0fd09c800942875e2b4df0fa24fdf84`）。
