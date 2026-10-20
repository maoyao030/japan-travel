import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {access, mkdir, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {validateFactCheck} from '../.agents/skills/japan-travel-acceptance/scripts/validate-fact-check.mjs'
import {validateImageReview} from '../.agents/skills/japan-travel-acceptance/scripts/validate-image-review.mjs'
import {renderDiagram, validateDiagramData} from '../.agents/skills/japan-travel-image-finder/scripts/render-diagram.mjs'
import {validatePlan} from '../.agents/skills/japan-travel-image-finder/scripts/validate-image-packet.mjs'

const projectRoot = path.resolve(import.meta.dirname, '..')
const skillsRoot = path.join(projectRoot, '.agents', 'skills')
const python = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3')
process.env.PYTHONUTF8 ??= '1'
process.env.PYTHONIOENCODING ??= 'utf-8'

const expectedSkills = [
  'japan-travel-acceptance',
  'japan-travel-answer-first',
  'japan-travel-auto-publisher',
  'japan-travel-image-finder',
  'japan-travel-polish',
  'japan-travel-topic-planner',
]

type AnyRecord = Record<string, any>

test('本站 Skill 的名稱、描述、UI 提示與引用檔案完整', async () => {
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
  assert.match(workflow, /地點 × 主題/)
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
    checks: {fullImageInspected: true, noWatermark: true, aiDisclosureReady: true, technicalClaimsAvoided: true, onImageLabel: true},
  }
  assert.deepEqual(validatePlan(imagePlan(ai), {today}), [])

  const skipped = imagePlan(ai)
  skipped.slots[0].sourcing.photoSearchOutcome = 'qualified-photo-found'
  assert.match(validatePlan(skipped, {today}).join('\n'), /才可使用 AI/)
})

function inlinePlan(slot: AnyRecord, selectedId?: string): AnyRecord {
  const plan = imagePlan()
  plan.slots.push({
    slotId: 'ferry-route',
    kind: 'inline',
    purpose: '稚內到禮文島的航線',
    mustShow: ['稚內港', '香深港'],
    mustNotShow: ['沒有航線的港口'],
    targetAspectRatio: '2:1',
    minimumWidth: 760,
    selectionNotes: '依需求判斷',
    candidates: [],
    ...slot,
  })
  if (selectedId) plan.selectedCandidateIds['ferry-route'] = selectedId
  return plan
}

const ferryDiagram = {
  schemaVersion: 1,
  diagramId: 'wakkanai-rebun-ferry',
  type: 'route',
  title: '稚內到禮文島的渡輪',
  scaleNote: '不依比例',
  nodes: [
    {id: 'wakkanai', label: '稚內港', labelJa: '稚内港', factId: 'C1'},
    {id: 'kafuka', label: '香深港', labelJa: '香深港', factId: 'C2'},
  ],
  edges: [{from: 'wakkanai', to: 'kafuka', label: '約 2 小時', factId: 'C3'}],
}

function diagramCandidate(overrides: AnyRecord = {}): AnyRecord {
  return {
    candidateId: 'ferry-diagram',
    sourceType: 'diagram',
    provider: 'self-made',
    assetType: 'svg',
    dataFile: 'images/diagrams/wakkanai-rebun-ferry.json',
    svgFile: 'images/diagrams/wakkanai-rebun-ferry.svg',
    factIds: ['C1', 'C2', 'C3'],
    width: 760,
    height: 380,
    matchType: 'exact',
    whyItFits: '依查證過的航線資料繪製',
    altDraft: '稚內港到香深港的渡輪路線示意圖',
    creditDraft: '本站製作示意圖',
    commercialReview: {risk: 'low'},
    ...overrides,
  }
}

const diagramSourcing = {
  policy: 'real-photo-first-ai-if-none',
  photoSearchOutcome: 'diagram-preferred',
  photoSearchCheckedAt: '2026-10-16',
  photoSearchNotes: '路線用示意圖比照片清楚',
}

test('文內圖要標明需求，認現場與路線位置不准用 AI 圖', () => {
  const today = '2026-10-16'
  const noNeed = inlinePlan({sourcing: diagramSourcing, candidates: [diagramCandidate()]}, 'ferry-diagram')
  assert.match(validatePlan(noNeed, {today}).join('\n'), /文內圖必須標明需求/)

  const aiOnSite = imagePlan()
  aiOnSite.slots[0].need = 'site-identification'
  const ai = aiOnSite.slots[0].candidates[0]
  aiOnSite.slots[0].candidates[0] = {...ai, sourceType: 'ai-generated'}
  assert.match(validatePlan(aiOnSite, {today}).join('\n'), /site-identification 位置不准使用 AI 圖/)
})

