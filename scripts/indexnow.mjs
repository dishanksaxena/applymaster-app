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

// Git Bash rewrites "/tools" into "C:/Program Files/Git/tools" before Node sees it; undo that.
const paths = process.argv.slice(2).map(p => p.replace(/^[A-Za-z]:[\\/].*?[\\/]Git(?=[\\/])/i, '').replace(/\\/g, '/'))
let urls
if (paths.length) urls = paths.map(p => SITE + p)
else {
  // Both sitemaps: the site's pages and the public job pages.
  urls = []
  for (const sm of ['/sitemap.xml', '/sitemap-jobs.xml']) {
    const xml = await (await fetch(SITE + sm)).text()
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].replace(/&amp;/g, '&')))
  }
}
// IndexNow takes up to 10,000 URLs per request.
for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000)
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: SITE + '/' + KEY + '.txt', urlList: batch }),
  })
  console.log('IndexNow', res.status, res.statusText, '-', batch.length, 'URLs')
  if (res.status >= 400) console.log(await res.text())
}
