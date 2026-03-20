import PriorityBadge from './ui/PriorityBadge'

const NoteCard = ({ note, projects, onEdit, onDelete }) => {
  const matchingProjects = projects.filter(project =>
    note.projectTags && project.tags && note.projectTags.some(tag => project.tags.includes(tag))
  )

  return (
    <div className="note-card">
      <div className="flex-start mb-3">
        <div className="flex gap-2">
          <span className={`badge badge-type-${note.type}`}>
            {note.type === 'idea' ? '💡 Idea' :
             note.type === 'info' ? '📌 Info' :
             note.type === 'monologo' ? '🎭 Monologo' :
             note.type === 'musica' ? '🎵 Musica' :
             '📝 Nota'}
          </span>
          {note.category && (
            <span className="tag-small" style={{ background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)', color: '#2e7d32', border: '1px solid #a5d6a7' }}>
              {note.category}
            </span>
          )}
          <PriorityBadge priority={note.priority} />
        </div>
      </div>

      <h4 className="title-note">{note.title}</h4>
      <p className="text-content">{note.content}</p>

      {note.projectTags && note.projectTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {note.projectTags.map(tag => (
            <span key={tag} className="tag-small">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {note.links && note.links.length > 0 && (
        <div className="mb-3" style={{ borderTop: '1px solid #e9ecef', paddingTop: '0.5rem' }}>
          <div style={{ fontSize: '0.7em', color: '#999', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🔗 Links
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {note.links.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.7em',
                  padding: '0.3rem 0.5rem',
                  background: 'linear-gradient(135deg, #feca57, #fd7e14)',
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
                  e.target.style.boxShadow = '0 4px 8px rgba(254, 202, 87, 0.4)';
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

      <div className="text-meta">
        <div>Creato: {new Date(note.createdAt).toLocaleDateString('it-IT')}</div>
        {matchingProjects.length > 0 && (
          <div className="mt-1">
            Progetti correlati: {matchingProjects.map(p => p.name).join(', ')}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="card-actions">
        <button
          onClick={() => onEdit(note)}
          className="btn-icon btn-edit"
          title="Modifica nota/idea"
        >
          ✏️
        </button>
        <button
          onClick={() => onDelete('note', note)}
          className="btn-icon btn-delete"
          title="Elimina nota/idea"
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

export default NoteCard