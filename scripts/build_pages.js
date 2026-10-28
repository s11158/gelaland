// Builds standalone landing pages from data/pages.json into <slug>/index.html and refreshes sitemap.xml.
// Run from the repo root: node scripts/build_pages.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://gelaland.ru';
const PHONE = '+79857643380', PHONE_TXT = '+7 985 764-33-80';
const WA = 'https://wa.me/79857643380?text=' + encodeURIComponent('Добрый день, пишу с сайта GelaLand, хочу узнать о бронировании');
const YM = 113012269;

const { pages } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/pages.json'), 'utf8'));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const today = new Date().toISOString().slice(0, 10);

const css = `:root{--pine:#132419;--pine-2:#1c3327;--mist:#edf0ec;--paper:#f7f8f5;--ink:#16221c;--ink-2:#44524a;--honey:#d9a45a;--honey-2:#b9843f;--line:rgba(19,36,25,.12);--r:18px;--display:'Oranienbaum',Georgia,serif;--body:'Manrope',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--mist);color:var(--ink);font-family:var(--body);font-size:16px;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:inherit}img{display:block;max-width:100%}h1,h2{font-family:var(--display);font-weight:400;line-height:1.08;margin:0}
.wrap{width:min(1040px,calc(100% - 32px));margin-inline:auto}
header{background:var(--pine);color:#fff;position:sticky;top:0;z-index:5}
header .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0}
.brand{font-family:var(--display);font-size:1.5rem;text-decoration:none;display:flex;align-items:center;gap:10px}
.brand svg{width:30px;height:30px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:999px;font-weight:600;font-size:.95rem;text-decoration:none;border:1px solid transparent;transition:transform .3s,box-shadow .3s}
.btn:hover{transform:translateY(-2px)}.btn-honey{background:var(--honey);color:var(--pine)}.btn-honey:hover{box-shadow:0 12px 30px -10px rgba(217,164,90,.7)}
.btn-ghost{border-color:rgba(255,255,255,.4);color:#fff}.btn-line{border-color:var(--line);color:var(--ink)}
.hdr-cta{display:flex;gap:8px}@media(max-width:600px){.hdr-cta .btn-ghost{display:none}.hdr-cta .btn{padding:10px 16px;font-size:.85rem}}
.hero{background:var(--pine);color:#eef0ea;padding:40px 0 56px}
.crumbs{font-size:.8rem;opacity:.7;margin-bottom:18px}.crumbs a{text-decoration:none}
.hero h1{font-size:clamp(2.3rem,5.4vw,4.2rem);max-width:18ch}
.hero .lead{font-size:1.12rem;color:rgba(238,240,234,.8);max-width:60ch;margin:18px 0 26px}
.hero .cta{display:flex;gap:10px;flex-wrap:wrap}
.hero-img{margin-top:34px;border-radius:var(--r);overflow:hidden;aspect-ratio:16/8}.hero-img img{width:100%;height:100%;object-fit:cover}
.rating{display:flex;gap:10px;flex-wrap:wrap;margin-top:22px;font-size:.85rem}.rating a{border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:6px 14px;text-decoration:none}.rating b{color:var(--honey)}
main section{padding:44px 0;border-bottom:1px solid var(--line)}
main h2{font-size:clamp(1.8rem,3.4vw,2.6rem);margin-bottom:16px}
main p{margin:0 0 14px;max-width:70ch;color:var(--ink-2);font-size:1.05rem}
.pics{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}.pics img{border-radius:12px;aspect-ratio:4/3;object-fit:cover;width:100%}
@media(max-width:600px){.pics{grid-template-columns:1fr}}
.faq details{border-top:1px solid var(--line);padding:16px 0}.faq summary{cursor:pointer;font-weight:600;font-size:1.05rem}.faq details p{margin-top:10px}
.book{background:var(--paper);border-radius:var(--r);padding:30px;margin:44px 0;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.book h2{font-size:clamp(1.6rem,3vw,2.2rem);margin:0}
.more{padding:10px 0 50px}.more h2{font-size:1.6rem;margin-bottom:14px}.more ul{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:10px}
.more a{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:9px 16px;text-decoration:none;background:#fff;transition:border-color .3s}.more a:hover{border-color:var(--honey)}
footer{background:var(--pine);color:rgba(238,240,234,.75);padding:30px 0;font-size:.9rem}footer a{color:#fff}
.fab{position:fixed;right:18px;bottom:18px;width:58px;height:58px;border-radius:50%;background:#25d366;display:grid;place-items:center;box-shadow:0 10px 30px -8px rgba(0,0,0,.5);z-index:6}.fab svg{width:30px;height:30px;fill:#fff}`;

const logo = `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1c3327"/><path d="M32 10 12 40h10v14h20V40h10z" fill="#d9a45a"/></svg>`;
const waIcon = `<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.2.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l2 .9c.3.2.5.2.6.4.1.1.1.7-.1 1.2z"/></svg>`;

