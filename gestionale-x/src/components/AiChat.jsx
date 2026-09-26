import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ArrowUp, Check, ChevronDown, Copy, History, ListChecks, Mic, Plus, Square, Trash2, X } from 'lucide-react'
import {
  sendMessage, executeActions, generateTitle, saveConversation, updateConversation,
  subscribeToConversations, deleteConversation, getSpecialists, getProviders
} from '../services/chatService'
import { renderMarkdown, renderInline } from '../lib/markdown'
import { Eco } from '../lib/eco-client'
import './AiChat.css'
import './prose.css'

// Nomi leggibili per le azioni che l'AI può proporre
const ACTION_LABEL = {
  add_note: 'Nuova nota',
  add_project: 'Nuovo elemento',
  add_todo: 'Nuova cosa da fare',
  complete_todo: 'Completa',
  update_project: 'Aggiorna elemento',
  update_note: 'Aggiorna nota',
  add_link_to_project: 'Nuovo link',
  add_section_to_project: 'Nuova sezione',
  delete_note: 'Elimina nota'
}

const SUGGESTIONS = [
  { label: 'Riepilogo', msg: 'Fammi un riepilogo completo dei miei progetti e cosa devo fare' },
  { label: 'Idee', msg: 'Analizza i miei progetti e suggeriscimi nuove idee o miglioramenti' },
  { label: 'Priorità', msg: 'Quali sono le 3 priorità principali per questa settimana?' },
  { label: 'Piano', msg: 'Creami un piano d\'azione settimanale' },
  { label: 'Brainstorm', msg: 'Facciamo brainstorming su un nuovo progetto' },
  { label: 'Task aperti', msg: 'Quali task ho ancora da completare?' },
]

const TARGETS_KEY = 'polpo.chatTargets'
const MAX_TARGETS = 4

const readSavedTargets = () => {
  try { return JSON.parse(localStorage.getItem(TARGETS_KEY)) || [] } catch { return [] }
}

// "meta/llama-3.3-70b-instruct" -> "llama-3.3-70b-instruct"
const shortModel = (model) => (model || '').split('/').pop()

// Dettagli azione leggibili (markdown inline)
function getActionDetails(action) {
  const { tool, args } = action
  switch (tool) {
    case 'add_note': return [
      args.title && `**${args.title}**`,
      args.type && `Tipo: ${args.type}`,
      args.category && `Categoria: ${args.category}`,
      args.priority && `Priorità: ${args.priority}`,
      args.projectTags?.length && `Collegata a: ${args.projectTags.join(', ')}`,
      args.content
    ].filter(Boolean)
    case 'add_project': return [
      `**${args.name}**`,
      args.status && `Stato: ${args.status}`,
      args.tags?.length && `Tag: ${args.tags.join(', ')}`,
      args.sections?.length && `${args.sections.length} sezioni: ${args.sections.map(s => s.title).join(', ')}`,
      args.description
    ].filter(Boolean)
    case 'add_section_to_project': return [
      `**${args.projectName}**`,
      args.sectionTitle,
      args.content?.length > 80 ? `${args.content.slice(0, 80)}…` : args.content
    ].filter(Boolean)
    case 'add_todo': return [`**${args.projectName}**`, `Task: ${args.text}`]
    case 'complete_todo': return [`**${args.projectName}**`, `Todo: ${args.todoText}`]
    case 'update_project': return [
      `**${args.projectName}**`,
      args.status && `Nuovo stato: ${args.status}`,
      args.description && 'Descrizione aggiornata',
      args.roadmap && 'Roadmap aggiornata',
      args.obiettivi && 'Obiettivi aggiornati'
    ].filter(Boolean)
    case 'update_note': return [`**${args.noteTitle}**`, args.title && `Nuovo titolo: ${args.title}`].filter(Boolean)
    case 'add_link_to_project': return [`**${args.projectName}**`, `${args.linkTitle}: ${args.url}`]
    case 'delete_note': return [`**${args.noteTitle}**`]
    default: return [action.label]
  }
}

const Markdown = ({ text }) => {
  const html = useMemo(() => renderMarkdown(text), [text])
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}

