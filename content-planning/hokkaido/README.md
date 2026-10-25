# 北海道：稚內、宗谷岬、利尻島、禮文島選題（2026-10-16，第 2 版）

第 2 版改用「地點 × 主題」：每個地點有一個主頁，主題各自成頁。只要官方查得到資料就成頁，搜尋量只決定先後。第 1 版的 6 頁規劃已作廢。

## 檔案

- `page-specs.json`：頁面規格。26 頁保留，3 頁排除，1 頁延後。
- `candidates.json`：每頁的關鍵字證據，給文章清單驗證用。
- `keywords-2026-10-16.json`：三地所有組合詞與搜尋量，0 量的也保留。
- `discoveries.json`：研究時找到的祭典、花火、料理、步道與季節現象，共 24 項，附官方來源。

## 地點 × 主題總表

格子裡是優先順序（1 最先寫），「—」是不成頁。

| 地點 | 主頁 | 交通 | 住宿 | 步道與登山 | 景點 | 美食 | 祭典 | 天氣與季節 |
|---|---|---|---|---|---|---|---|---|
| 稚內 | 1 | 2 | 3 | — | 4 | 8 | 9 | 5 |
| 宗谷岬 | 2 | 3 | — | — | 主頁涵蓋 | 主頁涵蓋 | 主頁涵蓋 | 併入稚內 |
| 禮文島 | 4 | 5 | 5 | 6 | 8 | 11 | 11 | 9 |
| 利尻島 | 6 | 7 | 8 | 7 | 9 | 10 | 11 | 10 |

三地之間的渡輪另成一頁 `/places/wakkanai/ferry/`（順序 2），各地交通頁連過去，不重複寫訂票步驟。

## 正式大綱（2026-10-18）

- 大綱：`hokkaido-wakkanai-outline.json`（24 頁、312 個標題，每個標題附事實編號；分工表、內連表與連結句、寫作順序、官方景點比對、體驗與文化線索、媒體計畫、缺口）。
- 地點事實表：`places/<地點>/facts.json`（稚內 187、宗谷岬 97、利尻島 184、禮文島 280 筆）。
- 研究紀錄：`research/<地點>.json`（景點比對、體驗線索、客觀狀況、住宿清單、缺口）與 `research/<地點>-headings.json`（研究者對好事實的標題）。
- 標題順序（2026-10-18）：照旅客動線排，見選題 Skill `references/selection-workflow.md` 第6節。重排過的頁在大綱裡標 `headingOrder: traveler-journey`。`build-outline.mjs` 是研究前產生骨架用的，大綱現在以 JSON 為準，不要重跑它覆蓋。
- 研究後併頁：禮文島天氣（9 筆）與禮文島祭典（5 筆）事實少於 15 筆，併進禮文島主頁。其餘 24 頁都超過門檻。

## 已核准的 26 頁（Darren 2026-10-18）

月搜尋量來自 Ahrefs 台灣資料庫。「測不到」是 Ahrefs 沒有這個詞的資料，照樣成頁。

