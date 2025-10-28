# Integrazione Cloudinary - Paolino E-commerce

## 📋 Riepilogo Modifiche

Integrazione completa di Cloudinary per la gestione delle immagini dei prodotti, sostituendo completamente il sistema di storage locale basato su Multer + filesystem.

---

## ✅ Modifiche Implementate

### 1. **Dipendenze Installate**
```bash
npm install cloudinary multer-storage-cloudinary
```

**Pacchetti aggiunti:**
- `cloudinary` - SDK ufficiale Cloudinary
- `multer-storage-cloudinary` - Storage engine per Multer con Cloudinary

---

### 2. **Nuovo Servizio Cloudinary**
**File:** `/backend/services/cloudinary.js`

**Funzioni disponibili:**
- `uploadImage(filePath, options)` - Upload singola immagine con trasformazioni
- `deleteImage(imageUrl)` - Elimina singola immagine da Cloudinary
- `deleteMultipleImages(imageUrls)` - Elimina array di immagini
- `getImageDetails(publicId)` - Ottiene dettagli immagine
- `getTransformedUrl(publicId, transformations)` - Genera URL trasformato
- `extractPublicId(imageUrl)` - Estrae public_id da URL Cloudinary

**Trasformazioni applicate automaticamente:**
- Ridimensionamento max: 1200x1200px (mantiene proporzioni)
- Qualità: `auto:good` (ottimizzazione automatica)
- Formato: `auto` (WebP per browser moderni)

---

### 3. **Middleware Upload Aggiornato**
**File:** `/backend/middlewares/upload.js`

**Modifiche:**
- ❌ Rimosso: `multer.diskStorage` con filesystem locale
- ✅ Aggiunto: `CloudinaryStorage` con configurazione cloud
- ✅ Folder Cloudinary: `paolino/products/`
- ✅ Formati supportati: JPG, PNG, JPEG, WebP
- ✅ Limite dimensione: 5MB per file

---

### 4. **Routes Prodotti Aggiornate**
**File:** `/backend/routes/products.js`

#### **POST /api/products** (Creazione prodotto)
- Upload fino a 5 immagini su Cloudinary
- Salvataggio automatico di `url` e `publicId` per ogni immagine
- Rollback automatico: elimina immagini da Cloudinary se creazione prodotto fallisce

#### **PUT /api/products/:id** (Aggiornamento prodotto)
- Aggiunge nuove immagini senza eliminare le esistenti
- Rollback automatico in caso di errore

#### **DELETE /api/products/:id** (Eliminazione prodotto)
- Elimina tutte le immagini del prodotto da Cloudinary
- Disattiva il prodotto (soft delete) invece di eliminarlo definitivamente
- Log del numero di immagini eliminate

#### **DELETE /api/products/:id/images/:imageId** ⭐ NUOVA ROUTE
- Elimina singola immagine da un prodotto
- Rimuove da Cloudinary e dal database
- Se immagine eliminata era `isPrimary`, imposta la prima come primary

---

### 5. **Modello Product Aggiornato**
**File:** `/backend/models/Product.js`

**Schema immagini aggiornato:**
```javascript
images: [{
  url: {
    type: String,
    required: true  // URL completo Cloudinary
  },
  publicId: {
    type: String,
    required: true  // Cloudinary public_id per eliminazione
  },
  alt: String,
  isPrimary: {
    type: Boolean,
    default: false
  }
}]
```

---

### 6. **Variabili Ambiente Configurate**
**File:** `/backend/.env`

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dlejf1f6l
CLOUDINARY_API_KEY=988781733633493
CLOUDINARY_API_SECRET=l7AB8ONP_v1RzTLl-EL_hO-20Wk
```

---

### 7. **Server Pulito**
**File:** `/backend/serverPaolino.js`

- ❌ Rimosso: `app.use('/uploads', express.static(...))`
- ❌ Rimosso: import inutilizzato di `path`
- ✅ Aggiunto: commento esplicativo sulla migrazione a Cloudinary

---

## 🚀 Come Usare il Sistema

### **Upload Immagini**
```javascript
// Frontend: FormData con campo 'images'
const formData = new FormData();
formData.append('name', 'Nome Prodotto');
formData.append('images', file1);
formData.append('images', file2);

