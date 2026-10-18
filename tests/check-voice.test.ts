import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {LIMITS, MIN_AVG_SENTENCE, bodyParagraphs, checkVoice} from '../.agents/skills/japan-travel-answer-first/scripts/check-voice.mjs'
import {inspectVoice} from '../scripts/finalize-release.mjs'

const projectRoot = path.resolve(import.meta.dirname, '..')
const skillRoot = path.join(projectRoot, '.agents', 'skills', 'japan-travel-answer-first')
const script = path.join(skillRoot, 'scripts', 'check-voice.mjs')

// 從範例第 2 節搬來的合格段落，標點與句長都照寫作指南。
const good = [
  '白色道路是用稚內特產的扇貝殼鋪成的路，全長約3公里，觀光協會稱它是一條「美麗的道路」。[F35] 宗谷丘陵是約1萬年前冰河期反覆凍結、融解形成的地形，2004年列為北海道遺產。5月下旬到10月下旬，還能看到宗谷岬牧場放牧的宗谷黑牛。[F33][F34][F46]',
  '',
  '白色道路每年4月下旬開放、11月中旬封閉。[F36] 稚內市建議開車從宗谷岬那一側進入，但汽車導航常把人帶往另一頭的終點，出發前最好先確認路線。[cape-soya:F40][cape-soya:F39] 不開車也去得了，走法整理在宗谷岬交通。',
].join('\n')

const article = (body: string) =>
  ['# 宗谷丘陵的白色道路', '', body, '', '## 資料來源', '', '- [白い道｜稚内観光協会](https://example.invalid/) 說明：這一行有冒號；也有分號 2026 年', ''].join('\n')

test('只量正文段落：標題、表格、條列、引言、圖片標記、程式區塊、事實編號與資料來源都不算', () => {
  const markdown = [
    '# 標題：有冒號也不算',
    '',
    '| 項目 | 內容 |',
    '|---|---|',
    '| 點燈 | 2026 年 9/1～10/25 18:00～21:00；表格可以用 |',
    '',
    '- 條列：這一行有冒號與 2026 年，也不算進正文；分號也不算',
    '> 引言：這一行也不算進正文，可以有分號；也可以有空格 2026 年',
    '〔圖片〕稚內港北防波堤穹頂，70 根圓柱排成的長廊。照片：Yoppy Kawasaki／Wikimedia Commons／CC BY 2.0',
    '',
    '```markdown',
    '## 資料來源：程式區塊裡的東西不算；完全不算',
    '```',
    '',
    good,
    '',
    '## 資料來源',
    '',
    '- 來源段落的文字：全部不算；也不會被量到 2026 年',
  ].join('\n')
  const paragraphs = bodyParagraphs(markdown)
  assert.equal(paragraphs.length, 2)
  assert.doesNotMatch(paragraphs.join('\n'), /\[(?:[a-z-]+:)?F\d+\]/)
  assert.doesNotMatch(paragraphs.join('\n'), /2026 年|；|〔/)
  assert.deepEqual(checkVoice(markdown).issues, [])
})

test('合格的正文通過，門檻和研究時的 check-voice.mjs 一樣', () => {
  assert.equal(LIMITS.cjkAsciiSpaces, 2)
  assert.equal(LIMITS.semicolons, 0.5)
  assert.equal(LIMITS.colons, 0.5)
  assert.equal(LIMITS.avgSentence, 38)
  assert.equal(LIMITS.notFound, 0)
  assert.equal(LIMITS.comeHere, 0)
  assert.equal(MIN_AVG_SENTENCE, 28)
  const {result, issues} = checkVoice(article(good))
  assert.deepEqual(issues, [])
  assert.ok(result.avgSentence >= 28 && result.avgSentence <= 38, `平均句長 ${result.avgSentence}`)
  assert.deepEqual(checkVoice('# 只有標題\n\n短句。\n').issues, [])
})

test('中英數之間的空格、分號與「官方沒寫」「來這裡」會被擋下，訊息是繁體中文', () => {
  const spaced = checkVoice(article(good.replaceAll('3公里', '3 公里').replaceAll('2004年', '2004 年').replaceAll('4月', '4 月').replaceAll('11月', '11 月')))
  assert.match(spaced.issues.join('\n'), /中英數之間的空格每千字[\d.]+（上限2），寫「約5分鐘」/)

  const semicolon = checkVoice(article(good.replace('，觀光協會稱它', '；觀光協會稱它')))
  assert.match(semicolon.issues.join('\n'), /分號每千字[\d.]+（上限0.5）/)

  const notFound = checkVoice(article(good.replace('出發前最好先確認路線', '開放時間官方沒寫，出發前最好先確認路線')))
  assert.match(notFound.issues.join('\n'), /「官方沒寫」「未查」這類用字1次（上限0），查不到的不寫/)

  const comeHere = checkVoice(article(good.replace('不開車也去得了', '不開車來這裡也去得了')))
  assert.match(comeHere.issues.join('\n'), /「來這裡」「來的話」這類用字1次（上限0），改成前往、造訪、抵達/)

  const bufang = checkVoice(article(good.replace('出發前最好先確認路線', '出發前不妨先確認路線').replace('不開車也去得了', '不開車不妨搭巴士')))
  assert.match(bufang.issues.join('\n'), /「不妨」2次（整篇最多1次）/)
})

test('句子切太碎也不通過，提示把短句併回去', () => {
  const choppy = '白色道路是扇貝殼鋪成的路。全長約3公里。觀光協會說它很美。宗谷丘陵是冰河期形成的地形。2004年列為北海道遺產。5月下旬到10月下旬有放牧的黑牛。'
  const {issues} = checkVoice(article(choppy))
  assert.match(issues.join('\n'), new RegExp(`平均句長[\\d.]+字（下限${MIN_AVG_SENTENCE}），句子切太碎`))
})

test('範例檔本身通過口吻與標點檢查', async () => {
  const examples = await readFile(path.join(skillRoot, 'references', 'examples.md'), 'utf8')
  const {result, issues} = checkVoice(examples)
  assert.deepEqual(issues, [])
  assert.ok(result.chars > 1000)
  assert.doesNotMatch(examples, /官方沒寫|官方沒有公布|未查/)
})

test('命令列接受文章封包資料夾，沒通過時結束碼為 1', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'japan-travel-voice-'))
  try {
    await writeFile(path.join(directory, 'reader-preview.md'), article(good.replace('，觀光協會稱它', '；觀光協會稱它')))
    const failed = spawnSync(process.execPath, [script, directory], {encoding: 'utf8'})
    assert.equal(failed.status, 1)
    assert.match(failed.stdout, /未通過/)
    assert.match(failed.stdout, /分號每千字/)

    await writeFile(path.join(directory, 'reader-preview.md'), article(good))
    const passed = spawnSync(process.execPath, [script, directory, '--json'], {encoding: 'utf8'})
    assert.equal(passed.status, 0, passed.stdout)
    assert.equal(JSON.parse(passed.stdout)[0].status, 'voice_clear')
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})

test('定稿時會把口吻與標點問題當成失敗原因', () => {
  assert.deepEqual(inspectVoice(article(good)).issues, [])
  const issues = inspectVoice(article(good.replace('，觀光協會稱它', '；觀光協會稱它'))).issues
  assert.equal(issues.length, 1)
  assert.match(issues[0], /^口吻與標點檢查未通過：分號每千字/)
})
