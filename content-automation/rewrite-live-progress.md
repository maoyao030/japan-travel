# 第 3 批追蹤（第 1、2 批 13 篇已上線，main 0793a0f）
流程：content-automation/rewrite-live.md；連結句同步 scratchpad/apply-links.mjs；驗收紀錄產生器 scratchpad/write-review.mjs（spec 範例 review-spec-1.json）
| id | 研究 | 作者 | 潤稿 | 比對 | 查核 | 讀者 | 狀態 |
|---|---|---|---|---|---|---|---|
| wakkanai | aeb947fb7a295d1be | af4a4d72027ca6ea1 | a60a2ab8af958df12 | | | | polish（links synced） |
| rishiri-island | acfd324397645336e | a8fce2b17e9784a76 | a48d938729835748e | a029a5288dae21103 | | | drift |
| rebun-island | aee9d26573ca3cac0 | a0573e19ec76787ef | a81c64603dac778d6 | | | | polish（links synced） |
| asahikawa | a7d1e7c372c6bfdfe | a499adddf44d05094 | | | | | author |
| sounkyo | adb54c88ef0ea649e | abf0199e03725c34a | | | | | author |
| asahidake | a2880afb9657644bc | a56f2b494c6840187 | | | | | author |
| cape-soya | a7d43aa864710a6a7 | a93c8d3dbbdfd5a0b | aeb22e57395110ff0 | ac496525e216771b1 | | | drift |
| higashikawa | a8d223a14a2bc24ec | a5910fe5c55264f0a | ae0a5643b9fe65df3 | | | | polish（links synced） |
| asahidake-or-sounkyo | a72087deadcd92d2d | a0f5579fa98bc5f6c | ac02eef9ef0327faf | | | | polish（links synced） |
| wakkanai-sights | a51f065a8264895e1 | af3d6f3e21dc1f8f1 | abdd1ed55afbd578e | | | | polish（links []） |
未開始（18）：asahidake-hiking asahikawa-food asahikawa-sights asahikawa-weather rebun-island-food rebun-island-hiking rebun-island-sights rishiri-island-festival rishiri-island-food rishiri-island-hiking rishiri-island-sights rishiri-island-weather sounkyo-festival sounkyo-hiking sounkyo-sights sounkyo-weather wakkanai-festival wakkanai-weather
HOLD：wakkanai-ferry（訂票系統 11 月上旬重開）
- 待辦：sounkyo-transport 正文寫 Taisetsu Liner「預約制巴士」，asahikawa 研究 F665 發現沒預約也能在旭川站前售票機買（客滿可能上不了車），下次修訂該頁時順手改。
## 狀態（較新）
- cape-soya：驗收中（SHA 2f66c891… 查核 a28de18de4d6fcefe、讀者 a65cd17b9b528adb8）；潤稿者 aeb22e57395110ff0
- sounkyo：潤稿 add5f0c4302e029ba（作者 abf0199e03725c34a）
- wakkanai-sights：比對 ad7920ca484ce9de6（潤稿 abdd1ed55afbd578e）
- rebun-island：比對 a1a4c0bcc015dddc9（潤稿 a81c64603dac778d6）
- rishiri-island：比對 a029a5288dae21103（潤稿 a48d938729835748e）
- 潤稿中：asahidake-or-sounkyo ac02eef9ef0327faf、wakkanai a60a2ab8af958df12、higashikawa ae0a5643b9fe65df3
- 重寫中：asahidake a56f2b494c6840187、asahikawa a499adddf44d05094
- replace-body.mjs 已修同一頁重複連結（countLinks），測試 7 項通過，未 commit
- rishiri-island：驗收中（SHA c0071c65… 查核 a97eb468f29f03978、讀者 ae49d76fc40333e65）
- asahidake：潤稿 a860a908455a62208（作者 a56f2b494c6840187）
- wakkanai：比對 ab36a973ab65e1b4b（潤稿 a60a2ab8af958df12）
- wakkanai-sights：驗收中（SHA cd5fc58b… 查核 a90c180d6940966ed、讀者 a750c061676af4963）
- rebun-island：潤稿者 a81c64603dac778d6 修 2 不可接受＋2 舊問題
- cape-soya：讀者第一階段完成（必修 3：一天 4 來回但表只列 2 班、11 月封閉日期前後不一、60 分鐘算不攏），等查核
- asahikawa：潤稿 a28ed89301b73b85d；higashikawa：比對 ae967fde67e6bcefc
- glossary Taisetsu Liner 說明再改為「可網路預約、旭川站前也能現場買票」
- wakkanai：驗收中（SHA ed355fb8… 查核 a139c76ce25b691d9、讀者 a0a6b06dbbf8dced4）
- rebun-island：驗收中（SHA 25faf880… 查核 a9d47e7b8613e8d74、讀者 aaf5d0788a52ba7cf）
- sounkyo：比對 a90550d3c08978fd4（潤稿 add5f0c4302e029ba）
- asahidake-or-sounkyo：比對 ace223e21eac18ad7（潤稿 ac02eef9ef0327faf）
- rishiri-island：讀者第一階段完成（必修 4），等查核 a97eb468f29f03978
- sounkyo：驗收中（SHA 873f8954… 查核 a55b9cc8797695a0d、讀者 a038accde5ef9dca1）
- higashikawa：驗收中（SHA 4c6adb6d… 查核 ab03211bb3a6eb689、讀者 a4e8f8f210172e12e）
- asahidake：比對 a957507ecfd9d0ee7（潤稿 a860a908455a62208）
- asahikawa：比對 a98c0673b7747571f（潤稿 a28ed89301b73b85d）
- asahidake-or-sounkyo：潤稿者 ac02eef9ef0327faf 修 1+3 處中
- 讀者第一階段完成：wakkanai-sights（7 必修）、wakkanai（3）、rebun-island（4）、rishiri-island（4）、cape-soya（3）
- asahidake-or-sounkyo：驗收中（SHA c9d0cc35… 查核 ae46ef7df45c3677b、讀者 a42e6c2a3ccc47ad2）
- asahidake：潤稿者 a860a908455a62208 修舊問題 3 處中
- higashikawa：讀者第一階段完成（4 必修）
- asahidake：驗收中（SHA 7464721e… 查核 a9355dcb70ad7a74e、讀者 a786b316d92336568）
- asahikawa：驗收中（SHA 4f5cb9ce… 查核 a9b6533b3296b36d3、讀者 ace8758869870f071）
- cape-soya：讀者第二階段 a65cd17b9b528adb8（查核 89/89 完成）
=> 第 3 批 10 篇全部進入驗收
- asahidake 修稿時告訴作者：纜車 11/16～12/10 停駛是每年的季節停駛整備，不算臨時停機，照讀者必修寫明 2026 年的日期。
## 狀態快照（2026-11-02）
- 已換上 Sanity（第 3 批）：cape-soya、rishiri-island、wakkanai-sights（未推 main）
- 複查＋最終判定中：wakkanai（SHA 758d2100…，查核 a139c76ce25b691d9、讀者 a0a6b06dbbf8dced4；大綱連結已同步，新增 wakkanai→cape-soya-transport）、higashikawa（SHA 86e1b5b8…，查核 ab03211bb3a6eb689、讀者 a4e8f8f210172e12e）
- 修稿中：rebun-island（作者 a0573e19ec76787ef；查核 a9d47e7b8613e8d74、讀者 aaf5d0788a52ba7cf）
- 讀者第二階段：sounkyo（a038accde5ef9dca1；查核 a55b9cc8797695a0d；作者 abf0199e03725c34a）、asahikawa（ace8758869870f071；查核 a9b6533b3296b36d3；作者 a499adddf44d05094）、asahidake（a786b316d92336568；查核 a9355dcb70ad7a74e；作者 a56f2b494c6840187）
- 查核中：asahidake-or-sounkyo（ae46ef7df45c3677b；讀者 a42e6c2a3ccc47ad2 第一階段完成；作者 a0f5579fa98bc5f6c）
- glossary：北の桜守 改成已查證台灣片名；Taisetsu Liner 說明更新
## 狀態快照（2026-11-02，main 43d22b3 已推）
- 第 3 批已上線（Sanity＋main）：cape-soya、rishiri-island、wakkanai-sights、higashikawa、wakkanai、rebun-island
- 複查＋最終判定中：asahidake（SHA 7ae0b8b4…，查核 a9355dcb70ad7a74e、讀者 a786b316d92336568）、asahikawa（SHA 036ddee9…，查核 a9b6533b3296b36d3、讀者 ace8758869870f071）、sounkyo（SHA 4e000009…，查核 a55b9cc8797695a0d、讀者 a038accde5ef9dca1）
- asahidake-or-sounkyo：等查核 ae46ef7df45c3677b（讀者 a42e6c2a3ccc47ad2 第一階段完成；作者 a0f5579fa98bc5f6c；潤稿 ac02eef9ef0327faf）
- 工具：scratchpad/sync-links2.mjs（照 from/to/anchor 同步，可新增）、write-review.mjs + review-spec-N.json
- 每篇完成後：寫 spec→write-review→local-article-gates→studio replace dry-run→--apply；一批完成後 commit、merge origin/main、npm test、push HEAD:main
## 狀態快照（main 831210f）
- 第 3 批已上線 9 篇：cape-soya、rishiri-island、wakkanai-sights、higashikawa、wakkanai、rebun-island、asahikawa、sounkyo、asahidake
- asahidake-or-sounkyo：等查核 ae46ef7df45c3677b（讀者 a42e6c2a3ccc47ad2 第一階段完成 6 必修；作者 a0f5579fa98bc5f6c）
- 第 4 批研究中（9）：asahidake-hiking a93afbe747e47ff1e、asahikawa-food a354689f008181c23、asahikawa-sights a3ca21138afc29d61、rebun-island-food ac8e32b34597ab85c、rebun-island-hiking afe6f531730477370、rebun-island-sights a3e9b4b0b2f3577a4、rishiri-island-hiking a028a4c6f81ad1ef6、rishiri-island-sights a9fc59505936ea1de、sounkyo-sights a175df9af3e4c42db
- 未開始（9）：asahikawa-weather rishiri-island-festival rishiri-island-food rishiri-island-weather sounkyo-festival sounkyo-hiking sounkyo-weather wakkanai-festival wakkanai-weather
- HOLD：wakkanai-ferry
- asahidake-hiking：作者 a59ef9172455824d8（研究完成）
- rishiri-island-hiking：作者 aa4e81fb6823d80b2（野營場費用拿掉）
- rishiri-island-sights：作者 a6cbf7b338169863b
- sounkyo-sights：作者 a873624899fd66d8c
- asahidake-hiking：潤稿 a25ec050b07ce0092（links synced）
- rebun-island-hiking：作者 a07ba50d8bc952b71
- asahikawa-sights：作者 ac1de4b5e2b8c4d22
- 留給規劃 session：旭川神社、上川神社頓宮競品有列，大綱沒有
- rishiri-island-hiking：潤稿 a3037143866638a51（links synced，新增往住宿頁連結）
- asahikawa-food：作者 a6d973a39768aa1d5
- 留給規劃 session：旭川壽司／海鮮丼競品都有、大綱沒有（asahikawa-food 競品筆記第 7 節）
- rishiri-island-sights：潤稿 a17776e414580b36e（links synced）
- rebun-island-food：作者 ad4d45044010456de（Chidori 月份與付款只靠觀光協會，不寫）
- rebun-island-sights：作者 a6d0a258dd99340d3
- sounkyo-sights：潤稿 ac00c4c88a841ad1a（links synced）
- asahidake-hiking：比對 a6babcb683e8c5e2b（潤稿 a25ec050b07ce0092）
- rebun-island-hiking：潤稿 afd12683d75e4b1ed（links synced）
- rishiri-island-hiking：比對 a0db752ab9a798aaf（潤稿 a3037143866638a51）
- asahidake-hiking：驗收中（SHA 120e3105… 查核 acf07725641fe8269、讀者 ae9c4c4471703c040）
- asahikawa-food：潤稿 ada8614d469f98283（links synced；作者 a6d973a39768aa1d5）
- rishiri-island-hiking：驗收中（SHA 4c5d642e… 查核 a63fea8e5d9e3076d、讀者 a6829b3645706701c）
- rebun-island-food：潤稿 ab0e10c8627936533（作者 ad4d45044010456de）
- rishiri-island-sights：比對 a0a3f2732dbce7665（潤稿 a17776e414580b36e）
- asahikawa-sights：潤稿 a057b57c8f13cbbbe（links synced，新增往主頁「旭川冬季祭典」；作者 ac1de4b5e2b8c4d22）
- rebun-island-sights：潤稿 a1d02141a785c7dfa（links synced；作者 a6d0a258dd99340d3）
=> 第 4 批 9 篇都已寫完重寫稿
- sounkyo-sights：比對 a2bac96815bfcc181（潤稿 ac00c4c88a841ad1a）
- asahidake-hiking：讀者第一階段完成（5 必修；H2 父題涵蓋不到，標題可能要改，第二階段後決定）
- rebun-island-hiking：潤稿完成（刪 F429、F425 部分、F309 部分），意義比對進行中
- rishiri-island-hiking：讀者第一階段完成（必修 3：計畫書交哪裡、沓形先講封閉、官方當主詞 8 處），等事實查核 a63fea8e5d9e3076d
## 2026-11-02 狀態
- sounkyo-sights：意義比對 0/0，修正潤稿前事實問題（大函不跟導覽團）；SHA 718c23e7；FC a1bbcde95953d3e14、讀者 a47520be9c1c88e54
- rishiri-island-sights：意義比對修 3 處；SHA f377e8d9；FC a1c22833d79fe7e81、讀者 af6da31cd3ce6b091
- rebun-island-hiking：意義比對 0/0；SHA d379ca0c；FC a94aa9281a9cb9ea4、讀者 a2ab41c6ce70344c4
- asahikawa-food：意義比對 ac569a5d4d8be4fe2（潤稿 ada8614d469f98283）
- rebun-island-food：意義比對 ab8c261ad308ffb33（潤稿 ab0e10c8627936533）；注意 F419 觀光協會來源
- rebun-island-sights：意義比對 a653f47cfc5e413c4（潤稿 a1d02141a785c7dfa）；潤稿者改了 F441 採用欄
- asahikawa-sights：潤稿 a057b57c8f13cbbbe 進行中
- 批次 5：先等第 4 批推進（週用量 77%，11/2 22:00 重置）
- sounkyo-sights：讀者第一階段完成（必修 4：瀧見台巴士站、計程車車資、泛舟接送、2026 年份）
- asahikawa-food：意義比對遺失 1（F472 寶可夢人孔蓋），已退潤稿者補
- rebun-island-food：意義比對不可接受 2（觀光協會來源），已請作者 ad4d45044010456de 補官方來源，不夠就維持線上版
- asahikawa-food：潤稿修正完成；SHA b6afc924；FC a5432b929202f91b5、讀者 a295e9588f5854293
- asahikawa-sights：潤稿完成（刪 9 筆部分），意義比對 a1df09cb574ad4766
- rebun-island-hiking：讀者第一階段完成（必修 4）
- rebun-island-sights：意義比對 0/0；但多筆只靠打不開網站，協調者決定：無來源刪或改寫；存檔只用在不會變的事實；延伸資料 rebun-island.jp 拿掉。作者 a6d0a258dd99340d3 處理中
- rishiri-island-sights：讀者第一階段完成（必修 3：巴士排法空等、所在區、明年期間去哪看）
- rebun-island-food：**HOLD，維持線上版**（拿掉無來源事實後只剩 14 筆；等 rebun-island.jp 恢復，研究記錄定 2026-12-02 重開；F541～F546 可用）
- asahikawa-sights：意義比對 0/0；SHA df5bee8c；FC、讀者已派
- rishiri-island-hiking：FC 76 全 verified；讀者第二階段中
- asahidake-hiking：FC 120 全 verified；讀者第二階段中
- asahikawa-food：讀者第一階段完成（必修 1：拉麵村時間衝突）
- rishiri-island-hiking：**已換上 Sanity**（review gates_clear；另用 apply-pending-link 補利尻島住宿連結，復原檔 .tmp/auto-publisher/link-recovery/rishiri-island-hiking-linkf55a251d38.json）
- asahidake-hiking：作者修改完（F246、F247），SHA d79d32b8；複查與最終判定中
- rebun-island-hiking：FC 114/113，C106 incorrect；第二階段帶協調者規則（存檔只撐不太變的事實）
- rebun-island-sights：作者補來源後 52 筆事實（F564～F567）；SHA 07efa1bc；FC、讀者已派
