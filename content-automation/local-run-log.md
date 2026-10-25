# 本機自動寫作執行紀錄

流程見 `content-automation/local-writer.md`。每輪結束時更新：「最新一輪」整段覆寫，「停放」更新或新增列，「紀錄」第一列插入本輪。

## 最新一輪

- 台北時間：2026-10-26 01:44 開始，01:56 結束（排定工作自動執行，01:42 輪）
- 文章：無（寫作**略過**：稚內群已全部寫完或停放，停放 4 篇待人工處理）
- 上傳：**`rishiri-island` 已上線**（`hub-landing`：CI 通過後掛成利尻島 Hub 入口文章，再開放索引；Hub 原本已開放索引，不用 release-index）；上線前接好 7 個內連；CI 與 `npm test` 都通過後推 `main`
- D1 原本沒有紀錄，先 `start` 再 `accepted`，有設 `MSYS_NO_PATHCONV`
- 封面由選圖子代理選（只選封面），裁切後親自看過：從禮文島隔海拍的利尻島與利尻山全景
- 補內連：5 個全部補上（利尻島登山、景點、住宿、天氣、美食五頁連到主頁「利尻島值得去嗎」，link 33、36、38、40、42），CI 通過後標 linked
- 開始時確認 `/places/rishiri-island/weather/`、`/places/rishiri-island/food/` 都是 200
- 用量：5 小時額度 9% → 17%；每週額度 63% → 64%
- commit：上線封包 `7e8ae37`（已推 `main`），本紀錄見 `git log`
- 下一輪預期文章：寫作仍會略過；上傳也沒有可上的（稚內群可上傳的都上完，剩停放 4 篇與上傳停放 1 篇待人工處理）
- 下一輪開始時確認 `/places/rishiri-island/` 是 200

## 停放

| 文章 ID | 日期 | 原因 | 狀態 |
|---|---|---|---|
| wakkanai-stay | 2026-10-21 | 事實表缺房價、含餐、房型與逐家訂房管道；分工表「宗谷岬唯一的民宿」與 F186 兩家不符 | 待人工規劃 session 補事實並修分工表 |
| wakkanai-festival | 2026-10-22 | 大綱指定內連句「活動期間市區住宿容易客滿」沒有官方來源（fact-check C35 unsupported）；其他驗收都過 | 待人工規劃 session 改大綱這句內連句（或找到官方來源），再複查 C35、C43 即可 |
| rishiri-island-festival | 2026-10-25 | 大綱指定內連句「祭典當晚島上住宿容易客滿」沒有官方來源（fact-check C55 unsupported；官方只有りしぷら reserve/error 頁「夏季は毎年大変な混雑」）；其他驗收都過（93 項中 92 verified、讀者 acceptable） | 待人工規劃 session 改大綱這句內連句（建議改成以夏季為主詞，和 wakkanai-festival、rebun-island 一起處理），再複查 C55 即可 |
| rebun-island | 2026-10-24 | 大綱指定內連句「活動期間島上住宿容易客滿」沒有官方來源（fact-check C43 unsupported）；其他驗收都過（97 項中 96 verified、讀者 acceptable） | 待人工規劃 session 改大綱這句內連句（建議和 wakkanai-festival 一起處理），再複查 C43 即可 |

## 上傳

