import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useData } from '../../context/useData'
import { indiceElementi } from '../../lib/markdown'
import ChatMessage from './ChatMessage'
import TestiPronti from './TestiPronti'
import { leggiLettura, salvaLettura } from './posto'

// Solo le conversazioni salvate hanno un punto di lettura: quella nuova non ha ancora un id
const salvata = (chiave) => !String(chiave).startsWith('nuova-')

// L'elenco dei messaggi. Scorre solo lui: prima scrollIntoView spostava anche la pagina,
// e su telefono la barra in alto usciva dallo schermo a ogni risposta.
export default function ChatMessages({ chiave, messages, inAttesa, attesaTesto, onTestoPronto, ...perMessaggio }) {
  const scrollRef = useRef(null)
  const inFondo = useRef(true)
  // Fin dove hai letto: si misura mentre scorri e si scrive quando ti fermi, cambi conversazione o esci
  const lettura = useRef(null) // { chiave, punto: { i, off, fondo } }
  const fotogramma = useRef(0)
  const timer = useRef(0)
  const { projects } = useData()
  // Per riconoscere i nomi degli elementi nelle risposte ([[Ungesto]] → link)
  const indice = useMemo(() => indiceElementi(projects), [projects])

  const vaiInFondo = (morbido) => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: morbido ? 'smooth' : 'auto' })
  }

  // Il primo messaggio in vista e di quanto sporge sopra il bordo
  const misura = () => {
    fotogramma.current = 0
    const el = scrollRef.current
    if (!el || !salvata(chiave)) return
    const fondo = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    const alto = el.getBoundingClientRect().top
    let punto = { i: 0, off: 0, fondo }
    if (!fondo) {
      for (const n of el.querySelectorAll(':scope > [data-i]')) {
        const r = n.getBoundingClientRect()
        if (r.bottom > alto + 1) { punto = { i: Number(n.dataset.i), off: Math.round(r.top - alto), fondo }; break }
      }
    }
    lettura.current = { chiave, punto }
  }

  const scriviLettura = () => {
    clearTimeout(timer.current)
    cancelAnimationFrame(fotogramma.current)
    fotogramma.current = 0
    if (lettura.current) salvaLettura(lettura.current.chiave, lettura.current.punto)
    lettura.current = null
  }

  // Conversazione appena aperta: torna dove avevi smesso di leggere, se no in fondo. Senza animazione.
  // Prima si apriva sempre in fondo, anche se stavi rileggendo più su.
  useLayoutEffect(() => {
    const el = scrollRef.current
    const punto = salvata(chiave) ? leggiLettura(chiave) : null
    const n = punto && !punto.fondo && el?.querySelector(`:scope > [data-i="${punto.i}"]`)
    if (n) {
      el.scrollTop += n.getBoundingClientRect().top - el.getBoundingClientRect().top - punto.off
      inFondo.current = false
    } else {
      inFondo.current = true
      vaiInFondo(false)
    }
    return scriviLettura
  }, [chiave])

  // Nuovi messaggi: segue se eri già in fondo o se hai appena scritto tu.
  // Se stai rileggendo più su, non ti sposta.
  const ultimo = messages[messages.length - 1]
  useEffect(() => {
    if (inFondo.current || ultimo?.role === 'user') vaiInFondo(true)
  }, [messages.length, inAttesa, ultimo?.role])

  // Risposta in arrivo (passi letti, poi testo): la segue senza animazione, cresce a ogni fotogramma
  const inScrittura = !!ultimo?.streaming
  const crescita = inScrittura ? `${ultimo.content.length}|${ultimo.passi?.length || 0}` : ''
  useEffect(() => {
    if (crescita && inFondo.current) vaiInFondo(false)
  }, [crescita])

  const onScroll = () => {
    const el = scrollRef.current
    inFondo.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    fotogramma.current ||= requestAnimationFrame(misura)
    clearTimeout(timer.current)
    timer.current = setTimeout(scriviLettura, 400)
  }

  return (
    <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
      {messages.length === 0 && !inAttesa && (
        <div className="chat-welcome">
          <h2>Ciao, sono Polpo</h2>
          <p className="muted">Conosco i tuoi progetti, le cose da fare e l&apos;agenda. Se c&apos;è da salvare qualcosa te lo propongo qui sotto la risposta: confermi tu.</p>
          <TestiPronti onUsa={onTestoPronto} />
        </div>
      )}

      {messages.map((msg, i) => (
        <ChatMessage key={`${msg.timestamp}-${i}`} msg={msg} indice={i} indiceElementi={indice} {...perMessaggio} />
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
