---
name: japan-travel-polish
description: Polish a fact-checked Japan travel article draft so it reads like a human travel editor wrote it, without changing any fact. Works on draft-tagged.md after the content draft passes its checks, keeps every number, time, price, Japanese term, fact tag, heading, table and internal-link sentence, and is verified by check-polish.mjs. Use when an article's content is correct but reads stiff, or as the polish step before acceptance.
---

# 日本旅遊長尾站潤稿

內容稿已經正確、完整，但讀起來像資料表被拆成句子。潤稿只做一件事：**讓它像一位熟悉當地的編輯寫的**。事實一個都不改。

## 能改與不能改

| 能改 | 不能改 |
|---|---|
| 句子順序、合併或拆開 | 數字、時間、價格、日期 |
| 加轉折與因果（所以、如果、不過、因此） | 日文原名、按鈕與招牌的日文 |
| 把事實改寫成讀者的安排（「6:30 的船要前一晚住稚內」） | 事實編號（跟著它說明的句子走） |
| 刪掉同一段裡重複的說法 | 標題與層級、表格 |
| 換掉公文腔與照官網句構的寫法 | 大綱內連表的連結句（一字不改） |
| 段落的開場與收尾 | 不能新增事實，也不能刪掉讀者需要的條件 |

把事實改寫成讀者的安排時，那句推論要有事實撐住。例如「要前一晚住稚內」，要有 6:30 開船的事實。不能加入事實表沒有的新資訊。

## 讓文章不僵硬的五件事

1. **一段一個重點。** 開頭段只回答讀者最想知道的事，其他細節留給後面的段落。不要在一段裡塞進所有季節、所有港口。
2. **事實之間要有關係。** 用「所以」「如果」「不過」「也因此」把並列的事實串成理由，不要整段都是「A是B，C是D」。
3. **站在讀者的行程裡說。** 時刻表說的是「6:30 開」，編輯說的是「搭最早那班，前一晚就要住稚內」。
4. **句子有長有短。** 重點用短句，說明用長句，不要每句都一樣長。
5. **去掉官網的句構。** 不寫「依時刻表」「目前公布的…適用…」「必要時最多會…」，用自己的話說同一件事。

口吻與標點照寫作 Skill 的 `writing-guide.md`。不寫「官方沒寫」，不寫成本站去過。

## 範例

修改前（內容正確但僵硬）：

> 稚內到利尻島、禮文島的渡輪由Heartland Ferry（ハートランドフェリー）經營，從稚內港開往利尻島的鴛泊港和禮文島的香深港，兩島之間也有船互通[F1]。依2026年時刻表，夏季6月到9月稚內往兩島各有3個來回，1月到4月27日與11月到12月的冬季班表只剩2個來回[F2, F3]。

修改後：

> 要從稚內前往利尻島或禮文島，只能搭Heartland Ferry（ハートランドフェリー）的渡輪，船從稚內港出發，分別停靠利尻島的鴛泊港和禮文島的香深港，兩座島之間也有船可以互通[F1]。班次最多的是夏天，6月到9月稚內往兩島各有3個來回；到了冬天，1月到4月27日與11月到12月只剩2個來回，安排行程時選擇會少很多[F2, F3]。

改了什麼：
- 開頭從讀者的處境說起（「要前往…只能搭」）。
- 「依2026年時刻表」改成直接講季節。
- 加「到了冬天」「安排行程時選擇會少很多」，把兩個並列的事實變成對比。
- 數字、日文名與編號都沒變。

## 流程

1. 讀內容稿的 `draft-tagged.md`、研究記錄的事實表，以及大綱裡這一頁的內連句。
2. 照上面的原則改寫，輸出新的 `draft-tagged.md`。
3. 執行 `node .agents/skills/japan-travel-polish/scripts/check-polish.mjs <潤稿前> <潤稿後> --article=<articleId>`。有任何差異就改回去，直到通過。
4. 照寫作 Skill 重跑 `fact_tags.py`、`check-voice.mjs`、`audit_answer_first.py`。
5. 交給驗收。潤稿改過的句子，事實查核只需要重查那些句子。

## 完成條件

`check-polish.mjs` 通過；`fact_tags.py`、`check-voice.mjs`、`audit_answer_first.py` 通過；沒有新增事實；內連句原樣保留。
