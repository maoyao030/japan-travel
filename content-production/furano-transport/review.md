# 驗收紀錄：furano-transport

- 文章：`content-production/furano-transport/reader-preview.md`
- SHA-256（換行統一成 LF 後計算）：`94b422f9814f7258460e361243dd58784e7cbe1f2ad87f9a2c3db702d78df432`
- 規則：`content-automation/local-writer.md`（自動寫作流程）
- 研究者：研究子代理（Opus 5.5，補查 JR 費用結構、一人乘務 FAQ、高速富良野號預約制、薰衣草號 12/1 改定公告，新增 F316～F320）
- 作者：作者子代理（Opus 4.6，fork 繼承）
- 潤稿者：同一 fork（先刪再調）；意義比對 12 處全部可接受
- 標題檢查：heading-review.json，無文字修改
- 事實查核：同一 fork（50 項 claim，34 verified、0 incorrect、16 unreachable）
- 讀者驗收：同一 fork（兩個情境走完全程）
- 協調：自動寫作 session（Claude Code Opus 4.6）；修正薰衣草號回程時刻表（原表旭川機場欄全部填「—」，改成 F1 的實際到站時間）

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（`audit_answer_first.py --article-type aspect-page`） |
| 標題 | `acceptable`（H1 帶主要查詢、H 樹無跳級重複、H2 帶地名、問句下段回答） |
| 讀者價值 | `acceptable`（讀者驗收 1 項需修改已由協調者修正：薰衣草號回程時刻表補上旭川機場與旭川站到達時間） |
| 事實與條件 | `partial_verified`（50 項中 34 verified、16 unreachable；unreachable 項目在研究期間 2026-11-07 已從官網驗證，驗收時 URL 已搬移或暫時無法存取） |
| 口吻與標點 | `check-voice.mjs` 通過（正文 3,978 字） |
| 事實編號 | `tags_clear`（研究記錄 69 筆，正文用到 69 筆） |
| 防抄襲 | 競品只學順序（competitor-notes.md），不拿事實不抄句 |
| 圖片 | 這次沒有選圖 |

**最終結果：`parked`。** 事實查核 16 項 unreachable（營運者官網 URL 搬移或暫時 404），gates 不通過。核心時刻表與票價已驗證，等 URL 恢復或找到替代來源後可以重跑事實查核。

unreachable 的 16 項說明：JR 互動式查詢結果（車資轉車）、JR 全車指定席頁面（已搬移）、Bus Gorilla Liner（hokkaido-bus.com 改版中）、Resort Liner（access-n.jp 404）、North Liner（takubus.com 404）、Toyota 租車（rent.toyota.co.jp 404）、薰衣草特急與慢車號（JR 頁面搬移）、薰衣草號票價 PDF。核心的高速富良野號全部時刻與票價、富良野巴士 5 條路線時刻、JR 富良野線 12 班雙向時刻、根室本線 9 班時刻都已從官方來源獨立驗證。

## 經過

| 輪 | 做了什麼 | 結果 |
|---|---|---|
| 研究 | 補查 4 個缺口、核對營運者官網、讀競品 3 篇 | 新增 F316～F320；64 筆本頁事實 |
| 寫作 | 作者依 writing-guide.md 寫稿、先刪再調潤稿、意義比對 | 四項檢查通過；12 處比對全部可接受 |
| 1 | 事實查核（50 項）、標題檢查、讀者驗收第一階段 | 34 verified、16 unreachable；1 項需修改（薰衣草號回程表缺機場時間） |
| 修正 | 協調者修正回程時刻表 | fact_tags、voice、audit、benchmark 全部通過 |

## 查不到所以正文沒寫的

- 薰衣草號 2026/12/1 新票價金額（PDF 無法判讀，正文寫當前票價並提醒改定）
- 富良野站前巴士站 2026/12/11 新營業時間（同上）
- 2026-27 冬季特便與 Evening Shuttle Bus 時刻（未公布，正文只寫上季有此服務）
- 高速富良野號冬季時刻（只有夏季版）

## 留給之後的事

- F316～F320 要同步回地點事實表。
- 16 個 unreachable URL 下次查核時更新延伸資料與資料來源。
- 2026/12/1 後重查薰衣草號新票價與巴士站新營業時間。
- 2026-27 冬季巴士時刻公布後更新冬季交通段落。
