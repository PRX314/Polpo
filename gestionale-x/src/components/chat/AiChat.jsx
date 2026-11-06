import { useCallback, useEffect, useRef, useState } from 'react'
import { House, Plus, X } from 'lucide-react'
import { getSpecialists } from '../../services/chatService'
import { useChat } from './useChat'
import { useModelli } from './useModelli'
import { nomeAssistente as nomeDa } from './assistenti'
import { leggiPosto, salvaPosto } from './posto'
import ChatSettings from './ChatSettings'
import ChatMessages from './ChatMessages'
import Composer from './Composer'
import ChatHome from './ChatHome'
import ParlaView from './ParlaView'
import './AiChat.css'
import '../prose.css'

const MODO_KEY = 'polpo.chatModo' // 'scrivi' | 'parla'

const modoSalvato = () => {
  try { return localStorage.getItem(MODO_KEY) === 'parla' ? 'parla' : 'scrivi' } catch { return 'scrivi' }
}

// La chat con Peppino. Due schermate: la home (testi pronti e tutte le conversazioni) e la
// conversazione, con in alto il tasto per tornare alla home, chi risponde, Scrivi o Parla.
// Riaprendo la chat ritrovi quello che avevi lasciato: la home, o la conversazione al punto in cui
// leggevi e con quello che stavi scrivendo (vedi posto.js).
// La logica sta in useChat; qui c'è solo come si dispone.
export default function AiChat({ initialMessage, onInitialMessageConsumed }) {
  // Col messaggio scritto in Oggi si parte da una conversazione nuova, se no da dove eri
  const [posto] = useState(() => (initialMessage ? 'nuova' : leggiPosto()))
  const [inHome, setInHome] = useState(posto === 'home')
  const chat = useChat({ ripristina: posto !== 'home' && posto !== 'nuova', preferita: posto })
  const modelli = useModelli()
  const [specialisti, setSpecialisti] = useState([])
  const [modo, setModo] = useState(modoSalvato)
  const [incolla, setIncolla] = useState(null) // il testo pronto che il campo deve prendere

  useEffect(() => { getSpecialists().then(setSpecialisti).catch(() => {}) }, [])
  useEffect(() => { try { localStorage.setItem(MODO_KEY, modo) } catch { /* storage non disponibile */ } }, [modo])

  // La conversazione aperta (anche quella nuova appena salvata) diventa il posto in cui tornare
  useEffect(() => { if (chat.convId && !inHome) salvaPosto(chat.convId) }, [chat.convId, inHome])

  const vaiHome = () => { setInHome(true); salvaPosto('home') }
  const apri = (conv) => { chat.apri(conv); setInHome(false); salvaPosto(conv.id) }
  const nuova = () => { chat.nuova(); setInHome(false); salvaPosto('nuova') }
  // Un testo pronto va nel campo di una conversazione nuova (quella vuota che hai davanti, se c'è)
  const usaTesto = (testo) => {
    if (chat.convId || chat.messages.length) chat.nuova()
    setInHome(false)
    salvaPosto('nuova')
    setModo('scrivi')
    setIncolla({ testo })
  }
  const incollato = useCallback(() => setIncolla(null), [])

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
    : chat.inRipristino ? 'Peppino' : 'Nuova conversazione'

  return (
    <div className="chat">
      <header className="chat-bar">
        {inHome ? (
          <div className="chat-head">
            <h1 className="chat-title">Peppino</h1>
            <span className="chat-sub">Testi pronti e conversazioni</span>
          </div>
        ) : (
          <>
            <button className="btn-icon" onClick={vaiHome} aria-label="Home della chat" title="Home: tutte le conversazioni">
              <House size={18} />
            </button>
            <div className="chat-head">
              <h1 className="chat-title">{titolo}</h1>
              <ChatSettings specialisti={specialisti} assistente={chat.assistente} onAssistente={chat.setAssistente} modelli={modelli} />
            </div>
            <div className="chat-modo chips" role="tablist" aria-label="Modo">
              <button role="tab" aria-selected={modo === 'scrivi'} className={`chip ${modo === 'scrivi' ? 'is-active' : ''}`} onClick={() => setModo('scrivi')}>Scrivi</button>
              <button role="tab" aria-selected={modo === 'parla'} className={`chip ${modo === 'parla' ? 'is-active' : ''}`} onClick={() => setModo('parla')}>Parla</button>
            </div>
          </>
        )}
        <button className="btn btn-sm" onClick={nuova} aria-label="Nuova conversazione">
          <Plus size={14} /> <span className="chat-new-label">Nuova</span>
        </button>
      </header>

      <div className="chat-body">
        <div className="chat-main">
          {chat.errore && (
            <div className="form-error chat-errore" role="alert">
              <span className="grow">{chat.errore}</span>
              <button className="btn-icon sm" onClick={() => chat.setErrore('')} aria-label="Chiudi"><X size={14} /></button>
            </div>
          )}

          {inHome ? (
            <ChatHome
              conversations={chat.conversations} attiva={chat.convId}
              onApri={apri} onElimina={chat.elimina} onTesto={usaTesto}
            />
          ) : modo === 'parla' ? (
            <ParlaView invia={(testo) => invia(testo, { voce: true })} azioni={azioniRef} />
          ) : chat.inRipristino ? (
            // Un attimo, finché arriva la conversazione di prima: niente schermata vuota né campo
            // in cui scrivere nella conversazione sbagliata
            <div className="chat-scroll" aria-busy="true" />
          ) : (
            <>
              <ChatMessages
                chiave={chat.chiave} messages={chat.messages}
                inAttesa={chat.inAttesaQui}
                attesaTesto={modelli.targets.length > 1 ? `${modelli.targets.length} modelli stanno rispondendo…` : 'Peppino sta pensando…'}
                onTestoPronto={usaTesto}
                nomeAssistente={nomeAssistente} occupato={chat.occupato}
                onRiprova={riprova} onAlternativa={chat.scegliAlternativa}
                onConferma={chat.conferma} onRifiuta={chat.rifiuta}
              />
              <Composer
                bozza={chat.convId || 'nuova'} incolla={incolla} onIncollato={incollato}
                onInvia={(testo, citati) => invia(testo, { citati })} occupato={chat.occupato} inAttesa={chat.inAttesaQui}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
