# 📅 PIANO DI STUDIO SETTIMANALE

## 🎯 Come Usare Questo Piano

Questo è un piano **realistico** e **sostenibile** per studiare blockchain mentre mantieni altri impegni.

**Commitment minimo**: 1-2 ore al giorno, 5-6 giorni a settimana
**Totale**: ~10 ore/settimana
**Durata**: 12 settimane per fondamenti solidi

---

## 📊 STRUTTURA GIORNALIERA

### Giorni Feriali (Lunedì-Venerdì) - 1.5 ore
```
⏰ 45 min → Studio teorico
  - Video tutorial
  - Lettura documentazione
  - Prendere appunti

⏰ 45 min → Pratica
  - Scrivere codice
  - Testare su Remix/Hardhat
  - Deploy su testnet
```

### Weekend (Sabato) - 3 ore
```
⏰ 3 ore → Progetto settimanale
  - Mini-progetto da zero a deploy
  - Integrare concetti della settimana
  - Documentare
```

### Domenica - RIPOSO
- Niente studio tecnico
- Opzionale: Lettura light, video casual
- Ricaricare le batterie

---

## 📚 SETTIMANA 1: FONDAMENTI BLOCKCHAIN

### 🎯 Obiettivo Settimana
Capire cos'è blockchain, come funziona, e fare la prima transazione

### Lunedì - Setup & Blockchain Basics
```
📖 45 min: Lettura
  - Cos'è blockchain
  - Bitcoin vs Ethereum
  - Come funziona un blocco
  Risorsa: Ethereum.org "Intro to Ethereum"

💻 45 min: Pratica
  - Installa MetaMask
  - Crea wallet
  - SALVA SEED PHRASE
  - Esplora interfaccia
```

### Martedì - Wallet & Transazioni
```
📖 45 min: Video
  - "Public Key Cryptography Explained"
  - Come funziona una transazione
  Risorsa: Anders Brownworth blockchain demo

💻 45 min: Pratica
  - Aggiungi Sepolia testnet
  - Ottieni ETH da faucet
  - Fai 3 transazioni di test
  - Analizza su Etherscan
```

### Mercoledì - Gas & Fees
```
📖 45 min: Studio
  - Cos'è il gas
  - Gas price, gas limit
  - Come ottimizzare fee
  Risorsa: Ethereum Gas Explained

💻 45 min: Pratica
  - Prova transazioni con gas diverso
  - Calcola costo in USD
  - Analizza transazioni costose su Etherscan
```

### Giovedì - Smart Contracts Intro
```
📖 45 min: Video
  - Cosa sono smart contracts
  - Solidity basics
  Risorsa: CryptoZombies Lezione 1

💻 45 min: Pratica
  - Completare CryptoZombies Lezione 1
  - Provare su Remix
```

### Venerdì - Eventi & Storage
```
📖 45 min: Studio
  - Storage vs Memory
  - Eventi e logs
  Risorsa: CryptoZombies Lezione 2

💻 45 min: Pratica
  - Completare CryptoZombies Lezione 2
```

### Sabato - PROGETTO: Hello X World
```
⏰ 3 ore: Mini-progetto

✅ Task:
1. Creare HelloXWorld.sol contract
2. Funzioni: set message, get message
3. Event quando message cambia
4. Deploy su Sepolia
5. Interagire via Etherscan
6. Screenshot e documentare

📝 Output:
  - Contract address
  - Link Etherscan
  - README.md con spiegazione
```

### ✅ Checklist Fine Settimana 1
- [ ] MetaMask configurato
- [ ] Sepolia ETH ottenuti
- [ ] 5+ transazioni fatte
- [ ] CryptoZombies Lezioni 1-2 completate
- [ ] Primo contratto deployato
- [ ] Capisco: blockchain, gas, smart contract basics

---

## 📚 SETTIMANA 2: SOLIDITY FUNDAMENTALS

### 🎯 Obiettivo Settimana
Padroneggiare sintassi Solidity e patterns base

### Lunedì - Types & Variables
```
📖 45 min: Studio
  - Types: uint, address, string, bool
  - State variables
  - Visibility: public, private, internal
  Risorsa: Solidity docs

💻 45 min: Pratica
  - Esercizi Remix con vari types
  - Provare visibility modifiers
```

