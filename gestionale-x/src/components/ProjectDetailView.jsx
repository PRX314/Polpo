import StatusBadge from './ui/StatusBadge'
import ScanInfo from './ui/ScanInfo'
import NoteCard from './NoteCard'
import TodoListInteractive from './TodoListInteractive'
import { getTypeInfo } from '../itemTypes'

const ProjectDetailView = ({ project, notes, projects, onUpdateProject, onEditNote, onDelete }) => {
  if (!project) return null

  const getProjectNotes = () => {
    return notes.filter(note =>
      note.projectId === project.id ||
      (note.projectTags && note.projectTags.some(tag => project.tags && project.tags.includes(tag)))
    )
  }

  const associatedNotes = getProjectNotes()
  const detailType = getTypeInfo(project.type)

  return (
    <div className="project-detail">
      <div className="project-card mb-6">
        <div className="flex-between mb-4">
          <div>
            <span className="item-type-badge" style={{ background: detailType.colorLight, color: detailType.color, borderColor: detailType.color, marginBottom: '0.5rem', display: 'inline-flex' }}>
              {detailType.icon} {detailType.label}
            </span>
            <h2 className="title-section mb-2">{project.name}</h2>
            <p className="text-description">{project.description}</p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}

        {((project.links && project.links.length > 0) || project.vaultNote) && (
          <div className="mb-4" style={{ borderTop: '1px solid var(--border-light, #f0f0f0)', paddingTop: '1rem' }}>
            <div className="text-meta" style={{ marginBottom: '0.5rem' }}>🔗 Links</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(project.links || []).map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', textDecoration: 'none', gap: '0.3rem' }}
                >
                  {link.title} <span>↗</span>
                </a>
              ))}
              {project.vaultNote && (
                <a
                  href={`obsidian://open?vault=Vault&file=20-Projects%2F${encodeURIComponent(project.vaultNote)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', textDecoration: 'none', gap: '0.3rem' }}
                >
                  📔 Apri in Obsidian
                </a>
              )}
            </div>
          </div>
        )}

        <div className="text-meta">
          Creato: {new Date(project.createdAt).toLocaleDateString('it-IT')}
        </div>
      </div>

      {project.scan && <ScanInfo scan={project.scan} />}

      {project.roadmap && (
        <div className="project-card mb-6">
          <h3 className="title-section mb-4">📍 Roadmap</h3>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem', padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-card-hover, #f9fafb)' }}>
            {project.roadmap}
          </div>
        </div>
      )}

      {project.obiettivi && (
        <div className="project-card mb-6">
          <h3 className="title-section mb-4">🎯 Obiettivi</h3>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem', padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-card-hover, #f9fafb)' }}>
            {project.obiettivi}
          </div>
        </div>
      )}

      {project.sections && project.sections.length > 0 && (
        <div className="project-sections-detail">
          {project.sections.map((section) => (
            <div key={section.id} className="project-card mb-6">
              <h3 className="title-section mb-4">
                {section.icon || '📄'} {section.title}
              </h3>
              {section.content && (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-secondary, #6b7280)', fontSize: '0.875rem', padding: '0.85rem', borderRadius: '8px', background: 'var(--bg-card-hover, #f9fafb)' }}>
                  {section.content}
                </div>
              )}
              {section.images && section.images.length > 0 && (
                <div className="section-detail-images">
                  {section.images.map((img, imgIdx) => (
                    <a key={imgIdx} href={img.url} target="_blank" rel="noopener noreferrer" className="section-detail-image">
                      <img src={img.url.includes('cloudinary.com') ? img.url.replace('/upload/', '/upload/w_400,c_limit,q_auto,f_auto/') : img.url} alt={img.name || ''} />
                      {img.name && <span className="section-detail-image-name">{img.name}</span>}
                    </a>
                  ))}
                </div>
              )}
              {!section.content && (!section.images || section.images.length === 0) && (
                <span style={{ color: 'var(--text-meta, #9ca3af)', fontStyle: 'italic', fontSize: '0.85em' }}>Nessun contenuto</span>
              )}
            </div>
          ))}
        </div>
      )}

      {project.todos && project.todos.length > 0 && (
        <TodoListInteractive
          project={project}
          onUpdate={async (newTodos) => {
            await onUpdateProject(project.id, { todos: newTodos })
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
              <NoteCard key={note.id} note={note} projects={projects} onEdit={onEditNote} onDelete={onDelete} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p>Nessuna nota o idea associata</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDetailView
