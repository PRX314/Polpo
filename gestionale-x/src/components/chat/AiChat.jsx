import { useCallback, useEffect, useRef, useState } from 'react'
import { Keyboard, Menu, SquarePen, X } from 'lucide-react'
import { getSpecialists, preparaPeppino } from '../../services/chatService'
import { useChat } from './useChat'
import { useModelli } from './useModelli'
import { nomeAssistente as nomeDa } from './assistenti'
import { leggiPosto, salvaPosto } from './posto'
import ChatSettings from './ChatSettings'
import ChatMessages from './ChatMessages'
import Composer from './Composer'
import ChatLato from './ChatLato'
import ChatNuova from './ChatNuova'
import ParlaView from './ParlaView'
import Peppino from './Peppino'
import './AiChat.css'
import '../prose.css'

const MODO_KEY = 'polpo.chatModo'       // 'scrivi' | 'parla'
const TIPO_KEY = 'polpo.chat.tipo'      // il tipo dell'ultima conversazione nuova: 'parliamo' | 'cose'
const RAGIONA_KEY = 'polpo.chat.ragiona' // il tasto «Ragiona» resta come l'hai lasciato

const leggi = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const scrivi = (k, v) => { try { localStorage.setItem(k, v) } catch { /* storage non disponibile */ } }
const tipoSalvato = () => (leggi(TIPO_KEY) === 'cose' ? 'cose' : 'parliamo')

