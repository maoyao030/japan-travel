// 測試用：把 preview.html 加上封面（外連維基共享資源，不下載）與 Instagram 嵌入（官方 embed 網址）。不改 final.md。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const plan = JSON.parse(readFileSync(join(here, 'embed-plan.json'), 'utf8'));
let html = readFileSync(join(here, 'preview.html'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
for (const e of plan.embeds) {
  const hs = [e.placement.heading, e.placement.heading.replace(/'/g, '&#039;'), e.placement.heading.replace(/'/g, '&#x27;'), e.placement.heading.replace(/'/g, '&apos;')];
  const h = Math.max(...hs.map((x) => html.indexOf(`>${x}</h3>`)));
  if (h < 0) throw new Error(`找不到標題：${e.placement.heading}`);
  let at = h;
  for (let i = 0; i < e.placement.afterBlocks; i++) at = html.indexOf('</p>', at) + 4;
  const who = e.channelType === 'official' ? '飯店官方' : '住客';
  const block = `<figure style="margin:1.25rem auto;max-width:420px"><iframe src="${e.url}embed/" loading="lazy" style="width:100%;height:560px;border:1px solid #ddd;border-radius:8px" allowtransparency="true"></iframe><figcaption style="font-size:.9rem;color:#555;margin-top:.4rem">${esc(e.captionDraft)}Instagram：${esc(e.channelName)}（${who}，${e.publishedAt.slice(0, 4)}年）・實際資訊以本文為準</figcaption></figure>`;
  html = html.slice(0, at) + block + html.slice(at);
}
const c = plan.cover;
const cover = `<figure style="margin:0 0 1.25rem"><img src="https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(c.file)}?width=1200" alt="${esc(c.alt)}" style="width:100%;border-radius:8px"><figcaption style="font-size:.85rem;color:#666">${esc(c.alt)}（${c.source}，${c.license}）</figcaption></figure>`;
html = html.replace('<div class="article-body">', cover + '<div class="article-body">');
// 資料來源：收成一塊小字、可展開的區塊；更新日期放在最下面一行小字（Darren 2026-11-17：資料來源的 UI 要調整）
html = html.replace(/<h2 id="[^"]*">資料來源<\/h2><ul>([\s\S]*?)<\/ul><p>(資料更新：[^<]*)<\/p>/, (m, items, updated) => {
  const n = (items.match(/<li>/g) || []).length;
  const links = items.replace(/<li>/g, '').replace(/<\/li>/g, '').replace(/官網<\/a>/g, '</a>').replace(/<\/a><a/g, '</a><span>・</span><a');
  return `<aside class="src-box"><p class="src-updated">${updated}</p><details><summary>資料來源：${n} 間飯店的官方網站</summary><p class="src-links">${links}</p></details></aside>`;
});
html = html.replace('</style>', `.src-box{margin:2.5rem 0 0;padding:1rem 1.1rem;border-top:1px solid #ddd;font-size:.88rem;color:#666;line-height:1.9}
.src-box p{margin:0;font-size:inherit}.src-box summary{cursor:pointer;color:#444}.src-box a{color:#666}.src-links{margin-top:.5rem!important}.src-links span{color:#bbb}</style>`);
writeFileSync(join(here, 'preview-media.html'), html);
console.log(`嵌入 ${plan.embeds.length} 則`);
