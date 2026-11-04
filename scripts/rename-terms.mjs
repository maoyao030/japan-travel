/**
 * 名字改寫（Darren 2026-11-04：漢字與台灣慣用譯名優先，羅馬拼音最後）。
 * 對照表在 content-planning/name-kanji-2026-11-04.json。
 * 一次替換、長的名字先比對（「海鮮爐端Uroko亭」不會先被「Uroko亭」吃掉），網址裡的字不動。
 */
const URL_PATTERN = /https?:\/\/[^\s)\]"'<>）]+/g

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function makeRenamer(renames) {
  const sorted = [...renames].sort((a, b) => b.from.length - a.from.length)
  const map = new Map(sorted.map((rename) => [rename.from, rename.to]))
  const pattern = new RegExp(sorted.map((rename) => escape(rename.from)).join('|'), 'g')
  const replacePlain = (text) => text.replace(pattern, (match) => map.get(match))
  return (text) => {
    if (typeof text !== 'string' || text === '') return text
    let result = ''
    let last = 0
    for (const match of text.matchAll(URL_PATTERN)) {
      result += replacePlain(text.slice(last, match.index)) + match[0]
      last = match.index + match[0].length
    }
    return result + replacePlain(text.slice(last))
  }
}
