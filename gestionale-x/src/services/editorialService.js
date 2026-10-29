import { collection, doc, setDoc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp, runTransaction } from 'firebase/firestore'
import { auth, db } from '../firebase'

const root = () => collection(db, 'editorial')
const uid = () => {
  if (!auth.currentUser) throw new Error('Accedi per aprire il laboratorio')
  return auth.currentUser.uid
}
const row = d => ({ ...d.data(), id: d.id, pending: d.metadata.hasPendingWrites })
export const watchEditorial = (fn, fail) => onSnapshot(query(root(), where('userId', '==', uid())), { includeMetadataChanges: true },
  s => fn(s.docs.map(row).sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0))), fail)
export const watchTurns = (id, fn, fail) => onSnapshot(query(collection(db, 'editorial', id, 'turns'), orderBy('createdAt')),
  { includeMetadataChanges: true }, s => fn(s.docs.map(row)), fail)

export async function createEntry(kind, fields, id = crypto.randomUUID()) {
  await setDoc(doc(root(), id), {
    ...fields, kind, userId: uid(), archived: false, revision: 0,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return id
}

// Solo i campi modificati: una scheda aperta su due dispositivi non sovrascrive in silenzio.
export async function editEntry(entry, fields) {
  const ref = doc(root(), entry.id)
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref)
    const current = snap.data()
    if (!current || current.userId !== uid()) throw new Error('Elemento non disponibile')
    if ((current.revision || 0) !== (entry.revision || 0)) throw new Error('Modificato su un altro dispositivo. Riapri la scheda; la tua bozza resta qui.')
    if (current.kind === 'content') {
      tx.set(doc(collection(ref, 'versions')), { ...current, savedAt: serverTimestamp() })
    }
    tx.update(ref, { ...fields, revision: (current.revision || 0) + 1, updatedAt: serverTimestamp() })
  })
}
export const watchVersions = (id, fn, fail) => onSnapshot(query(collection(db, 'editorial', id, 'versions'), orderBy('savedAt', 'desc')),
  s => fn(s.docs.map(row)), fail)

export async function saveTurn(threadId, text, turnId = crypto.randomUUID()) {
  await setDoc(doc(db, 'editorial', threadId, 'turns', turnId), {
    text, state: 'pending', createdAt: serverTimestamp(),
  })
  await updateDoc(doc(root(), threadId), { updatedAt: serverTimestamp() })
  return turnId
}
export async function askEditor(threadId, turnId) {
  const token = await auth.currentUser?.getIdToken()
  if (!token) throw new Error('Sessione scaduta: accedi di nuovo')
  const res = await fetch(`${import.meta.env.VITE_AI_API_URL || ''}/api/editoriale/rispondi`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ threadId, turnId }), signal: AbortSignal.timeout(125000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Assistente non disponibile. Il messaggio è salvato.')
  return data
}
