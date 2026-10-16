export type CategoryStatus = '優先保留' | '保留' | '候選'

export type SiteHub = {
  slug: string
  title: string
  status: CategoryStatus
}

export type SiteCategory = {
  slug: string
  title: string
  summary: string
  description: string
  questionsHeading: string
  readerQuestions: string[]
  topics: SiteHub[]
}

/**
 * 地點優先的分類樹（2026-10-16 Darren 確認網址最多三層）。
 * - places：每個地區與地點都是 `/places/<地點>/`，地點之間的上下關係記在 Hub 的 region 欄位，不放進網址。
 *   面向頁是 `/places/<地點>/<面向>/`，例如 `/places/hakodate/stay/`。
 * - seasons、shrines、guides：全國性的主題，維持「分類／主題／文章」。
 * `topics` 是各分類允許建立的父主題中心（Hub）清單；主題中心要先列在這裡，
 * Sanity 裡同 slug 的 Hub 才通過發布門檻。試點 30 頁經 Darren 核准後，再把主題填進來。
 */
export const siteCategories: SiteCategory[] = [
  {
    slug: 'places',
    title: '地點',
    summary: '從北海道開始，一個地點一頁：怎麼去、住哪裡、什麼季節去、要準備什麼。',
    description:
      '每個地區與地點各有一頁條目，回答怎麼去、住哪裡、幾月去、吃什麼與當地規矩；搜尋需求夠大的題目，例如函館住宿或跳島渡輪，再往下分成面向頁。地點之間用鄰近地點與出入口互相連結，資料以日文官方來源為準並標示查核日期。',
    questionsHeading: '交通、住宿、季節與當地規矩',
    readerQuestions: [
      '從最近的機場或大城市出發，要搭哪幾段車船，末班與停駛時怎麼辦？',
      '旅館能在 Trip.com、Agoda 或官網訂到，還是只有日本國內平台？',
      '哪幾個月最適合去，那時候的氣溫、降雨與營業狀況如何？',
    ],
    topics: [],
  },
  {
    slug: 'seasons',
    title: '季節',
    summary: '櫻花、楓葉、雪季、梅雨與花火大會，全國的時間與各地差異。',
    description:
      '出發前最常問的是那個月去會看到什麼、天氣如何。這裡整理櫻花、楓葉、雪季、梅雨與花火大會等季節現象在各地的大致時間，天氣以氣象廳三十年平年值為準，並連到各地點的條目。',
    questionsHeading: '季節時間與各地差異',
    readerQuestions: [
      '櫻花、楓葉或雪季在各地大概落在哪幾週，每年差多少？',
      '那個月的平均氣溫與降雨日數是多少，衣服怎麼準備？',
      '花火大會與祭典的日期怎麼確認，停辦時去哪裡看公告？',
    ],
    topics: [],
  },
  {
    slug: 'shrines',
    title: '神社與祭典',
    summary: '參拜方式、御朱印、各地神社與祭典的時間與看點。',
    description:
      '第一次參拜常擔心做錯動作。這裡說明參拜與御朱印的基本禮儀，整理各地神社與祭典的時間、交通與看點，祭典日期以神社與觀光協會公告為準。',
    questionsHeading: '參拜禮儀與祭典時間',
    readerQuestions: [
      '參拜、洗手與拍照有哪些規矩，御朱印怎麼請？',
      '祭典是哪幾天，最熱鬧的時段與觀賞位置在哪裡？',
      '祭典期間交通管制與住宿怎麼安排？',
    ],
    topics: [],
  },
  {
    slug: 'guides',
    title: '旅行教學',
    summary: '各地共通的操作：整理券巴士、看日文時刻表、在日文官網訂房、溫泉禮儀。',
    description:
      '不會日文也能完成的操作教學。整理券巴士怎麼搭、日文時刻表怎麼看、只有日文的旅館官網怎麼訂、溫泉與旅館的規矩，每一步附上畫面上的日文與可以指給對方看的句子。',
    questionsHeading: '看不懂日文時的操作步驟',
    readerQuestions: [
      '整理券巴士上車、下車與付款的順序是什麼？',
      '日文時刻表與訂房頁面上的欄位各是什麼意思？',
      '旅館與溫泉有哪些規矩，遇到問題可以怎麼開口？',
    ],
    topics: [],
  },
]