test('自製示意圖只用在路線位置、要列事實編號，並能從資料檔畫出 SVG', async () => {
  const today = '2026-10-16'
  const good = inlinePlan(
    {need: 'route-timeline', sourcing: diagramSourcing, candidates: [diagramCandidate()]},
    'ferry-diagram',
  )
  assert.deepEqual(validatePlan(good, {today}), [])

  const wrongNeed = inlinePlan({need: 'food', sourcing: diagramSourcing, candidates: [diagramCandidate()]}, 'ferry-diagram')
  assert.match(validatePlan(wrongNeed, {today}).join('\n'), /只用在 route-timeline/)

  const noFacts = inlinePlan(
    {need: 'route-timeline', sourcing: diagramSourcing, candidates: [diagramCandidate({factIds: []})]},
    'ferry-diagram',
  )
  assert.match(validatePlan(noFacts, {today}).join('\n'), /事實編號/)

  const notPreferred = inlinePlan(
    {need: 'route-timeline', sourcing: {...diagramSourcing, photoSearchOutcome: 'no-qualified-photo'}, candidates: [diagramCandidate()]},
    'ferry-diagram',
  )
  assert.match(validatePlan(notPreferred, {today}).join('\n'), /diagram-preferred/)

  assert.deepEqual(validateDiagramData(ferryDiagram), [])
  assert.match(validateDiagramData({...ferryDiagram, scaleNote: ''}).join('\n'), /scaleNote/)
  const svg = renderDiagram(ferryDiagram)
  assert.match(svg, /^<svg/)
  assert.match(svg, /稚內港/)
  assert.match(svg, /本站製作示意圖｜不依比例/)

  const directory = await mkdtemp(path.join(tmpdir(), 'japan-travel-diagram-'))
  try {
    const diagrams = path.join(directory, 'images', 'diagrams')
    await mkdir(diagrams, {recursive: true})
    await writeFile(path.join(diagrams, 'wakkanai-rebun-ferry.json'), JSON.stringify(ferryDiagram))
    assert.match(
      validatePlan(good, {today, packetDirectory: directory}).join('\n'),
      /請先執行 render-diagram/,
    )
    const script = path.join(skillsRoot, 'japan-travel-image-finder', 'scripts', 'render-diagram.mjs')
    const result = spawnSync(process.execPath, [script, path.join(diagrams, 'wakkanai-rebun-ferry.json')], {encoding: 'utf8'})
    assert.equal(result.status, 0, result.stderr)
    assert.deepEqual(validatePlan(good, {today, packetDirectory: directory}), [])

    const missingFact = inlinePlan(
      {need: 'route-timeline', sourcing: diagramSourcing, candidates: [diagramCandidate({factIds: ['C1', 'C2']})]},
      'ferry-diagram',
    )
    assert.match(validatePlan(missingFact, {today, packetDirectory: directory}).join('\n'), /所有的 factId/)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})

test('找不到合格照片的文內圖進缺圖清單並改用文字，封面不行', () => {
  const today = '2026-10-16'
  const missingSourcing = {...diagramSourcing, photoSearchOutcome: 'no-qualified-photo', photoSearchNotes: '沒有售票處照片'}
  const textFallback = {
    signTextJa: ['フェリーターミナル', '乗車券売場'],
    locationDescription: '進入渡輪站大廳後的左手邊。',
    officialPhotoLinks: ['https://example.com/terminal/floor-map'],
  }
  const missing = (overrides: AnyRecord = {}) =>
    inlinePlan({
      need: 'site-identification',
      missingImageId: 'rebun-ticket-counter',
      sourcing: missingSourcing,
      textFallback,
      ...overrides,
    })
  assert.deepEqual(validatePlan(missing(), {today}), [])

  assert.match(validatePlan(missing({textFallback: undefined}), {today}).join('\n'), /必須記錄正文的文字替代/)
  assert.match(
    validatePlan(missing({textFallback: {...textFallback, signTextJa: []}}), {today}).join('\n'),
    /至少要寫一個日文招牌原文/,
  )
  assert.match(
    validatePlan(missing({textFallback: {...textFallback, officialPhotoLinks: ['http://example.com/']}}), {today}).join('\n'),
    /必須是 HTTPS 連結/,
  )
  assert.match(
    validatePlan(missing({candidates: [commonsCandidate({candidateId: 'x'})]}), {today}).join('\n'),
    /不能有候選/,
  )

  const coverMissing = imagePlan()
  coverMissing.slots[0].missingImageId = 'rebun-cover'
  assert.match(validatePlan(coverMissing, {today}).join('\n'), /封面不能進缺圖清單/)
})

test('AI 圖與示意圖要由另一個 agent 看過，示意圖的事實要已查證，AI 圖要 Darren 確認', () => {
  const diagramPlan = inlinePlan(
    {need: 'route-timeline', sourcing: diagramSourcing, candidates: [diagramCandidate()]},
    'ferry-diagram',
  )
  const verified = {claims: ['C1', 'C2', 'C3'].map((claimId) => ({claimId, verdict: 'verified'}))}
  const diagramData = {'images/diagrams/wakkanai-rebun-ferry.json': ferryDiagram}
  const diagramItem = {
    slotId: 'ferry-route',
    candidateId: 'ferry-diagram',
    kind: 'diagram',
    checks: {matchesDataFile: true, factsVerified: true, scaleNotePresent: true, readableOnPhone: true},
    verdict: 'pass',
    notes: '',
  }
  const review = {schemaVersion: 1, articleId: 'rebun-island', reviewer: 'image-review-agent', reviewedAt: '2026-10-16', items: [diagramItem]}

  assert.deepEqual(validateImageReview({plan: diagramPlan, review, factCheck: verified, diagramData}), [])
  assert.match(validateImageReview({plan: diagramPlan, review: null, factCheck: verified, diagramData}).join('\n'), /缺少 image-review.json/)

  const unverified = {claims: [{claimId: 'C1', verdict: 'verified'}, {claimId: 'C2', verdict: 'verified'}, {claimId: 'C3', verdict: 'incorrect'}]}
  assert.match(validateImageReview({plan: diagramPlan, review, factCheck: unverified, diagramData}).join('\n'), /未在 fact-check.json 查證的事實：C3/)

  const aiPlan = imagePlan({
    candidateId: 'cover-ai',
    sourceType: 'ai-generated',
  })
  const aiItem = {
    slotId: 'cover',
    candidateId: 'cover-ai',
    kind: 'ai',
    checks: {noFakeText: true, japanFactsCorrect: true, matchesArticle: true, notMistakableForRealPlace: true, noLikenessOrBrand: true, disclosureVisible: true, allowedNeed: true},
    verdict: 'pass',
    notes: '',
  }
  const aiReview = {...review, items: [aiItem]}
  assert.match(validateImageReview({plan: aiPlan, review: aiReview, factCheck: verified}).join('\n'), /darrenConfirmedAt/)
  assert.deepEqual(
    validateImageReview({plan: aiPlan, review: {...aiReview, items: [{...aiItem, darrenConfirmedAt: '2026-10-16'}]}, factCheck: verified}),
    [],
  )
})

test('標編號檢查會擋下沒有事實編號的數字句與不存在的編號，通過後寫出去掉編號的預覽', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'japan-travel-tags-'))
  const script = path.join(skillsRoot, 'japan-travel-answer-first', 'scripts', 'fact_tags.py')
  const record = '| 編號 | 主張 |\n|---|---|\n| F1 | 直航約 1 小時 55 分 |\n| F2 | 只收現金 |\n'
  try {
    await writeFile(path.join(directory, 'reference-review.md'), record)
    await writeFile(
      path.join(directory, 'draft-tagged.md'),
      '# 標題\n\n直航約 1 小時 55 分 [F1]。巴士只收現金。\n\n| 項目 | 內容 |\n|---|---|\n| 船 | 約 2 小時 [F9] |\n',
    )
    const failed = spawnSync(python, [script, directory, '--json'], {encoding: 'utf8'})
    assert.equal(failed.status, 1)
    const codes = JSON.parse(failed.stdout).issues.map((issue: AnyRecord) => issue.code)
    assert.deepEqual(codes.sort(), ['UNKNOWN_FACT', 'UNTAGGED_CLAIM'])
    await assert.rejects(access(path.join(directory, 'reader-preview.md')))

    await writeFile(
      path.join(directory, 'draft-tagged.md'),
      '# 標題\n\n直航約 1 小時 55 分 [F1]。巴士只收現金 [F2]。\n\n| 項目 | 內容 |\n|---|---|\n| 船 | 約 2 小時 [F1] |\n\n## 延伸資料\n\n- **時刻表**，各季的開船時間。https://example.invalid/2026/time1/\n\n## 資料來源\n\n- 2026 年時刻表\n',
    )
    const passed = spawnSync(python, [script, directory], {encoding: 'utf8'})
    assert.equal(passed.status, 0, passed.stdout)
    const preview = await readFile(path.join(directory, 'reader-preview.md'), 'utf8')
    assert.doesNotMatch(preview, /\[F\d/)
    assert.match(preview, /直航約 1 小時 55 分。巴士只收現金。/)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})

