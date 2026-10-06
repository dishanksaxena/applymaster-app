/**
 * Tell IndexNow search engines (Bing, which also feeds ChatGPT search,
 * Copilot, DuckDuckGo and Yahoo; plus Yandex, Seznam and Naver) that the
 * site's pages changed, so they are recrawled within hours instead of weeks.
 *
 *   node scripts/indexnow.mjs                 every URL in the live sitemap
 *   node scripts/indexnow.mjs /compare/tsenta just these paths
 *
 * Run after a deploy that adds or changes public pages. The key file
 * public/b240f9946492ca02bfb7aba2407dfe83.txt proves the site owns the key.
 */
const SITE = 'https://www.applymaster.ai'
const KEY = 'b240f9946492ca02bfb7aba2407dfe83'

const paths = process.argv.slice(2)
let urls
if (paths.length) urls = paths.map(p => SITE + p)
else {
  const xml = await (await fetch(SITE + '/sitemap.xml')).text()
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1])
}
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: SITE + '/' + KEY + '.txt', urlList: urls }),
})
console.log('IndexNow', res.status, res.statusText, '-', urls.length, 'URLs')
if (res.status >= 400) console.log(await res.text())
