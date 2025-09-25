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
            {note.type === 'idea' ? '💡 Idea' : '📝 Nota'}
          </span>
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