// 修飾詞前後對照：逐節比對潤稿前後「要、可能、約、只、都…」這類會改變意思的詞，次數變了就列出那一節的句子。
// 用法：node check-modifiers.mjs <潤稿前.md> <潤稿後.md>
// 結束碼：有差異 1，沒有 0。只給意義比對當線索，不擋發布（現行潤稿會刻意改掉提醒語氣的「要」，次數變了不一定是錯）。
import fs from 'node:fs';

const GROUPS = {
  '必要（要／必須／需要）': /(?<![想主需只重不還總])要(?!不要|是|點|求)|必須|需要/g,
  '可能': /可能/g,
  '約略（約／大約／左右）': /約|左右/g,
  '限定（只／只有／唯一）': /只(?!要)|唯一/g,
  '全部（都／每天／每班）': /都|每天|每班|全年/g,
  '原則上／一般／主要': /原則上|一般|主要|通常/g,
  '建議': /建議/g,
  '保證（一定／就可以／就好／就夠）': /一定|就可以|就好|就夠|就行/g,
  '數量（很多／不少／大部分）': /很多|不少|大部分|大多/g,
};

const read = f => fs.readFileSync(f, 'utf8').replace(/\r/g, '').replace(/\*\*/g, '').replace(/[［\[]F\d+[］\]]/g, '');

function sections(text) {
  const out = [];
  let cur = { title: '（開頭）', body: [] };
  for (const line of text.split('\n')) {
    if (/^#{1,6}\s/.test(line)) { out.push(cur); cur = { title: line.replace(/^#+\s*/, ''), body: [] }; }
    else cur.body.push(line);
  }
  out.push(cur);
  return out.map(s => ({ title: s.title, text: s.body.join('\n') }));
}

const sentences = t => t.split(/(?<=[。！？\n])/).map(s => s.trim()).filter(Boolean);
const count = (t, re) => (t.match(re) || []).length;

const [beforeFile, afterFile] = process.argv.slice(2);
if (!beforeFile || !afterFile) { console.error('用法：node check-modifiers.mjs <潤稿前.md> <潤稿後.md>'); process.exit(2); }
const B = sections(read(beforeFile)), A = sections(read(afterFile));
const aByTitle = new Map(A.map(s => [s.title, s]));

let issues = 0;
for (const b of B) {
  const a = aByTitle.get(b.title);
  if (!a) { console.log(`\n■ 找不到這一節：${b.title}`); issues++; continue; }
  for (const [name, re] of Object.entries(GROUPS)) {
    const nb = count(b.text, re), na = count(a.text, re);
    if (nb === na) continue;
    issues++;
    console.log(`\n■ ${b.title}｜${name}：潤稿前 ${nb} 次 → 潤稿後 ${na} 次`);
    const hit = s => { re.lastIndex = 0; return re.test(s); };
    for (const s of sentences(b.text).filter(hit)) console.log(`  前：${s}`);
    for (const s of sentences(a.text).filter(hit)) console.log(`  後：${s}`);
  }
}
console.log(issues ? `\n共 ${issues} 處次數不同，逐一確認意思有沒有變。` : '修飾詞次數前後一致。');
process.exit(issues ? 1 : 0);
