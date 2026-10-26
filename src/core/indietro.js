// Gesto "indietro" per il telefono: trascinando il dito da sinistra verso destra
// si torna alla pagina precedente (o si chiude la finestra aperta: scheda,
// preferiti, filtri, menu). Dal bordo sinistro funziona ovunque; dal resto
// dello schermo solo dove non c'è già un gesto orizzontale (giostra, rella,
// vetrina, filtri), così i caroselli continuano a sfogliare come prima.

const BORDO = 28; // px dal bordo sinistro in cui il gesto vale sempre
const SOGLIA = 96; // px da percorrere per tornare indietro
const MASSIMO = 120;
const GESTI_PROPRI = '#copertina, [data-binario], .palco, .banco, .filtri, .voci, input, textarea, select, [data-gesto-proprio]';

// Cosa succede se il gesto va a segno; null se non c'è nessun "indietro".
function destinazione() {
  const chiudi = (sel) => () => document.querySelector(sel)?.click();
  if (document.querySelector('.pannello:not([hidden])')) return chiudi('.pannello:not([hidden]) [data-chiudi-pannello]');
  const dialogo = document.querySelector('dialog[open]');
  if (dialogo) return () => (dialogo.querySelector('[data-chiudi]') || { click: () => dialogo.close() }).click();
  if (document.documentElement.classList.contains('menu-aperto')) return chiudi('[data-chiudi-menu]');
  let interno = false;
  try { interno = !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { /* referrer illeggibile */ }
  if (interno && history.length > 1) return () => history.back();
  if (!document.body.classList.contains('pagina-home')) return chiudi('.testata .marchio'); // passa per la transizione delle pagine
  return null;
}

export function montaIndietro() {
  if (!('ontouchstart' in window) && !navigator.maxTouchPoints) return;
  const segno = document.createElement('div');
  segno.className = 'indietro';
  segno.setAttribute('aria-hidden', 'true');
  segno.innerHTML = '<svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6" /></svg>';
  document.body.append(segno);

  let inizio = null; // { x, y, t, bordo }
  let preso = false;
  let azione = null;
  let pronto = false;

  const mostra = (dx) => {
    const d = Math.min(MASSIMO, dx * 0.7);
    segno.style.transform = `translate3d(${d}px, -50%, 0) scale(${0.7 + Math.min(1, dx / SOGLIA) * 0.3})`;
    segno.style.opacity = String(Math.min(1, dx / 40));
    const ora = dx >= SOGLIA;
    if (ora !== pronto) {
      pronto = ora;
      segno.classList.toggle('pronto', ora);
      if (ora && navigator.vibrate) navigator.vibrate(8);
    }
  };
  const nascondi = () => {
    segno.classList.remove('pronto');
    segno.style.transform = '';
    segno.style.opacity = '';
    pronto = false;
  };

  document.addEventListener('touchstart', (e) => {
    inizio = null;
    preso = false;
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const bordo = t.clientX <= BORDO;
    if (!bordo && e.target.closest?.(GESTI_PROPRI)) return;
    azione = destinazione();
    if (!azione) return;
    inizio = { x: t.clientX, y: t.clientY, t: performance.now(), bordo };
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!inizio) return;
    const t = e.touches[0];
    const dx = t.clientX - inizio.x;
    const dy = t.clientY - inizio.y;
    if (!preso) {
      // si decide al primo movimento chiaro: in orizzontale verso destra è nostro,
      // altrimenti è uno scroll e lo lasciamo stare
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (dx > 0 && dx > Math.abs(dy) * (inizio.bordo ? 1 : 1.6)) {
        preso = true;
        // le finestre aperte stanno sopra a tutto: la freccia va dentro di loro
        const sopra = document.querySelector('dialog[open]') || document.body;
        if (segno.parentNode !== sopra) sopra.append(segno);
        segno.style.top = `${t.clientY}px`;
        segno.classList.add('attivo');
      } else { inizio = null; return; }
    }
    if (e.cancelable) e.preventDefault();
    mostra(Math.max(0, dx));
  }, { passive: false });

  const fine = (e) => {
    if (!inizio || !preso) { inizio = null; return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - inizio.x;
    const veloce = dx > 50 && dx / (performance.now() - inizio.t) > 0.6;
    inizio = null;
    preso = false;
    segno.classList.remove('attivo');
    if (e.type === 'touchend' && (dx >= SOGLIA || veloce)) {
      segno.classList.add('via');
      setTimeout(() => { segno.classList.remove('via'); nascondi(); }, 320);
      azione();
    } else nascondi();
  };
  document.addEventListener('touchend', fine, { passive: true });
  document.addEventListener('touchcancel', fine, { passive: true });
  // tornando con il tasto indietro del browser la pagina può riapparire dalla cache
  window.addEventListener('pageshow', () => { segno.classList.remove('attivo', 'via'); nascondi(); });
}
