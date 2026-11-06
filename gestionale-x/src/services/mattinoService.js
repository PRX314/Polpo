// La sveglia di Peppino: il discorso del mattino e la chiave del Comando sull'iPhone.
// Il testo arriva da solo in routines/{uid}.mattino; qui si chiede di prepararlo a mano e si crea la chiave.
import { auth } from '../firebase'
import { saveRoutine } from '../firebaseService'
import { API_URL } from './chatService'

// Il Worker delle notifiche: non dorme, quindi alla sveglia risponde subito
export const INDIRIZZO_MATTINO = 'https://www.polpopoly.it/api/gestionale-push/mattino'

export async function preparaDiscorso({ forza = false } = {}) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Rientra e riprova')
  const res = await fetch(`${API_URL}/api/mattino/prepara`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ forza })
  })
  const dati = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(dati.error || `Errore server (${res.status})`)
  return dati
}

// La chiave nasce nel browser e si vede una volta sola: su Firestore finisce solo la sua impronta,
// che il Worker confronta. Crearne una nuova spegne quella di prima.
export async function creaChiave() {
  const byte = crypto.getRandomValues(new Uint8Array(24))
  const chiave = btoa(String.fromCharCode(...byte)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const impronta = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(chiave))
  const chiaveHash = [...new Uint8Array(impronta)].map(b => b.toString(16).padStart(2, '0')).join('')
  await saveRoutine({ sveglia: { chiaveHash, chiaveCreata: new Date().toISOString(), attiva: true } })
  return chiave
}
