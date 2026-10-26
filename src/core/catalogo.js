// Unica porta d'accesso ai dati: home, vetrina, griglia e schede leggono da qui.
import dati from '../data/products.json';
import { Preferiti } from './memoria.js';

const QUANTE_NOVITA = 4;

const ordinati = [...dati.prodotti].sort((a, b) => String(b.aggiunto || '').localeCompare(String(a.aggiunto || '')));
ordinati.forEach((p, i) => {
  p.novita = i < QUANTE_NOVITA && !!p.aggiunto; // le più recenti: mostrate per prime
});

export const prodotti = ordinati;
export const categorie = dati.categorie;
export const copertine = dati.copertine || [];
export const look = dati.look || [];
export const perId = (id) => prodotti.find((p) => p.id === id) || null;
export const categoria = (id) => categorie.find((c) => c.id === id) || null;
export const nomeCategoria = (id) => categoria(id)?.nome || '';

// Prezzo all'italiana: 79,90 € · 225 €
export const prezzo = (p) => (p.prezzo == null ? 'Prezzo in boutique' : `${Number(p.prezzo).toLocaleString('it-IT', { minimumFractionDigits: Number.isInteger(p.prezzo) ? 0 : 2, maximumFractionDigits: 2 })} €`);

export const FILTRI = [
  { id: 'tutti', nome: 'Tutto' },
  ...categorie.filter((c) => prodotti.some((p) => p.categoria === c.id)).map((c) => ({ id: c.id, nome: c.nome })),
  { id: 'regalo', nome: 'Idee regalo' },
  { id: 'preferiti', nome: 'Preferiti' },
];

export function filtra(filtro) {
  if (filtro === 'regalo') return prodotti.filter((p) => p.regalo);
  if (filtro === 'preferiti') return prodotti.filter((p) => Preferiti.ha(p.id));
  if (categoria(filtro)) return prodotti.filter((p) => p.categoria === filtro);
  return prodotti;
}

export const variante = (p, idVariante) => p.varianti.find((v) => v.id === idVariante) || p.varianti[0];

const BASE = '/assets/products/';
// Con window.IS_FOTO_UNICA = true il sito usa un solo file .webp per foto
// (versione leggera da caricare a mano dove c'è un limite al numero di file).
const UNICA = typeof window !== 'undefined' && !!window.IS_FOTO_UNICA;
export const src = (nome, misura = 1200, est = 'webp') => (UNICA ? `${BASE}${nome}.webp` : `${BASE}${nome}${misura === 1200 ? '' : `-${misura}`}.${est}`);

// <picture> con AVIF/WebP e srcset. Per sostituire una foto basta
// sovrascrivere i file con lo stesso nome (vedi README).
export function figura(v, alt, { sizes = '100vw', pronta = false, classe = '' } = {}) {
  if (UNICA) return `<picture><img class="${classe}" src="${src(v.immagine)}" alt="${alt.replace(/"/g, '&quot;')}" width="1200" height="1500" ${pronta ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" draggable="false"></picture>`;
  const set = (est) => `${src(v.immagine, 600, est)} 600w, ${src(v.immagine, 1200, est)} 1200w`;
  return `<picture>
    <source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
    <source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">
    <img class="${classe}" src="${src(v.immagine, 600)}" alt="${alt.replace(/"/g, '&quot;')}" width="1200" height="1500"
      ${pronta ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" draggable="false">
  </picture>`;
}

// ------------------------------------------------------------------
// Filtri fini: tipo, marchio, colore, taglia, prezzo, in evidenza.
// Le opzioni nascono dai dati: aggiungi un prodotto e compaiono da sole.
// ------------------------------------------------------------------
const fascia = (p) => (p.prezzo == null ? 'Prezzo in boutique' : p.prezzo <= 70 ? 'Fino a 70 €' : p.prezzo <= 150 ? 'Da 70 a 150 €' : 'Oltre 150 €');
const ORDINE_FASCE = ['Fino a 70 €', 'Da 70 a 150 €', 'Oltre 150 €', 'Prezzo in boutique'];
const ORDINE_TAGLIE = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Unica'];
export const GRUPPI = [
  { id: 'tipi', nome: 'Tipo', val: (p) => [p.sottocategoria].filter(Boolean) },
  { id: 'marchi', nome: 'Marchio', val: (p) => [p.marchio].filter(Boolean) },
  { id: 'colori', nome: 'Colore', val: (p) => p.varianti.map((v) => v.nome) },
  { id: 'taglie', nome: 'Taglia', val: (p) => p.taglie || [], ordine: ORDINE_TAGLIE },
  { id: 'prezzi', nome: 'Prezzo', val: (p) => [fascia(p)], ordine: ORDINE_FASCE },
  { id: 'extra', nome: 'In evidenza', val: (p) => [p.novita && 'Novità', p.regalo && 'Idea regalo'].filter(Boolean) },
];
export const ORDINI = [
  { id: 'novita', nome: 'Ultimi arrivi' },
  { id: 'prezzo-su', nome: 'Prezzo crescente' },
  { id: 'prezzo-giu', nome: 'Prezzo decrescente' },
  { id: 'nome', nome: 'Nome A–Z' },
];
export const scelteVuote = () => Object.fromEntries(GRUPPI.map((g) => [g.id, []]));
export const quanteScelte = (s) => GRUPPI.reduce((n, g) => n + s[g.id].length, 0);
const passa = (p, s, salta) => GRUPPI.every((g) => g.id === salta || !s[g.id].length || g.val(p).some((v) => s[g.id].includes(v)));
// dentro un gruppo basta una voce (rosso O nero); tra gruppi servono tutte (colore E taglia)
export const raffina = (lista, s) => lista.filter((p) => passa(p, s));
export function ordina(lista, come) {
  const l = [...lista];
  const pz = (p, vuoto) => (p.prezzo == null ? vuoto : p.prezzo);
  if (come === 'prezzo-su') l.sort((a, b) => pz(a, Infinity) - pz(b, Infinity));
  else if (come === 'prezzo-giu') l.sort((a, b) => pz(b, -1) - pz(a, -1));
  else if (come === 'nome') l.sort((a, b) => a.nome.localeCompare(b.nome, 'it'));
  return l;
}
// Voci di ogni gruppo per la lista di partenza, con quanti capi restano se la scegli.
export function opzioni(base, s) {
  return GRUPPI.map((g) => {
    const voci = [...new Set(base.flatMap((p) => g.val(p)))];
    if (g.ordine) voci.sort((a, b) => g.ordine.indexOf(a) - g.ordine.indexOf(b));
    else voci.sort((a, b) => a.localeCompare(b, 'it'));
    const altri = base.filter((p) => passa(p, s, g.id));
    return { ...g, voci: voci.map((v) => ({ v, n: altri.filter((p) => g.val(p).includes(v)).length, hex: g.id === 'colori' ? base.flatMap((p) => p.varianti).find((x) => x.nome === v)?.hex : null })) };
  });
}
// quanti capi non hanno ancora la taglia inserita
export const senzaTaglia = (base) => base.filter((p) => !(p.taglie || []).length).length;
