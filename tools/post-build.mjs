// Dopo "vite build": dati strutturati, pagine di condivisione dei prodotti
// (anteprima Open Graph), sitemap. Legge solo src/data/*.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const radice = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(radice, process.argv[2] || 'dist');
const sito = JSON.parse(readFileSync(resolve(radice, 'src/data/site.json'), 'utf8'));
const { prodotti, categorie } = JSON.parse(readFileSync(resolve(radice, 'src/data/products.json'), 'utf8'));
const base = (sito.url || '').replace(/\/$/, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

if (!existsSync(dist)) {
  console.error(`Cartella ${dist} non trovata: esegui prima "vite build".`);
  process.exit(1);
}
if (!base) console.warn('ATTENZIONE: "url" non impostato in src/data/site.json → niente sitemap, e le anteprime social useranno indirizzi relativi (alcuni social non le mostreranno).');

// 1. Dati strutturati (solo i dati realmente presenti: nulla di inventato)
const negozio = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: sito.nome,
  ...(base && { url: base, image: `${base}/assets/site/og.jpg` }),
  ...(sito.telefono && { telephone: sito.telefono }),
  ...(sito.email && { email: sito.email }),
  address: { '@type': 'PostalAddress', ...(sito.indirizzo && { streetAddress: sito.indirizzo }), addressLocality: 'Lugo', addressRegion: 'RA', addressCountry: 'IT' },
  ...(sito.orari && { openingHours: sito.orari }),
  sameAs: Object.values(sito.social || {}).filter(Boolean),
};
const home = resolve(dist, 'index.html');
writeFileSync(home, readFileSync(home, 'utf8').replace('<!-- dati-strutturati -->', `<script type="application/ld+json">${JSON.stringify(negozio)}</script>`));

// 2. Una pagina leggera per prodotto: /p/<id>/ con anteprima curata, poi porta alla Vetrina Digitale
const nomeCat = (id) => (categorie.find((c) => c.id === id) || {}).nome || '';
for (const p of prodotti) {
  const v = p.varianti[0];
  const destinazione = `/vetrina/?prodotto=${p.id}`;
  const immagine = `${base}/assets/products/${v.immagine}.webp`;
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.nome)} — ${esc(sito.nome)}</title>
<meta name="description" content="${esc(p.descrizione)}">
<link rel="canonical" href="${base}${destinazione}">
<meta property="og:type" content="product"><meta property="og:site_name" content="${esc(sito.nome)}">
<meta property="og:title" content="${esc(p.nome)} — ${esc(sito.nome)}">
<meta property="og:description" content="${esc(`${nomeCat(p.categoria)} · ${p.varianti.map((x) => x.nome).join(', ')}`)}">
<meta property="og:image" content="${immagine}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="1500">
<meta property="og:url" content="${base}/p/${p.id}/"><meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${destinazione}"><script>location.replace(${JSON.stringify(destinazione)})</script>
</head><body><p><a href="${destinazione}">${esc(p.nome)} — apri nella Vetrina Digitale</a></p></body></html>`;
  const cartella = resolve(dist, 'p', p.id);
  mkdirSync(cartella, { recursive: true });
  writeFileSync(resolve(cartella, 'index.html'), html);
}

// 3. Sitemap e robots (solo con l'indirizzo definitivo)
if (base) {
  const pagine = ['/', '/vetrina/', '/privacy/', ...prodotti.map((p) => `/p/${p.id}/`)];
  writeFileSync(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pagine.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
}
console.log(`post-build: ${prodotti.length} pagine prodotto, dati strutturati${base ? ', sitemap' : ''}.`);
