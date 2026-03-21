const Home = ({ projects, notes, onNavigate, onAddProject, onAddNote }) => {
  const totalProjects = projects.length;
  const totalNotes = notes.length;

  const projectsByStatus = {
    pending: projects.filter(p => p.status === 'pending').length,
    inProgress: projects.filter(p => p.status === 'in_progress' || p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'paused' || p.status === 'on-hold').length
  };

  const notesByType = {
    note: notes.filter(n => n.type === 'note').length,
    idea: notes.filter(n => n.type === 'idea').length,
    info: notes.filter(n => n.type === 'info').length,
    monologo: notes.filter(n => n.type === 'monologo').length,
    musica: notes.filter(n => n.type === 'musica').length
  };

  const recentProjects = [...projects].slice(0, 5);
  const recentNotes = [...notes].slice(0, 5);

  const allTodos = projects.flatMap(p => p.todos || []);
  const completedTodos = allTodos.filter(t => t.completed).length;
  const totalTodos = allTodos.length;
  const globalProgress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // Projects with progress info
  const projectsWithProgress = projects
    .filter(p => p.todos && p.todos.length > 0)
    .map(p => {
      const done = p.todos.filter(t => t.completed).length;
      const total = p.todos.length;
      return { ...p, progress: Math.round((done / total) * 100), done, total };
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);

  // Activity timeline: merge projects + notes, sort by date
  const timeline = [
    ...projects.map(p => ({
      id: p.id,
      type: 'project',
      title: p.name,
      icon: '📁',
      date: p.updatedAt || p.createdAt,
      status: p.status
    })),
    ...notes.map(n => ({
      id: n.id,
      type: 'note',
      title: n.title,
      icon: n.type === 'idea' ? '💡' : n.type === 'info' ? '📌' : n.type === 'monologo' ? '🎭' : n.type === 'musica' ? '🎵' : '📝',
      date: n.updatedAt || n.createdAt,
      noteType: n.type
    }))
  ]
    .filter(item => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const formatTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'ora';
    if (diff < 3600) return `${Math.floor(diff / 60)}min fa`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h fa`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}g fa`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="home-hero">
        <h1 className="title-main">🐙 GESTIONALE POLPO</h1>
        <p className="home-subtitle">Il tuo hub creativo per progetti e idee</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-projects">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-number">{totalProjects}</div>
            <div className="stat-label">Progetti Totali</div>
          </div>
        </div>

        <div className="stat-card stat-notes">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-number">{totalNotes}</div>
            <div className="stat-label">Note & Idee</div>
          </div>
        </div>

        <div className="stat-card stat-todos">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{completedTodos}/{totalTodos}</div>
            <div className="stat-label">Todos Completati</div>
          </div>
        </div>

        <div className="stat-card stat-progress">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-number">{projectsByStatus.inProgress}</div>
            <div className="stat-label">In Corso</div>
          </div>
        </div>
      </div>

      {/* Global Progress Bar */}
      {totalTodos > 0 && (
        <div className="global-progress-section">
          <div className="global-progress-header">
            <span className="section-title">📈 Progresso Globale</span>
            <span className="global-progress-pct">{globalProgress}%</span>
          </div>
          <div className="global-progress-bar">
            <div className="global-progress-fill" style={{ width: `${globalProgress}%` }}></div>
          </div>
          <div className="global-progress-label">{completedTodos} di {totalTodos} task completati</div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2 className="section-title">⚡ Azioni Rapide</h2>
        <div className="quick-actions-grid">
          <button className="quick-action-btn qa-project" onClick={onAddProject}>
            <span className="qa-icon">📁</span>
            <span className="qa-label">Nuovo Progetto</span>
          </button>
          <button className="quick-action-btn qa-note" onClick={() => onAddNote('note')}>
            <span className="qa-icon">📝</span>
            <span className="qa-label">Nuova Nota</span>
          </button>
          <button className="quick-action-btn qa-idea" onClick={() => onAddNote('idea')}>
            <span className="qa-icon">💡</span>
            <span className="qa-label">Nuova Idea</span>
          </button>
          <button className="quick-action-btn qa-monologo" onClick={() => onAddNote('monologo')}>
            <span className="qa-icon">🎭</span>
            <span className="qa-label">Nuovo Monologo</span>
          </button>
          <button className="quick-action-btn qa-musica" onClick={() => onAddNote('musica')}>
            <span className="qa-icon">🎵</span>
            <span className="qa-label">Nuova Musica</span>
          </button>
          <button className="quick-action-btn qa-all-projects" onClick={() => onNavigate('projects')}>
            <span className="qa-icon">🗂️</span>
            <span className="qa-label">Tutti i Progetti</span>
          </button>
        </div>
      </div>

      {/* Project Progress Cards */}
      {projectsWithProgress.length > 0 && (
        <div className="progress-section">
          <h2 className="section-title">📊 Progresso Progetti</h2>
          <div className="progress-grid">
            {projectsWithProgress.map(p => (
              <div key={p.id} className="progress-card" onClick={() => onNavigate('projects')}>
                <div className="progress-card-header">
                  <span className="progress-card-name">{p.name}</span>
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
                <div key={`${item.type}-${item.id}`} className="timeline-item" onClick={() => onNavigate(item.type === 'project' ? 'projects' : 'notes')}>
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

          {/* Status Breakdown */}
          <h2 className="section-title" style={{ marginTop: '2rem' }}>📊 Stato Progetti</h2>
          <div className="status-breakdown">
            <div className="status-item">
              <div className="status-bar status-pending" style={{ width: `${(projectsByStatus.pending / totalProjects * 100) || 0}%` }}></div>
              <div className="status-info">
                <span className="status-label">⏳ Da Iniziare</span>
                <span className="status-count">{projectsByStatus.pending}</span>
              </div>
            </div>
            <div className="status-item">
              <div className="status-bar status-in-progress" style={{ width: `${(projectsByStatus.inProgress / totalProjects * 100) || 0}%` }}></div>
              <div className="status-info">
                <span className="status-label">🚀 In Corso</span>
                <span className="status-count">{projectsByStatus.inProgress}</span>
              </div>
            </div>
            <div className="status-item">
              <div className="status-bar status-completed" style={{ width: `${(projectsByStatus.completed / totalProjects * 100) || 0}%` }}></div>
              <div className="status-info">
                <span className="status-label">✅ Completati</span>
                <span className="status-count">{projectsByStatus.completed}</span>
              </div>
            </div>
            <div className="status-item">
              <div className="status-bar status-on-hold" style={{ width: `${(projectsByStatus.onHold / totalProjects * 100) || 0}%` }}></div>
              <div className="status-info">
                <span className="status-label">⏸️ In Pausa</span>
                <span className="status-count">{projectsByStatus.onHold}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Overview */}
        <div className="home-column">
          <h2 className="section-title">🎨 Tipologie Note</h2>
          <div className="notes-breakdown">
            <div className="note-type-card" style={{ background: 'linear-gradient(135deg, #48dbfb, #0abde3)' }}>
              <div className="note-type-icon">📝</div>
              <div className="note-type-count">{notesByType.note}</div>
              <div className="note-type-label">Note</div>
            </div>
            <div className="note-type-card" style={{ background: 'linear-gradient(135deg, #feca57, #f6b93b)' }}>
              <div className="note-type-icon">💡</div>
              <div className="note-type-count">{notesByType.idea}</div>
              <div className="note-type-label">Idee</div>
            </div>
            <div className="note-type-card" style={{ background: 'linear-gradient(135deg, #20c997, #0ca678)' }}>
              <div className="note-type-icon">📌</div>
              <div className="note-type-count">{notesByType.info}</div>
              <div className="note-type-label">Info Salvate</div>
            </div>
            <div className="note-type-card" style={{ background: 'linear-gradient(135deg, #ff9ff3, #ee5a6f)' }}>
              <div className="note-type-icon">🎭</div>
              <div className="note-type-count">{notesByType.monologo}</div>
              <div className="note-type-label">Monologhi</div>
            </div>
            <div className="note-type-card" style={{ background: 'linear-gradient(135deg, #54a0ff, #5f27cd)' }}>
              <div className="note-type-icon">🎵</div>
              <div className="note-type-count">{notesByType.musica}</div>
              <div className="note-type-label">Musica</div>
            </div>
          </div>

          {/* Recent Notes */}
          {recentNotes.length > 0 && (
            <>
              <h2 className="section-title" style={{ marginTop: '2rem' }}>🕐 Note Recenti</h2>
              <div className="recent-items">
                {recentNotes.map(note => (
                  <div key={note.id} className="recent-item" onClick={() => onNavigate('notes')}>
                    <div className="recent-icon">
                      {note.type === 'idea' ? '💡' :
                       note.type === 'info' ? '📌' :
                       note.type === 'monologo' ? '🎭' :
                       note.type === 'musica' ? '🎵' : '📝'}
                    </div>
                    <div className="recent-content">
                      <div className="recent-title">{note.title}</div>
                      <div className="recent-meta">
                        <span className={`badge badge-type-${note.type}`}>
                          {note.type === 'idea' ? '💡 Idea' :
                           note.type === 'info' ? '📌 Info' :
                           note.type === 'monologo' ? '🎭 Monologo' :
                           note.type === 'musica' ? '🎵 Musica' :
                           '📝 Nota'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
