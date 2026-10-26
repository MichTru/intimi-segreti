// Divide un titolo in caratteri animabili mantenendolo leggibile dagli screen reader.
export function dividi(el) {
  if (!el || el.dataset.diviso) return el ? [...el.querySelectorAll('.car')] : [];
  const testo = el.textContent.trim();
  el.setAttribute('aria-label', testo);
  el.dataset.diviso = '1';
  el.textContent = '';
  const caratteri = [];
  testo.split(/(\s+)/).forEach((pezzo) => {
    if (!pezzo) return;
    if (/^\s+$/.test(pezzo)) {
      el.appendChild(document.createTextNode(' '));
      return;
    }
    const parola = document.createElement('span');
    parola.className = 'parola';
    parola.setAttribute('aria-hidden', 'true');
    for (const c of pezzo) {
      const s = document.createElement('span');
      s.className = 'car';
      s.textContent = c;
      parola.appendChild(s);
      caratteri.push(s);
    }
    el.appendChild(parola);
  });
  return caratteri;
}

// Sostituisce il testo di un titolo e ne restituisce i caratteri.
export function riscrivi(el, testo) {
  delete el.dataset.diviso;
  el.textContent = testo;
  return dividi(el);
}
