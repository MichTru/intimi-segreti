// VETRINA DIGITALE — il catalogo.
// Due modalità sugli stessi dati: Vetrina (un capo alla volta, swipe) e Griglia.
// Lo stato vive nell'URL: /vetrina/?vista=griglia&categoria=intimo&prodotto=id
import { montaCornice } from '../core/cornice.js';
import '../styles/vetrina.css';

import { gsap } from 'gsap';
import { EASE, DUR, riduciMovimento } from '../motion/tokens.js';
import { riscrivi } from '../motion/testo.js';
import { livelloQualita } from '../core/qualita.js';
import { locale, Preferiti } from '../core/memoria.js';
import { FILTRI, filtra, perId, nomeCategoria, figura, prezzo, GRUPPI, ORDINI, scelteVuote, quanteScelte, raffina, ordina, opzioni, senzaTaglia } from '../core/catalogo.js';
import { creaScheda } from '../core/scheda.js';
import { ICONE } from '../core/icone.js';

const html = document.documentElement;
const corpo = document.body;
const livello = livelloQualita();
const statico = riduciMovimento();
html.classList.add(`livello-${livello}`);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const due = (n) => String(n).padStart(2, '0');

montaCornice();

const palco = $('#palco');
const capiBox = $('[data-capi]');
const buio = $('.palco-buio');
const zonaGriglia = $('#griglia');
const griglia = $('[data-griglia]');
const annuncio = $('#annuncio');
const elNome = $('[data-nome]');
const elCategoria = $('[data-categoria]');
const elNumero = $('[data-numero]');
const elTotale = $('[data-totale]');
const elVuoto = $('[data-vuoto]');
const suggerimento = $('[data-suggerimento]');

// ------------------------------------------------------------------
// Stato
// ------------------------------------------------------------------
const stato = {
  vista: 'vetrina',
  filtro: 'tutti',
  scelte: scelteVuote(), // filtri fini: tipo, marchio, colore, taglia, prezzo
  ordine: 'novita',
  lista: [],
  indice: 0,
  pos: 0, // posizione continua: segue il dito durante lo swipe
};
let capi = [];
let tinte = [];
let moto = null; // tween in corso sulla posizione
let daCronologia = false;

const filtroValido = (f) => (FILTRI.some((x) => x.id === f) ? f : 'tutti');
const corrente = () => stato.lista[stato.indice] || null;

function leggiURL() {
  const q = new URLSearchParams(location.search);
  const salvata = locale.leggi('is:vista');
  // Con movimento ridotto o dispositivi lenti la griglia è la modalità predefinita.
  const predefinita = statico || livello === 'essenziale' ? 'griglia' : 'vetrina';
  const vista = q.get('vista');
  return {
    vista: vista === 'griglia' || vista === 'vetrina' ? vista : salvata === 'griglia' || salvata === 'vetrina' ? salvata : predefinita,
    filtro: filtroValido(q.get('categoria') || 'tutti'),
    scelte: Object.fromEntries(GRUPPI.map((g) => [g.id, (q.get(g.id) || '').split(',').filter(Boolean)])),
    ordine: ORDINI.some((o) => o.id === q.get('ordine')) ? q.get('ordine') : 'novita',
    prodotto: q.get('prodotto'),
    colore: q.get('colore'),
  };
}

function scriviURL({ spingi = false, prodotto = null, colore = null } = {}) {
  if (daCronologia) return;
  const q = new URLSearchParams();
  if (stato.vista === 'griglia') q.set('vista', 'griglia');
  if (stato.filtro !== 'tutti') q.set('categoria', stato.filtro);
  GRUPPI.forEach((g) => stato.scelte[g.id].length && q.set(g.id, stato.scelte[g.id].join(',')));
  if (stato.ordine !== 'novita') q.set('ordine', stato.ordine);
  if (prodotto) {
    q.set('prodotto', prodotto);
    if (colore) q.set('colore', colore);
  }
  const url = `${location.pathname}${q.toString() ? `?${q}` : ''}`;
  if (url === location.pathname + location.search) return;
  if (spingi) history.pushState({ scheda: true }, '', url);
  else history.replaceState(prodotto ? history.state : null, '', url);
}

