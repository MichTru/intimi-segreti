// HOME. Nessuna animazione è legata allo scroll: l'apertura è un'immagine,
// le copertine sono una giostra che gira da sola, nastro e rella scorrono da
// soli, il resto entra una volta quando arriva sullo schermo. Tutto ciò che si
// muove da solo si può fermare.
import { montaCornice } from '../core/cornice.js';
import { testoTotale, messaggioNovita, messaggioBuono } from '../core/atelier.js';
import { Preferiti } from '../core/memoria.js';
import { avvisa } from '../core/avviso.js';
import '../styles/home.css';

import sito from '../data/site.json';
import { riduciMovimento } from '../motion/tokens.js';
import { livelloQualita } from '../core/qualita.js';
import { prodotti, categorie, copertine, look, filtra, perId, nomeCategoria, figura, src, prezzo } from '../core/catalogo.js';
import { inviaRichiesta, messaggioAppuntamento, notaRichiesta, etichettaRichiesta } from '../core/contatto.js';

const html = document.documentElement;
const statico = riduciMovimento();
html.classList.add(`livello-${livelloQualita()}`);
if (statico) html.classList.add('statico');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const due = (n) => String(n).padStart(2, '0');
const euro = (n) => prezzo({ prezzo: Math.round(n * 100) / 100 });
const SITO = '/assets/site/';

montaCornice();

// ------------------------------------------------------------------
// Contenuti dal file dati
// ------------------------------------------------------------------
const timbro = (testo, id) => `<div class="c-timbro" aria-hidden="true"><svg viewBox="0 0 120 120">
  <defs><path id="giro-${id}" d="M60 60 m-46 0 a46 46 0 1 1 92 0 a46 46 0 1 1 -92 0"/></defs>
  <circle cx="60" cy="60" r="58"/><circle cx="60" cy="60" r="33"/>
  <text><textPath href="#giro-${id}" textLength="282">${testo}</textPath></text>
  <path class="stella" d="M60 46 63.500 56.500 74 60 63.500 63.500 60 74 56.500 63.500 46 60 56.500 56.500Z"/></svg></div>`;

// posizioni (in % sul capo scontornato) dei riflessi che si accendono a turno
const LUCCICHII = [[30, 58, 26, 0], [62, 66, 20, 0.5], [44, 80, 30, 1.1], [74, 84, 22, 1.6], [22, 78, 18, 2.0], [52, 54, 16, 0.8], [36, 92, 24, 1.4]];

// Apertura: l'immagine a tutto schermo. Copertine: i capi in evidenza, in una
// giostra compatta che gira da sola e si comanda.
function costruisciApertura() {
  const m = copertine.find((c) => c.manifesto);
  const box = $('[data-apertura]');
  if (!m) { box.closest('section').hidden = true; return; }
  box.innerHTML = `
    <picture class="m-foto">
      <source media="(max-width: 767px)" srcset="${SITO}${m.manifesto}-verticale.webp">
      <img src="${SITO}${m.manifesto}.webp" alt="${sito.nome}: immagine di copertina" fetchpriority="high" decoding="async" draggable="false">
    </picture>
    <div class="m-velo" aria-hidden="true"></div>
    <div class="m-testo">
      <img class="m-logo" src="${SITO}logo-oro.webp" alt="" width="943" height="512">
      <p class="occhiello">Boutique · ${sito.luogo}</p>
      <p class="m-frase">${m.frase || ''}</p>
      <div class="m-azioni"><a class="bottone pieno" href="/vetrina/">Vetrina Digitale</a><a class="bottone" href="/#copertina">In copertina</a></div>
    </div>`;
}

