// Scheda prodotto: pannello che sale dal basso (bottom sheet su mobile,
// pannello laterale su desktop). La stessa per vetrina, griglia e home.
// Versione atelier: taglia, "mettimelo da parte", zoom, completa il look,
// e la foto che si allarga dalla vetrina alla scheda.
import { nomeCategoria, variante, figura, prezzo, prodotti, look, perId, src } from './catalogo.js';
import { Preferiti } from './memoria.js';
import { condividi } from './contatto.js';
import { Taglie, taglieDi, unica, apriProva, richiama } from './atelier.js';
import { ICONE } from './icone.js';
import { avvisa } from './avviso.js';
import { riduciMovimento } from '../motion/tokens.js';

// Capi da abbinare: prima quelli dello stesso look, poi qualcosa dell'altra categoria.
function abbinamenti(p) {
  const l = look.find((x) => x.capi.includes(p.id));
  const dalLook = l ? l.capi.filter((id) => id !== p.id).map(perId).filter(Boolean) : [];
  const altri = prodotti.filter((x) => x.id !== p.id && x.categoria !== p.categoria && !dalLook.includes(x));
  return [...dalLook, ...altri].slice(0, 3);
}

export function creaScheda({ alCambio = () => {} } = {}) {
  const d = document.createElement('dialog');
  d.className = 'foglio';
  d.setAttribute('aria-labelledby', 'scheda-titolo');
  d.innerHTML = `
    <button class="tondo foglio-chiudi" type="button" data-chiudi aria-label="Chiudi la scheda">${ICONE.chiudi}</button>
    <div class="foglio-maniglia" aria-hidden="true"></div>
    <div class="foglio-corpo scheda" data-corpo></div>
    <div class="zoom" data-zoom hidden><img alt=""><button class="tondo" type="button" data-zoom-chiudi aria-label="Chiudi lo zoom">${ICONE.chiudi}</button></div>`;
  document.body.appendChild(d);
  const corpo = d.querySelector('[data-corpo]');
  const zoom = d.querySelector('[data-zoom]');
  const zoomImg = zoom.querySelector('img');
  let prodotto = null;
  let scelta = null;

  function disegna() {
    const p = prodotto;
    const v = scelta;
    const t = Taglie.di(p.id);
    const vicini = abbinamenti(p);
    corpo.innerHTML = `
      <button class="scheda-foto" type="button" data-foto aria-label="Ingrandisci la foto">${figura(v, `${p.nome}, ${v.nome}`, { sizes: '(min-width: 900px) 520px, 100vw', pronta: true })}
        ${p.demo ? '<span class="etichetta-demo">Immagine dimostrativa</span>' : ''}<span class="lente" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5M11 8v6M8 11h6"/></svg></span></button>
      <p class="occhiello">${nomeCategoria(p.categoria)}${p.sottocategoria ? ` · ${p.sottocategoria}` : ''}${p.novita ? ' · <b class="nuovo">Nuovo</b>' : ''}</p>
      <h2 id="scheda-titolo">${p.nome}</h2>
      <p class="scheda-prezzo">${prezzo(p)}${p.marchio ? ` <span>${p.marchio}</span>` : ''}</p>
      <p class="scheda-descr">${p.descrizione}</p>
      ${p.dettagli && p.dettagli.length ? `<ul class="scheda-dettagli">${p.dettagli.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
      <fieldset class="varianti">
        <legend>Colore <b data-nome-colore>${v.nome}</b></legend>
        <div class="campioni">${p.varianti
          .map((x) => `<label class="campione" style="--c:${x.hex}"><input type="radio" name="colore" value="${x.id}" ${x.id === v.id ? 'checked' : ''}><span></span><i class="sr-only">${x.nome}</i></label>`)
          .join('')}</div>
      </fieldset>
      ${unica(p) ? '' : `<fieldset class="scelta-taglie" data-taglie>
        <legend>La tua taglia</legend>
        <div class="taglie">${taglieDi(p)
          .map((x) => `<label class="taglia"><input type="radio" name="taglia" value="${x}" ${x === t ? 'checked' : ''}><span>${x}</span></label>`)
          .join('')}</div>
      </fieldset>`}
      <div class="scheda-azioni">
        <button class="bottone pieno" type="button" data-camerino>${Preferiti.ha(p.id) ? 'Nel camerino · apri' : 'Aggiungi al camerino'}</button>
        <button class="tondo" type="button" data-condividi aria-label="Condividi questo prodotto">${ICONE.condividi}</button>
      </div>
      <button class="scheda-prova" type="button" data-prova>Prenota la prova in boutique <span aria-hidden="true">→</span></button>
      ${vicini.length ? `<section class="abbina" aria-label="Completa il look">
        <p class="occhiello">Completa il look</p>
        <ul>${vicini
          .map((x) => `<li><button type="button" data-abbina="${x.id}"><img src="${src(x.varianti[0].immagine, 600)}" alt="" loading="lazy" width="300" height="375"><span>${x.nome}</span><small>${prezzo(x)}</small></button></li>`)
          .join('')}</ul>
      </section>` : ''}`;
  }

  corpo.addEventListener('change', (e) => {
    if (e.target.name === 'taglia') {
      Taglie.imposta(prodotto.id, e.target.value);
      return;
    }
    if (e.target.name !== 'colore') return;
    scelta = variante(prodotto, e.target.value);
    corpo.querySelector('[data-nome-colore]').textContent = scelta.nome;
    const foto = corpo.querySelector('[data-foto]');
    const vecchia = foto.querySelector('picture');
    vecchia.insertAdjacentHTML('afterend', figura(scelta, `${prodotto.nome}, ${scelta.nome}`, { sizes: '(min-width: 900px) 520px, 100vw', pronta: true }));
    const nuova = vecchia.nextElementSibling.querySelector('img');
    nuova.style.opacity = '0';
    const mostra = () => {
      nuova.style.opacity = '1';
      vecchia.remove();
    };
    if (nuova.complete) requestAnimationFrame(mostra);
    else nuova.addEventListener('load', mostra, { once: true });
    alCambio(true, prodotto, scelta);
  });

  // ---- Zoom: la foto a tutto schermo, si esplora muovendo il dito o il mouse
  function apriZoom() {
    const img = corpo.querySelector('[data-foto] img');
    zoomImg.src = img.currentSrc || img.src;
    zoomImg.alt = img.alt;
    zoom.hidden = false;
    zoom.style.setProperty('--ox', '50%');
    zoom.style.setProperty('--oy', '40%');
    requestAnimationFrame(() => zoom.classList.add('vivo'));
  }
  function chiudiZoom() {
    zoom.classList.remove('vivo');
    setTimeout(() => (zoom.hidden = true), 260);
  }
  const muovi = (e) => {
    const r = zoom.getBoundingClientRect();
    zoom.style.setProperty('--ox', `${((e.clientX - r.left) / r.width) * 100}%`);
    zoom.style.setProperty('--oy', `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  zoom.addEventListener('pointermove', muovi);
  zoom.addEventListener('pointerdown', (e) => {
    muovi(e);
    zoom.setPointerCapture(e.pointerId);
  });
  zoom.addEventListener('click', (e) => {
    if (e.target.closest('[data-zoom-chiudi]') || e.pointerType === 'mouse') chiudiZoom();
  });
  let tocchi = 0;
  zoom.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') return;
    const ora = Date.now();
    if (ora - tocchi < 320) chiudiZoom(); // doppio tocco per uscire
    tocchi = ora;
  });

  d.addEventListener('cancel', (e) => {
    if (!zoom.hidden) {
      e.preventDefault();
      chiudiZoom();
    }
  });

  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-chiudi]')) return d.close();
    if (e.target.closest('[data-foto]')) return apriZoom();
    const cam = e.target.closest('[data-camerino]');
    if (cam) {
      if (Preferiti.ha(prodotto.id)) {
        d.close();
        document.querySelector('[data-apri-preferiti]').click();
        return undefined;
      }
      if (!unica(prodotto) && !Taglie.di(prodotto.id)) return richiama(corpo.querySelector('[data-taglie]'), 'Scegli la tua taglia.');
      Preferiti.alterna(prodotto.id);
      cam.textContent = 'Nel camerino · apri';
      avvisa('Aggiunto al camerino.', 1800);
      return undefined;
    }
    if (e.target.closest('[data-prova]')) return apriProva([prodotto.id]);
    if (e.target.closest('[data-condividi]')) return condividi(prodotto, scelta);
    const abbina = e.target.closest('[data-abbina]');
    if (abbina) {
      const p = perId(abbina.dataset.abbina);
      if (p) api.apri(p, null, { da: abbina.querySelector('img') });
      return undefined;
    }
    return undefined;
  });

  d.addEventListener('close', () => {
    d.style.transform = '';
    zoom.hidden = true;
    zoom.classList.remove('vivo');
    alCambio(false, prodotto, scelta);
  });

  // Trascina la maniglia verso il basso per chiudere (mobile).
  const maniglia = d.querySelector('.foglio-maniglia');
  let y0 = null;
  maniglia.addEventListener('pointerdown', (e) => {
    y0 = e.clientY;
    maniglia.setPointerCapture(e.pointerId);
    d.style.transition = 'none';
  });
  maniglia.addEventListener('pointermove', (e) => {
    if (y0 == null) return;
    d.style.transform = `translateY(${Math.max(0, e.clientY - y0)}px)`;
  });
  const rilascia = (e) => {
    if (y0 == null) return;
    const dy = e.clientY - y0;
    y0 = null;
    d.style.transition = '';
    if (dy > 110) d.close();
    else d.style.transform = '';
  };
  maniglia.addEventListener('pointerup', rilascia);
  maniglia.addEventListener('pointercancel', rilascia);

  function mostra(p, idVariante) {
    prodotto = p;
    scelta = variante(p, idVariante);
    disegna();
    if (!d.open) d.showModal();
    corpo.scrollTop = 0;
    alCambio(true, prodotto, scelta);
  }

  const api = {
    get aperta() {
      return d.open;
    },
    get prodotto() {
      return prodotto;
    },
    // { da: <img> } fa crescere quella foto fino a diventare la foto della scheda
    apri(p, idVariante, { da = null } = {}) {
      const puo = da && document.startViewTransition && !riduciMovimento() && da.getBoundingClientRect().width > 0;
      if (!puo) return mostra(p, idVariante);
      const html = document.documentElement;
      html.classList.add('allarga');
      if (d.open) d.classList.add('diretto');
      da.style.viewTransitionName = 'foto-capo';
      const t = document.startViewTransition(() => {
        da.style.viewTransitionName = '';
        d.classList.add('diretto');
        mostra(p, idVariante);
        const img = corpo.querySelector('[data-foto] img');
        if (img) img.style.viewTransitionName = 'foto-capo';
      });
      t.finished.finally(() => {
        html.classList.remove('allarga');
        d.classList.remove('diretto');
        const img = corpo.querySelector('[data-foto] img');
        if (img) img.style.viewTransitionName = '';
      });
      return undefined;
    },
    chiudi() {
      if (d.open) d.close();
    },
  };
  return api;
}