// ------------------------------------------------------------------
// Scheda prodotto
// ------------------------------------------------------------------
const scheda = creaScheda({
  alCambio(aperta, p, v) {
    if (aperta) {
      const giaInUrl = new URLSearchParams(location.search).get('prodotto') === p.id;
      scriviURL({ spingi: !giaInUrl, prodotto: p.id, colore: v.id });
      return;
    }
    if (daCronologia) return;
    if (history.state && history.state.scheda) history.back();
    else scriviURL();
    aggiornaCuori();
  },
});

function apriScheda(p, idColore) {
  if (!p) return;
  const i = stato.lista.indexOf(p);
  if (i >= 0 && i !== stato.indice && stato.vista === 'vetrina') vai(i, { immediato: true });
  else if (i >= 0) stato.indice = i;
  scheda.apri(p, idColore);
}

// ------------------------------------------------------------------
// Modalità Vetrina
// ------------------------------------------------------------------
const luminanza = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

function passoLaterale() {
  return palco.clientWidth * (palco.clientWidth < 768 ? 0.74 : 0.42);
}

function allestisci() {
  capiBox.innerHTML = stato.lista
    .map((p, i) => `<div class="capo" role="group" aria-roledescription="prodotto" aria-label="${p.nome}, ${i + 1} di ${stato.lista.length}" data-i="${i}" data-cursore="apri" hidden>
      <div class="capo-foto">${figura(p.varianti[0], `${p.nome}, ${p.varianti[0].nome}${p.demo ? ' (immagine dimostrativa)' : ''}`, { sizes: '(min-width: 768px) 52vh, 96vw', pronta: i === stato.indice })}</div>
      ${p.novita ? '<span class="segno-novita">Novità</span>' : ''}
      ${p.demo ? '<span class="etichetta-demo">Immagine dimostrativa</span>' : ''}
    </div>`)
    .join('');
  capi = $$('.capo', capiBox);
  tinte = stato.lista.map((p) => p.tinta || '#e9dcc6');
  const vuota = !stato.lista.length;
  elVuoto.hidden = !vuota;
  $('.didascalia').style.visibility = vuota ? 'hidden' : '';
  if (vuota) {
    elVuoto.innerHTML = `${messaggioVuoto()}`;
  }
  elTotale.textContent = `/ ${due(stato.lista.length)}`;
}

// Disegna la vetrina per una posizione continua: profondità, rotazione,
// luci che si abbassano a metà cambio, fondale che sfuma tra le tinte.
function disegna() {
  const n = capi.length;
  if (!n) return;
  const pos = stato.pos;
  const passo = passoLaterale();
  for (let i = 0; i < n; i += 1) {
    const d = i - pos;
    const ad = Math.abs(d);
    const el = capi[i];
    if (ad > 2.2) {
      if (!el.hidden) el.hidden = true;
      continue;
    }
    if (el.hidden) el.hidden = false;
    const vicino = Math.min(ad, 1);
    el.style.transform = `translate3d(${(d * passo).toFixed(1)}px, ${(vicino * 18).toFixed(1)}px, ${(-ad * 430).toFixed(1)}px) rotateY(${(d * -34).toFixed(2)}deg) scale(${(1 - vicino * 0.1).toFixed(3)})`;
    el.style.zIndex = String(10 - Math.round(ad * 2));
    el.classList.toggle('di-lato', ad > 0.5);
    el.classList.toggle('corrente', ad < 0.25);
  }
  const a = gsap.utils.clamp(0, n - 1, Math.floor(pos));
  const b = Math.min(n - 1, a + 1);
  const t = gsap.utils.clamp(0, 1, pos - a);
  corpo.style.setProperty('--tinta', gsap.utils.interpolate(tinte[a], tinte[b], t));
  // le luci si abbassano a metà del cambio e si rialzano sul capo successivo
  buio.style.opacity = (Math.sin(Math.min(t, 1 - t) * Math.PI) * 0.42).toFixed(3);
}

function aggiornaTono() {
  const scura = stato.vista === 'vetrina' && corrente() ? luminanza(corrente().tinta || '#e9dcc6') < 0.45 : false;
  corpo.classList.toggle('scuro', scura);
  corpo.classList.toggle('chiaro', !scura);
  if (stato.vista === 'griglia') corpo.style.setProperty('--tinta', '#f4ece0'); // la griglia resta sempre in avorio
  const tema = document.querySelector('meta[name="theme-color"]');
  if (tema) tema.content = stato.vista === 'vetrina' && corrente() ? corrente().tinta : '#f4ece0';
}

