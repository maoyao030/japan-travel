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
 * 四大分類的空殼（交接文件第五節）。
 * `topics` 是各分類底下允許建立的父主題中心（Hub）清單；主題中心要先列在這裡，
 * Sanity 裡同 slug 的 Hub 才通過發布門檻。試點 30 頁經 Darren 核准後，再把主題填進來。
 */
export const siteCategories: SiteCategory[] = [
  {
    slug: 'stay',
    title: '住宿',
    summary: '小型溫泉地與鄉間的旅館選擇，整理房型、含餐、交通接駁、訂房管道與查核日期。',
    description:
      '大型訂房網站蓋不到的小地方，旅館常只在官網或日本國內平台開放預約。這裡整理每個地區的旅館清單、房型與含餐條件、接駁方式與可用的訂房管道，每頁標示查核日期，每年重查官網一次。',
    questionsHeading: '房型、含餐、接駁與訂房管道',
    readerQuestions: [
      '旅館能在 Trip.com、Agoda 或官網訂到，還是只有日本國內平台？',
      '房價是否含早晚餐，入住與退房時間、最近車站的接駁怎麼安排？',
      '清單上的價格與營業狀態是哪一天查核的，下次重查是什麼時候？',
    ],
    topics: [],
  },
  {
    slug: 'weather',
    title: '天氣與季節',
    summary: '各城市逐月的氣溫、降雨與日照平年值，加上櫻花、楓葉、雪季與梅雨的時間。',
    description:
      '出發前最常問的是那個月到底多冷、會不會下雨、該帶什麼衣服。這裡以氣象廳三十年平年值整理各城市每個月的氣候，並說明櫻花、楓葉、雪季與梅雨等季節事件的大致時間與觀察方式。',
    questionsHeading: '氣溫、降雨與穿著準備',
    readerQuestions: [
      '這個月的平均氣溫、最高最低溫與降雨日數是多少，和台灣同期差多少？',
      '室內暖氣與室外溫差大時，衣服怎麼分層，鞋子與雨具要不要帶？',
      '櫻花、楓葉、雪季或梅雨在這個城市大概落在哪幾週？',
    ],
    topics: [],
  },
  {
    slug: 'food',
    title: '美食',
    summary: '地方料理的由來與吃法、重點店家的營業資訊，以及公開榜單上的店家整理。',
    description:
      '每個地方都有自己的代表料理與老店。這裡說明料理的來歷與點餐方式，重點店家以官網與 Hot Pepper 的營業資訊為準，評價只引用米其林、Tabelog 百名店等公開榜單並附上連結，不改寫網路評論。',
    questionsHeading: '料理、店家資訊與公開榜單',
    readerQuestions: [
      '這道料理在當地怎麼點、怎麼吃，價位大概在哪個區間？',
      '店家的營業時間、公休日與是否需要預約，是哪一天從官網查核的？',
      '哪些店家出現在米其林、Tabelog 百名店等公開榜單上？',
    ],
    topics: [],
  },
  {
    slug: 'transport',
    title: '交通',
    summary: '前往小地方的鐵路、巴士與接駁安排，整理班次、票券與轉乘時間。',
    description:
      '小型溫泉地與鄉間景點的交通往往要轉乘鐵路、地方巴士或旅館接駁。這裡整理從主要城市出發的路線、班次頻率、可用票券與轉乘時間，資料以鐵路公司、巴士公司與觀光協會公開資訊為準。',
    questionsHeading: '路線、班次與票券',
    readerQuestions: [
      '從最近的大城市出發，要搭哪幾段鐵路或巴士，單程大約多久？',
      '巴士與接駁車一天幾班，淡季會不會停駛或減班？',
      '周遊券或地區票券是否涵蓋這段路線，划不划算？',
    ],
    topics: [],
  },
]
