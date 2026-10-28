# Intimi Segreti — Boutique digitale

Sito statico a più pagine, costruito con Vite. Nessun framework.

```bash
npm install
npm run dev        # sviluppo, http://localhost:5173
npm run build      # produzione in dist/ (+ pagine di condivisione, dati strutturati, sitemap)
npm run preview    # prova della versione di produzione
```

Il contenuto di `dist/` si pubblica su qualsiasi hosting statico. Impostare `404.html` come pagina di errore.

## ⚠️ Stato del collaudo — da leggere

Il progetto è stato scritto in un ambiente senza accesso a npm: **`npm install`, `vite dev` e `vite build` non sono mai stati eseguiti**.
Le prove sono state fatte impacchettando il codice con esbuild.

**Verificato in Chromium (390×844 e 1440×900), scorrendo davvero la pagina:**
la home completa — copertine con passaggio a cerchio, nastro, rella orizzontale, look, pila delle collezioni,
chiusura «Lugo», contatti — senza errori in console e senza scroll orizzontale.
La home non usa librerie esterne: il motore di scroll è `src/motion/scena.js`.

**Verificato solo nella logica** (con GSAP sostituito da un segnaposto): Vetrina Digitale (swipe, soglia del gesto,
frecce, filtri, scheda, preferiti, griglia, stato nell'URL, tasto indietro), menu, copia della richiesta, `tools/post-build.mjs`.

**Non verificato:**

- le animazioni GSAP di Vetrina Digitale, menu, cursore e passaggio Vetrina ↔ Griglia;
- il carattere Fraunces (nelle prove c'era un serif sostitutivo: la parola gigante può avere ingombro diverso);
- i percorsi di `@fontsource-variable/fraunces` e la build di Vite;
- qualsiasi dispositivo reale: iPhone e Safari non sono stati provati, prestazioni non misurate.

## Aggiornare il catalogo

Tutto sta in **`src/data/products.json`** e in **`public/assets/products/`**.

### Aggiungere un prodotto

```json
{
  "id": "nome-senza-spazi",
  "nome": "Nome mostrato",
  "marchio": "Marchio oppure null",
  "prezzo": 79.9,
  "categoria": "abbigliamento",
  "sottocategoria": "Tute",
  "descrizione": "Una o due frasi.",
  "dettagli": ["Dettaglio 1", "Dettaglio 2"],
  "tinta": "#e9dcc6",
  "aggiunto": "2026-10-15",
  "regalo": false,
  "demo": false,
  "varianti": [
    { "id": "nero", "nome": "Nero", "hex": "#1d191a", "immagine": "nome-senza-spazi--nero" }
  ]
}
```

- `prezzo`: numero, oppure `null` per mostrare «Prezzo in boutique».
- `categoria`: una di quelle elencate in `"categorie"` (abbigliamento, borse, intimo). Una categoria senza prodotti non compare nei filtri.
- `tinta`: colore di fondo della Vetrina Digitale per quel capo; conviene riprenderlo dallo sfondo della foto.
- `aggiunto`: i 4 prodotti con la data più recente sono le **Novità** e compaiono per primi.
- `regalo: true` lo inserisce nel filtro **Idee regalo**.

### Immagini

Per ogni variante quattro file in `public/assets/products/`, con il nome scritto in `"immagine"`:
`nome--colore.webp` e `.avif` (1200 × 1500 px), `nome--colore-600.webp` e `-600.avif` (600 × 750 px).
Formato verticale 4:5. Per sostituire una foto basta sovrascrivere i file.

### Copertine e look della home

Sempre in `products.json`:

- `"copertine"`: i capi in copertina, nell'ordine. `parola` è la scritta gigante, `tema` è `borgogna`, `cipria` o `avorio`.
  Con `scontorno` si usa un'immagine senza sfondo da `public/assets/site/`; senza, la foto del prodotto dentro un arco.
  `satellite` è il secondo articolo che orbita accanto.
- `"look"`: abbinamenti di due capi; il totale si calcola da solo.

### Contatti

`src/data/site.json`. I campi `null` sono in attesa: l'elenco è in `DATI-MANCANTI.md`.
Il numero WhatsApp va scritto con prefisso e senza simboli, es. `"whatsapp": "39333123456"`.

## Com'è fatto

```
index.html            Home
vetrina/index.html    Vetrina Digitale (catalogo)
privacy/, 404.html    Pagine di servizio
src/pages/            home.js, vetrina.js, semplice.js
src/motion/           scena.js (motore di scroll della home), tokens.js, testo.js
src/core/             catalogo, preferiti, contatti, scheda prodotto, cornice (testata, menu, piede)
src/data/             products.json e site.json  ← gli unici file da toccare per i contenuti
src/styles/           base.css (token), home.css, vetrina.css
tools/post-build.mjs  dati strutturati, pagine /p/<id>/ per la condivisione, sitemap
```

- **Home.** `scena.js` scrive poche variabili CSS per sezione (`--p` avanzamento, `--v` velocità, `--mx/--my` puntatore);
  tutto il movimento è calcolato in `home.css` da quelle variabili, quindi è reversibile e non lascia animazioni duplicate.
  `home.js` decide solo la regia delle due sequenze a più fasi (copertine e pila) con `--in`, `--out`, `--l`, `--k`, `--u`.
- **Vetrina Digitale.** Usa GSAP. Stato nell'URL: `/vetrina/?vista=griglia&categoria=borse&prodotto=id&colore=id`.
- **Movimento ridotto.** Con «riduci movimento» attivo: niente sequenze, contenuti in pagina, griglia predefinita.
- **Privacy.** Nessun cookie, nessun tracciamento, font ospitati dal sito.

## Scostamenti dal brief iniziale

- Niente Three.js né scena 3D: la direzione grafica è cambiata verso copertine fotografiche.
- Niente Lenis e niente ScrollTrigger nella home: sostituiti dal motore proprio, per poterlo collaudare.
- La Vetrina Digitale e la cornice hanno ancora la veste grafica precedente.
