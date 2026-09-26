import { useEffect, useState } from 'react'
import { AlarmClock, CalendarDays, GripVertical, Plus, X } from 'lucide-react'
import ProgressBar from './ui/ProgressBar'
import { ANTICIPI, daSelect, aSelect } from '../sveglie'
import { relativeDay } from '../lib/dates'
import './TodoList.css'

// Le cose da fare di un progetto: spunta, riordina col trascinamento, scadenza e sveglia per ciascuna.
const TodoList = ({ project, onUpdate }) => {
  const [todos, setTodos] = useState(project.todos || [])
  const [dragIndex, setDragIndex] = useState(null)
  const [draft, setDraft] = useState({ text: '', deadline: '', time: '' })
  // Quale voce ha aperto il pannellino scadenza/sveglia: i task nati prima
  // dell'orario devono poterne ricevere uno senza essere ricreati.
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => { setTodos(project.todos || []) }, [project.todos])

  const save = async (next) => {
    setTodos(next)
    await onUpdate(next)
  }

  const toggle = (i) => save(todos.map((t, idx) => idx === i ? { ...t, completed: !t.completed } : t))
  const remove = (i) => save(todos.filter((_, idx) => idx !== i))

  // Una sveglia senza data e ora non ha un momento a cui suonare: se uno dei due sparisce, sparisce anche lei.
  const patch = (i, changes) => save(todos.map((t, idx) => {
    if (idx !== i) return t
    const next = { ...t, ...changes }
    if (!next.deadline || !next.time) next.reminder = null
    return next
  }))

  const add = async () => {
    if (!draft.text.trim()) return
    const todo = { text: draft.text.trim(), completed: false }
    if (draft.deadline) {
      todo.deadline = draft.deadline
      if (draft.time) todo.time = draft.time
    }
    setDraft({ text: '', deadline: '', time: '' })
    await save([...todos, todo])
  }

  const onDragOver = (e, i) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === i) return
    const next = [...todos]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(i, 0, moved)
    setTodos(next)
    setDragIndex(i)
  }
  const onDragEnd = async () => {
    setDragIndex(null)
    await onUpdate(todos)
  }

  const done = todos.filter(t => t.completed).length
  const pct = todos.length ? Math.round((done / todos.length) * 100) : 0

  return (
    <section className="card" aria-label="Cose da fare">
      <h2 className="card-title">
        <span>Cose da fare</span>
        <span className="row" style={{ gap: 6 }}>
          <span className="faint" style={{ letterSpacing: 0 }}>{done}/{todos.length}</span>
          {todos.length - done > 0 && <span className="count">{todos.length - done}</span>}
        </span>
      </h2>

      {todos.length > 0 && <div style={{ marginBottom: 10 }}><ProgressBar pct={pct} label="Cose da fare completate" /></div>}

      <ul className="todo-list">
        {todos.map((t, i) => {
          const rel = !t.completed && t.deadline ? relativeDay(t.deadline) : null
          const hasReminder = t.reminder !== null && t.reminder !== undefined
          return (
            <li
              key={i}
              className={`todo ${t.completed ? 'is-done' : ''} ${dragIndex === i ? 'is-dragging' : ''}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragEnd={onDragEnd}
            >
              <div className="todo-main">
                <span className="todo-grip" aria-hidden="true" title="Trascina per riordinare"><GripVertical size={14} /></span>
                <input type="checkbox" checked={!!t.completed} onChange={() => toggle(i)} aria-label={`Segna “${t.text}” come ${t.completed ? 'da fare' : 'fatta'}`} />
                <span className="todo-text">{t.text}</span>
                {rel && (
                  <span className={`tag ${rel.tone === 'late' ? 'tag-invert' : ''}`}>
                    <CalendarDays size={11} aria-hidden="true" />
                    {rel.text}{t.time ? ` · ${t.time}` : ''}
                    {hasReminder && <AlarmClock size={11} aria-label="Con sveglia" />}
                  </span>
                )}
                <button
                  className={`btn-icon sm ${openIndex === i ? 'is-on' : ''}`} onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  aria-label="Scadenza e sveglia" aria-expanded={openIndex === i}
                ><AlarmClock size={14} /></button>
                <button className="btn-icon sm" onClick={() => remove(i)} aria-label={`Elimina “${t.text}”`}><X size={14} /></button>
              </div>

              {openIndex === i && (
                <div className="todo-alarm">
                  <input type="date" value={t.deadline || ''} aria-label="Scadenza" onChange={(e) => patch(i, { deadline: e.target.value })} />
                  <input type="time" value={t.time || ''} aria-label="Ora" disabled={!t.deadline} onChange={(e) => patch(i, { time: e.target.value })} />
                  <select value={aSelect(t.reminder)} aria-label="Sveglia" disabled={!t.deadline || !t.time} onChange={(e) => patch(i, { reminder: daSelect(e.target.value) })}>
                    {ANTICIPI.map(a => <option key={String(a.value)} value={aSelect(a.value)}>{a.label}</option>)}
                  </select>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {todos.length === 0 && <p className="small muted" style={{ marginBottom: 10 }}>Niente da fare qui, per ora.</p>}

      <div className="todo-add">
        <input
          className="todo-add-text" value={draft.text} placeholder="Aggiungi una cosa da fare" aria-label="Nuova cosa da fare"
          onChange={(e) => setDraft(d => ({ ...d, text: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter') add() }}
        />
        <input type="date" value={draft.deadline} aria-label="Scadenza (facoltativa)" onChange={(e) => setDraft(d => ({ ...d, deadline: e.target.value }))} />
        <input type="time" value={draft.time} aria-label="Ora (facoltativa)" disabled={!draft.deadline} onChange={(e) => setDraft(d => ({ ...d, time: e.target.value }))} />
        <button className="btn btn-primary" onClick={add} disabled={!draft.text.trim()}><Plus size={15} /> Aggiungi</button>
      </div>
    </section>
  )
}

export default TodoList
