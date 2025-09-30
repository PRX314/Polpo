import StatusBadge from './ui/StatusBadge'

const ProjectCard = ({ project, onSelect, getProjectNotes, onEdit, onDelete }) => {
  const associatedNotes = getProjectNotes(project)

  return (
    <div
      className="project-card"
      onClick={() => onSelect(project)}
    >
      <div className="flex-between mb-4">
        <h3 className="title-project">{project.name}</h3>
        <StatusBadge status={project.status} />
      </div>

      <p className="text-description">{project.description}</p>

      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {project.tags.map(tag => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {project.links && project.links.length > 0 && (
        <div className="mb-3" style={{ borderTop: '1px solid #e9ecef', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.75em', color: '#999', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🔗 Links
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {project.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: '0.75em',
                  padding: '0.35rem 0.6rem',
                  background: 'linear-gradient(135deg, #48dbfb, #54a0ff)',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(72, 219, 251, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {link.title}
                <span style={{ fontSize: '1.1em' }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {(project.roadmap || project.obiettivi) && (
        <div className="mb-3" style={{ borderTop: '1px solid #e9ecef', paddingTop: '0.75rem' }}>
          {project.roadmap && (
            <div style={{ marginBottom: project.obiettivi ? '0.75rem' : '0' }}>
              <div style={{ fontSize: '0.75em', color: '#999', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📍 Roadmap
              </div>
              <div style={{
                fontSize: '0.8em',
                color: '#555',
                lineHeight: '1.6',
                maxHeight: '4.8em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                whiteSpace: 'pre-wrap'
              }}>
                {project.roadmap}
              </div>
            </div>
          )}

          {project.obiettivi && (
            <div>
              <div style={{ fontSize: '0.75em', color: '#999', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🎯 Obiettivi
              </div>
              <div style={{
                fontSize: '0.8em',
                color: '#555',
                lineHeight: '1.6',
                maxHeight: '3.2em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                whiteSpace: 'pre-wrap'
              }}>
                {project.obiettivi}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-between text-meta">
        <span>Creato: {new Date(project.createdAt).toLocaleDateString('it-IT')}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {project.todos && project.todos.length > 0 && (
            <span className="badge badge-count" style={{
              background: project.todos.every(t => t.completed)
                ? 'linear-gradient(135deg, #d1fae5, #ecfdf5)'
                : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
              color: project.todos.every(t => t.completed) ? '#059669' : '#666',
              border: project.todos.every(t => t.completed) ? '1px solid #20c997' : '1px solid #ddd'
            }}>
              ✅ {project.todos.filter(t => t.completed).length}/{project.todos.length}
            </span>
          )}
          <span className="badge badge-count">
            {associatedNotes.length} note/idee
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="card-actions" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(project)}
          className="btn-icon btn-edit"
          title="Modifica progetto"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete('project', project)}
          className="btn-icon btn-delete"
          title="Elimina progetto"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

export default ProjectCard