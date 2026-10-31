// 把 A、B-fixed、C-fixed 去掉延伸資料以後的部分與粗體，隨機改名成 X/Y/Z，對照表寫進 blind-key.json（評審不能讀）。
import fs from 'node:fs';
const arts = ['asahikawa-transport', 'rebun-island-sights', 'rishiri-island-stay'];
const key = {};
const clean = t => t.replace(/\r/g, '').split(/\n## 延伸資料/)[0].replace(/\*\*/g, '').trim() + '\n';
const orders = [['B', 'C', 'A'], ['C', 'A', 'B'], ['A', 'B', 'C']];
arts.forEach((d, i) => {
  fs.mkdirSync(`blind/${d}`, { recursive: true });
  key[d] = {};
  ['X', 'Y', 'Z'].forEach((L, j) => {
    const v = orders[i][j], f = v === 'A' ? 'A.md' : `${v}-fixed.md`;
    fs.writeFileSync(`blind/${d}/${L}.md`, clean(fs.readFileSync(`${d}/${f}`, 'utf8')));
    key[d][L] = v;
  });
});
fs.writeFileSync('blind-key.json', JSON.stringify(key, null, 2));
console.log(key);
