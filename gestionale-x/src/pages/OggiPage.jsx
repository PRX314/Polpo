import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUp, CalendarDays, Plus } from 'lucide-react'
import ProgressBar from '../components/ui/ProgressBar'
import StatusMark from '../components/ui/StatusMark'
import { useData } from '../context/useData'
import { useUi } from '../context/useUi'
import { saveRoutine } from '../firebaseService'
import { addDaysIso, longDate, oggiIso, relativeDay, timeAgo } from '../lib/dates'
import { progressOf } from '../lib/status'
import { documentDeadlines } from '../services/localDocuments'
import './OggiPage.css'

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Scadenze, appuntamenti e cose da fare di oggi e dei prossimi giorni, in un'unica lista ordinata.
const buildAgenda = (items, events, documents) => {
  const out = []
  items.filter(p => !p.archived && p.status !== 'completed').forEach(p => {
    if (p.deadline) out.push({ key: `d-${p.id}`, kind: 'deadline', iso: p.deadline, time: p.deadlineTime || '', text: p.name, project: p })
    ;(p.todos || []).forEach((t, i) => {
      if (t.deadline && !t.completed) out.push({ key: `t-${p.id}-${i}`, kind: 'todo', iso: t.deadline, time: t.time || '', text: t.text, project: p, index: i })
    })
  })
  events.forEach(e => {
    if (e.date) out.push({ key: `e-${e.id}`, kind: 'event', iso: e.date, time: e.time || '', text: e.title })
  })
  out.push(...documentDeadlines(documents).map(d => ({ key: d.key, kind: 'documento', iso: d.date, time: '', text: d.title, documentId: d.documentId })))
  return out.sort((a, b) => (a.iso + (a.time || '99')).localeCompare(b.iso + (b.time || '99')))
}

const KIND_LABEL = { documento: 'Documento locale', todo: 'Da fare', deadline: 'Scadenza', event: 'Appuntamento' }

const AgendaRow = ({ row, onToggle }) => {
  const rel = relativeDay(row.iso)
  return (
    <li className="ag-row">
      {row.kind === 'todo' ? (
        <input type="checkbox" checked={false} onChange={() => onToggle(row)} aria-label={`Segna “${row.text}” come fatta`} />
      ) : (
        <span className="ag-kind" aria-hidden="true" />
      )}
      <div className="grow">
        {row.project
          ? <Link to={`/elementi/${row.project.id}`} className="ag-text">{row.kind === 'todo' ? row.text : row.project.name}</Link>
          : row.documentId ? <Link to={`/documenti/${row.documentId}`} className="ag-text">{row.text}</Link> : <span className="ag-text">{row.text}</span>}
        <div className="small faint">
          {KIND_LABEL[row.kind]}{row.kind === 'todo' && row.project ? ` · ${row.project.name}` : ''}
        </div>
      </div>
      <span className="small muted ag-when">{row.iso !== oggiIso() ? rel.text : ''}{row.time ? ` ${row.time}` : ''}</span>
    </li>
  )
}

const AgendaBlock = ({ title, rows, onToggle, invert, more }) => {
  if (!rows.length) return null
  return (
    <section className="card card-flush">
      <h2 className={`ag-head ${invert ? 'is-invert' : ''}`}>
        <span>{title}</span> <span className="count ghost">{rows.length}</span>
      </h2>
      <ul>{rows.map(r => <AgendaRow key={r.key} row={r} onToggle={onToggle} />)}</ul>
      {more}
    </section>
  )
}

