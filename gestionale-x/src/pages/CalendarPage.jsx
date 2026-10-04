import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlarmClock, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import EventForm from '../components/EventForm'
import { useData } from '../context/useData'
import { addEvent, updateEvent, deleteEvent, saveRoutine } from '../firebaseService'
import { etichettaAnticipo } from '../sveglie'
import { hourToTime, isoOf, longDate, oggiIso, addDaysIso, relativeDay, toIso } from '../lib/dates'
import { documentDeadlines } from '../services/localDocuments'
import './CalendarPage.css'

const STATUS_CYCLE = ['pending', 'done', 'skip']
const STATUS_LABEL = { pending: 'Da fare', done: 'Fatta', skip: 'Saltata' }
const STATUS_GLYPH = { pending: '○', done: '✓', skip: '—' }
const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const KIND = { documento: 'k-deadline', appuntamento: 'k-event', 'project-deadline': 'k-deadline', 'todo-deadline': 'k-todo' }
const KIND_LABEL = { documento: 'Documento locale', appuntamento: 'Appuntamento', 'project-deadline': 'Scadenza di un elemento', 'todo-deadline': 'Cosa da fare' }

const CalendarPage = () => {
  const navigate = useNavigate()
  const { projects, events, routine, documents } = useData()
  const [current, setCurrent] = useState(() => new Date())
  const [selected, setSelected] = useState(() => oggiIso())
  const [eventForm, setEventForm] = useState(null)

  const year = current.getFullYear()
  const month = current.getMonth()
  const today = oggiIso()

  // Scadenze di progetti e task. Archiviati e completati restano fuori: prima entravano tutti,
  // e "Scaduti" si riempiva di progetti chiusi da mesi che non erano più scaduti di niente.
  const deadlines = useMemo(() => {
    const out = []
    projects.filter(p => !p.archived && p.status !== 'completed').forEach(p => {
      if (p.deadline) out.push({ date: p.deadline, time: p.deadlineTime || '', reminder: p.reminder ?? null, title: p.name, type: 'project-deadline', project: p })
      ;(p.todos || []).forEach(t => {
        if (t.deadline && !t.completed) out.push({ date: t.deadline, time: t.time || '', reminder: t.reminder ?? null, title: t.text, type: 'todo-deadline', project: p, projectName: p.name })
      })
    })
    return out
  }, [projects])

  const entries = useMemo(() => ([
    ...deadlines,
    ...documentDeadlines(documents),
    ...events.map(e => ({ date: e.date, time: e.time || '', reminder: e.reminder ?? null, title: e.title, type: 'appuntamento', evento: e }))
  ]), [deadlines, events, documents])

  const byDate = useMemo(() => {
    const m = {}
    entries.forEach(v => { (m[v.date] ||= []).push(v) })
    for (const k in m) m[k].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
    return m
  }, [entries])

  const upcoming = useMemo(() => {
    const limit = addDaysIso(14)
    return entries.filter(v => v.date >= today && v.date <= limit).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
  }, [entries, today])
  const overdue = useMemo(() => entries.filter(v => v.date < today).sort((a, b) => b.date.localeCompare(a.date)), [entries, today])

  // ── Routine ──
  const tasks = routine?.tasks || []
  const blocks = routine?.timeBlocks || []
  const dayStatus = (d) => routine?.weekStatus?.[d] || 'pending'
  const dayTicks = (d) => routine?.dayTasks?.[d] || {}
  const doneCount = (d) => tasks.filter(t => dayTicks(d)[t.id]).length

  const cycleStatus = (d) => {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(dayStatus(d)) + 1) % STATUS_CYCLE.length]
    saveRoutine({ weekStatus: { ...(routine?.weekStatus || {}), [d]: next } }).catch(() => {})
  }
  const tick = (d, id) => {
    const cur = dayTicks(d)
    saveRoutine({ dayTasks: { ...(routine?.dayTasks || {}), [d]: { ...cur, [id]: !cur[id] } } }).catch(() => {})
  }

  // ── Griglia del mese (settimana da lunedì) ──
  const firstDay = new Date(year, month, 1).getDay()
  const lead = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7) cells.push(null)

  const goTo = (date) => { setCurrent(date); setSelected(toIso(date)) }

  // ── Giornata selezionata ──
  const selDate = selected ? new Date(`${selected}T00:00:00`) : null
  const selWeekday = selDate ? selDate.getDay() : null
  // `days` è facoltativo sui blocchi: assente = tutti i giorni
  const dayBlocks = blocks.filter(b => !Array.isArray(b.days) || !b.days.length || b.days.includes(selWeekday))
  const timed = selected ? [
    ...dayBlocks.map(b => ({ key: `b-${b.id}`, time: hourToTime(b.start), end: hourToTime(b.end), title: b.label, kind: 'blocco', reminder: b.reminder ?? null })),
    ...(byDate[selected] || []).filter(v => v.time).map((v, i) => ({ key: `v-${i}`, time: v.time, end: v.evento?.endTime || '', title: v.title, kind: v.type, entry: v, reminder: v.reminder }))
  ].sort((a, b) => a.time.localeCompare(b.time)) : []
  const untimed = selected ? (byDate[selected] || []).filter(v => !v.time) : []
  const axisStart = 6, axisEnd = 22, axis = axisEnd - axisStart

  const openEntry = (v) => {
    if (v.documentId) navigate(`/documenti/${v.documentId}`)
    else if (v.evento) setEventForm({ evento: v.evento, data: v.date })
    else if (v.project) navigate(`/elementi/${v.project.id}`)
  }

  const saveEvent = async (data) => {
    if (eventForm?.evento) await updateEvent(eventForm.evento.id, data)
    else await addEvent(data)
  }

  const EntryLine = ({ v, showDate }) => (
    <button className="cal-entry" onClick={() => openEntry(v)}>
      <span className={`cal-kind ${KIND[v.type]}`} aria-hidden="true" />
      <span className="grow">
        <span className="cal-entry-title">{v.title}</span>
        {(v.projectName || v.time) && <span className="small faint"> {v.projectName}{v.time ? ` · ${v.time}` : ''}</span>}
      </span>
      {showDate && <span className="small muted">{relativeDay(v.date).text}</span>}
    </button>
  )

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>{MESI[month]} {year}</h1>
          <p className="sub">{upcoming.length ? `${upcoming.length} in arrivo nelle prossime due settimane` : 'Due settimane sgombre'}</p>
        </div>
        <div className="page-actions">
          <div className="seg">
            <button onClick={() => goTo(new Date(year, month - 1, 1))} aria-label="Mese precedente"><ChevronLeft size={16} /></button>
            <button style={{ width: 'auto', padding: '0 12px' }} onClick={() => goTo(new Date())}>Oggi</button>
            <button onClick={() => goTo(new Date(year, month + 1, 1))} aria-label="Mese successivo"><ChevronRight size={16} /></button>
          </div>
          <button className="btn btn-primary" onClick={() => setEventForm({ data: selected || today })}><Plus size={15} /> Appuntamento</button>
        </div>
      </div>

      <div className="cal-layout">
        <div>
          <div className="cal-grid" role="grid" aria-label={`${MESI[month]} ${year}`}>
            {GIORNI.map(d => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="cal-cell is-empty" role="gridcell" />
              const iso = isoOf(year, month, day)
              const list = byDate[iso] || []
              const st = dayStatus(iso)
              const n = doneCount(iso)
              return (
                <button
                  key={i} role="gridcell" onClick={() => setSelected(iso)}
                  className={`cal-cell ${iso === today ? 'is-today' : ''} ${iso === selected ? 'is-selected' : ''}`}
                  aria-label={`${day} ${MESI[month]}${list.length ? `, ${list.length} voci` : ''}`} aria-pressed={iso === selected}
                >
                  <span className="cal-num">{day}</span>
                  {tasks.length > 0 && (st !== 'pending' || n > 0) && (
                    <span className="cal-flag" title={`Routine: ${STATUS_LABEL[st]}${n ? ` · ${n}/${tasks.length}` : ''}`}>
                      {st === 'done' ? '✓' : st === 'skip' ? '—' : `${n}/${tasks.length}`}
                    </span>
                  )}
                  <span className="cal-items">
                    {list.slice(0, 2).map((v, k) => (
                      <span key={k} className="cal-item"><span className={`cal-kind ${KIND[v.type]}`} />{v.time && <em>{v.time}</em>}<span className="trunc">{v.title}</span></span>
                    ))}
                    {list.length > 2 && <span className="cal-more">+{list.length - 2}</span>}
                  </span>
                  {list.length > 0 && <span className="cal-count count">{list.length}</span>}
                </button>
              )
            })}
          </div>
          <div className="cal-legend small muted">
            {Object.entries(KIND_LABEL).map(([k, label]) => <span key={k}><span className={`cal-kind ${KIND[k]}`} aria-hidden="true" /> {label}</span>)}
          </div>
        </div>

        <div className="stack">
          {selected && (
            <section className="card cal-day">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <h2 className="grow" style={{ textTransform: 'capitalize' }}>{longDate(selected)}</h2>
                <button className="btn-icon sm" onClick={() => setEventForm({ data: selected })} aria-label="Nuovo appuntamento in questo giorno"><Plus size={16} /></button>
                <button className="btn-icon sm" onClick={() => setSelected(null)} aria-label="Chiudi il giorno"><X size={16} /></button>
              </div>

              {tasks.length > 0 && (
                <button className="btn btn-sm cal-status" onClick={() => cycleStatus(selected)} title="Cambia stato della giornata">
                  {STATUS_GLYPH[dayStatus(selected)]} Giornata: {STATUS_LABEL[dayStatus(selected)]}
                </button>
              )}

              {timed.length > 0 && (
                <ul className="cal-timed">
                  {timed.map(r => (
                    <li key={r.key}>
                      <button className="cal-row" disabled={!r.entry} onClick={() => r.entry && openEntry(r.entry)}>
                        <span className="cal-time">{r.time}</span>
                        <span className="grow">{r.title}{r.end && <span className="faint"> → {r.end}</span>}</span>
                        {r.reminder !== null && r.reminder !== undefined && <AlarmClock size={13} aria-label={etichettaAnticipo(r.reminder)} />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {untimed.length > 0 && (
                <div>
                  <p className="cal-label">Senza orario</p>
                  {untimed.map((v, i) => <EntryLine key={i} v={v} />)}
                </div>
              )}

              {tasks.length > 0 && (
                <div>
                  <p className="cal-label">Routine</p>
                  {tasks.map(t => {
                    const done = !!dayTicks(selected)[t.id]
                    return (
                      <label key={t.id} className={`cal-task ${done ? 'is-done' : ''}`}>
                        <input type="checkbox" checked={done} onChange={() => tick(selected, t.id)} />
                        <span className="grow">{t.name}</span>
                        {(t.time || t.duration) && <span className="small faint">{t.time || t.duration}</span>}
                      </label>
                    )
                  })}
                </div>
              )}

              {dayBlocks.length > 0 && (
                <div>
                  <div className="cal-axis" aria-hidden="true">
                    {dayBlocks.map(b => (
                      <span key={b.id} title={`${b.label}: ${hourToTime(b.start)}–${hourToTime(b.end)}`}
                        style={{ left: `${((b.start - axisStart) / axis) * 100}%`, width: `${((b.end - b.start) / axis) * 100}%` }} />
                    ))}
                  </div>
                  <div className="cal-axis-hours" aria-hidden="true">
                    {[6, 10, 14, 18, 22].map(h => <span key={h} style={{ left: `${((h - axisStart) / axis) * 100}%` }}>{h}</span>)}
                  </div>
                </div>
              )}

              {!timed.length && !untimed.length && !tasks.length && (
                <p className="small muted">Giornata libera. Usa + per aggiungere un appuntamento.</p>
              )}
            </section>
          )}

          {overdue.length > 0 && (
            <section className="card card-flush">
              <h2 className="cal-head is-invert"><span>Scadute</span> <span className="count ghost">{overdue.length}</span></h2>
              {overdue.slice(0, 5).map((v, i) => <EntryLine key={i} v={v} showDate />)}
            </section>
          )}

          <section className="card card-flush">
            <h2 className="cal-head"><span>Prossime scadenze</span></h2>
            {upcoming.length > 0
              ? upcoming.map((v, i) => <EntryLine key={i} v={v} showDate />)
              : <p className="small muted" style={{ padding: 12 }}>Nessuna scadenza nelle prossime due settimane.</p>}
          </section>
        </div>
      </div>

      {eventForm && (
        <EventForm evento={eventForm.evento} data={eventForm.data} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setEventForm(null)} />
      )}
    </div>
  )
}

export default CalendarPage
