import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useData } from '../context/useData'
import TypeTag from '../components/ui/TypeTag'
import { NOTE_TYPES } from '../itemTypes'

const match = (q, ...fields) => fields.some(f => (f || '').toString().toLowerCase().includes(q))

const GlobalSearch = () => {
  const { items, notes } = useData()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)          // risultati aperti
  const [expanded, setExpanded] = useState(false)  // solo telefono: barra a tutta larghezza
  const inputRef = useRef(null)
  const wrapRef = useRef(null)

  const query = q.trim().toLowerCase()

  const results = useMemo(() => {
    if (query.length < 2) return { items: [], notes: [] }
    const found = items.filter(p =>
      match(query, p.name, p.description, p.roadmap, p.obiettivi, p.cartella) ||
      p.tags?.some(t => match(query, t)) ||
      p.sections?.some(s => match(query, s.title, s.content)) ||
      p.todos?.some(t => match(query, t.text))
    )
    const legacy = notes.filter(n => match(query, n.title, n.content) || n.projectTags?.some(t => match(query, t)))
    return { items: found, notes: legacy.filter(n => !found.some(p => p.id === n.id)) }
  }, [query, items, notes])

  const total = results.items.length + results.notes.length

  // "/" porta subito alla ricerca, come nelle app professionali
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        e.preventDefault()
        setExpanded(true)
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const close = () => { setQ(''); setOpen(false); setExpanded(false) }
  const go = (path) => { navigate(path); close() }

  return (
    <>
      <button
        className="btn-icon search-toggle" aria-label="Cerca"
        onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 0) }}
      >
        <Search size={18} />
      </button>
      <div className={`search ${expanded ? 'is-expanded' : ''}`} ref={wrapRef}>
        <Search size={16} className="search-icon" aria-hidden="true" />
        <input
          ref={inputRef} type="search" value={q} placeholder="Cerca ovunque  ( / )" aria-label="Cerca ovunque"
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') { close(); e.currentTarget.blur() } }}
        />
        <button className="btn-icon search-close" aria-label="Chiudi ricerca" onClick={close}><X size={18} /></button>

        {open && query.length >= 2 && (
          <div className="search-results" role="listbox">
            {total === 0 && <div className="search-empty">Nessun risultato per “{q.trim()}”</div>}
            {results.items.slice(0, 8).map(p => (
              <button key={p.id} className="search-item" role="option" onClick={() => go(`/elementi/${p.id}`)}>
                <span className="grow trunc">{p.name}</span>
                <TypeTag type={p.type} />
              </button>
            ))}
            {results.items.length > 8 && (
              <button className="search-item" onClick={() => go(`/elementi?q=${encodeURIComponent(q.trim())}`)}>
                Vedi tutti i {results.items.length} risultati
              </button>
            )}
            {results.notes.slice(0, 4).map(n => (
              <button key={n.id} className="search-item" role="option" onClick={() => go(`/elementi?q=${encodeURIComponent(n.title || q.trim())}`)}>
                <span className="grow trunc">{n.title}</span>
                <span className="tag tag-type">{NOTE_TYPES.includes(n.type) ? n.type : 'nota'}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default GlobalSearch
