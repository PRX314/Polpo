# 🏺 Olimpiadi Goliardiche 2025 - Classifica Finale

Applicazione web per la gestione e visualizzazione della classifica finale delle Olimpiadi Goliardiche 2025.

## 🎯 Caratteristiche

- **Classifica Interattiva**: Visualizzazione completa dei punteggi di tutte le squadre
- **14 Templi/Bar**: Un gioco per ogni location
- **20 Squadre**: Gestione completa dei partecipanti
- **Google Sheets Integration**: Sincronizzazione automatica con Google Sheets
- **Vista Mobile Ottimizzata**:
  - Vista a Card con ricerca squadre
  - Vista per Bar (filtra per location)
- **Vista Desktop**: Tabella completa con tutti i punteggi
- **Design Greco**: Stile ispirato ai vasi greci con palette oro/bronzo

## 🚀 Come Usare

### Visualizza la Classifica

Apri semplicemente il file `classifica.html` tramite un server web locale o visita la pagina GitHub Pages.

### Collegamenti Google Sheets

1. Clicca su **"🔄 Sincronizza Google Sheets"**
2. Inserisci l'ID del foglio Google Sheets
3. I dati si caricano automaticamente

## 📁 Struttura File

- `index.html` - Hub Capitani (gestione squadra personale)
- `homepage.html` - Home page con regole e informazioni
- `classifica.html` - **Classifica finale** (pagina principale)
- `script.js` - Logica applicazione Hub Capitani
- `styles.css` - Stili CSS condivisi
- `test-google-sheets.html` - Pagina test connessione Google Sheets
- `template_classifica.csv` - Template per importare dati in Google Sheets

## 🎨 Design

- **Font**: Cinzel (titoli), JetBrains Mono (UI)
- **Colori**: Palette oro/bronzo olimpico (#daa520, #ffd700, #b8860b)
- **Tema**: Ispirato ai vasi greci antichi
- **Responsive**: Mobile-first design

## 🏛️ I 14 Templi

- Caligo
- Casa Gotuzzo
- Cereria
- Circolo Sport
- Excalibur
- Le Fontane
- Loomi
- Mary Jo
- Storico
- Teleria 108
- Tirebouchon
- Vinoria
- Vinoteca
- Vitae

## 📊 Google Sheets Setup

Il foglio Google Sheets deve avere questa struttura:

```
SQUADRA | CALIGO | CASA GOTUZZO | CERERIA | ... | VITAE | BONUS
```

Rendi il foglio pubblico: File → Condividi → "Chiunque con il link può visualizzare"

## 🛠️ Sviluppo Locale

Per eseguire localmente con un server:

```bash
# Python
python3 -m http.server 8000

# Oppure
npx serve .
```

Poi apri: `http://localhost:8000/classifica.html`

## 📜 Licenza

Progetto creato per le Olimpiadi Goliardiche 2025.

---

🏺 **Che gli dèi dell'Olimpo benedicano la tua squadra!** 🔥