function costruisciCopertine() {
  const valide = copertine.map((c) => ({ ...c, p: c.prodotto ? perId(c.prodotto) : null })).filter((c) => c.p);
  $('[data-copertine]').innerHTML = valide
    .map((c, i) => {
      const { p } = c;
      const v = p.varianti[0];
      const sat = c.satellite ? perId(c.satellite.prodotto) : null;
      const link = `/vetrina/?prodotto=${p.id}`;
      const soggetto = c.scontorno
        ? `<a class="c-soggetto scontorno" href="${link}" data-cursore="apri" aria-label="${p.nome}: apri la scheda"><img src="${SITO}${c.scontorno}.webp" alt="${p.nome}" loading="lazy" decoding="async" draggable="false"><span class="c-luccichii" aria-hidden="true">${LUCCICHII.map(([x, y, g, d]) => `<i style="--x:${x}%;--y:${y}%;--g:${g}px;--d:${d}s"></i>`).join('')}</span></a>`
        : `<a class="c-soggetto arco" href="${link}" data-cursore="apri" aria-label="${p.nome}: apri la scheda"><img src="${src(v.immagine)}" alt="${p.nome}" loading="lazy" decoding="async" draggable="false"></a>`;
      const satellite = !sat ? '' : c.satellite.scontorno
        ? `<a class="c-satellite scontornato" href="/vetrina/?prodotto=${sat.id}" aria-label="${sat.nome}, ${prezzo(sat)}"><img src="${SITO}${c.satellite.scontorno}.webp" alt="" loading="lazy" draggable="false"></a>`
        : `<a class="c-satellite cartolina" href="/vetrina/?prodotto=${sat.id}" aria-label="${sat.nome}, ${prezzo(sat)}"><img src="${src(sat.varianti[0].immagine, 600)}" alt="" loading="lazy" draggable="false"><b>${sat.nome} · ${prezzo(sat)}</b></a>`;
      return `<article class="copertina tema-${c.tema}${i ? '' : ' attiva'}" data-tema="${c.tema}" aria-roledescription="scheda" aria-label="${i + 1} di ${valide.length}: ${p.nome}"${i ? ' inert' : ''}>
        <div class="c-alone"></div>
        <p class="c-parola" aria-hidden="true">${c.parola}</p>
        ${soggetto}
        <p class="c-parola contorno" aria-hidden="true">${c.parola}</p>
        ${satellite}
        ${timbro(`${p.novita ? 'Novità in vetrina' : 'In vetrina'} · ${sito.luogo} · `, i)}
        <div class="c-info">
          <p class="occhiello">${p.marchio || nomeCategoria(p.categoria)}</p>
          <h2 class="c-nome">${p.nome}</h2>
          <p class="c-prezzo">${prezzo(p)}<small>${p.sottocategoria || ''}</small></p>
          <a class="bottone pieno c-vai" href="${link}">Scopri</a>
        </div>
      </article>`;
    })
    .join('');
  $('[data-giostra-punti]').innerHTML = valide.map((c, i) => `<button type="button" data-vai="${i}" aria-label="Mostra ${c.p.nome}"${i ? '' : ' aria-current="true"'}><i></i></button>`).join('');
  return $$('.copertina');
}

