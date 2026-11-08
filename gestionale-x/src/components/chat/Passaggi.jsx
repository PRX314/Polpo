import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AtSign, BookOpen, CalendarDays, ChevronDown, FileText, Search } from 'lucide-react'

// Cosa ha letto Peppino prima di rispondere e come ci ha ragionato.
// Mentre lavora: una riga sola con quello che sta leggendo, e sotto scorre la coda del ragionamento.
// A risposta finita resta una riga grigia («Ha letto 2 cose · come ci ha ragionato») che si apre a
// richiesta: prima le letture erano sempre in vista, in scatoline, e si confondevano con la risposta.

const ICONA = { citato: AtSign, apri: FileText, cerca: Search, vault: BookOpen, agenda: CalendarDays }
const PREFISSO = { vault: 'nota ', agenda: 'agenda ' }
const testoDi = (passo) => `${PREFISSO[passo.tipo] || ''}${passo.testo}`

function Passo({ passo }) {
  const Icona = ICONA[passo.tipo] || FileText
  const contenuto = <><Icona size={11} aria-hidden="true" /><span>{testoDi(passo)}</span></>
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

  // Al lavoro, prima della risposta
  if (streaming && !haTesto) {
    const ultimo = unici[unici.length - 1]
    return (
      <div className="chat-passaggi is-live" aria-label="Cosa sta facendo Peppino">
        {ultimo && <p className="chat-passi-ora">Sto leggendo {testoDi(ultimo)}</p>}
        {pensiero && <p className="chat-pensiero-live" aria-live="off">{pensiero.slice(-160)}</p>}
      </div>
    )
  }
  if (streaming || (!unici.length && !ragionamento)) return null

  const letture = unici.length === 1 ? 'Ha letto 1 cosa' : unici.length ? `Ha letto ${unici.length} cose` : ''
  const riga = [letture, ragionamento && (letture ? 'come ci ha ragionato' : 'Come ci ha ragionato')].filter(Boolean).join(' · ')

  return (
    <div className="chat-passaggi">
      <button className="chat-dietro" onClick={() => setAperto(v => !v)} aria-expanded={aperto}>
        {riga} <ChevronDown size={12} aria-hidden="true" />
      </button>
      {aperto && (
        <div className="chat-dietro-dentro">
          {unici.length > 0 && (
            <div className="chat-passi" aria-label="Cosa ha letto Peppino">
              {unici.map((p, i) => <Passo key={i} passo={p} />)}
            </div>
          )}
          {ragionamento && <p className="chat-ragionamento-testo">{ragionamento}</p>}
        </div>
      )}
    </div>
  )
}
