// Appunti: testo, registrazioni e disegni, sincronizzati tra telefono e PC.
//
// Stanno nella collection `notes`, quella delle note di prima (non più letta dal 2026-10-04):
// ha già le regole giuste, così non serve pubblicare regole nuove. Si distinguono da `kind`:
//   kind 'appunto'       l'appunto: title, text, blocks, deletedAt
//   kind 'appunto-file'  un pezzo di file (audio, disegno, foto), id `${fileId}_${n}`
// I file stanno dentro Firestore a pezzi da 700 kB (un documento arriva al massimo a 1 MiB),
// come Bytes: niente link pubblici come su Cloudinary, e la cache offline li tiene sul telefono.
//
// blocks: [{ id, type: 'audio', file, durata, createdAt, trascrizione, trascrizioneErrore }]
//         [{ id, type: 'disegno', file (immagine finita), tratti (JSON), foto?, sfondo, createdAt }]
// file = { fileId, mime, size, parti }
//
// Eliminare manda nel cestino (deletedAt); dopo 30 giorni l'appunto e i suoi file spariscono.

import {
  Bytes, Timestamp, addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, updateDoc, where
} from 'firebase/firestore'
import { auth, db } from '../firebase'

const notes = collection(db, 'notes')
const PEZZO = 700 * 1024
export const GIORNI_CESTINO = 30

const uid = () => {
  if (!auth.currentUser) throw new Error('Accedi per usare gli appunti')
  return auth.currentUser.uid
}
const iso = (v) => (v?.toDate?.() ? v.toDate().toISOString() : (v || new Date().toISOString()))
export const nuovoId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

export const subscribeToAppunti = (callback, onError) => {
  if (!auth.currentUser) { callback([]); return () => {} }
  const q = query(notes, where('userId', '==', auth.currentUser.uid), where('kind', '==', 'appunto'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => {
      const data = d.data()
      return { id: d.id, ...data, blocks: data.blocks || [], createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt) }
    }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  }, (err) => { console.error('Appunti:', err); onError?.(err) })
}

export const creaAppunto = async (extra = {}) => {
  const ref = await addDoc(notes, {
    userId: uid(), kind: 'appunto', title: '', text: '', blocks: [], deletedAt: null,
    ...extra,
    createdAt: Timestamp.now(), updatedAt: Timestamp.now()
  })
  return ref.id
}

export const aggiornaAppunto = (id, patch) => updateDoc(doc(db, 'notes', id), { ...patch, updatedAt: Timestamp.now() })

// I blocchi si cambiano rileggendo l'appunto (dalla cache se offline): una trascrizione che arriva
// dopo dieci secondi non cancella il disegno aggiunto nel frattempo.
const conBlocchi = async (id, cambia) => {
  const snap = await getDoc(doc(db, 'notes', id))
  if (!snap.exists()) throw new Error('Appunto non trovato')
  return aggiornaAppunto(id, { blocks: cambia(snap.data().blocks || []) })
}
export const aggiungiBlocco = (id, blocco) => conBlocchi(id, bs => [...bs, blocco])
export const aggiornaBlocco = (id, bid, patch) => conBlocchi(id, bs => bs.map(b => (b.id === bid ? { ...b, ...patch } : b)))
export const sostituisciBlocco = (id, blocco) => conBlocchi(id, bs => bs.map(b => (b.id === blocco.id ? blocco : b)))
export const togliBlocco = (id, bid) => conBlocchi(id, bs => bs.filter(b => b.id !== bid))

export const nelCestino = (id) => aggiornaAppunto(id, { deletedAt: new Date().toISOString() })
export const ripristina = (id) => aggiornaAppunto(id, { deletedAt: null })

const filesDi = (a) => (a.blocks || []).flatMap(b => [b.file, b.tratti, b.foto].filter(Boolean))

export const eliminaPerSempre = async (a) => {
  await Promise.all(filesDi(a).map(eliminaFile))
  await deleteDoc(doc(db, 'notes', a.id))
}

