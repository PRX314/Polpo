import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AtSign, BookOpen, CalendarDays, ChevronDown, FileText, Search } from 'lucide-react'

// Cosa ha letto Polpo prima di rispondere (sempre in vista) e come ci ha ragionato (si apre a richiesta).
// Mentre lavora: i passi compaiono uno alla volta e sotto scorre la coda del ragionamento.

const ICONA = { citato: AtSign, apri: FileText, cerca: Search, vault: BookOpen, agenda: CalendarDays }
const PREFISSO = { vault: 'nota ', agenda: 'agenda ' }

function Passo({ passo }) {
  const Icona = ICONA[passo.tipo] || FileText
  const testo = `${PREFISSO[passo.tipo] || ''}${passo.testo}`
  const contenuto = <><Icona size={11} aria-hidden="true" /><span>{testo}</span></>
  return passo.id
    ? <Link to={`/elementi/${passo.id}`} className="chat-passo is-link" title="Apri l'elemento">{contenuto}</Link>
    : <span className="chat-passo">{contenuto}</span>
}

export default function Passaggi({ passi = [], ragionamento = '', pensiero = '', streaming = false, haTesto = false }) {
  const [aperto, setAperto] = useState(false)
  if (!passi.length && !ragionamento && !(streaming && pensiero)) return null

  // La stessa cosa letta due volte (citata e poi riaperta) si mostra una volta
  const visti = new Set()
  const unici = passi.filter(p => {
    const k = `${p.tipo === 'citato' ? 'apri' : p.tipo}|${p.id || p.percorso || p.testo}`
    if (visti.has(k)) return false
    visti.add(k)
    return true
  })

  return (
    <div className={`chat-passaggi ${streaming ? 'is-live' : ''}`}>
      {unici.length > 0 && (
        <div className="chat-passi" aria-label="Cosa ha letto Polpo">
          <span className="chat-passi-label">{streaming && !haTesto ? 'Sto leggendo' : 'Ha letto'}</span>
          {unici.map((p, i) => <Passo key={i} passo={p} />)}
        </div>
      )}

      {streaming && !haTesto && pensiero && (
        <p className="chat-pensiero-live" aria-live="off">{pensiero.slice(-160)}</p>
      )}

      {!streaming && ragionamento && (
        <div className="chat-ragionamento">
          <button className="chat-ragionamento-btn" onClick={() => setAperto(v => !v)} aria-expanded={aperto}>
            <ChevronDown size={12} aria-hidden="true" /> {aperto ? 'Nascondi il ragionamento' : 'Come ci ha ragionato'}
          </button>
          {aperto && <p className="chat-ragionamento-testo">{ragionamento}</p>}
        </div>
      )}
    </div>
  )
}
