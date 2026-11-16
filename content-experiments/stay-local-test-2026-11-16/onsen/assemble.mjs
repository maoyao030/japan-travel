// 組稿：edited.md 的比較表補「連結」欄（照 stage3/final.md 比較表抄），最後接資料來源。不改正文。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const base = new Map();
for (const l of readFileSync(join(root, 'stage3', 'final.md'), 'utf8').split(/\r?\n/)) {
  if (!l.startsWith('| ')) continue;
  const c = l.split('|').slice(1, -1).map((x) => x.trim());
  if (c.length === 7 && c[6].startsWith('[官網]')) base.set(c[0], c[6]);
}
const official = [];
const lines = readFileSync(join(here, 'edited.md'), 'utf8').split(/\r?\n/).map((l) => {
  if (l.startsWith('| 飯店 |')) return `${l} 連結 |`;
  if (l.startsWith('|---')) return `${l}---|`;
  if (l.startsWith('| ')) {
    const name = l.split('|')[1].trim();
    const link = base.get(name);
    if (!link) throw new Error(`找不到連結：${name}`);
    official.push([name, link.match(/\[官網\]\(([^)]+)\)/)[1]]);
    return `${l} ${link} |`;
  }
  return l;
});
const src = [
  '', '## 資料來源', '',
  '泡湯設施的查核日期是2026年11月12日，以各飯店與旅館的官網為準。住客的說法整理自Google地圖、4travel與Trip.com的住客評論，只寫兩個平台以上、三則以上都提到的，查核日期是2026年11月16日。', '',
  ...official.map(([n, u]) => `- [${n}官網](${u})`), '',
];
writeFileSync(join(here, 'final.md'), `${lines.join('\n').trimEnd()}\n${src.join('\n')}`);
console.log(`表格 ${official.length} 列`);
