# X World Project - Web3 NFT Crowdfunding Ecosystem

**Location**: `/progetti/xworld/`
**Type**: Web3 Ecosystem - NFT Crowdfunding Platform
**Tech Stack**: Vanilla HTML/CSS/JS + Solidity Smart Contracts
**Total Size**: ~200KB HTML (9 files) + ~40KB Markdown docs + Solidity contracts

## Table of Contents
- [Overview](#overview)
- [Core Applications](#core-applications)
- [Blockchain Study Materials](#blockchain-study-materials)
- [Smart Contracts](#smart-contracts)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Design System](#design-system)
- [Key Features & Interactions](#key-features--interactions)
- [Integration Points](#integration-points)
- [Testing & Deployment](#testing--deployment)
- [Project Status & Roadmap](#project-status--roadmap)
- [Common Tasks](#common-tasks)
- [Resources & Documentation](#resources--documentation)

## Overview

X World è un ecosistema Web3 completo per crowdfunding tramite NFT, tokenomics e governance DAO. Il progetto combina applicazioni web interattive con smart contracts Ethereum per creare un sistema decentralizzato di finanziamento progetti.

### Filosofia del Progetto

> "X World non è un singolo prodotto, ma un mondo di progetti interconnessi. Ogni iniziativa può prendere vita all'ecosistema con supporto della community e tecnologie decentralizzate."

## Core Applications (9 HTML Pages)

### 1. `index.html` (~1,030 lines) - Main Showcase with Toggle Layer System

Homepage del progetto con design iridescente.

**🔄 Toggle Layer System** (Progressive Disclosure UX):
- 👁️ **Vista Semplice**: Per utenti non tecnici, focus su vantaggi e benefici
- ⚙️ **Vista Tecnica**: Dettagli blockchain, smart contracts, tokenomics, flowcharts
- LocalStorage persistence - ricorda preferenza utente
- Keyboard shortcut: `Alt+T` per toggle rapido
- Smooth transitions e fade-in animations

**Showcase dei 4 progetti POLPOPOLI**:
- 🧣 **Sciarcuffia**: Accessorio streetwear (€30, 50 NFT)
- 🎩 **00X**: Cappello limited edition (€60, 100 NFT)
- 👓 **I8I**: Occhiali tech-fashion (€90, 75 NFT)
- 🐙 **PolpoVerse**: Universo digitale multimediale (€150, 200 NFT)

**Features**:
- Layer Tech Content: ERC-721/1155/20, IPFS metadata, smart contract architecture
- Grid layout responsive con animazioni shimmer
- Single-screen desktop layout con sidebar verticale
- IP Protection Strategy: Educazione progressiva senza esporre tutti i dettagli

### 2. `whitepaper.html` (1,185 lines) - Comprehensive Documentation

Documentazione completa dell'ecosistema (~56KB).

**Sezioni principali**:
- Introduzione e filosofia X World
- Sistema NFT a 3 tier (Bronze/Silver/Gold)
- BIC Token (X World Coin) tokenomics
- Cicli di crowdfunding e roadmap
- Sistema di governance DAO
- Analisi rischi e strategie
- Sostenibilità economica

**Design**: Stile accademico con serif font (Georgia), table of contents navigabile

### 3. `app-prototype.html` (1,033 lines) - NFT-Gated App Simulator

Prototipo funzionale di app mobile (480px max-width).

**Tier-based access system**:
- Bronze NFT: Chat generale (tutti)
- Silver NFT: Chat founder + forum (+ €30)
- Gold NFT: Video calls + bonus (+ €60)

**Features**:
- Wallet connection simulator
- Chat interface con messaggi scrollabili
- User profile management
- Navigation bottom bar
- Mobile-first con sidebars verticali

### 4. `crypto-studio.html` (~45KB) - Unified Blockchain Learning Platform

**4-Level Progressive Learning System** (unificato da crypto-academy + crypto-studio):

- 📚 **Livello 1 - Quick Start Pratico**: Wallet setup, comprare NFT, studiare crypto (per principianti assoluti)
- 🎓 **Livello 2 - Fondamenti Blockchain**: Tecnologia blockchain, consensus, mining, validazione
- 💎 **Livello 3 - Intermedio**: Smart Contracts, DeFi, Tokenomics, DAO governance
- 🚀 **Livello 4 - Avanzato**: Layer 2, Privacy (ZK-proofs), Security best practices

**Live Crypto Price Ticker** via CoinGecko API:
- Prezzi real-time: BTC, ETH, BNB, ADA, SOL
- Auto-refresh ogni 30 secondi
- Fixed banner top con scrolling prezzi

**Features interattive**:
- Sistema quiz con tracking per modulo
- Progress bars e completamento
- Badge achievement system
- LocalStorage per salvare progress

**Design**: Gradiente viola/cyan (--primary: #667eea, --secondary: #764ba2)

**Note**: Sostituisce sia crypto-academy.html che la vecchia versione base (unificazione Nov 2024)

### 5. `nav-hub.html` (~16KB) - Navigation Hub

Centro di navigazione per tutte le app X World.

**Features**:
- Link alle applicazioni principali (showcase, whitepaper, app-prototype, crypto-studio)
- Design minimale con grid layout
- Glassmorphism effects

### 6. `xw-house.html` (~30KB) - Membership Club Immobiliare

Piattaforma membership esclusiva per accesso a proprietà X World.

**Modello Legale (Italia)**: Utility Token / Membership Pass - Non è un investimento finanziario.

**Features**:
- NFT come tessera membership (NON quota di proprietà)
- 3 tier membership: Founder (€500), Premium (€300), Standard (€150)
- Benefit: 7 notti/anno incluse, 40% sconto extra, priorità prenotazioni
- Eventi esclusivi per membri, community riservata
- Design minimale mobile-first (max-width: 768px)

**Cosa NON è**: Investimento, security token, quota proprietà, revenue share, dividendi

### 7. `xw-house-nft-viewer.html` (~26KB) - Membership Pass Viewer

Visualizzatore dettagli membership pass XW House.

**Features**:
- Metadata: tier membership, benefici inclusi, validità
- 52 pass settimanali disponibili (membership annuali)
- Benefit tracker: notti utilizzate, sconti applicati
- Card-based layout con membership stats

**Note**: NON mostra rendimenti o quote proprietà (compliance legale Italia)

### 8. `xw-collection.html` (~17KB) - NFT Collection Showcase

Galleria completa NFT X World ecosystem.

**Features**:
- Categorie: Real Estate, Art, Membership, Utility
- Filter system per tier (Bronze/Silver/Gold)
- Grid responsive con hover effects
- Metadata cards per ogni NFT

### 9. `xw-hunter.html` (~5KB) - Hunter Integration Placeholder

Link/integrazione con Hunter gaming platform (external project).

**Features**:
- Minimal landing page
- Riferimento a gamification ecosystem
- Simple redirect/info page

## Blockchain Study Materials

**Location**: `/progetti/xworld/blockchain-study/`
**Purpose**: Studio completo blockchain per implementare X World su Ethereum

### Struttura Directory

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

### Piano di Studio (12 settimane, 1-2h/giorno)

- **Fase 1 (Mese 1)**: Blockchain basics, Solidity fundamentals, Hardhat, OpenZeppelin
- **Fase 2 (Mesi 2-3)**: BIC Token (ERC-20), NFT Collection (ERC-721), Frontend integration
- **Fase 3 (Mesi 4-6)**: Staking system, DAO governance, IPFS storage, Security audit

### 10 Progetti Pratici Progressivi

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

## Smart Contracts

### BIC_TOKEN.sol (ERC-20)

Token nativo dell'ecosistema X World.

**Features**:
- Standard OpenZeppelin ERC-20
- Funzionalità: transfer, approve, minting controllato
- Utilizzo: Governance, rewards, staking

### XWORLD_NFT_CONTRACT.sol (ERC-721)

NFT Collection a 3 tier (Bronze/Silver/Gold).

**Features**:
- Metadata IPFS integration
- Pricing dinamico per tier
- Royalties per creatori
- Whitelist/presale system

### XWORLD_MEMBERSHIP_NFT.sol (ERC-721) - Planned

Membership pass NFT per accesso proprietà X World.

**Features**:
- NFT non-fungibili per membership pass
- Tier system: Founder, Premium, Standard
- Benefit verification on-chain
- Transferability con restrizioni (no resale speculativo)

**Note Legali**: Strutturato come utility token per compliance Italia (no revenue share)

## Architecture

### Sistema NFT 3-Tier

- 🥉 **Bronze NFT** (€30): Accesso base, chat community
- 🥈 **Silver NFT** (€60): + Chat founder, forum esclusivo
- 🥇 **Gold NFT** (€90): + Video calls, bonus esclusivi, governance vote

### Ciclo di Crowdfunding

1. **Presentazione progetto** (POLPOPOLI)
2. **Mint NFT** (3 tier disponibili)
3. **Funding goal reached** → Sviluppo inizia
4. **Milestone updates** via chat tier-based
5. **Prodotto finale** + rewards BIC Token
6. **Nuovo ciclo** con progetto successivo

### Token Economics (BIC)

- Utility token per governance e rewards
- Stake BIC = voting power in DAO
- Earn BIC tramite NFT staking
- Burn mechanism per deflazione

## Development Workflow

### Nessun Build Process Richiesto

```bash
# Serve static files directly
cd /home/paolo/polpo/progetti/xworld
python -m http.server 8000

# Apri browser:
http://localhost:8000/index.html                  # Main showcase
http://localhost:8000/whitepaper.html             # Documentazione completa
http://localhost:8000/app-prototype.html          # NFT-gated app simulator
http://localhost:8000/crypto-studio.html          # 4-level learning platform
http://localhost:8000/nav-hub.html                # Navigation hub
http://localhost:8000/xw-house.html               # Real estate tokenizzato
http://localhost:8000/xw-house-nft-viewer.html    # Property NFT viewer
http://localhost:8000/xw-collection.html          # NFT collection gallery
http://localhost:8000/xw-hunter.html              # Hunter integration
```

### Modificare le Applicazioni

- Tutti i file sono self-contained HTML con inline CSS/JS
- Nessuna dipendenza esterna (tranne CoinGecko API in crypto-studio)
- LocalStorage per persistenza dati (crypto-studio progress)
- Modifiche immediate visibili con refresh browser

### Blockchain Development

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

## Design System

### Color Palette

**Index.html** - Iridescent gradient:
- `--iridescent-2: hsl(180, 100%, 50%)` (cyan)
- `--iridescent-3: hsl(270, 100%, 70%)` (purple)
- `--iridescent-4: hsl(330, 100%, 60%)` (pink)

**Whitepaper** - Academic style:
- Background: `#f5f5f0` (off-white paper)
- Primary: `#0f3460` (navy blue)
- Accent: `#7b2cbf` (purple)

**App Prototype** - Minimalist mobile:
- `--primary: #000`, `--bg: #fff`, `--border: #ddd`

**Crypto Studio** - Tech gradient:
- `--primary: #667eea`, `--secondary: #764ba2`, `--accent: #f5576c`
- Dark background gradient con fixed ticker banner

**XW House / XW Collection** - Minimalist clean:
- Mobile-first con max-width constraints
- Card-based layouts con subtle shadows

### Modern Design Features (Novembre 2024)

- **Glassmorphism**: `backdrop-filter: blur(10px)` su cards e overlays
- **Compact Layouts**: -25% to -30% padding reduction per mobile optimization
- **Hover Effects**: `translateY(-4px)` + box-shadow per interattività
- **Responsive**: Mobile ultra-compatto (8px padding), desktop espanso

### Typography

- **Index**: System fonts (`-apple-system, BlinkMacSystemFont`)
- **Whitepaper**: Serif (`Georgia, Times New Roman`)
- **Studio**: Sans-serif with monospace code blocks

### Responsive Breakpoints

- Desktop: Full layout con sidebars (index.html)
- Mobile: Max 480px per app-prototype.html
- Studio: Adaptive grid (1/2/3 colonne)

## Key Features & Interactions

### Index.html

- Shimmer animation su header con `@keyframes shimmer`
- Project cards con hover effects
- Sidebar verticale con testo ruotato
- Grid layout responsive

### App Prototype

- Tier unlock simulation (click su lock icons)
- Chat scrollabile con messages
- Bottom navigation bar
- Profile modal

### Crypto Studio (Unified Platform)

**4-level learning system** con quiz interattivi:
- **Live price ticker** con `fetch('https://api.coingecko.com/api/v3/simple/price')`
  - Auto-refresh ogni 30 secondi
  - Error handling per API failures
  - Fixed top banner con scrolling ticker

**Progress tracking** con LocalStorage keys:
- `crypto-studio-progress-{moduleId}`
- `crypto-studio-quiz-{moduleId}`
- `crypto-studio-level-{1-4}-completion`

**Badge achievement system** per completamento livelli

### XW House (Membership Club)

- Membership cards con benefit details (notti, sconti, eventi)
- Calculator risparmio membership vs prenotazione standard
- Tier comparison: Founder vs Premium vs Standard
- ERC-721 membership pass system (NON investimento)

### XW Collection

- NFT gallery con filter by tier/category
- Metadata viewer per ogni NFT
- Grid layout responsive
- Hover effects e preview modals

## Integration Points

### Wallet Connection (simulato in app-prototype)

```javascript
// Simula MetaMask connection
function connectWallet() {
  // In produzione: window.ethereum.request()
  showWalletConnected = true;
  userTier = 'bronze'; // Simulato
}
```

### IPFS Metadata (previsto per NFT contracts)

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

## Testing & Deployment

### Frontend Testing

- Nessun testing framework (static HTML)
- Test manuale su browser
- Responsive testing: Chrome DevTools mobile view

### Smart Contract Testing

```bash
# Usando Hardhat
cd blockchain-study/intermediate
npx hardhat test

# Deploy su Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### Deployment Targets

- **Frontend**: Static hosting (GitHub Pages, Netlify, Vercel)
- **Smart Contracts**: Ethereum mainnet (dopo audit)
- **Metadata**: IPFS/Arweave per decentralizzazione

## Project Status & Roadmap

### Stato Attuale (Novembre 2024)

- ✅ 9 applicazioni HTML complete e funzionanti
- ✅ Crypto Studio unificato con 4-level learning system
- ✅ Whitepaper completo con tokenomics (~56KB)
- ✅ Materiali studio blockchain completi (40KB+ docs)
- ✅ Contratti Solidity base (BIC_TOKEN, XWORLD_NFT)
- ✅ Glassmorphism design system applicato
- ✅ XW House membership club (modello legale Italia)
- ✅ NFT collection gallery
- 🚧 Smart contracts testing (in progress)
- ⏳ IPFS integration (planned)
- ⏳ Frontend-blockchain integration (planned)
- ⏳ Security audit (planned)

### Next Steps

1. Completare testing contratti su Sepolia testnet
2. Integrare Web3.js in app-prototype.html e xw-house.html
3. Deploy NFT collection su testnet (including real estate NFTs)
4. IPFS metadata per tutti gli NFT (POLPOPOLI + real estate)
5. Community feedback e iterazione
6. Security audit professionale
7. Deploy su Ethereum mainnet

## Common Tasks

### Modificare progetti POLPOPOLI

- File: `index.html`
- Cerca: `<!-- Projects Grid -->`
- Modifica: emoji, titoli, pricing, descriptions

### Aggiornare whitepaper

- File: `whitepaper.html`
- Cerca sezione specifica via table of contents
- Formato: standard HTML `<h2>`, `<h3>`, `<p>`, `<ul>`

### Aggiungere livelli/moduli crypto-studio

- File: `crypto-studio.html`
- Cerca: `const levels = [...]` o sezione HTML dei livelli
- Aggiungi contenuto per nuovo livello/modulo
- Note: crypto-studio è ora unificato (sostituisce crypto-academy)

### Modificare tier access system

- File: `app-prototype.html`
- Cerca: funzione `unlockTier(tier)`
- Modifica: pricing, features per tier

## Resources & Documentation

### Internal Docs

- `blockchain-study/README.md` - Start here
- `blockchain-study/PIANO_SETTIMANALE.md` - 12-week plan
- `blockchain-study/resources/RISORSE_COMPLETE.md` - External resources

### External Learning

- **CryptoZombies**: cryptozombies.io (Solidity gamificato)
- **Buildspace**: buildspace.so (Full DApps)
- **Alchemy University**: university.alchemy.com
- **Patrick Collins**: YouTube 16+ ore tutorial

### Tools Used

- **Remix IDE**: remix.ethereum.org (browser Solidity IDE)
- **Hardhat**: hardhat.org (local dev environment)
- **OpenZeppelin**: openzeppelin.com/contracts (secure contracts)
- **MetaMask**: metamask.io (wallet browser extension)
- **Sepolia Testnet**: sepoliafaucet.com (ETH di test)
- **Etherscan**: sepolia.etherscan.io (block explorer)

---

🐙 **X World - Where Ideas Become Reality Through Community** 🚀