function AiChat({ initialMessage, onInitialMessageConsumed }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConvId, setCurrentConvId] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [searchConv, setSearchConv] = useState('')
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(null)
  // Pannello azioni
  const [pendingActions, setPendingActions] = useState([])
  const [executingActions, setExecutingActions] = useState(false)
  const [expandedAction, setExpandedAction] = useState(null)
  const [showActionPanel, setShowActionPanel] = useState(false)
  const [actionHistory, setActionHistory] = useState([])
  // Mini-chat del pannello (indipendente dalla chat principale)
  const [panelMessages, setPanelMessages] = useState([])
  const [panelInput, setPanelInput] = useState('')
  const [panelLoading, setPanelLoading] = useState(false)
  // Specialisti AI
  const [specialists, setSpecialists] = useState([])
  const [activeSpecialist, setActiveSpecialist] = useState(null)
  // Provider e modelli: uno selezionato = chat normale, più di uno = risposte a confronto
  const [providers, setProviders] = useState([])
  const [targets, setTargets] = useState(readSavedTargets)
  const [showModelPicker, setShowModelPicker] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const panelEndRef = useRef(null)
  const hasRestoredConv = useRef(false)

  // Voce: orecchie e bocca del browser (riconoscimento e sintesi vocale), niente server
  const [voce, setVoce] = useState('fermo') // fermo | ascolto | parlo
  const ecoRef = useRef(null)
  const azioniRef = useRef(null)
  useEffect(() => () => { ecoRef.current?.zitto(); ecoRef.current?.fermaAscolto() }, [])

  useEffect(() => { getSpecialists().then(setSpecialists).catch(() => {}) }, [])

  // Provider configurati sul server; le scelte salvate che non esistono più vengono scartate
  useEffect(() => {
    getProviders().then(list => {
      setProviders(list)
      setTargets(prev => {
        const valid = prev.filter(t => list.some(p => p.id === t.provider && p.models.includes(t.model)))
        if (valid.length) return valid
        return list[0] ? [{ provider: list[0].id, model: list[0].defaultModel }] : []
      })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    try { localStorage.setItem(TARGETS_KEY, JSON.stringify(targets)) } catch { /* storage non disponibile */ }
  }, [targets])

  const isTargetOn = (provider, model) => targets.some(t => t.provider === provider && t.model === model)

  const toggleTarget = (provider, model) => {
    setTargets(prev => {
      if (prev.some(t => t.provider === provider && t.model === model)) {
        return prev.length > 1 ? prev.filter(t => !(t.provider === provider && t.model === model)) : prev
      }
      return prev.length >= MAX_TARGETS ? prev : [...prev, { provider, model }]
    })
  }

  useEffect(() => {
    const unsub = subscribeToConversations(
      (convs) => {
        setConversations(convs)
        // Al primo caricamento riapre l'ultima conversazione
        if (!hasRestoredConv.current && convs.length > 0 && !initialMessage) {
          hasRestoredConv.current = true
          const last = convs[0] // già ordinata per updatedAt desc
          if (last.messages?.length > 0) {
            setMessages(last.messages)
            setCurrentConvId(last.id)
          }
        }
      },
      (err) => console.error('Errore caricamento chat:', err)
    )
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, loading])
  useEffect(() => { panelEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [panelMessages, panelLoading])

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 6000)
    return () => clearTimeout(t)
  }, [error])

  // Apre il pannello da solo quando ci sono azioni da confermare
  useEffect(() => {
    if (pendingActions.some(a => a.status === 'pending')) setShowActionPanel(true)
  }, [pendingActions])

  const autosize = useCallback((e) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`
  }, [])

  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setLoading(true)
    setError('')

    let esito = null
    try {
      const { reply, proposedActions, label, replies } = await sendMessage(text, messages, 'main', activeSpecialist, targets)

      const aiMsg = { role: 'assistant', content: reply, timestamp: new Date().toISOString(), executedActions: [] }
      if (replies?.length > 1) {
        aiMsg.alternatives = replies.map(r => ({
          label: r.label,
          content: r.error ? null : r.reply,
          error: r.error || null,
          ms: r.ms ?? null,
          proposedActions: r.proposedActions || []
        }))
        aiMsg.altIndex = replies.findIndex(r => !r.error)
        aiMsg.label = replies[aiMsg.altIndex].label
      } else if (label) {
        aiMsg.label = label
      }
      const updatedMessages = [...newMessages, aiMsg]
      setMessages(updatedMessages)

      if (proposedActions?.length > 0) {
        setPendingActions(proposedActions.map((a, i) => ({ ...a, id: `${Date.now()}-${i}`, status: 'pending' })))
      }
      esito = { reply: aiMsg.content, proposedActions: proposedActions || [] }

      // Salva su Firestore
      if (currentConvId) {
        await updateConversation(currentConvId, updatedMessages)
      } else {
        const title = text.length > 40 ? `${text.substring(0, 40)}…` : text
        const id = await saveConversation(title, updatedMessages)
        setCurrentConvId(id)
        generateTitle(updatedMessages).then(aiTitle => {
          if (aiTitle && aiTitle !== 'Conversazione') updateConversation(id, updatedMessages, aiTitle)
        }).catch(() => {})
      }
    } catch (err) {
      setError(err.message || 'Errore nella comunicazione con Polpo AI')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
    return esito
  }

  // Auto-invio del messaggio arrivato dalla pagina Oggi
  const initialSent = useRef(false)
  useEffect(() => {
    if (initialMessage && !initialSent.current && !loading) {
      initialSent.current = true
      handleSend(initialMessage)
      onInitialMessageConsumed?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage])

  // Sceglie quale risposta a confronto entra nella conversazione (e quindi nella history dei messaggi successivi)
  const selectAlternative = async (msgIdx, altIdx) => {
    const msg = messages[msgIdx]
    const alt = msg?.alternatives?.[altIdx]
    if (!alt || alt.error || msg.altIndex === altIdx) return

    const updated = messages.map((m, i) => i === msgIdx ? { ...m, content: alt.content, altIndex: altIdx, label: alt.label } : m)
    setMessages(updated)

    // Le azioni in attesa seguono la risposta scelta, ma solo se nessuna è già stata toccata
    if (msgIdx === messages.length - 1 && pendingActions.every(a => a.status === 'pending')) {
      setPendingActions((alt.proposedActions || []).map((a, i) => ({ ...a, id: `${Date.now()}-${i}`, status: 'pending' })))
    }
    if (currentConvId) {
      try { await updateConversation(currentConvId, updated) } catch { /* la scelta resta a schermo */ }
    }
  }

  // Mini-chat nel pannello: conversazione SEPARATA per gestire le azioni
  const handlePanelSend = async () => {
    const text = panelInput.trim()
    if (!text || panelLoading) return

    setPanelMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date().toISOString() }])
    setPanelInput('')
    setPanelLoading(true)

    try {
      const actionsContext = pendingActions
        .filter(a => a.status === 'pending')
        .map((a, i) => `[Azione ${i + 1}] ${a.label} (tool: ${a.tool}, args: ${JSON.stringify(a.args)})`)
        .join('\n')
      const contextMsg = `CONTESTO: L'utente sta gestendo queste azioni proposte nel pannello laterale:\n${actionsContext}\n\nL'utente dice: ${text}`
      const panelHistory = panelMessages.map(m => ({ role: m.role, content: m.content }))
      const { reply, proposedActions } = await sendMessage(contextMsg, panelHistory, 'panel', null, targets.slice(0, 1))

      setPanelMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date().toISOString() }])

      // Se l'AI propone versioni modificate, sostituiscono quelle ancora in attesa
      if (proposedActions?.length > 0) {
        setPendingActions(prev => [
          ...prev.filter(a => a.status !== 'pending'),
          ...proposedActions.map((a, i) => ({ ...a, id: `${Date.now()}-${i}`, status: 'pending' }))
        ])
      }
    } catch (err) {
      setPanelMessages(prev => [...prev, { role: 'assistant', content: `Errore: ${err.message}`, timestamp: new Date().toISOString() }])
    } finally {
      setPanelLoading(false)
    }
  }

  const confirmAction = async (actionIdx) => {
    const action = pendingActions[actionIdx]
    if (!action || action.status !== 'pending') return

    setExecutingActions(true)
    const updated = [...pendingActions]
    updated[actionIdx] = { ...action, status: 'executing' }
    setPendingActions(updated)

    try {
      const { results } = await executeActions([action])
      const result = results[0]?.result
      updated[actionIdx] = { ...action, status: result?.success ? 'confirmed' : 'error', result }
      setPendingActions([...updated])
      setActionHistory(prev => [...prev, { ...action, result, confirmedAt: new Date().toISOString() }])

      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'assistant') {
        const executedActions = [...(lastMsg.executedActions || []), { ...action, result }]
        const updatedMessages = [...messages.slice(0, -1), { ...lastMsg, executedActions }]
        setMessages(updatedMessages)
        if (currentConvId) await updateConversation(currentConvId, updatedMessages)
      }
    } catch (err) {
      updated[actionIdx] = { ...action, status: 'error', result: { message: err.message } }
      setPendingActions([...updated])
    } finally {
      setExecutingActions(false)
    }
  }

  const confirmAll = async () => {
    const toConfirm = pendingActions.filter(a => a.status === 'pending')
    if (!toConfirm.length) return

    setExecutingActions(true)
    setPendingActions(prev => prev.map(a => a.status === 'pending' ? { ...a, status: 'executing' } : a))

    try {
      const { results } = await executeActions(toConfirm)
      setPendingActions(prev => prev.map(a => {
        if (a.status !== 'executing') return a
        const r = results.find(x => x.tool === a.tool && x.label === a.label)
        return { ...a, status: r?.result?.success ? 'confirmed' : 'error', result: r?.result }
      }))
      setActionHistory(prev => [...prev, ...results.map(r => ({ tool: r.tool, label: r.label, result: r.result, confirmedAt: new Date().toISOString() }))])

      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'assistant') {
        const executedActions = results.map(r => ({ tool: r.tool, label: r.label, result: r.result }))
        const updatedMessages = [...messages.slice(0, -1), { ...lastMsg, executedActions }]
        setMessages(updatedMessages)
        if (currentConvId) await updateConversation(currentConvId, updatedMessages)
      }
    } catch (err) {
      setPendingActions(prev => prev.map(a => a.status === 'executing' ? { ...a, status: 'error', result: { message: err.message } } : a))
    } finally {
      setExecutingActions(false)
    }
  }

  const rejectAction = (idx) => setPendingActions(prev => prev.map((a, i) => i === idx ? { ...a, status: 'rejected' } : a))
  const rejectAll = () => setPendingActions(prev => prev.map(a => a.status === 'pending' ? { ...a, status: 'rejected' } : a))

  // Letti dalla conversazione a voce dopo le attese: servono le versioni dell'ultimo render,
  // non quelle di quando è partito l'ascolto (altrimenti non vedono le azioni appena proposte).
  azioniRef.current = { confirmAll, rejectAll }

  // Un tocco: ascolta, manda, legge la risposta. Se Polpo propone azioni chiede conferma a voce;
  // senza un sì chiaro restano nel pannello come sempre.
  const parlaConPolpo = async () => {
    const eco = (ecoRef.current ??= new Eco({ ascolto: 'browser', voce: 'browser', onStato: setVoce }))
    if (eco.stato === 'parlo') return eco.zitto()
    if (eco.stato === 'ascolto') return eco.fermaAscolto()
    if (loading) return

    const testo = await eco.ascolta()
    if (!testo) return
    const esito = await handleSend(testo)
    if (!esito) return
    await eco.parla(esito.reply)

    const n = esito.proposedActions.length
    if (!n || eco.interrotto) return
    await eco.parla(n === 1 ? 'Confermi?' : `Confermi tutte e ${n}?`)
    if (eco.interrotto) return
    const risposta = Eco.risposta(await eco.ascolta({ attesaMax: 6000 }))
    if (risposta === 'si') {
      await azioniRef.current.confirmAll()
      await eco.parla('Fatto.')
    } else if (risposta === 'no') {
      azioniRef.current.rejectAll()
      await eco.parla('Va bene, lascio stare.')
    } else {
      await eco.parla('Non ho capito. Le trovi nel pannello azioni.')
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const startNewChat = () => {
    setMessages([]); setCurrentConvId(null); setShowSidebar(false)
    setPendingActions([]); setActionHistory([])
    setShowActionPanel(false); setPanelMessages([]); setPanelInput('')
    inputRef.current?.focus()
  }

  const loadConversation = (conv) => {
    setMessages(conv.messages || []); setCurrentConvId(conv.id)
    setShowSidebar(false); setPendingActions([]); setActionHistory([])
  }

  const handleDeleteConv = async (e, convId) => {
    e.stopPropagation()
    try { await deleteConversation(convId); if (currentConvId === convId) startNewChat() }
    catch { setError('Non sono riuscito a eliminare la conversazione') }
  }

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000) })
  }

  const filteredConvs = searchConv
    ? conversations.filter(c => c.title?.toLowerCase().includes(searchConv.toLowerCase()))
    : conversations

  const pendingCount = pendingActions.filter(a => a.status === 'pending').length
  const hasPending = pendingCount > 0
  const specialistName = specialists.find(s => s.id === activeSpecialist)?.name

  return (
    <div className="chat">
      {/* Barra */}
      <div className="chat-bar">
        <button className="btn-icon" onClick={() => setShowSidebar(v => !v)} aria-label="Conversazioni precedenti" aria-expanded={showSidebar}><History size={18} /></button>
        <div className="chat-title grow">{specialistName || 'Polpo AI'}</div>

        {providers.length > 0 && (
          <div className="chat-model">
            <button className={`btn btn-sm ${targets.length > 1 ? 'btn-primary' : ''}`} onClick={() => setShowModelPicker(v => !v)} aria-expanded={showModelPicker} aria-haspopup="true">
              {targets.length > 1 ? `${targets.length} modelli` : shortModel(targets[0]?.model) || 'Modello'} <ChevronDown size={12} />
            </button>
            {showModelPicker && (
              <>
                <div className="chat-backdrop" onClick={() => setShowModelPicker(false)} />
                <div className="chat-pop">
                  <p className="help">Uno solo: chat normale. Fino a {MAX_TARGETS}: ricevi tutte le risposte e scegli la migliore.</p>
                  {providers.map(p => (
                    <div key={p.id} className="chat-pop-group">
                      <div className="chat-pop-name">{p.name}</div>
                      {p.models.map(m => (
                        <label key={m} className={`chat-pop-row ${isTargetOn(p.id, m) ? 'is-on' : ''}`}>
                          <input type="checkbox" checked={isTargetOn(p.id, m)} onChange={() => toggleTarget(p.id, m)} disabled={!isTargetOn(p.id, m) && targets.length >= MAX_TARGETS} />
                          <span>{shortModel(m)}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {(hasPending || actionHistory.length > 0) && (
          <button className={`btn btn-sm ${showActionPanel ? 'btn-primary' : ''}`} onClick={() => setShowActionPanel(v => !v)} aria-expanded={showActionPanel}>
            <ListChecks size={14} /> Azioni {hasPending ? <span className="count">{pendingCount}</span> : <span className="faint">{actionHistory.length}</span>}
          </button>
        )}
        <button className="btn btn-sm" onClick={startNewChat}><Plus size={14} /> <span className="chat-new-label">Nuova</span></button>
      </div>

      {specialists.length > 0 && (
        <div className="chat-specialists chips" role="tablist" aria-label="Assistente">
          <button role="tab" aria-selected={!activeSpecialist} className={`chip ${!activeSpecialist ? 'is-active' : ''}`} onClick={() => setActiveSpecialist(null)}>Generico</button>
          {specialists.map(s => (
            <button key={s.id} role="tab" aria-selected={activeSpecialist === s.id} className={`chip ${activeSpecialist === s.id ? 'is-active' : ''}`} onClick={() => setActiveSpecialist(s.id)} title={s.description}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="chat-body">
        {/* Storico */}
        {showSidebar && (
          <>
            <div className="chat-backdrop soft" onClick={() => setShowSidebar(false)} />
            <aside className="chat-side" aria-label="Conversazioni">
              <div className="chat-side-head">
                <strong>Conversazioni</strong> <span className="count ghost">{conversations.length}</span>
                <button className="btn-icon sm" style={{ marginLeft: 'auto' }} onClick={() => setShowSidebar(false)} aria-label="Chiudi"><X size={16} /></button>
              </div>
              <input type="search" placeholder="Cerca" aria-label="Cerca nelle conversazioni" value={searchConv} onChange={(e) => setSearchConv(e.target.value)} />
              <ul className="chat-convs">
                {filteredConvs.length === 0 && <li className="small muted" style={{ padding: 12 }}>{searchConv ? 'Nessun risultato' : 'Ancora nessuna conversazione'}</li>}
                {filteredConvs.map(conv => (
                  <li key={conv.id} className={currentConvId === conv.id ? 'is-active' : ''}>
                    <button className="chat-conv" onClick={() => loadConversation(conv)}>
                      <span className="trunc">{conv.title}</span>
                      <span className="small faint">{new Date(conv.updatedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} · {conv.messageCount || conv.messages?.length || 0} msg</span>
                    </button>
                    <button className="btn-icon sm" onClick={(e) => handleDeleteConv(e, conv.id)} aria-label={`Elimina la conversazione ${conv.title}`}><Trash2 size={14} /></button>
                  </li>
                ))}
              </ul>
            </aside>
          </>
        )}

        {/* Conversazione */}
        <div className="chat-main">
          <div className="chat-scroll">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <h2>Ciao, sono Polpo AI</h2>
                <p className="muted">Ti aiuto a organizzare idee e progetti. Quando serve salvare qualcosa te lo propongo nel pannello Azioni: confermi tu.</p>
                <div className="chat-suggest">
                  {SUGGESTIONS.map(s => <button key={s.label} className="btn" onClick={() => handleSend(s.msg)}>{s.label}</button>)}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                {msg.executedActions?.length > 0 && (
                  <div className="chat-done">
                    {msg.executedActions.map((a, j) => (
                      <span key={j} className="tag"><Check size={11} /> {a.result?.message || a.label}</span>
                    ))}
                  </div>
                )}

                {msg.alternatives?.length > 1 && (
                  <div className="chat-alts" role="tablist" aria-label="Risposte a confronto">
                    {msg.alternatives.map((alt, ai) => (
                      <button
                        key={ai} role="tab" aria-selected={msg.altIndex === ai}
                        className={`chip ${msg.altIndex === ai ? 'is-active' : ''}`}
                        onClick={() => selectAlternative(i, ai)} disabled={!!alt.error} title={alt.error || alt.label}
                      >
                        {alt.error ? '! ' : ''}{shortModel(alt.label.split(' · ')[1])}
                        {alt.ms != null && <span className="n">{(alt.ms / 1000).toFixed(1)}s</span>}
                      </button>
                    ))}
                  </div>
                )}

                <div className="chat-bubble">
                  {msg.role === 'user' ? <p className="pre">{msg.content}</p> : <Markdown text={msg.content} />}
                </div>

                {msg.alternatives?.some(a => a.error) && (
                  <div className="chat-alt-errors small muted">
                    {msg.alternatives.filter(a => a.error).map((a, ei) => <div key={ei}>! {a.label}: {a.error}</div>)}
                  </div>
                )}

                <div className="chat-meta small faint">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    {msg.role === 'assistant' && msg.label && !msg.alternatives && ` · ${msg.label}`}
                  </span>
                  {msg.role === 'assistant' && (
                    <button className="btn btn-sm btn-quiet" onClick={() => copyMessage(msg.content, i)}>
                      {copiedIdx === i ? <><Check size={12} /> Copiato</> : <><Copy size={12} /> Copia</>}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg assistant" role="status">
                <div className="chat-bubble"><span className="chat-typing" aria-hidden="true"><i /><i /><i /></span>
                  <span className="small muted"> {targets.length > 1 ? `${targets.length} modelli stanno rispondendo…` : 'Polpo sta pensando…'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            {error && <div className="form-error" role="alert"><span className="grow">{error}</span><button className="btn-icon sm" onClick={() => setError('')} aria-label="Chiudi"><X size={14} /></button></div>}
            <div className="chat-input-row">
              <textarea
                ref={inputRef} rows={1} value={input} onChange={autosize} onKeyDown={onKeyDown}
                placeholder={voce === 'ascolto' ? 'Ti ascolto…' : 'Scrivi a Polpo AI'} aria-label="Messaggio" disabled={loading}
              />
              {Eco.supportato() && (
                <button
                  className={`btn chat-mic ${voce}`} onClick={parlaConPolpo} disabled={loading && voce === 'fermo'}
                  aria-label={voce === 'parlo' ? 'Interrompi' : voce === 'ascolto' ? 'Smetti di ascoltare' : 'Parla con Polpo'}
                  title={voce === 'parlo' ? 'Interrompi' : 'Parla: la risposta arriva anche a voce'}
                >
                  {voce === 'parlo' ? <Square size={14} /> : <Mic size={16} />}
                </button>
              )}
              <button className="btn btn-primary" onClick={() => handleSend()} disabled={!input.trim() || loading} aria-label="Invia">
                {loading ? <span className="spinner" aria-hidden="true" /> : <ArrowUp size={16} />}
              </button>
            </div>
            <p className="small faint chat-hint">Invio per inviare · Maiusc+Invio per andare a capo{Eco.supportato() && ' · microfono per parlare'}</p>
          </div>
        </div>

        {/* Pannello azioni */}
        {showActionPanel && (
          <aside className="chat-actions" aria-label="Azioni proposte">
            <div className="chat-side-head">
              <strong>Azioni</strong> {hasPending && <span className="count">{pendingCount}</span>}
              <button className="btn-icon sm" style={{ marginLeft: 'auto' }} onClick={() => setShowActionPanel(false)} aria-label="Chiudi il pannello"><X size={16} /></button>
            </div>

            {hasPending && (
              <div className="row" style={{ padding: '8px 12px' }}>
                <button className="btn btn-sm btn-primary grow" onClick={confirmAll} disabled={executingActions}><Check size={14} /> Conferma tutte</button>
                <button className="btn btn-sm grow" onClick={rejectAll} disabled={executingActions}><X size={14} /> Rifiuta tutte</button>
              </div>
            )}

            <div className="chat-action-list">
              {pendingActions.length === 0 && actionHistory.length === 0 && (
                <p className="small muted" style={{ padding: 12 }}>Le azioni proposte da Polpo AI compariranno qui.</p>
              )}

              {pendingActions.map((action, idx) => {
                const open = expandedAction === idx
                return (
                  <div key={action.id} className={`chat-action is-${action.status}`}>
                    <div className="chat-action-top">
                      <button className="chat-action-info" onClick={() => setExpandedAction(open ? null : idx)} aria-expanded={open}>
                        <span className="tag tag-type">{ACTION_LABEL[action.tool] || 'Azione'}</span>
                        <span className="chat-action-label">{action.label}</span>
                      </button>
                      {action.status === 'pending' && (
                        <>
                          <button className="btn-icon sm bordered" onClick={() => confirmAction(idx)} disabled={executingActions} aria-label="Conferma"><Check size={14} /></button>
                          <button className="btn-icon sm bordered" onClick={() => rejectAction(idx)} disabled={executingActions} aria-label="Rifiuta"><X size={14} /></button>
                        </>
                      )}
                      {action.status === 'confirmed' && <span className="tag tag-invert">Salvata</span>}
                      {action.status === 'rejected' && <span className="tag">Rifiutata</span>}
                      {action.status === 'executing' && <span className="tag">Salvo…</span>}
                      {action.status === 'error' && <span className="tag">Errore</span>}
                    </div>
                    {open && (
                      <div className="chat-action-details">
                        {getActionDetails(action).map((d, di) => <div key={di} className="prose" dangerouslySetInnerHTML={{ __html: renderInline(String(d)) }} />)}
                        {action.result?.message && <div className="small muted">{action.result.success ? 'Fatto' : 'Non riuscita'}: {action.result.message}</div>}
                      </div>
                    )}
                  </div>
                )
              })}

              {actionHistory.length > 0 && !hasPending && (
                <>
                  <p className="cal-label" style={{ padding: '12px 12px 4px' }}>Eseguite</p>
                  {actionHistory.map((a, i) => (
                    <div key={i} className="chat-action is-confirmed">
                      <div className="chat-action-top">
                        <div className="chat-action-info" style={{ cursor: 'default' }}>
                          <span className="chat-action-label">{a.result?.message || a.label}</span>
                          <span className="small faint">{new Date(a.confirmedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="chat-mini">
              <div className="small muted" style={{ marginBottom: 6 }}>{hasPending ? 'Chatta per modificare le azioni' : 'Chiedi di organizzare qualcosa'}</div>
              {panelMessages.length > 0 && (
                <div className="chat-mini-msgs">
                  {panelMessages.map((m, i) => (
                    <div key={i} className={`chat-mini-msg ${m.role}`}><Markdown text={m.content} /></div>
                  ))}
                  {panelLoading && <div className="chat-mini-msg assistant"><span className="chat-typing" aria-hidden="true"><i /><i /><i /></span></div>}
                  <div ref={panelEndRef} />
                </div>
              )}
              <div className="row" style={{ gap: 6 }}>
                <input
                  value={panelInput} onChange={(e) => setPanelInput(e.target.value)} disabled={panelLoading}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePanelSend() } }}
                  placeholder="Es. salvalo nel progetto X" aria-label="Messaggio per il pannello azioni"
                />
                <button className="btn btn-primary" onClick={handlePanelSend} disabled={!panelInput.trim() || panelLoading} aria-label="Invia"><ArrowUp size={16} /></button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default AiChat