function aggiornaDidascalia(verso = 1, anima = true) {
  const p = corrente();
  if (!p) return;
  elCategoria.textContent = [p.marchio || nomeCategoria(p.categoria), prezzo(p)].filter(Boolean).join(' · ');
  const lettere = riscrivi(elNome, p.nome);
  elNumero.textContent = due(stato.indice + 1);
  if (anima && !statico) {
    gsap.fromTo(lettere, { yPercent: 110 * verso, rotate: 6 * verso }, { yPercent: 0, rotate: 0, duration: DUR.media, ease: EASE.entrata, stagger: 0.012, overwrite: true });
    gsap.fromTo(elNumero, { yPercent: 60 * verso, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: DUR.breve, ease: EASE.entrata, overwrite: true });
    gsap.fromTo(elCategoria, { autoAlpha: 0 }, { autoAlpha: 1, duration: DUR.breve, overwrite: true });
  }
  capi.forEach((c, i) => {
    if (i === stato.indice) c.removeAttribute('aria-hidden');
    else c.setAttribute('aria-hidden', 'true');
  });
  annuncio.textContent = `${p.nome}, ${prezzo(p)}. Prodotto ${stato.indice + 1} di ${stato.lista.length}.`;
  aggiornaTono();
}

function vai(i, { immediato = false, slancio = 0 } = {}) {
  const n = stato.lista.length;
  if (!n) return;
  const bersaglio = gsap.utils.clamp(0, n - 1, i);
  const verso = bersaglio >= stato.indice ? 1 : -1;
  const cambia = bersaglio !== stato.indice;
  stato.indice = bersaglio;
  if (moto) moto.kill();
  if (immediato || statico) {
    stato.pos = bersaglio;
    disegna();
  } else {
    const distanza = Math.abs(bersaglio - stato.pos);
    // uno swipe deciso arriva prima: la durata tiene conto della velocità del gesto
    const durata = gsap.utils.clamp(0.35, 1.1, (DUR.media * Math.max(0.5, distanza)) / (1 + Math.abs(slancio) * 0.6));
    moto = gsap.to(stato, { pos: bersaglio, duration: durata, ease: EASE.entrata, onUpdate: disegna });
  }
  if (cambia) {
    aggiornaDidascalia(verso, !immediato);
    scriviURL();
  }
}

// ---------- Gesti: swipe che segue il dito, soglia e velocità ----------
const gesto = { attivo: false, asse: '', x0: 0, y0: 0, pos0: 0, t0: 0, ultimi: [], suCapo: false, id: null };

function nascondiSuggerimento() {
  if (suggerimento.hidden) return;
  suggerimento.hidden = true;
  locale.scrivi('is:suggerimento', true);
}

palco.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || e.target.closest('button, a')) return;
  // I bordi dello schermo restano al gesto "indietro" di Safari.
  if (e.pointerType === 'touch' && (e.clientX < 30 || e.clientX > innerWidth - 22)) return;
  Object.assign(gesto, { attivo: true, asse: '', x0: e.clientX, y0: e.clientY, pos0: stato.pos, t0: performance.now(), ultimi: [[e.clientX, performance.now()]], suCapo: !!e.target.closest('.capo.corrente'), id: e.pointerId });
});

palco.addEventListener('pointermove', (e) => {
  if (!gesto.attivo || e.pointerId !== gesto.id) return;
  const dx = e.clientX - gesto.x0;
  const dy = e.clientY - gesto.y0;
  if (!gesto.asse) {
    if (Math.abs(dx) > 8 && Math.abs(dx) >= Math.abs(dy)) {
      gesto.asse = 'x';
      if (moto) moto.kill();
      gesto.pos0 = stato.pos;
      gesto.x0 = e.clientX;
      try {
        palco.setPointerCapture(e.pointerId);
      } catch { /* puntatore già rilasciato */ }
      nascondiSuggerimento();
    } else if (Math.abs(dy) > 12) gesto.asse = 'y';
    return;
  }
  if (gesto.asse !== 'x') return;
  const n = stato.lista.length;
  let pos = gesto.pos0 - (e.clientX - gesto.x0) / passoLaterale();
  // ai due estremi la vetrina oppone resistenza
  if (pos < 0) pos *= 0.3;
  else if (pos > n - 1) pos = n - 1 + (pos - (n - 1)) * 0.3;
  stato.pos = pos;
  gesto.ultimi.push([e.clientX, performance.now()]);
  if (gesto.ultimi.length > 5) gesto.ultimi.shift();
  disegna();
});

