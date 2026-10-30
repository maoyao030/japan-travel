import fs from 'node:fs';
const arts=['asahikawa-transport','rebun-island-sights','rishiri-island-stay'];
const vers={input:'input.md',A:'A.md',B:'B-fixed.md',C:'C-fixed.md'};
const body=t=>t.replace(/\r/g,'').split(/\n## 延伸資料/)[0].split('\n').filter(l=>!/^(#|\|)/.test(l)).join('\n').replace(/\*\*/g,'');
const cnt=(t,re)=>(t.match(re)||[]).length;
const rows=[];
for(const [v,f] of Object.entries(vers)){ let L=0,c=0,d=0,s=0,y=0,se=0;
 for(const a of arts){const t=body(fs.readFileSync(`${a}/${f}`,'utf8')); const n=t.replace(/\s/g,'').length; L+=n; c+=cnt(t,/，/g); d+=cnt(t,/的話/g); s+=cnt(t,/所以/g); y+=cnt(t,/(?<![想主需只重不])要/g); se+=cnt(t,/[。？！]/g);}
 rows.push({版本:v,正文字數:L,'逗號/千字':(c/L*1000).toFixed(1),'句子平均字數':(L/se).toFixed(1),'的話/千字':(d/L*1000).toFixed(1),'所以':s,'要/千字':(y/L*1000).toFixed(1)});}
console.table(rows);
