# 🔒 SECURITY GUIDE - Paolino E-commerce

## ⚠️ CRITICAL SECURITY WARNINGS

### 🚨 Chiavi Cloudinary Esposte

**PROBLEMA:** Le chiavi Cloudinary nel file `.env` potrebbero essere state committate nel repository.

**STATO ATTUALE:**
```bash
CLOUDINARY_CLOUD_NAME=dlejf1f6l
CLOUDINARY_API_KEY=988781733633493
CLOUDINARY_API_SECRET=l7AB8ONP_v1RzTLl-EL_hO-20Wk  # ⚠️ SECRET ESPOSTO
```

**AZIONI RICHIESTE IMMEDIATAMENTE:**

#### 1. Verifica se le chiavi sono state committate
```bash
# Controlla la history di git
cd /home/paolo/polpo/Paolino-main
git log --all --full-history -- backend/.env
git log --all --full-history -- "*/.env"

# Se trovi commit con .env, le chiavi sono compromesse
```

#### 2. Se le chiavi sono state committate o il repository è pubblico
```bash
# LE CHIAVI SONO COMPROMESSE - ROTAZIONE OBBLIGATORIA
```

**PROCEDURA DI ROTAZIONE CHIAVI CLOUDINARY:**

1. **Accedi a Cloudinary Dashboard:**
   - Vai su https://cloudinary.com/console
   - Login con le tue credenziali

2. **Genera nuove chiavi API:**
   - Settings → Security → API Keys
   - Clicca "Generate New API Key"
   - Copia `API Key` e `API Secret`

3. **Aggiorna .env backend:**
   ```bash
   CLOUDINARY_CLOUD_NAME=dlejf1f6l  # Questo può rimanere uguale
   CLOUDINARY_API_KEY=<NUOVO_API_KEY>
   CLOUDINARY_API_SECRET=<NUOVO_API_SECRET>
   ```

4. **Revoca le vecchie chiavi:**
   - Nel Cloudinary Dashboard, elimina la vecchia API key
   - Questo invalida immediatamente le chiavi compromesse

5. **Testa la nuova configurazione:**
   ```bash
   cd backend
   npm run dev
   # Prova a caricare un'immagine dal pannello admin
   ```

#### 3. Se le chiavi NON sono mai state committate
```bash
# Sei al sicuro! Continua a proteggere .env con .gitignore
# Il nuovo .gitignore già protegge il file .env
```

---

## ✅ Security Fixes Implementate

### 1. JWT Secrets Rinforzati ✅
- **Prima:** `ixoiwgufxailurxgailuxrgsdmjvhawgkyfeg` (debole, 37 char)
- **Dopo:** Chiavi crittograficamente sicure (128 char, 512 bit)
- **Generazione:** `crypto.randomBytes(64).toString('hex')`

### 2. .gitignore Configurati ✅
- **Backend:** Nuovo `.gitignore` con protezione `.env`
- **Frontend:** Aggiornato `.gitignore` con protezione `.env`
- **Pattern protetti:**
  ```
  .env
  .env.local
  .env.production
  .env.*.local
  ```

### 3. .env.example Templates ✅
- Creati template per backend e frontend
- Contengono placeholder sicuri
- Documentazione inline per ogni variabile

### 4. CORS Port Fix ✅
- **Prima:** Port mismatch (5174 vs 5173)
- **Dopo:** Allineato a 5173 ovunque
- **Frontend URL:** `http://localhost:5173`

---

## 🔐 Checklist Sicurezza Pre-Deployment

### Backend
- [ ] `.env` NON committato nel repository
- [ ] Chiavi Cloudinary rotated se compromesse
- [ ] Stripe keys configurate (test mode per staging)
- [ ] JWT secrets crittograficamente sicuri ✅
- [ ] MongoDB URI usa credenziali sicure (non localhost)
- [ ] CORS origins limitati a domini conosciuti
- [ ] Rate limiting attivo (100 req/15min) ✅
- [ ] Helmet security headers attivi ✅

### Frontend
- [ ] `.env` NON committato nel repository
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` configurata
- [ ] API URL punta al backend corretto
- [ ] Build produzione eseguita (`npm run build`)

### Database
- [ ] MongoDB authentication abilitata
- [ ] User admin creato con password forte
- [ ] Network access limitato (non 0.0.0.0/0)
- [ ] Backup automatici configurati

### Stripe
- [ ] Webhook endpoint configurato
- [ ] Webhook secret salvato in `.env`
- [ ] Test mode verificato funzionante
- [ ] Live mode keys solo in produzione

---

## 🛡️ Best Practices Sicurezza

### Gestione Secrets
1. **MAI committare `.env`** - Usa `.env.example` per template
2. **Usa variabili d'ambiente** in produzione (non file .env)
3. **Rotazione periodica** delle chiavi (ogni 90 giorni)
4. **Accesso limitato** - Solo sviluppatori autorizzati

### Autenticazione
1. **JWT con expiry** - Token validi 7 giorni (configurabile)
2. **Bcrypt salt rounds** - 10 rounds (buon bilanciamento sicurezza/performance)
3. **Password policy** - Minimo 6 caratteri (considerare aumento a 8+)
4. **Account deactivation** - `isActive` flag per disabilitare utenti

### API Security
1. **Rate limiting** - 100 req/15min per IP in produzione
2. **CORS whitelist** - Solo domini autorizzati
3. **Input validation** - Joi schemas su tutti gli endpoint
4. **Admin-only routes** - Middleware `adminAuth` su endpoints sensibili

### File Upload
1. **File type validation** - Solo JPEG, PNG, WebP
2. **File size limit** - 5MB massimo
3. **Cloudinary transformation** - Auto-resize e optimize
4. **Public ID sanitization** - Rimozione caratteri speciali

---

## 🚨 Incident Response Plan

### Se le chiavi vengono esposte:

1. **IMMEDIATE:**
   - Rotare TUTTE le chiavi compromesse
   - Invalidare i vecchi token JWT (se possibile)
   - Bloccare l'accesso sospetto

2. **ENTRO 1 ORA:**
   - Audit completo dei log
   - Identificare accessi non autorizzati
   - Notificare il team

3. **ENTRO 24 ORE:**
   - Review completa del codice
   - Implementare fix permanenti
   - Documentare l'incidente

---

## 📞 Contatti Sicurezza

**Cloudinary Support:** https://support.cloudinary.com/
**Stripe Support:** https://support.stripe.com/
**MongoDB Support:** https://www.mongodb.com/support

---

**Ultimo aggiornamento:** 2025-11-04
**Prossimo security audit:** Entro 30 giorni