// Giostra delle copertine: cambia da sola ogni 6 secondi. Si ferma se ci passi
// sopra, se la tocchi o con il tasto pausa; frecce, puntini e swipe la comandano.
function montaGiostra() {
  const zona = $('#copertina');
  const punti = $$('[data-vai]', zona);
  const pausaBtn = $('[data-giostra-pausa]');
  const n = pagine.length;
  if (n < 2) { $('.giostra-comandi').hidden = true; return () => {}; }
  const DURATA = 6000;
  let attuale = 0;
  let timer = 0;
  let inPausa = statico;
  let sopra = false;
  let visibile = false;
  let dito = null;

  const riparti = () => {
    clearTimeout(timer);
    const gira = !inPausa && !sopra && visibile;
    zona.classList.toggle('gira', gira);
    if (!gira) return;
    // riavvia la barretta del puntino attivo
    const barra = punti[attuale].firstElementChild;
    barra.style.animation = 'none';
    void barra.offsetWidth;
    barra.style.animation = '';
    timer = setTimeout(() => mostra(attuale + 1), DURATA);
  };
  function mostra(i, daUtente = false) {
    attuale = (i + n) % n;
    pagine.forEach((el, k) => {
      el.classList.toggle('attiva', k === attuale);
      el.inert = k !== attuale;
    });
    punti.forEach((b, k) => (k === attuale ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    zona.dataset.tema = pagine[attuale].dataset.tema;
    tono(zona, pagine[attuale].dataset.tema === 'borgogna' ? 'scuro' : 'chiaro');
    if (daUtente) $('[data-giostra-annuncio]').textContent = pagine[attuale].getAttribute('aria-label');
    riparti();
  }

  zona.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vai], [data-giostra-prima], [data-giostra-dopo]');
    if (!b) return;
    if (b.dataset.vai != null) mostra(Number(b.dataset.vai), true);
    else mostra(attuale + (b.hasAttribute('data-giostra-dopo') ? 1 : -1), true);
  });
  pausaBtn.setAttribute('aria-pressed', String(inPausa));
  pausaBtn.addEventListener('click', () => {
    inPausa = !inPausa;
    pausaBtn.setAttribute('aria-pressed', String(inPausa));
    pausaBtn.setAttribute('aria-label', inPausa ? 'Riprendi il cambio automatico' : 'Ferma il cambio automatico');
    riparti();
  });
  const entra = () => { sopra = true; riparti(); };
  const esce = () => { sopra = false; riparti(); };
  // solo il mouse "sta sopra": su un telefono il tocco non deve lasciarla ferma per sempre
  zona.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && entra());
  zona.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && esce());
  zona.addEventListener('focusin', (e) => e.target.matches(':focus-visible') && entra());
  zona.addEventListener('focusout', esce);
  // swipe orizzontale; lo scroll verticale della pagina resta libero
  zona.addEventListener('touchstart', (e) => { dito = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  zona.addEventListener('touchend', (e) => {
    if (!dito) return;
    const dx = e.changedTouches[0].clientX - dito.x;
    const dy = e.changedTouches[0].clientY - dito.y;
    dito = null;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.4) mostra(attuale + (dx < 0 ? 1 : -1), true);
  }, { passive: true });
  zona.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') mostra(attuale + 1, true);
    else if (e.key === 'ArrowLeft') mostra(attuale - 1, true);
  });
  let inVista = false;
  const aggiornaVista = () => { visibile = inVista && !document.hidden; riparti(); };
  const occhio = new IntersectionObserver(([v]) => { inVista = v.isIntersecting; aggiornaVista(); }, { threshold: 0.35 });
  occhio.observe(zona);
  document.addEventListener('visibilitychange', aggiornaVista);
  mostra(0);
  return () => {
    clearTimeout(timer);
    occhio.disconnect();
    document.removeEventListener('visibilitychange', aggiornaVista);
  };
}

function costruisciNastro() {
  const voci = [...categorie.map((c) => c.nome), sito.luogo.replace(/\s*\(.*\)/, ''), 'Vetrina Digitale'];
  const riga = voci.map((v) => `${v}<i>✦</i>`).join('');
  $$('[data-nastro]').forEach((s) => (s.innerHTML = riga.repeat(2)));
}

const APPENDINO = '<span class="appendino" aria-hidden="true"><svg class="gancio" viewBox="0 0 28 44"><path d="M14 44V22a9 9 0 1 0-9-9"/></svg><svg class="spalle" viewBox="0 0 100 29" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M50 1 2 27h96Z"/></svg></span>';

