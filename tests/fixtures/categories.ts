import type {SiteCategory} from '../../src/data/categories.ts'

/** 測試用分類樹。正式分類樹的 topics 要等 Darren 核准試點清單後才填，測試不依賴它。 */
export const testCategories: SiteCategory[] = [
  {
    slug: 'stay',
    title: '住宿',
    summary: '住宿摘要',
    description: '住宿說明',
    questionsHeading: '房型與訂房管道',
    readerQuestions: ['問題一', '問題二', '問題三'],
    topics: [
      {slug: 'ginzan-onsen', title: '銀山溫泉', status: '保留'},
      {slug: 'kurokawa-onsen', title: '黑川溫泉', status: '保留'},
    ],
  },
  {
    slug: 'weather',
    title: '天氣與季節',
    summary: '天氣摘要',
    description: '天氣說明',
    questionsHeading: '氣溫與穿著',
    readerQuestions: ['問題一', '問題二', '問題三'],
    topics: [{slug: 'tokyo', title: '東京天氣', status: '保留'}],
  },
  {
    slug: 'food',
    title: '美食',
    summary: '美食摘要',
    description: '美食說明',
    questionsHeading: '料理與店家',
    readerQuestions: ['問題一', '問題二', '問題三'],
    topics: [],
  },
  {
    slug: 'transport',
    title: '交通',
    summary: '交通摘要',
    description: '交通說明',
    questionsHeading: '路線與票券',
    readerQuestions: ['問題一', '問題二', '問題三'],
    topics: [],
  },
]
