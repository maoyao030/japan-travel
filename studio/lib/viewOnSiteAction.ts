import {useEffect, useState} from 'react'
import {type DocumentActionComponent, useClient} from 'sanity'
import {SITE_URL, articlePath} from './articleUrl'

const QUERY = `*[_id == $id][0]{"slug": slug.current, "hub": primaryHub->{"slug": slug.current, category, "landing": landingArticle._ref, "parent": parentHub->slug.current}}`

/** 「發布」旁邊的選單多一個「在網站上看這篇」，打開網站上的這一頁（網站重建後才看得到新內容）。 */
export const ViewOnSiteAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion: '2026-08-29'})
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    let active = true
    client
      .fetch(QUERY, {id: props.id}, {perspective: 'published'})
      .then((data) => {
        const path = data ? articlePath({id: props.id, ...data}) : undefined
        if (active) setUrl(path ? `${SITE_URL}${path}` : undefined)
      })
      .catch(() => active && setUrl(undefined))
    return () => {
      active = false
    }
  }, [client, props.id])

  return {
    label: '在網站上看這篇',
    disabled: !url,
    title: url ? url : '這篇還沒上線，網站上沒有這一頁',
    onHandle: () => {
      if (url) window.open(url, '_blank', 'noopener')
      props.onComplete()
    },
  }
}
