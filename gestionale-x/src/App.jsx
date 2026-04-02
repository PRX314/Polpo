import { useState, useEffect, useRef } from 'react'
import { onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from './firebase'
import {
  subscribeToProjects,
  subscribeToNotes,
  initializeSampleData,
  addProject,
  updateProject,
  deleteProject,
  deleteNote
} from './firebaseService'
import Auth from './components/Auth'
import Home from './components/Home'
import AddProjectForm from './components/AddProjectForm'
import ProjectCard from './components/ProjectCard'
import AiChat from './components/AiChat'
import ProjectDetailView from './components/ProjectDetailView'
import ChangePasswordModal from './components/ChangePasswordModal'
import StatusBadge from './components/ui/StatusBadge'
import { ITEM_TYPE_LIST, getTypeInfo } from './itemTypes'
import Calendar from './components/Calendar'
import { exportProjectsCSV } from './services/exportService'
import { setupPushNotifications, startDeadlineChecker, stopDeadlineChecker } from './services/notificationService'
import ThemeSlider from './components/ThemeSlider'
import ThemeSettings from './components/ThemeSettings'
import { useTheme } from './ThemeContext'
import './styles.css'

function App() {
  const { showThemeSettings } = useTheme()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [view, setView] = useState('home') // 'home', 'items', 'item-detail', 'ai-chat', 'calendar'
  const [filterType, setFilterType] = useState('all') // 'all' or a type key
  const [showAddProjectForm, setShowAddProjectForm] = useState(false)
  const [addFormInitialType, setAddFormInitialType] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchProjects, setSearchProjects] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [sortProjects, setSortProjects] = useState('date') // date, name, progress
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [activeTag, setActiveTag] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // grid, list
  const [showFilters, setShowFilters] = useState(false)
  const [pendingAiMessage, setPendingAiMessage] = useState('')

  // Auto-dismiss toast messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Initialize sample data only once when user first logs in
  useEffect(() => {
    const initializeData = async () => {
      try {
        await initializeSampleData()
      } catch (error) {
        console.error('Error initializing sample data:', error)
      }
    }

    if (user) {
      initializeData()
    }
  }, [user])

  // Setup push notifications when user logs in
  useEffect(() => {
    if (user) {
      try { setupPushNotifications().catch(() => {}) } catch (e) { console.warn('Push setup failed:', e) }
    }
  }, [user])

  // Start deadline checker when projects change
  const projectsRef = useRef(projects)
  projectsRef.current = projects

  useEffect(() => {
    if (user && projects.length > 0) {
      try {
        startDeadlineChecker(() => projectsRef.current)
        return () => stopDeadlineChecker()
      } catch (e) { console.warn('Deadline checker failed:', e) }
    }
  }, [user, projects.length])

  // Subscribe to Firebase data when user is authenticated
  useEffect(() => {
    if (!user) return

    try {
      const unsubscribeProjects = subscribeToProjects((projects) => {
        setProjects(projects)
        setError('') // Clear any previous errors
      }, (error) => {
        console.error('Error loading projects:', error)
        setError('Errore nel caricamento dei progetti')
      })

      const unsubscribeNotes = subscribeToNotes((notes) => {
        setNotes(notes)
        setError('') // Clear any previous errors
      }, (error) => {
        console.error('Error loading notes:', error)
        setError('Errore nel caricamento delle note')
      })

      return () => {
        unsubscribeProjects()
        unsubscribeNotes()
      }
    } catch (error) {
      console.error('Error setting up subscriptions:', error)
      setError('Errore nella connessione al database')
    }
  }, [user])

  // Filtra note associate al progetto (link diretto + tag condivisi)
  const getProjectNotes = (project) => {
    return notes.filter(note =>
      note.projectId === project.id ||
      (note.projectTags && note.projectTags.some(tag => project.tags && project.tags.includes(tag)))
    )
  }

  // All tags with counts (from projects + notes)
  const allTags = (() => {
    const tagMap = {}
    projects.forEach(p => (p.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1 }))
    notes.forEach(n => (n.projectTags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1 }))
    return Object.entries(tagMap).sort((a, b) => b[1] - a[1])
  })()

  // Global search results (cerca in nome, descrizione, tags, sezioni, roadmap, obiettivi)
  const globalSearchResults = globalSearch.length >= 2 ? {
    projects: projects.filter(p => {
      const q = globalSearch.toLowerCase()
      return p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q)) ||
        p.roadmap?.toLowerCase().includes(q) ||
        p.obiettivi?.toLowerCase().includes(q) ||
        p.sections?.some(s =>
          s.title?.toLowerCase().includes(q) ||
          s.content?.toLowerCase().includes(q)
        ) ||
        p.todos?.some(t => t.text?.toLowerCase().includes(q))
    }),
    notes: notes.filter(n => {
      const q = globalSearch.toLowerCase()
      return n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.projectTags?.some(t => t.toLowerCase().includes(q))
    })
  } : { projects: [], notes: [] }

  const totalSearchResults = globalSearchResults.projects.length + globalSearchResults.notes.length

  // Normalize: projects without type default to 'progetto'
  const normalizedProjects = projects.map(p => ({ ...p, type: p.type || 'progetto' }))

  // Filter items based on search, status, archive, type
  const filteredItems = normalizedProjects
    .filter(item => {
      const matchesSearch = item.name?.toLowerCase().includes(searchProjects.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchProjects.toLowerCase()) ||
                           item.tags?.some(tag => tag.toLowerCase().includes(searchProjects.toLowerCase()))
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      const matchesArchive = showArchived ? item.archived : !item.archived
      const matchesTag = !activeTag || item.tags?.includes(activeTag)
      const matchesType = filterType === 'all' || item.type === filterType
      return matchesSearch && matchesStatus && matchesArchive && matchesTag && matchesType
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      if (sortProjects === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortProjects === 'progress') {
        const progA = a.todos?.length ? a.todos.filter(t => t.completed).length / a.todos.length : 0
        const progB = b.todos?.length ? b.todos.filter(t => t.completed).length / b.todos.length : 0
        return progB - progA
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })


  const handleLogout = async () => {
    try {
      await signOut(auth)
      setProjects([])
      setNotes([])
      setSelectedProject(null)
      setView('home')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleChangePassword = async (currentPw, newPw) => {
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPw)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPw)
      setSuccess('Password cambiata con successo!')
      setShowChangePassword(false)
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Password attuale errata')
      } else if (err.code === 'auth/weak-password') {
        throw new Error('La nuova password deve avere almeno 6 caratteri')
      } else {
        throw new Error('Errore nel cambio password. Riprova.')
      }
    }
  }

  // Handle pin toggle
  const handleTogglePinProject = async (project) => {
    try {
      await updateProject(project.id, { pinned: !project.pinned })
    } catch (err) {
      setError('Errore nel fissare il progetto')
    }
  }


  // Handle archive
  const handleArchiveProject = async (project) => {
    try {
      await updateProject(project.id, { archived: !project.archived })
      setSuccess(project.archived ? 'Progetto ripristinato!' : 'Progetto archiviato!')
    } catch (err) {
      setError('Errore nell\'archiviazione')
    }
  }

  // Handle duplicate
  const handleDuplicateProject = async (project) => {
    try {
      const { id, createdAt, updatedAt, ...data } = project
      await addProject({ ...data, name: `${data.name} (copia)`, pinned: false, archived: false })
      setSuccess('Progetto duplicato!')
    } catch { setError('Errore nella duplicazione') }
  }


  // Handle project selection
  const handleProjectSelect = (project) => {
    setSelectedProject(project)
    setView('item-detail')
  }

  // Handle edit project
  const handleEditProject = (project) => {
    setEditingProject(project)
  }

  // Handle delete with confirmation
  const handleDelete = (type, item) => {
    setShowConfirmDelete({ type, item })
  }

  // Confirm delete action
  const confirmDelete = async () => {
    setDeleteLoading(true)
    try {
      const { type, item } = showConfirmDelete
      if (type === 'project') {
        await deleteProject(item.id)
        setSuccess('Progetto eliminato con successo!')
      } else {
        await deleteNote(item.id)
        setSuccess('Nota/Idea eliminata con successo!')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      setError('Errore durante l\'eliminazione')
    } finally {
      setDeleteLoading(false)
      setShowConfirmDelete(null)
    }
  }

  // Handle edit note (legacy — notes now shown read-only in detail)
  const handleEditNote = () => {}

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Caricamento...</div>
      </div>
    )
  }

  // Authentication required
  if (!user) {
    return <Auth onAuthSuccess={setUser} />
  }

  return (
    <div className="gestionale-app">
      {/* Header - Clean: logo + search + user */}
      <header>
        <div className="header-content">
          <h1 className="title-main" onClick={() => { setView('home'); setSelectedProject(null) }} style={{ cursor: 'pointer' }}>🐙 Polpo</h1>

          <div className="global-search-wrapper">
            <input
              type="text"
              placeholder="🔍 Cerca ovunque..."
              value={globalSearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value)
                setShowSearchResults(e.target.value.length >= 2)
              }}
              onFocus={() => globalSearch.length >= 2 && setShowSearchResults(true)}
              className="global-search-input"
            />
            {showSearchResults && globalSearch.length >= 2 && (
              <>
                <div className="search-overlay" onClick={() => setShowSearchResults(false)}></div>
                <div className="global-search-dropdown">
                  {totalSearchResults === 0 ? (
                    <div className="search-no-results">Nessun risultato per "{globalSearch}"</div>
                  ) : (
                    <>
                      {globalSearchResults.projects.length > 0 && (
                        <div className="search-group">
                          <div className="search-group-title">📁 Progetti ({globalSearchResults.projects.length})</div>
                          {globalSearchResults.projects.slice(0, 5).map(p => (
                            <div key={p.id} className="search-result-item" onClick={() => {
                              setSelectedProject(p)
                              setView('item-detail')
                              setShowSearchResults(false)
                              setGlobalSearch('')
                            }}>
                              <span className="search-result-name">{p.name}</span>
                              {p.tags?.slice(0, 3).map(t => (
                                <span key={t} className="search-result-tag">#{t}</span>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {globalSearchResults.notes.length > 0 && (
                        <div className="search-group">
                          <div className="search-group-title">📝 Note ({globalSearchResults.notes.length})</div>
                          {globalSearchResults.notes.slice(0, 5).map(n => (
                            <div key={n.id} className="search-result-item" onClick={() => {
                              setView('items')
                              setShowSearchResults(false)
                              setGlobalSearch('')
                            }}>
                              <span className="search-result-name">{n.title}</span>
                              <span className={`badge badge-type-${n.type}`} style={{ fontSize: '0.65rem' }}>
                                {n.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="header-right">
            <ThemeSlider />
            <div className="user-info">
              <div className="user-avatar">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.displayName || user.email}</span>
              <button onClick={() => setShowChangePassword(true)} className="logout-button" title="Cambia password">
                🔒
              </button>
              <button onClick={handleLogout} className="logout-button">
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Nav Bar */}
      <nav className="desktop-nav">
        <div className="desktop-nav-content">
          {[
            ['home', '🏠', 'Home'],
            ['items', '📋', 'Elementi'],
            ['calendar', '📅', 'Calendario'],
            ['ai-chat', '🐙', 'Polpo AI']
          ].map(([v, icon, label]) => (
            <button
              key={v}
              onClick={() => {
                setView(v)
                if (v !== 'item-detail') setSelectedProject(null)
              }}
              className={`desktop-nav-btn ${view === v || (v === 'items' && view === 'item-detail') ? 'active' : ''}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="main-content">
        {view === 'home' && (
          <Home
            projects={projects}
            notes={notes}
            onNavigate={setView}
            onAddProject={(type) => { setAddFormInitialType(type || null); setShowAddProjectForm(true) }}
            onAiMessage={(text) => { setPendingAiMessage(text); setView('ai-chat') }}
          />
        )}

        {view === 'item-detail' && (
          <div className="mb-6">
            <button
              onClick={() => setView('items')}
              className="back-button"
            >
              ← Torna agli elementi
            </button>
          </div>
        )}

        {view === 'items' && (
          <div>
            <div className="flex-between mb-6">
              <h2 className="title-section">I Miei Elementi</h2>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="text-meta">
                  {filteredItems.length} di {normalizedProjects.filter(p => !p.archived).length} elementi
                </div>
                <div className="export-btns">
                  <button onClick={() => exportProjectsCSV(projects.filter(p => !p.archived), notes)} className="btn-export" title="Esporta CSV">
                    📊 CSV
                  </button>
                </div>
                <button
                  onClick={() => setShowAddProjectForm(true)}
                  className="btn-primary"
                >
                  + Nuovo
                </button>
              </div>
            </div>

            {/* Type filter bar */}
            <div className="type-filter-bar mb-4">
              <button
                className={`type-filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                Tutti
                <span className="type-filter-count">{normalizedProjects.filter(p => !p.archived).length}</span>
              </button>
              {ITEM_TYPE_LIST.map(t => {
                const count = normalizedProjects.filter(p => p.type === t.key && !p.archived).length
                if (count === 0) return null
                return (
                  <button
                    key={t.key}
                    className={`type-filter-btn ${filterType === t.key ? 'active' : ''}`}
                    style={{ '--type-color': t.color, '--type-color-light': t.colorLight }}
                    onClick={() => setFilterType(filterType === t.key ? 'all' : t.key)}
                  >
                    {t.icon} {t.label}
                    <span className="type-filter-count">{count}</span>
                  </button>
                )
              })}
            </div>

            {/* Toolbar: search + filter toggle + view toggle */}
            <div className="toolbar mb-4">
              <div className="search-input toolbar-search">
                <input
                  type="text"
                  placeholder="🔍 Cerca..."
                  value={searchProjects}
                  onChange={(e) => setSearchProjects(e.target.value)}
                  className="search-field"
                />
              </div>
              {normalizedProjects.some(p => p.archived) && (
                <button
                  className={`toolbar-btn ${showArchived ? 'active' : ''}`}
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? '📂 Attivi' : '📦 Archivio'}
                </button>
              )}
              <button className={`toolbar-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                🎛️ <span className="toolbar-btn-label">Filtri</span>
                {(filterStatus !== 'all' || sortProjects !== 'date' || activeTag) && <span className="filter-dot"></span>}
              </button>
              <div className="view-toggle">
                <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Griglia">⊞</button>
                <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="Lista">☰</button>
              </div>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
              <div className="filters-panel mb-4">
                <div className="filters-row">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-field">
                    <option value="all">Tutti gli stati</option>
                    <option value="pending">Da Fare</option>
                    <option value="in_progress">In Corso</option>
                    <option value="completed">Completato</option>
                    <option value="paused">In Pausa</option>
                  </select>
                  <select value={sortProjects} onChange={(e) => setSortProjects(e.target.value)} className="filter-field">
                    <option value="date">Ordina: Data</option>
                    <option value="name">Ordina: Nome</option>
                    <option value="progress">Ordina: Progresso</option>
                  </select>
                  {(filterStatus !== 'all' || activeTag || filterType !== 'all') && (
                    <button className="toolbar-btn" onClick={() => { setFilterStatus('all'); setActiveTag(null); setShowArchived(false); setFilterType('all') }}>
                      ✕ Reset
                    </button>
                  )}
                </div>
                {allTags.length > 0 && (
                  <div className="tag-cloud">
                    <button className={`tag-cloud-item ${!activeTag ? 'active' : ''}`} onClick={() => setActiveTag(null)}>Tutti</button>
                    {allTags.slice(0, 15).map(([tag, count]) => (
                      <button key={tag} className={`tag-cloud-item ${activeTag === tag ? 'active' : ''}`} onClick={() => setActiveTag(activeTag === tag ? null : tag)}>
                        #{tag} <span className="tag-cloud-count">{count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {filteredItems.length > 0 ? (
              <div className={viewMode === 'list' ? 'list-projects' : 'grid-projects'}>
                {filteredItems.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    compact={viewMode === 'list'}
                    onSelect={handleProjectSelect}
                    getProjectNotes={getProjectNotes}
                    onEdit={handleEditProject}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePinProject}
                    onArchive={handleArchiveProject}
                    onDuplicate={handleDuplicateProject}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p>Nessun elemento trovato</p>
              </div>
            )}
          </div>
        )}

        {view === 'calendar' && (
          <Calendar
            projects={projects}
            onProjectSelect={(project) => {
              setSelectedProject(project)
              setView('item-detail')
            }}
          />
        )}

        {view === 'ai-chat' && <AiChat initialMessage={pendingAiMessage} onInitialMessageConsumed={() => setPendingAiMessage('')} />}

        {view === 'item-detail' && (
          <ProjectDetailView
            project={selectedProject}
            notes={notes}
            projects={projects}
            onUpdateProject={updateProject}
            onEditNote={handleEditNote}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* Error/Success Messages */}
      {error && (
        <div className="toast toast-error">
          {error}
          <button onClick={() => setError('')} className="toast-close">×</button>
        </div>
      )}

      {success && (
        <div className="toast toast-success">
          {success}
          <button onClick={() => setSuccess('')} className="toast-close">×</button>
        </div>
      )}

      {/* Modal Forms */}
      {showAddProjectForm && (
        <AddProjectForm
          initialType={addFormInitialType}
          onClose={() => { setShowAddProjectForm(false); setAddFormInitialType(null) }}
          onSuccess={() => {
            setShowAddProjectForm(false)
            setAddFormInitialType(null)
            setSuccess('Elemento creato con successo!')
          }}
          onError={(error) => setError(error)}
        />
      )}

      {/* Edit Form */}
      {editingProject && (
        <AddProjectForm
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null)
            setSuccess('Elemento aggiornato con successo!')
          }}
          onError={(error) => setError(error)}
        />
      )}

      {/* Confirmation Dialog */}
      {showConfirmDelete && (
        <div className="confirm-dialog">
          <div className="confirm-dialog-content">
            <h3>⚠️ Conferma Eliminazione</h3>
            <p>
              Sei sicuro di voler eliminare {showConfirmDelete.type === 'project' ? 'il progetto' : 'la nota/idea'}{' '}
              "<strong>{showConfirmDelete.item.name || showConfirmDelete.item.title}</strong>"?
            </p>
            <div className="confirm-actions">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="btn-secondary"
              >
                Annulla
              </button>
              <button
                onClick={confirmDelete}
                className="btn-primary"
                style={{ background: '#dc2626' }}
                disabled={deleteLoading}
              >
                {deleteLoading ? '⏳ Eliminando...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onSubmit={handleChangePassword}
        />
      )}

      {/* Theme Settings Modal */}
      {showThemeSettings && <ThemeSettings />}

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {[
          ['home', '🏠', 'Home'],
          ['items', '📋', 'Elementi'],
          ['calendar', '📅', 'Cal'],
          ['ai-chat', '🐙', 'AI']
        ].map(([v, icon, label]) => (
          <button
            key={v}
            onClick={() => {
              setView(v)
              if (v !== 'item-detail') setSelectedProject(null)
            }}
            className={`mobile-nav-btn ${view === v || (v === 'items' && view === 'item-detail') ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{icon}</span>
            <span className="mobile-nav-label">{label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}

export default App