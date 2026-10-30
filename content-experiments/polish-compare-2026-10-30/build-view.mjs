// 產生 view.html：三篇文章的潤稿前、A、B、C 全文，可切換或並排。用法：node build-view.mjs（在本資料夾執行）
import fs from 'node:fs';
const arts = [
  ['asahikawa-transport', '旭川交通'],
  ['rebun-island-sights', '禮文島景點'],
  ['rishiri-island-stay', '利尻島住宿'],
];
const vers = [
  ['A', 'A 現行流程', 'A.md'],
  ['B', 'B Opus 看範例', 'B-fixed.md'],
  ['C', 'C Gemini', 'C-fixed.md'],
  ['in', '潤稿前', 'input.md'],
];
// 盲測分數（好讀／像AI），評審1 Fable、評審2 Opus
const scores = {
  'asahikawa-transport': { A: [82, 30, 82, 30], B: [72, 45, 78, 35], C: [55, 60, 65, 45] },
  'rebun-island-sights': { A: [80, 30, 80, 32], B: [66, 48, 70, 42], C: [70, 45, 74, 40] },
  'rishiri-island-stay': { A: [84, 28, 82, 28], B: [64, 50, 70, 40], C: [72, 62, 62, 58] },
};
const drift = {
  'asahikawa-transport': { B: '0 處不可接受、2 處遺失（時刻表出處），已修', C: '1 處不可接受、2 處遺失（一段斷掉、兩句內連句不見），已修' },
  'rebun-island-sights': { B: '1 處不可接受（地圖標示寫成斷言），已修', C: '12 處不可接受、4 處遺失（拿掉出處、H1 不見），已修' },
  'rishiri-island-stay': { B: '沒有', C: '13 處不可接受（加「主要」「目前」「是個好選擇」等），已修' },
};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
function md(t) {
  t = t.replace(/\r/g, '').split(/\n## 延伸資料/)[0].trim();
  return t.split(/\n\n+/).map(b => {
    const h = b.match(/^(#{1,4})\s+(.*)$/);
    if (h) return `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`;
    if (b.startsWith('|')) {
      const rows = b.split('\n').filter(r => !/^\|[-\s|]+\|$/.test(r)).map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
      return `<div class="tw"><table><thead><tr>${rows[0].map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    if (/^- /.test(b)) return `<ul>${b.split('\n').map(l => `<li>${inline(l.replace(/^- /, ''))}</li>`).join('')}</ul>`;
    return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
}
let sections = '';
for (const [id, name] of arts) {
  let cols = '';
  for (const [k, label, f] of vers) {
    const s = scores[id][k];
    const meta = s ? `<div class="meta">好讀 ${s[0]}／${s[2]}　像AI ${s[1]}／${s[3]}${drift[id][k] ? `<br>意思被改：${drift[id][k]}` : k === 'A' ? '<br>意思被改：當初流程已修' : ''}</div>` : '<div class="meta">沒有潤過的內容稿，給你對照用</div>';
    cols += `<section class="col v-${k}" data-v="${k}"><div class="colhead"><span class="tag ${k}">${label}</span>${meta}</div><article lang="zh-Hant">${md(fs.readFileSync(`${id}/${f}`, 'utf8'))}</article></section>`;
  }
  sections += `<div class="art" data-a="${id}"><div class="cols">${cols}</div></div>`;
}
const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>潤稿三版對照</title>
<style>
:root{--bg:#fbfaf7;--fg:#1f1e1c;--muted:#6b6862;--line:#e4e1da;--card:#fff;--a:#15803d;--b:#1d4ed8;--c:#b45309;--in:#6b6862;--th:#f3f1ec}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#171614;--fg:#ebe8e2;--muted:#a19d95;--line:#33312d;--card:#1f1e1b;--a:#4ade80;--b:#93c5fd;--c:#fbbf24;--in:#a19d95;--th:#26241f}}
:root[data-theme=dark]{--bg:#171614;--fg:#ebe8e2;--muted:#a19d95;--line:#33312d;--card:#1f1e1b;--a:#4ade80;--b:#93c5fd;--c:#fbbf24;--in:#a19d95;--th:#26241f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.8 "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif}
header{position:sticky;top:0;z-index:2;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 16px}
h1.t{font-size:1.15rem;margin:0 0 8px}
.bar{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}
.bar button{font:inherit;font-size:.9rem;padding:4px 12px;border-radius:999px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
.bar button.on{border-color:var(--fg);font-weight:700}
.note{color:var(--muted);font-size:.85rem;margin:4px 0 0}
main{padding:12px 16px 64px;max-width:1500px;margin:0 auto}
.art{display:none}.art.on{display:block}
.cols{display:grid;gap:20px;grid-template-columns:1fr}
.col{display:none;min-width:0}.col.on{display:block}
body.side .cols{grid-template-columns:repeat(var(--n),minmax(0,1fr))}
.colhead{position:sticky;top:var(--hh,110px);background:var(--bg);padding:6px 0;border-bottom:2px solid var(--line);z-index:1}
.tag{font-weight:700}.tag.A{color:var(--a)}.tag.B{color:var(--b)}.tag.C{color:var(--c)}.tag.in{color:var(--in)}
.meta{font-size:.82rem;color:var(--muted);line-height:1.5}
article h2{font-size:1.35rem;margin:18px 0 8px}article h3{font-size:1.15rem;margin:22px 0 6px}article h4{font-size:1rem;margin:18px 0 4px}
article p{margin:0 0 12px}
.tw{overflow-x:auto;margin:0 0 14px}table{border-collapse:collapse;font-size:.88rem;width:100%}th,td{border:1px solid var(--line);padding:4px 8px;text-align:left;vertical-align:top}th{background:var(--th)}
.summary{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin:0 0 16px;font-size:.92rem}
.summary ul{margin:6px 0 0;padding-left:1.2em}
@media (max-width:760px){.sidebtn{display:none}body.side .cols{grid-template-columns:1fr}}
</style></head><body>
<header>
<h1 class="t">潤稿三版對照</h1>
<div class="bar" id="arts">${arts.map(([id, n], i) => `<button data-a="${id}"${i ? '' : ' class="on"'}>${n}</button>`).join('')}</div>
<div class="bar" id="vers">${vers.map(([k, l], i) => `<button data-v="${k}"${i ? '' : ' class="on"'}>${l}</button>`).join('')}<button class="sidebtn" id="side">並排 A／B／C</button></div>
<p class="note">分數是兩位盲測評審（Fable／Opus）給的。B、C 是意思修回來之後的版本。延伸資料與資料來源沒列。</p>
</header>
<main>
<div class="summary"><strong>盲測結果：A 現行流程三篇都第一。</strong><ul><li>A：好讀平均 82、像AI 30</li><li>B Opus 看範例：好讀 70、像AI 43，事實守得好</li><li>C Gemini：好讀 66、像AI 52，意思被改最多</li></ul></div>
${sections}
</main>
<script>
let A='${arts[0][0]}', V=['A'], side=false;
const hdr=document.querySelector('header');
function draw(){
  document.querySelectorAll('.art').forEach(e=>e.classList.toggle('on',e.dataset.a===A));
  document.querySelectorAll('.col').forEach(e=>e.classList.toggle('on',V.includes(e.dataset.v)));
  document.querySelectorAll('#arts button').forEach(b=>b.classList.toggle('on',b.dataset.a===A));
  document.querySelectorAll('#vers button[data-v]').forEach(b=>b.classList.toggle('on',V.includes(b.dataset.v)));
  document.getElementById('side').classList.toggle('on',side);
  document.body.classList.toggle('side',side);
  document.documentElement.style.setProperty('--n',V.length);
  document.documentElement.style.setProperty('--hh',hdr.offsetHeight+'px');
}
document.getElementById('arts').onclick=e=>{const b=e.target.closest('button');if(!b)return;A=b.dataset.a;scrollTo(0,0);draw();};
document.getElementById('vers').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.id==='side'){side=!side;V=side?['A','B','C']:['A'];}
  else{side=false;V=[b.dataset.v];}
  draw();};
addEventListener('resize',draw);draw();
</script></body></html>`;
fs.writeFileSync('view.html', html);
console.log('ok', html.length);
