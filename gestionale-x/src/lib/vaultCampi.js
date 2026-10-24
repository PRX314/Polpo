// Chi possiede quali campi. Gli elementi arrivati dal vault (fonte: 'vault') vengono riallineati
// alla loro nota da backend/sincronizza.js, che dal 24/10 gira da solo entro 10 minuti da ogni
// modifica del vault: cambiare qui nome, stato o testi non serviva, al giro dopo tornavano come
// nella nota, senza avvisare. Quindi nell'app quei campi si leggono e basta, e si cambiano in Obsidian.
// Scadenza, sveglia, link, cose da fare, primo piano e archivio restano dell'app.
//
// Gli elementi solo-codice (fonte: 'scanner') sono tuoi: il sync aggiorna solo i dati del codice,
// più la descrizione quando la scrive il vault in una nota-catalogo (vaultCatalogo).

import { toIso } from './dates'

export const CAMPI_DEL_VAULT = ['name', 'description', 'status', 'tags', 'obiettivi', 'roadmap', 'sections']

export const dalVault = (p) => p?.fonte === 'vault'

export const campiBloccati = (p) => {
  if (dalVault(p)) return CAMPI_DEL_VAULT
  if (p?.vaultCatalogo) return ['description']
  return []
}

// L'ultima volta che ci hai lavorato, come AAAA-MM-GG. Per i progetti del vault vale `lastUpdated:`
// della nota (il loro updatedAt lo muove anche il sync); per gli altri l'ultima modifica nell'app.
export const ultimaVolta = (p) => dalVault(p)
  ? (p.vaultAggiornato || '')
  : (p?.updatedAt ? toIso(new Date(p.updatedAt)) : '')
