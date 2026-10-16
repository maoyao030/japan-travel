# 自製示意圖

路線圖、時間軸這種圖由程式依資料檔畫成 SVG。只畫事實，每一個標示都對應研究記錄裡已查證的事實，沒有授權問題。它和 AI 圖不同：AI 圖畫想像的畫面，自製示意圖只畫資料。

## 流程

1. 在 `content-production/<article-id>/images/diagrams/<diagramId>.json` 寫資料檔。
2. 執行 `node .agents/skills/japan-travel-image-finder/scripts/render-diagram.mjs content-production/<article-id>/images/diagrams/<diagramId>.json`，產生同名的 `.svg`。
3. 用人眼看一次 SVG，確認手機寬度下文字可讀、沒有重疊。
4. 在圖片封包加入 `sourceType: "diagram"` 的候選。
5. 驗收時，事實查核 agent 查資料檔的每一筆 `factId`，圖片驗收 agent 確認圖與資料一致。

## 資料檔

```json
{
  "schemaVersion": 1,
  "diagramId": "wakkanai-ferry-routes",
  "type": "route",
  "title": "稚內、利尻島、禮文島的渡輪航線",
  "scaleNote": "位置示意，非實際比例",
  "nodes": [
    {"id": "wakkanai", "label": "稚內港", "labelJa": "稚内港", "factId": "F1"},
    {"id": "oshidomari", "label": "鴛泊港（利尻島）", "labelJa": "鴛泊港", "factId": "F2"},
    {"id": "kafuka", "label": "香深港（禮文島）", "labelJa": "香深港", "factId": "F3"}
  ],
  "edges": [
    {"from": "wakkanai", "to": "oshidomari", "label": "約 1 小時 40 分", "factId": "F4"},
    {"from": "wakkanai", "to": "kafuka", "label": "約 1 小時 55 分", "factId": "F5"},
    {"from": "oshidomari", "to": "kafuka", "label": "約 45 分", "factId": "F6"}
  ]
}
```

範例只示範格式，時間不是查證過的事實。

## 規則

- `type`：`route`（地點與航線）或 `timeline`（依時間排列的步驟，例如一日行程）。`timeline` 的節點依陣列順序排列，`edges` 可省略。
- 每個節點與連線都要有 `factId`，對應 `reference-review.md` 事實表的編號，而且必須在 `fact-check.json` 裡是 `verified`。
- `route` 必須有 `scaleNote`，寫明「位置示意，非實際比例」或實際比例。
- 標示用繁中，地名附 `labelJa`。不寫事實表以外的數字。
- 不手改產生出來的 SVG；要改就改資料檔再重新產生。
