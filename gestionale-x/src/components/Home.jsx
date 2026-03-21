import { useState, useCallback } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { ITEM_TYPE_LIST, getTypeInfo } from '../itemTypes'

const Home = ({ projects, notes, onNavigate, onAddProject, onAiMessage }) => {
  const [aiInput, setAiInput] = useState('')

  const onVoiceResult = useCallback((text) => {
    setAiInput(prev => prev + (prev ? ' ' : '') + text)
  }, [])
  const { isListening, isSupported, toggle: toggleVoice } = useSpeechRecognition({ onResult: onVoiceResult })

  const handleAiSubmit = () => {
    if (!aiInput.trim()) return
    if (onAiMessage) {
      onAiMessage(aiInput.trim())
    } else {
      onNavigate('ai-chat')
    }
    setAiInput('')
  }

  // Normalize projects
  const items = projects.map(p => ({ ...p, type: p.type || 'progetto' }))
  const totalItems = items.length

  const projectsByStatus = {
    pending: items.filter(p => p.status === 'pending').length,
    inProgress: items.filter(p => p.status === 'in_progress' || p.status === 'in-progress').length,
    completed: items.filter(p => p.status === 'completed').length,
    onHold: items.filter(p => p.status === 'paused' || p.status === 'on-hold').length
  }

  // Count by type
  const itemsByType = ITEM_TYPE_LIST.map(t => ({
    ...t,
    count: items.filter(p => p.type === t.key).length
  })).filter(t => t.count > 0)

  const allTodos = items.flatMap(p => p.todos || [])
  const completedTodos = allTodos.filter(t => t.completed).length
  const totalTodos = allTodos.length
  const globalProgress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0

  // Items with progress info
  const itemsWithProgress = items
    .filter(p => p.todos && p.todos.length > 0)
    .map(p => {
      const done = p.todos.filter(t => t.completed).length
      const total = p.todos.length
      return { ...p, progress: Math.round((done / total) * 100), done, total }
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6)

  // Activity timeline
  const timeline = items
    .map(p => ({
      id: p.id,
      type: p.type || 'progetto',
      title: p.name,
      icon: getTypeInfo(p.type).icon,
      date: p.updatedAt || p.createdAt,
      status: p.status
    }))
    .filter(item => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)

  const formatTimeAgo = (dateStr) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'ora'
    if (diff < 3600) return `${Math.floor(diff / 60)}min fa`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h fa`
    if (diff < 604800) return `${Math.floor(diff / 86400)}g fa`
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="home-container">
      {/* AI Chat Box */}
      <div className="home-ai-box">
        <div className="home-ai-header">
          <span>🐙 Chiedi a Polpo AI</span>
        </div>
        <div className="home-ai-input-row">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
            placeholder={isListening ? '🎤 Sto ascoltando...' : 'Scrivi qualcosa o parla...'}
            className={`home-ai-input ${isListening ? 'voice-active' : ''}`}
          />
          {isSupported && (
            <button
              className={`home-ai-voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleVoice}
              title={isListening ? 'Stop' : 'Parla'}
            >
              {isListening ? '⏹️' : '🎤'}
            </button>
          )}
          <button
            className="home-ai-send-btn"
            onClick={handleAiSubmit}
            disabled={!aiInput.trim()}
          >
            ➤
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card stat-projects" onClick={() => onNavigate('items')}>
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-number">{totalItems}</div>
            <div className="stat-label">Elementi</div>
          </div>
        </div>
        <div className="stat-card stat-todos">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{completedTodos}/{totalTodos}</div>
            <div className="stat-label">Task</div>
          </div>
        </div>
        <div className="stat-card stat-progress">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-number">{projectsByStatus.inProgress}</div>
            <div className="stat-label">In Corso</div>
          </div>
        </div>
        <div className="stat-card stat-notes">
          <div className="stat-icon">✔️</div>
          <div className="stat-content">
            <div className="stat-number">{projectsByStatus.completed}</div>
            <div className="stat-label">Completati</div>
          </div>
        </div>
      </div>

      {/* Global Progress Bar */}
      {totalTodos > 0 && (
        <div className="global-progress-section">
          <div className="global-progress-header">
            <span className="section-title">📈 Progresso</span>
            <span className="global-progress-pct">{globalProgress}%</span>
          </div>
          <div className="global-progress-bar">
            <div className="global-progress-fill" style={{ width: `${globalProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* Quick Actions — unified types */}
      <div className="quick-actions-section">
        <div className="quick-actions-grid">
          {ITEM_TYPE_LIST.map(t => (
            <button
              key={t.key}
              className="quick-action-btn"
              style={{ '--qa-color': t.color }}
              onClick={() => onAddProject(t.key)}
            >
              <span className="qa-icon">{t.icon}</span>
              <span className="qa-label">{t.label}</span>
            </button>
          ))}
          <button className="quick-action-btn" style={{ '--qa-color': '#6b7280' }} onClick={() => onNavigate('ai-chat')}>
            <span className="qa-icon">🐙</span>
            <span className="qa-label">AI Chat</span>
          </button>
        </div>
      </div>

      {/* Progress Cards */}
      {itemsWithProgress.length > 0 && (
        <div className="progress-section">
          <h2 className="section-title">📊 Progresso</h2>
          <div className="progress-grid">
            {itemsWithProgress.map(p => (
              <div key={p.id} className="progress-card" onClick={() => onNavigate('items')}>
                <div className="progress-card-header">
                  <span className="progress-card-name">{getTypeInfo(p.type).icon} {p.name}</span>
                  <span className="progress-card-pct">{p.progress}%</span>
                </div>
                <div className="progress-card-bar">
                  <div
                    className="progress-card-fill"
                    style={{
                      width: `${p.progress}%`,
                      background: p.progress === 100
                        ? 'linear-gradient(90deg, #20c997, #28a745)'
                        : p.progress > 50
                        ? 'linear-gradient(90deg, #48dbfb, #54a0ff)'
                        : 'linear-gradient(90deg, #feca57, #fd7e14)'
                    }}
                  ></div>
                </div>
                <div className="progress-card-meta">{p.done}/{p.total} task</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="home-two-columns">
        {/* Activity Timeline */}
        <div className="home-column">
          <h2 className="section-title">🕐 Attivita Recente</h2>
          {timeline.length > 0 ? (
            <div className="activity-timeline">
              {timeline.map((item, i) => (
                <div key={`${item.type}-${item.id}`} className="timeline-item" onClick={() => onNavigate('items')}>
                  <div className="timeline-dot"></div>
                  {i < timeline.length - 1 && <div className="timeline-line"></div>}
                  <div className="timeline-content">
                    <div className="timeline-icon">{item.icon}</div>
                    <div className="timeline-info">
                      <div className="timeline-title">{item.title}</div>
                      <div className="timeline-time">{formatTimeAgo(item.date)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p>Nessuna attivita ancora</p>
            </div>
          )}
        </div>

        {/* Types Overview */}
        <div className="home-column">
          <h2 className="section-title">🎨 Per Tipo</h2>
          <div className="notes-breakdown">
            {itemsByType.map(t => (
              <div
                key={t.key}
                className="note-type-card"
                style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)` }}
                onClick={() => onNavigate('items')}
              >
                <div className="note-type-icon">{t.icon}</div>
                <div className="note-type-count">{t.count}</div>
                <div className="note-type-label">{t.label}</div>
              </div>
            ))}
          </div>

          {/* Status Breakdown */}
          <h2 className="section-title" style={{ marginTop: '2rem' }}>📊 Per Stato</h2>
          <div className="status-breakdown">
            {[
              { key: 'pending', label: '⏳ Da Iniziare', count: projectsByStatus.pending, cls: 'status-pending' },
              { key: 'inProgress', label: '🚀 In Corso', count: projectsByStatus.inProgress, cls: 'status-in-progress' },
              { key: 'completed', label: '✅ Completati', count: projectsByStatus.completed, cls: 'status-completed' },
              { key: 'onHold', label: '⏸️ In Pausa', count: projectsByStatus.onHold, cls: 'status-on-hold' }
            ].map(s => (
              <div key={s.key} className="status-item">
                <div className={`status-bar ${s.cls}`} style={{ width: `${(s.count / totalItems * 100) || 0}%` }}></div>
                <div className="status-info">
                  <span className="status-label">{s.label}</span>
                  <span className="status-count">{s.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
