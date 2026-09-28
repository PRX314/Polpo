import { useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'

const suTelefono = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches

// Il campo per scrivere. Resta sempre attivo, anche mentre Polpo risponde: prima si disattivava,
// su iPhone la tastiera si chiudeva e poi si riapriva da sola a ogni risposta (con lo zoom).
export default function Composer({ onInvia, occupato, inAttesa }) {
  const [testo, setTesto] = useState('')
  const ref = useRef(null)

  const adatta = (el) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const invia = () => {
    if (!testo.trim() || occupato) return
    onInvia(testo)
    setTesto('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  // Col computer: Invio invia, Maiusc+Invio va a capo. Su telefono Invio va a capo e si invia col tasto.
  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !suTelefono()) {
      e.preventDefault()
      invia()
    }
  }

  return (
    <div className="chat-input">
      <div className="chat-input-row">
        <textarea
          ref={ref} rows={1} value={testo} placeholder="Scrivi a Polpo" aria-label="Messaggio"
          onChange={(e) => { setTesto(e.target.value); adatta(e.target) }} onKeyDown={onKeyDown}
        />
        <button className="btn btn-primary" onClick={invia} disabled={!testo.trim() || occupato} aria-label="Invia">
          {inAttesa ? <span className="spinner" aria-hidden="true" /> : <ArrowUp size={16} />}
        </button>
      </div>
      <p className="small faint chat-hint">Invio per inviare · Maiusc+Invio per andare a capo</p>
    </div>
  )
}