test('評論統整的句子要標評論編號，編號要在研究記錄的評論統整表', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'japan-travel-review-tags-'))
  const script = path.join(skillsRoot, 'japan-travel-answer-first', 'scripts', 'fact_tags.py')
  const record =
    '| 編號 | 主張 |\n|---|---|\n| F1 | Tabelog 3.52 |\n\n' +
    '| 編號 | 特點 | 平台與則數 |\n|---|---|---|\n| R1 | 份量多 | Google 地圖 4 則、Tabelog 3 則 |\n'
  try {
    await writeFile(path.join(directory, 'reference-review.md'), record)
    await writeFile(path.join(directory, 'draft-tagged.md'), '# 標題\n\n評論常提到海膽丼份量多。\n\n評論常提到要排隊 [R2]。\n')
    const failed = spawnSync(python, [script, directory, '--json'], {encoding: 'utf8'})
    assert.equal(failed.status, 1)
    const codes = JSON.parse(failed.stdout).issues.map((issue: AnyRecord) => issue.code)
    assert.deepEqual(codes.sort(), ['UNKNOWN_FACT', 'UNTAGGED_CLAIM'])

    await writeFile(
      path.join(directory, 'draft-tagged.md'),
      '# 標題\n\nTabelog 評分 3.52 [F1]，評論常提到海膽丼份量多 [R1]。\n',
    )
    const passed = spawnSync(python, [script, directory], {encoding: 'utf8'})
    assert.equal(passed.status, 0, passed.stdout)
    const preview = await readFile(path.join(directory, 'reader-preview.md'), 'utf8')
    assert.doesNotMatch(preview, /\[[FR]\d/)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})

