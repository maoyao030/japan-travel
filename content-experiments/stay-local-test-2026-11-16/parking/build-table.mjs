// 把第一版的停車比較表，接上 stage3/final.md 比較表裡的「到JR旭川站」「大浴場或溫泉」「連結」。
// 只搬已經查核過的格子，不新增事實。用法：node parking/build-table.mjs（在測試資料夾裡跑）
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

function rows(file, headerStart) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith(headerStart));
  if (start < 0) throw new Error(`找不到表頭：${file}`);
  const out = [];
  for (let i = start + 2; i < lines.length && lines[i].startsWith('|'); i += 1) {
    out.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
  }
  return out;
}

const parking = rows(join(here, 'edited.md'), '| 飯店 | 停車場 |');
const base = new Map(rows(join(root, 'stage3', 'final.md'), '| 飯店 | 到JR旭川站 |').map((r) => [r[0], r]));

// stage3 比較表沒有、但別處查核過的格子（Y's 來自 hub/final.md 的小節）。
const stationOverride = {};
const bathOverride = {
  "Y's Hotel旭川站前": '頂樓大浴場，有三溫暖',
  '露櫻Grand旭川站前': '天人峽天然溫泉大浴場，有三溫暖',
  'OMO7旭川': '三溫暖與低溫浴池',
  'Art Hotel旭川': '住客專用Spa，有三溫暖',
};

const out = [
  '| 飯店 | 到JR旭川站 | 停車場與車位 | 一晚費用 | 車高或車型限制 | 溫泉或大浴場 | 連結 |',
  '|---|---|---|---|---|---|---|',
];
const missing = [];
for (const [name, lot, spaces, fee, reserve, limit] of parking) {
  const b = base.get(name);
  if (name === 'Auberge Sondre') continue; // 只有「出借場地」，沒有可比的停車資訊
  if (!b) { missing.push(name); continue; }
  let lotCell = lot;
  if (spaces !== '—') lotCell += `，${spaces}`;
  // 預約欄只留跟多數飯店不一樣的說明；「不能」「先到先停」開頭已經講過。
  if (reserve === '不用預約' || reserve === '訂房時確認台數') lotCell += `，${reserve}`;
  out.push(`| ${[
    name,
    stationOverride[name] ?? b[1],
    lotCell,
    fee,
    limit,
    bathOverride[name] ?? b[4],
    b[6],
  ].join(' | ')} |`);
}
if (missing.length) throw new Error(`stage3 比較表找不到：${missing.join('、')}`);
writeFileSync(join(here, 'table2.md'), `${out.join('\n')}\n`);
console.log(`寫出 ${out.length - 2} 列`);
