// 潤稿前準備：備份初稿到 draft-only/、複製 before-* 檔，並做一份換上新連結句的大綱（給 check-polish 核對連結句）。
// 用法：node prep-polish.mjs <文章資料夾名>（在本資料夾執行）
import fs from 'node:fs';
const a = process.argv[2];
const spec = JSON.parse(fs.readFileSync(`${a}/page-spec.json`, 'utf8'));
fs.mkdirSync(`${a}/draft-only`, { recursive: true });
for (const f of ['draft-tagged.md', 'reader-preview.md', 'publication.json']) fs.copyFileSync(`${a}/${f}`, `${a}/draft-only/${f}`);
fs.copyFileSync(`${a}/draft-tagged.md`, `${a}/before-draft-tagged.md`);
fs.copyFileSync(`${a}/reader-preview.md`, `${a}/before-reader-preview.md`);
const links = JSON.parse(fs.readFileSync(`${a}/link-sentences.json`, 'utf8'));
const outline = JSON.parse(fs.readFileSync(`../../${spec.outline}`, 'utf8'));
let n = 0;
for (const l of outline.links || []) {
  if (l.from !== a) continue;
  const m = links.find(x => x.to === l.to && (x.old === l.sentence || !x.old));
  if (m) { l.sentence = m.new; n++; }
}
fs.writeFileSync(`${a}/outline-test.json`, JSON.stringify(outline, null, 1));
console.log(a, 'links replaced', n, 'of', links.length);
