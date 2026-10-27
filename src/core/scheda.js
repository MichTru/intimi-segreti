// Scheda prodotto: pannello che sale dal basso (bottom sheet su mobile,
// pannello laterale su desktop). La stessa per vetrina, griglia e home.
import { nomeCategoria, variante, figura, prezzo } from './catalogo.js';
import { Preferiti } from './memoria.js';
import { inviaRichiesta, messaggioProdotto, messaggioAppuntamento, etichettaRichiesta, notaRichiesta, condividi } from './contatto.js';
import { ICONE } from './icone.js';
import { avvisa } from './avviso.js';

export function creaScheda({ alCambio = () => {} } = {}) {
  const d = document.createElement('dialog');
  d.className = 'foglio';
  d.setAttribute('aria-labelledby', 'scheda-titolo');
  d.innerHTML = `
    <button class="tondo foglio-chiudi" type="button" data-chiudi aria-label="Chiudi la scheda">${ICONE.chiudi}</button>
    <div class="foglio-maniglia" aria-hidden="true"></div>
    <div class="foglio-corpo scheda" data-corpo></div>`;
  document.body.appendChild(d);
  const corpo = d.querySelector('[data-corpo]');
  let prodotto = null;
  let scelta = null;

  function disegna() {
    const p = prodotto;
    const v = scelta;
    corpo.innerHTML = `
      <div class="scheda-foto" data-foto>${figura(v, `${p.nome}, ${v.nome}`, { sizes: '(min-width: 900px) 520px, 100vw', pronta: true })}
        ${p.demo ? '<span class="etichetta-demo">Immagine dimostrativa</span>' : ''}</div>
      <p class="occhiello">${nomeCategoria(p.categoria)}${p.sottocategoria ? ` · ${p.sottocategoria}` : ''}${p.novita ? ' · Novità' : ''}</p>
      <h2 id="scheda-titolo">${p.nome}</h2>
      <p class="scheda-prezzo">${prezzo(p)}${p.marchio ? ` <span>${p.marchio}</span>` : ''}</p>
      <p class="scheda-descr">${p.descrizione}</p>
      ${p.dettagli && p.dettagli.length ? `<ul class="scheda-dettagli">${p.dettagli.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
      <fieldset class="varianti">
        <legend>Colore <b data-nome-colore>${v.nome}</b></legend>
        <div class="campioni">${p.varianti
          .map((x) => `<label class="campione" style="--c:${x.hex}"><input type="radio" name="colore" value="${x.id}" ${x.id === v.id ? 'checked' : ''}><span></span><i class="sr-only">${x.nome}</i></label>`)
          .join('')}</div>
      </fieldset>
      <div class="scheda-azioni">
        <button class="bottone pieno" type="button" data-chiedi>${etichettaRichiesta()}</button>
        <button class="tondo" type="button" data-cuore aria-pressed="${Preferiti.ha(p.id)}" aria-label="Aggiungi ai preferiti">${ICONE.cuore}</button>
        <button class="tondo" type="button" data-condividi aria-label="Condividi questo prodotto">${ICONE.condividi}</button>
      </div>
      <p class="scheda-nota"><button type="button" data-prova style="text-decoration:underline;text-underline-offset:3px">Prenota una prova in boutique</button></p>`;
  }

  corpo.addEventListener('change', (e) => {
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

  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-chiudi]')) return d.close();
    if (e.target.closest('[data-chiedi]')) return inviaRichiesta(messaggioProdotto(prodotto, scelta));
    if (e.target.closest('[data-prova]')) return inviaRichiesta(messaggioAppuntamento());
    if (e.target.closest('[data-condividi]')) return condividi(prodotto, scelta);
    const cuore = e.target.closest('[data-cuore]');
    if (cuore) {
      const ora = Preferiti.alterna(prodotto.id);
      cuore.setAttribute('aria-pressed', String(ora));
      avvisa(ora ? 'Aggiunto ai preferiti.' : 'Tolto dai preferiti.', 1800);
    }
    return undefined;
  });

  d.addEventListener('close', () => {
    d.style.transform = '';
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

  return {
    get aperta() {
      return d.open;
    },
    get prodotto() {
      return prodotto;
    },
    apri(p, idVariante) {
        prodotto = p;
      scelta = variante(p, idVariante);
      disegna();
      if (!d.open) d.showModal();
      corpo.scrollTop = 0;
      alCambio(true, prodotto, scelta);
    },
    chiudi() {
      if (d.open) d.close();
    },
  };
}
