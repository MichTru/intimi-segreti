// Sistema di motion unico: stesse curve e durate di src/styles/base.css.
export const EASE = {
  entrata: 'expo.out', // elementi che arrivano
  uscita: 'power3.in', // elementi che lasciano la scena
  scena: 'power2.inOut', // cambi di scena, camera, luci
  molla: 'back.out(1.6)', // conferme e piccoli feedback
};

export const DUR = { micro: 0.25, breve: 0.5, media: 0.9, lunga: 1.4 };

export const riduciMovimento = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
