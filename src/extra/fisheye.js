// In vetrina: carosello curvo, come visto da un obiettivo grandangolare.
(function () {
  const CAPI = __CAPI__;
  const zonaVecchia = document.querySelector('.copertine-zona');
  if (!zonaVecchia || !CAPI.length) return;
  const zona = document.createElement('section');
  zona.className = 'fisheye-zona';
  zona.id = 'in-vetrina';
  zona.setAttribute('aria-label', 'In vetrina');
  zona.setAttribute('data-tono', 'scuro');
  zona.innerHTML = `
    <canvas class="fisheye" aria-hidden="true"></canvas>
    <div class="fisheye-info">
      <p class="occhiello" data-fe-marca></p>
      <h2 data-fe-nome></h2>
      <p class="fisheye-prezzo" data-fe-prezzo></p>
      <a class="bottone piccolo" data-fe-link>Scopri</a>
    </div>
    <p class="sr-only" aria-live="polite" data-fe-annuncio></p>`;
  zonaVecchia.before(zona);
  zonaVecchia.hidden = true;

  const tela = zona.querySelector('canvas');
  const ctx = tela.getContext('2d');
  const info = zona.querySelector('.fisheye-info');
  const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = CAPI.length;
  const foto = CAPI.map((c) => { const i = new Image(); i.decoding = 'async'; i.src = c.img; i.onload = () => (sporco = true); return i; });

  let W = 0, H = 0, dpr = 1, R = 0, A = 0, G = 0, Hc = 0;
  let pos = 0, vel = 0, meta = null, sporco = true, attuale = -1;
  let trascina = null, ultimaMano = 0, visibile = false, frame = 0;

  function misura() {
    const r = tela.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr);
    const largo = W >= 768;
    A = largo ? Math.min(W * 0.3, 420) : W * 0.56;   // larghezza di una foto, misurata sull'arco
    G = largo ? 26 : 14;                             // spazio tra le foto
    Hc = Math.min(H * 0.9, A * 1.32);                // altezza della foto al centro
    R = W * (largo ? 0.56 : 0.6);                    // raggio della curva
    sporco = true;
  }

  const passo = () => A + G;
  const modulo = (n, m) => ((n % m) + m) % m;

  function disegna() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const col = 2 / dpr;                 // una colonna ogni 2 pixel del telefono
    const cy = H / 2;
    for (let x = 0; x < W; x += col) {
      const dx = x + col / 2 - W / 2;
      if (Math.abs(dx) >= R) continue;
      const th = Math.asin(dx / R);
      const s = pos + th * R;            // posizione lungo l'arco
      const k = Math.floor((s + A / 2) / passo());
      const u = s + A / 2 - k * passo(); // posizione dentro la foto
      if (u < 0 || u > A) continue;
      const c = Math.cos(th);
      const f = 0.3 + 0.7 * Math.pow(c, 1.5);
      const h = Hc * f;
      // angoli arrotondati
      const r = A * 0.07;
      let rientro = 0;
      if (u < r) rientro = r - Math.sqrt(r * r - (r - u) * (r - u));
      else if (u > A - r) rientro = r - Math.sqrt(r * r - (u - (A - r)) * (u - (A - r)));
      const top = cy - h / 2 + rientro * f;
      const alto = h - 2 * rientro * f;
      const img = foto[modulo(k, N)];
      // larghezza a schermo della colonna rispetto all'arco
      const ds = col / c;
      if (img.complete && img.naturalWidth) {
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scala = Math.max(A / iw, Hc / ih);
        const cw = A / scala, ch = Hc / scala;
        const ox = (iw - cw) / 2, oy = (ih - ch) * 0.3;
        const sx = ox + (u / A) * cw;
        const sy = oy + (rientro / Hc) * ch;
        const sh = ch - (2 * rientro / Hc) * ch;
        ctx.drawImage(img, sx, sy, Math.max(1, (ds / A) * cw), sh, x, top, col + 0.6, alto);
      } else {
        ctx.fillStyle = '#4a1021';
        ctx.fillRect(x, top, col + 0.6, alto);
      }
      const buio = (1 - c) * 0.9;
      if (buio > 0.02) { ctx.fillStyle = `rgba(20,6,10,${Math.min(0.75, buio)})`; ctx.fillRect(x, top, col + 0.6, alto); }
    }
  }

  function aggiornaInfo() {
    const i = modulo(Math.round(pos / passo()), N);
    if (i === attuale) return;
    attuale = i;
    const c = CAPI[i];
    info.classList.add('cambia');
    setTimeout(() => {
      zona.querySelector('[data-fe-marca]').textContent = c.marca;
      zona.querySelector('[data-fe-nome]').textContent = c.nome;
      zona.querySelector('[data-fe-prezzo]').textContent = c.prezzo;
      zona.querySelector('[data-fe-link]').href = c.link;
      zona.querySelector('[data-fe-link]').setAttribute('aria-label', `Scopri ${c.nome}`);
      zona.querySelector('[data-fe-annuncio]').textContent = `${c.nome}, ${c.prezzo}`;
      info.classList.remove('cambia');
    }, attuale === -1 ? 0 : 180);
  }

  function ciclo() {
    frame = 0;
    if (!visibile) return;
    const ora = performance.now();
    if (!trascina) {
      if (meta !== null) {
        const d = meta - pos;
        pos += d * 0.12;
        if (Math.abs(d) < 0.3) { pos = meta; meta = null; }
        sporco = true;
      } else if (Math.abs(vel) > 0.05) {
        pos += vel; vel *= 0.94; sporco = true;
        if (Math.abs(vel) < 0.6) { meta = Math.round(pos / passo()) * passo(); vel = 0; }
      } else if (!fermo && ora - ultimaMano > 3500) {
        pos += 0.35; sporco = true; // gira piano da sola
      }
    }
    if (sporco) { disegna(); aggiornaInfo(); sporco = false; }
    frame = requestAnimationFrame(ciclo);
  }
  const avvia = () => { if (!frame) frame = requestAnimationFrame(ciclo); };

  tela.addEventListener('pointerdown', (e) => {
    trascina = { x: e.clientX, y: e.clientY, p: pos, t: performance.now(), mosso: false, ultimi: [[e.clientX, performance.now()]] };
    meta = null; vel = 0; ultimaMano = performance.now();
  });
  tela.addEventListener('pointermove', (e) => {
    if (!trascina) return;
    const dx = e.clientX - trascina.x;
    if (!trascina.mosso && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - trascina.y)) { trascina.mosso = true; tela.setPointerCapture(e.pointerId); }
    if (!trascina.mosso) return;
    pos = trascina.p - dx * 1.15;
    trascina.ultimi.push([e.clientX, performance.now()]); if (trascina.ultimi.length > 5) trascina.ultimi.shift();
    sporco = true; ultimaMano = performance.now();
  });
  const lascia = (e) => {
    if (!trascina) return;
    const t = trascina; trascina = null; ultimaMano = performance.now();
    if (t.mosso) {
      const [x1, t1] = t.ultimi[0], [x2, t2] = t.ultimi[t.ultimi.length - 1];
      vel = t2 > t1 ? (-(x2 - x1) / (t2 - t1)) * 16 * 1.15 : 0;
      if (Math.abs(vel) < 0.6) meta = Math.round(pos / passo()) * passo();
      return;
    }
    if (e.type !== 'pointerup') return;
    // tocco: sulla foto al centro apre il capo, sui lati la porta al centro
    const r = tela.getBoundingClientRect();
    const dx = e.clientX - r.left - W / 2;
    if (Math.abs(dx) < A * 0.4) { location.href = CAPI[modulo(Math.round(pos / passo()), N)].link; return; }
    meta = (Math.round(pos / passo()) + Math.sign(dx)) * passo();
  };
  tela.addEventListener('pointerup', lascia);
  tela.addEventListener('pointercancel', lascia);
  tela.style.cursor = 'grab';

  addEventListener('resize', () => { misura(); avvia(); });
  new IntersectionObserver(([v]) => { visibile = v.isIntersecting; if (visibile) { sporco = true; avvia(); } }).observe(zona);
  misura();
  aggiornaInfo();
})();