| 台北時間 | 文章 ID | 結果 | 網址 | 停在哪一點與原因 | 封面來源與授權 |
|---|---|---|---|---|---|
| 2026-10-26 01:52（自動） | rishiri-island | 已上線 | https://offpathnotes.com/places/rishiri-island/ | —（掛成利尻島 Hub 入口文章） | 維基共享資源 Rishiri Island 20140814.jpg（從禮文島隔海拍的利尻島），Suicasmo，CC BY-SA 4.0 |
| 2026-10-25 22:52（自動） | rishiri-island-food | 已上線 | https://offpathnotes.com/places/rishiri-island/food/ | — | 維基共享資源 Rishiri 046 30092006.JPG（利尻島沓形一帶曬昆布），Dmitry Petelin，Public domain（PD-self） |
| 2026-10-25 22:52（自動） | rishiri-island-weather | 已上線 | https://offpathnotes.com/places/rishiri-island/weather/ | — | 維基共享資源 Mt Rishiri.jpg（6 月殘雪的利尻山），Japanexperterna.se，CC BY-SA 3.0 |
| 2026-10-25 20:57（自動） | rishiri-island-stay | 已上線 | https://offpathnotes.com/places/rishiri-island/stay/ | — | 維基共享資源 130726 Oshidomari Port in Rishiri Island Hokkaido Japan08n.jpg（鴛泊港與 Peshi 岬），663highland，CC BY 2.5 |
| 2026-10-25 20:52（自動） | rishiri-island-sights | 已上線 | https://offpathnotes.com/places/rishiri-island/sights/ | — | 維基共享資源 姫沼からの利尻山.jpg，Koda6029，CC BY-SA 4.0 |
| 2026-10-25 17:56（自動） | rebun-island-food | 已上線 | https://offpathnotes.com/places/rebun-island/food/ | — | 維基共享資源 Grilled Fish HokkeChanChanYaki.jpg（禮文島花魚鏘鏘燒），サフィル，CC BY-SA 4.0 |
| 2026-10-25 17:52（自動） | rishiri-island-hiking | 已上線 | https://offpathnotes.com/places/rishiri-island/hiking/ | — | 維基共享資源 Mt. Rishiri summit (52357470229).jpg，Raita Futo，CC BY 2.0 |
| 2026-10-25 13:54（自動） | rebun-island-sights | 已上線 | https://offpathnotes.com/places/rebun-island/sights/ | — | 維基共享資源 Rebun 20140725 110632.jpg（澄海岬），Ka23 13，CC BY-SA 4.0 |
| 2026-10-25 13:50（自動） | rebun-island-hiking | 已上線 | https://offpathnotes.com/places/rebun-island/hiking/ | — | 維基共享資源 Rebun island (52357580650).jpg，Raita Futo，CC BY 2.0 |
| 2026-10-25 10:55（自動） | rebun-island-stay | 已上線 | https://offpathnotes.com/places/rebun-island/stay/ | —（先新建禮文島 Hub，上線後開放 Hub 索引） | 維基共享資源 Rebun's Momoiwa (52357581315).jpg，Raita Futo，CC BY 2.0 |
| 2026-10-25 10:50（自動） | wakkanai | 已上線 | https://offpathnotes.com/places/wakkanai/ | —（掛成稚內 Hub 入口文章） | 維基共享資源 Wakkanai_harbor.JPG，100yen，CC BY-SA 3.0 |
| 2026-10-25 10:46（自動） | rebun-island-transport | 上傳停放 | — | 第 2 點挑文章：缺 `publication.json`，gates 不過 | — |
| 2026-10-25 07:40（自動） | cape-soya | 已上線 | https://offpathnotes.com/places/cape-soya/ | —（掛成宗谷岬 Hub 入口文章） | 維基共享資源 The northernmost point of Japan monument in Soya cape.jpg，Suicasmo，CC BY-SA 4.0 |
| 2026-10-25 07:30（自動） | wakkanai-food | 已上線 | https://offpathnotes.com/places/wakkanai/food/ | — | 維基共享資源 Takoshabu.jpg，Totti，CC BY-SA 4.0 |
| 2026-10-25 05:58（自動） | wakkanai-food、cape-soya | 失敗（沒開始） | — | 第 3 點第 1 步 D1：wrangler 登入失效（7403），沒碰 Sanity、沒開放索引 | — |
| 2026-10-25 02:40（自動） | wakkanai-sights | 已上線 | https://offpathnotes.com/places/wakkanai/sights/ | — | 維基共享資源 Wakkanai_Breakwater_Dome_20140813-2.jpg，Suicasmo，CC BY-SA 4.0 |
| 2026-10-25 02:30（自動） | cape-soya-transport | 已上線 | https://offpathnotes.com/places/cape-soya/transport/ | —（先新建宗谷岬 Hub，上線後開放 Hub 索引） | 維基共享資源 Cape-Soya(Soyamisaki)Busstop.jpg，特急東海，CC BY-SA 4.0 |

## 上傳停放

| 文章 ID | 日期 | 原因 | 狀態 |
|---|---|---|---|
| rebun-island-transport | 2026-10-25 | 2026-10-20 人工流程的舊稿，沒有 `publication.json`（也沒有潤稿紀錄），`local-article-gates.mjs` 無法通過 | 待人工 session 補 `publication.json` 並確認 `gates_clear` |