const response = await fetch('/api/products', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### **Eliminare Singola Immagine**
```javascript
// DELETE /api/products/:productId/images/:imageId
const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🧪 Test dell'Integrazione

### **1. Test Upload Immagine**
```bash
# Avvia il backend
cd /home/paolo/polpo/Paolino-main/backend
npm run dev

# In un altro terminale, testa con curl:
curl -X POST http://localhost:5031/api/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Test Product" \
  -F "description=Test Description" \
  -F "category=magliette" \
  -F "basePrice=19.99" \
  -F "variants=[{\"size\":\"M\",\"color\":\"Bianco\",\"stock\":10,\"sku\":\"TEST-001\"}]" \
  -F "images=@/path/to/image.jpg"
```

### **2. Verifica su Cloudinary Dashboard**
1. Vai su [cloudinary.com/console](https://cloudinary.com/console)
2. Login con account: `dlejf1f6l`
3. Naviga in **Media Library > paolino/products**
4. Verifica presenza immagini uploadate

### **3. Test Eliminazione Immagine**
```bash
curl -X DELETE http://localhost:5031/api/products/PRODUCT_ID/images/IMAGE_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📊 Struttura Cloudinary

```
cloudinary://
└── paolino/
    └── products/
        ├── maglietta-bianca-1234567890.jpg
        ├── felpa-grigia-9876543210.png
        └── ...
```

**Naming convention:** `nome-file-timestamp.ext`

---

## 🔧 Configurazione Cloudinary

### **Trasformazioni Automatiche**
Tutte le immagini vengono automaticamente:
- Ridimensionate a max 1200x1200px (mantiene aspect ratio)
- Ottimizzate con qualità `auto:good`
- Convertite in formato ottimale (WebP per browser moderni)

### **Modificare le Trasformazioni**
Modifica il file `/backend/middlewares/upload.js`:

```javascript
transformation: [
  { width: 1200, height: 1200, crop: 'limit' },
  { quality: 'auto:good' },
  { fetch_format: 'auto' }
]
```

---

## 🛠️ Troubleshooting

### **Errore: "Failed to upload image to Cloudinary"**
1. Verifica credenziali in `.env`
2. Controlla connessione internet
3. Verifica quota Cloudinary (Free tier: 25GB storage, 25GB bandwidth/mese)

### **Errore: "Could not extract public_id from image URL"**
- L'URL deve essere formato Cloudinary valido
- Oppure passa direttamente il `publicId` invece dell'URL

### **Immagini non visualizzate nel frontend**
- Verifica CORS su Cloudinary (default: permette tutti i domini)
- Controlla URL completo salvato nel database
- Testa URL in browser: deve essere accessibile pubblicamente

---

## 📈 Vantaggi dell'Integrazione

✅ **CDN Globale** - Immagini servite da CDN velocissimo
✅ **Trasformazioni On-the-fly** - Ridimensionamento dinamico via URL
✅ **Ottimizzazione Automatica** - Qualità e formato ottimali
✅ **Backup Cloud** - Nessun rischio perdita dati da crash server
✅ **Scalabilità** - Gestione automatica del carico
✅ **Nessun Storage Locale** - Server più leggero e pulito

---

## 🔄 Migrazione Dati Esistenti (Opzionale)

Se hai già prodotti con immagini locali da migrare:

```javascript
// Script di migrazione (da creare)
const Product = require('./models/Product');
const { uploadImage } = require('./services/cloudinary');
const fs = require('fs');
const path = require('path');

async function migrateImages() {
  const products = await Product.find({ 'images.url': /^\/uploads/ });

  for (const product of products) {
    for (const image of product.images) {
      const localPath = path.join(__dirname, image.url);

      if (fs.existsSync(localPath)) {
        const result = await uploadImage(localPath);
        image.url = result.url;
        image.publicId = result.publicId;
      }
    }

    await product.save();
    console.log(`Migrated product: ${product.name}`);
  }
}
```

---

## 📝 Note Importanti

1. **Backup**: Le immagini in `/backend/uploads/` possono essere eliminate dopo migrazione
2. **Quota Free Tier Cloudinary**:
   - Storage: 25 GB
   - Bandwidth: 25 GB/mese
   - Trasformazioni: 25,000/mese
3. **Monitoraggio**: Controlla usage su [dashboard Cloudinary](https://cloudinary.com/console)

---

## 🎯 TODO Futuri (Opzionali)

- [ ] Implementare thumbnail automatici (300x300px) per liste prodotti
- [ ] Aggiungere watermark automatico alle immagini
- [ ] Implementare lazy loading immagini nel frontend
- [ ] Creare route per bulk operations (upload multipli)
- [ ] Implementare sistema di cache CDN personalizzato

---

**Data Integrazione:** 28 Ottobre 2025
**Stato:** ✅ Completata e testata
**Versione Backend:** 1.0.0
