// Cornice comune a tutte le pagine: testata, menu fullscreen, piede,
// preferiti, cursore, effetti magnetici e passaggio animato tra pagine.
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/fraunces/full-italic.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import '../styles/base.css';
import '../styles/atelier.css';

import { gsap } from 'gsap';
import sito from '../data/site.json';
import { EASE, DUR, riduciMovimento } from '../motion/tokens.js';
import { Preferiti, sessione } from './memoria.js';
import { perId, src, prezzo } from './catalogo.js';
import { Taglie, taglieDi, unica, testoTotale, messaggioInsieme, apriProva, richiama } from './atelier.js';
import { inviaRichiesta } from './contatto.js';
import { ICONE } from './icone.js';

const VOCI = [
  { href: '/', testo: 'La vetrina', nota: 'Home' },
  { href: '/vetrina/', testo: 'Vetrina Digitale', nota: 'Catalogo' },
  { href: '/#look', testo: 'Lookbook', nota: 'I look' },
  { href: '/#buono', testo: 'Buono regalo', nota: 'Da regalare' },
  { href: '/#boutique', testo: 'La Boutique', nota: 'Lugo' },
  { href: '/#contatti', testo: 'Contatti', nota: 'Vieni a trovarci' },
];

const social = () =>
  Object.entries(sito.social || {})
    .filter(([, url]) => !!url)
    .map(([nome, url]) => `<a href="${url}" target="_blank" rel="noopener">${nome[0].toUpperCase()}${nome.slice(1)}</a>`)
    .join('');

import { montaIndietro } from './indietro.js';

function montaTestata() {
  const t = document.createElement('header');
  t.className = 'testata';
  t.innerHTML = `
    <a class="marchio" href="/" aria-label="${sito.nome}, torna alla home"><span class="logo" aria-hidden="true"></span></a>
    <div class="testata-azioni">
      <button class="tondo conta-preferiti" type="button" data-apri-preferiti aria-label="Il tuo camerino">${ICONE.cuore}<b aria-hidden="true"></b></button>
      <button class="apri-menu" type="button" aria-expanded="false" aria-controls="menu">Menu <i aria-hidden="true"></i></button>
    </div>`;
  document.body.prepend(t);
  return t;
}

function montaMenu(apriBtn) {
  const m = document.createElement('nav');
  m.className = 'menu';
  m.id = 'menu';
  m.setAttribute('aria-label', 'Menu principale');
  m.innerHTML = `
    <div class="menu-testa"><span class="marchio"><span class="logo" role="img" aria-label="${sito.nome}"></span></span>
      <button class="tondo" type="button" data-chiudi-menu aria-label="Chiudi il menu">${ICONE.chiudi}</button></div>
    <ul class="menu-voci">${VOCI.map((v) => `<li><a href="${v.href}">${v.testo} <small>${v.nota}</small></a></li>`).join('')}</ul>
    <div class="menu-piede"><span>${sito.luogo}</span>${social()}<a href="/privacy/">Privacy e cookie</a></div>`;
  document.body.appendChild(m);

  const voci = m.querySelectorAll('.menu-voci a');
  let tl = null;
  let aperto = false;

  function imposta(stato) {
    if (stato === aperto) return;
    aperto = stato;
    apriBtn.setAttribute('aria-expanded', String(stato));
    document.documentElement.classList.toggle('menu-aperto', stato);
    window.dispatchEvent(new CustomEvent('is:blocco-scroll', { detail: stato }));
    if (tl) tl.kill();
    const d = riduciMovimento() ? 0.01 : DUR.media;
    if (stato) {
      m.classList.add('aperto');
      m.inert = false;
      tl = gsap.timeline();
      tl.fromTo(m, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: d, ease: EASE.scena })
        .fromTo(voci, { yPercent: 110, rotate: 4, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: d, ease: EASE.entrata, stagger: 0.06 }, d * 0.35)
        .fromTo(m.querySelector('.menu-piede'), { opacity: 0 }, { opacity: 1, duration: DUR.breve }, d * 0.8);
      m.querySelector('[data-chiudi-menu]').focus({ preventScroll: true });
    } else {
      tl = gsap.timeline({ onComplete: () => m.classList.remove('aperto') });
      tl.to(m, { clipPath: 'inset(100% 0% 0% 0%)', duration: d * 0.8, ease: EASE.scena });
      m.inert = true;
      apriBtn.focus({ preventScroll: true });
    }
  }

  m.inert = true;
  apriBtn.addEventListener('click', () => imposta(true));
  m.querySelector('[data-chiudi-menu]').addEventListener('click', () => imposta(false));
  m.addEventListener('click', (e) => {
    if (e.target.closest('a')) imposta(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aperto) imposta(false);
  });
}

