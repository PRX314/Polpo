import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  subscribeToProjects, subscribeToRoutine, subscribeToEvents,
  addProject, updateProject, deleteProject
} from '../firebaseService'
import { auth } from '../firebase'
import { watchDocuments } from '../services/localDocuments'
import { NOTE_TYPES } from '../itemTypes'
import { useToast } from './useToast'
import { DataContext } from './dataContext'

// Un solo posto che ascolta Firestore e distribuisce i dati alle pagine.
// Prima App.jsx teneva tutto in sé e ogni schermata si iscriveva per conto suo.
export const DataProvider = ({ children }) => {
  const toast = useToast()
  const [projects, setProjects] = useState(null)   // null = non ancora caricati
  const [routine, setRoutine] = useState(undefined) // undefined = in caricamento, null = nessuna, false = errore di lettura
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState('')
  useEffect(() => watchDocuments(auth.currentUser.uid, rows => { setDocuments(rows); setDocumentsLoading(false); setDocumentsError('') }, () => { setDocumentsLoading(false); setDocumentsError('Archivio locale non disponibile. Verifica le impostazioni del browser.') }), [])
  const [events, setEvents] = useState([])

  useEffect(() => {
    const unsubs = [
      subscribeToProjects(setProjects, () => toast.err('Errore nel caricamento dei progetti')),
      subscribeToRoutine(setRoutine, () => setRoutine(false)),
      subscribeToEvents(setEvents, () => {})
    ]
    return () => unsubs.forEach(u => u())
  }, [toast])

  // Senza tipo = progetto
  const items = useMemo(
    () => (projects || []).map(p => ({ ...p, type: p.type || 'progetto' })),
    [projects]
  )

  const tagCounts = useMemo(() => {
    const map = {}
    items.forEach(p => (p.tags || []).forEach(t => { map[t] = (map[t] || 0) + 1 }))
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [items])

  // Note e idee collegate a un progetto: gli elementi di tipo nota/idea con un tag in comune.
  // Le note del vecchio formato (collezione `notes`) non si leggono più dal 2026-10-04: sono state
  // copiate nel vault, in 00-Inbox/2026-10-04 Note vecchie dal gestionale.md.
  const notesOf = useCallback((project) => {
    if (!project) return []
    const shares = (tags) => (tags || []).some(t => project.tags?.includes(t))
    return items
      .filter(p => p.id !== project.id && NOTE_TYPES.includes(p.type) && shares(p.tags))
      .map(p => ({ ...p, title: p.name, content: p.description, projectTags: p.tags }))
  }, [items])

  const guard = useCallback(async (fn, okText, errText) => {
    try {
      await fn()
      if (okText) toast.ok(okText)
      return true
    } catch (e) {
      console.error(errText, e)
      toast.err(errText)
      return false
    }
  }, [toast])

  const actions = useMemo(() => ({
    update: (id, patch) => updateProject(id, patch),
    togglePin: (p) => guard(() => updateProject(p.id, { pinned: !p.pinned }), null, 'Non sono riuscito a fissare l\'elemento'),
    toggleArchive: (p) => guard(
      () => updateProject(p.id, { archived: !p.archived }),
      p.archived ? 'Elemento ripristinato' : 'Elemento archiviato',
      'Non sono riuscito ad archiviare'
    ),
    duplicate: (p) => guard(async () => {
      const { id, createdAt, updatedAt, ...data } = p
      await addProject({ ...data, name: `${data.name} (copia)`, pinned: false, archived: false })
    }, 'Elemento duplicato', 'Non sono riuscito a duplicare'),
    remove: (p) => guard(() => deleteProject(p.id), 'Elemento eliminato', 'Eliminazione non riuscita')
  }), [guard])

  const value = useMemo(() => ({
    loading: projects === null,
    projects: projects || [],
    items, routine, events, tagCounts, notesOf, actions, documents, documentsLoading, documentsError
  }), [projects, items, routine, events, tagCounts, notesOf, actions, documents, documentsLoading, documentsError])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