function costruisciRella() {
  const capo = (p, i, copia) => `<li class="gruccia"${copia ? ' aria-hidden="true"' : ''}>${APPENDINO}<a href="/vetrina/?prodotto=${p.id}"${copia ? ' tabindex="-1"' : ''} draggable="false">
        <div class="gruccia-foto">${figura(p.varianti[0], copia ? '' : p.nome, { sizes: '(min-width: 768px) 310px, 54vw' })}</div>
        <h3>${p.nome}</h3><b>${prezzo(p)}</b><small>${p.marchio || nomeCategoria(p.categoria)}${p.novita ? ' · Novità' : ''}</small></a></li>`;
  // la serie è scritta due volte: quando la prima esce, la seconda è già al suo posto
  $('[data-rella]').innerHTML = prodotti.map((p, i) => capo(p, i, false)).join('') + (statico ? '' : prodotti.map((p, i) => capo(p, i, true)).join(''));
}

// La rella va avanti piano da sola. Si ferma se ci passi sopra, la tocchi o
// premi pausa; si trascina col dito o col mouse; le frecce spostano di un capo.
function montaRella() {
  const binario = $('[data-binario]');
  const rella = $('[data-rella]');
  const pausaBtn = $('[data-rella-pausa]');
  if (statico) {
    $('.rella-comandi').hidden = true;
    return () => {};
  }
  const VELOCITA = 26; // pixel al secondo
  let x = 0; // quanto è scorsa (0 … metà larghezza)
  let meta = null; // spostamento richiesto dalle frecce
  let giro = 1;
  let passo = 1;
  let inPausa = false;
  let sopra = false;
  let visibile = false;
  let presa = null;
  let trascinato = false;
  let id = 0;
  let ultimo = 0;

  const misura = () => {
    giro = rella.scrollWidth / 2;
    const g = rella.querySelector('.gruccia');
    passo = g ? g.getBoundingClientRect().width + parseFloat(getComputedStyle(g).marginRight) : 300;
  };
  const disegna = () => {
    x = ((x % giro) + giro) % giro;
    rella.style.transform = `translate3d(${-x.toFixed(1)}px, 0, 0)`;
  };
  const gira = (ora) => {
    id = requestAnimationFrame(gira);
    const dt = Math.min(64, ora - ultimo);
    ultimo = ora;
    if (presa) return;
    if (meta != null) {
      const d = meta - x;
      if (Math.abs(d) < 0.6) { x = meta; meta = null; } else x += d * 0.12;
    } else if (!inPausa && !sopra) x += (VELOCITA * dt) / 1000;
    else return;
    disegna();
  };
  const avvia = () => {
    if (id || !visibile) return;
    ultimo = performance.now();
    id = requestAnimationFrame(gira);
  };
  const ferma = () => {
    cancelAnimationFrame(id);
    id = 0;
  };

  const giu = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    presa = { x0: e.clientX, y0: e.clientY, inizio: x, id: e.pointerId, deciso: false };
    trascinato = false;
    meta = null;
  };
  const muovi = (e) => {
    if (!presa || e.pointerId !== presa.id) return;
    const dx = e.clientX - presa.x0;
    if (!presa.deciso) {
      if (Math.abs(dx) < 6) return;
      if (Math.abs(e.clientY - presa.y0) > Math.abs(dx)) { presa = null; return; } // gesto verticale: è scroll della pagina
      presa.deciso = true;
      trascinato = true;
      binario.classList.add('trascina');
      try { binario.setPointerCapture(e.pointerId); } catch { /* già rilasciato */ }
    }
    x = presa.inizio - dx;
    disegna();
  };
  const su = () => {
    presa = null;
    binario.classList.remove('trascina');
  };
  const clic = (e) => {
    if (trascinato) { e.preventDefault(); e.stopPropagation(); trascinato = false; } // un trascinamento non apre il link
  };
  const sposta = (verso) => {
    const base = meta != null ? meta : x;
    meta = Math.round(base / passo) * passo + verso * passo;
    if (meta < 0) { x += giro; meta += giro; }
    if (meta > giro * 2 - 1) { x -= giro; meta -= giro; }
  };
  const alternaPausa = () => {
    inPausa = !inPausa;
    pausaBtn.setAttribute('aria-pressed', String(inPausa));
    pausaBtn.setAttribute('aria-label', inPausa ? 'Riprendi lo scorrimento' : 'Ferma lo scorrimento');
  };
  const entra = () => (sopra = true);
  const esce = () => (sopra = false);

  binario.addEventListener('pointerdown', giu);
  binario.addEventListener('pointermove', muovi);
  binario.addEventListener('pointerup', su);
  binario.addEventListener('pointercancel', su);
  binario.addEventListener('click', clic, true);
  binario.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && entra());
  binario.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && esce());
  binario.addEventListener('focusin', (e) => e.target.matches(':focus-visible') && entra());
  binario.addEventListener('focusout', esce);
  $('[data-rella-prima]').addEventListener('click', () => sposta(-1));
  $('[data-rella-dopo]').addEventListener('click', () => sposta(1));
  pausaBtn.addEventListener('click', alternaPausa);
  window.addEventListener('resize', misura);
  const occhio = new IntersectionObserver(([v]) => {
    visibile = v.isIntersecting;
    if (visibile) { misura(); avvia(); } else ferma();
  });
  occhio.observe(binario);
  misura();
  return () => {
    ferma();
    occhio.disconnect();
    window.removeEventListener('resize', misura);
  };
}