function fineGesto(e) {
  if (!gesto.attivo || e.pointerId !== gesto.id) return;
  gesto.attivo = false;
  const dx = e.clientX - gesto.x0;
  const dy = e.clientY - gesto.y0;
  const durata = performance.now() - gesto.t0;
  if (gesto.asse === 'x') {
    const [x1, t1] = gesto.ultimi[0];
    const [x2, t2] = gesto.ultimi[gesto.ultimi.length - 1];
    const velocita = t2 > t1 ? (x2 - x1) / (t2 - t1) : 0; // px/ms
    const partenza = Math.round(gesto.pos0);
    const deciso = Math.abs(dx) > passoLaterale() * 0.22 || Math.abs(velocita) > 0.45;
    // un gesto corto annulla, uno deciso cambia
    const verso = Math.abs(velocita) > 0.45 ? -Math.sign(velocita) : -Math.sign(dx);
    vai(deciso ? partenza + verso : partenza, { slancio: velocita });
    return;
  }
  if (e.type === 'pointercancel') return;
  if (gesto.asse === 'y' && dy < -60) {
    nascondiSuggerimento();
    apriScheda(corrente()); // swipe verso l'alto: apre la scheda
    return;
  }
  if (!gesto.asse && durata < 400 && gesto.suCapo) {
    nascondiSuggerimento();
    apriScheda(corrente()); // tocco sul prodotto
  } else if (!gesto.asse && durata < 400) {
    const lato = e.target.closest('.capo');
    if (lato) vai(Number(lato.dataset.i)); // tocco su un capo ai lati: lo porta al centro
  }
}
palco.addEventListener('pointerup', fineGesto);
palco.addEventListener('pointercancel', fineGesto);

// Rotella e trackpad (desktop)
let accumulo = 0;
let ultimoScatto = 0;
palco.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  const ora = performance.now();
  if (ora - ultimoScatto < 420) return;
  accumulo += delta;
  if (Math.abs(accumulo) > 48) {
    vai(stato.indice + Math.sign(accumulo));
    accumulo = 0;
    ultimoScatto = ora;
    nascondiSuggerimento();
  }
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (stato.vista !== 'vetrina' || scheda.aperta || html.classList.contains('menu-aperto') || document.querySelector('dialog[open]')) return;
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (e.key === 'ArrowRight') vai(stato.indice + 1);
  else if (e.key === 'ArrowLeft') vai(stato.indice - 1);
  else if (e.key === 'Home') vai(0);
  else if (e.key === 'End') vai(stato.lista.length - 1);
  else if ((e.key === 'Enter' || e.key === ' ') && e.target === palco) apriScheda(corrente());
  else return;
  e.preventDefault();
  nascondiSuggerimento();
});

$('[data-prima]').addEventListener('click', () => vai(stato.indice - 1));
$('[data-dopo]').addEventListener('click', () => vai(stato.indice + 1));
$('[data-apri]').addEventListener('click', () => apriScheda(corrente()));

function mostraSuggerimento() {
  if (locale.leggi('is:suggerimento') || stato.lista.length < 2 || statico) return;
  suggerimento.hidden = false;
  // un piccolo accenno di movimento fa capire che si può sfogliare
  gsap.timeline({ delay: 0.9 })
    .to(stato, { pos: stato.indice + 0.16, duration: DUR.breve, ease: EASE.scena, onUpdate: disegna })
    .to(stato, { pos: stato.indice, duration: DUR.media, ease: EASE.molla, onUpdate: disegna });
  gsap.delayedCall(6, nascondiSuggerimento);
}

