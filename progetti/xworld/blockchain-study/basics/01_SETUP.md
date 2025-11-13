# 🛠️ SETUP AMBIENTE DI SVILUPPO

## Installazione Tools Essenziali

### 1. Node.js & npm
```bash
# Verifica versione (minimo 16.x)
node --version
npm --version

# Se non installato: https://nodejs.org/
```

### 2. MetaMask
1. Installa estensione browser: [metamask.io](https://metamask.io/)
2. Crea nuovo wallet
3. **SALVA LA SEED PHRASE IN UN POSTO SICURO**
4. Aggiungi Sepolia Testnet

#### Aggiungere Sepolia Testnet manualmente:
- **Nome rete**: Sepolia
- **RPC URL**: `https://rpc.sepolia.org`
- **Chain ID**: 11155111
- **Symbol**: SepoliaETH
- **Block Explorer**: `https://sepolia.etherscan.io`

### 3. Ottenere ETH di Test (Sepolia)
```
Faucets Sepolia:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

Richiedi 0.5 ETH di test (sufficiente per iniziare)
```

### 4. Hardhat - Environment di sviluppo
```bash
# Crea cartella progetto
mkdir xworld-contracts
cd xworld-contracts

# Inizializza progetto npm
npm init -y

# Installa Hardhat
npm install --save-dev hardhat

# Inizializza Hardhat
npx hardhat init
# Seleziona: "Create a JavaScript project"

# Installa dipendenze comuni
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
npm install dotenv
```

### 5. Configurazione Hardhat

Crea file `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

### 6. File .env (IMPORTANTE)

Crea file `.env` nella root del progetto:
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_metamask_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**⚠️ ATTENZIONE**:
- MAI committare `.env` su Git
- Aggiungi `.env` a `.gitignore`
- NON condividere mai la private key

#### Come ottenere le chiavi:

**Alchemy RPC URL**:
1. Vai su [alchemy.com](https://www.alchemy.com/)
2. Crea account gratuito
3. Crea nuova app (Ethereum → Sepolia)
4. Copia l'HTTPS endpoint

**Private Key MetaMask**:
1. Apri MetaMask
2. Click sui 3 punti → Account details
3. Export Private Key
4. Inserisci password
5. **⚠️ QUESTA CHIAVE DÀ ACCESSO AL TUO WALLET**

**Etherscan API Key**:
1. Vai su [etherscan.io](https://etherscan.io/)
2. Crea account
3. API Keys → Add new key
4. Copia la chiave

### 7. Remix IDE (alternativa browser)
- Vai su [remix.ethereum.org](https://remix.ethereum.org/)
- Non richiede installazione
- Perfetto per iniziare velocemente
- Limiti: meno potente per progetti complessi

### 8. VS Code Extensions (opzionale ma consigliato)
```
- Solidity (Juan Blanco)
- Hardhat Solidity
- Prettier - Code formatter
- Solidity Visual Developer
```

---

## 🧪 Test Setup

Crea il primo contratto per testare il setup:

**contracts/HelloWorld.sol**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloWorld {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }

    function updateMessage(string memory _newMessage) public {
        message = _newMessage;
    }
}
```

**scripts/deploy.js**:
```javascript
const hre = require("hardhat");

async function main() {
  const HelloWorld = await hre.ethers.getContractFactory("HelloWorld");
  const helloWorld = await HelloWorld.deploy("Hello X World!");

  await helloWorld.waitForDeployment();

  console.log("HelloWorld deployed to:", await helloWorld.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

**Test il deploy**:
```bash
# Compila
npx hardhat compile

# Deploy su rete locale
npx hardhat node  # In un terminale separato
npx hardhat run scripts/deploy.js --network localhost

# Deploy su Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

---

## ✅ Checklist Setup Completo

- [ ] Node.js installato (v16+)
- [ ] MetaMask installato e configurato
- [ ] Wallet creato e seed phrase salvata
- [ ] Sepolia testnet aggiunta
- [ ] ETH di test ottenuti (almeno 0.1 SepoliaETH)
- [ ] Hardhat progetto inizializzato
- [ ] OpenZeppelin installato
- [ ] File .env configurato correttamente
- [ ] Alchemy account creato
- [ ] Etherscan account creato
- [ ] Primo contratto compilato con successo
- [ ] Deploy su localhost funzionante
- [ ] (Opzionale) Deploy su Sepolia testnet

---

## 🎯 Prossimi Step

Dopo il setup:
1. Studia `02_BLOCKCHAIN_FUNDAMENTALS.md`
2. Completa i primi esercizi pratici
3. Inizia con CryptoZombies Lezione 1

---

## 🆘 Troubleshooting Comuni

### Errore: "insufficient funds for gas"
- Ottieni più ETH di test dal faucet

### Errore: "nonce too low"
- Reset account su MetaMask: Settings → Advanced → Reset Account

### Errore: "cannot find module"
- `npm install` nella cartella del progetto

### Hardhat compilation errors
- Verifica versione Solidity in `hardhat.config.js`
- `npx hardhat clean` poi `npx hardhat compile`

### RPC URL not working
- Verifica che Alchemy app sia attiva
- Controlla che l'URL sia corretto in `.env`

---

*Documento Setup · X World Blockchain Study*