// Lookbook: i look scorrono in orizzontale mentre la pagina scende,
// come le pagine di una rivista. Ogni look si mette da parte con un tocco.
function costruisciLookbook() {
  const pista = $('[data-lookbook]');
  const validi = look.map((l) => ({ ...l, capi: l.capi.map(perId).filter(Boolean) })).filter((l) => l.capi.length >= 2);
  pista.innerHTML = validi
    .map((l, i) => {
      const [a, b] = l.capi;
      const parole = l.nome.split(' ');
      const titolo = parole.length > 1 ? `${parole.slice(0, -1).join(' ')} <em>${parole.at(-1)}</em>` : `<em>${l.nome}</em>`;
      return `<article class="pagina-look" style="--i:${i}" aria-label="${l.nome}">
        <a class="pl-foto" href="/vetrina/?prodotto=${a.id}" tabindex="-1" aria-hidden="true"><img src="${src(a.varianti[0].immagine)}" alt="" loading="lazy" width="1200" height="1500"></a>
        <a class="pl-foto2" href="/vetrina/?prodotto=${b.id}" tabindex="-1" aria-hidden="true"><img src="${src(b.varianti[0].immagine, 600)}" alt="" loading="lazy" width="600" height="750"></a>
        <div class="pl-testo">
          <h3>${titolo}</h3>
          <ul class="pl-capi">${l.capi.map((c) => `<li><a href="/vetrina/?prodotto=${c.id}">${c.nome}</a><span>${prezzo(c)}</span></li>`).join('')}</ul>
          <p class="pl-totale"><small>Insieme</small><span>${testoTotale(l.capi)}</span></p>
          <div class="pl-azioni">
            <button class="bottone pieno piccolo" type="button" data-look-camerino="${l.id}">Aggiungi al camerino</button>
          </div>
        </div>
      </article>`;
    })
    .join('');
  
  const capiDi = (id) => validi.find((l) => l.id === id).capi;
  const nelCamerino = (capi) => capi.forEach((p) => !Preferiti.ha(p.id) && Preferiti.alterna(p.id));
  pista.addEventListener('click', (e) => {
    const cam = e.target.closest('[data-look-camerino]');
    if (!cam) return;
    nelCamerino(capiDi(cam.dataset.lookCamerino));
    $('[data-apri-preferiti]').click(); // nel camerino si scelgono le taglie
  });
}