### Martedì - Functions & Modifiers
```
📖 45 min: Video
  - Function declarations
  - View, Pure, Payable
  - Modifiers
  Risorsa: CryptoZombies Lezione 3

💻 45 min: Pratica
  - CryptoZombies Lezione 3
  - Creare custom modifiers
```

### Mercoledì - Mappings & Structs
```
📖 45 min: Studio
  - Mappings
  - Structs
  - Nested data structures
  Risorsa: Solidity by Example

💻 45 min: Pratica
  - Creare contratto con mapping di structs
  - CRUD operations
```

### Giovedì - Arrays & Loops
```
📖 45 min: Video
  - Dynamic vs Fixed arrays
  - For loops, while
  - Gas considerations
  Risorsa: Smart Contract Programmer

💻 45 min: Pratica
  - Implementare array operations
  - Calcolare gas di loop
```

### Venerdì - Inheritance & Imports
```
📖 45 min: Studio
  - Contract inheritance
  - Imports
  - Abstract contracts
  Risorsa: CryptoZombies Lezione 4

💻 45 min: Pratica
  - CryptoZombies Lezione 4
```

### Sabato - PROGETTO: X World Guestbook
```
⏰ 3 ore: Progetto

Features:
- Mapping address → message
- Struct per metadata (timestamp, message)
- Array di tutti i firmatari
- Funzione getAll messages
- Events per new message

Deploy & test su Sepolia
```

### ✅ Checklist Fine Settimana 2
- [ ] CryptoZombies Lezioni 3-4 completate
- [ ] Capisco tutti i types Solidity
- [ ] So usare mappings, structs, arrays
- [ ] Guestbook deployato e funzionante

---

## 📚 SETTIMANA 3: HARDHAT & TESTING

### 🎯 Obiettivo Settimana
Passare da Remix a environment professionale

### Lunedì - Hardhat Setup
```
📖 45 min: Studio
  - Cos'è Hardhat
  - Setup progetto
  Risorsa: Hardhat docs

💻 45 min: Pratica
  - Seguire file basics/01_SETUP.md
  - Inizializzare progetto Hardhat
  - Configurare .env
```

### Martedì - Compilation & Deploy
```
📖 45 min: Video
  - Compilation process
  - Deploy scripts
  Risorsa: Alchemy tutorial

💻 45 min: Pratica
  - Compilare contratto
  - Scrivere deploy script
  - Deploy su localhost
```

### Mercoledì - Testing Basics
```
📖 45 min: Studio
  - Unit testing
  - Chai assertions
  - Testing patterns
  Risorsa: Hardhat testing docs

💻 45 min: Pratica
  - Scrivere test per HelloWorld
  - Test success e fail cases
```

### Giovedì - Advanced Testing
```
📖 45 min: Video
  - beforeEach, describe, it
  - Testing events
  - Error handling
  Risorsa: Smart Contract Programmer

💻 45 min: Pratica
  - Test completi per Guestbook
  - Coverage >80%
```

### Venerdì - Etherscan Verification
```
📖 45 min: Studio
  - Perché verificare
  - API key Etherscan
  Risorsa: Hardhat verify plugin

💻 45 min: Pratica
  - Verificare contratto su Sepolia
  - Interagire tramite Etherscan UI
```

### Sabato - PROGETTO: Ripubblicare contratti passati
```
⏰ 3 ore: Refactor

Task:
1. HelloWorld su Hardhat
2. Guestbook su Hardhat
3. Test completi per entrambi
4. Deploy verificato
5. Scripts di interazione
```

### ✅ Checklist Fine Settimana 3
- [ ] Hardhat setup funzionante
- [ ] So scrivere test
- [ ] So deployare e verificare
- [ ] Contratti precedenti su Hardhat

---

## 📚 SETTIMANA 4: OPENZEPPELIN & ERC STANDARDS

### 🎯 Obiettivo Settimana
Capire standard e usare librerie sicure

