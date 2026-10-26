import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Sito statico a più pagine: ogni HTML è un punto d'ingresso.
export default defineConfig({
  appType: 'mpa',
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        vetrina: resolve(__dirname, 'vetrina/index.html'),
        privacy: resolve(__dirname, 'privacy/index.html'),
        errore: resolve(__dirname, '404.html'),
      },
      output: {
        manualChunks: { gsap: ['gsap'] },
      },
    },
  },
});
