const Home = ({ projects, notes, onNavigate, onAddProject, onAddNote }) => {
  // Calculate statistics
  const totalProjects = projects.length;
  const totalNotes = notes.length;

  // Projects by status
  const projectsByStatus = {
    pending: projects.filter(p => p.status === 'pending').length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onHold: projects.filter(p => p.status === 'on-hold').length
  };

  // Notes by type
  const notesByType = {
    note: notes.filter(n => n.type === 'note').length,
    idea: notes.filter(n => n.type === 'idea').length,
    info: notes.filter(n => n.type === 'info').length,
    monologo: notes.filter(n => n.type === 'monologo').length,
    musica: notes.filter(n => n.type === 'musica').length
  };

  // Recent items (last 5)
  const recentProjects = [...projects].slice(0, 5);
  const recentNotes = [...notes].slice(0, 5);

  // Total todos and completed
  const allTodos = projects.flatMap(p => p.todos || []);
  const completedTodos = allTodos.filter(t => t.completed).length;
  const totalTodos = allTodos.length;

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

      {/* Two Column Layout */}
      <div className="home-two-columns">
        {/* Projects Overview */}
        <div className="home-column">
          <h2 className="section-title">📊 Stato Progetti</h2>
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

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <>
              <h2 className="section-title" style={{ marginTop: '2rem' }}>🕐 Progetti Recenti</h2>
              <div className="recent-items">
                {recentProjects.map(project => (
                  <div key={project.id} className="recent-item" onClick={() => onNavigate('projects')}>
                    <div className="recent-icon">📁</div>
                    <div className="recent-content">
                      <div className="recent-title">{project.name}</div>
                      <div className="recent-meta">
                        <span className={`badge badge-status-${project.status}`}>
                          {project.status === 'pending' ? '⏳ Da Iniziare' :
                           project.status === 'in-progress' ? '🚀 In Corso' :
                           project.status === 'completed' ? '✅ Completato' :
                           '⏸️ In Pausa'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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
