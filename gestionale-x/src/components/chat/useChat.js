import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  sendMessage, streamMessage, executeActions, generateTitle, saveConversation, updateConversation,
  patchConversation, subscribeToConversations, deleteConversation
} from '../../services/chatService'
import { nuoveAzioni, perStoria, segnaSostituite, ultimoConInAttesa } from './azioni'

// Il cuore della chat: quale conversazione è aperta, l'invio, le proposte, il salvataggio.
//
// Ogni conversazione aperta ha una "chiave": il suo id, oppure nuova-N finché non è salvata.
// Ciò che arriva in ritardo (una risposta, l'esito di un'azione) aggiorna lo schermo solo se
// quella conversazione è ancora aperta, e si salva comunque in quella giusta. Prima una risposta
// arrivata dopo un cambio di conversazione finiva nella conversazione sbagliata, e il messaggio
// successivo poteva sovrascriverne un'altra.

let contatore = 0
const nuovaChiave = () => `nuova-${++contatore}`
const adesso = () => new Date().toISOString()
const titoloDa = (testo) => (testo.length > 40 ? `${testo.slice(0, 40)}…` : testo)
// I messaggi non partiti (con "Riprova") e la risposta ancora in scrittura restano solo a schermo:
// non si salvano e non vanno all'AI
const salvabili = (messages) => messages.filter(m => !m.failed && !m.streaming)
const vistaVuota = (assistente = null) => ({ chiave: nuovaChiave(), id: null, messages: [], assistente })

// Cosa ha letto e come ha ragionato: si salva con la risposta, il ragionamento accorciato
// (la conversazione è un documento solo, al massimo 1 MB)
const dietroDa = ({ passi, ragionamento } = {}) => ({
  ...(passi?.length ? { passi: passi.slice(0, 20) } : {}),
  ...(ragionamento ? { ragionamento: ragionamento.slice(0, 3000) } : {})
})

// Gli elementi citati con @ restano in contesto per qualche messaggio: si continua a parlarne
// senza doverli citare di nuovo. I più recenti prima, al massimo 6.
const MAX_CITATI = 6
function citatiPerServer(nuovi, precedenti) {
  const ids = nuovi.map(c => c.id)
  for (const m of precedenti.slice(-8).reverse()) {
    for (const c of m.citati || []) ids.push(c.id)
  }
  return [...new Set(ids)].slice(0, MAX_CITATI)
}

// Dalla risposta del server al messaggio salvato
function rispostaDa({ reply, proposedActions, label, replies, passi, ragionamento }, assistente) {
  const msg = { role: 'assistant', content: reply || '', timestamp: adesso(), assistant: assistente || null, ...dietroDa({ passi, ragionamento }) }
  let proposte = proposedActions
  if (replies?.length > 1) {
    const scelta = replies.findIndex(r => !r.error)
    msg.alternatives = replies.map(r => ({
      label: r.label,
      content: r.error ? null : r.reply,
      error: r.error || null,
      ms: r.ms ?? null,
      proposedActions: r.proposedActions || [],
      ...dietroDa(r)
    }))
    msg.altIndex = scelta
    msg.label = replies[scelta].label
    delete msg.passi
    delete msg.ragionamento
    Object.assign(msg, dietroDa(replies[scelta]))
    proposte = replies[scelta].proposedActions
  } else if (label) {
    msg.label = label
  }
  const actions = nuoveAzioni(proposte)
  if (actions.length) msg.actions = actions
  return msg
}

