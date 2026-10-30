import fs from 'fs';
const outlines=['hokkaido-wakkanai-outline.json','hokkaido-asahikawa-outline.json'].map(f=>JSON.parse(fs.readFileSync('content-planning/hokkaido/'+f)));
const pages=outlines.flatMap(o=>o.pages);
const rows=[];
for(const p of pages){
  const dir='content-production/'+p.articleId;
  const f=['reader-preview.md'].map(x=>dir+'/'+x).find(fs.existsSync);
  if(!f){rows.push({id:p.articleId,missing:true});continue;}
  const md=fs.readFileSync(f,'utf8');
  const pub=fs.existsSync(dir+'/publication.json')?JSON.parse(fs.readFileSync(dir+'/publication.json')):{};
  const lines=md.split('\n');
  const heads=lines.filter(l=>/^#{1,3} /.test(l)).map(l=>({lv:l.match(/^#+/)[0].length,t:l.replace(/^#+ /,'')}));
  const h1=heads.find(h=>h.lv===1)?.t;
  const h2=heads.filter(h=>h.lv===2&&!['延伸資料','資料來源','常見問題'].includes(h.t));
  const h3=heads.filter(h=>h.lv===3);
  // body paras before first H2
  const firstH2=lines.findIndex(l=>/^## /.test(l));
  const intro=lines.slice(0,firstH2).filter(l=>l.trim()&&!l.startsWith('#')&&!l.startsWith('!')).join('');
  const body=md.split(/\n## 延伸資料|\n## 資料來源/)[0];
  const chars=body.replace(/[#|\-\s\[\]\(\)!*`>]/g,'').replace(/https?:\S+/g,'').length;
  const pq=p.primaryQuery;
  const sq=p.secondaryQueries||[];
  const inHeads=q=>heads.some(h=>h.t.includes(q));
  const glued=heads.filter(h=>h.lv>1 && sq.concat(pq).some(q=>h.t.startsWith(q+'，')||h.t.startsWith(q+'、')));
  const outlineH=p.headings.map(h=>h.text);
  const actualH=heads.filter(h=>h.lv>1&&!['延伸資料','資料來源','常見問題'].includes(h.t)).map(h=>h.t);
  const same=outlineH.length===actualH.length && outlineH.every((t,i)=>t===actualH[i]);
  rows.push({id:p.articleId,type:p.pageType,pq,h1,seoTitle:pub.seoTitle, titleLen:(pub.seoTitle||'').length,descLen:(pub.seoDescription||'').length,
    pqInH1:!!h1?.includes(pq), pqInIntro:intro.includes(pq), sqMissingHead:sq.filter(q=>!inHeads(q)), sqMissingBody:sq.filter(q=>!body.includes(q)),
    nH2:h2.length,nH3:h3.length, glued:glued.map(h=>h.t), chars, outlineMatch:same, faq:heads.some(h=>h.t==='常見問題'),
    qHeads:heads.filter(h=>/？$/.test(h.t)).length,
    h2StartsPlace:h2.filter(h=>h.t.startsWith(pq.replace(/(住宿|交通|景點|美食|天氣|健行|登山|祭典).*/,''))).length});
}
console.log(JSON.stringify(rows,null,0).replace(/\},\{/g,'},\n{'));
