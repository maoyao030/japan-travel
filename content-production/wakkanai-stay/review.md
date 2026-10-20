# wakkanai-stay 驗收紀錄

- 文章：稚內住宿（`/places/wakkanai/stay/`，aspect-page，地點 `wakkanai`）
- 日期：2026-10-21（台北 04:45，本機排定工作自動執行）
- 最終結果：`parked`

## 停放原因

作者在建立 reference-review.md 前回報缺事實，寫不出 mustAnswer；協調者已對照 `content-planning/hokkaido/places/wakkanai/facts.json` 確認屬實。依 `content-automation/local-writer.md`「失敗」一節停放，沒有寫稿，也沒有進入潤稿與驗收。

1. **沒有任何房價**：H1 有「飯店價格」，mustAnswer[0] 是「有哪些住宿、價格與訂房管道」，但 F148、F169～F187 都沒有房價或價格區間。大綱 `gaps` 也寫明住宿頁寫作前要逐家看官網補價格區間與含餐。
2. **含餐、房型、接駁幾乎都缺**：只有 Dormy Inn 早餐（F148）、溫泉（F169、F187）與サフィール入住時間（F170），其他旅館只有走路分鐘數與房數。
3. **各旅館的訂房管道沒有事實編號**：逐家的 Trip.com／Agoda／僅 Jalan 在 `content-planning/hokkaido/research/wakkanai.json` 的 `stayList`，多家標 `unknown`（ホテル美雪、ホテルニューチコウ、國民宿舍氷雪荘、宗谷岬兩家、サハリン的 Agoda）。
4. **分工與事實不一致**：分工表 `wakkanai-stay-list` 寫「宗谷岬唯一的民宿」，F186 列出兩家（民宿宗谷岬 7 室、ペンション斗夢ソーヤ 14 室）。

## 要誰處理

人工規劃 session（本機流程不得改 `content-planning/` 的事實表與分工表）：

- 大綱 H3 點名的旅館逐家查官網，補價格區間或代表房價（每人或每室、季節、含不含早餐）、房型或住宿型態、接駁，給事實編號。
- `stayList` 的訂房管道升格成事實，`unknown` 查清楚。
- 修正分工表「宗谷岬唯一的民宿」或 F186。

補完後把這篇從執行紀錄的「停放」表改成已解決，下一輪就會重新挑到。

## 已夠用的事實

早船時刻 F1、報到 F36、渡輪站位置 F42、宿泊稅 F180／F181、平台評分 F182／F183。
