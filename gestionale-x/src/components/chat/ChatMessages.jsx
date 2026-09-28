import { useEffect, useLayoutEffect, useRef } from 'react'
import ChatMessage from './ChatMessage'

const SUGGERIMENTI = [
  { label: 'Oggi', msg: 'Cosa dovrei fare oggi? Guarda agenda e progetti in corso.' },
  { label: 'Priorità', msg: 'Quali sono le 3 priorità principali per questa settimana?' },
  { label: 'Riepilogo', msg: 'Fammi un riepilogo dei progetti in corso e di cosa manca a ciascuno' },
  { label: 'Idee', msg: 'Analizza i miei progetti e suggeriscimi idee o miglioramenti' }
]

// L'elenco dei messaggi. Scorre solo lui: prima scrollIntoView spostava anche la pagina,
// e su telefono la barra in alto usciva dallo schermo a ogni risposta.
export default function ChatMessages({ chiave, messages, inAttesa, attesaTesto, onSuggerimento, ...perMessaggio }) {
  const scrollRef = useRef(null)
  const inFondo = useRef(true)

  const vaiInFondo = (morbido) => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: morbido ? 'smooth' : 'auto' })
  }

  // Conversazione appena aperta: subito in fondo, senza animazione
  useLayoutEffect(() => {
    inFondo.current = true
    vaiInFondo(false)
  }, [chiave])

  // Nuovi messaggi: segue se eri già in fondo o se hai appena scritto tu.
  // Se stai rileggendo più su, non ti sposta.
  const ultimo = messages[messages.length - 1]
  useEffect(() => {
    if (inFondo.current || ultimo?.role === 'user') vaiInFondo(true)
  }, [messages.length, inAttesa, ultimo?.role])

  // Risposta che si sta scrivendo: la segue senza animazione (a ogni fotogramma cresce un po')
  const inScrittura = ultimo?.streaming ? ultimo.content.length : 0
  useEffect(() => {
    if (inScrittura && inFondo.current) vaiInFondo(false)
  }, [inScrittura])

  const onScroll = () => {
    const el = scrollRef.current
    inFondo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  return (
    <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
      {messages.length === 0 && !inAttesa && (
        <div className="chat-welcome">
          <h2>Ciao, sono Polpo</h2>
          <p className="muted">Conosco i tuoi progetti, le cose da fare e l&apos;agenda. Se c&apos;è da salvare qualcosa te lo propongo qui sotto la risposta: confermi tu.</p>
          <div className="chat-suggest">
            {SUGGERIMENTI.map(s => <button key={s.label} className="btn" onClick={() => onSuggerimento(s.msg)}>{s.label}</button>)}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <ChatMessage key={`${msg.timestamp}-${i}`} msg={msg} indice={i} {...perMessaggio} />
      ))}

      {inAttesa && !inScrittura && (
        <div className="chat-msg assistant" role="status">
          <div className="chat-bubble">
            <span className="chat-typing" aria-hidden="true"><i /><i /><i /></span>
            <span className="small muted"> {attesaTesto}</span>
          </div>
        </div>
      )}
    </div>
  )
}
