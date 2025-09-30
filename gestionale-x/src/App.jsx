import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import {
  subscribeToProjects,
  subscribeToNotes,
  initializeSampleData,
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
import StatusBadge from './components/ui/StatusBadge'
import './styles.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [view, setView] = useState('home') // 'home', 'projects', 'notes', 'project-detail'
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  // Filtra note associate al progetto selezionato
  const getProjectNotes = (project) => {
    return notes.filter(note =>
      note.projectTags && note.projectTags.some(tag => project.tags && project.tags.includes(tag))
    )
  }

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchProjects.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchProjects.toLowerCase()) ||
                         project.tags?.some(tag => tag.toLowerCase().includes(searchProjects.toLowerCase()))

    const matchesStatus = filterStatus === 'all' || project.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Filter notes based on search and priority
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchNotes.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchNotes.toLowerCase()) ||
                         note.projectTags?.some(tag => tag.toLowerCase().includes(searchNotes.toLowerCase()))

    const matchesPriority = filterPriority === 'all' || note.priority === filterPriority

    return matchesSearch && matchesPriority
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

        {/* Todo List Section */}
        {selectedProject.todos && selectedProject.todos.length > 0 && (
          <div className="project-card mb-6">
            <h3 className="title-section mb-4">
              ✅ Cose da Fare ({selectedProject.todos.filter(t => !t.completed).length}/{selectedProject.todos.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedProject.todos.map((todo, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: todo.completed
                    ? 'linear-gradient(135deg, #d1fae5, #ecfdf5)'
                    : 'linear-gradient(135deg, #f8f9fa, #ffffff)',
                  borderRadius: '8px',
                  border: todo.completed ? '2px solid #20c997' : '1px solid #e9ecef',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: todo.completed
                      ? 'linear-gradient(135deg, #20c997, #28a745)'
                      : '#fff',
                    border: todo.completed ? 'none' : '2px solid #ddd',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9em',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    {todo.completed && '✓'}
                  </div>
                  <div style={{
                    flex: 1,
                    fontSize: '0.9em',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? '#999' : '#333',
                    fontWeight: todo.completed ? '400' : '500'
                  }}>
                    {todo.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
      {/* Header */}
      <header>
        <div className="header-content">
          <h1 className="title-main">🐙 Gestionale Polpo</h1>

          <div className="flex gap-4">
            <nav className="flex gap-4">
              <button
                onClick={() => {
                  setView('home')
                  setSelectedProject(null)
                }}
                className={`nav-button ${view === 'home' ? 'active' : ''}`}
              >
                🏠 Home
              </button>
              <button
                onClick={() => {
                  setView('projects')
                  setSelectedProject(null)
                }}
                className={`nav-button ${
                  view === 'projects' || view === 'project-detail' ? 'active' : ''
                }`}
              >
                📁 Progetti
              </button>
              <button
                onClick={() => setView('notes')}
                className={`nav-button ${view === 'notes' ? 'active' : ''}`}
              >
                📝 Note & Idee
              </button>
            </nav>

            <div className="user-info">
              <div className="user-avatar">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <span>{user.displayName || user.email}</span>
              <button onClick={handleLogout} className="logout-button">
                Esci
              </button>
            </div>
          </div>
        </div>
      </header>

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
              <div className="flex gap-4 items-center">
                <div className="text-meta">
                  {filteredProjects.length} di {projects.length} progetti
                </div>
                <button
                  onClick={() => setShowAddProjectForm(true)}
                  className="btn-primary"
                >
                  + Nuovo Progetto
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="filters-container mb-6">
              <div className="flex gap-4 flex-wrap">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="🔍 Cerca progetti..."
                    value={searchProjects}
                    onChange={(e) => setSearchProjects(e.target.value)}
                    className="search-field"
                  />
                </div>
                <div className="filter-select">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-field"
                  >
                    <option value="all">Tutti gli stati</option>
                    <option value="pending">Da Fare</option>
                    <option value="in_progress">In Corso</option>
                    <option value="completed">Completato</option>
                    <option value="paused">In Pausa</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredProjects.length > 0 ? (
              <div className="grid-projects">
                {filteredProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={handleProjectSelect}
                    getProjectNotes={getProjectNotes}
                    onEdit={handleEditProject}
                    onDelete={handleDelete}
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
              <div className="flex gap-4 items-center">
                <div className="text-meta">
                  {filteredNotes.length} di {notes.length} elementi
                </div>
                <button
                  onClick={() => setShowAddNoteForm(true)}
                  className="btn-primary"
                >
                  + Nuova Nota/Idea
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="filters-container mb-6">
              <div className="flex gap-4 flex-wrap">
                <div className="search-input">
                  <input
                    type="text"
                    placeholder="🔍 Cerca note e idee..."
                    value={searchNotes}
                    onChange={(e) => setSearchNotes(e.target.value)}
                    className="search-field"
                  />
                </div>
                <div className="filter-select">
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="filter-field"
                  >
                    <option value="all">Tutte le priorità</option>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Bassa</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredNotes.length > 0 ? (
              <div className="grid-notes">
                {filteredNotes.map(note => (
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
                <p>Nessuna nota o idea trovata</p>
              </div>
            )}
          </div>
        )}

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
          onClose={() => setShowAddNoteForm(false)}
          onSuccess={() => {
            setShowAddNoteForm(false)
            setSuccess('Nota/Idea creata con successo!')
            // Notes will auto-update via real-time listener
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
    </div>
  )
}

export default App