// 組稿：edited.md 的飯店比較表補「連結」欄（照 stage3/final.md 比較表抄），最後接資料來源與更新日期。不改正文。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const base = new Map();
for (const l of readFileSync(join(root, 'stage3', 'final.md'), 'utf8').split(/\r?\n/)) {
  if (!l.startsWith('| ')) continue;
  const c = l.split('|').slice(1, -1).map((x) => x.trim());
  const link = c[c.length - 1];
  if (link.startsWith('[官網]')) base.set(c[0], link);
}
const official = [];
let inHotel = false;
const lines = readFileSync(join(here, 'edited.md'), 'utf8').split(/\r?\n/).map((l) => {
  if (l.startsWith('| 飯店 |')) { inHotel = true; return `${l} 連結 |`; }
  if (!l.startsWith('|')) { inHotel = false; return l; }
  if (!inHotel) return l;
  if (l.startsWith('|---')) return `${l}---|`;
  const name = l.split('|')[1].trim();
  const link = base.get(name) || base.get(name.replace(/（.*）/, ''));
  if (!link) throw new Error(`找不到連結：${name}`);
  official.push([name.replace(/（.*）/, ''), link.match(/\[官網\]\(([^)]+)\)/)[1]]);
  return `${l} ${link} |`;
});
const extra = [
  ['旭川電氣軌道 出湯號（旭岳線）', 'https://www.asahikawa-denkikidou.jp/asahidaek_line/'],
];
const src = ['', '## 資料來源', '', ...[...official, ...extra].map(([n, u]) => `- [${n}${u.includes('denkikidou') ? '' : '官網'}](${u})`), '', '資料更新：2026年11月', ''];
writeFileSync(join(here, 'final.md'), `${lines.join('\n').trimEnd()}\n${src.join('\n')}`);
console.log(`飯店表 ${official.length} 列`);