## 紀錄

| 台北時間 | 文章 ID | 結果 | 事實查核輪數 | 5 小時額度變化 | 待同步的事實 |
|---|---|---|---|---|---|
| 2026-10-26 01:56（自動） | — | 略過（稚內群已全部寫完） | — | 9% → 17% | 無；上傳 rishiri-island，補內連 5 個 |
| 2026-10-25 22:57（自動） | — | 略過（稚內群已全部寫完） | — | 0% → 2% | 無；上傳 rishiri-island-weather、rishiri-island-food |
| 2026-10-25 21:02（自動） | — | 略過（稚內群已全部寫完） | — | 33% → 42% | 無；上傳 rishiri-island-sights、rishiri-island-stay，補內連 1 個 |
| 2026-10-25 17:58（自動） | — | 略過（稚內群已全部寫完） | — | 11% → 14% | 無；上傳 rishiri-island-hiking、rebun-island-food |
| 2026-10-25 14:00（自動） | — | 略過（稚內群已全部寫完） | — | 4% → 6% | 無；上傳 rebun-island-hiking、rebun-island-sights |
| 2026-10-25 11:00（自動） | — | 略過（稚內群已全部寫完） | — | 16% → 18% | 無；上傳 wakkanai、rebun-island-stay |
| 2026-10-25 07:50（自動） | rishiri-island | 完成 | 2 | 0% → 13% | 利尻島新增 F185～F194（稚內⇄鴛泊各季船班、鴛泊⇄香深與沓形⇄香深船班、臨時船最多 2 班、觀光巴士 A 路線 5 月 8:35／11:45、往機場空港巴士只有沓形 13:15、路線巴士 B 13:00 鴛泊→13:20 機場→13:40 沓形；與其他利尻島文章撞號，同步時重編）、更正 F5（鴛泊航線 45 分）、F16（A 路線起點利尻營業所）、F18（環島 1 小時 45 分～2 小時 16 分）、F82（全年營業 13 家）；觀光協會登山頁攜帶式廁所仍寫 400 圓；ANA 時刻待改對官網；譯名待同步（姬沼、Otatomari沼、Peshi岬、Kamui Terrace、利尻雛罌粟）；上傳 wakkanai-food、cape-soya |
| 2026-10-25 06:00（自動） | rishiri-island-festival | 停放 | 2 | 13% → 24% | 利尻島新增 F185～F191（鴛泊會場每年 8/3、2024 與 2026 煙火 8/4、2026 鬼脇節目表、夏季末班巴士、Heartland Ferry 香深–沓形與鴛泊末班；與其他利尻島文章撞號，同步時重編）、更正 F150（北見冨士神社在沓形）、F153、F155、F156（雨延日）、F162（利尻富士町港內）；譯名待同步（北海島祭、利尻浮島祭、港口啤酒花園、海膽祭等；馬拉松日文名兩種寫法）；上傳因 wrangler 登入失效沒做 |
| 2026-10-25 02:48（自動） | rishiri-island-food | 完成 | 3 | 0% → 13% | 利尻島新增 F185～F191（神居海岸公園所在地、利尻富士溫泉在鴛泊栄町步行約 10 分鐘、磯焼亭時間※変更あり、丸善／さとう食堂／磯焼亭／ふる里食堂〔夏〕有海膽丼；與其他利尻島文章撞號，同步時重編）；譯名待同步（鴛泊港渡輪站、沓形港渡輪站、Satou食堂、蕎麥福、丸井食堂、Milpis商店、利尻故鄉食堂、利尻漁協商店、島之驛利尻 海藻之里、兩個祭典名）；大綱 H3「鴛泊渡輪站周邊的食堂」待改；島之驛營業時間官網與りしぷら不一致待重查；缺海膽種苗生產中心事實 |
| 2026-10-24 21:25（自動） | rishiri-island-weather | 完成 | 3 | 0% → 13% | 利尻島新增 F185～F187（島の四季 12 月積了又融、沓形在島西岸、氣象廳宗谷地方預報頁市町村選択；與 rishiri-island-hiking、stay、sights 撞號，同步時重編）；譯名待同步（利尻海洋飯店、利尻富士觀光飯店、利尻飯店、旅館雪國、姬沼、白色戀人之丘；與 rishiri-island-stay 統一）；丘珠機場位置待補 |
| 2026-10-24 14:45（自動） | rishiri-island-sights | 完成 | 3 | 2% → 16% | 利尻島新增 F185～F199（宗谷巴士付款、路線巴士夏冬景點站時刻、站名、A 路線 5 月班次、餵海豹、白色戀人之丘位置、各景點所在區、計程車兩家、觀光案內所；與 rishiri-island-hiking、rishiri-island-stay 撞號，同步時重編）、更正 F18、F55、F107、F108、F118，F112 不採用；沓形岬展望台封閉現況待重查；譯名待同步（Pon 山、Otatomari 沼、Kamui Terrace、Fureai 溫泉、寢熊岩、兩家計程車行）；大綱內連表缺 2 句（登山頁） |
| 2026-10-24 11:30（自動） | rishiri-island-stay | 完成 | 2 | 3% → 14% | 利尻島新增 F185～F189（Heartland Ferry 利尻–禮文時刻、ぐりーんひる inn 在鴛泊與 11–2 月休館、ゆ〜に在鴛泊、森林公園露營場在沓形、りしぷら住宿頁有電話與 WEB 欄；與 rishiri-island-hiking 的 F185～F191 撞號，同步時重編）、更正 F91（オタトマリ沼有商店與食堂）、F93（週日與 8/13–16 不施工），F5 由 F185 取代、F67「約5公里」不用；缺逐家訂房管道與房價；譯名待同步（旅館與露營場名） |
| 2026-10-24 05:20（自動） | rishiri-island-hiking | 完成 | 2 | 13% → 22% | 利尻島新增 F185～F191（110、北海道警察線上表單與開信時間、英文範本、ホテル利尻接送條件、9 月初冠雪〔りしぷら〕、6 小時含長官山休息 30 分；可能與其他利尻島文章撞號，同步時重編）、更正 F45、F52（5 小時 30 分）、F68（已結束）；F48／F111 見返台標高 500 公尺指展望台待註明；譯名待同步（北麓野營場、見返台、長官山、ポン山、甘露泉水）；大綱結構待調整 |
| 2026-10-24 02:40（自動） | rebun-island | 停放 | 2 | 0% → 12% | 禮文島新增 F495～F500（春秋渡輪發抵時刻、步道 10/21 公告、礼文ふるさとまつり、馬拉松要綱、敦盛草感謝祭、冬季平日巴士；與其他禮文島文章撞號，同步時重編）、更正 F493（10/05）、F244 由 F496 取代；F244 公告日期 2025-10-20 待核對；譯名待同步（礼文ふるさとまつり、ピスカ２１、リボンプロジェクト等）；三個官網連不上，恢復後重查 |
| 2026-10-23 21:25（自動） | rebun-island-food | 完成 | 3 | 0% → 8% | 禮文島 F112（礼文線①開往知床）、F447（蔥與秘傳醬汁摘錄）、F448（不能寫成只有須古頓岬吃得到；2022 特集與「利尻昆布」待重查）、F457（字幕燒在畫面上、不是家常菜）補摘錄或註記；無新增編號；譯名待同步（北紫海膽、蝦夷馬糞海膽、鏘鏘燒、ホッケザンキ、うにぎり、炉ばた ちどり、海鮮処かふか）；缺價格與特產販售店 |
| 2026-10-23 14:45（自動） | rebun-island-sights | 完成 | 2 | 1% → 13% | 禮文島新增 F495（10/22 步道冬季封閉公告；與 rebun-island-stay、rebun-island-hiking 的 F495 撞號，同步時重編）、F234 加列；刪 F412、F413（觀光協會巴士範例時刻），停用 F403，F244 由 F495 取代；F448「利尻昆布」待重查；缺金田之岬位置與交通、地藏岩從元地站步行距離；譯名待同步（郭洛塔岬、金田之岬、テップ海岸、第2差閉、兩家計程車行）；大綱缺本頁到禮文島交通的內連句 |
| 2026-10-23 11:42（自動） | rebun-island-hiking | 完成 | 3 | 3% → 15% | 禮文島新增 F495～F501（10/21 冬季封閉公告、5/28 全線通行、岬巡★★★★、桃岩分段距離、林道路面、元地線路線圖、自由乘降規定；與 rebun-island-stay 的 F495～F506 撞號，同步時重編）、更正 F85、F120、F244、F473；大綱 3 個標題待同步；譯名待同步（岬巡／巡岬、花名）；步道官網維護中、觀光協會官網連不上，原站恢復後重查 |
| 2026-10-23 05:42（自動） | rebun-island-stay | 完成 | 2 | 6% → 18% | 禮文島新增 F495～F506（旅館官網價格、星觀莊開放日、う～に～公告、スコトン岬、林野廳群生地 5/15、Trip.com／Agoda 10/23；可能與其他文章撞號，同步時重編）、更正 F479、F480、F486；F50～F58 價格與觀光協會存檔不一致待重查；觀光協會官網連不上，原站恢復後重查 6 家價格 |
| 2026-10-23 02:30（自動） | wakkanai | 完成 | 2 | 6% → 5%（中途重置） | 稚內 F116 更正（雨最多是 9、10 月）、F181 更正（未滿 2 萬日圓）；新增 F188（觀光巴士預約方式）、F189（A 線機場不配合航班）；與其他文章新增的 F188、F189 可能撞號，同步時重編；觀光協會官網 503，存檔查核的事實待原站恢復重查 |
| 2026-10-22 21:25（自動） | cape-soya | 完成 | 2 | 4% → 4%（中途重置） | 宗谷岬 F59 適用條件改成冬季（夏季另有 Active Bus）、F43 不採用（風車管制附圖讀不到）、F32 不寫（時效句）；觀光協會官網 503，存檔查核的事實與 Base-Soya 租車價格待原站恢復重查 |
| 2026-10-22 14:38（自動） | wakkanai-festival | 停放 | 2 | 4% → 14% | 稚內 F152、F154、F156～F160、F162 更正；新增 F210～F215（南極祭雨天順延、2026 舞蹈時程、8/1 巴士改道、雪樂園巴士交通、声問線時刻表、馬拉松改道；與 wakkanai-food 撞號）；F113 氣象廳 404 待重查 |
| 2026-10-22 05:37（自動） | wakkanai-food | 完成 | 3 | 0% → 11% | 稚內 F137、F139、F143、F147 更正，F134～F136、F138、F140 不採用（うろこ亭官網 502、副港市場官網維修，待重查）；新增 F198～F215（與 wakkanai-sights 的 F198～F209 撞號，同步時重編；源氏菜單、なら鮨、扇貝店、ひいらぎ軒、副港市場、炒麵店、伴手禮）；譯名：稚內炒麵（チャーメン） |
| 2026-10-21 21:27（自動） | wakkanai-sights | 完成 | 3 | 8% → 5%（中途重置） | 稚內 F99、F103、F112 更正、F168 刪除；新增 F198～F209（觀光巴士預約取票、A 線路線、雪樂園 2027、港のゆ不定休、1 月與 8 月日落、B 線停靠、野寒布岬周邊設施）；本篇 F901、F903 對應 cape-soya:F59、F68 |
| 2026-10-21 13:27（自動） | wakkanai-weather | 完成 | 3 | 12% → 21% | 稚內 F124、F126、F127 更正；新增 12 個月最高與最低氣溫、日照率 40% 以上日數（文章 F31～F33）；譯名：宗谷岬流冰館、稚內市觀光案內所、Dormy Inn；宗谷岬アメダス平年值可補 |
| 2026-10-21 04:50（自動） | wakkanai-stay | 停放 | 0 | 0% → 1% | 無（需補研究：稚內旅館房價、含餐、訂房管道；宗谷岬住宿家數） |
| 2026-10-20 22:39（自動） | cape-soya-transport | 完成 | 3 | 4% → 14% | 宗谷岬 F54、F88、F104 更正；F98～F107 新增 |
| 2026-10-20 17:35（人工） | wakkanai-transport | 完成 | 3 | 24% → 40% | 稚內 F61、F64、F68、F79 更正；F188～F197 新增 |
| 2026-10-20（人工） | rishiri-island-transport | 完成 | 4 | 未量 | 利尻島 F23、F33、F37 已更正，待同步 D1 |
| 2026-10-18（人工） | wakkanai-ferry | 完成 | 3 | 未量 | 無 |
