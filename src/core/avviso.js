// Piccolo avviso temporaneo, annunciato anche agli screen reader.
let nodo = null;
let timer = 0;

export function avvisa(testo, durata = 3200) {
  if (!nodo) {
    nodo = document.createElement('div');
    nodo.className = 'avviso';
    nodo.setAttribute('role', 'status');
    nodo.setAttribute('aria-live', 'polite');
    document.body.appendChild(nodo);
  }
  nodo.textContent = testo;
  requestAnimationFrame(() => nodo.classList.add('visibile'));
  clearTimeout(timer);
  timer = setTimeout(() => nodo.classList.remove('visibile'), durata);
}
