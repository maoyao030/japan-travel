import fs from 'node:fs';
const dir = process.argv[2];
// 用法：node build-compare.mjs <本資料夾>。逐段比對上線版與 Gemini 版，產生 compare.html。
const sp = f => fs.readFileSync(dir + '/' + f, 'utf8').replace(/\r/g, '').trim().split(/\n\n+/).map(s => s.replace(/\*\*/g, ''));
const a = sp('current-live-body.md'), b = sp('gemini-3.1-pro.md');
const pairs = a.map((p, i) => [p, b[i]]);
const notes = {
  1:['ok','語序調整，把「最北端」與「最北點」併成一句，順。'],
  2:['ok','加「的話」、拿掉一個逗號，差別不大。'],
  4:['bad','拿掉「稚內市觀光手冊」這個依據，30分鐘、1小時變成「大約抓」「大約排」，多了原文沒有的「大約」，官方建議時間變成編輯自己的估計。'],
  7:['ok','加「的話」「搭」，差別不大。'],
  8:['better','「搭9:30去一路待到」「錯過15:20的末班車當天就沒有」少了逗號，一口氣讀完，不像條文。'],
  10:['ok','加「的話」。'],
  13:['ok','兩句併一句。'],
  15:['better','「冬天開車的話路上時間最好多抓一點」少一個逗號，比較像說話。'],
  17:['ok','活動名稱加上「」，比較好認。'],
  18:['better','最後兩句併成「想確認2027年的…可以到…或到…」，也補清楚休息的是案內所。'],
  19:['better','「跨年夜到元旦清晨岬上會降到」少一個逗號，讀起來順。'],
  22:['better','「搭9:30去一路待到15:20末班車的話」比「從9:30待到15:20的末班車」清楚。'],
  24:['bad','同第4段：拿掉手冊依據，地碑10分鐘加上「大約抓」。'],
  28:['ok','三句併兩句，句子變長。'],
  33:['better','「1966年12月啟用的宗谷岬公園面積約3.8公頃」把年份收進名詞前面，一句講完；燈塔改成「高台上有座…」比較口語。'],
  34:['ok','拿掉一個逗號。'],
  35:['ok','拿掉一個逗號。'],
  37:['ok','兩句併一句。'],
  39:['ok','句子比較完整，但「開放時間為」有一點公文味。'],
  40:['bad','「這裡能拿到的最北端證明書有兩種」：四極證明書是在市役所、宗谷支所、案內所領，不是在流冰館（這裡）拿，意思錯了；也拿掉「名稱很像」。'],
  43:['ok','調換順序，先講位置再講功能。'],
  44:['bad','「要出示護照之類的身分證件」變成「出示…就可以了」，必要條件被寫成「這樣就夠」，多了原文沒有的保證。'],
  50:['ok','把走路時間移到前面。'],
  53:['better','「全長約3公里的白色道路用…鋪成」把兩句併成一句，比較順。'],
  54:['bad','「要從宗谷岬那頭進去」拿掉「要」，規定變成像選項。'],
  57:['ok','拿掉兩個逗號。'],
};
const label = {bad:'意思被改', worse:'變難讀', ok:'差不多', better:'改得好'};
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function diff(a, b) {
  const A=[...a], B=[...b], n=A.length, m=B.length;
  const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  let i=0,j=0,L='',R='';
  while(i<n&&j<m){ if(A[i]===B[j]){L+=esc(A[i]);R+=esc(B[j]);i++;j++;} else if(dp[i+1][j]>=dp[i][j+1]){L+='<del>'+esc(A[i++])+'</del>';} else {R+='<ins>'+esc(B[j++])+'</ins>';} }
  while(i<n)L+='<del>'+esc(A[i++])+'</del>'; while(j<m)R+='<ins>'+esc(B[j++])+'</ins>';
  return [L.replace(/<\/del><del>/g,''), R.replace(/<\/ins><ins>/g,'')];
}
const counts = {bad:0,worse:0,ok:0,better:0};
let rows = '';
pairs.forEach(([a,b],i)=>{
  const changed = a!==b;
  if(!changed){ rows += `<div class="row same"><div class="cell" lang="zh-Hant">${esc(a).replace(/\n/g,'<br>')}</div><div class="cell" lang="zh-Hant">${esc(b).replace(/\n/g,'<br>')}</div></div>`; return; }
  const [k,t] = notes[i] || ['ok','']; counts[k]++;
  const [L,R] = diff(a,b);
  rows += `<div class="row changed ${k}"><div class="note"><span class="tag ${k}">${label[k]}</span>${esc(t)}</div><div class="cell">${L}</div><div class="cell">${R}</div></div>`;
});
const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gemini 潤稿比較</title>
<style>
:root{--bg:#fbfaf7;--fg:#1f1e1c;--muted:#6b6862;--line:#e4e1da;--card:#fff;--del:#fde2df;--delfg:#9b1c12;--ins:#dcf3e2;--insfg:#14632f;--bad:#c2410c;--worse:#a16207;--ok:#6b6862;--better:#15803d}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#171614;--fg:#ebe8e2;--muted:#a19d95;--line:#33312d;--card:#1f1e1b;--del:#4a1f1b;--delfg:#ffb4aa;--ins:#173a24;--insfg:#9be4b1;--bad:#fb923c;--worse:#facc15;--ok:#a19d95;--better:#4ade80}}
:root[data-theme=dark]{--bg:#171614;--fg:#ebe8e2;--muted:#a19d95;--line:#33312d;--card:#1f1e1b;--del:#4a1f1b;--delfg:#ffb4aa;--ins:#173a24;--insfg:#9be4b1;--bad:#fb923c;--worse:#facc15;--ok:#a19d95;--better:#4ade80}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.75 "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif}
main{max-width:1180px;margin:0 auto;padding:28px 16px 64px}h1{font-size:1.6rem;margin:0 0 4px}p.sub{color:var(--muted);margin:0 0 20px}
.summary{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 20px;margin-bottom:20px}.summary ul{margin:8px 0 0;padding-left:1.2em}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin:14px 0}.stat{border:1px solid var(--line);border-radius:8px;padding:6px 12px;background:var(--card)}
.controls{margin:12px 0 18px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.head,.row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.head{position:sticky;top:0;background:var(--bg);padding:8px 0;font-weight:700;border-bottom:2px solid var(--line);z-index:1}
.row{padding:12px 0;border-bottom:1px solid var(--line)}.cell{white-space:pre-wrap;word-break:break-word;min-width:0}.same .cell{color:var(--muted);font-size:.92rem}
body.only-changed .same{display:none}
.note{grid-column:1/-1;font-size:.92rem}.tag{display:inline-block;font-weight:700;margin-right:8px;padding:0 8px;border-radius:4px;border:1px solid currentColor}
.tag.bad{color:var(--bad)}.tag.worse{color:var(--worse)}.tag.ok{color:var(--ok)}.tag.better{color:var(--better)}
.row.bad{border-left:4px solid var(--bad);padding-left:10px}
del{background:var(--del);color:var(--delfg);text-decoration:line-through}ins{background:var(--ins);color:var(--insfg);text-decoration:none}
@media (max-width:700px){.head,.row{grid-template-columns:1fr}.head{display:none}.cell:nth-of-type(2)::before{content:"上線版";display:block;font-size:.8rem;color:var(--muted)}.cell:nth-of-type(3)::before{content:"Gemini 3.1 Pro";display:block;font-size:.8rem;color:var(--muted)}}
</style></head><body class="only-changed"><main>
<h1>宗谷岬頁 Gemini 潤稿比較</h1>
<p class="sub">2026-10-29 測試。左邊是目前上線版（Opus 5.5 潤過、驗收過），右邊是 Gemini 3.1 Pro 拿上線版、照同一份潤稿規則再潤一次的結果。</p>
<div class="summary"><strong>結論：Gemini 讀起來比上線版順，有 7 段改得好；但有 5 處改掉了意思，直接用不行，一定要接意義比對。</strong>
<ul>
<li>60 段裡改了 26 段，大多是在句子裡加「的話」、拿掉逗號、調換語序。數字、時間、價格、標題、表格與連到別頁的句子都沒動（本站 check-polish 與 check-voice 都通過）。</li>
<li>5 處意思被改：拿掉「稚內市觀光手冊」這個依據並加上原文沒有的「大約」（2 處）、把四極證明書寫成在流冰館拿、把「要出示證件」寫成「出示就可以了」、把「要從宗谷岬那頭進去」的「要」拿掉。這 5 處都違反提示裡寫明的規則。</li>
<li>逗號少了 10 個、修飾語收到名詞前面，句子比較像真人在說話，這和本站 10/18 量的真人文章方向一致（真人逗號比我們的稿少）。「的話」從 0 次變 12 次，有點多。</li>
<li>改得好的 7 段大多是少了逗號、兩句併一句；另外元旦接駁巴士的詢問處、從早待到末班車的午餐兩段講得比原本清楚。</li><li>2026-10-29 修正：原本把少逗號的 6 段判成「變難讀」，Darren 指出其實比較好讀；重看後 5 段改成「改得好」、1 段改成「差不多」。</li>
</ul></div>
<div class="stats"><span class="stat"><span class="tag bad">意思被改</span>${counts.bad} 段</span><span class="stat"><span class="tag worse">變難讀</span>${counts.worse} 段</span><span class="stat"><span class="tag ok">差不多</span>${counts.ok} 段</span><span class="stat"><span class="tag better">改得好</span>${counts.better} 段</span></div>
<div class="controls"><label><input type="checkbox" id="all"> 顯示沒改的段落</label><span style="color:var(--muted);font-size:.9rem"><del>紅色</del> 是 Gemini 拿掉的字，<ins>綠色</ins> 是 Gemini 加的字。</span></div>
<div class="head"><div>上線版</div><div>Gemini 3.1 Pro</div></div>
${rows}
</main><script>document.getElementById('all').addEventListener('change',e=>document.body.classList.toggle('only-changed',!e.target.checked));</script></body></html>`;
fs.writeFileSync(dir + '/compare.html', html);
console.log(counts);