const OggiPage = () => {
  const navigate = useNavigate()
  const { items, events, routine, loading, actions, documents } = useData()
  const { openForm } = useUi()
  const [prompt, setPrompt] = useState('')

  const today = oggiIso()
  const weekEnd = addDaysIso(7)

  const agenda = useMemo(() => buildAgenda(items, events, documents), [items, events, documents])
  const overdue = agenda.filter(r => r.iso < today)
  const todayRows = agenda.filter(r => r.iso === today)
  const soon = agenda.filter(r => r.iso > today && r.iso <= weekEnd)

  const active = useMemo(() => items.filter(p => !p.archived), [items])
  const inProgress = useMemo(
    () => active.filter(p => p.status === 'in_progress')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
    [active]
  )
  const allTodos = active.flatMap(p => p.todos || [])
  const openTodos = allTodos.filter(t => !t.completed).length

  const toggleTodo = (row) => {
    const todos = (row.project.todos || []).map((t, i) => i === row.index ? { ...t, completed: true } : t)
    actions.update(row.project.id, { todos })
  }

  // Routine di oggi: le stesse spunte che vede il calendario (routines/{uid}.dayTasks)
  const weekday = new Date().getDay()
  const routineTasks = (routine?.tasks || []).filter(t => !t.days?.length || t.days.includes(weekday))
  const ticks = routine?.dayTasks?.[today] || {}
  const toggleRoutine = (id) => {
    saveRoutine({ dayTasks: { ...(routine?.dayTasks || {}), [today]: { ...ticks, [id]: !ticks[id] } } }).catch(() => {})
  }

  const send = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    navigate('/ai', { state: { message: prompt.trim() } })
  }

  const dueToday = todayRows.length
  const routineLeft = routineTasks.filter(t => !ticks[t.id]).length
  const summary = loading
    ? 'Carico…'
    : [
        dueToday ? `${dueToday} ${dueToday === 1 ? 'cosa' : 'cose'} per oggi` : 'Niente in scadenza oggi',
        routineLeft ? `${routineLeft} attività della routine da fare` : null,
        overdue.length ? `${overdue.length} ${overdue.length === 1 ? 'scaduta' : 'scadute'}` : null
      ].filter(Boolean).join(' · ')

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>{cap(longDate(today))}</h1>
          <p className="sub">{summary}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openForm()}><Plus size={15} /> Nuovo</button>
        </div>
      </div>

      <form className="ask" onSubmit={send}>
        <input
          value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="Chiedi a Polpo: riassumi la settimana, aggiungi una nota…" aria-label="Scrivi a Polpo AI"
        />
        <button className="btn btn-primary" type="submit" disabled={!prompt.trim()} aria-label="Invia a Polpo AI"><ArrowUp size={16} /></button>
      </form>

      <div className="stats" role="list">
        <Link to="/elementi" className="stat" role="listitem"><b>{active.length}</b><span>Elementi</span></Link>
        <Link to="/elementi?status=in_progress" className="stat" role="listitem"><b>{inProgress.length}</b><span>In corso</span></Link>
        <Link to="/da-fare" className="stat" role="listitem"><b>{openTodos}</b><span>Cose da fare</span></Link>
        <Link to="/da-fare" className={`stat ${overdue.length ? 'is-alert' : ''}`} role="listitem"><b>{overdue.length}</b><span>Scadute</span></Link>
      </div>

      <div className="oggi-grid">
        <div className="stack">
          <AgendaBlock
            title="Scadute" rows={overdue.slice(0, 8)} onToggle={toggleTodo} invert
            more={overdue.length > 8 && <Link className="ag-more" to="/da-fare">Altre {overdue.length - 8} scadute</Link>}
          />
          <AgendaBlock title="Oggi" rows={todayRows} onToggle={toggleTodo} />
          {routine && routineTasks.length > 0 && (
            <section className="card">
              <h2 className="card-title">
                <span>Routine di oggi</span>
                <span className="faint" style={{ letterSpacing: 0 }}>{routineTasks.length - routineLeft}/{routineTasks.length}</span>
              </h2>
              <ul className="routine-list">
                {routineTasks.map(t => (
                  <li key={t.id}>
                    <label className={ticks[t.id] ? 'is-done' : ''}>
                      <input type="checkbox" checked={!!ticks[t.id]} onChange={() => toggleRoutine(t.id)} />
                      <span className="grow">{t.name}</span>
                      {(t.time || t.duration) && <span className="small faint">{t.time || t.duration}</span>}
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <AgendaBlock title="Prossimi 7 giorni" rows={soon.slice(0, 10)} onToggle={toggleTodo}
            more={soon.length > 10 && <Link className="ag-more" to="/calendario">Tutto il calendario</Link>} />

          {!loading && !overdue.length && !todayRows.length && !soon.length && (
            <div className="empty">
              <strong>Niente in scadenza</strong>
              <p className="small">Nei prossimi 7 giorni non c&apos;è nulla di datato. Dai una scadenza a una cosa da fare per vederla qui.</p>
              <Link to="/calendario" className="btn" style={{ marginTop: 12 }}><CalendarDays size={15} /> Apri il calendario</Link>
            </div>
          )}
        </div>

        <div className="stack">
          <section className="card card-flush">
            <h2 className="ag-head"><span>In corso</span> <span className="count ghost">{inProgress.length}</span></h2>
            {inProgress.length === 0 ? (
              <p className="small muted" style={{ padding: 12 }}>Nessun elemento in corso. Cambia lo stato di un elemento per vederlo qui.</p>
            ) : (
              <ul>
                {inProgress.slice(0, 6).map(p => {
                  const { done, total, pct } = progressOf(p)
                  return (
                    <li key={p.id} className="wip-row">
                      <div className="row">
                        <StatusMark status={p.status} label={false} />
                        <Link to={`/elementi/${p.id}`} className="grow trunc ag-text">{p.name}</Link>
                        <span className="small faint">{timeAgo(p.updatedAt || p.createdAt)}</span>
                      </div>
                      {total > 0 && (
                        <div className="row" style={{ marginTop: 6 }}>
                          <div className="grow"><ProgressBar pct={pct} label={`Avanzamento di ${p.name}`} /></div>
                          <span className="small muted">{done}/{total}</span>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            {inProgress.length > 6 && <Link className="ag-more" to="/elementi?status=in_progress">Tutti i {inProgress.length} in corso</Link>}
          </section>
        </div>
      </div>
    </div>
  )
}

export default OggiPage
