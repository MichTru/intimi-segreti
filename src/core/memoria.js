// localStorage / sessionStorage con ripiego sicuro (navigazione privata, blocchi, quota).
function crea(nomeArea) {
  const riserva = new Map();
  let area = null;
  try {
    area = window[nomeArea];
    const k = '__is_prova__';
    area.setItem(k, '1');
    area.removeItem(k);
  } catch {
    area = null;
  }
  return {
    leggi(chiave, predefinito = null) {
      try {
        const v = area ? area.getItem(chiave) : riserva.get(chiave);
        return v == null ? predefinito : JSON.parse(v);
      } catch {
        return predefinito;
      }
    },
    scrivi(chiave, valore) {
      const v = JSON.stringify(valore);
      riserva.set(chiave, v);
      try {
        if (area) area.setItem(chiave, v);
      } catch {
        /* quota piena: resta in memoria per la sessione */
      }
    },
  };
}

export const locale = crea('localStorage');
export const sessione = crea('sessionStorage');

// ---- Preferiti ----
const CHIAVE = 'is:preferiti';
const ascoltatori = new Set();
let preferiti = new Set(locale.leggi(CHIAVE, []));

export const Preferiti = {
  tutti: () => [...preferiti],
  ha: (id) => preferiti.has(id),
  quanti: () => preferiti.size,
  alterna(id) {
    if (preferiti.has(id)) preferiti.delete(id);
    else preferiti.add(id);
    locale.scrivi(CHIAVE, [...preferiti]);
    ascoltatori.forEach((f) => f(id, preferiti.has(id)));
    return preferiti.has(id);
  },
  ascolta(f) {
    ascoltatori.add(f);
    return () => ascoltatori.delete(f);
  },
};

window.addEventListener('storage', (e) => {
  if (e.key !== CHIAVE) return;
  preferiti = new Set(locale.leggi(CHIAVE, []));
  ascoltatori.forEach((f) => f(null, false));
});
