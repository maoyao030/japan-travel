import type {StructureResolver} from 'sanity/structure'

const API_VERSION = '2026-08-29'

/** 後台左邊的清單：先放最常用的「網站上的文章」，最近改過的排前面。 */
export const structure: StructureResolver = (S) => {
  const articles = (id: string, title: string, filter: string) =>
    S.documentList()
      .id(id)
      .title(title)
      .schemaType('article')
      .apiVersion(API_VERSION)
      .filter(filter)
      .defaultOrdering([{field: '_updatedAt', direction: 'desc'}])

  return S.list()
    .id('root')
    .title('內容')
    .items([
      S.listItem()
        .id('live-articles')
        .title('網站上的文章')
        .schemaType('article')
        .child(
          articles(
            'live-articles-list',
            '網站上的文章（最近改過的在前）',
            '_type == "article" && noindex != true',
          ),
        ),
      S.listItem()
        .id('noindex-articles')
        .title('還沒開放搜尋的文章')
        .schemaType('article')
        .child(
          articles(
            'noindex-articles-list',
            '還沒開放搜尋的文章',
            '_type == "article" && noindex == true',
          ),
        ),
      S.listItem()
        .id('studio-edited-articles')
        .title('後台改過、還沒同步回 Git')
        .schemaType('article')
        .child(
          articles(
            'studio-edited-articles-list',
            '後台改過、還沒同步回 Git',
            '_type == "article" && defined(studioEditedAt) && (!defined(studioEditsSyncedAt) || studioEditedAt > studioEditsSyncedAt)',
          ),
        ),
      S.listItem()
        .id('manually-edited-articles')
        .title('手動優化過的文章')
        .schemaType('article')
        .child(
          articles(
            'manually-edited-articles-list',
            '手動優化過的文章（最近改過的在前）',
            '_type == "article" && count(studioEditLog) > 0',
          ),
        ),
      S.divider(),
      S.documentTypeListItem('article').title('全部文章'),
      S.documentTypeListItem('hub').title('主題中心'),
      S.documentTypeListItem('tag').title('情境 Tag'),
      S.documentTypeListItem('author').title('作者'),
    ])
}
