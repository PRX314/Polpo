# 📝 Guida alla Configurazione - Laboratorio X

## Come Modificare Contenuti Senza Toccare il Codice

Il file `config.json` contiene tutti i dati variabili del progetto. Modificando questo file puoi cambiare:
- Prezzi e budget
- Obiettivi e timeline  
- Testi e descrizioni
- Link ai prodotti
- Stazioni radio

## 🔧 Come Modificare il config.json

### 1. Aprire il File
```bash
nano config.json
```
oppure con qualsiasi editor di testo.

### 2. Rispettare la Sintassi JSON
- **Virgolette doppie** per tutti i testi: `"testo"`
- **Virgola** dopo ogni elemento (tranne l'ultimo)
- **Parentesi graffe** `{}` per oggetti
- **Parentesi quadre** `[]` per liste

### 3. Sezioni Modificabili

#### 🏢 **Informazioni Progetto**
```json
"progetto": {
  "titolo": "LABORATORIO X",
  "sottotitolo": "Micro-Lab Creativo - Versione 2",
  "investimento": "500-800€",
  "target": "Online, mercatini, concept store"
}
```

#### 🗓️ **Timeline Obiettivi**
```json
"timeline": [
  {
    "fase": "1. Setup Immediato",
    "descrizione": "Attrezzature, spazio, test serigrafia..."
  }
]
```
**Per aggiungere una fase**: Copia un blocco esistente e modificalo.

#### 💰 **Budget**
```json
"budget": {
  "primeSpese": {
    "voci": [
      {
        "item": "Pressa grande",
        "costo": "200-300€"
      }
    ],
    "subtotale": "470-640€"
  },
  "totaleCompleto": "650-940€"
}
```

#### 🎨 **Tecniche di Stampa**
```json
"tecniche": [
  {
    "nome": "DTF (Direct To Film)",
    "status": "ATTUALE",
    "emoji": "🔥",
    "descrizione": "Film trasparente...",
    "uso": "Tecnica principale..."
  }
]
```

#### 🔗 **Link Prodotti**
```json
"links": {
  "priorita": [
    {
      "nome": "🔥 Pressa Termica",
      "url": "https://www.amazon.it/s?k=pressa+a+caldo"
    }
  ]
}
```

#### 📻 **Stazioni Radio**
```json
"radioStazioni": [
  {
    "nome": "🎵 Lofi Hip Hop",
    "url": "https://stream.zeno.fm/fyn8eh3h5f9uv"
  }
]
```

## ⚠️ Errori Comuni da Evitare

### ❌ **ERRORE: Virgola Mancante**
```json
{
  "item": "Pressa"
  "costo": "200€"  // MANCA LA VIRGOLA!
}
```

### ✅ **CORRETTO:**
```json
{
  "item": "Pressa",
  "costo": "200€"
}
```

### ❌ **ERRORE: Virgolette Singole**
```json
{
  'item': 'Pressa'  // SBAGLIATO!
}
```

### ✅ **CORRETTO:**
```json
{
  "item": "Pressa"
}
```

### ❌ **ERRORE: Virgola Extra**
```json
{
  "item": "Pressa",
  "costo": "200€",  // VIRGOLA DI TROPPO!
}
```

### ✅ **CORRETTO:**
```json
{
  "item": "Pressa",
  "costo": "200€"
}
```

## 🧪 Testare le Modifiche

1. **Salva il file** `config.json`
2. **Apri il browser** e vai su `index.html`
3. **Ricarica la pagina** (F5 o Ctrl+R)
4. **Controlla la console** (F12) per eventuali errori

## 💡 Esempi Pratici

### Cambiare il Budget Totale
```json
"totaleCompleto": "800-1200€"
```

### Aggiungere una Nuova Fase Timeline
```json
"timeline": [
  // ... fasi esistenti ...
  {
    "fase": "5. Espansione Internazionale",
    "descrizione": "Vendite online Europe, nuovi mercati"
  }
]
```

### Modificare i Prezzi
```json
"primeSpese": {
  "voci": [
    {
      "item": "Pressa grande",
      "costo": "300-400€"  // Nuovo prezzo
    }
  ]
}
```

### Aggiungere una Nuova Tecnica
```json
"tecniche": [
  // ... tecniche esistenti ...
  {
    "nome": "Ricamo Digitale",
    "status": "FUTURO",
    "emoji": "🧵",
    "descrizione": "Ricamo automatizzato con macchina digitale",
    "uso": "Logo aziendali, dettagli premium"
  }
]
```

## 🛠️ Strumenti Utili

### Validare JSON Online
Se hai dubbi sulla sintassi:
- Vai su https://jsonlint.com/
- Incolla il tuo JSON
- Clicca "Validate JSON"

### Editor Raccomandati
- **VS Code** (con estensione JSON)
- **Notepad++** 
- **nano** (Linux terminal)

## 🔄 Backup e Ripristino

### Fare Backup
```bash
cp config.json config.json.backup
```

### Ripristinare Backup
```bash
cp config.json.backup config.json
```

---

**✨ Ricorda**: Dopo ogni modifica, ricarica la pagina per vedere i cambiamenti!