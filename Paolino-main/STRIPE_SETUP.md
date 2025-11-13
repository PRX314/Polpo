# 💳 STRIPE INTEGRATION SETUP - Paolino E-commerce

## 📋 Overview

Paolino usa Stripe per gestire i pagamenti. Questa guida spiega come configurare Stripe da zero.

---

## 🚀 Quick Start

### 1. Crea un Account Stripe

1. Vai su https://stripe.com
2. Clicca "Start now" o "Sign up"
3. Completa la registrazione con:
   - Email
   - Password
   - Nome business: "Paolino E-commerce"
   - Paese: Italia

### 2. Ottieni le API Keys (Test Mode)

1. Accedi alla [Stripe Dashboard](https://dashboard.stripe.com)
2. Assicurati di essere in **Test Mode** (toggle in alto a destra)
3. Vai su **Developers → API keys**
4. Copia le chiavi:
   - **Publishable key** (inizia con `pk_test_...`)
   - **Secret key** (clicca "Reveal test key", inizia con `sk_test_...`)

### 3. Configura Backend

Aggiorna `/backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_51ABC123...  # La tua secret key
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123...  # La tua publishable key
STRIPE_WEBHOOK_SECRET=whsec_...  # Configurato dopo (vedi sotto)
```

### 4. Configura Frontend

Aggiorna `/frontend/.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123...  # Stessa publishable key del backend
```

### 5. Testa la Configurazione

```bash
# Terminal 1 - Backend
cd Paolino-main/backend
npm run dev

# Terminal 2 - Frontend
cd Paolino-main/frontend
npm run dev

# Apri browser su http://localhost:5173
# Prova a creare un ordine (verrà creato un Payment Intent)
```

---

## 🔧 Configurazione Webhook (Necessario per Produzione)

### Perché servono i webhook?

I webhook permettono a Stripe di notificare il backend quando:
- Un pagamento ha successo → Aggiorna ordine a "paid"
- Un pagamento fallisce → Aggiorna ordine a "failed"
- Un rimborso viene processato → Aggiorna ordine a "refunded"

### Setup in Development (con Stripe CLI)

#### 1. Installa Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux (WSL):**
```bash
# Download binary
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Windows:**
Scarica da: https://github.com/stripe/stripe-cli/releases

#### 2. Login con Stripe CLI

```bash
stripe login
# Si aprirà il browser, autorizza l'accesso
```

#### 3. Forward webhook events al backend locale

```bash
stripe listen --forward-to localhost:5031/api/orders/webhook
```

Output:
```
> Ready! Your webhook signing secret is whsec_abc123... (^C to quit)
```

#### 4. Copia il webhook secret

Aggiorna `/backend/.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_abc123...  # Il secret fornito dal comando sopra
```

#### 5. Testa i webhook

In un altro terminal:
```bash
stripe trigger payment_intent.succeeded
```

Controlla i log del backend - dovresti vedere l'evento processato.

### Setup in Production

#### 1. Configura webhook endpoint su Stripe Dashboard

1. Vai su **Developers → Webhooks**
2. Clicca "Add endpoint"
3. Endpoint URL: `https://api.tuodominio.com/api/orders/webhook`
4. Events to send:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Clicca "Add endpoint"

#### 2. Copia il Signing Secret

- Nella pagina del webhook, clicca "Reveal" sotto "Signing secret"
- Copia `whsec_...`
- Aggiungi alle variabili d'ambiente di produzione

---

## 💰 Flow Pagamento Completo

### 1. Utente Crea Ordine
```javascript
POST /api/orders/create
Body: { shippingAddress, billingAddress }
→ Crea ordine con status "pending"
→ Riduce stock prodotti
→ Svuota carrello
```

### 2. Frontend Richiede Payment Intent
```javascript
POST /api/orders/payment-intent
Body: { orderId }
→ Crea Stripe Payment Intent
→ Salva paymentIntentId nell'ordine
→ Ritorna clientSecret
```

### 3. Frontend Mostra Stripe Elements
```jsx
// CheckoutPage.jsx
import { Elements, PaymentElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

<Elements stripe={stripe} options={{ clientSecret }}>
  <PaymentElement />
  <button>Pay Now</button>
</Elements>
```

### 4. Utente Completa Pagamento
```javascript
// Stripe processa il pagamento
→ Se successo: invia webhook payment_intent.succeeded
→ Se fallito: invia webhook payment_intent.payment_failed
```

### 5. Backend Riceve Webhook
```javascript
POST /api/orders/webhook
→ Verifica signature con STRIPE_WEBHOOK_SECRET
→ Aggiorna ordine:
   - payment_intent.succeeded → status: "paid", paymentStatus: "paid"
   - payment_intent.payment_failed → paymentStatus: "failed"
```

---

## 🧪 Testing con Carte di Test

In **Test Mode**, usa queste carte:

### Successo
```
Numero: 4242 4242 4242 4242
Expiry: Qualsiasi data futura (es. 12/34)
CVC: Qualsiasi 3 cifre (es. 123)
ZIP: Qualsiasi (es. 12345)
```

### 3D Secure (Richiede autenticazione)
```
Numero: 4000 0025 0000 3155
→ Mostra popup di autenticazione
→ Clicca "Complete" per successo
```

### Fallimento (Carta insufficiente)
```
Numero: 4000 0000 0000 9995
→ Pagamento fallisce con errore "insufficient_funds"
```

### Rimborso non supportato
```
Numero: 4000 0000 0000 5126
→ Pagamento ok, ma rimborso fallisce
```

Lista completa: https://stripe.com/docs/testing

---

## 🔐 Sicurezza Best Practices

### ✅ DO
- Usa **Test keys** in development (`sk_test_`, `pk_test_`)
- Usa **Live keys** solo in production (`sk_live_`, `pk_live_`)
- Valida webhook signature con `STRIPE_WEBHOOK_SECRET`
- Gestisci errori gracefully
- Logga eventi webhook per audit

### ❌ DON'T
- MAI committare secret keys nel repository
- MAI usare live keys in development
- MAI fidarsi dei dati dal frontend (sempre validare backend)
- MAI salvare numeri di carta (Stripe li gestisce)

---

## 📊 Monitoraggio e Debug

### Stripe Dashboard (Test Mode)

1. **Payments** → Visualizza tutti i pagamenti test
2. **Logs** → Eventi API in tempo reale
3. **Webhooks** → Status delivery webhook
4. **Events** → Storico completo eventi

### Backend Logs

```bash
# Avvia backend in modalità verbose
cd backend
DEBUG=stripe:* npm run dev

# Log degli eventi webhook
tail -f logs/stripe-webhooks.log  # Se configurato
```

### Test Webhook Manualmente

```bash
# Con Stripe CLI
stripe trigger payment_intent.succeeded

# Output nel backend:
# ✅ Webhook ricevuto: payment_intent.succeeded
# ✅ Ordine ORD-123 aggiornato a "paid"
```

---

## 🚨 Troubleshooting

### Errore: "No such payment_intent"
**Problema:** Payment intent ID non valido
**Soluzione:** Verifica che `orderId` passato a `/payment-intent` sia corretto

### Errore: "Invalid API Key"
**Problema:** Secret key non configurata o errata
**Soluzione:** Verifica `STRIPE_SECRET_KEY` in `.env`

### Webhook non ricevuti
**Problema:** Signing secret errato o endpoint non raggiungibile
**Soluzione:**
```bash
# Test con Stripe CLI
stripe listen --forward-to localhost:5031/api/orders/webhook
stripe trigger payment_intent.succeeded
```

### Errore: "This customer cannot be charged"
**Problema:** Carta di test non supportata o scaduta
**Soluzione:** Usa `4242 4242 4242 4242` con data futura

---

## 🎯 Checklist Pre-Production

- [ ] Live API keys configurate (non committate!)
- [ ] Webhook endpoint pubblico configurato
- [ ] Webhook secret aggiornato (production)
- [ ] SSL/TLS attivo (HTTPS obbligatorio)
- [ ] Error handling testato
- [ ] Rimborsi testati manualmente
- [ ] Logs e monitoring attivi
- [ ] Business info completata su Stripe Dashboard
- [ ] Account verificato e attivato

---

## 📚 Risorse Utili

- **Stripe Docs:** https://stripe.com/docs
- **Payment Intents Guide:** https://stripe.com/docs/payments/payment-intents
- **Webhook Guide:** https://stripe.com/docs/webhooks
- **Testing Guide:** https://stripe.com/docs/testing
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Support:** https://support.stripe.com/

---

**Ultimo aggiornamento:** 2025-11-04
**Versione Stripe API:** 2024-11-20.acacia