function montaLookbook() {
  const pista = $('[data-lookbook]');
  const barra = $('[data-lookbook-barra]');
  const pagine = $$('.pagina-look', pista);
  if (!pagine.length) return () => {};
  const passo = () => pagine[0].getBoundingClientRect().width + 14;
  const aggiorna = () => {
    const max = pista.scrollWidth - pista.clientWidth;
    const p = max > 0 ? pista.scrollLeft / max : 1;
    barra.style.transform = `scaleX(${(1 + p * (pagine.length - 1)) / pagine.length})`;
  };
  pista.addEventListener('scroll', aggiorna, { passive: true });
  $('[data-lookbook-prima]').addEventListener('click', () => pista.scrollBy({ left: -passo(), behavior: 'smooth' }));
  $('[data-lookbook-dopo]').addEventListener('click', () => pista.scrollBy({ left: passo(), behavior: 'smooth' }));
  aggiorna();
  return () => pista.removeEventListener('scroll', aggiorna);
}

// Buono regalo: la carta si aggiorna mentre si sceglie e si inclina seguendo il dito.
function montaBuono() {
  const modulo = $('[data-buono]');
  const scena = $('[data-buono-scena]');
  const carta = $('[data-buono-carta]');
  if (!modulo) return;
  const aggiorna = () => {
    const f = new FormData(modulo);
    $('[data-buono-cifra]').textContent = euro(Number(f.get('importo')));
    const per = String(f.get('per') || '').trim();
    const da = String(f.get('da') || '').trim();
    $('[data-buono-per]').textContent = per ? `Per ${per}` : 'Per te';
    $('[data-buono-da]').textContent = da ? `da ${da}` : '';
    carta.classList.remove('battito');
    void carta.offsetWidth;
    carta.classList.add('battito');
  };
  modulo.addEventListener('input', aggiorna);
  modulo.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(modulo);
    inviaRichiesta(messaggioBuono(Number(f.get('importo')), String(f.get('per') || '').trim(), String(f.get('da') || '').trim()));
  });
  if (statico) return;
  const inclina = (e) => {
    const r = scena.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    carta.style.setProperty('--ry', `${x * 22}deg`);
    carta.style.setProperty('--rx', `${-y * 18}deg`);
    carta.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
    carta.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
    carta.classList.add('tenuta');
  };
  scena.addEventListener('pointermove', inclina);
  scena.addEventListener('pointerdown', inclina);
  scena.addEventListener('pointerleave', () => carta.classList.remove('tenuta'));
  scena.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') carta.classList.remove('tenuta'); });
}

// Pellicola: una "gif" fatta con le foto dei capi, che scattano una dopo l'altra.
function montaPellicola() {
  const box = $('[data-pellicola]');
  if (!box) return () => {};
  box.innerHTML = `<div>${prodotti.map((p, i) => `<img src="${src(p.varianti[0].immagine, 600)}" alt="" loading="lazy"${i ? '' : ' class="ora"'}>`).join('')}</div><b>In boutique adesso</b>`;
  const foto = $$('img', box);
  let i = 0;
  let timer = 0;
  const scatta = () => {
    foto[i].classList.remove('ora');
    i = (i + 1) % foto.length;
    foto[i].classList.add('ora');
  };
  const occhio = new IntersectionObserver(([v]) => {
    clearInterval(timer);
    if (v.isIntersecting && !statico) timer = setInterval(scatta, 520); // gira solo quando si vede
  });
  occhio.observe(box);
  return () => {
    clearInterval(timer);
    occhio.disconnect();
  };
}

// Le collezioni: tre pannelli affiancati (uno sopra l'altro su telefono).
function costruisciTerzi() {
  $('[data-terzi]').innerHTML = categorie
    .map((c, i) => {
      const p = filtra(c.id)[0];
      const foto = p ? src(p.varianti[0].immagine) : `${SITO}manifesto-verticale.webp`; // senza capi: l'immagine della boutique
      return `<a class="terzo" href="${p ? `/vetrina/?categoria=${c.id}` : '/#contatti'}">
        <img src="${foto}" alt="" loading="lazy" width="1200" height="1500">
        
        <h3>${c.nome}</h3>
        <p>${c.frase}</p>
        <span class="terzo-vai">${p ? `Guarda ${c.nome.toLowerCase()}` : 'Contatta la boutique'}</span>
      </a>`;
    })
    .join('');
}

