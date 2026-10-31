// 產生 view.html：旭山動物園「先讀競品再寫」試寫，跟上線版與舊初稿一節一節對照，手機好讀。
// 用法：node build-view.mjs（在本資料夾執行）
import fs from 'node:fs';
const arts = [['asahiyama-zoo', '旭山動物園'], ['sounkyo-stay', '層雲峽住宿'], ['wakkanai-food', '稚內美食']].filter(([d]) => fs.existsSync(`${d}/draft-only/reader-preview.md`));
let dir = arts[0][0];
const read = f => fs.readFileSync(`${dir}/${f}`, 'utf8');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const attr = s => esc(s.replace(/\*\*/g, '')).replace(/"/g, '&quot;');

function block(b) {
  const h = b.match(/^(#{1,4})\s+(.*)$/);
  if (h) return `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`;
  if (b.startsWith('|')) {
    const rows = b.split('\n').filter(r => !/^\|[-\s|:]+\|$/.test(r)).map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    const head = rows[0];
    return `<div class="tw"><table${head.length === 2 ? ' class="kv"' : ''}><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map((c, i) => `<td data-l="${attr(head[i] || '')}">${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  if (/^- /.test(b)) return `<ul>${b.split('\n').map(l => `<li>${inline(l.replace(/^- /, ''))}</li>`).join('')}</ul>`;
  return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
}
const blocks = t => t.replace(/\r/g, '').split(/\n## (延伸資料|資料來源)/)[0].trim().split(/\n\n+/);
const md = t => blocks(t).map(block).join('\n');
function sectionsOf(t) {
  const out = [];
  for (const b of blocks(t)) {
    const isH = /^#{1,4}\s/.test(b);
    if (isH || !out.length) out.push({ head: isH ? b : '', body: [] });
    if (!isH) out.at(-1).body.push(b);
  }
  return out;
}
// 一節一節交錯：a 是新寫法（綠），b 是對照組（藍）
function paired(aFile, bFile, aLabel, bLabel) {
  const a = sectionsOf(read(aFile));
  const b = sectionsOf(read(bFile));
  return a.map((s, i) => {
    const t = b[i] || { head: '', body: [] };
    const head = s.head ? block(s.head) : '';
    const otherHead = t.head && t.head !== s.head ? `<div class="lh">${bLabel}標題：${inline(t.head.replace(/^#+\s*/, ''))}</div>` : '';
    return `${head}${otherHead}<div class="pair N"><div class="plabel">${aLabel}</div>${s.body.map(block).join('')}</div><div class="pair L"><div class="plabel">${bLabel}</div>${t.body.map(block).join('')}</div>`;
  }).join('\n');
}

const viewsFor = () => [
  ['P1', '成品對照', `新寫法（讀競品＋潤稿）是綠色，目前上線版是藍色。`, paired('reader-preview.md', 'live.md', '新寫法', '上線版')],
  ['P2', '初稿對照', `兩位作者還沒潤稿前的樣子：綠色讀過競品，藍色沒讀（當初的初稿，事實是舊的）。語順的差別在這裡最明顯。`, paired('draft-only/reader-preview.md', 'old-draft.md', '讀競品的初稿', '舊初稿')],
  ['P3', '先刪再調', `2026-10-31 照「先刪再調」再潤一次：綠色是這一版，藍色是上一版。刪掉讀者用不到的規格，用逗號接的句子寫出彼此的關係。`, fs.existsSync(`${dir}/v1/reader-preview.md`) ? paired('reader-preview.md', 'v1/reader-preview.md', '這一版', '上一版') : '<p>這篇還沒試。</p>'],
  ['N', '新寫法全文', '讀競品寫、再照新流程潤稿的成品。', md(read('reader-preview.md'))],
  ['L', '上線版全文', '目前網站上的版本。', md(read('live.md'))],
];
let mainHtml = '';
for (const [d] of arts) {
  dir = d;
  const notes = fs.existsSync(`${d}/summary.html`) ? fs.readFileSync(`${d}/summary.html`, 'utf8') : '';
  const cols = viewsFor().map(([k, , meta, body]) => `<section class="col" data-v="${k}"><div class="meta">${meta}</div><article lang="zh-Hant">${body}</article></section>`).join('\n');
  mainHtml += `<div class="art" data-a="${d}">${notes}${cols}</div>`;
}
const vlabels = [['P1', '成品對照'], ['P2', '初稿對照'], ['P3', '先刪再調'], ['N', '新寫法全文'], ['L', '上線版全文']];
const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>先讀競品再寫</title>
<style>
:root{--bg:#fbfaf7;--fg:#1f1e1c;--muted:#6b6862;--line:#e4e1da;--card:#fff;--n:#15803d;--nb:#eef7f0;--l:#1d4ed8;--lb:#eef2fb;--th:#f3f1ec}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#171614;--fg:#ebe8e2;--muted:#a19d95;--line:#33312d;--card:#1f1e1b;--n:#4ade80;--nb:#1a261d;--l:#93c5fd;--lb:#1b2130;--th:#26241f}}
:root[data-theme=dark]{--bg:#171614;--fg:#ebe8e2;--muted:#a19d95;--line:#33312d;--card:#1f1e1b;--n:#4ade80;--nb:#1a261d;--l:#93c5fd;--lb:#1b2130;--th:#26241f}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.9 "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif;-webkit-text-size-adjust:100%}
.top{padding:14px 16px 4px;max-width:760px;margin:0 auto}
h1.t{font-size:1.2rem;margin:0 0 6px}
.note{color:var(--muted);font-size:.9rem;line-height:1.6;margin:0 0 8px}
details{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:8px 12px;margin:0 0 8px;font-size:.92rem;line-height:1.7}
summary{font-weight:700;cursor:pointer}
details ul{padding-left:1.2em;margin:6px 0}
.bar{position:sticky;top:0;z-index:2;background:var(--bg);border-bottom:1px solid var(--line);padding:8px 16px}
.row{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;max-width:760px;margin:0 auto}
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
.plabel{font-size:.8rem;font-weight:700;margin-bottom:2px}
.pair.N .plabel{color:var(--n)}.pair.L .plabel{color:var(--l)}
.lh{font-size:.85rem;color:var(--l);margin:-4px 0 8px}
.tw{overflow-x:auto;margin:0 0 14px}
table{border-collapse:collapse;font-size:.92rem;width:100%;line-height:1.6}
th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{background:var(--th)}
@media (max-width:640px){
  .tw{overflow:visible}
  table,tbody,tr,td{display:block;width:100%}
  thead{display:none}
  tr{border:1px solid var(--line);border-radius:8px;margin:0 0 10px;padding:6px 10px;background:var(--card)}
  td{border:0;padding:3px 0}
  td::before{content:attr(data-l);display:block;font-size:.78rem;color:var(--muted);font-weight:700}
  td:first-child{font-weight:700}
  td:first-child::before{display:none}
  table.kv td::before{display:none}
  table.kv td:first-child{font-size:.82rem;color:var(--muted)}
}
</style></head><body>
<div class="top">
<h1 class="t">先讀競品再寫：試寫對照</h1>
<p class="note">作者動筆前先讀了排在前面的中文文章，只學他們先講什麼、後講什麼，事實照樣只用我們的事實表。標題是大綱定的，兩版一樣。延伸資料與資料來源沒列。</p>
</div>
<div class="bar"><div class="row" id="arts">${arts.map(([d, n], i) => `<button data-a="${d}"${i ? '' : ' class="on"'}>${n}</button>`).join('')}</div><div class="row" id="vers" style="margin-top:6px">${vlabels.map(([k, l], i) => `<button data-v="${k}"${i ? '' : ' class="on"'}>${l}</button>`).join('')}</div></div>
<main>
${mainHtml}
</main>
<script>
let V='P1', A='${arts[0][0]}';
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
