// Sends gelaland.ru URLs to IndexNow (Yandex and Bing pick them up for recrawl).
// Usage: node scripts/indexnow.js            -> all URLs from sitemap.xml
//        node scripts/indexnow.js /novyj-god/ -> only the given paths
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const HOST = 'gelaland.ru';
const key = fs.readdirSync(ROOT).find(f => /^[0-9a-f]{32}\.txt$/.test(f)).slice(0, 32);
const args = process.argv.slice(2);
const urls = args.length
  ? args.map(p => `https://${HOST}${p.startsWith('/') ? p : '/' + p}`)
  : [...fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const body = JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${key}.txt`, urlList: urls });

for (const endpoint of ['yandex.com', 'api.indexnow.org']) {
  const req = https.request({ host: endpoint, path: '/indexnow', method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) } },
    res => { let d = ''; res.on('data', c => d += c); res.on('end', () => console.log(endpoint, res.statusCode, d.slice(0, 200))); });
  req.on('error', e => console.log(endpoint, 'error', e.message));
  req.end(body);
}
console.log('sent', urls.length, 'urls');