| 順序 | 頁面 | 主題 | 網址 | 主要查詢 | 月搜尋量 |
|---|---|---|---|---|---|
| 1 | 稚內 | 主頁 | `/places/wakkanai/` | 稚內 | 1,100 |
| 2 | 宗谷岬 | 主頁 | `/places/cape-soya/` | 宗谷岬 | 200 |
| 2 | 稚內、利尻、禮文渡輪 | 渡輪 | `/places/wakkanai/ferry/` | 稚內到利尻島 | 10 |
| 2 | 稚內交通 | 交通 | `/places/wakkanai/transport/` | 稚內交通 | 20 |
| 3 | 宗谷岬交通 | 交通 | `/places/cape-soya/transport/` | 宗谷岬交通 | 10 |
| 3 | 稚內住宿 | 住宿 | `/places/wakkanai/stay/` | 稚內住宿 | 30 |
| 4 | 禮文島 | 主頁 | `/places/rebun-island/` | 禮文島 | 400 |
| 4 | 稚內景點 | 景點 | `/places/wakkanai/sights/` | 稚內景點 | 200 |
| 5 | 禮文島住宿 | 住宿 | `/places/rebun-island/stay/` | 禮文島住宿 | 20 |
| 5 | 禮文島交通 | 交通 | `/places/rebun-island/transport/` | 禮文島交通 | 10 |
| 5 | 稚內天氣 | 天氣與季節 | `/places/wakkanai/weather/` | 稚內天氣 | 250 |
| 6 | 禮文島步道與花季 | 步道與登山 | `/places/rebun-island/hiking/` | 禮文島健行 | 測不到 |
| 6 | 利尻島 | 主頁 | `/places/rishiri-island/` | 利尻島 | 600 |
| 7 | 利尻山登山 | 步道與登山 | `/places/rishiri-island/hiking/` | 利尻山 | 40 |
| 7 | 利尻島交通 | 交通 | `/places/rishiri-island/transport/` | 利尻島交通 | 30 |
| 8 | 禮文島景點 | 景點 | `/places/rebun-island/sights/` | 禮文島景點 | 測不到 |
| 8 | 利尻島住宿 | 住宿 | `/places/rishiri-island/stay/` | 利尻島住宿 | 測不到 |
| 8 | 稚內美食 | 美食 | `/places/wakkanai/food/` | 稚內美食 | 20 |
| 9 | 禮文島天氣 | 天氣與季節 | `/places/rebun-island/weather/` | 禮文島天氣 | 30 |
| 9 | 利尻島景點 | 景點 | `/places/rishiri-island/sights/` | 利尻島景點 | 10 |
| 9 | 稚內祭典與冬季活動 | 祭典 | `/places/wakkanai/festival/` | 稚內 祭典 | 測不到 |
| 10 | 利尻島美食 | 美食 | `/places/rishiri-island/food/` | 利尻島美食 | 測不到 |
| 10 | 利尻島天氣 | 天氣與季節 | `/places/rishiri-island/weather/` | 利尻島天氣 | 30 |
| 11 | 禮文島祭典 | 祭典 | `/places/rebun-island/festival/` | 禮文島祭典 | 測不到 |
| 11 | 禮文島美食 | 美食 | `/places/rebun-island/food/` | 禮文島美食 | 測不到 |
| 11 | 利尻島祭典 | 祭典 | `/places/rishiri-island/festival/` | 利尻島祭典 | 測不到 |

排序的理由：

- 稚內是另外三處的出入口，稚內主頁、交通與渡輪最先寫，其他頁都要連過去。
- 宗谷岬冬天也能去，趕得上今年冬季的搜尋。
- 禮文島已有 126 筆查證過的事實（`content-production/rebun-island/reference-review.md`），排在利尻島前面。
- 兩個島的旺季在 6～8 月，明年春天前上線即可。

## 不成頁的題目

| 題目 | 處理 | 理由 |
|---|---|---|
| 宗谷岬住宿 | 排除 | 官方住宿清單在宗谷岬只看到民宿宗谷岬一家；研究時確認，若只有一家就寫進稚內住宿頁。 |
| 宗谷岬天氣 | 排除 | 宗谷岬沒有自己的氣象廳平年值，和稚內天氣頁共用。 |
| 利尻昆布 | 排除 | 搜尋結果幾乎都是染髮劑。 |
| 整理券巴士教學 | 延後 | 讀者是去過日本自由行的人，整理券屬於一般常識；等其他地區也需要時再評估。 |

宗谷岬的景點、美食與祭典內容少，寫在宗谷岬主頁裡。

## 進文章清單前要處理

- 多數主要查詢還沒在台灣 Google 看過搜尋結果頁（`serpIntentConfirmed: false`）。
- Sanity 要先建立北海道地區 Hub（草稿即可），供地點填所屬地區。
- 核准的地點要加進 `src/data/categories.ts` 的 `topics`。
- 文章清單一個批次對一個父 Hub，但目前驗證程式要求每個批次的 `plannedPageCount` 等於整份規格的保留頁數。這份規格涵蓋 4 個主頁，建批次時要先決定拆檔或調整驗證程式。

## 寫作時要查清楚的矛盾與缺口

