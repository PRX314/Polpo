# Sistema di Theming Dinamico - Paolino E-commerce

## 📚 Overview

Sistema di theming dinamico che permette di cambiare completamente lo stile visivo dell'applicazione in base alla collezione selezionata. Ogni collezione ha un proprio tema con colori, font, animazioni e mood unici.

## 🎨 Collezioni Disponibili

### 1. **Fijo de'n Amore** (`fijo-de-n-amore`)
- **Mood**: Romantico, elegante, minimalist
- **Colori**: Rosso (#E63946), Rosa (#FF6B9D), Cream (#F1FAEE)
- **Font**: Playfair Display (heading), Inter (body), Dancing Script (accent)
- **Forme**: Circolari, morbide
- **Target**: Anime romantiche, coppie, cercatori di regali

### 2. **G.Power** (`g-power`)
- **Mood**: Urbano, potente, energetico
- **Colori**: Hot Pink (#FF006E), Giallo (#FFBE0B), Arancione (#FB5607)
- **Font**: Bebas Neue (heading), Roboto (body), Montserrat (accent)
- **Forme**: Angolari, sharp
- **Target**: Giovani urbani, appassionati di gym, streetwear lovers

## 🏗️ Architettura

### File Struttura

```
frontend/
├── src/
│   ├── themes/
│   │   ├── fijoTheme.js          # Definizione tema Fijo
│   │   └── gpowerTheme.js        # Definizione tema G.Power
│   ├── contexts/
│   │   └── ThemeContext.jsx      # Context provider + logica
│   ├── components/
│   │   ├── CollectionBanner.jsx  # Banner animato
│   │   ├── CollectionBanner.css
│   │   └── products/
│   │       ├── ThemedProductCard.jsx  # Card tematizzata
│   │       └── ThemedProductCard.css
│   └── pages/
│       └── ProductShowcasePage.jsx    # Pagina con theming
```

## 🔧 Come Funziona

### 1. Theme Definitions (`themes/*.js`)

Ogni tema è un oggetto JavaScript con:

```javascript
export const fijoTheme = {
  name: 'Fijo de\'n Amore',
  slug: 'fijo-de-n-amore',

  colors: {
    primary: '#E63946',
    secondary: '#F1FAEE',
    text: { primary, secondary, light },
    background: { main, secondary, card },
    // ...
  },

  fonts: {
    heading: '"Playfair Display", serif',
    body: '"Inter", sans-serif',
    accent: '"Dancing Script", cursive',
  },

  spacing: { xs, sm, md, lg, xl, xxl },
  borderRadius: { sm, md, lg, full },
  shadows: { sm, md, lg, hover },
  gradients: { primary, secondary, hero },

  banner: {
    keywords: ['Amore', 'Passione', 'Cuore'],
    animation: 'fade-slide-up',
    duration: 2000,
  },

  // ... altri attributi
};
```

### 2. ThemeProvider Context (`ThemeContext.jsx`)

Il provider gestisce:

- **State Management**: Current theme attivo
- **CSS Variables**: Applica CSS custom properties al DOM
- **Theme Switching**: Cambia tema con banner animato
- **LocalStorage**: Persiste scelta utente

**API Exposed**:

```javascript
const {
  currentDetailedTheme,        // Tema corrente
  changeDetailedTheme,         // Cambia tema (slug)
  availableDetailedThemes,     // Lista temi disponibili
  showBanner,                  // Banner visibile?
  bannerData,                  // Dati del banner
} = useTheme();
```

### 3. CSS Variables System

Il ThemeContext inietta CSS custom properties nel DOM:

```css
:root {
  --color-primary: #E63946;
  --color-secondary: #F1FAEE;
  --font-heading: "Playfair Display", serif;
  --spacing-md: 1.5rem;
  --radius-md: 16px;
  --shadow-hover: 0 12px 40px rgba(230, 57, 70, 0.25);
  --gradient-primary: linear-gradient(135deg, #E63946, #FF6B9D);
  /* ... */
}
```

I componenti usano queste variabili:

```css
.themed-product-card {
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-body);
}

.themed-product-card:hover {
  box-shadow: var(--shadow-hover);
}
```

### 4. CollectionBanner Component

Banner fullscreen animato che appare quando si cambia collezione.

**Features**:
- Animazioni diverse per ogni tema (fade-slide-up, explosive-zoom)
- Mostra keyword casuale dal tema
- Auto-dismissal dopo durata specificata
- Accessibility-friendly (prefers-reduced-motion)

**Uso**:

```jsx
import CollectionBanner from '../components/CollectionBanner';

// Basta includerlo nell'app
<CollectionBanner />
```

Il banner si attiva automaticamente quando si chiama `changeDetailedTheme()`.

### 5. ThemedProductCard Component

Card prodotto che usa CSS variables per styling dinamico.

**Uso**:

```jsx
import ThemedProductCard from '../components/products/ThemedProductCard';

<ThemedProductCard product={product} viewMode="grid" />
```

Supporta due modalità:
- `grid`: Layout griglia (default)
- `list`: Layout lista

## 🚀 Aggiungere una Nuova Collezione

### Step 1: Crea Theme Definition

```javascript
// frontend/src/themes/myNewTheme.js
export const myNewTheme = {
  name: 'My Collection',
  slug: 'my-collection',

  colors: {
    primary: '#YOUR_COLOR',
    // ...
  },

  fonts: {
    heading: '"Your Font", sans-serif',
    // ...
  },

  banner: {
    keywords: ['WORD1', 'WORD2', 'WORD3'],
    animation: 'fade-slide-up', // or 'explosive-zoom'
    duration: 2000,
  },

  // ... copia struttura da fijoTheme.js
};

export default myNewTheme;
```

### Step 2: Registra nel ThemeContext

```javascript
// frontend/src/contexts/ThemeContext.jsx
import myNewTheme from '../themes/myNewTheme';

const themeRegistry = {
  'fijo-de-n-amore': fijoTheme,
  'g-power': gpowerTheme,
  'my-collection': myNewTheme,  // ← Aggiungi qui
};
```

### Step 3: Aggiungi alla Selector

```javascript
// frontend/src/pages/ProductShowcasePage.jsx
const collections = [
  { id: 'fijo-de-n-amore', slug: 'fijo-de-n-amore', name: "Fijo de'n Amore", ... },
  { id: 'g-power', slug: 'g-power', name: "G.Power", ... },
  { id: 'my-collection', slug: 'my-collection', name: "My Collection", ... }, // ← Aggiungi qui
];
```

**Fatto!** Il tema sarà automaticamente disponibile e funzionante.

## 🎭 Animazioni Banner

### Fade Slide Up (Romantico)

```css
@keyframes fadeSlideUp {
  0% { opacity: 0; transform: translateY(30px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-30px); }
}
```

### Explosive Zoom (Energetico)

```css
@keyframes explosiveZoom {
  0% { opacity: 0; transform: scale(0.5) rotate(-5deg); }
  30% { opacity: 1; transform: scale(1.05) rotate(2deg); }
  50% { transform: scale(0.98) rotate(-1deg); }
  100% { opacity: 0; transform: scale(1.2) rotate(5deg); }
}
```

Aggiungi nuove animazioni in `CollectionBanner.css`.

## 📱 Responsive Design

Il sistema è **mobile-first** per design:

- Tutti i font usano `clamp()` per scaling fluido
- Layout adattivi con breakpoints standard
- Touch-optimized (hover effects solo su desktop)
- Animazioni rispettano `prefers-reduced-motion`

## ⚡ Performance

- **CSS Variables**: Cambiamenti istantanei senza re-render
- **LocalStorage**: Persiste scelta utente (evita flash)
- **Lazy Loading**: Temi caricati on-demand
- **Minimal Rerenders**: Solo componenti che usano `useTheme()` vengono aggiornati

## 🔮 Future Enhancements

### Possibili Miglioramenti

1. **Database Integration**
   - Salvare temi in MongoDB
   - API endpoint per caricare temi dinamicamente
   - Admin panel per creare/editare temi

2. **Theme Builder UI**
   - Interface visuale per creare temi
   - Live preview
   - Color picker, font selector

3. **Advanced Animations**
   - Transizioni tra pagine
   - Parallax effects
   - Micro-interactions

4. **Dark Mode per Collezione**
   - Varianti dark/light per ogni tema
   - Auto-switch basato su orario/sistema

5. **A/B Testing**
   - Tracciamento conversioni per tema
   - Analytics per preferenze utenti

## 🐛 Troubleshooting

### Problema: I CSS variables non si applicano

**Soluzione**: Verifica che il ThemeProvider sia wrappato intorno all'app in `App.jsx`:

```jsx
<ThemeProvider>
  <YourComponents />
</ThemeProvider>
```

### Problema: Il banner non appare

**Soluzione**: Controlla che `CollectionBanner` sia incluso nella pagina:

```jsx
<CollectionBanner />
```

### Problema: Font non caricano

**Soluzione**: Aggiungi font in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;600;700&family=Dancing+Script:wght@400;700&display=swap" rel="stylesheet">
```

### Problema: Tema non persiste dopo refresh

**Soluzione**: Verifica localStorage nel browser:

```javascript
localStorage.getItem('detailed-theme-slug') // Should return slug
```

## 📖 Risorse

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [React Context API](https://react.dev/reference/react/useContext)
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)

## 👨‍💻 Autore

Implementato da Claude Code per Paolino E-commerce
Data: 2025-11-04

---

**Status**: ✅ Sistema completo e funzionante
**Collezioni**: 2 (Fijo de'n Amore, G.Power)
**Componenti**: 5 (ThemeContext, CollectionBanner, ThemedProductCard + 2 themes)
