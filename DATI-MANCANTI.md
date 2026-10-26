# Dati da chiedere alla boutique

Il sito non inventa nulla: dove un dato manca mostra «in attesa dei dati della boutique».
Tutti questi valori si inseriscono in `src/data/site.json` (vedi README).

| Cosa serve | Campo | Effetto quando viene inserito |
|---|---|---|
| Numero WhatsApp (con prefisso, es. `39333...`) | `whatsapp` | «Chiedi in boutique», lista preferiti e appuntamento aprono WhatsApp con il messaggio pronto. Ora il testo viene copiato negli appunti. |
| Indirizzo definitivo del sito (es. `https://www.…`) | `url` | Sitemap, link di condivisione e anteprime social corrette. |
| Indirizzo del negozio | `indirizzo` | Contatti, piede, dati strutturati per Google. |
| Orari di apertura | `orari` | Contatti e dati strutturati. |
| Telefono, email | `telefono`, `email` | Contatti, privacy. |
| Link alla mappa e indirizzo di incorporamento | `mappaLink`, `mappaEmbed` | Sezione «Vieni a trovarci». |
| Testo di presentazione di chi accoglie | `chiSiamo` | Sezione «La Boutique». |
| Ragione sociale, sede, partita IVA | `titolare`, `partitaIva` | Pagina privacy e piede. |
| Profilo Instagram, se esiste | `social.instagram` | Menu, piede, contatti. |

## Da confermare (trovato online, NON inserito nel sito)

Un elenco di terze parti riporta per «Intimi Segreti» a Lugo: via Baracca 55, tel. 0545 23277,
lun–sab 9:00–12:30 e 15:30–19:30, attività «abbigliamento intimo e moda mare».
Fonte non ufficiale: da verificare con la titolare prima di usarli.

## Prezzi mancanti

Tote in ecopelliccia (Liu Jo), camicia floreale (Susy Mix), T-shirt con maniche in pizzo: ora mostrano «Prezzo in boutique».
Da confermare anche che la «maglia Liu Jo a 69 €» sia la T-shirt Red Roses.

## Materiali

- **Logo** in formato vettoriale (ora c'è una scritta tipografica).
- **Fotografie originali dei capi** (4:5, almeno 1200×1500 px). Quelle attuali sono provvisorie: screenshot e immagini prese da siti di marchi e di altri negozi. Prima di pubblicare servono le foto ufficiali dei marchi (con conferma che la boutique può usarle) o scatti propri.
- **Consenso** delle persone riconoscibili nelle foto fatte in negozio. Pullover e jeans sono ritagliati sotto il viso.
- **Articoli di intimo**: la categoria esiste ma è vuota.
- **Marchio del secchiello con borchie**, se va indicato.
- Verifica legale della pagina privacy.


## Taglie

Nel catalogo le borse sono segnate come taglia "Unica". Per i capi di abbigliamento le taglie non sono state indicate: vanno aggiunte nel campo `taglie` di ogni prodotto in `src/data/products.json` (es. `["S", "M", "L"]`). Appena ci sono, compaiono da sole nel filtro Taglia.