- 渡輪二等自由席：2024-12-01 起可網路預約，「よくあるご質問」的舊說法已過時（禮文島研究已確認）。
- JR 特急宗谷全車指定席的生效日期只有第二手資料。
- 宗谷巴士能不能刷 IC 卡，官網沒寫。
- 稚內到庫頁島航線停航只有第二手資料。
- 桃岩登山口巴士站不在宗谷巴士路線圖上，要向禮文營業所（0163-86-1020）確認。

# 旭川・大雪群（2026-10-26）

北海道第二群，旭川、東川、旭岳、層雲峽 4 個地點（群編號 `hokkaido-asahikawa`）。照選題 Skill `references/next-group.md` 自動選出，選群理由見 `next-group-2026-10-26.md`。Darren 2026-10-26 同意這群大綱通過檢查就直接寫，不等 3 天默許，只限這一次（`AGENTS.md` 最後一段）。

## 檔案

- 大綱：`hokkaido-asahikawa-outline.json`（21 頁、232 個標題，每個標題附事實編號；分工表 32 件事、內連表 103 條附連結句、寫作順序、官方景點比對、體驗線索、媒體計畫、併頁決定、例外 `exceptions`、跨群關聯 `crossGroup`、回頭補 `backfill`）。
- 頁面規格：`page-specs.json` 裡 `travelGroupId: hokkaido-asahikawa` 的項目（21 頁保留、10 頁併進主頁、1 頁不做）；每頁有 `place` 欄位（鄰近地點、出入口）與 `researchBeforeWriting`（寫作前要補的研究）。
- 關鍵字證據：`candidates.json` 同一批 articleId，來源是 `autocomplete-2026-10-26.json` 的 Google 自動完成，`ahrefsVerified: false`，搜尋結果頁還沒在台灣節點看過（`serpIntentConfirmed: false`）。
- 地點事實表：`places/<地點>/facts.json`（旭川 150、東川 103、旭岳 162、層雲峽 195 筆，含缺口）；研究紀錄：`research/<地點>.json`。
- 全站地點清單 `../places.json` 登記四地與這一群，另登記上川（併入層雲峽）、天人峽（併入旭岳）與群外的美瑛、富良野、阿寒湖、網走候選；全站分工表 `../ownership.json` 登記這群的事與已上線的稚內交通頁（旭川到稚內）。
- 給 Darren 的白話摘要：`asahikawa-outline-summary-2026-10-26.md`。

## 頁面（照寫作順序）

「補研究」標「要」的頁，作者動筆前研究者要先補 `researchBeforeWriting` 列的事實。

| 順序 | 頁面 | 主題 | 網址 | 主要查詢 | 補研究 |
|---|---|---|---|---|---|
| 1 | 層雲峽交通 | 交通 | `/places/sounkyo/transport/` | 層雲峽交通 | 要 |
| 2 | 旭川交通（機場到車站、札幌到旭川） | 交通 | `/places/asahikawa/transport/` | 旭川機場到旭川車站 | 要 |
| 3 | 旭山動物園 | 景點頁 | `/places/asahikawa/asahiyama-zoo/` | 旭山動物園 | 要 |
| 4 | 旭川住宿 | 住宿 | `/places/asahikawa/stay/` | 旭川住宿 | 要（必做） |
| 5 | 旭岳交通 | 交通 | `/places/asahidake/transport/` | 旭岳交通 | 要 |
| 6 | 層雲峽纜車與黑岳登山 | 步道與登山 | `/places/sounkyo/hiking/` | 層雲峽纜車 | 要 |
| 7 | 旭岳纜車與姿見の池 | 景點頁 | `/places/asahidake/ropeway/` | 旭岳纜車 | 要 |
| 8 | 旭川景點 | 景點 | `/places/asahikawa/sights/` | 旭川景點 | 要 |
| 9 | 層雲峽冰瀑祭 | 祭典 | `/places/sounkyo/festival/` | 層雲峽冰瀑祭 | 要 |
| 10 | 層雲峽天氣與楓葉 | 天氣與季節 | `/places/sounkyo/weather/` | 層雲峽天氣 | |
| 11 | 旭岳與層雲峽怎麼選 | 跨地點 | `/places/asahidake/asahidake-or-sounkyo/` | 旭岳與層雲峽 | 要（必做） |
| 12 | 旭川美食 | 美食 | `/places/asahikawa/food/` | 旭川美食 | 要 |
| 13 | 層雲峽住宿 | 住宿 | `/places/sounkyo/stay/` | 層雲峽住宿 | 要（必做） |
| 14 | 旭岳登山 | 步道與登山 | `/places/asahidake/hiking/` | 旭岳登山 | |
| 15 | 旭岳溫泉住宿 | 住宿 | `/places/asahidake/stay/` | 旭岳溫泉住宿 | 要（必做） |
| 16 | 旭川天氣 | 天氣與季節 | `/places/asahikawa/weather/` | 旭川天氣 | 要（必做） |
| 17 | 層雲峽景點 | 景點 | `/places/sounkyo/sights/` | 層雲峽景點 | 要 |
| 18 | 旭川 | 主頁 | `/places/asahikawa/` | 旭川 | 要 |
| 19 | 層雲峽 | 主頁 | `/places/sounkyo/` | 層雲峽 | |
| 20 | 旭岳 | 主頁 | `/places/asahidake/` | 旭岳 | |
| 21 | 東川町 | 主頁 | `/places/higashikawa/` | 東川町景點 | 要（必做） |

