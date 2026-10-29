import { useData } from '../../context/useData'
import { saveRoutine } from '../../firebaseService'

// I testi pronti della chat: toccandone uno finisce nel campo per scrivere, da completare e mandare.
// Stanno nel documento routines/{uid}, come le scadenze generali dell'Amministrativa: così sono
// uguali su telefono e computer e le regole di Firestore non cambiano.
// Finché Paolo non li modifica valgono questi (erano i bottoni fissi della chat vuota).
export const PREDEFINITI = [
  { id: 'oggi', titolo: 'Oggi', testo: 'Cosa dovrei fare oggi? Guarda agenda e progetti in corso.' },
  { id: 'priorita', titolo: 'Priorità', testo: 'Quali sono le 3 priorità principali per questa settimana?' },
  { id: 'riepilogo', titolo: 'Riepilogo', testo: 'Fammi un riepilogo dei progetti in corso e di cosa manca a ciascuno' },
  { id: 'idee', titolo: 'Idee', testo: 'Analizza i miei progetti e suggeriscimi idee o miglioramenti' }
]

export const MAX_TITOLO = 40
export const MAX_TESTO = 4000

export const nuovoId = () => (globalThis.crypto?.randomUUID?.() || `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`)

// Senza titolo vale l'inizio del testo
export const titoloDi = (t) => t.titolo?.trim() || (t.testo.length > 24 ? `${t.testo.slice(0, 24).trimEnd()}…` : t.testo)

export function useTestiPronti() {
  const { routine } = useData()
  const salvati = routine && Array.isArray(routine.testiPronti) ? routine.testiPronti : null
  return {
    caricamento: routine === undefined,
    testi: (salvati ?? PREDEFINITI).filter(t => t?.testo),
    salva: (lista) => saveRoutine({
      testiPronti: lista
        .map(t => ({ id: t.id || nuovoId(), titolo: t.titolo.trim().slice(0, MAX_TITOLO), testo: t.testo.trim().slice(0, MAX_TESTO) }))
        .filter(t => t.testo)
    })
  }
}
