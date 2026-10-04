# Gestionale X

Gestionale personale per progetti, idee, note, attività, calendario e routine. La chat Polpo AI può proporre modifiche ai dati, che vengono eseguite dopo conferma. L'app è pubblicata su [polpopoly.it/gestionale](https://polpopoly.it/gestionale/).

## Struttura

- `src/`: frontend React 19 e Vite 7. `src/App.jsx` definisce le pagine; `src/context/DataProvider.jsx` mantiene i dati Firestore in tempo reale.
- `backend/`: API Express per chat AI, voce e lettura del vault. Usa Firebase Admin e provider Groq; Nvidia è opzionale.
- `backend/sincronizza.js`: sincronizza i progetti dal vault Obsidian e dalla scansione di PLANCIA verso Firestore. È uno script locale, separato dall'avvio dell'app.
- `public/`: manifest e service worker della PWA.
- `firestore.rules`: regole di accesso ai dati per utente.

Il vault è la fonte delle informazioni sui progetti; l'app conserva anche dati decisi nell'interfaccia, come spunte, scadenze e appuntamenti. La nota di progetto nel vault (`20-Projects/Gestionale X.md`) descrive le decisioni e la roadmap correnti.

## Avvio locale

Servono Node.js, npm e un account Firebase configurato per il progetto. Le dipendenze del frontend e del backend si installano separatamente.

```powershell
cd gestionale-x
npm install
cd backend
npm install
Copy-Item .env.example .env
```

Inserire le proprie chiavi in `backend/.env`. Per le API autenticate serve anche `backend/serviceAccount.json`, oppure la variabile `FIREBASE_SERVICE_ACCOUNT` con il JSON delle credenziali. Questi file non vanno committati. La configurazione Firebase del client è in `src/firebase.js`.

Avviare backend e frontend in due terminali:

```powershell
# Terminale 1, dalla cartella gestionale-x/backend
npm run dev

# Terminale 2, dalla cartella gestionale-x
npm run dev
```

Il backend ascolta sulla porta `5032`; Vite inoltra `/api` a `http://localhost:5032`. L'accesso all'app richiede Firebase Auth. La base URL del frontend è `/gestionale/`, anche in locale.

## Controlli

```powershell
npm run lint
npm run build
```

`npm run build` crea `dist/`, ma non pubblica il sito. Per vedere la build in locale: `npm run preview`.

### Collaudo completo

```powershell
npm run collauda              # giro veloce, referto in tester/referti/<data-ora>/referto.html
npm run collauda:vedi         # finestra visibile e rallentata
npm run collauda -- --seme N  # rifà identico un giro
```

`tester/collauda.cjs` usa l'app vera in Chromium, su emulatori Firebase con progetto finto
`demo-gestionale-x`. Il backend parte in modalità emulatori, senza credenziali, e l'AI è simulata.
Il browser blocca ogni richiesta che esce dal PC. Serve `firebase-tools` installato globalmente.
Java 21 viene scaricato una volta in `tester/cache` se manca. In Claude Code o PLANCIA:
`/collaudo-gestionale`.

## Sincronizzazione dei progetti

`backend/sincronizza.js` legge il vault e il report dello scanner in `PLANCIA/scanner/`. Prima di scrivere su Firestore si può controllare il risultato:

```powershell
node backend/sincronizza.js --prova
```

Lo script richiede `backend/serviceAccount.json` e usa i percorsi locali dei progetti. Consultare la nota `Gestionale X` nel vault prima di cambiare le regole di fusione: le spunte e i campi gestiti nell'app devono sopravvivere alle sincronizzazioni successive.

## Pubblicazione

Il frontend è pubblicato dentro Polpopoly Hub su Cloudflare Pages. La chat AI usa il backend su Render; push e sveglie sono gestite dal Worker `workers/gestionale-push` dell’hub. Prima del deploy occorre ricostruire e copiare la build del gestionale nell’hub: il solo build Astro non aggiorna le sotto-app. Configurazione e comandi sono nel README del Worker. Un build locale non aggiorna i servizi online.

Il repository Git è la cartella padre `polpo/` e contiene anche altro codice: limitare commit e review ai file di `gestionale-x/` quando si lavora solo su questa app.

## Documenti e file locali

La sezione `#/documenti` conserva originali e testi in IndexedDB, separati per UID Firebase. Nessun documento viene caricato su Firestore, Storage o servizi AI. Il browser, il dominio e il dispositivo identificano l'archivio: cancellarne i dati elimina anche gli originali. Il login non cifra il database locale.

- Scatto da telefono o caricamento di qualunque file; originali invariati, fino a 20 MB ciascuno e 50 MB per documento.
- Testo da TXT/MD/CSV, foto JPG/PNG/WebP/BMP con Tesseract (italiano e inglese), PDF con PDF.js e OCR delle pagine senza testo. Massimo 30 pagine lette, originale intero conservato; gli altri formati restano allegati scaricabili.
- L'OCR lavora sul dispositivo; al primo uso scarica motore/modelli dai CDN di Tesseract. La lettura può fallire offline senza perdere l'originale. Il riepilogo iniziale riprende il testo riconosciuto, non è una sintesi semantica AI; è modificabile e scaricabile come TXT insieme ai dati e alle scadenze.
- Collegamento locale a un elemento e riferimento testuale a un obiettivo (gli obiettivi esistenti non hanno ID propri). Nel dettaglio dell'elemento compare il documento.
- Scadenze inserite/verificate dall'utente, mostrate in Oggi e Calendario sul dispositivo. Pagate o documenti chiusi esclusi. Nessuna push ad app chiusa per queste scadenze locali.
- Backup JSON completo o per documento con originali base64, testi e collegamenti. Non cifrato: conservarlo con cura. Ripristino atomico dopo validazione, aggiunge solo gli ID mancanti; i documenti esistenti non vengono sovrascritti. Per archivi oltre 75 MB usare i backup per documento (import massimo 150 MB).

Collaudo ripetibile: `npm run test:documents`. Usa Edge headless su Windows (o `PLAYWRIGHT_CHANNEL`), IndexedDB reale, Firebase simulato e documenti sintetici. Verifica OCR foto/PDF, persistenza, byte degli originali, export/import, isolamento account, rifiuto backup corrotti, collegamenti e scadenze. Serve rete per il primo download dei modelli OCR. Non usa credenziali né dati reali.
