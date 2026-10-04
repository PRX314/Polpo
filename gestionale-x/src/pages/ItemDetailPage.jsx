import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, ExternalLink, Ellipsis, Pencil } from 'lucide-react'
import Menu from '../components/ui/Menu'
import TypeTag from '../components/ui/TypeTag'
import EmptyState from '../components/ui/EmptyState'
import ScanInfo from '../components/ui/ScanInfo'
import NoteCard from '../components/NoteCard'
import TodoList from '../components/TodoList'
import DeadlineTag from '../components/ui/DeadlineTag'
import { useItemMenu } from '../hooks/useItemMenu'
import { useData } from '../context/useData'
import { useUi } from '../context/useUi'
import { linkVault, etichettaVault, haVault } from '../vault'
import { renderMarkdown } from '../lib/markdown'
import { fullDate } from '../lib/dates'
import { STATUS_LABEL, STATUS_LIST, normalizeStatus } from '../lib/status'
import '../components/prose.css'
import './ItemDetailPage.css'

const Prose = ({ text }) => {
  const html = useMemo(() => renderMarkdown(text), [text])
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}

const Detail = ({ project }) => {
  const navigate = useNavigate()
  const { actions, notesOf, documents } = useData()
  const { openForm } = useUi()
  const menu = useItemMenu(project, { afterDelete: () => navigate('/elementi', { replace: true }) })
  const notes = notesOf(project)
  const links = project.links || []

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div>
        <Link to="/elementi" className="btn btn-quiet btn-sm back"><ArrowLeft size={14} /> Elementi</Link>
      </div>

      <header className="detail-head">
        <div className="grow">
          <div className="row row-wrap" style={{ marginBottom: 8 }}>
            <TypeTag type={project.type} />
            {project.archived && <span className="tag">archiviato</span>}
            {project.pinned && <span className="tag">fissato</span>}
          </div>
          <h1>{project.name}</h1>
          {project.description && <p className="muted detail-desc">{project.description}</p>}
        </div>
        <div className="page-actions">
          <button className="btn" onClick={() => openForm({ project })}><Pencil size={15} /> Modifica</button>
          <Menu label="Altre azioni" trigger={<Ellipsis size={18} />} items={menu} />
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-main stack" style={{ gap: 12 }}>
          {project.roadmap && (
            <section className="card"><h2 className="card-title">Roadmap</h2><Prose text={project.roadmap} /></section>
          )}
          {project.obiettivi && (
            <section className="card"><h2 className="card-title">Obiettivi</h2><Prose text={project.obiettivi} /></section>
          )}

          {(project.sections || []).map((s, i) => (
            <section key={s.id || i} className="card">
              <h2 className="card-title">{s.title}</h2>
              {s.content && <Prose text={s.content} />}
              {s.images?.length > 0 && (
                <div className="detail-images">
                  {s.images.map((img, k) => (
                    <a key={k} href={img.url} target="_blank" rel="noopener noreferrer" className="detail-image">
                      <img
                        src={img.url.includes('cloudinary.com') ? img.url.replace('/upload/', '/upload/w_400,c_limit,q_auto,f_auto/') : img.url}
                        alt={img.name || ''} loading="lazy"
                      />
                      {img.name && <span className="small muted">{img.name}</span>}
                    </a>
                  ))}
                </div>
              )}
              {!s.content && !s.images?.length && <p className="small faint">Nessun contenuto</p>}
            </section>
          ))}

          {notes.length > 0 && (
            <section>
              <h2 className="card-title" style={{ marginTop: 6 }}>Note e idee collegate <span className="count">{notes.length}</span></h2>
              <div className="detail-notes">
                {notes.map(n => <NoteCard key={n.id} note={n} />)}
              </div>
            </section>
          )}

          {!project.roadmap && !project.obiettivi && !project.sections?.length && !notes.length && (
            <EmptyState title="Ancora nessun contenuto" hint="Aggiungi sezioni, roadmap o obiettivi da “Modifica”.">
              <button className="btn" style={{ marginTop: 12 }} onClick={() => openForm({ project })}><Pencil size={15} /> Modifica</button>
            </EmptyState>
          )}
        </div>

        <aside className="detail-side stack" style={{ gap: 12 }}>
          <section className="card">
            <h2 className="card-title">Dettagli</h2>
            <dl className="detail-facts">
              <div>
                <dt>Stato</dt>
                <dd>
                  <select
                    value={normalizeStatus(project.status)} aria-label="Stato"
                    onChange={(e) => actions.update(project.id, { status: e.target.value })}
                  >
                    {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </dd>
              </div>
              {project.deadline && (
                <div>
                  <dt>Scadenza</dt>
                  <dd><DeadlineTag iso={project.deadline} done={project.status === 'completed'} /> <span className="small muted">{fullDate(`${project.deadline}T00:00:00`)}{project.deadlineTime ? `, ${project.deadlineTime}` : ''}</span></dd>
                </div>
              )}
              {project.tags?.length > 0 && (
                <div>
                  <dt>Tag</dt>
                  <dd className="row row-wrap" style={{ gap: 4 }}>
                    {project.tags.map(t => <Link key={t} to={`/elementi?tag=${encodeURIComponent(t)}`} className="tag">#{t}</Link>)}
                  </dd>
                </div>
              )}
              <div>
                <dt>Creato</dt>
                <dd className="small muted">{fullDate(project.createdAt)}</dd>
              </div>
            </dl>

            {(links.length > 0 || haVault(project)) && (
              <div className="detail-links">
                {links.map((l, i) => (
                  <a key={i} className="btn btn-sm" href={l.url} target="_blank" rel="noopener noreferrer">{l.title} <ExternalLink size={12} aria-hidden="true" /></a>
                ))}
                {haVault(project) && (
                  <a className="btn btn-sm" href={linkVault(project)} target="_blank" rel="noopener noreferrer"><BookOpen size={12} aria-hidden="true" /> {etichettaVault(project)}</a>
                )}
              </div>
            )}
          </section>

<section className="card stack"><h2 className="card-title">Documenti su questo dispositivo</h2>{documents.filter(d => d.projectId === project.id).map(d => <Link key={d.id} to={`/documenti/${d.id}`}>{d.title}{d.objective ? ` · ${d.objective}` : ""}</Link>)}<Link className="btn btn-sm" to={`/documenti?elemento=${encodeURIComponent(project.id)}`}>Collega foto o file</Link></section>
          <TodoList project={project} onUpdate={(todos) => actions.update(project.id, { todos })} />
          {project.scan && <ScanInfo scan={project.scan} />}
        </aside>
      </div>
    </div>
  )
}

const ItemDetailPage = () => {
  const { id } = useParams()
  const { items, loading } = useData()
  const project = items.find(p => p.id === id)

  if (loading) return <div className="row" style={{ justifyContent: 'center', padding: 48 }}><span className="spinner" aria-hidden="true" /></div>
  if (!project) {
    return (
      <EmptyState title="Elemento non trovato" hint="Potrebbe essere stato eliminato, o il link non è corretto.">
        <Link to="/elementi" className="btn" style={{ marginTop: 12 }}><ArrowLeft size={14} /> Torna agli elementi</Link>
      </EmptyState>
    )
  }
  return <Detail project={project} />
}

export default ItemDetailPage
