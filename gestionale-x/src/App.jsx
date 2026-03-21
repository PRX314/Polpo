import { useState, useEffect, useRef, useCallback } from 'react'
import { onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from './firebase'
import {
  subscribeToProjects,
  subscribeToNotes,
  initializeSampleData,
  addNote,
  addProject,
  updateProject,
  updateNote,
  deleteProject,
  deleteNote
} from './firebaseService'
import Auth from './components/Auth'
import Home from './components/Home'
import AddProjectForm from './components/AddProjectForm'
import AddNoteForm from './components/AddNoteForm'
import ProjectCard from './components/ProjectCard'
import NoteCard from './components/NoteCard'
import AiChat from './components/AiChat'
import StatusBadge from './components/ui/StatusBadge'
import Calendar from './components/Calendar'
import { exportProjectsCSV, exportNotesCSV, exportAllProjectsPDF } from './services/exportService'
import { setupPushNotifications, startDeadlineChecker, stopDeadlineChecker } from './services/notificationService'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
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
  const [view, setView] = useState('home') // 'home', 'projects', 'notes', 'project-detail', 'ai-chat', 'calendar'
  const [showAddProjectForm, setShowAddProjectForm] = useState(false)
  const [showAddNoteForm, setShowAddNoteForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingNote, setEditingNote] = useState(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchProjects, setSearchProjects] = useState('')
  const [searchNotes, setSearchNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [sortProjects, setSortProjects] = useState('date') // date, name, progress
  const [sortNotes, setSortNotes] = useState('date') // date, name, priority
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [activeTag, setActiveTag] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // grid, list
  const [showFilters, setShowFilters] = useState(false)
  const [showQuickCapture, setShowQuickCapture] = useState(false)
  const [quickCaptureText, setQuickCaptureText] = useState('')
  const [quickCaptureType, setQuickCaptureType] = useState('note')

  const onQuickVoiceResult = useCallback((text) => {
    setQuickCaptureText(prev => prev + (prev ? ' ' : '') + text)
  }, [])
  const { isListening: isQuickVoiceOn, isSupported: voiceSupported, toggle: toggleQuickVoice } = useSpeechRecognition({ onResult: onQuickVoiceResult })

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

  // Global search results
  const globalSearchResults = globalSearch.length >= 2 ? {
    projects: projects.filter(p =>
      p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(globalSearch.toLowerCase()))
    ),
    notes: notes.filter(n =>
      n.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
      n.content?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      n.projectTags?.some(t => t.toLowerCase().includes(globalSearch.toLowerCase()))
    )
  } : { projects: [], notes: [] }

  const totalSearchResults = globalSearchResults.projects.length + globalSearchResults.notes.length

  // Filter projects based on search, status, archive
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.name?.toLowerCase().includes(searchProjects.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchProjects.toLowerCase()) ||
                           project.tags?.some(tag => tag.toLowerCase().includes(searchProjects.toLowerCase()))
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus
      const matchesArchive = showArchived ? project.archived : !project.archived
      const matchesTag = !activeTag || project.tags?.includes(activeTag)
      return matchesSearch && matchesStatus && matchesArchive && matchesTag
    })
    .sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      // Then by selected sort
      if (sortProjects === 'name') return (a.name || '').localeCompare(b.name || '')
      if (sortProjects === 'progress') {
        const progA = a.todos?.length ? a.todos.filter(t => t.completed).length / a.todos.length : 0
        const progB = b.todos?.length ? b.todos.filter(t => t.completed).length / b.todos.length : 0
        return progB - progA
      }
      return new Date(b.createdAt) - new Date(a.createdAt) // date default
    })

  // Filter notes based on search, priority, with sort + pin
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.title?.toLowerCase().includes(searchNotes.toLowerCase()) ||
                           note.content?.toLowerCase().includes(searchNotes.toLowerCase()) ||
                           note.projectTags?.some(tag => tag.toLowerCase().includes(searchNotes.toLowerCase()))
      const matchesPriority = filterPriority === 'all' || note.priority === filterPriority
      const matchesTag = !activeTag || note.projectTags?.includes(activeTag)
      return matchesSearch && matchesPriority && matchesTag
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      if (sortNotes === 'name') return (a.title || '').localeCompare(b.title || '')
      if (sortNotes === 'priority') {
        const prio = { high: 3, medium: 2, low: 1 }
        return (prio[b.priority] || 0) - (prio[a.priority] || 0)
      }
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setProjects([])
      setNotes([])
      setSelectedProject(null)
      setView('projects')
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

  const handleTogglePinNote = async (note) => {
    try {
      await updateNote(note.id, { pinned: !note.pinned })
    } catch (err) {
      setError('Errore nel fissare la nota')
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

  const handleDuplicateNote = async (note) => {
    try {
      const { id, createdAt, updatedAt, ...data } = note
      await addNote({ ...data, title: `${data.title} (copia)`, pinned: false })
      setSuccess('Nota duplicata!')
    } catch { setError('Errore nella duplicazione') }
  }

  // Handle project selection
  const handleProjectSelect = (project) => {
    setSelectedProject(project)
    setView('project-detail')
  }

  // Handle edit project
  const handleEditProject = (project) => {
    setEditingProject(project)
  }

  // Handle edit note
  const handleEditNote = (note) => {
    setEditingNote(note)
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

  const ProjectDetailView = () => {
    if (!selectedProject) return null

    const associatedNotes = getProjectNotes(selectedProject)

    return (
      <div className="project-detail">
        <div className="project-card mb-6">
          <div className="flex-between mb-4">
            <div>
              <h2 className="title-section mb-2">{selectedProject.name}</h2>
              <p className="text-description">{selectedProject.description}</p>
            </div>
            <StatusBadge status={selectedProject.status} />
          </div>

          {selectedProject.tags && selectedProject.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedProject.tags.map(tag => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {selectedProject.links && selectedProject.links.length > 0 && (
            <div className="mb-4" style={{ borderTop: '2px solid #f8f9fa', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.85em', color: '#999', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '500' }}>
                🔗 Links del Progetto
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {selectedProject.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.85em',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #48dbfb, #54a0ff)',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '500',
                      transition: 'all 0.3s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 2px 4px rgba(72, 219, 251, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 12px rgba(72, 219, 251, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 4px rgba(72, 219, 251, 0.3)';
                    }}
                  >
                    {link.title}
                    <span style={{ fontSize: '1.2em' }}>↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="text-meta">
            Creato: {new Date(selectedProject.createdAt).toLocaleDateString('it-IT')}
          </div>
        </div>

        {/* Roadmap Section */}
        {selectedProject.roadmap && (
          <div className="project-card mb-6">
            <h3 className="title-section mb-4">📍 Roadmap</h3>
            <div style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8',
              color: '#555',
              fontSize: '0.9em',
              background: 'linear-gradient(135deg, #f8f9fa, #ffffff)',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              {selectedProject.roadmap}
            </div>
          </div>
        )}

        {/* Obiettivi Section */}
        {selectedProject.obiettivi && (
          <div className="project-card mb-6">
            <h3 className="title-section mb-4">🎯 Obiettivi</h3>
            <div style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8',
              color: '#555',
              fontSize: '0.9em',
              background: 'linear-gradient(135deg, #fff5f0, #ffffff)',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #ffe5d9'
            }}>
              {selectedProject.obiettivi}
            </div>
          </div>
        )}

        {/* Todo List Section - Interactive */}
        {selectedProject.todos && selectedProject.todos.length > 0 && (
          <TodoListInteractive
            project={selectedProject}
            onUpdate={async (newTodos) => {
              await updateProject(selectedProject.id, { todos: newTodos })
            }}
          />
        )}

        <div className="project-card">
          <h3 className="title-section mb-4">
            📋 Note e Idee Associate ({associatedNotes.length})
          </h3>

          {associatedNotes.length > 0 ? (
            <div className="grid-notes">
              {associatedNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  projects={projects}
                  onEdit={handleEditNote}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <p>Nessuna nota o idea associata a questo progetto</p>
            </div>
          )}
        </div>
      </div>
    )
  }

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
                              setView('project-detail')
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
                              setView('notes')
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
            ['projects', '📁', 'Progetti'],
            ['notes', '📝', 'Note'],
            ['calendar', '📅', 'Calendario'],
            ['ai-chat', '🐙', 'Polpo AI']
          ].map(([v, icon, label]) => (
            <button
              key={v}
              onClick={() => {
                setView(v)
                if (v !== 'project-detail') setSelectedProject(null)
              }}
              className={`desktop-nav-btn ${view === v || (v === 'projects' && view === 'project-detail') ? 'active' : ''}`}
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
            onAddProject={() => setShowAddProjectForm(true)}
            onAddNote={(type) => {
              setEditingNote({ type });
              setShowAddNoteForm(true);
            }}
            onAiMessage={() => setView('ai-chat')}
          />
        )}

        {view === 'project-detail' && (
          <div className="mb-6">
            <button
              onClick={() => setView('projects')}
              className="back-button"
            >
              ← Torna ai progetti
            </button>
          </div>
        )}

        {view === 'projects' && (
          <div>
            <div className="flex-between mb-6">
              <h2 className="title-section">I Miei Progetti</h2>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="text-meta">
                  {filteredProjects.length} di {projects.filter(p => !p.archived).length} progetti
                </div>
                <div className="export-btns">
                  <button onClick={() => exportProjectsCSV(projects.filter(p => !p.archived), notes)} className="btn-export" title="Esporta CSV">
                    📊 CSV
                  </button>
                  <button onClick={() => exportAllProjectsPDF(projects.filter(p => !p.archived), notes)} className="btn-export" title="Esporta PDF">
                    📄 PDF
                  </button>
                </div>
                <button
                  onClick={() => setShowAddProjectForm(true)}
                  className="btn-primary"
                >
                  + Nuovo Progetto
                </button>
              </div>
            </div>

            {/* Toolbar: search + filter toggle + view toggle */}
            <div className="toolbar mb-4">
              <div className="search-input toolbar-search">
                <input
                  type="text"
                  placeholder="🔍 Cerca progetti..."
                  value={searchProjects}
                  onChange={(e) => setSearchProjects(e.target.value)}
                  className="search-field"
                />
              </div>
              <button className={`toolbar-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                🎛️ <span className="toolbar-btn-label">Filtri</span>
                {(filterStatus !== 'all' || sortProjects !== 'date' || showArchived || activeTag) && <span className="filter-dot"></span>}
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
                  <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`toolbar-btn ${showArchived ? 'active' : ''}`}
                  >
                    {showArchived ? '📦 Archiviati' : '📂 Attivi'}
                  </button>
                  {(filterStatus !== 'all' || activeTag || showArchived) && (
                    <button className="toolbar-btn" onClick={() => { setFilterStatus('all'); setActiveTag(null); setShowArchived(false) }}>
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

            {filteredProjects.length > 0 ? (
              <div className={viewMode === 'list' ? 'list-projects' : 'grid-projects'}>
                {filteredProjects.map(project => (
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
                <div className="empty-state-icon">📁</div>
                <p>Nessun progetto trovato</p>
              </div>
            )}
          </div>
        )}

        {view === 'notes' && (
          <div>
            <div className="flex-between mb-6">
              <h2 className="title-section">Note e Idee</h2>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="text-meta">
                  {filteredNotes.length} di {notes.length} elementi
                </div>
                <button onClick={() => exportNotesCSV(notes, projects)} className="btn-export" title="Esporta CSV">
                  📊 CSV
                </button>
                <button
                  onClick={() => setShowAddNoteForm(true)}
                  className="btn-primary"
                >
                  + Nuova Nota/Idea
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="toolbar mb-4">
              <div className="search-input toolbar-search">
                <input type="text" placeholder="🔍 Cerca note..." value={searchNotes} onChange={(e) => setSearchNotes(e.target.value)} className="search-field" />
              </div>
              <button className={`toolbar-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                🎛️ <span className="toolbar-btn-label">Filtri</span>
                {(filterPriority !== 'all' || sortNotes !== 'date') && <span className="filter-dot"></span>}
              </button>
            </div>

            {showFilters && (
              <div className="filters-panel mb-4">
                <div className="filters-row">
                  <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="filter-field">
                    <option value="all">Tutte le priorita</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Bassa</option>
                  </select>
                  <select value={sortNotes} onChange={(e) => setSortNotes(e.target.value)} className="filter-field">
                    <option value="date">Ordina: Data</option>
                    <option value="name">Ordina: Nome</option>
                    <option value="priority">Ordina: Priorita</option>
                  </select>
                </div>
              </div>
            )}

            {filteredNotes.length > 0 ? (
              <div className="grid-notes">
                {filteredNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    projects={projects}
                    onEdit={handleEditNote}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePinNote}
                    onDuplicate={handleDuplicateNote}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <p>Nessuna nota o idea trovata</p>
              </div>
            )}
          </div>
        )}

        {view === 'calendar' && (
          <Calendar
            projects={projects}
            onProjectSelect={(project) => {
              setSelectedProject(project)
              setView('project-detail')
            }}
          />
        )}

        {view === 'ai-chat' && <AiChat />}

        {view === 'project-detail' && <ProjectDetailView />}
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
          onClose={() => setShowAddProjectForm(false)}
          onSuccess={() => {
            setShowAddProjectForm(false)
            setSuccess('Progetto creato con successo!')
            // Projects will auto-update via real-time listener
          }}
          onError={(error) => setError(error)}
        />
      )}

      {showAddNoteForm && (
        <AddNoteForm
          projects={projects}
          onClose={() => setShowAddNoteForm(false)}
          onSuccess={() => {
            setShowAddNoteForm(false)
            setSuccess('Nota/Idea creata con successo!')
          }}
          onError={(error) => setError(error)}
        />
      )}

      {/* Edit Forms */}
      {editingProject && (
        <AddProjectForm
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSuccess={() => {
            setEditingProject(null)
            setSuccess('Progetto aggiornato con successo!')
          }}
          onError={(error) => setError(error)}
        />
      )}

      {editingNote && (
        <AddNoteForm
          note={editingNote}
          projects={projects}
          onClose={() => setEditingNote(null)}
          onSuccess={() => {
            setEditingNote(null)
            setSuccess('Nota/Idea aggiornata con successo!')
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
          ['projects', '📁', 'Progetti'],
          ['notes', '📝', 'Note'],
          ['calendar', '📅', 'Calendario'],
          ['ai-chat', '🐙', 'AI']
        ].map(([v, icon, label]) => (
          <button
            key={v}
            onClick={() => {
              setView(v)
              if (v !== 'project-detail') setSelectedProject(null)
            }}
            className={`mobile-nav-btn ${view === v || (v === 'projects' && view === 'project-detail') ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{icon}</span>
            <span className="mobile-nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* Quick Capture FAB */}
      {!showQuickCapture && (
        <button
          className="quick-capture-fab"
          onClick={() => setShowQuickCapture(true)}
          title="Cattura rapida"
        >
          ✏️
        </button>
      )}

      {showQuickCapture && (
        <div className="quick-capture-panel">
          <div className="quick-capture-header">
            <span>Cattura Rapida</span>
            <button onClick={() => { setShowQuickCapture(false); setQuickCaptureText('') }} className="close-button">×</button>
          </div>
          <div className="quick-capture-body">
            <div className="quick-capture-types">
              {[['note', '📝'], ['idea', '💡'], ['monologo', '🎭'], ['musica', '🎵']].map(([type, icon]) => (
                <button
                  key={type}
                  className={`quick-capture-type ${quickCaptureType === type ? 'active' : ''}`}
                  onClick={() => setQuickCaptureType(type)}
                >
                  {icon}
                </button>
              ))}
              {voiceSupported && (
                <button
                  className={`quick-capture-type voice-toggle ${isQuickVoiceOn ? 'listening' : ''}`}
                  onClick={toggleQuickVoice}
                  title={isQuickVoiceOn ? 'Stop' : 'Dettatura vocale'}
                >
                  {isQuickVoiceOn ? '⏹️' : '🎤'}
                </button>
              )}
            </div>
            <textarea
              value={quickCaptureText}
              onChange={(e) => setQuickCaptureText(e.target.value)}
              placeholder={isQuickVoiceOn ? '🎤 Sto ascoltando... parla ora' : 'Scrivi qui... (titolo automatico dalla prima riga)'}
              rows={3}
              className="quick-capture-input"
              autoFocus
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  if (!quickCaptureText.trim()) return
                  const lines = quickCaptureText.trim().split('\n')
                  const title = lines[0].slice(0, 60)
                  const content = lines.length > 1 ? lines.slice(1).join('\n') : lines[0]
                  try {
                    await addNote({ title, content, type: quickCaptureType, priority: 'medium', projectTags: [] })
                    setQuickCaptureText('')
                    setShowQuickCapture(false)
                    setSuccess('Nota salvata!')
                  } catch { setError('Errore nel salvataggio') }
                }
              }}
            />
            <div className="quick-capture-footer">
              <span className="quick-capture-hint">Ctrl+Enter per salvare</span>
              <button
                className="btn-primary"
                disabled={!quickCaptureText.trim()}
                onClick={async () => {
                  if (!quickCaptureText.trim()) return
                  const lines = quickCaptureText.trim().split('\n')
                  const title = lines[0].slice(0, 60)
                  const content = lines.length > 1 ? lines.slice(1).join('\n') : lines[0]
                  try {
                    await addNote({ title, content, type: quickCaptureType, priority: 'medium', projectTags: [] })
                    setQuickCaptureText('')
                    setShowQuickCapture(false)
                    setSuccess('Nota salvata!')
                  } catch { setError('Errore nel salvataggio') }
                }}
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TodoListInteractive({ project, onUpdate }) {
  const [todos, setTodos] = useState(project.todos || [])
  const [dragIndex, setDragIndex] = useState(null)
  const [newTodoText, setNewTodoText] = useState('')

  useEffect(() => {
    setTodos(project.todos || [])
  }, [project.todos])

  const handleToggle = async (index) => {
    const updated = [...todos]
    updated[index] = { ...updated[index], completed: !updated[index].completed }
    setTodos(updated)
    await onUpdate(updated)
  }

  const handleDragStart = (index) => {
    setDragIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const updated = [...todos]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(index, 0, moved)
    setTodos(updated)
    setDragIndex(index)
  }

  const handleDragEnd = async () => {
    setDragIndex(null)
    await onUpdate(todos)
  }

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return
    const updated = [...todos, { text: newTodoText.trim(), completed: false }]
    setTodos(updated)
    setNewTodoText('')
    await onUpdate(updated)
  }

  const handleDeleteTodo = async (index) => {
    const updated = todos.filter((_, i) => i !== index)
    setTodos(updated)
    await onUpdate(updated)
  }

  const done = todos.filter(t => t.completed).length
  const progress = todos.length > 0 ? Math.round((done / todos.length) * 100) : 0

  return (
    <div className="project-card mb-6">
      <div className="todo-header">
        <h3 className="title-section mb-2">
          ✅ Cose da Fare ({todos.length - done}/{todos.length})
        </h3>
        <span className="todo-progress-pct">{progress}%</span>
      </div>
      <div className="todo-progress-bar mb-4">
        <div className="todo-progress-fill" style={{
          width: `${progress}%`,
          background: progress === 100 ? 'linear-gradient(90deg, #20c997, #28a745)' : 'linear-gradient(90deg, #48dbfb, #54a0ff)'
        }}></div>
      </div>
      <div className="todo-list">
        {todos.map((todo, index) => (
          <div
            key={index}
            className={`todo-item ${todo.completed ? 'todo-done' : ''} ${dragIndex === index ? 'todo-dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="todo-drag-handle" title="Trascina per riordinare">⠿</div>
            <div
              className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
              onClick={() => handleToggle(index)}
            >
              {todo.completed && '✓'}
            </div>
            <div
              className={`todo-text ${todo.completed ? 'completed' : ''}`}
              onClick={() => handleToggle(index)}
            >
              {todo.text}
            </div>
            <button className="todo-delete" onClick={() => handleDeleteTodo(index)} title="Elimina">×</button>
          </div>
        ))}
      </div>
      <div className="todo-add-row">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
          placeholder="Aggiungi un nuovo task..."
          className="todo-add-input"
        />
        <button onClick={handleAddTodo} className="btn-primary" disabled={!newTodoText.trim()}>+</button>
      </div>
    </div>
  )
}

function ChangePasswordModal({ onClose, onSubmit }) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPw.length < 6) {
      setError('La nuova password deve avere almeno 6 caratteri')
      return
    }
    if (newPw !== confirmPw) {
      setError('Le password non coincidono')
      return
    }
    if (currentPw === newPw) {
      setError('La nuova password deve essere diversa dalla attuale')
      return
    }

    setLoading(true)
    try {
      await onSubmit(currentPw, newPw)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="form-modal-content">
        <div className="form-header">
          <h2>🔒 Cambia Password</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Password attuale</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Inserisci password attuale"
                required
                style={{ paddingRight: '2.5rem', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem', opacity: 0.6 }}
              >
                {showCurrent ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Nuova password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Minimo 6 caratteri"
                required
                minLength={6}
                style={{ paddingRight: '2.5rem', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0.25rem', opacity: 0.6 }}
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Conferma nuova password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Ripeti la nuova password"
                required
                style={{ paddingRight: '2.5rem', width: '100%' }}
              />
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Annulla</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Cambiando...' : 'Cambia Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App