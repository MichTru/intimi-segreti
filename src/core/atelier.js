// Atelier: taglie scelte, messaggi per WhatsApp e prenotazione della prova.
// Usato da scheda, camerino, lookbook e buono regalo.
import { perId, prezzo, variante, src } from './catalogo.js';
import { locale } from './memoria.js';
import { inviaRichiesta, linkProdotto } from './contatto.js';
import { ICONE } from './icone.js';
import { avvisa } from './avviso.js';

// La taglia è quella della cliente: la disponibilità la conferma la boutique.
export const TAGLIE = ['XS', 'S', 'M', 'L', 'XL'];
export const unica = (p) => Array.isArray(p.taglie) && p.taglie.length === 1 && p.taglie[0] === 'Unica';
export const taglieDi = (p) => (p.taglie && p.taglie.length ? p.taglie : TAGLIE);

const K = 'is:taglie';
let taglie = locale.leggi(K, {});
export const Taglie = {
  di: (id) => taglie[id] || null,
  imposta(id, t) {
    taglie = { ...taglie, [id]: t };
    locale.scrivi(K, taglie);
  },
};

export const euro = (n) => prezzo({ prezzo: Math.round(n * 100) / 100 });
export function totale(capi) {
  const noti = capi.filter((p) => p.prezzo != null);
  return { somma: noti.reduce((s, p) => s + p.prezzo, 0), mancano: capi.length - noti.length };
}
export const testoTotale = (capi) => {
  const { somma, mancano } = totale(capi);
  if (!somma) return 'Prezzi in boutique';
  return mancano ? `Da ${euro(somma)}` : euro(somma);
};

const riga = (p, idVariante) => {
  const v = variante(p, idVariante);
  const t = unica(p) ? null : Taglie.di(p.id);
  return `• ${p.nome}${p.varianti.length > 1 ? `, ${v.nome}` : ''}${t ? `, taglia ${t}` : ''} (${prezzo(p)})`;
};

export const messaggioDaParte = (p, v) =>
  `Buongiorno, potete mettermi da parte questo capo visto sul sito?\n${riga(p, v && v.id)}\n${linkProdotto(p, v)}`;

export const messaggioInsieme = (ids, titolo = 'questi capi visti sul sito') =>
  `Buongiorno, potete mettermi da parte ${titolo}?\n${ids.map(perId).filter(Boolean).map((p) => riga(p)).join('\n')}`;

export const messaggioNovita = () => 'Buongiorno, vorrei ricevere su WhatsApp le novità della boutique.';

export const messaggioBuono = (importo, per, da) =>
  `Buongiorno, vorrei un buono regalo da ${euro(importo)}${per ? ` per ${per}` : ''}${da ? `, da parte di ${da}` : ''}. Come posso ritirarlo?`;

// ------------------------------------------------------------------
// Prenota la prova: giorno e fascia, con i capi già scelti.
// ------------------------------------------------------------------
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
function prossimiGiorni(n = 8) {
  const out = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) out.push(new Date(d));
  }
  return out;
}

let foglioProva = null;
export function apriProva(ids = []) {
  if (!foglioProva) foglioProva = creaProva();
  foglioProva.apri(ids);
}

function creaProva() {
  const d = document.createElement('dialog');
  d.className = 'foglio prova';
  d.setAttribute('aria-labelledby', 'prova-titolo');
  d.innerHTML = `
    <button class="tondo foglio-chiudi" type="button" data-chiudi aria-label="Chiudi">${ICONE.chiudi}</button>
    <div class="foglio-maniglia" aria-hidden="true"></div>
    <div class="foglio-corpo scheda" data-corpo></div>`;
  document.body.appendChild(d);
  const corpo = d.querySelector('[data-corpo]');
  let capi = [];
  let giorno = null;
  let momento = 'pomeriggio';

  function disegna() {
    const giorni = prossimiGiorni();
    corpo.innerHTML = `
      <p class="occhiello">In boutique</p>
      <h2 id="prova-titolo">Prenota <em>la prova.</em></h2>
      <fieldset class="scelta-giorni"><legend>Il giorno</legend>
        <div class="giorni">${giorni
          .map((g, i) => {
            const id = g.toISOString().slice(0, 10);
            return `<label class="giorno"><input type="radio" name="giorno" value="${id}" ${(giorno ? giorno === id : i === 0) ? 'checked' : ''}>
              <span><small>${GIORNI[g.getDay()].slice(0, 3)}</small><b>${g.getDate()}</b><small>${MESI[g.getMonth()].slice(0, 3)}</small></span></label>`;
          })
          .join('')}</div>
      </fieldset>
      <fieldset class="scelta-taglie"><legend>Quando</legend>
        <div class="taglie">${['mattina', 'pomeriggio']
          .map((m) => `<label class="taglia larga"><input type="radio" name="momento" value="${m}" ${m === momento ? 'checked' : ''}><span>${m[0].toUpperCase()}${m.slice(1)}</span></label>`)
          .join('')}</div>
      </fieldset>
      ${capi.length ? `<div class="prova-capi"><p class="occhiello">Da provare</p><ul>${capi
        .map(perId)
        .filter(Boolean)
        .map((p) => `<li><img src="${src(p.varianti[0].immagine, 600)}" alt="" width="56" height="70"><span>${p.nome}${!unica(p) && Taglie.di(p.id) ? ` · ${Taglie.di(p.id)}` : ''}</span></li>`)
        .join('')}</ul></div>` : ''}
      <div class="scheda-azioni"><button class="bottone pieno" type="button" data-invia>Invia la richiesta</button></div>`;
    if (!giorno) giorno = giorni[0].toISOString().slice(0, 10);
  }

  corpo.addEventListener('change', (e) => {
    if (e.target.name === 'giorno') giorno = e.target.value;
    if (e.target.name === 'momento') momento = e.target.value;
  });
  d.addEventListener('click', (e) => {
    if (e.target === d || e.target.closest('[data-chiudi]')) return d.close();
    if (!e.target.closest('[data-invia]')) return undefined;
    const g = new Date(`${giorno}T12:00:00`);
    const quando = `${GIORNI[g.getDay()]} ${g.getDate()} ${MESI[g.getMonth()]}, ${momento === 'mattina' ? 'in mattinata' : 'nel pomeriggio'}`;
    const lista = capi.map(perId).filter(Boolean);
    inviaRichiesta(`Buongiorno, vorrei prenotare una prova in boutique per ${quando}.${lista.length ? `\nVorrei provare:\n${lista.map((p) => riga(p)).join('\n')}` : ''}\nVa bene?`);
    d.close();
    return undefined;
  });
  return {
    apri(ids) {
      capi = ids;
      disegna();
      if (!d.open) d.showModal();
    },
  };
}

// Piccolo segnale quando manca una scelta obbligatoria.
export function richiama(el, testo) {
  avvisa(testo, 2200);
  if (!el) return;
  el.classList.remove('richiamo');
  void el.offsetWidth;
  el.classList.add('richiamo');
}

export { inviaRichiesta };