// La chat con Peppino, fatta come le chat che si usano tutti i giorni (dal 2026-11-07, prima era una
// pila di scatole uguali): a sinistra le conversazioni (sul telefono in un pannello che si apre col ☰),
// al centro una colonna sola. I tuoi messaggi a destra in un fumetto, quelli di Peppino a sinistra
// senza scatola. Peppino ha un colore suo, cangiante, e lo usa solo per le sue cose (vedi AiChat.css).
//
// Due tipi di conversazione: «Parliamo» (di tutto, senza il gestionale davanti) e «Le mie cose»
// (progetti, agenda, appunti). Si sceglie aprendone una nuova e si cambia dal menu sotto il titolo.
// Riaprendo la chat ritrovi la conversazione che avevi aperto (vedi posto.js).
// La logica sta in useChat; qui c'è solo come si dispone.
export default function AiChat({ initialMessage, onInitialMessageConsumed }) {
  // Col messaggio scritto in Oggi si parte da una conversazione nuova sulle tue cose, se no da dove eri.
  // 'home' è il posto di prima, quando la chat aveva una home: ora vale come una conversazione nuova.
  const [posto] = useState(() => (initialMessage ? 'nuova' : leggiPosto()))
  const daRiaprire = posto !== 'home' && posto !== 'nuova' // senza un posto salvato si riapre l'ultima
  const chat = useChat({ ripristina: daRiaprire, preferita: posto, tipo: initialMessage ? 'cose' : tipoSalvato() })
  const modelli = useModelli()
  const [specialisti, setSpecialisti] = useState([])
  const [modo, setModo] = useState(() => (leggi(MODO_KEY) === 'parla' ? 'parla' : 'scrivi'))
  const [ragiona, setRagiona] = useState(() => leggi(RAGIONA_KEY) === '1')
  const [lato, setLato] = useState(false)        // il pannello delle conversazioni, sul telefono
  const [scrivendo, setScrivendo] = useState(false)
  const [incolla, setIncolla] = useState(null)   // il testo pronto che il campo deve prendere

  useEffect(() => { preparaPeppino(); getSpecialists().then(setSpecialisti).catch(() => {}) }, [])
  useEffect(() => { scrivi(MODO_KEY, modo) }, [modo])
  useEffect(() => { scrivi(RAGIONA_KEY, ragiona ? '1' : '0') }, [ragiona])

  // La conversazione aperta (anche quella nuova appena salvata) diventa il posto in cui tornare
  useEffect(() => { if (chat.convId) salvaPosto(chat.convId) }, [chat.convId])

  const apri = (conv) => { chat.apri(conv); setLato(false); salvaPosto(conv.id) }
  const nuova = () => { chat.nuova(tipoSalvato()); setModo('scrivi'); setLato(false); salvaPosto('nuova') }
  // Il tipo scelto per una conversazione nuova diventa quello delle prossime
  const cambiaTipo = (tipo) => {
    chat.setTipo(tipo)
    if (!chat.convId) scrivi(TIPO_KEY, tipo)
  }
  // Un testo pronto va nel campo di una conversazione nuova sulle tue cose (quella vuota che hai davanti, se c'è)
  const usaTesto = (testo) => {
    if (chat.convId || chat.messages.length) chat.nuova('cose')
    else if (chat.tipo !== 'cose') chat.setTipo('cose')
    setModo('scrivi')
    salvaPosto('nuova')
    setIncolla({ testo })
  }
  const incollato = useCallback(() => setIncolla(null), [])

  const invia = (testo, opzioni = {}) =>
    chat.invia(testo, { assistente: chat.assistente, targets: modelli.targets, ragiona, ...opzioni })

  // Il messaggio scritto nella pagina Oggi parte da solo, in una conversazione nuova
  const iniziale = useRef(false)
  useEffect(() => {
    if (!initialMessage || iniziale.current) return
    iniziale.current = true
    invia(initialMessage)
    onInitialMessageConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage])

  // Il pannello sul telefono si chiude con Esc
  useEffect(() => {
    if (!lato) return
    const esc = (e) => { if (e.key === 'Escape') setLato(false) }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [lato])

  // Per la conversazione a voce: le azioni lette al momento, non quando è partito l'ascolto
  const azioniRef = useRef(null)
  azioniRef.current = chat.azioniVoce
  const motore = useRef(null) // i comandi della faccina di Peppino, per le sue versioni che li hanno

  const nomeAssistente = useCallback((id) => nomeDa(specialisti, id), [specialisti])
  const riprova = useCallback(
    (i) => chat.riprova(i, { assistente: chat.assistente, targets: modelli.targets }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chat.riprova, chat.assistente, modelli.targets]
  )

  const vuota = !chat.inRipristino && !chat.messages.length && !chat.inAttesaQui
  const titolo = chat.convId
    ? chat.conversations.find(c => c.id === chat.convId)?.title || 'Conversazione'
    : chat.inRipristino ? 'Peppino' : 'Nuova conversazione'

  // Cosa sta facendo Peppino: la faccina in alto e il suo colore lo seguono
  const ultimo = chat.messages[chat.messages.length - 1]
  const fase = chat.inAttesaQui
    ? (ultimo?.streaming && ultimo.content ? 'parlo' : 'penso')
    : scrivendo ? 'ascolto' : 'fermo'

  return (
    <div className={`chat ${lato ? 'is-lato' : ''}`} data-tipo={chat.tipo} data-fase={fase}>
      <ChatLato
        conversations={chat.conversations} attiva={chat.convId}
        onApri={apri} onElimina={chat.elimina} onNuova={nuova} onChiudi={() => setLato(false)}
      />
      {lato && <div className="chat-velo" onClick={() => setLato(false)} aria-hidden="true" />}

      <div className="chat-main">
        <header className="chat-bar">
          <button className="chat-tasto chat-apri-lato" onClick={() => setLato(true)} aria-label="Conversazioni" title="Conversazioni">
            <Menu size={20} />
          </button>
          {modo !== 'parla' && <span className="chat-faccia" aria-hidden="true"><Peppino fase={fase} motore={motore} /></span>}
          <div className="chat-head">
            <h1 className="chat-title">{titolo}</h1>
            <ChatSettings
              tipo={chat.tipo} onTipo={cambiaTipo}
              specialisti={specialisti} assistente={chat.assistente} onAssistente={chat.setAssistente} modelli={modelli}
            />
          </div>
          <button className="chat-tasto chat-nuova-tasto" onClick={nuova} aria-label="Nuova conversazione" title="Nuova conversazione">
            <SquarePen size={19} />
          </button>
        </header>

        {chat.errore && (
          <div className="form-error chat-errore" role="alert">
            <span className="grow">{chat.errore}</span>
            <button className="btn-icon sm" onClick={() => chat.setErrore('')} aria-label="Chiudi"><X size={14} /></button>
          </div>
        )}

        {modo === 'parla' ? (
          <>
            <ParlaView invia={(testo) => invia(testo, { voce: true })} azioni={azioniRef} />
            <div className="chat-parla-esci">
              <button className="chat-pillola" onClick={() => setModo('scrivi')}><Keyboard size={16} /> Torna a scrivere</button>
            </div>
          </>
        ) : chat.inRipristino ? (
          // Un attimo, finché arriva la conversazione di prima: niente schermata vuota né campo
          // in cui scrivere nella conversazione sbagliata
          <div className="chat-scroll" aria-busy="true" />
        ) : (
          <>
            {vuota ? (
              <ChatNuova tipo={chat.tipo} onTipo={cambiaTipo} onTesto={usaTesto} />
            ) : (
              <ChatMessages
                chiave={chat.chiave} messages={chat.messages}
                inAttesa={chat.inAttesaQui}
                attesaTesto={modelli.targets.length > 1 ? `${modelli.targets.length} modelli stanno rispondendo…` : 'Peppino ci pensa…'}
                nomeAssistente={nomeAssistente} occupato={chat.occupato}
                onRiprova={riprova} onAlternativa={chat.scegliAlternativa}
                onConferma={chat.conferma} onRifiuta={chat.rifiuta}
              />
            )}
            <Composer
              bozza={chat.convId || 'nuova'} incolla={incolla} onIncollato={incollato}
              onInvia={(testo, citati) => invia(testo, { citati })} occupato={chat.occupato} inAttesa={chat.inAttesaQui}
              ragiona={ragiona} onRagiona={() => setRagiona(v => !v)}
              onParla={() => setModo('parla')} onScrive={setScrivendo}
            />
          </>
        )}
      </div>
    </div>
  )
}