// ------------------------------------------------------------------
// Modalità Griglia
// ------------------------------------------------------------------
function disegnaGriglia() {
  $('[data-titolo-griglia]').textContent = FILTRI.find((f) => f.id === stato.filtro).nome;
  disegnaAttivi();
  if (!stato.lista.length) {
    griglia.innerHTML = `<li style="grid-column:1/-1"><div class="griglia-vuota">${messaggioVuoto()}</div></li>`;
    return;
  }
  griglia.innerHTML = stato.lista
    .map((p) => `<li><button class="cella" type="button" data-id="${p.id}" aria-label="${p.nome}, ${nomeCategoria(p.categoria)}${p.novita ? ', novità' : ''}. Apri la scheda">
      <div class="cella-foto">${figura(p.varianti[0], '', { sizes: '(min-width: 1200px) 24vw, (min-width: 768px) 31vw, 47vw' })}
        ${p.novita ? '<span class="segno-novita">Novità</span>' : ''}<span data-cuore-di="${p.id}"></span></div>
      <h3>${p.nome}</h3><small>${[p.marchio || nomeCategoria(p.categoria), prezzo(p)].filter(Boolean).join(' · ')}</small>
      <div class="cella-colori" aria-hidden="true">${p.varianti.map((v) => `<i style="--c:${v.hex}"></i>`).join('')}</div>
    </button></li>`)
    .join('');
  aggiornaCuori();
}

function aggiornaCuori() {
  $$('[data-cuore-di]').forEach((s) => {
    s.innerHTML = Preferiti.ha(s.dataset.cuoreDi) ? ICONE.cuore.replace('class="cuore"', 'class="cuoricino"') : '';
  });
}

griglia.addEventListener('click', (e) => {
  const c = e.target.closest('.cella');
  if (c) apriScheda(perId(c.dataset.id));
});

// ------------------------------------------------------------------
// Filtri
// ------------------------------------------------------------------
const calcola = () => ordina(raffina(filtra(stato.filtro), stato.scelte), stato.ordine);
const messaggioVuoto = () => {
  const n = quanteScelte(stato.scelte);
  const testo = n ? 'Nessun capo con questi filtri.' : stato.filtro === 'preferiti' ? 'Non hai ancora salvato nessun capo.' : 'Nessun capo in questa selezione.';
  return `<p>${testo}</p><button class="bottone" type="button" ${n ? 'data-azzera' : 'data-azzera="tutto"'}>${n ? 'Togli i filtri' : 'Mostra tutto'}</button>`;
};

// --- Pannello dei filtri: tipo, marchio, colore, taglia, prezzo, ordine ---
const pannello = document.createElement('div');
pannello.className = 'pannello';
pannello.hidden = true;
pannello.innerHTML = `<div class="pannello-velo" data-chiudi-pannello></div>
  <div class="pannello-foglio" role="dialog" aria-modal="true" aria-labelledby="pannello-titolo" tabindex="-1">
    <header class="pannello-testa"><h2 id="pannello-titolo">Filtri</h2><button class="tondo" type="button" data-chiudi-pannello aria-label="Chiudi i filtri"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg></button></header>
    <div class="pannello-corpo" data-pannello-corpo></div>
    <footer class="pannello-piede"><button class="bottone" type="button" data-azzera>Azzera</button><button class="bottone pieno" type="button" data-chiudi-pannello data-pannello-mostra></button></footer>
  </div>`;
document.body.append(pannello);
let primaDelPannello = null;

function disegnaPannello() {
  const base = filtra(stato.filtro);
  const gruppi = opzioni(base, stato.scelte).filter((g) => g.voci.length);
  const mancanti = senzaTaglia(base);
  $('[data-pannello-corpo]').innerHTML = `<fieldset class="gruppo"><legend>Ordina per</legend><div class="voci">${ORDINI.map((o) => `<button type="button" class="voce" data-ordine="${o.id}" aria-pressed="${o.id === stato.ordine}">${o.nome}</button>`).join('')}</div></fieldset>`
    + gruppi.map((g) => `<fieldset class="gruppo"><legend>${g.nome}${stato.scelte[g.id].length ? ` <b>${stato.scelte[g.id].length}</b>` : ''}</legend><div class="voci">${g.voci.map((o) => {
      const scelta = stato.scelte[g.id].includes(o.v);
      return `<button type="button" class="voce" data-gruppo="${g.id}" data-voce="${o.v}" aria-pressed="${scelta}"${!o.n && !scelta ? ' disabled' : ''}>${o.hex ? `<i style="--c:${o.hex}"></i>` : ''}${o.v}<small>${o.n}</small></button>`;
    }).join('')}</div>${g.id === 'taglie' && mancanti ? `<p class="gruppo-nota">Taglie da inserire per ${mancanti} ${mancanti === 1 ? 'capo' : 'capi'}: chiedi in boutique.</p>` : ''}</fieldset>`).join('');
  const n = stato.lista.length;
  $('[data-pannello-mostra]').textContent = n === 1 ? 'Mostra 1 capo' : `Mostra ${n} capi`;
  $('[data-azzera]', pannello).disabled = !quanteScelte(stato.scelte) && stato.ordine === 'novita';
}