### Lunedì - OpenZeppelin Intro
```
📖 45 min: Studio
  - Cos'è OpenZeppelin
  - Installazione
  - Inheritance pattern
  Risorsa: OpenZeppelin docs

💻 45 min: Pratica
  - npm install @openzeppelin/contracts
  - Esplorare libreria
  - Import in contratto
```

### Martedì - Access Control
```
📖 45 min: Video
  - Ownable
  - AccessControl
  - Roles
  Risorsa: OpenZeppelin Access Control

💻 45 min: Pratica
  - Implementare Ownable
  - Creare ruoli custom
  - Test permessi
```

### Mercoledì - ERC-20 Theory
```
📖 45 min: Studio
  - ERC-20 standard
  - Transfer, approve, allowance
  - Perché serve approval
  Risorsa: EIP-20 specification

💻 45 min: Pratica
  - Leggere codice OpenZeppelin ERC20
  - Interagire con token su Sepolia
```

### Giovedì - ERC-721 Theory
```
📖 45 min: Video
  - ERC-721 standard
  - TokenURI, metadata
  - Differenza con ERC-20
  Risorsa: OpenZeppelin ERC721

💻 45 min: Pratica
  - Leggere codice OpenZeppelin ERC721
  - Analizzare NFT su OpenSea
```

### Venerdì - Security Basics
```
📖 45 min: Studio
  - Reentrancy
  - Integer overflow
  - Access control issues
  Risorsa: Consensys Best Practices

💻 45 min: Pratica
  - Usare ReentrancyGuard
  - SafeMath patterns
```

### Sabato - PROGETTO: Simple X Badge NFT
```
⏰ 3 ore: NFT Base

Features:
- ERC-721 con OpenZeppelin
- Mint solo owner
- Max 100 supply
- Soulbound (non trasferibile)
- TokenURI on IPFS (placeholder)

Test + Deploy + Verify
```

### ✅ Checklist Fine Settimana 4
- [ ] Capisco OpenZeppelin
- [ ] So usare access control
- [ ] Capisco ERC-20 e ERC-721
- [ ] Primo NFT mintato!

---

## 📚 SETTIMANA 5-6: ERC-20 TOKEN PROJECT

### 🎯 Obiettivo 2 Settimane
Creare BIC Token per X World (versione semplificata)

### Settimana 5 - Token Base
```
Lunedì-Venerdì: Studio + Coding BIC Token
- Initial supply
- Transfer
- Burn
- Test completi

Sabato: Deploy BIC Token su testnet
```

### Settimana 6 - Token Advanced
```
Lunedì-Venerdì: Features avanzate
- Transfer fee
- Tax exemption
- Pausable
- Access control

Sabato: Test completi, deploy finale, documentazione
```

### ✅ Checklist Fine Settimana 6
- [ ] BIC Token completo
- [ ] Test coverage >90%
- [ ] Deployato e verificato
- [ ] Script di interazione
- [ ] Documentazione

---

## 📚 SETTIMANA 7-8: NFT COLLECTION PROJECT

### 🎯 Obiettivo 2 Settimane
X World Collection con 3 tier

### Settimana 7 - NFT Base
```
Lunedì-Venerdì: Coding NFT Collection
- 3 tier (Seed, Builder, Visionary)
- Pricing diverso
- Supply limits
- Payable mint

Sabato: Test & Deploy v1
```

### Settimana 8 - NFT Advanced
```
Lunedì-Venerdì: Features avanzate
- Reveal mechanism
- BIC rewards
- Royalties EIP-2981
- Max per wallet

Sabato: Test finale, deploy, documentazione completa
```

### ✅ Checklist Fine Settimana 8
- [ ] NFT Collection completa
- [ ] Tutti i tier funzionanti
- [ ] Metadata su IPFS
- [ ] BIC rewards integrate
- [ ] Deployato su testnet

---

## 📚 SETTIMANA 9-10: FRONTEND INTEGRATION

### 🎯 Obiettivo 2 Settimane
Connettere contratti a interfaccia React

### Settimana 9 - Wallet Connection & Reading
```
Lunedì-Venerdì:
- Setup React + Ethers.js
- Wallet connection
- Read contract data
- Display NFT balance
- Display BIC balance

Sabato: UI completa per viewing
```

