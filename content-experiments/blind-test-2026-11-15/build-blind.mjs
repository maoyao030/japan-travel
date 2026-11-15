/**
 * 把 out/ 裡的改寫做成一頁盲測：每一組只變一個因素，順序打亂、只標編號。
 * Darren 在每一組點「最好讀」與「也可以」，頁面最下面會產生一串結果讓他貼回對話。
 * 編號對應哪一組設定，寫在 blind-key.json（頁面裡沒有）。
 *
 * 用法：node content-experiments/blind-test-2026-11-15/build-blind.mjs <輸出.html>
 */
import {existsSync, readFileSync, writeFileSync} from 'node:fs'
import path from 'node:path'

import {parseMarkdownBody} from '../../scripts/markdown-to-portable-text.mjs'
import {renderPortableText} from '../../src/lib/portableText.ts'

const here = import.meta.dirname
const root = path.resolve(here, '..', '..')
const out = process.argv[2]
if (!out) throw new Error('要給輸出檔路徑')
const {configs} = JSON.parse(readFileSync(path.join(here, 'key.json'), 'utf8'))
const code = (model, effort, rule) => configs.find((c) => c.model === model && c.effort === effort && c.rule === rule)?.code

// 固定種子的亂數，重跑順序不變
let seed = 20261115
const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const shuffle = (list) => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const QUESTIONS = [
  {id: 1, name: '第一題', ask: '想泡溫泉或大浴場，選哪幾間？（住宿頁「依需求選」的一節）'},
  {id: 2, name: '第二題', ask: 'OMO7旭川（介紹一間飯店的段落）'},
]
const FACTORS = [
  {
    id: 'rule',
    title: '寫法',
    note: '同一個模型、同樣的思考程度，只換給它的寫法規則。',
    codes: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'].map((rule) => code('sonnet', 'medium', rule)),
  },
  {
    id: 'model',
    title: '模型',
    note: '同樣的規則（自由發揮）、同樣的思考程度，只換模型。',
    codes: [code('sonnet', 'medium', 'R1'), code('opus', 'medium', 'R1'), code('opus-4.6', 'medium', 'R1'), code('fable', 'medium', 'R1')],
  },
  {
    id: 'effortS',
    title: '思考程度（甲模型）',
    note: '同一個模型、同樣的規則（自由發揮），只換思考程度。',
    codes: ['low', 'medium', 'high', 'max'].map((effort) => code('sonnet', effort, 'R1')),
  },
  {
    id: 'effortO',
    title: '思考程度（乙模型）',
    note: '另一個模型、同樣的規則（自由發揮），只換思考程度。',
    codes: ['low', 'medium', 'high', 'max'].map((effort) => code('opus', effort, 'R1')),
  },
]