function apriPannello() {
  primaDelPannello = document.activeElement;
  disegnaPannello();
  pannello.hidden = false;
  requestAnimationFrame(() => pannello.classList.add('aperto'));
  $('.pannello-foglio').focus();
}
function chiudiPannello() {
  if (pannello.hidden) return;
  pannello.classList.remove('aperto');
  setTimeout(() => { pannello.hidden = true; }, statico ? 0 : 280);
  if (primaDelPannello) primaDelPannello.focus();
  if (stato.vista === 'griglia') scrollTo(0, 0);
}

// applica subito le scelte: la lista dietro il pannello cambia mentre scegli
function cambiaScelte() {
  if (moto) moto.kill();
  applicaFiltro(stato.filtro);
  scriviURL();
  if (!pannello.hidden) disegnaPannello();
  annuncio.textContent = `${stato.lista.length} capi.`;
}
function azzera(tutto) {
  stato.scelte = scelteVuote();
  stato.ordine = 'novita';
  if (tutto) stato.filtro = 'tutti';
  cambiaScelte();
}

// Sopra la griglia: i filtri attivi, da togliere con un tocco.
function disegnaAttivi() {
  const box = $('[data-attivi]');
  const voci = GRUPPI.flatMap((g) => stato.scelte[g.id].map((v) => `<button type="button" data-gruppo="${g.id}" data-voce="${v}" aria-label="Togli il filtro ${v}">${v}<span aria-hidden="true">×</span></button>`));
  box.hidden = !voci.length;
  box.innerHTML = `<span>${stato.lista.length} ${stato.lista.length === 1 ? 'capo' : 'capi'}</span>${voci.join('')}`;
}

document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('[data-apri-pannello]')) return apriPannello();
  if (t.closest('[data-chiudi-pannello]')) return chiudiPannello();
  const z = t.closest('[data-azzera]');
  if (z) return azzera(z.dataset.azzera === 'tutto');
  const o = t.closest('[data-ordine]');
  if (o) { stato.ordine = o.dataset.ordine; return cambiaScelte(); }
  const v = t.closest('[data-voce]');
  if (v) {
    const l = stato.scelte[v.dataset.gruppo];
    const i = l.indexOf(v.dataset.voce);
    if (i >= 0) l.splice(i, 1); else l.push(v.dataset.voce);
    cambiaScelte();
    const stessa = $$('.voce[data-voce]', pannello).find((b) => b.dataset.voce === v.dataset.voce && b.dataset.gruppo === v.dataset.gruppo);
    if (stessa && !pannello.hidden) stessa.focus();
  }
  return undefined;
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pannello.hidden) { e.stopPropagation(); chiudiPannello(); } }, true);

function disegnaFiltri() {
  const n = quanteScelte(stato.scelte);
  const b = $('[data-apri-pannello]');
  b.classList.toggle('attivo', n > 0);
  b.setAttribute('aria-label', n ? `Filtri: ${n} attivi` : 'Filtri');
  $('b', b).textContent = n || '';
  $('[data-filtri]').innerHTML = FILTRI.map((f) => `<button type="button" data-filtro="${f.id}" aria-pressed="${f.id === stato.filtro}">${f.nome}</button>`).join('');
}

function applicaFiltro(f, { conserva = null } = {}) {
  stato.filtro = filtroValido(f);
  stato.lista = calcola();
  const i = conserva ? stato.lista.indexOf(conserva) : -1;
  stato.indice = Math.max(0, i);
  stato.pos = stato.indice;
  allestisci();
  disegna();
  aggiornaDidascalia(1, false);
  disegnaGriglia();
  disegnaFiltri();
  aggiornaTono();
}

