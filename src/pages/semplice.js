// Pagine di servizio (privacy, 404): solo la cornice comune.
import { montaCornice } from '../core/cornice.js';
import sito from '../data/site.json';

montaCornice();
document.querySelectorAll('[data-sito]').forEach((el) => {
  const valore = sito[el.dataset.sito];
  el.innerHTML = valore ? String(valore) : `<span class="in-attesa">${el.dataset.attesa || 'In attesa dei dati della boutique'}</span>`;
});
