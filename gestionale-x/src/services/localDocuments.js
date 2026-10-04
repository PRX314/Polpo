// Archivio esclusivamente locale, separato per account Firebase.
const DB = 'gestionale-documenti-v1'
const MAX_FILE = 20 * 1024 * 1024
export const MAX_BACKUP = 150 * 1024 * 1024
export const CATEGORIES = ['Documento', 'Bolletta', 'Multa', 'Tassa', 'Ricevuta', 'Contratto', 'Altro']
const listeners = new Set()
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(DB) : null
channel?.addEventListener('message', () => listeners.forEach(fn => fn()))
let opening
const database = () => opening ||= new Promise((resolve, reject) => {
  const request = indexedDB.open(DB, 1)
  request.onupgradeneeded = () => {
    const store = request.result.createObjectStore('documents', { keyPath: ['owner', 'id'] })
    store.createIndex('owner', 'owner')
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => { opening = null; reject(request.error) }
})
const changed = () => { listeners.forEach(fn => fn()); channel?.postMessage('changed') }
const ownerRequired = owner => { if (!owner) throw new Error('Accedi per aprire il tuo archivio locale.') }
async function transaction(owner, mode, operation) {
  ownerRequired(owner)
  const db = await database()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documents', mode)
    let result
    try { result = operation(tx.objectStore('documents')) } catch (e) { tx.abort(); reject(e); return }
    tx.oncomplete = () => resolve(result?.result)
    tx.onabort = tx.onerror = () => reject(tx.error || new Error('Salvataggio locale non riuscito. Controlla lo spazio disponibile.'))
  })
}
export const loadDocument = (owner, id) => transaction(owner, 'readonly', store => store.get([owner, id]))
export async function listDocuments(owner) {
  const rows = await transaction(owner, 'readonly', store => store.index('owner').getAll(owner))
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
export function watchDocuments(owner, callback, onError) {
  let active = true, generation = 0
  const refresh = async () => {
    const current = ++generation
    try {
      const rows = await listDocuments(owner)
      if (active && current === generation) callback(rows.map(({ files, ...row }) => ({ ...row, fileCount: files.length })))
    } catch (e) { if (active) onError(e) }
  }
  listeners.add(refresh); refresh()
  return () => { active = false; listeners.delete(refresh) }
}
export async function saveDocument(owner, data) {
  if (data.files.length > 100 || data.files.reduce((n, f) => n + f.size, 0) > 50 * 1024 * 1024) throw new Error('Massimo 50 MB e 100 allegati per documento. Crea un altro documento per gli altri file.')
  if (data.deadlines.length > 100) throw new Error('Massimo 100 scadenze per documento.')
  if (data.deadlines.some(s => s.date && !validDate(s.date))) throw new Error('Controlla le date delle scadenze.')
  const row = { ...data, owner, updatedAt: new Date().toISOString() }
  await transaction(owner, 'readwrite', store => store.put(row))
  changed()
  return row
}
export async function deleteDocument(owner, id) {
  await transaction(owner, 'readwrite', store => store.delete([owner, id])); changed()
}
export function newDocument(projectId = '') {
  return { id: crypto.randomUUID(), title: 'Nuovo documento', category: 'Documento', status: 'aperto', summary: '', text: '', projectId, objective: '', deadlines: [], files: [], createdAt: new Date().toISOString() }
}
export function attachments(files) {
  return Array.from(files).map(file => {
    if (!file.size || file.size > MAX_FILE) throw new Error(`${file.name}: scegli un file non vuoto fino a 20 MB.`)
    return { id: crypto.randomUUID(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, blob: file }
  })
}
export const documentDeadlines = documents => documents.filter(d => d.status !== 'chiuso').flatMap(d =>
  d.deadlines.filter(s => s.date && !s.done).map(s => ({ key: `doc-${d.id}-${s.id}`, documentId: d.id, date: s.date, time: '', reminder: null, title: `${d.title} · ${s.label || 'Scadenza'}`, type: 'documento' })))
export function download(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
export function textReport(d, projectName = '') {
  return `${d.title}\n${'='.repeat(40)}\nTipo: ${d.category}\nStato: ${d.status}\nElemento: ${projectName || d.projectId || '—'}\nObiettivo: ${d.objective || '—'}\n\nRIEPILOGO\n${d.summary || 'Da compilare'}\n\nSCADENZE CONFERMATE\n${d.deadlines.map(s => `${s.date} — ${s.label}${s.amount ? ` — € ${s.amount}` : ''} — ${s.done ? 'completata/pagata' : 'da fare'}`).join('\n') || 'Nessuna'}\n\nTESTO DEL DOCUMENTO (verificare con l’originale)\n${d.text || 'Non disponibile'}\n\nORIGINALI\n${d.files.map(f => f.name).join('\n')}\n`
}
const encodeBlob = blob => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob)
})
export async function exportBackup(owner, selectedId) {
  const rows = (await listDocuments(owner)).filter(d => !selectedId || d.id === selectedId)
  const bytes = rows.reduce((n, d) => n + d.files.reduce((m, f) => m + f.size, 0) + (d.text.length + d.summary.length) * 3, 0)
  if (bytes > MAX_BACKUP / 2) throw new Error('Archivio grande: scarica il backup di ciascun documento dal suo dettaglio (massimo 75 MB per backup).')
  const documents = []
  for (const row of rows) {
    const { owner: _owner, ...data } = row
    const files = []
    for (const { blob, ...file } of row.files) files.push({ ...file, data: await encodeBlob(blob) })
    documents.push({ ...data, files })
  }
  return new Blob([JSON.stringify({ format: DB, version: 1, exportedAt: new Date().toISOString(), documents })], { type: 'application/json' })
}
const string = (s, max = 2000000) => typeof s === 'string' && s.length <= max
const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s
export function validateBackup(data) {
  if (data?.format !== DB || data.version !== 1 || !Array.isArray(data.documents) || data.documents.length > 2000) throw new Error('Questo non è un backup Documenti compatibile.')
  const ids = new Set()
  return data.documents.map(d => {
    if (!string(d.id, 100) || !d.id || ids.has(d.id) || !string(d.title, 300) || !CATEGORIES.includes(d.category) || !['aperto', 'chiuso'].includes(d.status) || !string(d.text) || !string(d.summary) || !string(d.projectId, 200) || !string(d.objective, 2000) || !string(d.createdAt, 100) || !Array.isArray(d.deadlines) || d.deadlines.length > 100 || !Array.isArray(d.files) || d.files.length > 100) throw new Error('Backup non valido: dati del documento incompleti.')
    ids.add(d.id)
    const deadlines = d.deadlines.map(s => {
      if (!string(s.id, 100) || (s.date !== '' && !validDate(s.date)) || !string(s.label, 300) || !string(s.amount, 40) || typeof s.done !== 'boolean') throw new Error('Backup non valido: scadenza errata.')
      return { id: s.id, date: s.date, label: s.label, amount: s.amount, done: s.done }
    })
    const files = d.files.map(f => {
      if (!string(f.id, 100) || !string(f.name, 1000) || !string(f.type, 200) || !Number.isInteger(f.size) || f.size <= 0 || f.size > MAX_FILE || !string(f.data, MAX_FILE * 1.34 + 4) || !/^[A-Za-z0-9+/]*={0,2}$/.test(f.data)) throw new Error('Backup non valido: allegato errato.')
      const binary = atob(f.data)
      if (binary.length !== f.size) throw new Error('Backup incompleto: dimensione allegato errata.')
      return { id: f.id, name: f.name, type: f.type, size: f.size, blob: new Blob([Uint8Array.from(binary, c => c.charCodeAt(0))], { type: f.type }) }
    })
    if (files.reduce((n, f) => n + f.size, 0) > 50 * 1024 * 1024) throw new Error('Backup non valido: documento oltre 50 MB.')
    return { id: d.id, title: d.title, category: d.category, status: d.status, text: d.text, summary: d.summary, projectId: d.projectId, objective: d.objective, createdAt: d.createdAt, updatedAt: new Date().toISOString(), deadlines, files }
  })
}
export async function restoreBackup(owner, file) {
  if (file.size > MAX_BACKUP) throw new Error('Backup troppo grande: massimo 150 MB.')
  const rows = validateBackup(JSON.parse(await file.text()))
  let restored = 0
  await transaction(owner, 'readwrite', store => {
    for (const row of rows) {
      const get = store.get([owner, row.id])
      get.onsuccess = () => { if (!get.result) { store.add({ ...row, owner }); restored++ } }
    }
  })
  changed()
  return { restored, skipped: rows.length - restored }
}
