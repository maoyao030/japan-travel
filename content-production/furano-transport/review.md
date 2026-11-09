# furano-transport 驗收紀錄

- 文章：`content-production/furano-transport/reader-preview.md`
- SHA-256：`9d7eec4122844aaf59ef8da24e56f715d88aa5de4fe7a291f09c7b9cf9eff498`
- 輪次：1（首次驗收）
- 驗收日：2026-11-09
- 作者：auto-writer agent
- 驗收者：acceptance agent（非作者）

## 格式

`mechanical_clear`。19 個 `PRICE_TAX_UNCLEAR` 信號；日本交通費用依法含稅（総額表示義務），研究記錄 order-notes.md 已說明。

## 標題

`acceptable`。詳見 `heading-review.json`。

- H1 帶主要查詢，無冒號、無制式摘要
- H 樹無跳級、無重複
- 所有 H2 帶地名
- 次要查詢（旭川到富良野、新千歲到富良野、富良野租車）進 H2/H3
- 問句標題下一段立即回答

## 事實與條件

`not_checked`。詳見 `fact-check.json`。

- 50 項事實主張
- 34 項 verified（從 chuo-bus.co.jp、furanobus.jp/rosen/、jrhokkaidonorikae.com 時刻表、jrhokkaido.co.jp/kitaca 實際查核）
- 0 項 incorrect
- 16 項 unreachable（來源 URL 已搬移或暫時無法存取）

unreachable 的 16 項都在研究期間（2026-11-07）驗證過，但驗收時原 URL 回 404。涵蓋：
- JR 互動式查詢結果（車資、轉車組合）：C10, C11, C14, C16
- JR 全車指定席頁面（已搬移）：C12, C13
- Bus Gorilla Liner（hokkaido-bus.com 改版中）：C17–C20
- Resort Liner（access-n.jp 404）：C21
- North Liner（takubus.com 404）：C41
- Toyota 租車（rent.toyota.co.jp 404）：C45
- 薰衣草特急與慢車號（JR 頁面搬移）：C46, C47
- 薰衣草號票價（PDF，無法讀取）：C50

已驗證的部分覆蓋了文章核心：高速富良野號全部時刻與票價、富良野巴士 5 條路線全部時刻、JR 富良野線 12 班雙向時刻、根室本線 9 班時刻、Kitaca 不適用範圍。

## 讀者價值

`needs_review`。詳見 `reader-stage1.md`。

第一階段模擬兩個情境走完全程，發現 1 項需修改：

**需修改**：薰衣草號回程（富良野→旭川）時刻表的「旭川機場」欄全部是「—」，讀者不確定這代表回程不停旭川機場、還是時間沒列出來。文章上面寫「旭川站、旭川機場都能搭到富良野」，但沒有明確說回程是否停旭川機場。建議加一句說明。

其餘項目（開頭與核心答案、主次與重複、標題、FAQ、口吻與 SEO）全部可接受。

第二階段：
- 研究記錄的缺口（未查到的資訊）都沒有寫進正文，符合規則。
- `fact-check.json` 的 unreachable 項目不影響已驗證的核心時刻表。
- 住宿段落不適用（交通頁）。

## 潤稿比對

`meaning-drift.md`：12 處差異，全部「可以接受」，0 處「不可接受」，0 處「遺失」。

## 主要缺陷

1. 事實查核 16 項 unreachable（來源 URL 搬移），無法在驗收時重新確認
2. 薰衣草號回程是否停旭川機場不夠明確

## 最終結果

**needs_review**

理由：事實查核有 16 項 unreachable（雖然研究期間都已驗證，但驗收時無法獨立確認），加上讀者驗收有 1 項需修改。核心的時刻表與票價資料已從官方來源獨立驗證。

建議下次人工 session 處理：
1. 在薰衣草號回程時刻表旁加一句說明是否停旭川機場
2. 更新延伸資料與資料來源的 URL（多個已 404）
3. 確認 unreachable 項目的事實仍然正確
