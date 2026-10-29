import { lazy, useCallback, useState } from 'react'

// Estensioni: strumenti in più che non stanno nelle quattro sezioni (decise il 2026-10-04).
// Ognuna ha una pagina sua in #/estensioni/<id> e, se vuole, un riquadro da mostrare in Oggi.
// Per aggiungerne una: una voce qui, i componenti in src/components/estensioni/.
export const ESTENSIONI = [
  {
    id: 'mazzo-anno',
    nome: "Il Mazzo dell'Anno",
    desc: 'Un calendario di 13 mesi da 28 giorni in cui ogni data diventa una stesa di quattro tarocchi e una radice di tre lettere ebraiche. Viene da Arcana, su polpopoly.it.',
    oggi: 'Mostra la stesa del giorno in Oggi',
    Pagina: lazy(() => import('../components/estensioni/MazzoAnno')),
    Riquadro: lazy(() => import('../components/estensioni/MazzoOggi'))
  }
]

export const estensione = (id) => ESTENSIONI.find(e => e.id === id)

// Quali estensioni compaiono in Oggi. Sta nel browser, non su Firestore: vale per questo dispositivo.
const CHIAVE = 'gestionale-estensioni'
const leggi = () => {
  try { return JSON.parse(localStorage.getItem(CHIAVE)) || {} } catch { return {} }
}

export const useEstensioniInOggi = () => {
  const [scelte, setScelte] = useState(leggi)
  const cambia = useCallback((id, attiva) => {
    setScelte(prima => {
      const dopo = { ...prima, [id]: attiva }
      try { localStorage.setItem(CHIAVE, JSON.stringify(dopo)) } catch { /* memoria piena o navigazione privata */ }
      return dopo
    })
  }, [])
  return [scelte, cambia]
}
