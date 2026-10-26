// "Chiedi in boutique": WhatsApp con messaggio precompilato quando il numero è
// impostato in src/data/site.json; finché manca, la richiesta viene copiata
// negli appunti (nessun pulsante finto, nessun numero inventato).
import sito from '../data/site.json';
import { perId, variante } from './catalogo.js';
import { avvisa } from './avviso.js';

export const haWhatsApp = () => !!sito.whatsapp;
export const etichettaRichiesta = () => (haWhatsApp() ? 'Chiedi in boutique' : 'Copia la richiesta');
export const notaRichiesta = () =>
  haWhatsApp()
    ? 'Si apre WhatsApp con il messaggio già scritto.'
    : 'Il numero WhatsApp della boutique non è ancora stato inserito: il messaggio viene copiato, puoi incollarlo dove preferisci.';

const origine = () => sito.url || location.origin;
export const linkProdotto = (p, v) => `${origine()}/vetrina/?prodotto=${p.id}${v ? `&colore=${v.id}` : ''}`;
// Le pagine /p/<id>/ (anteprima Open Graph) esistono solo dopo "npm run build".
export const linkCondivisione = (p) => (import.meta.env && import.meta.env.DEV ? linkProdotto(p) : `${origine()}/p/${p.id}/`);

export function messaggioProdotto(p, v) {
  return `Buongiorno, vorrei informazioni su «${p.nome}»${p.varianti.length > 1 ? ` nel colore ${v.nome}` : ''}, visto nella Vetrina Digitale.\n${linkProdotto(p, v)}`;
}

export function messaggioLista(ids) {
  const righe = ids.map(perId).filter(Boolean).map((p) => `• ${p.nome}`);
  return `Buongiorno, vorrei informazioni su questi capi visti nella Vetrina Digitale:\n${righe.join('\n')}`;
}

export const messaggioAppuntamento = () =>
  'Buongiorno, vorrei fissare un appuntamento in boutique per una consulenza o una prova. Quando sarebbe possibile?';

export async function copia(testo) {
  try {
    await navigator.clipboard.writeText(testo);
    return true;
  } catch {
    const t = document.createElement('textarea');
    t.value = testo;
    t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t);
    t.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    t.remove();
    return ok;
  }
}

export async function inviaRichiesta(testo) {
  if (haWhatsApp()) {
    const numero = String(sito.whatsapp).replace(/\D/g, '');
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(testo)}`, '_blank', 'noopener');
    return;
  }
  const ok = await copia(testo);
  avvisa(ok ? 'Richiesta copiata. Incollala nel messaggio alla boutique.' : 'Non è stato possibile copiare il testo.');
}

export async function condividi(p, v) {
  const dati = { title: `${p.nome} — ${sito.nome}`, text: `${p.nome}, ${v.nome}`, url: linkCondivisione(p) };
  if (navigator.share) {
    try {
      await navigator.share(dati);
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  const ok = await copia(dati.url);
  avvisa(ok ? 'Link copiato.' : 'Non è stato possibile copiare il link.');
}
