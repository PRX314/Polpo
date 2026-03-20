import { useState, useEffect, useRef, useCallback } from 'react'
import {
  sendMessage,
  executeActions,
  generateTitle,
  saveConversation,
  updateConversation,
  subscribeToConversations,
  deleteConversation
} from '../services/chatService'

// Icone e label per tipo azione
const ACTION_META = {
  add_note: { icon: '📝', label: 'Nuova Nota', color: '#feca57' },
  add_project: { icon: '📁', label: 'Nuovo Progetto', color: '#48dbfb' },
  add_todo: { icon: '✅', label: 'Nuovo Todo', color: '#20c997' },
  complete_todo: { icon: '✔️', label: 'Completa Todo', color: '#20c997' },
  update_project: { icon: '🔄', label: 'Aggiorna Progetto', color: '#54a0ff' },
  update_note: { icon: '📋', label: 'Aggiorna Nota', color: '#54a0ff' },
  add_link_to_project: { icon: '🔗', label: 'Nuovo Link', color: '#48dbfb' },
  delete_note: { icon: '🗑️', label: 'Elimina Nota', color: '#ff6b6b' }
}

// Markdown -> HTML
function formatMarkdown(text) {
  if (!text) return ''
  let html = text
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="chat-li-num">$1</li>')
    .replace(/^[-•]\s+(.+)$/gm, '<li class="chat-li-bullet">$1</li>')
    .replace(/^---$/gm, '<hr class="chat-hr"/>')
    .replace(/\n/g, '<br/>')
  html = html.replace(/((?:<li class="chat-li-bullet">.+?<\/li><br\/>?)+)/g, (m) =>
    '<ul class="chat-ul">' + m.replace(/<br\/>/g, '') + '</ul>')
  html = html.replace(/((?:<li class="chat-li-num">.+?<\/li><br\/>?)+)/g, (m) =>
    '<ol class="chat-ol">' + m.replace(/<br\/>/g, '') + '</ol>')
  return html
}

// Dettagli azione leggibili
function getActionDetails(action) {
  const { tool, args } = action
  switch (tool) {
    case 'add_note': return [
      args.title && `**${args.title}**`,
      args.type && `Tipo: ${args.type}`,
      args.category && `Cat: ${args.category}`,
      args.priority && `Priorità: ${args.priority}`,
      args.projectTags?.length && `→ ${args.projectTags.join(', ')}`,
      args.content
    ].filter(Boolean)
    case 'add_project': return [
      `**${args.name}**`,
      args.status && `Stato: ${args.status}`,
      args.tags?.length && `Tags: ${args.tags.join(', ')}`,
      args.description
    ].filter(Boolean)
    case 'add_todo': return [`**${args.projectName}**`, `Task: ${args.text}`]
    case 'complete_todo': return [`**${args.projectName}**`, `Todo: ${args.todoText}`]
    case 'update_project': return [
      `**${args.projectName}**`,
      args.status && `Nuovo stato: ${args.status}`,
      args.description && `Descrizione aggiornata`,
      args.roadmap && `Roadmap aggiornata`,
      args.obiettivi && `Obiettivi aggiornati`
    ].filter(Boolean)
    case 'update_note': return [`**${args.noteTitle}**`, args.title && `Nuovo titolo: ${args.title}`].filter(Boolean)
    case 'add_link_to_project': return [`**${args.projectName}**`, `${args.linkTitle}: ${args.url}`]
    case 'delete_note': return [`**${args.noteTitle}**`]
    default: return [action.label]
  }
}

function AiChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [currentConvId, setCurrentConvId] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [searchConv, setSearchConv] = useState('')
  const [error, setError] = useState('')
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [contextStats, setContextStats] = useState(null)
  // Pannello azioni
  const [pendingActions, setPendingActions] = useState([])
  const [executingActions, setExecutingActions] = useState(false)
  const [expandedAction, setExpandedAction] = useState(null)
  const [showActionPanel, setShowActionPanel] = useState(false)
  const [actionHistory, setActionHistory] = useState([])
  // Mini-chat pannello (indipendente dalla chat principale)
  const [panelMessages, setPanelMessages] = useState([])
  const [panelInput, setPanelInput] = useState('')
  const [panelLoading, setPanelLoading] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)
  const panelEndRef = useRef(null)
  const actionPanelRef = useRef(null)

  useEffect(() => {
    const unsub = subscribeToConversations(
      (convs) => setConversations(convs),
      (err) => console.error('Errore caricamento chat:', err)
    )
    return () => unsub()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    panelEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [panelMessages, panelLoading])

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  // Apri pannello automaticamente quando ci sono azioni
  useEffect(() => {
    if (pendingActions.some(a => a.status === 'pending')) {
      setShowActionPanel(true)
    }
  }, [pendingActions])

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }, [])

  const handleSend = async (textOverride) => {
    const text = (textOverride || input).trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)
    setError('')

    try {
      const { reply, proposedActions, stats } = await sendMessage(text, messages)
      if (stats) setContextStats(stats)

      const aiMsg = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        executedActions: []
      }
      const updatedMessages = [...newMessages, aiMsg]
      setMessages(updatedMessages)

      // Se ci sono azioni proposte
      if (proposedActions && proposedActions.length > 0) {
        setPendingActions(proposedActions.map((a, i) => ({ ...a, id: `${Date.now()}-${i}`, status: 'pending' })))
      }

      // Salva su Firestore
      if (currentConvId) {
        await updateConversation(currentConvId, updatedMessages)
      } else {
        let title = text.length > 40 ? text.substring(0, 40) + '...' : text
        const id = await saveConversation(title, updatedMessages)
        setCurrentConvId(id)
        generateTitle(updatedMessages).then(aiTitle => {
          if (aiTitle && aiTitle !== 'Conversazione') {
            updateConversation(id, updatedMessages, aiTitle)
          }
        }).catch(() => {})
      }
    } catch (err) {
      setError(err.message || 'Errore nella comunicazione con Polpo AI')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // Mini-chat nel pannello: conversazione SEPARATA per gestire le azioni
  const handlePanelSend = async (textOverride) => {
    const text = (textOverride || panelInput).trim()
    if (!text || panelLoading) return

    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() }
    setPanelMessages(prev => [...prev, userMsg])
    setPanelInput('')
    setPanelLoading(true)

    try {
      // Costruisco contesto con le azioni pending per l'AI
      const actionsContext = pendingActions
        .filter(a => a.status === 'pending')
        .map((a, i) => `[Azione ${i + 1}] ${a.label} (tool: ${a.tool}, args: ${JSON.stringify(a.args)})`)
        .join('\n')

      const contextMsg = `CONTESTO: L'utente sta gestendo queste azioni proposte nel pannello laterale:\n${actionsContext}\n\nL'utente dice: ${text}`

      // Uso la history del pannello, non della chat principale
      const panelHistory = panelMessages.map(m => ({ role: m.role, content: m.content }))
      const { reply, proposedActions, stats } = await sendMessage(contextMsg, panelHistory, 'panel')
      if (stats) setContextStats(stats)

      const aiMsg = { role: 'assistant', content: reply, timestamp: new Date().toISOString() }
      setPanelMessages(prev => [...prev, aiMsg])

      // Se l'AI propone nuove azioni (versioni modificate), sostituisci le pending
      if (proposedActions && proposedActions.length > 0) {
        // Rimuovi le vecchie pending e metti le nuove
        setPendingActions(prev => [
          ...prev.filter(a => a.status !== 'pending'),
          ...proposedActions.map((a, i) => ({ ...a, id: `${Date.now()}-${i}`, status: 'pending' }))
        ])
      }
    } catch (err) {
      const errMsg = { role: 'assistant', content: `Errore: ${err.message}`, timestamp: new Date().toISOString() }
      setPanelMessages(prev => [...prev, errMsg])
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
      const { results, stats } = await executeActions([action])
      if (stats) setContextStats(stats)

      const result = results[0]?.result
      updated[actionIdx] = { ...action, status: result?.success ? 'confirmed' : 'error', result }
      setPendingActions([...updated])
      setActionHistory(prev => [...prev, { ...action, result, confirmedAt: new Date().toISOString() }])

      // Aggiorna ultimo messaggio
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
      const { results, stats } = await executeActions(toConfirm)
      if (stats) setContextStats(stats)

      setPendingActions(prev => prev.map(a => {
        if (a.status !== 'executing') return a
        const r = results.find(r => r.tool === a.tool && r.label === a.label)
        return { ...a, status: r?.result?.success ? 'confirmed' : 'error', result: r?.result }
      }))

      const newHistory = results.map(r => ({ tool: r.tool, label: r.label, result: r.result, confirmedAt: new Date().toISOString() }))
      setActionHistory(prev => [...prev, ...newHistory])

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

  const rejectAction = (idx) => {
    setPendingActions(prev => { const u = [...prev]; u[idx] = { ...u[idx], status: 'rejected' }; return u })
  }

  const rejectAll = () => {
    setPendingActions(prev => prev.map(a => a.status === 'pending' ? { ...a, status: 'rejected' } : a))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const startNewChat = () => {
    setMessages([]); setCurrentConvId(null); setShowSidebar(false)
    setContextStats(null); setPendingActions([]); setActionHistory([])
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
    catch { setError('Errore eliminazione conversazione') }
  }

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000) })
  }

  const filteredConvs = searchConv
    ? conversations.filter(c => c.title?.toLowerCase().includes(searchConv.toLowerCase()))
    : conversations

  const suggestions = [
    { icon: '📊', label: 'Riepilogo', msg: 'Fammi un riepilogo completo dei miei progetti e cosa devo fare' },
    { icon: '💡', label: 'Idee', msg: 'Analizza i miei progetti e suggeriscimi nuove idee o miglioramenti' },
    { icon: '🎯', label: 'Priorità', msg: 'Quali sono le 3 priorità principali per questa settimana?' },
    { icon: '📋', label: 'Piano', msg: 'Creami un piano d\'azione settimanale' },
    { icon: '🧠', label: 'Brainstorm', msg: 'Facciamo brainstorming su un nuovo progetto' },
    { icon: '✅', label: 'Task aperti', msg: 'Quali task ho ancora da completare?' },
  ]

  const hasPending = pendingActions.some(a => a.status === 'pending')
  const pendingCount = pendingActions.filter(a => a.status === 'pending').length

  return (
    <div className="ai-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button onClick={() => setShowSidebar(!showSidebar)} className="chat-sidebar-toggle" title="Storico">☰</button>
          <div className="chat-header-title">
            <span className="chat-logo">🐙</span>
            <span>Polpo AI</span>
          </div>
          {contextStats && (
            <div className="chat-header-stats">
              <span>{contextStats.progetti} prog</span>
              <span className="chat-header-dot">·</span>
              <span>{contextStats.note} note</span>
              <span className="chat-header-dot">·</span>
              <span>{contextStats.todoCompletati}/{contextStats.todoTotali} todo</span>
            </div>
          )}
        </div>
        <div className="chat-header-right">
          {/* Indicatore azioni pendenti */}
          {hasPending && (
            <button
              onClick={() => setShowActionPanel(!showActionPanel)}
              className="chat-actions-indicator"
              title="Azioni in attesa"
            >
              📋 {pendingCount}
            </button>
          )}
          {actionHistory.length > 0 && !hasPending && (
            <button
              onClick={() => setShowActionPanel(!showActionPanel)}
              className="chat-actions-indicator done"
              title="Storico azioni"
            >
              ✅ {actionHistory.length}
            </button>
          )}
          <button onClick={startNewChat} className="chat-new-btn">+ Nuova</button>
        </div>
      </div>

      <div className="chat-body">
        {/* Sidebar overlay */}
        {showSidebar && <div className="chat-sidebar-overlay" onClick={() => setShowSidebar(false)} />}

        {/* Sidebar storico */}
        {showSidebar && (
          <div className="chat-sidebar">
            <div className="chat-sidebar-header"><span>Conversazioni ({conversations.length})</span></div>
            <div className="chat-sidebar-search">
              <input type="text" placeholder="Cerca..." value={searchConv} onChange={(e) => setSearchConv(e.target.value)} className="chat-sidebar-search-input" />
            </div>
            <div className="chat-sidebar-list">
              {filteredConvs.length === 0 ? (
                <div className="chat-sidebar-empty">{searchConv ? 'Nessun risultato' : 'Nessuna conversazione'}</div>
              ) : filteredConvs.map(conv => (
                <div key={conv.id} className={`chat-sidebar-item ${currentConvId === conv.id ? 'active' : ''}`} onClick={() => loadConversation(conv)}>
                  <div className="chat-sidebar-item-title">{conv.title}</div>
                  <div className="chat-sidebar-item-meta">
                    <span>{new Date(conv.updatedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} · {conv.messageCount || conv.messages?.length || 0} msg</span>
                    <button onClick={(e) => handleDeleteConv(e, conv.id)} className="chat-sidebar-delete" title="Elimina">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAT PRINCIPALE */}
        <div className="chat-messages-area">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">🐙</div>
                <h3>Ciao! Sono Polpo AI</h3>
                <p>Chiacchieriamo! Ti aiuto a organizzare idee e progetti.<br/>
                Quando serve salvare qualcosa, te lo propongo nel pannello a destra.</p>
                <div className="chat-suggestions">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSend(s.msg)}>
                      <span className="chat-sug-icon">{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i}>
                {/* Chip azioni già confermate */}
                {msg.executedActions && msg.executedActions.length > 0 && (
                  <div className="chat-actions-bar">
                    {msg.executedActions.map((a, j) => (
                      <div key={j} className={`chat-action-chip ${a.result?.success ? 'success' : 'error'}`}>
                        <span className="chat-action-icon">{a.result?.success ? (ACTION_META[a.tool]?.icon || '⚡') : '❌'}</span>
                        <span>{a.result?.message || a.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className={`chat-message ${msg.role}`}>
                  <div className="chat-message-avatar">{msg.role === 'user' ? '👤' : '🐙'}</div>
                  <div className="chat-message-content">
                    <div className="chat-message-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                    <div className="chat-message-footer">
                      <span className="chat-message-time">
                        {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'assistant' && (
                        <button className="chat-copy-btn" onClick={() => copyMessage(msg.content, i)}>
                          {copiedIdx === i ? '✓ Copiato' : 'Copia'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message assistant">
                <div className="chat-message-avatar">🐙</div>
                <div className="chat-message-content">
                  <div className="chat-typing"><span></span><span></span><span></span></div>
                  <div className="chat-typing-label">Polpo sta pensando...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input chat */}
          <div className="chat-input-area">
            {error && (
              <div className="chat-error">
                <span>{error}</span>
                <button onClick={() => setError('')} className="chat-error-close">×</button>
              </div>
            )}
            <div className="chat-input-row">
              <textarea
                ref={(el) => { inputRef.current = el; textareaRef.current = el }}
                value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
                placeholder="Scrivi a Polpo AI..." rows={1} disabled={loading} className="chat-input"
              />
              <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="chat-send-btn">
                {loading ? <span className="chat-send-loading"></span> : '➤'}
              </button>
            </div>
            <div className="chat-input-hint">Enter per inviare · Shift+Enter per a capo</div>
          </div>
        </div>

        {/* PANNELLO AZIONI (destra) */}
        {showActionPanel && (
          <div className="chat-action-panel" ref={actionPanelRef}>
            <div className="chat-action-panel-header">
              <div className="chat-action-panel-title">
                <span>📋 Azioni</span>
                {hasPending && <span className="chat-action-panel-badge">{pendingCount}</span>}
              </div>
              <button onClick={() => setShowActionPanel(false)} className="chat-action-panel-close">×</button>
            </div>

            {/* Bottoni conferma/rifiuta tutte */}
            {hasPending && (
              <div className="chat-action-panel-bulk">
                <button onClick={confirmAll} disabled={executingActions} className="chat-panel-btn confirm">
                  ✓ Conferma tutte
                </button>
                <button onClick={rejectAll} disabled={executingActions} className="chat-panel-btn reject">
                  ✕ Rifiuta tutte
                </button>
              </div>
            )}

            {/* Lista azioni */}
            <div className="chat-action-panel-list">
              {pendingActions.length === 0 && actionHistory.length === 0 && (
                <div className="chat-action-panel-empty">
                  <span style={{ fontSize: '2rem' }}>📋</span>
                  <p>Le azioni proposte da Polpo AI appariranno qui</p>
                </div>
              )}

              {pendingActions.map((action, idx) => {
                const meta = ACTION_META[action.tool] || { icon: '⚡', label: 'Azione', color: '#999' }
                const details = getActionDetails(action)
                const isExpanded = expandedAction === idx
                const statusClass = action.status

                return (
                  <div key={action.id} className={`chat-action-card ${statusClass}`}>
                    <div className="chat-action-card-top" onClick={() => setExpandedAction(isExpanded ? null : idx)}>
                      <div className="chat-action-card-icon" style={{ background: meta.color }}>{meta.icon}</div>
                      <div className="chat-action-card-info">
                        <div className="chat-action-card-label">{action.label}</div>
                        <div className="chat-action-card-type">{meta.label}</div>
                      </div>
                      <div className="chat-action-card-btns">
                        {action.status === 'pending' && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); confirmAction(idx) }} disabled={executingActions} className="chat-action-btn-sm confirm" title="Conferma">✓</button>
                            <button onClick={(e) => { e.stopPropagation(); rejectAction(idx) }} disabled={executingActions} className="chat-action-btn-sm reject" title="Rifiuta">✕</button>
                          </>
                        )}
                        {action.status === 'confirmed' && <span className="chat-action-status-tag confirmed">Salvato ✓</span>}
                        {action.status === 'rejected' && <span className="chat-action-status-tag rejected">Rifiutata</span>}
                        {action.status === 'executing' && <span className="chat-action-status-tag executing">Salvo...</span>}
                        {action.status === 'error' && <span className="chat-action-status-tag error">Errore</span>}
                      </div>
                    </div>

                    {/* Dettagli espansi */}
                    {isExpanded && (
                      <div className="chat-action-card-details">
                        {details.map((d, di) => (
                          <div key={di} className="chat-action-detail-line" dangerouslySetInnerHTML={{ __html: formatMarkdown(d) }} />
                        ))}
                        {action.result?.message && (
                          <div className={`chat-action-result ${action.result.success ? 'ok' : 'fail'}`}>
                            {action.result.success ? '✅' : '❌'} {action.result.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Storico azioni già eseguite */}
              {actionHistory.length > 0 && !hasPending && (
                <>
                  <div className="chat-action-panel-divider">Azioni eseguite</div>
                  {actionHistory.map((a, i) => (
                    <div key={i} className="chat-action-card confirmed mini">
                      <div className="chat-action-card-top">
                        <div className="chat-action-card-icon mini" style={{ background: ACTION_META[a.tool]?.color || '#20c997' }}>
                          {ACTION_META[a.tool]?.icon || '✓'}
                        </div>
                        <div className="chat-action-card-info">
                          <div className="chat-action-card-label">{a.result?.message || a.label}</div>
                          <div className="chat-action-card-type">
                            {new Date(a.confirmedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Mini-chat indipendente per gestire le azioni */}
            <div className="chat-action-panel-minichat">
              <div className="chat-action-minichat-label">
                {hasPending ? 'Chatta per modificare le azioni' : 'Chiedi di organizzare qualcosa'}
              </div>

              {/* Messaggi della mini-chat */}
              {panelMessages.length > 0 && (
                <div className="chat-panel-messages">
                  {panelMessages.map((msg, i) => (
                    <div key={i} className={`chat-panel-msg ${msg.role}`}>
                      <span className="chat-panel-msg-avatar">{msg.role === 'user' ? '👤' : '🐙'}</span>
                      <div className="chat-panel-msg-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                    </div>
                  ))}
                  {panelLoading && (
                    <div className="chat-panel-msg assistant">
                      <span className="chat-panel-msg-avatar">🐙</span>
                      <div className="chat-panel-msg-text">
                        <span className="chat-panel-typing">●●●</span>
                      </div>
                    </div>
                  )}
                  <div ref={panelEndRef} />
                </div>
              )}

              <div className="chat-action-minichat-row">
                <input
                  type="text"
                  value={panelInput}
                  onChange={(e) => setPanelInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePanelSend() } }}
                  placeholder="Es: salvalo nel progetto X..."
                  className="chat-action-minichat-input"
                  disabled={panelLoading}
                />
                <button
                  onClick={() => handlePanelSend()}
                  disabled={!panelInput.trim() || panelLoading}
                  className="chat-action-minichat-send"
                >➤</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AiChat