function montaPiede() {
  if (document.querySelector('.piede') || document.body.dataset.senzaPiede != null) return;
  const p = document.createElement('footer');
  p.className = 'piede';
  const anno = new Date().getFullYear();
  p.innerHTML = `
    <span class="marchio"><img class="logo-oro" src="/assets/site/logo-oro.webp" alt="${sito.nome}" width="943" height="512" loading="lazy"></span>
    <div class="piede-righe">
      <span>${sito.luogo}</span>
      ${sito.indirizzo ? `<span>${sito.indirizzo}</span>` : ''}
      ${sito.telefono ? `<a href="tel:${String(sito.telefono).replace(/\s/g, '')}">${sito.telefono}</a>` : ''}
      ${social()}
      <a href="/vetrina/">Vetrina Digitale</a>
      <a href="/privacy/">Privacy e cookie</a>
    </div>
    <div class="piede-righe"><span>© ${anno} ${sito.nome}${sito.partitaIva ? ` · P. IVA ${sito.partitaIva}` : ''}</span>
      <span>Alcune immagini sono generate con IA.</span></div>`;
  document.body.appendChild(p);
}

// ---------- Il camerino (i preferiti, con taglia e totale) ----------
function montaPreferiti() {
  const d = document.createElement('dialog');
  d.className = 'foglio camerino';
  d.setAttribute('aria-labelledby', 'titolo-preferiti');
  d.innerHTML = `
    <button class="tondo foglio-chiudi" type="button" data-chiudi aria-label="Chiudi">${ICONE.chiudi}</button>
    <div class="foglio-maniglia" aria-hidden="true"></div>
    <div class="foglio-corpo scheda">
      <p class="occhiello">Intimi Segreti</p>
      <h2 id="titolo-preferiti">Il tuo <em>camerino.</em></h2>
      <div data-contenuto></div>
    </div>`;
  document.body.appendChild(d);
  const corpo = d.querySelector('[data-contenuto]');

  function disegna() {
    const ids = Preferiti.tutti().filter(perId);
    document.querySelectorAll('.conta-preferiti b').forEach((b) => (b.textContent = ids.length ? String(ids.length) : ''));
    if (!d.open) return;
    if (!ids.length) {
      corpo.innerHTML = `<p class="scheda-descr">Il camerino è vuoto.</p>
        <div class="scheda-azioni"><a class="bottone pieno" href="/vetrina/">Vai alla Vetrina Digitale</a></div>`;
      return;
    }
    const capi = ids.map(perId);
    corpo.innerHTML = `<ul class="lista-camerino">${capi
      .map((p) => {
        const t = Taglie.di(p.id);
        return `<li><a href="/vetrina/?prodotto=${p.id}"><img src="${src(p.varianti[0].immagine, 600)}" alt="" loading="lazy" width="72" height="90"></a>
          <div><a href="/vetrina/?prodotto=${p.id}">${p.nome}</a><small>${prezzo(p)}</small>
            ${unica(p) ? '<small>Taglia unica</small>' : `<label class="mini-taglia"><span class="sr-only">Taglia per ${p.nome}</span><select data-taglia="${p.id}">
              <option value="">Taglia</option>${taglieDi(p).map((x) => `<option ${x === t ? 'selected' : ''}>${x}</option>`).join('')}</select></label>`}</div>
          <button class="tondo" type="button" data-togli="${p.id}" aria-label="Togli ${p.nome} dal camerino">${ICONE.chiudi}</button></li>`;
      })
      .join('')}</ul>
      <p class="camerino-totale"><small>Totale</small><span>${testoTotale(capi)}</span></p>
      <div class="scheda-azioni"><button class="bottone pieno" type="button" data-invia>Mettimeli da parte</button></div>
      <button class="scheda-prova" type="button" data-prova>Prenota la prova in boutique <span aria-hidden="true">→</span></button>`;
  }

  d.addEventListener('change', (e) => {
    const s = e.target.closest('[data-taglia]');
    if (s) Taglie.imposta(s.dataset.taglia, s.value || null);
  });
  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-chiudi]')) d.close();
    const togli = e.target.closest('[data-togli]');
    if (togli) Preferiti.alterna(togli.dataset.togli);
    if (e.target.closest('[data-invia]')) {
      const ids = Preferiti.tutti().filter(perId);
      const manca = ids.map(perId).find((p) => !unica(p) && !Taglie.di(p.id));
      if (manca) return richiama(d.querySelector(`[data-taglia="${manca.id}"]`), `Scegli la taglia per ${manca.nome}.`);
      inviaRichiesta(messaggioInsieme(ids));
    }
    if (e.target.closest('[data-prova]')) {
      d.close();
      apriProva(Preferiti.tutti().filter(perId));
    }
    return undefined;
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-apri-preferiti]')) return;
    d.showModal();
    disegna();
  });
  Preferiti.ascolta(disegna);
  disegna();
}