const sections = (file) => {
  const text = readFileSync(file, 'utf8')
  const parts = text.split(/^## 第[一二]題\s*$/m)
  if (parts.length !== 3) throw new Error(`${file} 沒有分成兩題`)
  return [parts[1].trim(), parts[2].trim()]
}
const count = (markdown) => markdown.replace(/[\s|*#>\-`]/g, '').length
// 網站的表格格子目前不支援粗體，會把 ** 原樣印出來；盲測時先轉成粗體，免得有用表格的版本吃虧
const render = (markdown) =>
  renderPortableText(parseMarkdownBody(`# x\n\n${markdown}`).blocks).replace(/<t([dh])([^>]*)>([\s\S]*?)<\/t\1>/g, (cell, tag, attributes, inner) => `<t${tag}${attributes}>${inner.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</t${tag}>`)

const groups = []
const key = []
let groupNumber = 0
const missing = new Set()
for (const factor of FACTORS) {
  for (const question of QUESTIONS) {
    groupNumber += 1
    const available = factor.codes.filter((c) => {
      const ok = c && existsSync(path.join(here, 'out', `${c}.md`))
      if (!ok) missing.add(c)
      return ok
    })
    const order = shuffle(available)
    const letters = 'ABCDEFGH'
    const cards = order.map((c, index) => {
      const markdown = sections(path.join(here, 'out', `${c}.md`))[question.id - 1]
      key.push({group: groupNumber, letter: letters[index], code: c, factor: factor.id, question: question.id})
      return {letter: letters[index], html: render(markdown), chars: count(markdown)}
    })
    groups.push({number: groupNumber, factor, question, cards})
  }
}
writeFileSync(path.join(here, 'blind-key.json'), `${JSON.stringify(key, null, 1)}\n`)

const css = readFileSync(path.join(root, 'src/styles/global.css'), 'utf8')
const groupHtml = groups
  .map(
    (group) => `<section class="group" data-group="${group.number}">
<h2 class="group-title">第 ${group.number} 組｜比${group.factor.title}｜${group.question.name}</h2>
<p class="group-note">${group.factor.note}<br>題目：${group.question.ask}</p>
${group.cards
  .map(
    (card) => `<article class="card" data-letter="${card.letter}">
<header><span class="tag">${group.number}-${card.letter}</span><span class="chars">約 ${card.chars} 字</span>
<label><input type="radio" name="best-${group.number}" value="${card.letter}"> 最好讀</label>
<label><input type="checkbox" name="ok-${group.number}" value="${card.letter}"> 也可以</label>
<label><input type="checkbox" name="bad-${group.number}" value="${card.letter}"> 不行</label></header>
<div class="article-body"><div class="portable-content">${card.html}</div></div>
</article>`,
  )
  .join('\n')}
</section>`,
  )
  .join('\n')

const page = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>盲測｜哪一種寫法最好讀</title><style>${css}
body{background:#eef0f3;margin:0}
.wrap{max-width:46rem;margin:0 auto;padding:1rem 1rem 14rem;box-sizing:border-box}
.intro{font:15px/1.7 system-ui,"PingFang TC","Noto Sans TC",sans-serif;color:#1a1f2b}
.intro h1{font-size:1.4rem;margin:.5rem 0}
.group{margin:2.5rem 0}
.group-title{font:700 1.15rem/1.4 system-ui,sans-serif;margin:0 0 .3rem;padding:.6rem .8rem;background:#1a1f2b;color:#fff;border-radius:.5rem}
.group-note{font:14px/1.6 system-ui,sans-serif;color:#454b57;margin:.4rem .2rem 1rem}
.card{background:var(--paper,#fff);border:1px solid #cfd4dc;border-radius:.6rem;margin:0 0 1.2rem;overflow:hidden}
.card header{display:flex;flex-wrap:wrap;gap:.4rem .9rem;align-items:center;padding:.55rem .8rem;background:#f6f7f9;border-bottom:1px solid #e1e5ea;font:14px/1.4 system-ui,sans-serif;position:sticky;top:0;z-index:2}
.card .tag{font-weight:800;font-size:1rem;background:#1a1f2b;color:#fff;border-radius:.35rem;padding:.1rem .55rem}
.card .chars{color:#6a7180}
.card label{display:inline-flex;align-items:center;gap:.25rem;cursor:pointer}
.card .article-body{padding:.4rem .9rem .8rem;min-width:0}
.portable-content{min-width:0;max-width:100%}.portable-content>*{max-width:100%;box-sizing:border-box}.portable-content>p:first-child{font-weight:inherit;font-size:inherit;border:0;padding:0;margin-top:.8rem;background:none}
.article-table-scroll{overflow-x:auto}.article-table-scroll td{overflow-wrap:anywhere}
.card.is-best{border-color:#1f7a4d;box-shadow:0 0 0 2px #1f7a4d55}
.result{position:fixed;left:0;right:0;bottom:0;background:#1a1f2b;color:#fff;padding:.6rem .8rem;font:14px/1.5 system-ui,sans-serif;z-index:5}
.result .inner{max-width:46rem;margin:0 auto}
.result textarea{width:100%;box-sizing:border-box;height:3.6rem;font:13px/1.4 ui-monospace,monospace;border-radius:.4rem;border:0;padding:.4rem;margin-top:.3rem}
.result button{margin-left:.6rem;border:1px solid #fff8;background:none;color:#fff;border-radius:.4rem;padding:.15rem .7rem;font:inherit;cursor:pointer}
</style></head><body><div class="wrap">
<div class="intro"><h1>盲測：哪一種寫法最好讀</h1>
<p>共 ${groups.length} 組，每一組是同一段內容的幾種改寫，順序打亂、不標是誰寫的。每一組請點一個「最好讀」；覺得還行的可以勾「也可以」，完全不行的勾「不行」。</p>
<p>前 2 組比<strong>寫法</strong>，最重要。第 3、4 組比<strong>模型</strong>。第 5 到 8 組比<strong>思考程度</strong>，有空再做。不用全部做完，做到哪裡都可以。</p>
<p>做完把最下面那一串字複製、貼回對話給我。內容只比好不好讀；事實另外查核過，個別小錯之後會修。</p></div>
${groupHtml}
</div>
<div class="result"><div class="inner">結果（選了就會自動更新）<button id="copy" type="button">複製</button><textarea id="result" readonly></textarea></div></div>
<script>
const update=()=>{const parts=[];document.querySelectorAll('.group').forEach(g=>{const n=g.dataset.group;const best=g.querySelector('input[name="best-'+n+'"]:checked');const ok=[...g.querySelectorAll('input[name="ok-'+n+'"]:checked')].map(i=>i.value);const bad=[...g.querySelectorAll('input[name="bad-'+n+'"]:checked')].map(i=>i.value);g.querySelectorAll('.card').forEach(c=>c.classList.toggle('is-best',best&&c.dataset.letter===best.value));if(best||ok.length||bad.length)parts.push('第'+n+'組 最好'+(best?best.value:'無')+(ok.length?' 也可以'+ok.join(''):'')+(bad.length?' 不行'+bad.join(''):''))});document.getElementById('result').value=parts.join('；')}
document.addEventListener('change',update)
document.getElementById('copy').onclick=()=>{const t=document.getElementById('result');t.select();try{navigator.clipboard.writeText(t.value)}catch(e){}try{document.execCommand('copy')}catch(e){}}
update()
</script></body></html>`
writeFileSync(out, page)
console.log(JSON.stringify({file: out, kb: Math.round(page.length / 1024), groups: groups.map((g) => `${g.number}:${g.cards.length}`), missing: [...missing]}))
