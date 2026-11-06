// I capi dondolano appesi al gancio quando la rella si muove o si ferma.
(function () {
  const rella = document.querySelector('[data-rella]');
  if (!rella || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let capi = [], stati = [], prima = null, t0 = 0, vivo = false, id = 0;
  const prendi = () => { capi = [...rella.children]; stati = capi.map((_, i) => ({ a: 0, v: 0, f: i * 1.7 })); };
  const posizione = () => { const m = /translate3d\((-?[\d.]+)px/.exec(rella.style.transform || ''); return m ? parseFloat(m[1]) : 0; };
  function passo(t) {
    id = requestAnimationFrame(passo);
    if (capi.length !== rella.children.length) prendi();
    const dt = Math.min(0.05, (t - t0) / 1000 || 0.016); t0 = t;
    const x = posizione();
    let vel = prima == null ? 0 : (x - prima) / dt;
    if (Math.abs(vel) > 6000) vel = 0; // il salto quando la rella ricomincia il giro
    prima = x;
    for (let i = 0; i < capi.length; i++) {
      const s = stati[i];
      const riposo = Math.sin(t / 1500 + s.f) * 0.5;
      s.v += (-(s.a - riposo) * 30 - s.v * 3.6 + vel * 0.25) * dt;
      s.a = Math.max(-14, Math.min(14, s.a + s.v * dt));
      capi[i].style.setProperty('--osc', `${s.a.toFixed(2)}deg`);
    }
  }
  new IntersectionObserver(([v]) => {
    if (v.isIntersecting && !vivo) { vivo = true; prima = null; t0 = performance.now(); id = requestAnimationFrame(passo); }
    else if (!v.isIntersecting && vivo) { vivo = false; cancelAnimationFrame(id); }
  }).observe(rella);
})();
