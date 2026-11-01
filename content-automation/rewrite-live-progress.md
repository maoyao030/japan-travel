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
