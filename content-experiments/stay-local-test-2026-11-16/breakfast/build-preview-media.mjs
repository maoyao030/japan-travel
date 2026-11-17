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
writeFileSync(join(here, 'preview-media.html'), html);
console.log(`嵌入 ${plan.embeds.length} 則`);