// ---------- Cursore e magnetismo (solo puntatore fine) ----------
function montaCursore() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || riduciMovimento()) return;
  const c = document.createElement('div');
  c.className = 'cursore';
  c.setAttribute('aria-hidden', 'true');
  c.innerHTML = '<span></span>';
  document.body.appendChild(c);
  document.documentElement.classList.add('ha-cursore');
  const etichetta = c.firstElementChild;
  const x = gsap.quickTo(c, 'x', { duration: 0.35, ease: 'power3.out' });
  const y = gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power3.out' });
  const TESTI = { trascina: 'Trascina', apri: 'Apri' };

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x(e.clientX);
    y(e.clientY);
    const zona = e.target.closest ? e.target.closest('[data-cursore]') : null;
    const tipo = zona ? zona.dataset.cursore : '';
    const interattivo = !tipo && e.target.closest && e.target.closest('a, button, input, label');
    c.classList.toggle('trascina', tipo === 'trascina');
    c.classList.toggle('apri', tipo === 'apri');
    c.classList.toggle('attivo', !!interattivo);
    etichetta.textContent = TESTI[tipo] || '';
  }, { passive: true });

  document.querySelectorAll('[data-magnetico]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
    const my = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3);
      my((e.clientY - r.top - r.height / 2) * 0.3);
    });
    el.addEventListener('pointerleave', () => {
      mx(0);
      my(0);
    });
  });
}

// ---------- Passaggio tra pagine ----------
// I browser recenti usano la View Transitions API (regole in base.css).
// Dove manca, due ante borgogna si chiudono e si riaprono con GSAP.
function montaPassaggio() {
  const nativo = 'CSSViewTransitionRule' in window;
  if (nativo || riduciMovimento()) return;
  const s = document.createElement('div');
  s.className = 'sipario';
  s.setAttribute('aria-hidden', 'true');
  s.innerHTML = '<i></i><i></i>';
  document.body.appendChild(s);
  const ante = s.querySelectorAll('i');

  if (sessione.leggi('is:porta')) {
    sessione.scrivi('is:porta', false);
    gsap.set(s, { visibility: 'visible' });
    gsap.fromTo(ante, { scaleX: 1 }, { scaleX: 0, duration: DUR.media, ease: EASE.scena, onComplete: () => gsap.set(s, { visibility: 'hidden' }) });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    e.preventDefault();
    sessione.scrivi('is:porta', true);
    gsap.set(s, { visibility: 'visible' });
    gsap.fromTo(ante, { scaleX: 0 }, { scaleX: 1, duration: DUR.breve, ease: EASE.scena, onComplete: () => (location.href = url.href) });
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) gsap.set(ante, { scaleX: 0 });
  });
}

// Testata su telefono: appena si scorre prende un fondo pieno (niente più testo
// che ci passa sotto), scendendo si nasconde per lasciare spazio, risalendo torna.
function montaScorrimentoTestata(t) {
  let ultimo = scrollY;
  let attesa = 0;
  const aggiorna = () => {
    attesa = 0;
    const y = Math.max(0, scrollY);
    const bloccata = document.documentElement.classList.contains('menu-aperto') || document.body.classList.contains('in-vetrina');
    t.classList.toggle('velata', y > 24 && !bloccata);
    if (!bloccata && Math.abs(y - ultimo) > 6) {
      t.classList.toggle('nascosta', y > ultimo && y > 220 && !t.contains(document.activeElement));
      ultimo = y;
    }
    if (bloccata) t.classList.remove('nascosta');
  };
  addEventListener('scroll', () => { if (!attesa) attesa = requestAnimationFrame(aggiorna); }, { passive: true });
  addEventListener('is:blocco-scroll', aggiorna);
  aggiorna();
}

export function montaCornice() {
  const testata = montaTestata();
  montaScorrimentoTestata(testata);
  montaIndietro();
  montaMenu(testata.querySelector('.apri-menu'));
  montaPiede();
  montaPreferiti();
  montaCursore();
  montaPassaggio();
  return { testata };
}