### Settimana 10 - Transactions
```
Lunedì-Venerdì:
- Mint NFT da UI
- Transfer BIC
- Approve mechanisms
- Transaction feedback
- Error handling

Sabato: DApp completa funzionante
```

### ✅ Checklist Fine Settimana 10
- [ ] Frontend connesso
- [ ] Mint NFT da UI
- [ ] Transfer BIC da UI
- [ ] Feedback utente
- [ ] Error handling

---

## 📚 SETTIMANA 11-12: STAKING & DEFI

### 🎯 Obiettivo 2 Settimane
Sistema staking per BIC

### Settimana 11 - Staking Base
```
Lunedì-Venerdì:
- Staking contract
- Lock periods
- APY calculation
- Withdraw logic

Sabato: Test & Deploy staking
```

### Settimana 12 - Integration
```
Lunedì-Venerdì:
- Integrare con frontend
- NFT holder bonus
- UI per staking
- Testing completo

Sabato: Documentazione finale ecosistema
```

### ✅ Checklist Fine Settimana 12
- [ ] Staking funzionante
- [ ] Frontend integrato
- [ ] Rewards corretti
- [ ] Ecosystem documentato

---

## 🎯 TRACKING GIORNALIERO

Crea un file `DAILY_LOG.md`:

```markdown
## 21 Gennaio 2025 - Lunedì

### ⏰ Tempo: 1.5 ore

### 📖 Studio (45 min)
- Completato: Intro to Ethereum su Ethereum.org
- Appreso: Differenza tra Bitcoin e Ethereum
- Domande: Come funziona esattamente il gas?

### 💻 Pratica (45 min)
- Installato MetaMask
- Creato wallet
- Saved seed phrase securely
- Aggiunto Sepolia testnet

### 💡 Note
- MetaMask più facile del previsto
- Curioso di provare transazione domani

### ✅ Per Domani
- Ottenere Sepolia ETH
- Fare prima transazione
```

---

## 📊 WEEKLY REVIEW

Ogni domenica, rivedi:

```markdown
## Week 1 Review

### ✅ Completato
- [x] MetaMask setup
- [x] 5 transazioni
- [x] CryptoZombies 1-2
- [x] HelloWorld deployato

### ❌ Non Completato
- [ ] Analizzare 10 transazioni su Etherscan (solo 5)

### 💡 Lezioni Apprese
- Gas costa più del previsto
- Eventi sono super utili per debugging
- Remix è ottimo per iniziare

### 🎯 Focus Next Week
- Padroneggiare mappings e structs
- Migliorare velocità coding
```

---

## 🔥 MANTENERE LA MOTIVAZIONE

### Ogni Settimana
- [ ] Condividi 1 cosa imparata su Discord
- [ ] Aiuta qualcuno con una domanda
- [ ] Celebra piccole vittorie

### Ogni Mese
- [ ] Build something cool da mostrare
- [ ] Write a blog post (anche solo appunti)
- [ ] Review progress e adjust plan

### Remember
- **Progress > Perfection**
- **Consistency > Intensity**
- **Learning > Finishing**

Non mollare se salti un giorno. Riprendi il giorno dopo.

---

## 🆘 COSA FARE SE RIMANI INDIETRO

**Non farti prendere dal panico.**

Opzioni:
1. **Rallenta**: 1 ora al giorno invece di 1.5
2. **Estendi**: 16 settimane invece di 12
3. **Skip weekend projects**: Focus solo su theory
4. **Pair up**: Studia con qualcuno

**La cosa peggiore che puoi fare è smettere completamente.**

Meglio 30 minuti al giorno per 6 mesi che 5 ore al giorno per 1 settimana.

---

## 🚀 DOPO LE 12 SETTIMANE

Hai:
- ✅ Solide fondamenta blockchain
- ✅ BIC Token deployato
- ✅ NFT Collection live
- ✅ Frontend funzionante
- ✅ Sistema staking base

Next steps:
- Governance DAO
- NFT staking
- Crowdfunding contracts
- Launch su mainnet (con audit!)

**Sei pronto per costruire X World su blockchain.**

---

*Piano Settimanale · X World Blockchain Study*
*Buono studio! 🚀*
