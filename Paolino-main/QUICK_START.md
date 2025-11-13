# 🚀 QUICK START - Paolino E-commerce

## ⚠️ IMPORTANTE: Avviare Backend Prima!

### Step 1: Avvia MongoDB
```bash
# Assicurati che MongoDB sia running
# Su Linux/WSL:
sudo service mongodb start

# Oppure se hai MongoDB Compass, avvialo
```

### Step 2: Avvia Backend (OBBLIGATORIO)
```bash
# Terminal 1 - Backend
cd Paolino-main/backend
npm install          # Solo la prima volta
npm run dev          # Server su porta 5031
```

**Dovresti vedere**:
```
Server running on port 5031
MongoDB connected successfully
```

### Step 3: Avvia Frontend
```bash
# Terminal 2 - Frontend (in un nuovo terminale)
cd Paolino-main/frontend
npm install          # Solo la prima volta
npm run dev          # App su porta 5173
```

### Step 4: Apri Browser
```
http://localhost:5173
```

---

## 🐛 TROUBLESHOOTING

### Errore: "ERR_CONNECTION_REFUSED"
**Problema**: Backend non in esecuzione
**Soluzione**:
1. Vai in `Paolino-main/backend`
2. Esegui `npm run dev`
3. Aspetta che vedi "Server running on port 5031"
4. Ricarica la pagina frontend

### Errore: "Cannot read properties of null"
**Problema**: Componenti React cercano dati prima del caricamento
**Soluzione**: Già fixato nel codice con null safety checks

### Errore: "MongoDB connection failed"
**Problema**: MongoDB non in esecuzione
**Soluzione**:
```bash
sudo service mongodb start
# Oppure
mongod --dbpath /path/to/data
```

### Nessun prodotto visualizzato
**Problema**: Database vuoto
**Soluzione**:
```bash
cd Paolino-main/backend
npm run setup    # Crea admin e 6 prodotti di esempio
```

---

## 📝 CREDENZIALI ADMIN

```
Email: admin@paolino.com
Password: admin123
```

Vai su `/admin` per accedere al pannello amministratore.

---

## 🎯 NUOVA HOME PAGE

La home page è stata completamente ridisegnata con approccio **product-first**:

- **Route `/`** → ProductShowcase (landing con maglietta in evidenza)
- **Route `/home`** → Home classica (nascosta, link discreto)
- **Route `/products`** → Catalogo completo
- **Route `/admin`** → Pannello admin

---

## ✅ CHECKLIST SVILUPPO

Prima di iniziare a lavorare, assicurati:
- [ ] MongoDB running
- [ ] Backend running (porta 5031)
- [ ] Frontend running (porta 5173)
- [ ] Browser aperto su localhost:5173
- [ ] Nessun errore in console

---

## 🔥 COMANDI UTILI

```bash
# Vedere log backend in tempo reale
cd Paolino-main/backend
npm run dev

# Controllare porta 5031
lsof -i :5031

# Killare processo su porta (se necessario)
kill -9 $(lsof -t -i:5031)

# Reset database (attenzione!)
mongo paolino_ecommerce --eval "db.dropDatabase()"
npm run setup
```

---

**Ricorda**: Backend SEMPRE attivo quando sviluppi frontend! 🚀
