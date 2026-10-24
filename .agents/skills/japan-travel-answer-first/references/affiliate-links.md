# 訂房分潤連結

本站住宿頁的收入主要來自 Trip.com 與 Agoda 的聯盟分潤（讀者透過本站連結訂房，平台付一部分佣金給本站，讀者房價不變）。這份檔案說明 Trip.com 聯盟計畫的規則，以及文章裡怎麼放分潤連結。寫住宿段落、地點主頁的住宿節、或填 `bookingChannels` 時讀。

Agoda 的規則還沒整理，查好後補在本檔「Agoda」一節。

## Trip.com 聯盟計畫的規則

查核日期 2026-10-24。官方說明頁寫明規則會調整，新規則從通知後的下個月生效；申請到帳號後以後台為準，數字有變就改這一節並更新日期。

### 佣金

| 產品 | 佣金 |
|---|---|
| 住宿 | 每月完成 0–199 筆 5%、200–999 筆 6%、1000 筆以上 7% |
| 國際機票 | 0–299 筆 0.5%、300 筆以上 0.8% |
| 機票＋住宿 | 2%–2.5% |
| 火車 | 2% |
| 一日遊、體驗 | 4% |
| 景點門票、表演 | 1.5% |
| 租車、機場接送 | 5% |

- 只算住完的訂單：旅館要退房後才算，取消與沒入住不算。
- 讀者用折扣碼、Trip Coins、禮物卡折掉的部分不算佣金。
- 住宿佣金以含稅金額計算。
- 追蹤期限：第三方聯盟目錄多寫網頁 30 天、App 7 天，以最後一次點擊計算。官方頁沒有寫，申請後以後台為準。

### 付款

- 銀行匯款，幣別選美元或港幣。
- 累積滿 200 美元（或 1,500 港幣）才付，不到就累積到下個月。
- 時程：訂房當月 → 下個月 5 日左右審核 → 再下個月 10 日左右入帳，約 40 到 60 個工作天。
- 收款銀行會扣手續費，實拿比報表少。

### 禁止的推廣方式

- 不買「Trip.com」品牌字或變體的搜尋廣告。
- 不用臉書廣告推分潤連結。
- 不寫成「Ctrip」（Trip.com 的中國品牌名）。
- 本站只靠文章的自然搜尋流量，不買任何廣告推連結。有一個第三方聯盟目錄把「SEO」也列為禁止，官方頁沒有這條；申請時在條款裡確認，確認結果記在 `PROJECT_STATUS.md`。

### 工具

後台的 Link Builder 把任何 Trip.com 網址轉成帶本站帳號編號的追蹤連結。Promotion Center 有熱銷旅館與優惠清單，只當參考，不拿來決定寫哪些旅館；旅館要不要寫，照頁面規格與研究結果。

## 文章裡怎麼放

### 哪些旅館放分潤連結

- 研究時實際在 Trip.com 台灣站（`tw.trip.com`）搜到這間旅館，`bookingChannels` 有 `trip.com`，才放 Trip.com 連結。Agoda 同理。
- 只有官網或 Jalan 能訂的，放官網連結，不收錢。不為了分潤把這類旅館寫得比較不好，也不因為有分潤就把旅館往前排；排法照讀者的需求（位置、班次、含餐）。
- 同一間兩個平台都有，兩個都列，不只放佣金比較高的那個。官網能訂的也照樣列官網。

### 連結寫法

- 連結指向那間旅館自己的 Trip.com 頁，例如 `https://tw.trip.com/hotels/wakkanai-hotel-detail-<編號>/`，不連城市清單頁。
- 帳號還沒申請前，正文先放旅館頁的一般網址。申請到帳號後，上稿前用 Link Builder 換成追蹤連結；換連結不改文字，不算改稿。
- 連結文字寫讀者要做的事：「在 Trip.com 查空房與價格」「Agoda 訂房頁」。不寫「最低價」「最優惠」「限時」這類平台沒保證、本站也查不到的話。
- 價格照旅館官網寫。Trip.com 上看到的房價會依日期變動，不寫進正文當事實。
- 評分與評論數照 [評論與人氣](reviews-and-popularity.md)：寫平台名稱與查核日期。
- 不放折扣碼。折扣碼會讓那部分訂單不算佣金，也常過期。
- 分潤連結屬於讀者要用的連結，放在那間旅館的段落文字裡，不放在 `## 延伸資料` 與 `## 資料來源`。
- 網站的表格（Sanity `contentTable`）格子只能放純文字，放不了連結。住宿表的「訂房管道」格只寫管道名稱（官網、Trip.com、Agoda、僅 Jalan），連結寫在表格下面或該旅館的段落。

### 揭露

- 網站的 [關於頁](../../../../src/pages/about.astro)「訂房連結與合作揭露」與隱私權政策已說明分潤，這是全站的揭露。
- 有分潤連結的文章，在第一個分潤連結所在的段落或表格前，寫一句：「下面的 Trip.com 與 Agoda 連結含有本站的訂房分潤，房價不會因此改變。」平台名稱照這篇實際有的寫，只出現一次，不放在文章開頭，也不每段重複。（2026-10-24 暫定，Darren 可改）
- 網站對 `trip.com` 與 `agoda.com` 的連結自動加上 `rel="sponsored"`（告訴搜尋引擎這是有收錢的連結，Google 要求這樣標），程式在 `src/lib/portableText.ts`，寫作時不用另外處理。

## Agoda

尚未整理。查好後依上面同樣的格式補：佣金、付款門檻、禁止方式、工具。

## 資料來源

- [Trip.com Affiliate Program: How to Join and Earn Commission](https://www.trip.com/ask/questions/trip.com-affliate-program.html)（官方說明，2026-10-24）
- [Trip.com Partners](https://www.trip.com/partners/index)（官方申請頁，2026-10-24）
- [Cuelinks: Trip affiliate program](https://www.cuelinks.com/campaigns/trip-affiliate-program)（第三方，追蹤期限與禁止方式）
- [Ecomobi: Trip.com](https://ecomobi.com/?p=24575)（第三方，Ctrip 名稱限制）
- [Involve Asia: Trip.com Global CPS](https://blog.involve.asia/new-advertisers/trip-com-global-cps-app-web-affiliate-program-live-involve-asia)（第三方）
