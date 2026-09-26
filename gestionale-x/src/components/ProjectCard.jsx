import { Link } from 'react-router-dom'
import { Ellipsis, Pin } from 'lucide-react'
import Menu from './ui/Menu'
import StatusMark from './ui/StatusMark'
import TypeTag from './ui/TypeTag'
import ProgressBar from './ui/ProgressBar'
import { ScanDot } from './ui/ScanInfo'
import DeadlineTag from './ui/DeadlineTag'
import { useItemMenu } from '../hooks/useItemMenu'
import { progressOf } from '../lib/status'
import './ProjectCard.css'

const ProjectCard = ({ project, compact }) => {
  const menu = useItemMenu(project)
  const { done, total, pct } = progressOf(project)
  const tags = project.tags || []
  const completed = project.status === 'completed'

  const menuEl = (
    <Menu label={`Azioni per ${project.name}`} trigger={<Ellipsis size={18} />} items={menu} />
  )

  if (compact) {
    return (
      <article className={`item-row ${project.pinned ? 'is-pinned' : ''}`}>
        <StatusMark status={project.status} label={false} />
        <Link className="item-link item-row-name" to={`/elementi/${project.id}`}>
          {project.pinned && <Pin size={12} aria-label="Fissato" />}
          {project.name}
        </Link>
        <div className="item-row-meta">
          <TypeTag type={project.type} />
          <ScanDot scan={project.scan} />
          {total > 0 && <span className="small muted item-nums">{done}/{total}</span>}
          <DeadlineTag iso={project.deadline} done={completed} />
        </div>
        {menuEl}
      </article>
    )
  }

  return (
    <article className={`card item ${project.pinned ? 'is-pinned' : ''}`}>
      <div className="item-top">
        <TypeTag type={project.type} />
        <StatusMark status={project.status} />
        <span className="item-menu">{menuEl}</span>
      </div>

      <h3 className="item-title">
        <Link className="item-link" to={`/elementi/${project.id}`}>
          {project.pinned && <Pin size={13} aria-label="Fissato" />}
          {project.name}
        </Link>
      </h3>

      {project.description && <p className="clamp-2 muted item-desc">{project.description}</p>}

      <div className="item-foot">
        {total > 0 && (
          <div className="item-progress">
            <ProgressBar pct={pct} label={`Avanzamento di ${project.name}`} />
            <span className="small muted item-nums">{done}/{total}</span>
          </div>
        )}
        <div className="item-tags">
          <DeadlineTag iso={project.deadline} done={completed} />
          {tags.slice(0, 3).map(t => <span key={t} className="tag">#{t}</span>)}
          {tags.length > 3 && <span className="tag">+{tags.length - 3}</span>}
          <ScanDot scan={project.scan} />
        </div>
      </div>
    </article>
  )
}

export default ProjectCard
