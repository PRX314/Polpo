// Chat service - comunicazione con Polpo AI backend + storico su Firestore
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  deleteDoc
} from "firebase/firestore"
import { db, auth } from "../firebase"

// In dev usa proxy Vite (/api -> localhost:5032), in prod usa URL diretto
export const API_URL = import.meta.env.VITE_AI_API_URL || ''

// Per la voce della modalità Parla: la suona un <audio src>, quindi il token va nell'indirizzo
export const parametriVoce = async () => {
  const token = await auth.currentUser?.getIdToken()
  return token ? `&k=${encodeURIComponent(token)}` : ''
}

// ============================================================================
// HELPERS
// ============================================================================
async function getAuthHeaders() {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Devi essere autenticato per usare Polpo AI')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

async function apiCall(endpoint, body) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (res.status === 429) {
    throw new Error('Troppe richieste. Aspetta qualche secondo e riprova.')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const base = err.error || `Errore server (${res.status})`
    throw new Error(err.detail ? `${base}\n(${err.detail})` : base)
  }

  return res.json()
}

// ============================================================================
// CHAT API
// ============================================================================

// history: [{ role, content }] già pronta (vedi perStoria in components/chat/azioni.js).
// specialist: id dell'assistente (null = Polpo generico).
// targets: [{ provider, model }] — con più di uno il backend risponde con `replies` (una per modello).
// voce: il messaggio è stato detto al microfono e la risposta verrà letta → il server la chiede breve.
export const sendMessage = async (message, { history = [], specialist = null, targets = [], voce = false } = {}) => {
  const body = { message, history: history.slice(-24) }
  if (specialist) body.specialist = specialist
  if (targets.length) body.targets = targets
  if (voce) body.voce = true
  const data = await apiCall('/api/chat', body)
  return {
    reply: data.reply,
    proposedActions: data.proposedActions || [],
    stats: data.stats || null,
    label: data.label || null,
    ms: data.ms ?? null,
    replies: data.replies || null
  }
}

// Come sendMessage (un modello solo), ma il testo arriva a pezzi: onTesto(pezzo) mentre il modello
// scrive. Restituisce la risposta completa nella stessa forma di sendMessage. Se il server non ha lo
// streaming (versione vecchia) si torna da soli alla chiamata normale.
export const streamMessage = async (message, { history = [], specialist = null, targets = [], voce = false } = {}, onTesto = () => {}) => {
  const body = { message, history: history.slice(-24) }
  if (specialist) body.specialist = specialist
  if (targets.length) body.targets = targets.slice(0, 1)
  if (voce) body.voce = true

  const res = await fetch(`${API_URL}/api/chat/stream`, { method: 'POST', headers: await getAuthHeaders(), body: JSON.stringify(body) })
  if (res.status === 404) return sendMessage(message, { history, specialist, targets, voce })
  if (res.status === 429) throw new Error('Troppe richieste. Aspetta qualche secondo e riprova.')
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}))
    const base = err.error || `Errore server (${res.status})`
    throw new Error(err.detail ? `${base}\n(${err.detail})` : base)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let resto = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    resto += decoder.decode(value, { stream: true })
    const blocchi = resto.split('\n\n')
    resto = blocchi.pop()
    for (const blocco of blocchi) {
      if (!blocco.startsWith('data:')) continue // righe di servizio (battito)
      const evento = JSON.parse(blocco.slice(5))
      if (evento.t === 'testo') onTesto(evento.d)
      else if (evento.t === 'errore') throw new Error(evento.detail ? `${evento.error}\n(${evento.detail})` : evento.error)
      else if (evento.t === 'fine') {
        return { reply: evento.reply, proposedActions: evento.proposedActions || [], stats: evento.stats || null, label: evento.label || null, ms: evento.ms ?? null, replies: null }
      }
    }
  }
  throw new Error('La risposta si è interrotta a metà. Riprova.')
}

export const getProviders = async () => {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/providers`, { headers })
  if (!res.ok) return []
  const data = await res.json()
  return data.providers || []
}

export const getSpecialists = async () => {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/specialists`, { headers })
  if (!res.ok) return []
  const data = await res.json()
  return data.specialists || []
}

export const executeActions = async (actions) => {
  const data = await apiCall('/api/chat/execute', { actions })
  return {
    results: data.results || [],
    stats: data.stats || null
  }
}

export const generateTitle = async (messages) => {
  // Al server serve solo il primo scambio, in chiaro
  const data = await apiCall('/api/chat/title', { messages: messages.slice(0, 4).map(m => ({ role: m.role, content: m.content })) })
  return data.title || 'Conversazione'
}

// ============================================================================
// CHAT HISTORY (Firestore)
// ============================================================================
const chatsCollection = collection(db, "chats")

// extra: campi della conversazione oltre ai messaggi, es. { specialist }
export const saveConversation = async (title, messages, extra = {}) => {
  if (!auth.currentUser) throw new Error('Non autenticato')

  const conv = {
    userId: auth.currentUser.uid,
    title: title || 'Nuova conversazione',
    ...extra,
    messages,
    messageCount: messages.length,
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date())
  }

  const docRef = await addDoc(chatsCollection, conv)
  return docRef.id
}

export const updateConversation = async (convId, messages, extra = {}) => {
  await updateDoc(doc(db, "chats", convId), {
    ...extra,
    messages,
    messageCount: messages.length,
    updatedAt: Timestamp.fromDate(new Date())
  })
}

// Solo alcuni campi (titolo, assistente): non riscrive i messaggi. Il titolo arriva secondi dopo
// e, se riscrivesse i messaggi, cancellerebbe quelli scambiati nel frattempo.
export const patchConversation = async (convId, fields) => {
  await updateDoc(doc(db, "chats", convId), fields)
}

export const subscribeToConversations = (callback, onError) => {
  if (!auth.currentUser) {
    callback([])
    return () => {}
  }

  const q = query(
    chatsCollection,
    where("userId", "==", auth.currentUser.uid)
  )

  return onSnapshot(q,
    (snapshot) => {
      const convs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: d.data().updatedAt?.toDate()?.toISOString() || new Date().toISOString()
      })).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      callback(convs)
    },
    (error) => {
      console.error('Errore sottoscrizione chat:', error)
      onError?.(error)
    }
  )
}

export const deleteConversation = async (convId) => {
  const ref = doc(db, "chats", convId)
  await deleteDoc(ref)
}