function cambiaFiltro(f) {
  if (f === stato.filtro) return;
  const esegui = () => {
    stato.scelte.tipi = []; // i tipi cambiano da una categoria all'altra
    applicaFiltro(f);
    scriviURL();
    annuncio.textContent = `${FILTRI.find((x) => x.id === stato.filtro).nome}: ${stato.lista.length} capi.`;
    const attivo = $(`[data-filtri] [aria-pressed="true"]`);
    if (attivo) attivo.scrollIntoView({ inline: 'center', block: 'nearest', behavior: statico ? 'auto' : 'smooth' });
  };
  if (statico) return esegui();
  if (moto) moto.kill();
  if (stato.vista === 'vetrina') {
    // riallestimento: si spengono le luci, cambia la vetrina, si riaccendono
    gsap.timeline()
      .to(buio, { opacity: 0.9, duration: DUR.micro, ease: EASE.uscita })
      .to(capi, { scale: 0.9, autoAlpha: 0, duration: DUR.micro, ease: EASE.uscita, stagger: 0.02 }, 0)
      .add(esegui)
      .fromTo(buio, { opacity: 0.9 }, { opacity: 0, duration: DUR.media, ease: EASE.scena })
      .from('.capo.corrente .capo-foto', { yPercent: 6, scale: 0.94, duration: DUR.media, ease: EASE.entrata }, '<');
  } else {
    gsap.timeline()
      .to(griglia, { autoAlpha: 0, y: 16, duration: DUR.micro, ease: EASE.uscita })
      .add(() => {
        esegui();
        scrollTo(0, 0);
      })
      .set(griglia, { autoAlpha: 1, y: 0 })
      .from('.griglia > li', { autoAlpha: 0, y: 30, duration: DUR.breve, ease: EASE.entrata, stagger: 0.04 });
  }
  return undefined;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-filtro]');
  if (b) cambiaFiltro(b.dataset.filtro);
});

