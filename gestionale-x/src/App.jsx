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
  const [view, setView] = useState('projects') // 'projects', 'notes', 'project-detail'
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

          <div className="text-meta">
            Creato: {new Date(selectedProject.createdAt).toLocaleDateString('it-IT')}
          </div>
        </div>

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