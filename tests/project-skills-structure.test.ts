import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {access, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {validateFactCheck} from '../.agents/skills/japan-travel-acceptance/scripts/validate-fact-check.mjs'
import {validatePlan} from '../.agents/skills/japan-travel-image-finder/scripts/validate-image-packet.mjs'

const projectRoot = path.resolve(import.meta.dirname, '..')
const skillsRoot = path.join(projectRoot, '.agents', 'skills')
const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
process.env.PYTHONUTF8 ??= '1'
process.env.PYTHONIOENCODING ??= 'utf-8'

const expectedSkills = [
  'japan-travel-acceptance',
  'japan-travel-answer-first',
  'japan-travel-image-finder',
  'japan-travel-topic-planner',
]

type AnyRecord = Record<string, any>

test('四個本站 Skill 的名稱、描述、UI 提示與引用檔案完整', async () => {
  const directories = (await readdir(skillsRoot, {withFileTypes: true}))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  assert.deepEqual(directories, expectedSkills)

  for (const skillName of expectedSkills) {
    const directory = path.join(skillsRoot, skillName)
    const source = await readFile(path.join(directory, 'SKILL.md'), 'utf8')
    const frontmatter = source.match(/^---\r?\n([\s\S]+?)\r?\n---/)
    assert.ok(frontmatter, `${skillName} 缺少 frontmatter`)
    assert.equal(frontmatter[1].match(/^name:\s*(.+)$/m)?.[1].trim(), skillName)
    const description = frontmatter[1].match(/^description:\s*(.+)$/m)?.[1].trim() ?? ''
    assert.ok(description.length > 0 && description.length <= 1024, `${skillName} 描述長度不符`)
    assert.doesNotMatch(source, /\[TODO|PLACEHOLDER|�|好材誌樂居|建材文章/)

    const yaml = await readFile(path.join(directory, 'agents', 'openai.yaml'), 'utf8')
    assert.match(yaml, new RegExp(`\\$${skillName}`))
    for (const key of ['display_name:', 'short_description:', 'default_prompt:']) assert.match(yaml, new RegExp(key))

    for (const [, reference] of source.matchAll(/\]\((references\/[^)#]+\.md)/g)) {
      await access(path.join(directory, reference))
    }
  }
})

test('本站規則寫進了對應的 Skill', async () => {
  const read = (skill: string, file = 'SKILL.md') => readFile(path.join(skillsRoot, skill, file), 'utf8')
  const planner = await read('japan-travel-topic-planner')
  const workflow = await read('japan-travel-topic-planner', 'references/selection-workflow.md')
  const writer = await read('japan-travel-answer-first')
  const acceptance = await read('japan-travel-acceptance')
  const images = await read('japan-travel-image-finder')

  assert.match(planner, /0 不等於沒人搜/)
  assert.match(planner, /SERP observation/)
  assert.match(workflow, /搜尋量 100 以上/)
  assert.match(workflow, /川湯/)
  assert.match(writer, /日文官方資料/)
  assert.match(writer, /只取事實，不翻譯段落/)
  assert.match(writer, /保母等級/)
  assert.match(writer, /共用教學頁/)
  assert.match(writer, /WHOOPS 標題結構規則/)
  assert.match(acceptance, /事實查核 agent/)
  assert.match(acceptance, /讀者驗收 agent/)
  assert.match(images, /Wikimedia Commons/)
  assert.match(images, /非商業使用/)
  assert.match(images, /禁止改作/)
})

test('文章格式檢查器的自我測試通過，並會提醒未標稅別的價格與大段日文', () => {
  const checker = path.join(skillsRoot, 'japan-travel-answer-first', 'scripts', 'audit_answer_first.py')
  const selfTest = spawnSync(python, [checker, '--self-test'], {cwd: projectRoot, encoding: 'utf8'})
  assert.equal(selfTest.status, 0, selfTest.stdout || selfTest.stderr)
  const report = JSON.parse(selfTest.stdout)
  const codes = new Set(report.headingFailingCase.issues.map((issue: AnyRecord) => issue.code))
  for (const code of ['H1_COLON', 'HEADING_LEVEL_SKIP', 'DUPLICATE_HEADING', 'PACKAGED_HEADING']) {
    assert.ok(codes.has(code), code)
  }

  const article = [
    '# 禮文島交通',
    '',
    'この船は礼文島に行きますか、ここで乗船券を買ってください、ありがとうございます。',
    '',
    '## 資料來源',
    '',
    '- [時刻表](https://example.com/timetable)',
    '',
  ].join('\n')
  const result = spawnSync(python, [checker, '-', '--json'], {input: article, cwd: projectRoot, encoding: 'utf8'})
  const signals = new Set(JSON.parse(result.stdout).reviewSignals.map((signal: AnyRecord) => signal.code))
  assert.ok(signals.has('LONG_JAPANESE_RUN'))
})

function factCheck(overrides: AnyRecord = {}): AnyRecord {
  return {
    schemaVersion: 1,
    articleId: 'rebun-island',
    articleSha256: 'abc',
    checker: '事實查核 agent',
    checkedAt: '2026-10-16',
    claims: [
      {
        claimId: 'C1',
        articleExcerpt: '稚內到香深港約 1 小時 55 分',
        sourceUrl: 'https://example.com/timetable',
        sourceTitle: '時刻表',
        sourceQuote: '所要時間 1時間55分',
        verdict: 'verified',
        notes: '',
      },
    ],
    summary: {verified: 1, incorrect: 0, unsupported: 0, outdated: 0, unreachable: 0, 'not-stated': 0},
    ...overrides,
  }
}

test('事實查核紀錄要有原文摘錄、對應目前文章，未通過的事實會被列出', async () => {
  assert.deepEqual(validateFactCheck(factCheck(), 'abc'), {errors: [], blocking: []})

  const noQuote = factCheck()
  noQuote.claims[0].sourceQuote = ''
  assert.match(validateFactCheck(noQuote, 'abc').errors.join('\n'), /沒有日文原文摘錄/)

  assert.match(validateFactCheck(factCheck(), 'other').errors.join('\n'), /不是這一版文章/)

  const incorrect = factCheck({summary: {verified: 0, incorrect: 1, unsupported: 0, outdated: 0, unreachable: 0, 'not-stated': 0}})
  incorrect.claims[0].verdict = 'incorrect'
  assert.deepEqual(validateFactCheck(incorrect, 'abc').blocking, ['C1：incorrect'])

  const directory = await mkdtemp(path.join(tmpdir(), 'japan-travel-fact-'))
  try {
    const article = '# 測試\n'
    await writeFile(path.join(directory, 'reader-preview.md'), article)
    const sha = createHash('sha256').update(article).digest('hex')
    await writeFile(path.join(directory, 'fact-check.json'), JSON.stringify(factCheck({articleSha256: sha})))
    const script = path.join(skillsRoot, 'japan-travel-acceptance', 'scripts', 'validate-fact-check.mjs')
    const result = spawnSync(process.execPath, [script, directory], {encoding: 'utf8'})
    assert.equal(result.status, 0, result.stderr)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})

function commonsCandidate(overrides: AnyRecord = {}): AnyRecord {
  return {
    candidateId: 'cover-01',
    sourceType: 'commons-photo',
    provider: 'Wikimedia Commons',
    assetType: 'photo',
    sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
    creatorName: 'Example Author',
    sourceTitle: 'File:Example.jpg',
    sourceDescription: '說明',
    width: 4000,
    height: 2667,
    licenseName: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    licenseCheckedAt: '2026-10-16',
    matchType: 'exact',
    whyItFits: '檔案頁標示為禮文島。',
    altDraft: '禮文島海岸',
    captionDraft: '禮文島西海岸。',
    creditDraft: '照片：Example Author／Wikimedia Commons／CC BY-SA 4.0',
    commercialReview: {people: 'none', logos: 'none', artwork: 'none', property: 'landscape', risk: 'low', notes: ''},
    checks: {fullImageInspected: true, officialSourcePage: true, licenseVerified: true, notAiGenerated: true, noWatermark: true},
    ...overrides,
  }
}

function imagePlan(candidate: AnyRecord = commonsCandidate()): AnyRecord {
  return {
    schemaVersion: 1,
    articleId: 'rebun-island',
    articleTitle: '禮文島',
    targetUrl: '/places/rebun-island/',
    articleSource: 'approved-reader-preview',
    articleSourceCheckedAt: '2026-10-16',
    status: 'selected',
    selectionMode: 'criteria-based-auto-selection',
    selectedCandidateIds: {cover: candidate.candidateId},
    selectedAt: '2026-10-16',
    slots: [
      {
        slotId: 'cover',
        kind: 'cover',
        purpose: '條目封面',
        mustShow: ['禮文島海岸'],
        mustNotShow: ['其他島嶼'],
        targetAspectRatio: '16:9',
        minimumWidth: 1600,
        preparation: {
          sourceFile: 'source.jpg',
          ...(candidate.sourceType === 'ai-generated' ? {} : {sourceDownloadUrl: 'https://upload.wikimedia.org/example.jpg'}),
          focalPoint: {x: 0.5, y: 0.5},
          output: {width: 1600, height: 900, format: 'webp', quality: 82},
        },
        selectionNotes: '唯一合格',
        sourcing: {
          policy: 'real-photo-first-ai-if-none',
          photoSearchOutcome: candidate.sourceType === 'ai-generated' ? 'no-qualified-photo' : 'qualified-photo-found',
          photoSearchCheckedAt: '2026-10-16',
          photoSearchNotes: '已查維基共享資源與免費圖庫',
        },
        candidates: [candidate],
      },
    ],
  }
}

test('圖片封包接受維基共享資源 CC BY-SA，擋下非商業、禁止改作與缺署名', () => {
  const today = '2026-10-16'
  assert.deepEqual(validatePlan(imagePlan(), {today}), [])

  const nc = validatePlan(imagePlan(commonsCandidate({licenseName: 'CC BY-NC-SA 4.0'})), {today}).join('\n')
  assert.match(nc, /非商業授權不能用/)

  const nd = validatePlan(imagePlan(commonsCandidate({licenseName: 'CC BY-ND 4.0'})), {today}).join('\n')
  assert.match(nd, /禁止改作/)

  const noCredit = validatePlan(imagePlan(commonsCandidate({creditDraft: '照片：Wikimedia Commons'})), {today}).join('\n')
  assert.match(noCredit, /必須包含作者與授權名稱/)

  const notFilePage = validatePlan(
    imagePlan(commonsCandidate({sourcePageUrl: 'https://commons.wikimedia.org/wiki/Category:Rebun_Island'})),
    {today},
  ).join('\n')
  assert.match(notFilePage, /單張檔案頁/)
})

test('觀光協會素材必須確認商業使用與裁切，AI 圖不能跳過實拍搜尋', () => {
  const today = '2026-10-16'
  const official = {
    candidateId: 'cover-02',
    sourceType: 'official-material',
    provider: '礼文町観光協会',
    assetType: 'photo',
    sourcePageUrl: 'https://example.com/photo/1',
    termsUrl: 'https://example.com/terms',
    termsCheckedAt: '2026-10-16',
    commercialUseAllowed: false,
    modificationAllowed: true,
    creditRequirement: '標示觀光協會名稱',
    applicationRequired: false,
    width: 3000,
    height: 2000,
    matchType: 'exact',
    whyItFits: '官方素材',
    altDraft: '禮文島',
    creditDraft: '照片：礼文町観光協会',
    commercialReview: {risk: 'low'},
    checks: {fullImageInspected: true, officialSourcePage: true, licenseVerified: true, notAiGenerated: true, noWatermark: true},
  }
  assert.match(validatePlan(imagePlan(official), {today}).join('\n'), /明確允許商業網站使用/)

  const ai = {
    candidateId: 'cover-ai',
    sourceType: 'ai-generated',
    provider: 'OpenAI ImageGen',
    assetType: 'generated-image',
    generatedAt: '2026-10-16',
    promptSummary: '北方島嶼海岸示意',
    width: 2048,
    height: 1152,
    matchType: 'illustrative',
    whyItFits: '示意',
    matchLimits: '不是禮文島實景',
    factualLimits: '不能代表地點樣貌',
    altDraft: '海岸示意圖',
    captionDraft: 'AI 示意圖',
    disclosureDraft: 'AI 示意圖／OpenAI ImageGen',
    creditDraft: 'AI 示意圖',
    commercialReview: {risk: 'low'},
    checks: {fullImageInspected: true, noWatermark: true, aiDisclosureReady: true, technicalClaimsAvoided: true},
  }
  assert.deepEqual(validatePlan(imagePlan(ai), {today}), [])

  const skipped = imagePlan(ai)
  skipped.slots[0].sourcing.photoSearchOutcome = 'qualified-photo-found'
  assert.match(validatePlan(skipped, {today}).join('\n'), /才可使用 AI/)
})
