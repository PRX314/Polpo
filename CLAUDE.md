# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Table of Contents
- [Repository Overview](#repository-overview)
- [Quick Reference](#quick-reference)
- [X World Project - Deep Dive](#x-world-project---deep-dive)
- [Development Commands](#development-commands)
- [Architecture Overview](#architecture-overview)
- [Important Code Locations](#important-code-locations)
- [Deployment](#deployment)
- [Security Considerations](#security-considerations)
- [Common Troubleshooting](#common-troubleshooting)
- [Additional Resources](#additional-resources)

## Repository Overview

This is Paolo Repetto's portfolio hub repository containing five distinct parts:
1. **Portfolio Showcase** (`/`, `/minigiochi/`, `/progetti/`, `/Sito Magliette/`) - Static HTML/CSS/JS projects and games
2. **Gestionale-X** (`/gestionale-x/`) - React + Firebase project management application deployed at gestionalepolpo.netlify.app
3. **OG-2025** (`/OG-2025/`) - Olimpiadi Goliardiche event management system with Google Sheets integration
4. **OGv2** (`/OGv2/`) - Comprehensive documentation and analysis for Olimpiadi Goliardiche 2025 (documentation only, no code)
5. **Paolino E-commerce** (`/Paolino-main/`) - Full-stack MERN e-commerce platform (currently untracked in git)

**Primary Entry Point**: `/index.html` (main portfolio hub)
**Language**: Italian (all user-facing content)

### Root-Level Dependencies
The root `/package.json` contains Firebase 12.3.0 as a shared dependency, used by static portfolio files that may integrate Firebase features (analytics, hosting, etc.). Individual projects maintain their own `package.json` files with specific dependencies.

### Repository Structure Note
This is a **monorepo** containing multiple independent projects. Each sub-project has its own:
- Package.json and dependencies (Gestionale-X, Paolino frontend/backend)
- Development environment and build process
- Documentation (most have their own CLAUDE.md or README.md)
- Deployment target (Netlify, local server, GitHub Pages)

## Quick Reference

### First-Time Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd polpo

# 2. Install root dependencies (optional, for Firebase features)
npm install

# 3. Choose which project to work on and follow its specific setup
# See "Starting Development" section below for each project
```

### Which Project Should I Work On?

**Decision Tree**:
- **Portfolio/Mini Games**: Work in `/index.html`, `/minigiochi/`, `/progetti/` (static HTML/CSS/JS, no build)
- **X World Web3 Ecosystem**: Work in `/progetti/xworld/` (Web3/NFT platform, static HTML + Solidity)
- **Project Management App**: Work in `/gestionale-x/` (React + Firebase, needs `npm run dev`)
- **Event Management System**: Work in `/OG-2025/` (pure vanilla JS, no build)
- **Event Documentation**: Work in `/OGv2/` (markdown files only, no code)
- **E-commerce Platform**: Work in `/Paolino-main/` (MERN stack, needs MongoDB + backend + frontend)

**Quick Indicators**:
- Need to modify portfolio homepage? → `/index.html`
- Need to work on Web3/NFT/blockchain features? → `/progetti/xworld/`
- Need to work on task management features? → `/gestionale-x/`
- Need to update Olympics scoring/teams? → `/OG-2025/`
- Need to write event documentation? → `/OGv2/`
- Need to work on online store? → `/Paolino-main/`

### Starting Development
```bash
# Portfolio/Mini Games - Choose one:
python -m http.server 8000        # Python HTTP server
# OR use VS Code Live Server        # Right-click index.html → "Open with Live Server"

# Gestionale-X
cd gestionale-x && npm run dev    # Port 5173

# OG-2025 (Olimpiadi Goliardiche) - Static site
cd OG-2025
python -m http.server 8000        # Then open http://localhost:8000/homepage.html
# OR npx serve .

# Paolino (MUST start in order: MongoDB → Backend → Frontend)
sudo service mongodb start                    # Step 1: Database
cd Paolino-main/backend && npm run dev        # Step 2: Backend (port 5031)
cd Paolino-main/frontend && npm run dev       # Step 3: Frontend (port 5173)
```

### Portfolio Showcase Contents
- **Mini Games** (`/minigiochi/`): Interactive browser games
  - Pixxa Generator - Pizza name generator with modular data files
  - DVD Screensaver - Classic bouncing logo animation
  - Trix - Interactive game
  - Rhythm Click - Rhythm-based clicking game
  - Style Generator - CSS style generation tool
- **Projects** (`/progetti/`): Showcased projects
  - **X World Project** (`/progetti/xworld/`) - Complete Web3 ecosystem with NFT crowdfunding and tokenized investments
    - `index.html` - Visual showcase with POLPOPOLI projects (Sciarcuffia 🧣, 00X 🎩, I8I 👓, PolpoVerse 🐙)
    - `whitepaper.html` - Comprehensive documentation (~1100 lines) with blockchain strategy, tokenomics, risks
    - `app-prototype.html` - NFT-gated app simulator with tier-based chat access
    - `crypto-academy.html` - Advanced blockchain learning platform with progress tracking
    - `crypto-studio.html` - Basic crypto education with live CoinGecko price ticker
    - `nav-hub.html` - Navigation hub for all X World apps
    - `blockchain-study/` - Study materials and resources subdirectory
  - Olimpiadi - Links to OG-2025 event management system
  - Quotify - External project showcase
  - Documenti - Document showcase
- **Sito Magliette** - T-shirt website demo

## X World Project - Deep Dive

**Location**: `/progetti/xworld/`
**Type**: Web3 Ecosystem - NFT Crowdfunding Platform
**Tech Stack**: Vanilla HTML/CSS/JS + Solidity Smart Contracts
**Total Lines**: ~6,271 HTML + ~40KB Markdown docs + Solidity contracts

### Overview
X World è un ecosistema Web3 completo per crowdfunding tramite NFT, tokenomics e governance DAO. Il progetto combina applicazioni web interattive con smart contracts Ethereum per creare un sistema decentralizzato di finanziamento progetti.

### Core Applications (5 HTML Pages)

1. **`index.html`** (~1,030 lines) - **Main Showcase with Toggle Layer System**
   - Homepage del progetto con design iridescente
   - **🔄 Toggle Layer System** (Progressive Disclosure UX):
     - 👁️ **Vista Semplice**: Per utenti non tecnici, focus su vantaggi e benefici
     - ⚙️ **Vista Tecnica**: Dettagli blockchain, smart contracts, tokenomics, flowcharts
     - LocalStorage persistence - ricorda preferenza utente
     - Keyboard shortcut: `Alt+T` per toggle rapido
     - Smooth transitions e fade-in animations
   - Showcase dei 4 progetti POLPOPOLI:
     - 🧣 **Sciarcuffia**: Accessorio streetwear (€30, 50 NFT)
     - 🎩 **00X**: Cappello limited edition (€60, 100 NFT)
     - 👓 **I8I**: Occhiali tech-fashion (€90, 75 NFT)
     - 🐙 **PolpoVerse**: Universo digitale multimediale (€150, 200 NFT)
   - **Layer Tech Content**: ERC-721/1155/20, IPFS metadata, smart contract architecture
   - Grid layout responsive con animazioni shimmer
   - Single-screen desktop layout con sidebar verticale
   - **IP Protection Strategy**: Educazione progressiva senza esporre tutti i dettagli

2. **`whitepaper.html`** (1,185 lines) - **Comprehensive Documentation**
   - Documentazione completa dell'ecosistema (~1100 linee)
   - Sezioni principali:
     - Introduzione e filosofia X World
     - Sistema NFT a 3 tier (Bronze/Silver/Gold)
     - BIC Token (X World Coin) tokenomics
     - Cicli di crowdfunding e roadmap
     - Sistema di governance DAO
     - Analisi rischi e strategie
     - Sostenibilità economica
   - Design: Stile accademico con serif font (Georgia)
   - Table of contents navigabile

3. **`app-prototype.html`** (1,033 lines) - **NFT-Gated App Simulator**
   - Prototipo funzionale di app mobile (480px max-width)
   - **Tier-based access system**:
     - Bronze NFT: Chat generale (tutti)
     - Silver NFT: Chat founder + forum (+ €30)
     - Gold NFT: Video calls + bonus (+ €60)
   - Features:
     - Wallet connection simulator
     - Chat interface con messaggi scrollabili
     - User profile management
     - Navigation bottom bar
   - Design: Mobile-first con sidebars verticali

4. **`crypto-academy.html`** (1,836 lines) - **Advanced Learning Platform**
   - Piattaforma educativa completa su blockchain/crypto
   - **3 percorsi di apprendimento**:
     - 🎓 Blockchain Basics (4 moduli)
     - 💎 Advanced Crypto (3 moduli)
     - 🚀 DeFi & Web3 (4 moduli)
   - Features interattive:
     - Sistema quiz con tracking
     - Progress bars per modulo
     - Badge achievement system
     - Certificati al completamento
   - LocalStorage per salvare progress
   - Design: Gradiente viola/cyan con cards espandibili

5. **`crypto-studio.html`** (990 lines) - **Basic Crypto Education**
   - Introduzione semplificata a crypto e blockchain
   - Sezioni:
     - Cos'è la blockchain
     - Wallet e chiavi private
     - NFT explained
     - DeFi basics
   - **Live Price Ticker** via CoinGecko API
     - Prezzi real-time BTC, ETH, BNB, ADA, SOL
     - Auto-refresh ogni 30 secondi
   - Design: Clean and minimal, focus su contenuto

6. **`nav-hub.html`** (477 lines) - **Navigation Hub**
   - Centro di navigazione per tutte le app X World
   - Link alle 5 applicazioni principali
   - Design: Minimale con grid layout

### Blockchain Study Materials

**Location**: `/progetti/xworld/blockchain-study/`
**Purpose**: Studio completo blockchain per implementare X World su Ethereum

**Struttura Directory**:
```
blockchain-study/
├── README.md (9KB) - Indice generale e quick start
├── BLOCKCHAIN_STUDY.md (18KB) - Guida principale 3 livelli
├── PIANO_SETTIMANALE.md (13KB) - 12 settimane dettagliate
│
├── basics/ - Settimane 1-4
│   └── 01_SETUP.md - Installazione tools (MetaMask, Hardhat, Node.js)
│
├── intermediate/ - Settimane 5-10
│   ├── XWORLD_NFT_CONTRACT.sol - NFT Collection completa (ERC-721)
│   └── BIC_TOKEN.sol - Token ERC-20 per ecosistema
│
├── advanced/ - Settimane 11-18
│   └── (Staking, DAO, DeFi contracts - in sviluppo)
│
├── resources/
│   ├── RISORSE_COMPLETE.md - Corsi, tools, community
│   └── PROGETTI_PRATICI.md - 10 progetti progressivi
│
└── projects/ - Workspace per sviluppo
```

**Piano di Studio (12 settimane, 1-2h/giorno)**:
- **Fase 1 (Mese 1)**: Blockchain basics, Solidity fundamentals, Hardhat, OpenZeppelin
- **Fase 2 (Mesi 2-3)**: BIC Token (ERC-20), NFT Collection (ERC-721), Frontend integration
- **Fase 3 (Mesi 4-6)**: Staking system, DAO governance, IPFS storage, Security audit

**10 Progetti Pratici Progressivi**:
1. Hello X World (2h) - Primo contratto
2. Guest Book (3h) - Mappings & structs
3. Simple X Badge (4h) - NFT base
4. BIC Token Lite (5h) - ERC-20 base
5. X World Collection V1 (8h) - NFT con pricing
6. BIC Airdrop (4h) - Token distribution
7. X World Staking (10h) - Staking con rewards
8. X World Governance (12h) - DAO voting
9. NFT Staking (12h) - Stake NFT per BIC rewards
10. Crowdfunding (15h) - Sistema completo funding

### Smart Contracts

**BIC_TOKEN.sol** (ERC-20):
- Token nativo dell'ecosistema X World
- Standard OpenZeppelin ERC-20
- Funzionalità: transfer, approve, minting controllato
- Utilizzo: Governance, rewards, staking

**XWORLD_NFT_CONTRACT.sol** (ERC-721):
- NFT Collection a 3 tier (Bronze/Silver/Gold)
- Metadata IPFS integration
- Pricing dinamico per tier
- Royalties per creatori
- Whitelist/presale system

### Architettura X World

**Filosofia del Progetto**:
> "X World non è un singolo prodotto, ma un mondo di progetti interconnessi. Ogni iniziativa può prendere vita all'ecosistema con supporto della community e tecnologie decentralizzate."

**Sistema NFT 3-Tier**:
- 🥉 **Bronze NFT** (€30): Accesso base, chat community
- 🥈 **Silver NFT** (€60): + Chat founder, forum esclusivo
- 🥇 **Gold NFT** (€90): + Video calls, bonus esclusivi, governance vote

**Ciclo di Crowdfunding**:
1. **Presentazione progetto** (POLPOPOLI)
2. **Mint NFT** (3 tier disponibili)
3. **Funding goal reached** → Sviluppo inizia
4. **Milestone updates** via chat tier-based
5. **Prodotto finale** + rewards BIC Token
6. **Nuovo ciclo** con progetto successivo

**Token Economics (BIC)**:
- Utility token per governance e rewards
- Stake BIC = voting power in DAO
- Earn BIC tramite NFT staking
- Burn mechanism per deflazione

### Development Workflow

**Nessun Build Process Richiesto**:
```bash
# Serve static files directly
cd /home/paolo/polpo/progetti/xworld
python -m http.server 8000

# Apri browser:
http://localhost:8000/index.html           # Main showcase
http://localhost:8000/whitepaper.html      # Documentazione
http://localhost:8000/app-prototype.html   # App simulator
http://localhost:8000/crypto-academy.html  # Learning platform
http://localhost:8000/crypto-studio.html   # Crypto basics
http://localhost:8000/nav-hub.html         # Navigation hub
```

**Modificare le Applicazioni**:
- Tutti i file sono self-contained HTML con inline CSS/JS
- Nessuna dipendenza esterna (tranne CoinGecko API in crypto-studio)
- LocalStorage per persistenza dati (crypto-academy progress)
- Modifiche immediate visibili con refresh browser

**Blockchain Development**:
```bash
# Setup ambiente (prima volta)
cd blockchain-study/basics
# Seguire 01_SETUP.md per installare MetaMask, Hardhat, etc.

# Testare contratti
cd intermediate
# Usare Remix IDE (remix.ethereum.org) per deploy su Sepolia testnet

# Seguire piano settimanale
cd ..
cat PIANO_SETTIMANALE.md
# Seguire settimana per settimana (12 settimane totali)
```

### Design System

**Color Palette**:
- **Index.html**: Iridescent gradient (cyan/purple/pink)
  - `--iridescent-2: hsl(180, 100%, 50%)` (cyan)
  - `--iridescent-3: hsl(270, 100%, 70%)` (purple)
  - `--iridescent-4: hsl(330, 100%, 60%)` (pink)
- **Whitepaper**: Academic style
  - Background: `#f5f5f0` (off-white paper)
  - Primary: `#0f3460` (navy blue)
  - Accent: `#7b2cbf` (purple)
- **App Prototype**: Minimalist mobile
  - `--primary: #000`, `--bg: #fff`, `--border: #ddd`
- **Crypto Academy**: Tech gradient
  - Purple/cyan gradient with dark mode

**Typography**:
- **Index**: System fonts (`-apple-system, BlinkMacSystemFont`)
- **Whitepaper**: Serif (`Georgia, Times New Roman`)
- **Academy**: Sans-serif with monospace code blocks

**Responsive Breakpoints**:
- Desktop: Full layout con sidebars (index.html)
- Mobile: Max 480px per app-prototype.html
- Academy: Adaptive grid (1/2/3 colonne)

### Key Features & Interactions

**Index.html**:
- Shimmer animation su header con `@keyframes shimmer`
- Project cards con hover effects
- Sidebar verticale con testo ruotato
- Grid layout responsive

**App Prototype**:
- Tier unlock simulation (click su lock icons)
- Chat scrollabile con messages
- Bottom navigation bar
- Profile modal

**Crypto Academy**:
- Quiz interattivo per ogni modulo
- Progress tracking con LocalStorage keys:
  - `xworld-academy-progress-{moduleId}`
  - `xworld-academy-quiz-{moduleId}`
- Badge achievement system
- Certificato download (simulato)

**Crypto Studio**:
- Live price ticker con `fetch('https://api.coingecko.com/api/v3/simple/price')`
- Auto-refresh ogni 30 secondi
- Error handling per API failures

### Integration Points

**Wallet Connection** (simulato in app-prototype):
```javascript
// Simula MetaMask connection
function connectWallet() {
  // In produzione: window.ethereum.request()
  showWalletConnected = true;
  userTier = 'bronze'; // Simulato
}
```

**IPFS Metadata** (previsto per NFT contracts):
```javascript
// Metadata structure per XWORLD_NFT
{
  "name": "X World Bronze #001",
  "description": "Bronze tier access to X World ecosystem",
  "image": "ipfs://QmXXXXX...",
  "attributes": [
    {"trait_type": "Tier", "value": "Bronze"},
    {"trait_type": "Project", "value": "Sciarcuffia"}
  ]
}
```

### Testing & Deployment

**Frontend Testing**:
- Nessun testing framework (static HTML)
- Test manuale su browser
- Responsive testing: Chrome DevTools mobile view

**Smart Contract Testing**:
```bash
# Usando Hardhat
cd blockchain-study/intermediate
npx hardhat test

# Deploy su Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

**Deployment Targets**:
- **Frontend**: Static hosting (GitHub Pages, Netlify, Vercel)
- **Smart Contracts**: Ethereum mainnet (dopo audit)
- **Metadata**: IPFS/Arweave per decentralizzazione

### Project Status & Roadmap

**Stato Attuale** (Novembre 2024):
- ✅ 5 applicazioni HTML complete e funzionanti
- ✅ Whitepaper completo con tokenomics
- ✅ Materiali studio blockchain completi (40KB+ docs)
- ✅ Contratti Solidity base (BIC_TOKEN, XWORLD_NFT)
- 🚧 Smart contracts testing (in progress)
- ⏳ IPFS integration (planned)
- ⏳ Frontend-blockchain integration (planned)
- ⏳ Security audit (planned)

**Next Steps**:
1. Completare testing contratti su Sepolia testnet
2. Integrare Web3.js in app-prototype.html
3. Deploy NFT collection su testnet
4. Community feedback e iterazione
5. Security audit professionale
6. Deploy su Ethereum mainnet

### Common Tasks

**Modificare progetti POLPOPOLI**:
- File: `index.html`
- Cerca: `<!-- Projects Grid -->`
- Modifica: emoji, titoli, pricing, descriptions

**Aggiornare whitepaper**:
- File: `whitepaper.html`
- Cerca sezione specifica via table of contents
- Formato: standard HTML `<h2>`, `<h3>`, `<p>`, `<ul>`

**Aggiungere moduli crypto-academy**:
- File: `crypto-academy.html`
- Cerca: `const modules = [...]`
- Aggiungi oggetto modulo con: `id, title, category, lessons, quiz`

**Modificare tier access system**:
- File: `app-prototype.html`
- Cerca: funzione `unlockTier(tier)`
- Modifica: pricing, features per tier

### Resources & Documentation

**Internal Docs**:
- `/progetti/xworld/blockchain-study/README.md` - Start here
- `/progetti/xworld/blockchain-study/PIANO_SETTIMANALE.md` - 12-week plan
- `/progetti/xworld/blockchain-study/resources/RISORSE_COMPLETE.md` - External resources

**External Learning**:
- **CryptoZombies**: cryptozombies.io (Solidity gamificato)
- **Buildspace**: buildspace.so (Full DApps)
- **Alchemy University**: university.alchemy.com
- **Patrick Collins**: YouTube 16+ ore tutorial

**Tools Used**:
- **Remix IDE**: remix.ethereum.org (browser Solidity IDE)
- **Hardhat**: hardhat.org (local dev environment)
- **OpenZeppelin**: openzeppelin.com/contracts (secure contracts)
- **MetaMask**: metamask.io (wallet browser extension)
- **Sepolia Testnet**: sepoliafaucet.com (ETH di test)
- **Etherscan**: sepolia.etherscan.io (block explorer)

## Development Commands

### Static Sites (Portfolio, Mini Games)
```bash
# Serve with Python 3
python -m http.server 8000

# Or use VS Code Live Server (recommended for development)
# Right-click HTML file → "Open with Live Server"
```

### Gestionale-X React Application
```bash
cd gestionale-x
npm install           # First time only
npm run dev           # Development server (port 5173)
npm run build         # Production build
npm run lint          # ESLint code quality check
npm run preview       # Preview production build
```

### OG-2025 Olimpiadi Goliardiche
```bash
cd OG-2025

# Serve with Python 3
python -m http.server 8000

# Or with Node.js
npx serve .

# Then open browser to:
http://localhost:8000/homepage.html      # Landing page (start here)
http://localhost:8000/index.html         # Classifica Finale (main scoreboard)
http://localhost:8000/hub-capitani.html  # Captain Hub (team management)
```

**Note**: Pure vanilla JavaScript, no build process or dependencies required. All files run directly in browser.

### OGv2 - Documentation Only
```bash
# OGv2 is a documentation-only directory (no code to run)
# Contains markdown files extracted from OG-2025 project and PDF sources

cd OGv2
# Read documentation with any markdown viewer or text editor
```

**Available Documentation**:
- **`DOCUMENTAZIONE_COMPLETA_OG.md`**: Complete event documentation (~400 lines) - full reference, organizer manual
- **`QUICK_REFERENCE.md`**: Quick reference guide (~150 lines) - cheat sheet, essential info tables
- **`README.md`**: Index and usage guide for the documentation

**Key Content**:
- 14 temples/bars with complete schedules
- 12 games with detailed rules
- 45 questions for "Sussurro delle Sirene" game
- Evaluation system (3 criteria × 5 points)
- 8 challenge categories
- Special mechanics (Menu OG, dual language)
- Team strategies and organizer guidelines

### Paolino E-commerce Platform
```bash
# Step 1: Start MongoDB (REQUIRED)
sudo service mongodb start         # Linux/WSL
# Or use MongoDB Compass

# Step 2: Backend (port 5031) - MUST BE RUNNING
cd Paolino-main/backend
npm install
npm run dev                        # Development with nodemon
npm run setup                      # Initialize admin user and sample products
npm run clean:products             # Delete all products from database

# Step 3: Frontend (port 5173)
cd Paolino-main/frontend
npm install
npm run dev                        # Development server
npm run build                      # Production build
npm run lint                       # ESLint analysis
```

**⚠️ CRITICAL**: Backend must be running BEFORE frontend for proper operation.
**Paolino Test Credentials**: admin@paolino.com / admin123
**Database**: MongoDB on port 27017, database name `paolino_ecommerce`

## Architecture Overview

### Portfolio Hub Architecture
- **Pure Vanilla JavaScript** - No frameworks, self-contained HTML files with inline CSS/JS for games
- **CSS Custom Properties** - Theme system with light/dark modes
  - Variables: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--text-primary`, `--text-secondary`, `--border-color`, `--gradient-accent`
  - Theme toggle button in header with localStorage persistence
  - Attribute-based switching: `[data-theme="dark"]`
- **Mobile-First Design** - Touch-optimized with responsive grid (6/3/2 columns)
- **Font**: JetBrains Mono (monospace) for developer aesthetic
- **LocalStorage** - Theme persistence across sessions
- **Key Interactive Features**:
  - Polpo logo long-press (1.5s) redirects to gestionalepolpo.netlify.app (script.js:68-76)
  - Touch-based card expansion for mobile devices (script.js:2-38)

### Gestionale-X Architecture
**Tech Stack**: React 19.1 + Vite 7.1 + Firebase 12.3

**Component Structure**:
- `App.jsx`: Main router with authentication flow, real-time subscriptions, CRUD operations
- `firebaseService.js`: Abstracted Firestore operations with `subscribeToProjects()` and `subscribeToNotes()`
- `components/`: Auth, Home, AddProjectForm, AddNoteForm, ProjectCard, NoteCard, StatusBadge, PriorityBadge

**Data Models** (Firestore):
- **Projects**: `{id, name, description, status, tags, links, roadmap, obiettivi, todos, createdAt, userId}`
- **Notes**: `{id, title, content, type, priority, projectTags, createdAt, userId}`

**Key Patterns**:
- Real-time data via Firebase subscriptions (App.jsx:83-111)
- User data isolation enforced by `userId` field in security rules
- Auto-dismiss toast notifications (3-5 seconds)
- Inline styles strategically combined with CSS classes

### OG-2025 Olimpiadi Goliardiche Architecture
**Tech Stack**: Pure Vanilla JavaScript + HTML5 + CSS3 (no frameworks, no build process)

**Three-Page Application**:
1. **`homepage.html`**: Landing page with event info, 14 temples/bars, rules, navigation
2. **`index.html`**: Main scoreboard (Classifica Finale) with Google Sheets integration
3. **`hub-capitani.html`**: Team captain dashboard with challenge logging and team management

**Core Files**:
- `script.js`: ES6+ class-based logic for captain hub (`OlympicCaptainHub` class)
- `styles.css`: Greek vase aesthetic (gold/bronze theme: #daa520, #ffd700, #b8860b)
- `template_classifica.csv`: Google Sheets template structure

**Data Storage**:
- **LocalStorage Keys**:
  - `olimpiadiClassifica`: Scoreboard data (team names, scores, rankings)
  - `olympicCaptainHubData`: Captain hub data (team info, members, challenges, stats)
- **Google Sheets Integration**: JSONP technique for live data sync (avoids CORS issues)
  - Automatic silent loading on page load
  - Manual sync via 5-second logo long-press
  - Hardcoded Sheet ID in index.html:664

**Key Features**:
- 14 Temples/Bars (Caligo, Casa Gotuzzo, Cereria, Circolo Sport, Excalibur, Le Fontane, Loomi, Mary Jo, Storico, Teleria 108, Tirebouchon, Vinoria, Vinoteca, Vitae)
- Team scoring system (0-100 points per challenge + bonus)
- Responsive design with separate mobile/desktop views (768px breakpoint)
- Captain hub stats tracking: Morale, Energy, Strategy (0-100)
- Developer console commands for testing/debugging
- Greek/Olympic design system (Cinzel font for headings, JetBrains Mono for UI)

**Architecture Patterns**:
- No backend - pure client-side application
- No authentication - all data is local and public
- Auto-save to LocalStorage on all changes
- Event-driven with DOM event listeners
- Functional programming for scoreboard logic
- Object-oriented for captain hub (`OlympicCaptainHub` class)

### Paolino E-commerce Architecture
**Tech Stack**: Node.js/Express 4.18 + MongoDB 7.5 + React 19.1 + Vite 7.1 + Tailwind CSS 3.3 + Stripe 13.6

**Backend Structure** (`/Paolino-main/backend/`):
- `serverPaolino.js`: Express server with helmet, CORS, rate limiting
- `models/`: Mongoose schemas (User, Product, Order, Cart)
- `routes/`: API endpoints (auth, products, cart, orders, admin)
- `services/`: Stripe integration
- `middlewares/`: Auth, upload validation

**Frontend Structure** (`/Paolino-main/frontend/`):
- `App.jsx`: Router with protected routes and admin route guards
- `contexts/`: AuthContext (user auth), CartContext (shopping cart state)
- `pages/`: ProductShowcasePage (new landing), HomePage, ProductsPage, CartPage, CheckoutPage, ProfilePage
- `pages/admin/`: Dashboard, ProductsAdmin, OrdersAdmin, UsersAdmin, AnalyticsAdmin, SettingsAdmin
- `components/`: Header with navigation, Footer, ProductCard, Layout
- `services/api.js`: Axios-based API layer with auth interceptors

**API Endpoints**:
- `/api/auth/*`: Authentication (register, login, profile, logout)
- `/api/products/*`: Catalog with search/filters/pagination, single product details
- `/api/cart/*`: Shopping cart (authenticated users only)
- `/api/orders/*`: Order management and Stripe payment processing
- `/api/admin/*`: Admin CRUD, analytics, user management, product uploads
- `/api/wishlist/*`: User wishlist management

**Key Backend Dependencies**:
- `express`: Web framework with middleware
- `mongoose`: MongoDB ODM with schemas
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT authentication
- `stripe`: Payment processing
- `cloudinary` + `multer-storage-cloudinary`: Image upload and storage
- `helmet`: Security headers
- `express-rate-limit`: API rate limiting
- `joi`: Request validation
- `cors`: Cross-origin resource sharing

**Key Frontend Dependencies**:
- `react` + `react-dom`: v19.1.1 UI library
- `react-router-dom`: v6.20 Client-side routing
- `@stripe/stripe-js`: Stripe payment integration
- `axios`: HTTP client with interceptors
- `tailwindcss`: v3.3 Utility-first CSS
- `lucide-react`: Icon library
- `react-hot-toast`: Toast notifications
- `clsx` + `tailwind-merge`: Conditional CSS classes

## Important Code Locations

### Portfolio Hub Touch Behavior
Mobile card expansion system in `script.js:2-38` handles touch events to expand project cards on mobile devices.

### Gestionale-X Real-time Subscriptions
Firebase real-time listeners in `App.jsx:83-111` use `onSnapshot` to sync projects and notes instantly across clients.

### Gestionale-X Project-Note Relationship
Notes link to projects via shared tags (App.jsx:114-118):
```javascript
const getProjectNotes = (project) => {
  return notes.filter(note =>
    note.projectTags && note.projectTags.some(tag =>
      project.tags && project.tags.includes(tag)
    )
  )
}
```

### Portfolio Hub Theme System
Light/dark theme implementation in `index.html`:
- Theme state stored in localStorage as `theme` key
- Toggle function switches between light/dark modes
- CSS custom properties automatically update via `[data-theme="dark"]` attribute
- Theme persists across page reloads
- No JavaScript framework required - pure DOM manipulation

### X World Toggle Layer System
Progressive disclosure UX pattern in `progetti/xworld/index.html` for IP protection and education:
```javascript
// Location: index.html lines 1056-1130
// Toggle between Simple View (non-technical) and Technical View (blockchain details)

// Key Components:
// 1. Toggle Buttons (lines ~90-100)
<div class="layer-toggle">
    <button class="toggle-btn active" data-layer="simple">👁️ Vista Semplice</button>
    <button class="toggle-btn" data-layer="tech">⚙️ Vista Tecnica</button>
</div>

// 2. Dual Content Layers (example from Collection section)
<div class="layer-simple">
    <p><strong>Crowdfunding tramite NFT</strong> per finanziare progetti reali.</p>
</div>
<div class="layer-tech">
    <h4>⚙️ Come Funziona</h4>
    <ul>
        <li><strong>Smart Contract</strong>: ERC-721 su Polygon/Base</li>
        <li><strong>3 Tier System</strong>: Bronze (€30), Silver (€60), Gold (€90)</li>
    </ul>
</div>

// 3. JavaScript Toggle Logic (lines 1056-1130)
function setActiveLayer(layer) {
    // Show/hide layers with fade-in animation
    // Save preference to localStorage as 'xworld-layer'
    // Update toggle button active states
}

// 4. Features:
// - LocalStorage persistence (key: 'xworld-layer')
// - Keyboard shortcut: Alt+T
// - Smooth scroll to top on toggle
// - Fade-in animations (0.3s ease)
// - Console feedback for debugging
```

**Strategy**: Educate non-blockchain users progressively while protecting intellectual property from being fully exposed in Simple View.

### Mini Games Modular Data Pattern
Pixxa Generator uses separate data files (`minigiochi/pixxa/ingredienti.js`, `pizzeClassiche.js`, etc.) with core logic in `main.js` and smart naming algorithm. Games are self-contained in single HTML files with inline CSS/JS for maximum portability.

### OG-2025 Google Sheets Integration
Scoreboard (`index.html`) uses JSONP technique to fetch data from Google Sheets:
- Sheet ID hardcoded at line 664
- Automatic silent loading on page load via `loadFromGoogleSheets(false)`
- Logo long-press (5 seconds) triggers manual sync with visual feedback
- JSONP creates script tag: `https://docs.google.com/spreadsheets/d/{sheetId}/gviz/tq?tqx=out:json`
- Data parsed via `window.google.visualization.Query.setResponse()` callback
- Sheet must be publicly accessible: "Anyone with the link can view"

### OG-2025 Developer Console Commands
Hidden debugging commands available in browser console:
```javascript
olympicCommands.reset()           // Reset all data
olympicCommands.export()          // Export backup JSON
olympicCommands.summary()         // Show team summary
olympicCommands.addPoints(n)      // Add points to team
olympicCommands.setMorale(n)      // Set morale (0-100)
olympicCommands.help()            // Show all commands
```

## Deployment

### Netlify Configuration
Configured in `netlify.toml` for Gestionale-X deployment:
- **Build base**: `gestionale-x/`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20
- **SPA redirect**: All routes → `/index.html` (status 200)
- **Deployed at**: https://gestionalepolpo.netlify.app/

**Important**: Only the Gestionale-X React app is built and deployed via Netlify. The static portfolio files (`/index.html`, `/minigiochi/`, `/progetti/`) are NOT part of the Netlify build process.

### Portfolio Hub Deployment
Static files can be deployed separately to any static hosting service (GitHub Pages, Netlify static, Vercel, etc.) or served via Python HTTP server for local development.

## CSS Responsive Breakpoints
```css
/* 6 columns: 1400px+ */
@media (min-width: 1400px) { grid-template-columns: repeat(6, 1fr); }

/* 3 columns: 900px-1200px */
@media (max-width: 1200px) and (min-width: 900px) { grid-template-columns: repeat(3, 1fr); }

/* 2 columns: <600px */
@media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
```

## Environment Variables

### Portfolio Hub
No environment variables required for static files. Firebase configuration (if used) is embedded in HTML/JS files.

### Gestionale-X
```env
# Firebase configuration embedded in src/firebase.js
# No .env file needed - uses Firebase public API keys
```

### OG-2025 (Olimpiadi Goliardiche)
```env
# No environment variables required
# Google Sheets ID hardcoded in index.html:664
```

### Paolino E-commerce

**Backend** (`/Paolino-main/backend/.env`):
```env
NODE_ENV=development
PORT=5031
MONGODB_URI=mongodb://localhost:27017/paolino_ecommerce
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STRIPE_SECRET_KEY=sk_test_...
CORS_ORIGIN=http://localhost:5173
```

**Frontend** (`/Paolino-main/frontend/.env`):
```env
VITE_API_URL=http://localhost:5031/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Security Note**: Never commit `.env` files. Use `.env.example` as templates. See `/Paolino-main/SECURITY.md` for complete security setup.

## Security Considerations

### Gestionale-X Firebase
- Firebase config contains **public API keys** (normal and expected for Firebase web apps)
- Security enforced through **Firestore security rules** on backend, not client-side
- Each user accesses only their own data via `userId` field filtering

### Paolino E-commerce
- Bcrypt password hashing
- JWT token-based authentication (7-day expiry)
- Express rate limiting on API endpoints
- Helmet security headers
- Input validation with Joi schemas
- File upload validation (5MB max, JPEG/PNG/WebP only)

## Port Assignments
- **Static sites**: Port 8000 (Python HTTP server)
- **Gestionale-X frontend**: Port 5173 (Vite default)
- **Paolino frontend**: Port 5173 (conflicts with gestionale-x if both run simultaneously)
- **Paolino backend**: Port 5031
- **MongoDB**: Port 27017 (required for Paolino)

**Port Conflict Resolution**:
```bash
# Check what's running on a port
lsof -i :5173

# Kill a process on a port
kill -9 $(lsof -t -i:5173)

# Or use different port for Vite
vite --port 5174
```

## Git Workflow Notes
- **Branch Strategy**: Single `main` branch is production-ready (no development/staging branches)
- **Commit Messages**: Italian preferred for consistency with user-facing content
- **Untracked Projects**: `Paolino-main/` directory currently untracked (consider separate repo if committing)
- **Common Modified Files**: CLAUDE.md updates, .env configuration, package.json dependencies
- **Pre-commit Check**: Always run `git status` before committing to verify tracked changes
- **GitHub Pages**: `.nojekyll` file at root enables deployment without Jekyll processing
- **No Remote Conflicts**: Repository appears to be personal/solo development (no merge conflicts expected)

### Recent Development Focus (from git history)
- Reorganized homepage navigation (Olimpiadi, Quotify, Brand sections)
- Fixed onclick handlers for button navigation
- Renamed "I Miei Progetti" to "Progetti" for cleaner presentation
- Updated project showcase with X World, Olimpiadi Goliardiche, and Quotify

## Project Status
- **Portfolio Hub**: ✅ Stable, production-ready, deployed
- **X World Project**: 🚧 ~80% complete, frontend ready, blockchain integration in progress
  - **Location**: `/progetti/xworld/`
  - ✅ Completed: 5 HTML applications (6,271 lines), Whitepaper, Blockchain study materials (40KB+), Base smart contracts
  - 🚧 In Progress: Smart contracts testing on Sepolia, Web3.js integration
  - ⏳ Planned: IPFS metadata, Security audit, Mainnet deployment
  - **Tech Stack**: Vanilla HTML/CSS/JS + Solidity + Ethereum
  - **Apps**: Main showcase, Whitepaper, NFT-gated app prototype, Crypto Academy, Crypto Studio, Nav hub
  - **Blockchain**: BIC Token (ERC-20), X World NFT Collection (ERC-721), 3-tier access system
- **Gestionale-X**: ✅ Fully functional, deployed at gestionalepolpo.netlify.app
- **OG-2025 (Olimpiadi Goliardiche)**: ✅ Complete, production-ready
  - **Event**: Olimpiadi Goliardiche 2025 (Chiavari, Italy)
  - **Features**: 14 temples/bars, 20 teams, Google Sheets integration, captain dashboard
  - **Tech**: Pure vanilla JavaScript, no dependencies, no build process
  - **Deployment**: Static files deployable to any hosting (GitHub Pages, Netlify, etc.)
  - **Documentation**: Complete CLAUDE.md in `/OG-2025/CLAUDE.md`
- **OGv2 (Olimpiadi Goliardiche Documentation)**: ✅ Complete, documentation-only
  - **Purpose**: Comprehensive documentation and analysis extracted from OG-2025 and PDF sources
  - **Created**: 2025-11-07
  - **Content**: 3 markdown files with event details, game rules, strategies, quick reference
  - **Sources**: OG-2025 codebase + "OG Giochi.pdf" (19 pages)
  - **Use Cases**: Event organizers, participating teams, developers planning OGv2 features
- **Paolino E-commerce**: 🚧 ~90% complete, core functionality working
  - **Test Credentials**: admin@paolino.com / admin123
  - ✅ Completed: Backend API, Authentication, Admin panel, Product catalog, Cart functionality, ProductShowcasePage landing
  - 🚧 In Progress: Checkout flow with Stripe, User profile with order history
  - ⚠️ Known Issues: Frontend requires backend running at all times (see QUICK_START.md)
  - 📁 Status: Currently untracked in git (consider separate repository)

## Browser Compatibility
- Modern browser features required: ES6+ syntax, CSS Grid, Custom Properties
- Touch device optimization with separate hover states
- WebGL support recommended for advanced visualizations

## File Organization Best Practices
- **Self-contained HTML files** for games (inline CSS/JS for portability)
- **Modular data files** for game content (separate logic from data)
- **Maximum 500 lines per file** - Split larger files into modules
- **Naming conventions**:
  - Files: kebab-case (e.g., `style-generator.html`)
  - React Components: PascalCase (e.g., `AddProjectForm.jsx`)
  - Functions/Variables: camelCase
  - Constants: UPPER_SNAKE_CASE

## Common Gotchas and Best Practices

### Multi-Project Repository Pitfalls
1. **Port Conflicts**: Both Gestionale-X and Paolino frontend use port 5173. Never run both simultaneously without changing ports.
2. **Wrong Directory**: Always `cd` into the correct project directory before running `npm` commands.
3. **Missing Backend**: Paolino frontend will fail silently if backend isn't running. Always start backend first.
4. **MongoDB Not Running**: Paolino requires MongoDB service to be running before starting backend.
5. **Build vs Source**: Netlify only builds `/gestionale-x/`. Don't expect other projects to be built by Netlify.

### Development Best Practices
1. **Static Files First**: When testing changes to portfolio/mini games, use Python HTTP server or Live Server (no build needed).
2. **Check Git Status**: Before committing, verify which project's files you modified with `git status`.
3. **Project Isolation**: Each project has its own dependencies. Run `npm install` in each project directory separately.
4. **LocalStorage Debugging**: OG-2025 stores data in browser LocalStorage. Use browser DevTools → Application → Local Storage to debug.
5. **Firebase Public Keys**: Gestionale-X Firebase config keys in source code are normal and expected (security is in Firestore rules).

### Common Command Mistakes
```bash
# ❌ WRONG - Running npm in root for project-specific command
npm run dev

# ✅ CORRECT - Navigate to project first
cd gestionale-x && npm run dev

# ❌ WRONG - Forgetting to start MongoDB for Paolino
cd Paolino-main/backend && npm run dev

# ✅ CORRECT - Start MongoDB first
sudo service mongodb start && cd Paolino-main/backend && npm run dev

# ❌ WRONG - Trying to build static HTML files
cd minigiochi && npm run build

# ✅ CORRECT - Serve static files directly
python -m http.server 8000
```

## Common Troubleshooting

### Paolino: "ERR_CONNECTION_REFUSED"
**Problem**: Backend not running
**Solution**: Start backend first (`cd Paolino-main/backend && npm run dev`), wait for "Server running on port 5031", then refresh frontend

### Paolino: "MongoDB connection failed"
**Problem**: MongoDB not running
**Solution**: `sudo service mongodb start` or use MongoDB Compass

### Paolino: No products displayed
**Problem**: Empty database
**Solution**: Run `npm run setup` in backend directory to create admin and sample products

### Gestionale-X: Firebase errors
**Problem**: Security rules or authentication issues
**Solution**: Check that user is logged in, Firebase config is correct in environment

### Static sites: Not loading correctly
**Problem**: Incorrect paths or server not running
**Solution**: Use Python HTTP server (`python -m http.server 8000`) or VS Code Live Server

### OG-2025: Google Sheets not syncing
**Problem**: Scoreboard not loading data from Google Sheets
**Solution**:
1. Verify sheet is set to "Anyone with the link can view"
2. Check Sheet ID is correct in `index.html` line 664
3. Ensure internet connection is active
4. Check browser console for JSONP errors
5. Try logo long-press (5 seconds) for manual sync

### OG-2025: LocalStorage data lost
**Problem**: Team data or scores disappeared
**Solution**:
- Browser privacy mode blocks LocalStorage
- Cache clearing deletes data
- Use export functionality (`olympicCommands.export()` in console) to create backups
- Google Sheets data overwrites LocalStorage on page load

## Additional Resources

### Paolino E-commerce Documentation
- **`/Paolino-main/CLAUDE.md`** - Complete backend/frontend architecture reference
- **`/Paolino-main/QUICK_START.md`** - Step-by-step troubleshooting guide
- **`/Paolino-main/SECURITY.md`** - ⚠️ **CRITICAL**: Security checklist, .env setup, key rotation
- **`/Paolino-main/STRIPE_SETUP.md`** - Stripe payment integration configuration (referenced but may not exist)
- **`/Paolino-main/CLOUDINARY_INTEGRATION.md`** - Image upload and storage setup
- **`/Paolino-main/STATUS.md`** - Project completion status and roadmap
- **`/Paolino-main/deploy.md`** - Deployment instructions

### Other Project Documentation
- **`/OG-2025/CLAUDE.md`** - Complete Olimpiadi Goliardiche implementation and developer commands
- **`/OG-2025/README.md`** - Italian-language project overview and features
- **`/OGv2/DOCUMENTAZIONE_COMPLETA_OG.md`** - Complete event documentation (~400 lines) with all game rules
- **`/OGv2/QUICK_REFERENCE.md`** - Quick reference guide with tables and checklists
- **`/OGv2/README.md`** - Index and usage guide for OGv2 documentation
- **`/gestionale-x/SECURITY_SETUP.md`** - Firebase security configuration
- **`/gestionale-x/firestore.rules`** - Firestore security rules