test('標題檢查紀錄要寫改動理由、不得增刪標題，且改動要套用到預覽', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'japan-travel-headings-'))
  const script = path.join(skillsRoot, 'japan-travel-answer-first', 'scripts', 'heading_review.py')
  const record = {
    checker: 'heading-checker',
    seoTitle: {before: '禮文島交通，巴士與觀光巴士', after: '禮文島交通，巴士與觀光巴士', reason: ''},
    items: [
      {level: 1, before: '禮文島交通，巴士與觀光巴士', after: '禮文島交通，巴士與觀光巴士', reason: ''},
      {level: 2, before: '交通方式', after: '禮文島路線巴士', reason: '泛稱補地名'},
      {level: 2, before: '資料來源', after: '資料來源', reason: ''},
    ],
    structureNotes: [],
  }
  try {
    await writeFile(path.join(directory, 'heading-review.json'), JSON.stringify(record))
    await writeFile(path.join(directory, 'reader-preview.md'), '# 禮文島交通，巴士與觀光巴士\n\n## 交通方式\n\n## 資料來源\n')
    const pending = spawnSync(python, [script, directory, '--json'], {encoding: 'utf8'})
    assert.equal(pending.status, 1)
    assert.match(JSON.parse(pending.stdout).issues.join('\n'), /尚未套用/)

    await writeFile(path.join(directory, 'reader-preview.md'), '# 禮文島交通，巴士與觀光巴士\n\n## 禮文島路線巴士\n\n## 資料來源\n')
    const applied = spawnSync(python, [script, directory], {encoding: 'utf8'})
    assert.equal(applied.status, 0, applied.stdout)

    await writeFile(
      path.join(directory, 'heading-review.json'),
      JSON.stringify({...record, items: [record.items[0], {...record.items[1], reason: ''}, record.items[2]]}),
    )
    const noReason = spawnSync(python, [script, directory, '--json'], {encoding: 'utf8'})
    assert.match(JSON.parse(noReason.stdout).issues.join('\n'), /沒寫理由/)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})
