# asahikawa-food 驗收紀錄

- 文章：旭川美食（`/places/asahikawa/food/`，aspect-page，地點 `asahikawa`，旭川・大雪群）
- 日期：2026-10-26～27（人工 session，Darren 要求今天持續寫作，10/27 要求把做一半的都做完；旭川・大雪群大綱 Darren 同意做好就寫）
- 稿件 SHA-256（LF）：`52e3e41c155f98ad594f7eeb2a607387bf45825b370902b6ac7d3a558ea8bf1e`
- 規則：`content-automation/local-writer.md` 第 2～4 步，大綱 `content-planning/hokkaido/hokkaido-asahikawa-outline.json`
- 備註：讀者最終判定是對 `bc3c81fb…` 做的，剩 1 條小必修；協調者照讀者與事實查核建議直接改 2 個詞（「第3站就是南永山」改成「過了新旭川的下一站就是南永山」、「中午到傍晚的班次」改成「上午到傍晚的班次」），事實查核以雜湊與 git diff 確認只差這 2 處並全部 verified，以 `52e3e41c…` 定稿。

## 結果

| 項目 | 結果 |
|---|---|
| 格式 | `mechanical_clear`（audit_answer_first，aspect-page） |
| 標題 | `acceptable`（heading-review.json 改 2 個標題；大綱同步） |
| 讀者價值 | `acceptable`（reader-final.md 剩 1 條小必修，協調者照建議改好） |
| 事實與條件 | `verified`（fact-check.json 第 2 輪 109 項全部 verified，收斂後複查仍全部 verified） |
| 口吻 | check-voice --final 通過 |
| 事實編號 | tags_clear，事實表 56 筆、正文用 54 筆 |
| 防抄襲 | check-copy 通過（潤稿時比對 GLTJP 2 篇、MATCHA 2 篇） |
| 圖片 | 這次沒有選圖 |

## 身分

| 角色 | 身分 |
|---|---|
| 研究者 | 子代理（Opus 5.5），寫作前補研究，判定 `ready` |
| 作者 | 另一個子代理（Opus 5.5），寫初稿與驗收後第 1 輪 |
| 潤稿者 | 另一個子代理（Opus 5.5），沒寫過這篇 |
| 編輯挑錯 | 另一個子代理（Opus 5.5） |
| 意義比對 | 另一個子代理（Opus 5.5） |
| 標題檢查 | 另一個子代理（Opus 5.5） |
| 事實查核 | 另一個子代理（Opus 5.5），唯讀 |
| 讀者驗收 | 另一個子代理（Opus 5.5），唯讀 |
| 協調者 | 人工 session 主代理（Opus 5.5）；同步標題；收斂時照讀者與查核建議直接改 2 個詞 |

## 經過

| 步驟 | 結果 |
|---|---|
| 寫作前補研究 | `ready` |
| 作者 | 初稿 mechanical_clear |
| 潤稿 | 讀 GLTJP 2 篇、MATCHA 2 篇；五項檢查通過 |
| 意義比對 | 不可接受 4（2 處輕微）、遺失 1，已修 |
| 事實查核第 1 輪 | 非 verified 7（C1 新子燒做法、C11 離車站最近、C13 郊外、C68 最老、C87 自由軒地址、C93 寶可夢人孔蓋、C95 醬油店品項） |
| 讀者驗收 | 第一階段 revise；第二階段最終必修 12 |
| 作者驗收後第 1 輪 | 12 條必修處理，新增 F468～F472（JR 石北本線站序與時刻表、山頭火宗旨、寶可夢人孔蓋），更正 F458 |
| 事實查核第 2 輪 | 109 項全部 verified |
| 讀者最終 | 剩 1 條小必修（南永山站序的說法） |
| 收斂 | 協調者改 2 個詞；事實查核複查 109 項全部 verified |

## 查不到所以正文沒寫的

- 拉麵村縮短營業後各店幾點收（正文改成排在中午前後去最穩）。
- 各店價格是否含稅（照官網數字寫）。

## 留給之後的事

- 事實表待同步：F468～F472；F458 更正。
- 讀者驗收的加分沒做：「中午前後去最穩」和「搭 13:48 去」放在一起有點兜不起來；醬油冰棒表格沒標夏天。
- 拉麵村營業時間恢復後重查；JR 時刻表 2027 年 3 月改點後重查。

最終結果：`ready_for_user_preview`
