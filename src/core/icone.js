const svg = (d, classe = '') => `<svg class="${classe}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
export const ICONE = {
  cuore: svg('<path d="M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4C19 15.600 12 20 12 20Z"/>', 'cuore'),
  condividi: svg('<path d="M12 15V4m0 0L8 8m4-4 4 4M5 13v6h14v-6"/>'),
  chiudi: svg('<path d="m6 6 12 12M18 6 6 18"/>'),
  prima: svg('<path d="m14 6-6 6 6 6"/>'),
  dopo: svg('<path d="m10 6 6 6-6 6"/>'),
  griglia: svg('<path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5zM13 13h6v6h-6z"/>'),
  vetrina: svg('<path d="M7 4h10v16H7zM3 7h2v10H3zM19 7h2v10h-2z"/>'),
  ruota: svg('<path d="M4 12c0-2.200 3.600-4 8-4s8 1.800 8 4-3.600 4-8 4m0 0 2.500-2.500M12 16l2.500 2.500"/>'),
};