寫作順序照「被最多頁連到的先寫」，地點主頁放最後。

## 併進主頁、不做的題目

| 題目 | 處理 | 理由 |
|---|---|---|
| 旭川祭典 | 併進旭川主頁 | 9 筆；2027 冬まつり細節 12 月才公布，達 15 筆再拆 |
| 層雲峽美食 | 併進層雲峽主頁 | 13 筆 |
| 旭岳天氣、景點、美食 | 併進旭岳主頁 | 天氣 5 筆、天人峽 14 筆、吃飯的地方只有纜車站與一間便利商店 |
| 東川交通、景點、美食、住宿、祭典 | 併進東川主頁 | 都不到 15 筆，或來源還沒用官方核對 |
| 旭川登山 | 不做 | 市區沒有登山主題，嵐山散步路寫進旭川景點 |

## 例外（給 Darren 之後看）

- 滑雪是新主題：不開滑雪頁，寫成旭岳主頁、層雲峽纜車與黑岳登山、旭川景點、東川主頁的一節。
- 旭山動物園、旭岳纜車與姿見の池升格成景點頁（兩條條件都過）。
- 旭川住宿（9 筆）與旭川天氣（14 筆）不到門檻，保留但寫作前補研究，補不到就停放。
- 跨地點頁「旭岳與層雲峽怎麼選」只有日文需求詞。
- 競爭比稚內群高很多（LIVE JAPAN、Funliday、japan.travel 繁中版）。

## 跨群關聯

- 旭川到稚內：已上線的稚內交通頁負責（全站分工表 `wakkanai-access`），旭川交通頁與旭川主頁只摘要並連過去。
- 回頭補：旭川交通、旭川主頁上線後，routine 在稚內交通頁、稚內主頁結尾加連結（大綱 `backfill`）。
- 旭川往美瑛、富良野：之後的富良野・美瑛群的交通頁負責；層雲峽往阿寒湖、北見：道東群上線前由層雲峽交通頁負責。
- 北海道地區 Hub 文案目前只寫稚內群，旭川群上線前要由人工 session 改。

## 讀不到的官方網站

- 道北巴士 `dohokubus.com`（層雲峽 81 號、機場直達巴士、旭川端乘車處）：讀取工具與瀏覽器都連不上，層雲峽時刻表用 Internet Archive 存檔。
- 旭川觀光コンベンション協會 `atca.jp`：資安維護暫停公開，重開日未定。
- 旭川電氣軌道往東川的時刻表 PDF（圖片太小）、旭岳遊客中心的散策路與滑雪路線地圖 PDF（圖片）、大雪森のガーデン官網（維護中）、JR イン旭川官網（DNS 查不到）、東川ミーツ（驗證碼，不繞過）、Agoda 列表（要執行 JavaScript）。