// Chiamata all'apertura della lista: svuota il cestino di quello più vecchio di 30 giorni
export const svuotaScaduti = (appunti) => {
  const limite = Date.now() - GIORNI_CESTINO * 86400000
  appunti.filter(a => a.deletedAt && new Date(a.deletedAt).getTime() < limite)
    .forEach(a => eliminaPerSempre(a).catch(e => console.error('Cestino:', e)))
}

// ── File a pezzi ──
// Le scritture non si aspettano: offline restano in coda nella cache di Firestore e partono
// appena torna la rete. Nel frattempo il file si rilegge dalla memoria di questa sessione.

const memoria = new Map()

export const salvaFile = (noteId, blob) => {
  const owner = uid()
  const fileId = nuovoId()
  const mime = blob.type || 'application/octet-stream'
  memoria.set(fileId, blob)
  const meta = { fileId, mime, size: blob.size, parti: Math.max(1, Math.ceil(blob.size / PEZZO)) }
  const scritto = blob.arrayBuffer().then(buf => {
    const bytes = new Uint8Array(buf)
    return Promise.all(Array.from({ length: meta.parti }, (_, i) => setDoc(doc(db, 'notes', `${fileId}_${i}`), {
      userId: owner, kind: 'appunto-file', noteId, fileId, parte: i, parti: meta.parti, mime,
      data: Bytes.fromUint8Array(bytes.subarray(i * PEZZO, (i + 1) * PEZZO)),
      createdAt: Timestamp.now()
    })))
  })
  scritto.catch(e => console.error('Salvataggio file:', e))
  return { meta, scritto }
}

export const leggiFile = async (meta) => {
  if (!meta) return null
  if (memoria.has(meta.fileId)) return memoria.get(meta.fileId)
  const parti = await Promise.all(Array.from({ length: meta.parti }, (_, i) => getDoc(doc(db, 'notes', `${meta.fileId}_${i}`))))
  if (parti.some(p => !p.exists())) throw new Error('File non ancora arrivato su questo dispositivo: riprova tra poco')
  const blob = new Blob(parti.map(p => p.data().data.toUint8Array()), { type: meta.mime })
  memoria.set(meta.fileId, blob)
  return blob
}

export const eliminaFile = (meta) => {
  memoria.delete(meta.fileId)
  return Promise.all(Array.from({ length: meta.parti }, (_, i) => deleteDoc(doc(db, 'notes', `${meta.fileId}_${i}`))))
}

// ── Trascrizione ──
// Stesso servizio delle note vocali di Documenti: l'audio passa dal backend a Whisper (Groq)
// solo per essere trascritto, non viene conservato lì.

const API_URL = import.meta.env.VITE_AI_API_URL || ''

export const trascrivi = async (blob) => {
  const token = await auth.currentUser?.getIdToken?.()
  let res
  try {
    res = await fetch(`${API_URL}/api/trascrivi`, {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'audio/webm', ...(token && { Authorization: `Bearer ${token}` }) },
      body: blob
    })
  } catch {
    throw new Error('Serve la rete per trascrivere. La registrazione è salvata: riprova dopo.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Trascrizione non riuscita (errore ${res.status})`)
  return (data.testo || '').trim()
}

// Una registrazione: il file parte subito verso Firestore, poi la trascrizione completa il blocco
export async function aggiungiRegistrazione(noteId, file, inizio) {
  const { meta } = salvaFile(noteId, file)
  const blocco = { id: nuovoId(), type: 'audio', file: meta, createdAt: inizio.toISOString(), trascrizione: '', stato: 'trascrivo' }
  await aggiungiBlocco(noteId, blocco)
  try {
    const testo = await trascrivi(file)
    await aggiornaBlocco(noteId, blocco.id, { trascrizione: testo, stato: testo ? 'ok' : 'vuota', errore: '' })
  } catch (e) {
    await aggiornaBlocco(noteId, blocco.id, { stato: 'errore', errore: e.message })
  }
}
