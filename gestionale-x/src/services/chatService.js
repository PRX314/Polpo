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
const API_URL = import.meta.env.VITE_AI_API_URL || ''

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
    throw new Error(err.error || `Errore server (${res.status})`)
  }

  return res.json()
}

// ============================================================================
// CHAT API
// ============================================================================

export const sendMessage = async (message, history = [], source = 'main') => {
  const data = await apiCall('/api/chat', { message, history, source })
  return {
    reply: data.reply,
    proposedActions: data.proposedActions || [],
    stats: data.stats || null
  }
}

export const executeActions = async (actions) => {
  const data = await apiCall('/api/chat/execute', { actions })
  return {
    results: data.results || [],
    stats: data.stats || null
  }
}

export const generateTitle = async (messages) => {
  const data = await apiCall('/api/chat/title', { messages })
  return data.title || 'Conversazione'
}

// ============================================================================
// CHAT HISTORY (Firestore)
// ============================================================================
const chatsCollection = collection(db, "chats")

export const saveConversation = async (title, messages) => {
  if (!auth.currentUser) throw new Error('Non autenticato')

  const conv = {
    userId: auth.currentUser.uid,
    title: title || 'Nuova conversazione',
    messages,
    messageCount: messages.length,
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date())
  }

  const docRef = await addDoc(chatsCollection, conv)
  return docRef.id
}

export const updateConversation = async (convId, messages, title) => {
  const ref = doc(db, "chats", convId)
  const updates = {
    messages,
    messageCount: messages.length,
    updatedAt: Timestamp.fromDate(new Date())
  }
  if (title) updates.title = title
  await updateDoc(ref, updates)
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
