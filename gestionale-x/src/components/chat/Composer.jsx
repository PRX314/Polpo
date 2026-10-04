import { useMemo, useRef, useState } from 'react'
import { ArrowUp, AtSign, X } from 'lucide-react'
import { useData } from '../../context/useData'
import { STATUS_LABEL, normalizeStatus } from '../../lib/status'

const suTelefono = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// "@" seguito da quello che stai scrivendo, subito prima del cursore
const MENZIONE = /(?:^|\s)@([^\n@]{0,40})$/
const MAX_CITATI = 6

// Il campo per scrivere. Resta sempre attivo, anche mentre Polpo risponde: prima si disattivava,
// su iPhone la tastiera si chiudeva e poi si riapriva da sola a ogni risposta (con lo zoom).
//
// Con @ si cita un elemento: si apre l'elenco, scegli, e Polpo riceve la sua scheda completa
// (più la nota del vault). Le citazioni sono sopra il campo e si tolgono con la ×.
export default function Composer({ onInvia, occupato, inAttesa }) {
  const { projects } = useData()
  const [testo, setTesto] = useState('')
  const [citati, setCitati] = useState([])
  const [menu, setMenu] = useState(null) // { query, inizio, scelta }
  const ref = useRef(null)

  const adatta = (el) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  // Elementi che corrispondono a quello che segue la @: prima chi inizia così, poi gli attivi
  const proposte = useMemo(() => {
    if (!menu) return []
    const q = norm(menu.query.trim())
    return projects
      .filter(p => p.name && (!q || norm(p.name).includes(q)))
      .map(p => ({ p, s: (q && norm(p.name).startsWith(q) ? 2 : 0) + (p.archived ? -3 : 0) + (p.pinned ? 1 : 0) }))
      .sort((a, b) => b.s - a.s || (b.p.updatedAt?.toMillis?.() || 0) - (a.p.updatedAt?.toMillis?.() || 0))
      .slice(0, 7)
      .map(x => x.p)
  }, [menu, projects])

  const leggiMenzione = (el) => {
    const prima = el.value.slice(0, el.selectionStart)
    const m = prima.match(MENZIONE)
    if (!m) return setMenu(null)
    setMenu(cur => ({ query: m[1], inizio: el.selectionStart - m[1].length - 1, scelta: cur?.query === m[1] ? cur.scelta : 0 }))
  }

  const scegli = (p) => {
    const el = ref.current
    if (!el || !menu) return
    const fine = el.selectionStart
    const nuovo = `${testo.slice(0, menu.inizio)}@${p.name} ${testo.slice(fine)}`
    const cursore = menu.inizio + p.name.length + 2
    setTesto(nuovo)
    setCitati(c => (c.some(x => x.id === p.id) ? c : [...c, { id: p.id, nome: p.name }].slice(-MAX_CITATI)))
    setMenu(null)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursore, cursore)
      adatta(el)
    })
  }

  // Il bottone @: per il telefono, dove la chiocciola è sepolta nella tastiera
  const apriMenu = () => {
    const el = ref.current
    if (!el) return
    const pos = el.selectionStart ?? testo.length
    const serveSpazio = pos > 0 && !/\s/.test(testo[pos - 1])
    const inserito = `${serveSpazio ? ' ' : ''}@`
    const nuovo = testo.slice(0, pos) + inserito + testo.slice(pos)
    setTesto(nuovo)
    setMenu({ query: '', inizio: pos + inserito.length - 1, scelta: 0 })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(pos + inserito.length, pos + inserito.length)
    })
  }

  const invia = () => {
    if (!testo.trim() || occupato) return
    // Valgono le citazioni ancora scritte nel testo
    onInvia(testo, citati.filter(c => testo.includes(`@${c.nome}`)))
    setTesto('')
    setCitati([])
    setMenu(null)
    if (ref.current) ref.current.style.height = 'auto'
  }

  // Col computer: Invio invia, Maiusc+Invio va a capo. Su telefono Invio va a capo e si invia col tasto.
  // Con l'elenco @ aperto: frecce per scegliere, Invio o Tab per citare, Esc per chiudere.
  const onKeyDown = (e) => {
    if (menu && proposte.length) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const d = e.key === 'ArrowDown' ? 1 : -1
        setMenu(m => ({ ...m, scelta: (m.scelta + d + proposte.length) % proposte.length }))
        return
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
        e.preventDefault()
        scegli(proposte[menu.scelta] || proposte[0])
        return
      }
    }
    if (menu && e.key === 'Escape') {
      e.preventDefault()
      setMenu(null)
      return
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !suTelefono()) {
      e.preventDefault()
      invia()
    }
  }

  const togli = (id) => {
    const c = citati.find(x => x.id === id)
    setCitati(cs => cs.filter(x => x.id !== id))
    if (c) setTesto(t => t.replace(`@${c.nome} `, '').replace(`@${c.nome}`, ''))
  }

  return (
    <div className="chat-input">
      {menu && proposte.length > 0 && (
        <ul className="chat-menzioni" role="listbox" aria-label="Cita un elemento">
          {proposte.map((p, i) => (
            <li key={p.id} role="option" aria-selected={i === menu.scelta}>
              <button
                type="button" className={`chat-menzione ${i === menu.scelta ? 'is-on' : ''}`}
                onMouseDown={(e) => e.preventDefault()} onClick={() => scegli(p)}
              >
                <span className="chat-menzione-nome">{p.name}</span>
                <span className="chat-menzione-info">{p.type || 'progetto'} · {p.archived ? 'archiviato' : STATUS_LABEL[normalizeStatus(p.status)].toLowerCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {citati.length > 0 && (
        <div className="chat-citati" aria-label="Elementi citati">
          <span className="chat-citati-label">Polpo legge per intero</span>
          {citati.map(c => (
            <span key={c.id} className="chat-citato">
              @{c.nome}
              <button type="button" onClick={() => togli(c.id)} aria-label={`Togli ${c.nome}`}><X size={11} /></button>
            </span>
          ))}
        </div>
      )}

      <div className="chat-input-row">
        <button type="button" className="btn-icon chat-at" onClick={apriMenu} aria-label="Cita un elemento" title="Cita un elemento (@)">
          <AtSign size={16} />
        </button>
        <textarea
          ref={ref} rows={1} value={testo} placeholder="Scrivi a Polpo · @ per citare un elemento" aria-label="Messaggio"
          aria-expanded={!!menu} aria-autocomplete="list"
          onChange={(e) => { setTesto(e.target.value); adatta(e.target); leggiMenzione(e.target) }}
          onKeyDown={onKeyDown}
          onClick={(e) => leggiMenzione(e.target)}
          onBlur={() => setMenu(null)}
        />
        <button className="btn btn-primary" onClick={invia} disabled={!testo.trim() || occupato} aria-label="Invia">
          {inAttesa ? <span className="spinner" aria-hidden="true" /> : <ArrowUp size={16} />}
        </button>
      </div>
      <p className="small faint chat-hint">Invio per inviare · Maiusc+Invio per andare a capo · @ per citare un elemento</p>
    </div>
  )
}
