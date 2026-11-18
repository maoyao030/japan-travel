# wakkanai-stay 驗收後第 1 輪修改（2026-11-01，重寫輪）

以潤稿後的 `draft-tagged.md` 為準，只改 `reader-stage2.md` 指出的地方。標題沒改（diff 與重寫前一致），錨文字「稚內值得去嗎」原句保留、只出現一次，沒有 media。

## 必修

| # | 位置 | 處理 | 依據 |
|---|---|---|---|
| 1 | 搭早班渡輪 H2 第 2、3 段 | 查了 Dormy Inn 交通頁、THE STAY 與 Hotel Saharin 官網交通欄，都只寫到 JR 稚內站的走路時間，沒有到渡輪站的時間。照驗收者的備案，第 2 段開頭加一句「Dormy Inn、THE STAY 與 Saharin 離 JR 稚內站走路 1 到 7 分鐘，從車站走到渡輪站還要約 15 分鐘」，不寫推算的合計分鐘數；表格這三格維持原樣（沒有官方數字）。Dormy Inn 與 Saharin 的日文原名改放到這裡（第一次出現），Saharin 的 H3 拿掉括號 | F169、F171、F174、F42；查核紀錄在 `reference-review.md`「驗收後第 1 輪（2026-11-01）」 |
| 2 | 搭早班渡輪 H2 第 1、3、4 段 | 補研究：Heartland Ferry 官方時刻表 time1，新增 F428。第 1 段改成「4月28日到10月31日 06:30，11月1日到隔年4月27日 06:35」，報到寫「05:50或05:55以前」。早餐比較與冰雪莊送站那兩句也改成「往禮文島的第一班、05:50或05:55前」 | F428、F36、F425、F409 |
| 3 | 各區飯店 H2 表格；訂房管道 H2 第 2 段 | 表格加「營業期間」欄（排在「離車站或港口」與「訂房管道」之間）：Dormy Inn、SURFEEL、THE STAY、Moshiripa、TRUNK、New Chikou 寫冬天也營業（F423）；Miyuki 冬天也營業、有冬季限定方案（F410）；GRAND 12/29～1/4 休館（F411、F423）；Minori 約 11 月底～4 月底休業（F184）；Tom Soya 冬季休業、2027 年 4 月下旬恢復營業（F424）。Saharin、冰雪莊、casa hotel、Meguma、民宿宗谷岬留「—」（查了 Saharin、Meguma 官網，沒有休業或冬季公告）。訂房管道第 2 段刪掉重複表格的清單與 10/27 的查詢紀錄句（同時處理加分 6），只留「Tom Soya 與 Minori 冬天休業」與「沒寫營業期間的那 5 家，冬天要住先選日期看能不能訂」 | F423、F410、F411、F184、F424、F417 |

## 加分

| # | 處理 |
|---|---|
| 1 | 做了：Moshiripa 那句補「訂房網站自己有優惠活動時除外」（F405）。 |
| 2 | 沒做：casa hotel 的電話只有觀光協會頁有，不是旅館本身，表格維持 Trip.com、Agoda。 |
| 3 | 做了：開頭第一次出現渡輪站時寫成「稚內港渡輪總站（稚内港フェリーターミナル）」（F42）。 |
| 4 | 沒做：SURFEEL、Moshiripa 在 H2 與 H3 的重複是分別回答「搭早船」與「這家怎麼樣」，刪掉會讓直接跳到 H3 的讀者少了資訊。 |
| 5 | 做了：TRUNK 那句併進 Saharin 那段，補上訂房管道（F173、F406、F174、F407）。 |
| 6 | 做了（併在必修 3）。 |
| 7 | 沒做：標題不改。 |
| 8 | 不用改。 |

## 檢查

- `fact_tags.py`：tags_clear（事實表 51 筆，正文用到 50 筆；F1 已由 F428 取代，留在事實表）
- `check-voice.mjs`：通過（正文 3665 字）
- `audit_answer_first.py --reference-review`：mechanical_clear（提示 FAQ_MISSING、LONG_JAPANESE_RUN，後者是旅館原名括號）