export function useChat({ ripristina = true } = {}) {
  const [conversations, setConversations] = useState([])
  const [vista, setVista] = useState(vistaVuota)
  // Cosa si sta aspettando dal server: { chiave, tipo: 'invio' | 'salvo' | 'azioni' }. Uno alla volta.
  const [occupato, setOccupato] = useState(null)
  const [errore, setErrore] = useState('')
  const vistaRef = useRef(vista)
  const occupatoRef = useRef(null)
  useLayoutEffect(() => { vistaRef.current = vista })

  const occupa = useCallback((stato) => { occupatoRef.current = stato; setOccupato(stato) }, [])

  // Aggiorna i messaggi solo se quella conversazione è ancora aperta
  const aggiorna = useCallback((chiave, fn) => {
    setVista(v => (v.chiave === chiave ? { ...v, messages: fn(v.messages) } : v))
  }, [])

  // Conversazioni salvate. Al primo arrivo riapre l'ultima, ma solo se intanto non hai scelto tu:
  // l'elenco può arrivare dopo che hai già toccato "Nuova", e non deve scavalcarti.
  const ripristinata = useRef(!ripristina)
  useEffect(() => subscribeToConversations(
    (convs) => {
      setConversations(convs)
      if (ripristinata.current || !convs.length) return
      ripristinata.current = true
      const v = vistaRef.current
      if (v.id || v.messages.length) return
      const ultima = convs[0]
      if (ultima.messages?.length) {
        setVista({ chiave: ultima.id, id: ultima.id, messages: ultima.messages, assistente: ultima.specialist ?? null })
      }
    },
    (err) => console.error('Errore caricamento chat:', err)
  ), [])

  const apri = useCallback((conv) => {
    ripristinata.current = true
    setErrore('')
    setVista({ chiave: conv.id, id: conv.id, messages: conv.messages || [], assistente: conv.specialist ?? null })
  }, [])

  // La nuova conversazione tiene l'assistente che stavi usando
  const nuova = useCallback(() => {
    ripristinata.current = true
    setErrore('')
    setVista(v => vistaVuota(v.assistente))
  }, [])

  const elimina = useCallback(async (id) => {
    try {
      await deleteConversation(id)
      setVista(v => (v.id === id ? vistaVuota(v.assistente) : v))
    } catch (err) {
      setErrore(`Non sono riuscito a eliminare la conversazione: ${err.message}`)
    }
  }, [])

  // L'assistente appartiene alla conversazione: riaprendola torna quello
  const setAssistente = useCallback((assistente) => {
    const { id } = vistaRef.current
    setVista(v => ({ ...v, assistente }))
    if (id) patchConversation(id, { specialist: assistente }).catch(() => {})
  }, [])

  // Manda un messaggio nella conversazione aperta. Restituisce { reply, proposedActions } o null.
  // citati: [{ id, nome }] gli elementi citati con @ in questo messaggio
  const invia = useCallback(async (testo, { assistente = null, targets = [], voce = false, citati = [] } = {}) => {
    const text = String(testo || '').trim()
    if (!text || occupatoRef.current) return null
    ripristinata.current = true
    const v = vistaRef.current
    const { chiave } = v
    const base = salvabili(v.messages)
    const domanda = {
      role: 'user', content: text, timestamp: adesso(),
      ...(voce ? { voce: true } : {}),
      ...(citati.length ? { citati: citati.map(({ id, nome }) => ({ id, nome })) } : {})
    }
    const conDomanda = [...base, domanda]
    aggiorna(chiave, () => conDomanda)
    occupa({ chiave, tipo: 'invio' })
    setErrore('')

    const richiesta = {
      history: perStoria(base),
      specialist: assistente,
      targets: voce ? targets.slice(0, 1) : targets, // a voce un modello solo: il confronto non si ascolta
      voce,
      citati: citatiPerServer(citati, base)
    }
    // Un modello solo, scrivendo: la risposta compare mentre arriva. A confronto (più modelli) e a
    // voce (si legge la risposta intera) resta la chiamata normale.
    const aPezzi = !voce && richiesta.targets.length <= 1
    // La bozza a schermo: cosa sta leggendo, la coda del ragionamento, poi il testo
    let scritto = ''
    let passi = []
    let pensiero = ''
    let fotogramma = 0
    const iniziata = adesso() // fisso: l'orario fa parte della chiave con cui React riconosce il messaggio
    const mostraBozza = () => {
      fotogramma = 0
      const bozza = { role: 'assistant', content: scritto, timestamp: iniziata, assistant: assistente || null, streaming: true, passi, pensiero }
      aggiorna(chiave, () => [...conDomanda, bozza])
    }
    // Un aggiornamento per fotogramma, non uno per pezzo (ne arrivano centinaia)
    const ridisegna = () => { fotogramma ||= requestAnimationFrame(mostraBozza) }

    // Gli elementi citati nei messaggi prima restano in contesto, ma tra i passi si mostrano solo
    // quelli citati adesso: altrimenti "Ha letto @Bottega" tornerebbe sotto ogni risposta
    const correnti = new Set(citati.map(c => c.id))
    const soloNuovi = (ps = []) => ps.filter(p => !((p.tipo === 'citato' && !correnti.has(p.id)) || (p.da && !correnti.has(p.da))))

    let risposta
    try {
      risposta = aPezzi
        ? await streamMessage(text, richiesta, {
          testo: (pezzo) => { scritto += pezzo; ridisegna() },
          passo: (passo) => { passi = soloNuovi([...passi, passo]); ridisegna() },
          pensiero: (pezzo) => { pensiero = (pensiero + pezzo).slice(-600); ridisegna() }
        })
        : await sendMessage(text, richiesta)
    } catch (err) {
      cancelAnimationFrame(fotogramma)
      // La domanda resta a schermo, segnata: si riprova senza riscriverla. L'eventuale bozza sparisce.
      aggiorna(chiave, () => conDomanda.map(m => (m === domanda ? { ...m, failed: true, errore: err.message || 'Errore di comunicazione' } : m)))
      occupa(null)
      return null
    }
    cancelAnimationFrame(fotogramma)

    risposta = { ...risposta, passi: soloNuovi(risposta.passi), replies: risposta.replies?.map(r => ({ ...r, passi: soloNuovi(r.passi) })) }
    const msg = rispostaDa(risposta, assistente)
    // Proposte nuove: quelle ancora in attesa nei messaggi precedenti sono superate
    const finale = [...(msg.actions ? segnaSostituite(conDomanda) : conDomanda), msg]
    aggiorna(chiave, () => finale)
    occupa({ chiave, tipo: 'salvo' })

    // Si salva nella conversazione da cui è partita la domanda, anche se intanto ne hai aperta un'altra
    try {
      if (v.id) {
        await updateConversation(v.id, finale, { specialist: assistente })
      } else {
        const id = await saveConversation(titoloDa(text), finale, { specialist: assistente })
        setVista(cur => (cur.chiave === chiave ? { ...cur, id, chiave: id } : cur))
        // Solo il titolo: riscrivere i messaggi cancellerebbe quelli arrivati intanto
        generateTitle(finale)
          .then(t => (t && t !== 'Conversazione' ? patchConversation(id, { title: t }) : null))
          .catch(() => {})
      }
    } catch (err) {
      setErrore(`La risposta è arrivata ma non è stata salvata: ${err.message}`)
    } finally {
      occupa(null)
    }
    return { reply: msg.content, proposedActions: msg.actions || [] }
  }, [aggiorna, occupa])

  // Rimanda una domanda che non era partita
  const riprova = useCallback((indice, opzioni = {}) => {
    const { chiave, messages } = vistaRef.current
    const m = messages[indice]
    if (!m?.failed || occupatoRef.current) return null
    aggiorna(chiave, msgs => msgs.filter(x => x !== m))
    return invia(m.content, { ...opzioni, voce: !!m.voce, citati: m.citati || [] })
  }, [aggiorna, invia])

  // Proposte: conferma di alcune (ids) o di tutte quelle in attesa di un messaggio
  const conferma = useCallback(async (indice, ids = null) => {
    if (occupatoRef.current) return null
    const v = vistaRef.current
    const scelte = (v.messages[indice]?.actions || []).filter(a => a.status === 'pending' && (!ids || ids.includes(a.id)))
    if (!scelte.length) return null
    const { chiave } = v
    const scelta = new Set(scelte.map(a => a.id))
    const suMessaggio = (fn) => (msgs) => msgs.map((m, i) => (i === indice && m.actions ? { ...m, actions: m.actions.map(fn) } : m))
    occupa({ chiave, tipo: 'azioni' })
    aggiorna(chiave, suMessaggio(a => (scelta.has(a.id) ? { ...a, status: 'executing' } : a)))

    let risultati
    try {
      risultati = (await executeActions(scelte.map(({ tool, args, label }) => ({ tool, args, label })))).results
    } catch (err) {
      risultati = scelte.map(() => ({ result: { success: false, message: err.message } }))
    }
    // Esiti per posizione: prima si abbinavano per tipo ed etichetta, e due azioni uguali prendevano lo stesso esito
    const esiti = new Map(scelte.map((a, k) => [a.id, risultati[k]?.result || { success: false, message: 'Nessuna risposta dal server' }]))
    const finale = suMessaggio(a => (esiti.has(a.id)
      ? { ...a, status: esiti.get(a.id).success ? 'confirmed' : 'error', result: esiti.get(a.id) }
      : a))(v.messages)
    aggiorna(chiave, () => finale)
    try {
      if (v.id) await updateConversation(v.id, salvabili(finale))
    } catch (err) {
      setErrore(`Azioni eseguite, ma l'esito non è stato salvato nella conversazione: ${err.message}`)
    } finally {
      occupa(null)
    }
    return [...esiti.values()]
  }, [aggiorna, occupa])

  const rifiuta = useCallback((indice, ids = null) => {
    if (occupatoRef.current) return
    const v = vistaRef.current
    const finale = v.messages.map((m, i) => (i === indice && m.actions
      ? { ...m, actions: m.actions.map(a => (a.status === 'pending' && (!ids || ids.includes(a.id)) ? { ...a, status: 'rejected' } : a)) }
      : m))
    aggiorna(v.chiave, () => finale)
    if (v.id) updateConversation(v.id, salvabili(finale)).catch(err => setErrore(`Non salvato: ${err.message}`))
  }, [aggiorna])

  // Risposte a confronto: quella scelta entra nella conversazione (e nella storia che vede l'AI)
  const scegliAlternativa = useCallback((indice, iAlt) => {
    const v = vistaRef.current
    const msg = v.messages[indice]
    const alt = msg?.alternatives?.[iAlt]
    if (!alt || alt.error || msg.altIndex === iAlt || occupatoRef.current) return
    const { passi: _p, ragionamento: _r, ...resto } = msg
    const nuovo = { ...resto, content: alt.content, altIndex: iAlt, label: alt.label, ...dietroDa(alt) }
    // Le proposte seguono la risposta scelta, ma solo se nessuna è già stata decisa
    if (!msg.actions || msg.actions.every(a => a.status === 'pending')) {
      const actions = nuoveAzioni(alt.proposedActions)
      if (actions.length) nuovo.actions = actions
      else delete nuovo.actions
    }
    const finale = v.messages.map((m, i) => (i === indice ? nuovo : m))
    aggiorna(v.chiave, () => finale)
    if (v.id) updateConversation(v.id, salvabili(finale)).catch(() => {})
  }, [aggiorna])

  // Per la conversazione a voce: "sì" / "no" valgono per l'ultima proposta in attesa
  const azioniVoce = {
    confirmAll: async () => {
      const i = ultimoConInAttesa(vistaRef.current.messages)
      if (i >= 0) await conferma(i)
    },
    rejectAll: () => {
      const i = ultimoConInAttesa(vistaRef.current.messages)
      if (i >= 0) rifiuta(i)
    }
  }

  return {
    conversations,
    chiave: vista.chiave,
    convId: vista.id,
    messages: vista.messages,
    assistente: vista.assistente,
    occupato: !!occupato,
    inAttesaQui: occupato?.tipo === 'invio' && occupato.chiave === vista.chiave,
    errore, setErrore,
    apri, nuova, elimina, setAssistente, invia, riprova, conferma, rifiuta, scegliAlternativa, azioniVoce
  }
}
