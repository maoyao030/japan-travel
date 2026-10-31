// 產生 view.html：三篇文章的新流程、上線版、潤稿前全文，加上「逐節對照」（新流程與上線版一節一節交錯）。
// 手機也好讀：頂端只固定一列按鈕，表格在窄螢幕改成一列一張卡片。用法：node build-view.mjs（在本資料夾執行）
import fs from 'node:fs';
const arts = [
  ['asahiyama-zoo', '旭山動物園'],
  ['sounkyo-stay', '層雲峽住宿'],
  ['wakkanai-food', '稚內美食'],
];
const vers = [
  ['N', '新流程', 'new-fixed.md'],
  ['L', '上線版', 'live.md'],
  ['in', '潤稿前', 'input.md'],
];
const DRIFT = JSON.parse(fs.readFileSync('drift-summary.json', 'utf8'));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const attr = s => esc(s.replace(/\*\*/g, '')).replace(/"/g, '&quot;');

function block(b) {
  const h = b.match(/^(#{1,4})\s+(.*)$/);
  if (h) return `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`;
  if (b.startsWith('|')) {
    const rows = b.split('\n').filter(r => !/^\|[-\s|:]+\|$/.test(r)).map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    const head = rows[0];
    return `<div class="tw"><table${head.length===2?" class=\"kv\"":""}><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map((c, i) => `<td data-l="${attr(head[i] || '')}">${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  if (/^- /.test(b)) return `<ul>${b.split('\n').map(l => `<li>${inline(l.replace(/^- /, ''))}</li>`).join('')}</ul>`;
  return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
}
const blocks = t => t.replace(/\r/g, '').split(/\n## 延伸資料/)[0].trim().split(/\n\n+/);
const md = t => blocks(t).map(block).join('\n');

// 依標題切節：每節 = 標題 + 底下的段落
function sectionsOf(t) {
  const out = [];
  for (const b of blocks(t)) {
    if (/^#{1,4}\s/.test(b) || !out.length) out.push({ head: /^#{1,4}\s/.test(b) ? b : '', body: [] });
    if (!/^#{1,4}\s/.test(b)) out.at(-1).body.push(b);
  }
  return out;
}
function paired(id) {
  const n = sectionsOf(fs.readFileSync(`${id}/new-fixed.md`, 'utf8'));
  const l = sectionsOf(fs.readFileSync(`${id}/live.md`, 'utf8'));
  return n.map((s, i) => {
    const ls = l[i] || { head: '', body: [] };
    const head = s.head ? block(s.head) : '';
    const liveHead = ls.head && ls.head !== s.head ? `<div class="lh">上線版標題：${inline(ls.head.replace(/^#+\s*/, ''))}</div>` : '';
    const same = s.body.join('\n\n') === ls.body.join('\n\n');
    if (!s.body.length && !ls.body.length) return head + liveHead;
    if (same) return `${head}${liveHead}<div class="pair same"><div class="plabel">兩版一樣</div>${s.body.map(block).join('')}</div>`;
    return `${head}${liveHead}<div class="pair N"><div class="plabel">新流程</div>${s.body.map(block).join('')}</div><div class="pair L"><div class="plabel">上線版</div>${ls.body.map(block).join('')}</div>`;
  }).join('\n');
}

let sections = '';
for (const [id] of arts) {
  let cols = `<section class="col" data-v="P"><div class="meta">新流程（綠）和上線版（藍）一節一節對照；意思被改：${DRIFT[id]}${DRIFT[id].startsWith('0') ? '' : '，已修'}</div><article lang="zh-Hant">${paired(id)}</article></section>`;
  for (const [k, , f] of vers) {
    const meta = k === 'N' ? `意思被改：${DRIFT[id]}${DRIFT[id].startsWith('0') ? '' : '，已修'}` : k === 'L' ? '舊流程潤稿，之後又修過事實' : '沒有潤過的內容稿，給你對照用';
    cols += `<section class="col" data-v="${k}"><div class="meta">${meta}</div><article lang="zh-Hant">${md(fs.readFileSync(`${id}/${f}`, 'utf8'))}</article></section>`;
  }
  sections += `<div class="art" data-a="${id}">${cols}</div>`;
}
const vbtn = [['P', '逐節對照'], ...vers.map(([k, l]) => [k, l])];
const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>新潤稿流程試跑</title>
<style>
:root{--bg:#fbfaf7;--fg:#1f1e1c;--muted:#6b6862;--line:#e4e1da;--card:#fff;--n:#15803d;--nb:#eef7f0;--l:#1d4ed8;--lb:#eef2fb;--th:#f3f1ec}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#171614;--fg:#ebe8e2;--muted:#a19d95;--line:#33312d;--card:#1f1e1b;--n:#4ade80;--nb:#1a261d;--l:#93c5fd;--lb:#1b2130;--th:#26241f}}
:root[data-theme=dark]{--bg:#171614;--fg:#ebe8e2;--muted:#a19d95;--line:#33312d;--card:#1f1e1b;--n:#4ade80;--nb:#1a261d;--l:#93c5fd;--lb:#1b2130;--th:#26241f}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.9 "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;-webkit-text-size-adjust:100%}
.top{padding:14px 16px 4px;max-width:760px;margin:0 auto}
h1.t{font-size:1.2rem;margin:0 0 6px}
.note{color:var(--muted);font-size:.9rem;line-height:1.6;margin:0}
.bar{position:sticky;top:0;z-index:2;background:var(--bg);border-bottom:1px solid var(--line);padding:8px 16px}
.row{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;max-width:760px;margin:0 auto}
.row+.row{margin-top:6px}
.row::-webkit-scrollbar{display:none}
.row button{flex:none;font:inherit;font-size:.92rem;padding:5px 14px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer;line-height:1.5}
.row button.on{background:var(--fg);color:var(--bg);border-color:var(--fg);font-weight:700}
main{padding:8px 16px 80px;max-width:760px;margin:0 auto}
.art,.col{display:none}.art.on,.col.on{display:block}
.meta{font-size:.88rem;color:var(--muted);line-height:1.6;margin:6px 0 4px}
article h2{font-size:1.4rem;line-height:1.5;margin:20px 0 10px}
article h3{font-size:1.2rem;line-height:1.5;margin:30px 0 8px}
article h4{font-size:1.05rem;line-height:1.5;margin:24px 0 6px}
article p{margin:0 0 14px}
article ul{padding-left:1.3em;margin:0 0 14px}
.pair{border-left:4px solid var(--line);border-radius:4px;padding:8px 12px 2px;margin:0 0 12px;background:var(--card)}
.pair.N{border-color:var(--n);background:var(--nb)}
.pair.L{border-color:var(--l);background:var(--lb)}
.plabel{font-size:.8rem;font-weight:700;color:var(--muted);margin-bottom:2px}
.pair.N .plabel{color:var(--n)}.pair.L .plabel{color:var(--l)}
.lh{font-size:.85rem;color:var(--l);margin:-4px 0 8px}
.tw{overflow-x:auto;margin:0 0 14px}
table{border-collapse:collapse;font-size:.92rem;width:100%;line-height:1.6}
th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{background:var(--th)}
@media (max-width:640px){
  body{font-size:17px}
  .tw{overflow:visible}
  table,tbody,tr,td{display:block;width:100%}
  thead{display:none}
  tr{border:1px solid var(--line);border-radius:8px;margin:0 0 10px;padding:6px 10px;background:var(--card)}
  td{border:0;padding:3px 0}
  td::before{content:attr(data-l);display:block;font-size:.78rem;color:var(--muted);font-weight:700}
  td:first-child{font-weight:700}
  td:first-child::before{display:none}
  table.kv tr{padding:6px 10px}
  table.kv td::before{display:none}
  table.kv td:first-child{font-size:.82rem;color:var(--muted)}
}
</style></head><body>
<div class="top">
<h1 class="t">新潤稿流程試跑</h1>
<p class="note">「逐節對照」把新流程和上線版一節一節排在一起，手機上最好比。上線版之後還修過事實（例如營業時間），事實不同的地方不算潤稿的差別。延伸資料與資料來源沒列。</p>
</div>
<div class="bar">
<div class="row" id="arts">${arts.map(([id, n], i) => `<button data-a="${id}"${i ? '' : ' class="on"'}>${n}</button>`).join('')}</div>
<div class="row" id="vers">${vbtn.map(([k, l], i) => `<button data-v="${k}"${i ? '' : ' class="on"'}>${l}</button>`).join('')}</div>
</div>
<main>
${sections}
</main>
<script>
let A='${arts[0][0]}', V='P';
function draw(){
  document.querySelectorAll('.art').forEach(e=>e.classList.toggle('on',e.dataset.a===A));
  document.querySelectorAll('.col').forEach(e=>e.classList.toggle('on',e.dataset.v===V));
  document.querySelectorAll('#arts button').forEach(b=>b.classList.toggle('on',b.dataset.a===A));
  document.querySelectorAll('#vers button').forEach(b=>b.classList.toggle('on',b.dataset.v===V));
}
document.getElementById('arts').onclick=e=>{const b=e.target.closest('button');if(!b)return;A=b.dataset.a;draw();scrollTo(0,0);};
document.getElementById('vers').onclick=e=>{const b=e.target.closest('button');if(!b)return;V=b.dataset.v;draw();scrollTo(0,0);};
draw();
</script></body></html>`;
fs.writeFileSync('view.html', html);
console.log('ok', html.length);
