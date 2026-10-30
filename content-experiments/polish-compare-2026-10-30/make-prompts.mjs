// 產生 B（Opus＋範例）與 C（Gemini）共用的短提示。用法：node make-prompts.mjs（在本資料夾的上一層執行）
import fs from 'node:fs';
const E = 'polish-compare-2026-10-30', G = 'gemini-polish-test-2026-10-29';
const topics = { 'asahikawa-transport': '旭川交通', 'rebun-island-sights': '禮文島景點', 'rishiri-island-stay': '利尻島住宿' };
const rules = t => `你是台灣資深旅遊編輯。下面是一篇給台灣讀者的日本旅遊文章（${t}），內容與事實都已查核過，但讀起來像資料表拆成句子、有AI腔與日文官網翻譯腔。請潤稿，讓它像熟悉當地的台灣旅遊編輯在跟朋友解釋怎麼排行程，口吻參考「好運日本行」與 MATCHA 的中文版。

一定要遵守：
1. 事實一個都不改、不多加：數字、時間、價格、日期、電話全部照原文；不加原文沒有的評價、建議或資訊。
2. 修飾詞照原文：可能、約、原則上、只、都、每天、建議、要，不能加也不能拿掉；「可能停駛」不能寫成「會停駛」，「要出示證件」不能寫成「出示就可以了」。
3. 標題（#、##、###）與層級一字不改；表格內容不改。
4. 店名、旅館名、站名等日文名稱照原文保留，「」裡的日文照留；其他敘述不要用日文漢字詞（檢討、運休、運賃、料金、割引、片道、往復、見學、混雜、入場料），用台灣說法。
5. 「…見○○交通」「…可以先看○○值得去嗎」這類連到別頁的句子一字不改。
6. 不用「先看結論」「重點整理」「懶人包」這類制式摘要，也不要加新的段落標題。

怎麼改：
- 重要的放前面直接講，不要先宣布「關鍵是…」「有兩件事要注意」「第一…第二…」。
- 句子從讀者想做的事開始，不用名詞標籤開頭；不要寫出查資料的過程（「手冊上標示為」）。
- 連續的動作串成一句；節奏有長有短。
- 少用「所以」「記得」「要」「…的人」，不要每段都用提醒收尾；不分類讀者，改成「…的話」。
- 同一件事只講一次。

請直接輸出潤稿後的完整文章（Markdown），不要加說明。
`;
const sp = f => fs.readFileSync(f, 'utf8').replace(/\r/g, '').trim().split(/\n\n+/).map(s => s.replace(/\*\*/g, ''));
const a = sp(`${G}/current-live-body.md`), b = sp(`${G}/gemini-3.1-pro.md`);
const ex = [8, 15, 18, 19, 22, 33, 53].map(i => `改前：${a[i]}\n改後：${b[i]}`).join('\n\n');
fs.writeFileSync(`${E}/examples.md`, `# 範例：另一篇（宗谷岬）改得好的段落\n\n這些是口吻範例，看它們怎麼少用逗號、把兩句併成一句、把修飾語收到名詞前面、讀起來像在說話。只學講法，不抄句子，也不要把範例的事實帶進文章。\n\n${ex}\n`);
for (const [id, t] of Object.entries(topics)) {
  const body = fs.readFileSync(`${E}/${id}/input.md`, 'utf8').replace(/\r/g, '').trim();
  fs.writeFileSync(`${E}/${id}/prompt-C.md`, `${rules(t)}\n---\n\n${body}\n`);
  fs.writeFileSync(`${E}/${id}/rules.md`, rules(t));
}
console.log('ok');