// ------------------------------------------------------------------
// Passaggio Vetrina ↔ Griglia (tecnica FLIP): il prodotto al centro vola
// al proprio posto nella griglia, e viceversa.
// ------------------------------------------------------------------
function mostraVista() {
  const inVetrina = stato.vista === 'vetrina';
  palco.hidden = !inVetrina;
  zonaGriglia.hidden = inVetrina;
  corpo.classList.toggle('in-vetrina', inVetrina);
  corpo.classList.toggle('in-griglia', !inVetrina);
  if (!inVetrina) corpo.style.setProperty('--tinta', '#f4ece0');
  $$('[data-vista]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.vista === stato.vista)));
  aggiornaTono();
  if (inVetrina) disegna();
}

function cellaVicinaAlCentro() {
  const celle = $$('.cella', griglia);
  let migliore = null;
  let minimo = Infinity;
  celle.forEach((c) => {
    const r = c.getBoundingClientRect();
    const dist = Math.abs(r.top + r.height / 2 - innerHeight / 2) + Math.abs(r.left + r.width / 2 - innerWidth / 2) * 0.5;
    if (dist < minimo) {
      minimo = dist;
      migliore = c;
    }
  });
  return migliore;
}

function cambiaVista(nuova, { ricorda = true } = {}) {
  if (nuova === stato.vista) return;
  if (ricorda) locale.scrivi('is:vista', nuova);
  const p0 = corrente();
  let partenza = null;
  let sorgente = null;

  if (!statico && stato.lista.length) {
    if (nuova === 'griglia') {
      sorgente = $('.capo.corrente img') || (capi[stato.indice] && capi[stato.indice].querySelector('img'));
    } else {
      const cella = cellaVicinaAlCentro();
      if (cella) {
        sorgente = cella.querySelector('img');
        const i = stato.lista.indexOf(perId(cella.dataset.id));
        if (i >= 0) {
          stato.indice = i;
          stato.pos = i;
        }
      }
    }
    if (sorgente) partenza = sorgente.getBoundingClientRect();
  }

  if (moto) moto.kill();
  stato.vista = nuova;
  mostraVista();
  scriviURL();
  annuncio.textContent = nuova === 'griglia' ? 'Modalità griglia.' : 'Modalità vetrina.';
  if (nuova === 'vetrina') {
    disegna();
    aggiornaDidascalia(1, false);
  }
  if (!partenza || !sorgente) return;

  let arrivoEl = null;
  if (nuova === 'griglia') {
    const cella = p0 ? $(`.cella[data-id="${p0.id}"]`) : null;
    if (cella) {
      cella.scrollIntoView({ block: 'center', behavior: 'auto' });
      arrivoEl = cella.querySelector('img');
    }
  } else {
    arrivoEl = capi[stato.indice] ? capi[stato.indice].querySelector('img') : null;
  }
  if (!arrivoEl) return;
  const arrivo = arrivoEl.getBoundingClientRect();
  const volo = document.createElement('img');
  volo.className = 'volo';
  volo.alt = '';
  volo.src = sorgente.currentSrc || sorgente.src;
  document.body.appendChild(volo);
  gsap.set(arrivoEl, { autoAlpha: 0 });
  const raggio = (r) => (nuova === 'griglia' ? [`${r.width / 2}px ${r.width / 2}px 0 0`, '0px'] : ['0px', `${arrivo.width / 2}px ${arrivo.width / 2}px 0 0`]);
  const [r0, r1] = raggio(partenza);
  gsap.fromTo(volo,
    { left: partenza.left, top: partenza.top, width: partenza.width, height: partenza.height, borderRadius: r0 },
    {
      left: arrivo.left, top: arrivo.top, width: arrivo.width, height: arrivo.height, borderRadius: r1,
      duration: DUR.media, ease: EASE.scena,
      onComplete() {
        gsap.set(arrivoEl, { autoAlpha: 1 });
        volo.remove();
      },
    });
  if (nuova === 'griglia') {
    gsap.from('.griglia > li', { autoAlpha: 0, y: 40, duration: DUR.media, ease: EASE.entrata, stagger: 0.03, clearProps: 'all' });
    gsap.from('.griglia-testa', { autoAlpha: 0, duration: DUR.media, clearProps: 'all' });
  } else {
    gsap.from('.didascalia, .palco-cornice, .palco-luce', { autoAlpha: 0, duration: DUR.media, ease: EASE.scena, clearProps: 'opacity,visibility' });
    gsap.from('.capo.di-lato', { autoAlpha: 0, duration: DUR.media, delay: DUR.micro, clearProps: 'opacity,visibility' });
  }
}

$$('[data-vista]').forEach((b) => b.addEventListener('click', () => cambiaVista(b.dataset.vista)));

// ------------------------------------------------------------------
// Avvio, cronologia, ridimensionamento
// ------------------------------------------------------------------
function daURL({ primaVolta = false } = {}) {
  const u = leggiURL();
  const p = u.prodotto ? perId(u.prodotto) : null;
  let filtro = u.filtro;
  let { scelte, ordine } = u;
  if (p && !raffina(filtra(filtro), scelte).includes(p)) { filtro = 'tutti'; scelte = scelteVuote(); }
  const cambiato = filtro !== stato.filtro || ordine !== stato.ordine || JSON.stringify(scelte) !== JSON.stringify(stato.scelte);
  stato.scelte = scelte;
  stato.ordine = ordine;
  if (primaVolta || cambiato) applicaFiltro(filtro, { conserva: p || corrente() });
  if (primaVolta || u.vista !== stato.vista) {
    stato.vista = u.vista;
    mostraVista();
  }
  if (p) {
    const i = stato.lista.indexOf(p);
    if (i >= 0 && i !== stato.indice) vai(i, { immediato: true });
    scheda.apri(p, u.colore);
  } else scheda.chiudi();
  if (primaVolta && !p && stato.vista === 'vetrina') mostraSuggerimento();
}

// Tasto indietro: la scheda si chiude, filtri e modalità tornano com'erano.
window.addEventListener('popstate', () => {
  daCronologia = true;
  daURL();
  daCronologia = false;
});

let attesa = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(attesa);
  attesa = requestAnimationFrame(() => stato.vista === 'vetrina' && disegna());
});
window.addEventListener('orientationchange', () => setTimeout(disegna, 250));
Preferiti.ascolta(() => {
  aggiornaCuori();
  if (stato.filtro === 'preferiti' && !scheda.aperta) applicaFiltro('preferiti');
});
window.addEventListener('pagehide', () => {
  if (moto) moto.kill();
  gsap.killTweensOf(stato);
});

daURL({ primaVolta: true });

// Ingresso: le luci della vetrina si alzano sul primo capo.
if (!statico && stato.vista === 'vetrina' && !scheda.aperta) {
  gsap.fromTo(buio, { opacity: 0.85 }, { opacity: 0, duration: DUR.lunga, ease: EASE.scena });
  gsap.from('.capo.corrente .capo-foto', { yPercent: 5, scale: 0.95, duration: DUR.lunga, ease: EASE.entrata, clearProps: 'transform' });
}
