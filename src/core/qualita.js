// Tre livelli di qualità scelti automaticamente:
//   completo   → tutte le animazioni
//   ridotto    → animazioni alleggerite (niente sfocature in movimento)
//   essenziale → dispositivi lenti o movimento ridotto: griglia predefinita, niente sequenze pesanti
// Forzabile per prova con ?qualita=completo|ridotto|essenziale
import { riduciMovimento } from '../motion/tokens.js';

let memo = null;

export function livelloQualita() {
  if (memo) return memo;
  const forzato = new URLSearchParams(location.search).get('qualita');
  if (['completo', 'ridotto', 'essenziale'].includes(forzato)) return (memo = forzato);

  const conn = navigator.connection || {};
  const memoria = navigator.deviceMemory || 4;
  const core = navigator.hardwareConcurrency || 4;
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 768;

  if (riduciMovimento() || conn.saveData || memoria <= 2 || core <= 2) memo = 'essenziale';
  else if (mobile || memoria <= 4 || core <= 4) memo = 'ridotto';
  else memo = 'completo';
  return memo;
}
