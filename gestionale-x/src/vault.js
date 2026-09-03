// Collegamento alla nota di Obsidian che racconta un progetto.
//
// Prima il percorso era scritto a mano come `20-Projects/<nome>`. Funziona finche'
// ogni progetto ha una nota propria, ma parecchie cartelle sono catalogate a elenco
// dentro note che stanno altrove — `40-Resources/Esperimenti.md`, `50-Archive/Eventi
// passati.md` — e per quelle il collegamento portava a un file inesistente.
// Il sync scrive il percorso completo in `vaultPath`: qui lo si usa quando c'e'.

export const linkVault = (p) => {
  const percorso = p?.vaultPath || (p?.vaultNote ? `20-Projects/${p.vaultNote}.md` : '')
  if (!percorso) return null
  return `obsidian://open?vault=Vault&file=${encodeURIComponent(percorso)}`
}

// Cosa scrivere sul bottone: una nota propria o il catalogo che la nomina
export const etichettaVault = (p) =>
  p?.vaultNote ? 'Apri in Obsidian' : `Descritto in ${p?.vaultCatalogo || 'una nota'}`

export const haVault = (p) => !!(p?.vaultNote || p?.vaultCatalogo)
