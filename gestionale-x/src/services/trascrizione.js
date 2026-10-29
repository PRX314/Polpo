// Dove va l'audio delle note vocali per diventare testo: Whisper su Groq, l'audio non si conserva.
// Online su polpopoly.it c'è /api/trascrivi dell'hub, una funzione Cloudflare sullo stesso dominio:
// non dorme mai e non chiede il permesso CORS. Altrove (sviluppo, prove) e se quella manca o non è
// configurata si usa il backend su Render, che dopo 15 minuti fermo impiega 30-60 s a svegliarsi.
import { auth } from '../firebase'

// Come API_URL di chatService, che però apre Firestore appena importato.
const API_URL = import.meta.env.VITE_AI_API_URL || ''
const SU_HUB = /(^|\.)polpopoly\.it$/.test(location.hostname)

// Chiamata quando parte una registrazione: Render si sveglia mentre parli, così il ripiego (e la
// chat, se viene dopo) non aspetta il risveglio. Una volta ogni 10 minuti basta: dorme dopo 15.
let svegliato = 0
export function preparaTrascrizione() {
  if (Date.now() - svegliato < 10 * 60000) return
  svegliato = Date.now()
  fetch(`${API_URL}/api/health`).catch(() => {})
}

const manda = async (url, blob, tipo) => {
  const token = await auth.currentUser?.getIdToken?.()
  return fetch(url, { method: 'POST', headers: { 'Content-Type': tipo || 'audio/webm', ...(token && { Authorization: `Bearer ${token}` }) }, body: blob })
}

// La risposta del server ({ testo } oppure { error }); senza rete lancia un errore.
export async function inviaAudio(blob, tipo = blob.type) {
  if (SU_HUB) {
    const res = await manda('/api/trascrivi', blob, tipo).catch(() => null)
    // 404/405: funzione non pubblicata; 503: chiave mancante. In questi casi si passa a Render.
    if (res && ![404, 405, 503].includes(res.status)) return res
  }
  return manda(`${API_URL}/api/trascrivi`, blob, tipo)
}