function riempiBoutique() {
  const attesa = (cosa) => `<span class="in-attesa">${cosa}: da inserire</span>`;
  $('[data-chi-siamo]').innerHTML = sito.chiSiamo
    ? `<p>${sito.chiSiamo}</p>`
    : `<p>Abbigliamento, accessori e moda mare a Lugo. Novità ogni settimana, e spediamo in tutta Italia.</p>`;
  const righe = [
    ['Indirizzo', sito.indirizzo && (sito.mappaLink ? `<a href="${sito.mappaLink}" target="_blank" rel="noopener">${sito.indirizzo}</a>` : sito.indirizzo)],
    ['Orari', sito.orari],
    ['Telefono', sito.telefono],
    ['WhatsApp', sito.whatsapp && `<a href="https://wa.me/${String(sito.whatsapp).replace(/\D/g, '')}" target="_blank" rel="noopener">${sito.whatsapp}</a>`],
    ['Social', Object.entries(sito.social || {}).filter(([, u]) => u).map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n[0].toUpperCase()}${n.slice(1)}</a>`).join(' · ')],
  ];
  $('[data-recapiti]').innerHTML = righe.filter(([, v]) => v).map(([t, v]) => `<div><dt>${t}</dt><dd>${v}</dd></div>`).join('');
  const btn = $('[data-appuntamento]');
  btn.textContent = sito.whatsapp ? 'Chiedi un appuntamento' : 'Copia la richiesta di appuntamento';
  btn.addEventListener('click', () => inviaRichiesta(messaggioAppuntamento()));
  const mappa = $('[data-mappa]');
  if (sito.mappaLink) mappa.innerHTML = `<div><p>${sito.indirizzo || sito.luogo}</p><p style="margin-top:14px"><a class="bottone" href="${sito.mappaLink}" target="_blank" rel="noopener">Apri la mappa</a></p></div>`;
  else mappa.hidden = true;
  $$('.boutique-colonna > *, .mappa').forEach((el) => el.classList.add('compare'));
}

costruisciApertura();
const pagine = costruisciCopertine();
costruisciNastro();
costruisciRella();
costruisciLookbook();
montaBuono();
$('[data-novita]').addEventListener('click', () => inviaRichiesta(messaggioNovita()));
const fermaPellicola = montaPellicola();
costruisciTerzi();
const fermaRella = montaRella();
const fermaLookbook = montaLookbook();
riempiBoutique();

// ------------------------------------------------------------------
// Tono della testata: chiaro o scuro secondo la sezione che ha sotto
// ------------------------------------------------------------------
let sezioneInAlto = null;
function tono(sezione, valore) {
  if (sezione && valore && sezione.dataset.tono !== valore) sezione.dataset.tono = valore;
  const t = sezioneInAlto ? sezioneInAlto.dataset.tono : 'scuro';
  if (html.dataset.tonoPagina !== t) html.dataset.tonoPagina = t;
}
function montaTono() {
  const piede = $('.piede');
  if (piede) piede.dataset.tono = 'scuro';
  const occhio = new IntersectionObserver((voci) => {
    voci.forEach((v) => {
      if (v.isIntersecting) sezioneInAlto = v.target;
    });
    tono();
  }, { rootMargin: '-28px 0px -96% 0px' }); // la fascia dove sta la testata
  $$('[data-tono]').forEach((el) => occhio.observe(el));
  return occhio;
}

// ------------------------------------------------------------------
// Capitoli, comparse, ancore
// ------------------------------------------------------------------
function vaiA(bersaglio, immediato = false) {
  const el = typeof bersaglio === 'string' ? $(bersaglio) : bersaglio;
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + 1, behavior: statico || immediato ? 'auto' : 'smooth' });
}

document.addEventListener('click', (e) => {
  const a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
  if (!a) return;
  const url = new URL(a.href, location.href);
  if (url.pathname !== location.pathname || url.hash.length < 2 || !$(url.hash)) return;
  e.preventDefault();
  history.replaceState(null, '', url.hash);
  vaiA(url.hash);
});

function montaCapitoli() {
  const nav = $('.capitoli');
  if (!nav) return () => {};
  const sezioni = $$('[data-capitolo]');
  nav.innerHTML = sezioni.map((s, i) => `<button type="button" data-i="${i}" aria-label="Vai a: ${s.dataset.capitolo}"><span>${s.dataset.capitolo}</span></button>`).join('');
  const bottoni = $$('button', nav);
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) vaiA(sezioni[Number(b.dataset.i)]);
  });
  const occhio = new IntersectionObserver((voci) => {
    voci.forEach((v) => {
      if (!v.isIntersecting) return;
      const i = sezioni.indexOf(v.target);
      bottoni.forEach((b, k) => b.setAttribute('aria-current', String(k === i)));
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  sezioni.forEach((s) => occhio.observe(s));
  return occhio;
}

function montaComparse() {
  const occhio = new IntersectionObserver((voci) => {
    voci.forEach((v) => {
      if (!v.isIntersecting) return;
      v.target.classList.add('visto');
      occhio.unobserve(v.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('.compare').forEach((el) => occhio.observe(el));
  return occhio;
}

// ------------------------------------------------------------------
// Avvio e pulizia
// ------------------------------------------------------------------
let fermaGiostra = () => {};
const osservatori = [];

// Intro: il logo si scrive, poi le ante si aprono e parte l'ingresso della
// copertina. Dura meno di tre secondi e si salta con un tocco o un tasto.
function intro(poi) {
  const el = $('#intro');
  // Si vede a ogni apertura della home, ma non quando si torna da un'altra
  // pagina del sito (Vetrina Digitale, privacy) né arrivando su un'ancora.
  let daDentro = false;
  try {
    daDentro = !!document.referrer && new URL(document.referrer).origin === location.origin && new URL(document.referrer).pathname !== location.pathname;
  } catch { daDentro = false; }
  if (!el || daDentro || location.hash) return poi();
  el.hidden = false;
  html.classList.add('intro-in-corso');
  let aperta = false;
  const apri = () => {
    if (aperta) return;
    aperta = true;
    clearTimeout(attesa);
    window.removeEventListener('keydown', apri);
    el.classList.add('apri');
    html.classList.remove('intro-in-corso');
    poi();
    setTimeout(() => (el.hidden = true), 1050);
  };
  const attesa = setTimeout(apri, 1700);
  el.addEventListener('click', apri);
  window.addEventListener('keydown', apri);
  return undefined;
}

function avvia() {
  if (statico) {
    $$('.compare').forEach((el) => el.classList.add('visto'));
    osservatori.push(montaTono());
    fermaGiostra = montaGiostra(); // senza cambio automatico: solo comandi
    return;
  }
  intro(() => {
    html.classList.add('ingresso');
    setTimeout(() => html.classList.remove('ingresso'), 2600);
  });
  osservatori.push(montaCapitoli(), montaComparse(), montaTono());
  fermaGiostra = montaGiostra();
  // i loop continui (timbro, scintillii, bollino) girano solo quando si vedono
  const pausa = new IntersectionObserver((voci) => voci.forEach((v) => v.target.classList.toggle('in-pausa', !v.isIntersecting)));
  $$('#vetrina, #copertina, [data-pellicola], [data-loop]').forEach((el) => pausa.observe(el));
  osservatori.push(pausa);
  if (location.hash && $(location.hash)) requestAnimationFrame(() => vaiA(location.hash, true));
}

avvia();
window.addEventListener('pagehide', (e) => {
  if (e.persisted) return;
  osservatori.forEach((o) => o && o.disconnect && o.disconnect());
  fermaPellicola();
  fermaGiostra();
  fermaRella();
  fermaLookbook();
});
