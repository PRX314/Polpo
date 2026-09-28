import { useCallback, useEffect, useRef, useState } from 'react'
import { History, Plus, X } from 'lucide-react'
import { getSpecialists } from '../../services/chatService'
import { useChat } from './useChat'
import { useModelli } from './useModelli'
import { nomeAssistente as nomeDa } from './assistenti'
import ChatSettings from './ChatSettings'
import ChatMessages from './ChatMessages'
import Composer from './Composer'
import ConversationList from './ConversationList'
import ParlaView from './ParlaView'
import './AiChat.css'
import '../prose.css'

const MODO_KEY = 'polpo.chatModo' // 'scrivi' | 'parla'

const modoSalvato = () => {
  try { return localStorage.getItem(MODO_KEY) === 'parla' ? 'parla' : 'scrivi' } catch { return 'scrivi' }
}

// La chat con Polpo. In alto: di quale conversazione si tratta, chi risponde, Scrivi o Parla.
// La logica sta in useChat; qui c'è solo come si dispone.
export default function AiChat({ initialMessage, onInitialMessageConsumed }) {
  const chat = useChat({ ripristina: !initialMessage })
  const modelli = useModelli()
  const [specialisti, setSpecialisti] = useState([])
  const [modo, setModo] = useState(modoSalvato)
  const [storico, setStorico] = useState(false)

  useEffect(() => { getSpecialists().then(setSpecialisti).catch(() => {}) }, [])
  useEffect(() => { try { localStorage.setItem(MODO_KEY, modo) } catch { /* storage non disponibile */ } }, [modo])

  const invia = (testo, opzioni = {}) =>
    chat.invia(testo, { assistente: chat.assistente, targets: modelli.targets, ...opzioni })

  // Il messaggio scritto nella pagina Oggi parte da solo, in una conversazione nuova
  const iniziale = useRef(false)
  useEffect(() => {
    if (!initialMessage || iniziale.current) return
    iniziale.current = true
    invia(initialMessage)
    onInitialMessageConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage])

  // Per la conversazione a voce: le azioni lette al momento, non quando è partito l'ascolto
  const azioniRef = useRef(null)
  azioniRef.current = chat.azioniVoce

  const nomeAssistente = useCallback((id) => nomeDa(specialisti, id), [specialisti])
  const riprova = useCallback(
    (i) => chat.riprova(i, { assistente: chat.assistente, targets: modelli.targets }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chat.riprova, chat.assistente, modelli.targets]
  )

  const titolo = chat.convId
    ? chat.conversations.find(c => c.id === chat.convId)?.title || 'Conversazione'
    : 'Nuova conversazione'

  return (
    <div className="chat">
      <header className="chat-bar">
        <button className="btn-icon" onClick={() => setStorico(v => !v)} aria-label="Conversazioni" aria-expanded={storico}>
          <History size={18} />
        </button>
        <div className="chat-head">
          <h1 className="chat-title">{titolo}</h1>
          <ChatSettings specialisti={specialisti} assistente={chat.assistente} onAssistente={chat.setAssistente} modelli={modelli} />
        </div>
        <div className="chat-modo chips" role="tablist" aria-label="Modo">
          <button role="tab" aria-selected={modo === 'scrivi'} className={`chip ${modo === 'scrivi' ? 'is-active' : ''}`} onClick={() => setModo('scrivi')}>Scrivi</button>
          <button role="tab" aria-selected={modo === 'parla'} className={`chip ${modo === 'parla' ? 'is-active' : ''}`} onClick={() => setModo('parla')}>Parla</button>
        </div>
        <button className="btn btn-sm" onClick={() => { chat.nuova(); setStorico(false) }} aria-label="Nuova conversazione">
          <Plus size={14} /> <span className="chat-new-label">Nuova</span>
        </button>
      </header>

      <div className="chat-body">
        {storico && (
          <ConversationList
            conversations={chat.conversations} attiva={chat.convId}
            onApri={(conv) => { chat.apri(conv); setStorico(false) }}
            onElimina={chat.elimina} onChiudi={() => setStorico(false)}
          />
        )}

        <div className="chat-main">
          {chat.errore && (
            <div className="form-error chat-errore" role="alert">
              <span className="grow">{chat.errore}</span>
              <button className="btn-icon sm" onClick={() => chat.setErrore('')} aria-label="Chiudi"><X size={14} /></button>
            </div>
          )}

          {modo === 'parla' ? (
            <ParlaView invia={(testo) => invia(testo, { voce: true })} azioni={azioniRef} />
          ) : (
            <>
              <ChatMessages
                chiave={chat.chiave} messages={chat.messages}
                inAttesa={chat.inAttesaQui}
                attesaTesto={modelli.targets.length > 1 ? `${modelli.targets.length} modelli stanno rispondendo…` : 'Polpo sta pensando…'}
                onSuggerimento={(msg) => invia(msg)}
                nomeAssistente={nomeAssistente} occupato={chat.occupato}
                onRiprova={riprova} onAlternativa={chat.scegliAlternativa}
                onConferma={chat.conferma} onRifiuta={chat.rifiuta}
              />
              <Composer onInvia={(testo) => invia(testo)} occupato={chat.occupato} inAttesa={chat.inAttesaQui} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
