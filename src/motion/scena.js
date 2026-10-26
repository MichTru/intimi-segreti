// Motore di scroll della home: nessuna libreria.
// A ogni fotogramma legge la posizione di scroll (ammorbidita), calcola
// l'avanzamento di ogni sezione e lo scrive in variabili CSS. Tutto il
// movimento vero è in home.css, calcolato da quelle variabili: per questo è
// reversibile per costruzione e non lascia animazioni duplicate in giro.
//
//   [data-scena]       sezione "fermata" (sticky): --p va da 0 a 1 mentre resta fissa
//   [data-attraversa]  blocco in flusso normale: --t va da 0 (entra dal basso) a 1 (esce in alto)
//   [data-velocita]    riceve --v, velocità di scroll (−1…1)
//   [data-puntatore]   riceve --mx/--my, puntatore (−0.5…0.5), solo con mouse
// Il ciclo gira solo mentre qualcosa si muove: a pagina ferma non consuma nulla.

const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const morbido = (t) => t * t * (3 - 2 * t); // curva "scena": parte e arriva piano
export const tratto = (p, da, a) => morbido(limita((p - da) / (a - da)));

export function creaMotore({ alFotogramma = () => {} } = {}) {
  let scene = [];
  let attraversa = [];
  let conVelocita = [];
  let conPuntatore = [];
  let vh = innerHeight;
  let corrente = scrollY;
  let velocita = 0;
  let vScritta = 0;
  let idFrame = 0;
  let attivo = false;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const mira = { x: 0, y: 0 };
  const posa = { x: 0, y: 0 };

  function misura() {
    vh = innerHeight;
    const y0 = scrollY;
    const rett = (el) => {
      const r = el.getBoundingClientRect();
      return { el, alto: r.top + y0, altezza: r.height, ultimo: -1 };
    };
    scene = [...document.querySelectorAll('[data-scena]')].map(rett);
    attraversa = [...document.querySelectorAll('[data-attraversa]')].map(rett);
    // Le variabili si scrivono solo sugli elementi che le usano: scriverle
    // sulla radice costringerebbe il browser a ricalcolare tutta la pagina.
    conVelocita = [...document.querySelectorAll('[data-velocita]')];
    conPuntatore = [...document.querySelectorAll('[data-puntatore]')];
  }

  function fotogramma() {
    const y = scrollY;
    const delta = y - corrente;
    const fermoScroll = Math.abs(delta) < 0.4;
    corrente = fermoScroll ? y : corrente + delta * 0.14; // scrub morbido
    const vMira = limita(delta / 220, -1, 1);
    velocita += (vMira - velocita) * 0.18;
    if (Math.abs(velocita) < 0.004) velocita = 0;
    if (Math.abs(velocita - vScritta) > 0.012 || (velocita === 0 && vScritta !== 0)) {
      vScritta = velocita;
      const v = velocita.toFixed(2);
      for (const el of conVelocita) el.style.setProperty('--v', v);
    }

    let fermoPuntatore = true;
    if (fine) {
      const dx = mira.x - posa.x;
      const dy = mira.y - posa.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.002) {
        fermoPuntatore = false;
        posa.x += dx * 0.07;
        posa.y += dy * 0.07;
        for (const el of conPuntatore) {
          el.style.setProperty('--mx', posa.x.toFixed(3));
          el.style.setProperty('--my', posa.y.toFixed(3));
        }
      }
    }

    for (const s of scene) {
      if (corrente + vh < s.alto - vh || corrente > s.alto + s.altezza + vh) continue; // lontana: non si tocca
      const p = limita((corrente - s.alto) / Math.max(1, s.altezza - vh));
      if (Math.abs(p - s.ultimo) < 0.0004) continue;
      s.ultimo = p;
      s.el.style.setProperty('--p', p.toFixed(4));
      alFotogramma(s.el, p);
    }
    for (const a of attraversa) {
      const t = (corrente + vh - a.alto) / (a.altezza + vh);
      if (t < -0.2 || t > 1.2) continue;
      const tt = limita(t);
      if (Math.abs(tt - a.ultimo) < 0.0006) continue;
      a.ultimo = tt;
      a.el.style.setProperty('--t', tt.toFixed(4));
      a.el.style.setProperty('--r', tratto(tt, 0.08, 0.42).toFixed(4)); // rivelazione
    }

    // Tutto fermo: il ciclo si spegne e riparte al prossimo scroll o movimento.
    if (fermoScroll && velocita === 0 && fermoPuntatore) {
      attivo = false;
      idFrame = 0;
      return;
    }
    idFrame = requestAnimationFrame(fotogramma);
  }

  function sveglia() {
    if (attivo || document.hidden) return;
    attivo = true;
    idFrame = requestAnimationFrame(fotogramma);
  }
  const suPuntatore = (e) => {
    if (e.pointerType !== 'mouse') return;
    mira.x = e.clientX / innerWidth - 0.5;
    mira.y = e.clientY / innerHeight - 0.5;
    sveglia();
  };
  let attesa = 0;
  const suResize = () => {
    cancelAnimationFrame(attesa);
    attesa = requestAnimationFrame(() => {
      misura();
      scene.forEach((s) => (s.ultimo = -1));
      attraversa.forEach((s) => (s.ultimo = -1));
      sveglia();
    });
  };

  misura();
  window.addEventListener('scroll', sveglia, { passive: true });
  if (fine) window.addEventListener('pointermove', suPuntatore, { passive: true });
  window.addEventListener('resize', suResize);
  window.addEventListener('orientationchange', suResize);
  document.addEventListener('visibilitychange', sveglia);
  const osservatore = new ResizeObserver(suResize); // immagini e font che cambiano l'altezza della pagina
  osservatore.observe(document.body);
  sveglia();

  return {
    misura: suResize,
    distruggi() {
      attivo = false;
      cancelAnimationFrame(idFrame);
      osservatore.disconnect();
      window.removeEventListener('scroll', sveglia);
      window.removeEventListener('pointermove', suPuntatore);
      window.removeEventListener('resize', suResize);
      window.removeEventListener('orientationchange', suResize);
      document.removeEventListener('visibilitychange', sveglia);
    },
  };
}