const metrika = `<script>(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
ym(${YM},'init',{webvisor:true,clickmap:true,trackLinks:true,accurateTrackBounce:true});
document.addEventListener('click',function(e){var a=e.target.closest('a');if(!a)return;var h=a.getAttribute('href')||'';try{if(h.indexOf('wa.me')>-1)ym(${YM},'reachGoal','whatsapp',{place:'посадочная'});else if(h.indexOf('tel:')===0)ym(${YM},'reachGoal','phone');}catch(x){}},true);</script>
<noscript><div><img src="https://mc.yandex.ru/watch/${YM}" style="position:absolute;left:-9999px" alt=""></div></noscript>`;

function page(p) {
  const url = `${SITE}/${p.slug}/`;
  const others = pages.filter(o => o.slug !== p.slug);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'GelaLand', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: p.h1, item: url }] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    { '@context': 'https://schema.org', '@type': 'LodgingBusiness', name: 'GelaLand', url: SITE + '/', telephone: PHONE_TXT,
      image: `${SITE}/img/${p.photo}`, checkinTime: '16:00', checkoutTime: '12:00', petsAllowed: true,
      address: { '@type': 'PostalAddress', addressCountry: 'RU', addressRegion: 'Ярославская область', addressLocality: 'село Золоторучье, Угличский район', streetAddress: 'КП Заречный' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', bestRating: '5', reviewCount: '166' } }
  ];
  const sections = p.sections.map(s => `<section><div class="wrap"><h2>${esc(s.h2)}</h2>${s.p.map(t => `<p>${esc(t)}</p>`).join('')}${s.photos ? `<div class="pics">${s.photos.map(([f, alt]) => `<img src="/img/${f}" alt="${esc(alt)}" loading="lazy" width="640" height="480">`).join('')}</div>` : ''}</div></section>`).join('\n');
  const faq = `<section class="faq"><div class="wrap"><h2>Частые вопросы</h2>${p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>`;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(p.h1)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:image" content="${SITE}/img/${p.photo}">
<meta property="og:type" content="website"><meta property="og:url" content="${url}"><meta property="og:locale" content="ru_RU"><meta property="og:site_name" content="GelaLand">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oranienbaum&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
<style>${css}</style>
</head>
<body>
<header><div class="wrap"><a class="brand" href="/">${logo}GelaLand</a><div class="hdr-cta"><a class="btn btn-ghost" href="tel:${PHONE}">${PHONE_TXT}</a><a class="btn btn-honey" href="/#houses">Выбрать даты</a></div></div></header>
<div class="hero"><div class="wrap">
<div class="crumbs"><a href="/">GelaLand</a> / ${esc(p.menu)}</div>
<h1>${esc(p.h1)}</h1>
<p class="lead">${esc(p.lead)}</p>
<div class="cta"><a class="btn btn-honey" href="${WA}" target="_blank" rel="noopener">Написать в WhatsApp</a><a class="btn btn-ghost" href="/#houses">Дома и свободные даты</a></div>
<div class="rating"><a href="https://yandex.ru/maps/org/gelaland/76023575337/reviews/" target="_blank" rel="noopener">Яндекс Карты <b>4,8</b></a><a href="https://www.avito.ru/brands/i141614221" target="_blank" rel="noopener">Авито <b>4,9</b></a><a href="https://travel.yandex.ru/hotels/yaroslavl-oblast/gelaland/" target="_blank" rel="noopener">Яндекс Путешествия <b>4,8</b></a></div>
<div class="hero-img"><img src="/img/${p.photo}" alt="${esc(p.photoAlt)}" width="1200" height="600"></div>
</div></div>
<main>
${sections}
${faq}
<div class="wrap"><div class="book"><h2>Узнать свободные даты</h2><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-honey" href="${WA}" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn-line" href="tel:${PHONE}">${PHONE_TXT}</a></div></div></div>
<div class="wrap more"><h2>Ещё о GelaLand</h2><ul><li><a href="/">Главная: дома, фото, отзывы</a></li>${others.map(o => `<li><a href="/${o.slug}/">${esc(o.menu)}</a></li>`).join('')}<li><a href="/#rules">Памятка гостя</a></li></ul></div>
</main>
<footer><div class="wrap">GelaLand. Ярославская область, Угличский район, село Золоторучье, КП Заречный. Телефон и WhatsApp: <a href="tel:${PHONE}">${PHONE_TXT}</a>. Заезд с 16:00, выезд до 12:00.</div></footer>
<a class="fab" href="${WA}" target="_blank" rel="noopener" aria-label="Написать в WhatsApp">${waIcon}</a>
${metrika}
</body>
</html>
`;
}

for (const p of pages) {
  const dir = path.join(ROOT, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(p));
}

const urls = [{ loc: SITE + '/', pr: '1.0' }, ...pages.map(p => ({ loc: `${SITE}/${p.slug}/`, pr: '0.8' }))];
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u.pr}</priority>
  </url>`).join('\n')}
</urlset>
`);
console.log('built', pages.length, 'pages:', pages.map(p => '/' + p.slug + '/').join(' '));
