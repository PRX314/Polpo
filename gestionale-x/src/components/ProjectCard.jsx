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
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.map(tag => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex-between text-meta">
        <span>Creato: {new Date(project.createdAt).toLocaleDateString('it-IT')}</span>
        <span className="badge badge-count">
          {associatedNotes.length} note/idee
        </span>
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