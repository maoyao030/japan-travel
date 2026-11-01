# 重寫追蹤（agent id 對照）。流程：content-automation/rewrite-live.md；連結句同步工具 scratchpad/apply-links.mjs
| id | researcher | author | polisher | drift | factcheck | reader | 狀態 |
|---|---|---|---|---|---|---|---|
| wakkanai-transport | ab6817a5b60736388 | aac20642faffd7e9b | a16c2bdf48e27a5a6 | | | | polish（links synced） |
| wakkanai-ferry | af59f84d319a1ad5f | | | | | | HOLD 預約系統改版（11月上旬重開） |
| rishiri-island-transport | a5aa14396ed68b447 | aa7bbdb651d4f0be9 | a6494081b9b6acbe7 | | | | polish（links synced） |
| rebun-island-transport | ada669dd2bfdcae22 | a24da318bc47365cc | a514d17c638a2f34c | | | | polish（links synced） |
| asahikawa-transport | a02bab028d09722d9 | a53d7bfe591809b6c | a13b6aab61f85090e | | | | polish（links synced） |
| sounkyo-transport | ae50c7ae3ca2212a8 | a6872b0a09bf1370b | a91c1ee9cd37ce383 | a5d5d5c8713a183bf | | | drift |
| asahidake-transport | a1aeb3b860bd5d705 | a226f0172145b2b54 | af7d55a49331fa8de | | | | polish（links synced） |
| cape-soya-transport | a97db33e494358b9b | af17b9ec296ab0474 | a20985171421abe78 | | | | polish（links synced） |
| wakkanai-stay | a57b1863c03571327 | aaf3dbb3bb69329a9 | ab9cf3b908d87643b | | | | polish（links []） |
| rishiri-island-stay | ac8d34b6b22efc339 | abfeadecbe7b46e48 | aaac1c573df17b591 | | | | polish（links synced） |
| rebun-island-stay | ac79b312727228425 | a6b2558bf250e2336 | | | | | author |
| asahikawa-stay | a4424e5d5cb46bf05 | a1aeaaa31b5b958b3 | a4ff30a02daf2d3d8 | | | | polish（links synced） |
| asahidake-stay | a3b102bb3fbac2297 | a7fa55effce891cfe | ad6380e758d450b7c | ae8dcab9ddf249e94 | | | drift |
| asahidake-ropeway | aee5c08f108e0be52 | a47c5adba8d33b109 | a20273ade6b158fe4 | | | | polish（links synced） |
後續 28 篇尚未開始研究。replace-body.mjs 已加 renamedSentences（測試 6 項通過，未 commit）。
## 進度補記（覆蓋上表）
- polish: rebun-island-stay a616aa9e224cef25d；asahikawa-stay a4ff30a02daf2d3d8；rishiri-island-stay aaac1c573df17b591；rebun-island-transport a514d17c638a2f34c；wakkanai-stay ab9cf3b908d87643b；asahidake-transport af7d55a49331fa8de；wakkanai-transport a16c2bdf48e27a5a6
- drift: asahidake-stay ae8dcab9ddf249e94；sounkyo-transport a5d5d5c8713a183bf；rishiri-island-transport a995ab52092200548；asahikawa-transport a6ae6be90670c60f8；asahidake-ropeway ab6d1ebf745f12210；cape-soya-transport a4bca306574532e26
- 驗收中：asahidake-stay（SHA cb14e7ac… 查核 ae37f872ce60e1ccc，讀者 a7aaba2e65ac97242）；sounkyo-transport（SHA 7ae67dec… 查核 afba2f64809633492，讀者 a19c7e5526c9ab5fc）
- drift 加：wakkanai-transport a4b375165a0b888fc；rebun-island-transport a28f96d8b45d7391b；wakkanai-stay aa6968e5e11e4bfec
- 注意：check-polish 要用 before-draft-tagged.md / draft-tagged.md 位置參數
- 驗收中加：rishiri-island-transport（SHA 4adae816… 查核 ae94a0c9b8ac26784 讀者 ac89326c70442b3c7）；asahidake-ropeway（SHA 14aba407… 查核 a463af87e82dde9ee 讀者 a81b2ae9da95b23f8）；asahikawa-transport（SHA 4420c7d0… 查核 aefc836c21043ea4d 讀者 a85956dca1d4ae0a9）
- cape-soya-transport：潤稿者 a20985171421abe78 修 1 處不可接受中
- drift 加：rebun-island-stay a5b2ee43bb2baefe8；rishiri-island-stay a5f87335b7389a116；asahikawa-stay a65aaf999020158c9；asahidake-transport aeec4835c1db71f85
- 驗收中加：wakkanai-stay（SHA 4b3190d2… 查核 a5eb474fb89740f96 讀者 aaccd3eadea7a2c5c）；wakkanai-transport（SHA 4564051c… 查核 acd8d8e83314c42a4 讀者 a235e1d0648f2d0a2）；rebun-island-transport（SHA 3c71f735… 查核 a043c74ef87fa803d 讀者 a949a204c04b5ed53）；cape-soya-transport（SHA 61663b55… 查核 a6a2edd037ef3f748 讀者 a1526b936bdf61093）；asahikawa-stay（SHA fd4567f1… 查核 a9ee342ed7cf12dd1 讀者 a9d7aec89c283a2cb）；rebun-island-stay（SHA 1de04575… 查核 a2136f2514463e596 讀者 a045602fee43612f1）
- 讀者第一階段完成（等查核完再做第二階段）：asahidake-stay、sounkyo-transport、asahikawa-transport、rishiri-island-transport、asahidake-ropeway
- 修稿中：asahidake-transport 潤稿者 af7d55a49331fa8de（半句）；rishiri-island-stay 潤稿者 aaac1c573df17b591（Rera Moshiri 句）
- 同時上限 20 個子代理
- check-voice 詞表建議補：交互通行、協力金、都市間巴士（sounkyo 讀者提）
- 驗收中加：asahidake-transport（SHA 32cb3dcf… 查核 a0d5b06110f6ffd08 讀者 aa0e82a4cebf7bbe7）；rishiri-island-stay（SHA 53fc12d4… 查核 adc3a47a1d0f9e08d，讀者第一階段還沒派——等空位）
- 讀者第一階段完成加：wakkanai-stay、wakkanai-transport、rebun-island-transport、rebun-island-stay、asahikawa-stay
- asahikawa-stay 修稿時告訴作者：款待券的面額不是房價，可以寫回（住宿頁不寫價格只限房價）
## 狀態快照（較新）
- asahidake-ropeway：已換上 Sanity（rev dEME9PgxExwemMSAoHQvbR），review.md gates_clear；要推 main 才會重建
- 修稿中（作者）：cape-soya-transport af17b9ec296ab0474、asahidake-stay a7fa55effce891cfe、asahikawa-transport a53d7bfe591809b6c、sounkyo-transport a6872b0a09bf1370b、asahidake-transport a226f0172145b2b54、rishiri-island-transport aa7bbdb651d4f0be9
- 讀者第二階段中：asahikawa-stay a9d7aec89c283a2cb、rebun-island-stay a045602fee43612f1
- 等查核：wakkanai-stay（a5eb474fb89740f96）、wakkanai-transport（acd8d8e83314c42a4）、rebun-island-transport（a043c74ef87fa803d）、rishiri-island-stay（adc3a47a1d0f9e08d）
- 複查/最終判定時：事實查核者=上面各查核 id；讀者=各讀者 id
- check-voice 詞表已加交互通行、協力金、都市間巴士；glossary Taisetsu Liner note 已改（未 commit）
## 額度用完時的狀態（2026-11-01）
- 已換上 Sanity：asahidake-ropeway
- 全部通過、待寫 review.md 並換正文：asahidake-stay（SHA 9e861812…）、cape-soya-transport（841d2132…）、asahidake-transport（26ab0bbe…）
- 複查＋最終判定中：asahikawa-transport（查核 aefc836c21043ea4d、讀者 a85956dca1d4ae0a9）
- 修稿中：sounkyo-transport a6872b0a09bf1370b、rishiri-island-transport aa7bbdb651d4f0be9、asahikawa-stay a1aeaaa31b5b958b3、rebun-island-stay a6b2558bf250e2336、wakkanai-transport aac20642faffd7e9b
- 待派修稿：wakkanai-stay（作者 aaf3dbb3bb69329a9，必修見 reader-stage2.md 3 條）
- 讀者第二階段中：rebun-island-transport a949a204c04b5ed53、rishiri-island-stay a578b39b10cabaf19
- HOLD：wakkanai-ferry；未開始：其餘 28 篇
