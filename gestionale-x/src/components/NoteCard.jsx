import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { renderMarkdown } from '../lib/markdown'
import { fullDate } from '../lib/dates'
import { getTypeInfo } from '../itemTypes'

// Nota o idea collegata a un progetto. Sola lettura: le note-elemento si aprono
// dalla loro pagina, le vecchie note (raccolta legacy) si leggono soltanto.
const NoteCard = ({ note }) => {
  const html = useMemo(() => renderMarkdown(note.content), [note.content])
  const isItem = !!note.name // le note nate come elementi hanno `name`
  const label = getTypeInfo(note.type).label

  return (
    <article className="card note">
      <div className="row">
        <span className="tag tag-type">{label}</span>
        {note.category && <span className="tag">{note.category}</span>}
        {note.pinned && <span className="tag">fissata</span>}
      </div>
      <h3 style={{ margin: '8px 0 6px' }}>
        {isItem ? <Link to={`/elementi/${note.id}`}>{note.title}</Link> : note.title}
      </h3>
      {html && <div className="prose note-content" dangerouslySetInnerHTML={{ __html: html }} />}
      {note.projectTags?.length > 0 && (
        <div className="row row-wrap" style={{ gap: 4, marginTop: 8 }}>
          {note.projectTags.map(t => <span key={t} className="tag">#{t}</span>)}
        </div>
      )}
      {note.createdAt && <p className="small faint" style={{ marginTop: 8 }}>{fullDate(note.createdAt)}</p>}
    </article>
  )
}

export default NoteCard
