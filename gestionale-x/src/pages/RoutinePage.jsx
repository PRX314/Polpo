import { useEffect, useMemo, useState } from 'react'
import { AlarmClock, ChevronLeft, ChevronRight, Pencil, Plus, X } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import { useData } from '../context/useData'
import { saveRoutine } from '../firebaseService'
import { ANTICIPI, daSelect, aSelect, GIORNI as GIORNI_SETT } from '../sveglie'
import { hourToTime, timeToHour, toIso } from '../lib/dates'
import './RoutinePage.css'

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7..20

const DEFAULT_ROUTINE = {
  tasks: [
    { id: 't1', name: 'Arte (disegno x Ava)', duration: '30 min' },
    { id: 't2', name: 'Sport', duration: '15/15 · 30 min' },
    { id: 't3', name: 'Lavoro su PC', duration: '1h' },
    { id: 't4', name: 'Lavoro in giro', duration: '1h' },
    { id: 't5', name: 'Faccende casa', duration: '' }
  ],
  timeBlocks: [
    { id: 'b1', label: 'Lavoro', start: 7, end: 13 },
    { id: 'b2', label: 'Pranzo', start: 13, end: 14 },
    { id: 'b3', label: '3h O.G.', start: 14, end: 17 }
  ],
  extras: [
    { id: 'e1', text: 'Mettere a posto i documenti', done: false },
    { id: 'e2', text: 'Burocrazia (organizzare anno)', done: false }
  ],
  weekStatus: {}
}

const uid = () => Math.random().toString(36).slice(2, 10)

// Restituisce le 7 date (Dom→Sab) della settimana con offset rispetto a oggi
const getWeekDates = (offset) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay() + offset * 7)
  return DAY_LABELS.map((_, i) => { const d = new Date(sunday); d.setDate(sunday.getDate() + i); return d })
}

const STATUS_CYCLE = ['pending', 'done', 'skip']
const STATUS_GLYPH = { pending: '○', done: '✓', skip: '—' }
const STATUS_LABEL = { pending: 'Da fare', done: 'Fatto', skip: 'Saltato' }

// Quali giorni della settimana. Vuoto = tutti, come si comportava prima che
// esistesse il campo: i blocchi già salvati non cambiano significato.
const DayPicker = ({ value, onChange }) => {
  const all = !Array.isArray(value) || value.length === 0
  const toggle = (g) => {
    const current = all ? [0, 1, 2, 3, 4, 5, 6] : value
    const next = current.includes(g) ? current.filter(x => x !== g) : [...current, g].sort()
    onChange(next.length === 7 ? [] : next)
  }
  return (
    <div className="dayp" role="group" aria-label="Giorni della settimana">
      {GIORNI_SETT.map(g => (
        <button
          key={g.value} type="button" className={`dayp-chip ${all || value.includes(g.value) ? 'is-on' : ''}`}
          onClick={() => toggle(g.value)} aria-pressed={all || value.includes(g.value)}
          title={all ? 'Tutti i giorni' : undefined}
        >{g.label}</button>
      ))}
    </div>
  )
}

// Ora + anticipo: la coppia che rende una voce capace di suonare.
const Alarm = ({ time, reminder, onChange, showTime = true }) => (
  <>
    {showTime && <input type="time" className="rt-time" value={time || ''} onChange={(e) => onChange({ time: e.target.value })} aria-label="A che ora" />}
    <select className="rt-alarm" value={aSelect(reminder)} onChange={(e) => onChange({ reminder: daSelect(e.target.value) })} aria-label="Sveglia" disabled={showTime && !time}>
      {ANTICIPI.map(a => <option key={String(a.value)} value={aSelect(a.value)}>{a.label}</option>)}
    </select>
  </>
)

const SectionHead = ({ title, editing, onEdit }) => (
  <div className="row" style={{ marginBottom: 12 }}>
    <h2 className="grow" style={{ fontSize: 'var(--fs)' }}>{title}</h2>
    {onEdit && <button className="btn btn-sm" onClick={onEdit}>{editing ? 'Fatto' : <><Pencil size={12} /> Modifica</>}</button>}
  </div>
)

const RoutinePage = () => {
  const { routine: stored } = useData()
  const [weekOffset, setWeekOffset] = useState(0)
  const [newTask, setNewTask] = useState({ name: '', duration: '' })
  const [newExtra, setNewExtra] = useState('')
  const [newBlock, setNewBlock] = useState({ label: '', start: '07:00', end: '08:00' })
  const [editingTasks, setEditingTasks] = useState(false)
  const [editingBlocks, setEditingBlocks] = useState(false)

  // Alla prima volta la routine non esiste: si crea quella di partenza (solo se la lettura è andata a buon fine)
  useEffect(() => {
    if (stored === null) saveRoutine(DEFAULT_ROUTINE).catch(() => {})
  }, [stored])

  const routine = stored === undefined || stored === false ? undefined : (stored || DEFAULT_ROUTINE)
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const todayStr = toIso(new Date())

  if (stored === false) return <EmptyState title="Non riesco a leggere la routine" hint="Controlla la connessione e riprova a ricaricare la pagina." />
  if (!routine) return <div className="row" style={{ justifyContent: 'center', padding: 48 }}><span className="spinner" aria-hidden="true" /></div>

  const tasks = routine.tasks || []
  const blocks = routine.timeBlocks || []
  const extras = routine.extras || []
  // Si salva solo la parte cambiata: il documento intero sovrascriverebbe ciò che nel frattempo ha scritto un altro dispositivo
  const persist = (updates) => saveRoutine(updates).catch(() => {})

  const cycleStatus = (dateStr) => {
    const current = routine.weekStatus?.[dateStr] || 'pending'
    persist({ weekStatus: { ...(routine.weekStatus || {}), [dateStr]: STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length] } })
  }

  const addTask = () => {
    if (!newTask.name.trim()) return
    persist({ tasks: [...tasks, { id: uid(), name: newTask.name.trim(), duration: newTask.duration.trim(), time: '', reminder: null, days: [] }] })
    setNewTask({ name: '', duration: '' })
  }
  const patchTask = (id, patch) => persist({
    tasks: tasks.map(t => {
      if (t.id !== id) return t
      const next = { ...t, ...patch }
      // Una sveglia senza orario non saprebbe quando suonare: se l'ora sparisce sparisce anche l'anticipo
      if (patch.time === '') next.reminder = null
      return next
    })
  })
  const removeTask = (id) => persist({ tasks: tasks.filter(t => t.id !== id) })

  const addExtra = () => {
    if (!newExtra.trim()) return
    persist({ extras: [...extras, { id: uid(), text: newExtra.trim(), done: false }] })
    setNewExtra('')
  }
  const toggleExtra = (id) => persist({ extras: extras.map(e => e.id === id ? { ...e, done: !e.done } : e) })
  const removeExtra = (id) => persist({ extras: extras.filter(e => e.id !== id) })

  const addBlock = () => {
    const start = timeToHour(newBlock.start)
    const end = timeToHour(newBlock.end)
    if (!newBlock.label.trim() || end <= start) return
    persist({ timeBlocks: [...blocks, { id: uid(), label: newBlock.label.trim(), start, end, reminder: null, days: [] }] })
    setNewBlock({ label: '', start: '07:00', end: '08:00' })
  }
  const patchBlock = (id, patch) => persist({ timeBlocks: blocks.map(b => b.id === id ? { ...b, ...patch } : b) })
  const removeBlock = (id) => persist({ timeBlocks: blocks.filter(b => b.id !== id) })

  const axisStart = HOURS[0]
  const axisEnd = HOURS[HOURS.length - 1]
  const axisSpan = axisEnd - axisStart
  const hasAlarm = (r) => r !== null && r !== undefined
  const alarms = tasks.filter(t => t.time && hasAlarm(t.reminder)).length + blocks.filter(b => hasAlarm(b.reminder)).length
  const weekLabel = weekOffset === 0 ? 'Questa settimana' : weekOffset > 0 ? `Tra ${weekOffset} ${weekOffset === 1 ? 'settimana' : 'settimane'}` : `${Math.abs(weekOffset)} ${weekOffset === -1 ? 'settimana' : 'settimane'} fa`

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>Routine</h1>
          <p className="sub">Ogni giorno (O.G.){alarms > 0 && ` · ${alarms} ${alarms === 1 ? 'sveglia attiva' : 'sveglie attive'}`}</p>
        </div>
      </div>

      <section className="card">
        <SectionHead title="Attività giornaliere" editing={editingTasks} onEdit={() => setEditingTasks(v => !v)} />

        <ul className="rt-list">
          {tasks.map(t => (
            <li key={t.id} className="rt-item">
              <div className="rt-line">
                {t.time ? <span className="tag tag-invert">{t.time}</span> : t.duration ? <span className="tag">{t.duration}</span> : null}
                <span className="grow">{t.name}</span>
                {t.time && hasAlarm(t.reminder) && <AlarmClock size={13} aria-label={`Sveglia ${ANTICIPI.find(a => a.value === t.reminder)?.label || ''}`} />}
                {Array.isArray(t.days) && t.days.length > 0 && (
                  <span className="small faint">{t.days.map(d => GIORNI_SETT.find(g => g.value === d)?.label).join('')}</span>
                )}
                {editingTasks && <button className="btn-icon sm" onClick={() => removeTask(t.id)} aria-label={`Rimuovi ${t.name}`}><X size={14} /></button>}
              </div>
              {editingTasks && (
                <div className="rt-edit">
                  <Alarm time={t.time} reminder={t.reminder} onChange={(patch) => patchTask(t.id, patch)} />
                  <DayPicker value={t.days} onChange={(days) => patchTask(t.id, { days })} />
                </div>
              )}
            </li>
          ))}
          {tasks.length === 0 && <li className="small muted" style={{ padding: '8px 0' }}>La routine è vuota. Tocca “Modifica” per aggiungere la prima attività.</li>}
        </ul>

        {editingTasks && (
          <>
            <div className="rt-add">
              <input className="grow" placeholder="Nome attività (es. Lettura)" aria-label="Nome dell'attività" value={newTask.name}
                onChange={(e) => setNewTask(v => ({ ...v, name: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addTask()} />
              <input style={{ maxWidth: 130 }} placeholder="Durata (30 min)" aria-label="Durata" value={newTask.duration}
                onChange={(e) => setNewTask(v => ({ ...v, duration: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && addTask()} />
              <button className="btn btn-primary" onClick={addTask} aria-label="Aggiungi attività"><Plus size={15} /></button>
            </div>
            <p className="help" style={{ marginTop: 6 }}>
              Metti un orario a un&apos;attività e scegli l&apos;anticipo: la sveglia suona da sola ogni giorno, anche ad app chiusa.
              Non suona se hai già spuntato l&apos;attività o chiuso la giornata.
            </p>
          </>
        )}

        <div className="rt-week-head">
          <span className="small muted">{weekLabel}</span>
          <div className="seg">
            <button onClick={() => setWeekOffset(w => w - 1)} aria-label="Settimana precedente"><ChevronLeft size={16} /></button>
            <button onClick={() => setWeekOffset(0)} aria-label="Questa settimana" style={{ fontSize: 18, lineHeight: 1 }}>•</button>
            <button onClick={() => setWeekOffset(w => w + 1)} aria-label="Settimana successiva"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="rt-week">
          {weekDates.map((d, i) => {
            const dateStr = toIso(d)
            const status = routine.weekStatus?.[dateStr] || 'pending'
            return (
              <button
                key={dateStr} onClick={() => cycleStatus(dateStr)}
                className={`rt-day is-${status} ${dateStr === todayStr ? 'is-today' : ''}`}
                aria-label={`${DAY_LABELS[i]} ${d.getDate()}/${d.getMonth() + 1}: ${STATUS_LABEL[status]}. Tocca per cambiare`}
              >
                <span className="rt-dow">{DAY_LABELS[i]}</span>
                <span className="rt-glyph">{STATUS_GLYPH[status]}</span>
                <span className="rt-date">{d.getDate()}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="card">
        <SectionHead title="Timeline della giornata tipo" editing={editingBlocks} onEdit={() => setEditingBlocks(v => !v)} />

        <div className="rt-axis">
          <div className="rt-track">
            {blocks.map(b => (
              <span key={b.id} title={`${b.label}: ${hourToTime(b.start)}–${hourToTime(b.end)}`}
                style={{ left: `${((b.start - axisStart) / axisSpan) * 100}%`, width: `${((b.end - b.start) / axisSpan) * 100}%` }} />
            ))}
          </div>
          <div className="rt-hours" aria-hidden="true">
            {HOURS.filter(h => (h - axisStart) % 2 === 0 || h === axisEnd).map(h => (
              <span key={h} style={{ left: `${((h - axisStart) / axisSpan) * 100}%` }}>{h}</span>
            ))}
          </div>
          <div className="rt-labels" aria-hidden="true">
            {blocks.map(b => (
              <span key={b.id} style={{ left: `${((b.start - axisStart) / axisSpan) * 100}%`, width: `${((b.end - b.start) / axisSpan) * 100}%` }}>{b.label}</span>
            ))}
          </div>
        </div>

        {editingBlocks ? (
          <>
            <ul className="rt-list">
              {blocks.map(b => (
                <li key={b.id} className="rt-item">
                  <div className="rt-line">
                    <span className="grow">{b.label}</span>
                    <input type="time" className="rt-time" aria-label={`Inizio di ${b.label}`} value={hourToTime(b.start)} onChange={(e) => patchBlock(b.id, { start: timeToHour(e.target.value) })} />
                    <input type="time" className="rt-time" aria-label={`Fine di ${b.label}`} value={hourToTime(b.end)} onChange={(e) => patchBlock(b.id, { end: timeToHour(e.target.value) })} />
                    <button className="btn-icon sm" onClick={() => removeBlock(b.id)} aria-label={`Rimuovi ${b.label}`}><X size={14} /></button>
                  </div>
                  <div className="rt-edit">
                    <Alarm showTime={false} reminder={b.reminder} onChange={(patch) => patchBlock(b.id, patch)} />
                    <DayPicker value={b.days} onChange={(days) => patchBlock(b.id, { days })} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="rt-add">
              <input className="grow" placeholder="Blocco (es. Palestra)" aria-label="Nome del blocco" value={newBlock.label} onChange={(e) => setNewBlock(v => ({ ...v, label: e.target.value }))} />
              <input type="time" className="rt-time" aria-label="Inizio" value={newBlock.start} onChange={(e) => setNewBlock(v => ({ ...v, start: e.target.value }))} />
              <input type="time" className="rt-time" aria-label="Fine" value={newBlock.end} onChange={(e) => setNewBlock(v => ({ ...v, end: e.target.value }))} />
              <button className="btn btn-primary" onClick={addBlock} aria-label="Aggiungi blocco"><Plus size={15} /></button>
            </div>
          </>
        ) : (
          <div className="row row-wrap" style={{ gap: 6, marginTop: 8 }}>
            {blocks.map(b => (
              <span key={b.id} className="tag">
                {b.label} {hourToTime(b.start)}–{hourToTime(b.end)}
                {hasAlarm(b.reminder) && <AlarmClock size={11} aria-label="Sveglia attiva" />}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <SectionHead title="Altro (Tempo X)" />
        <ul className="rt-list">
          {extras.map(e => (
            <li key={e.id} className="rt-item">
              <div className="rt-line">
                <input type="checkbox" checked={!!e.done} onChange={() => toggleExtra(e.id)} aria-label={`Segna “${e.text}” come fatta`} />
                <span className={`grow ${e.done ? 'muted' : ''}`} style={e.done ? { textDecoration: 'line-through' } : undefined}>{e.text}</span>
                <button className="btn-icon sm" onClick={() => removeExtra(e.id)} aria-label={`Rimuovi ${e.text}`}><X size={14} /></button>
              </div>
            </li>
          ))}
          {extras.length === 0 && <li className="small muted" style={{ padding: '8px 0' }}>Niente in sospeso. Raro.</li>}
        </ul>
        <div className="rt-add">
          <input className="grow" placeholder="Aggiungi (es. Burocrazia)" aria-label="Nuova voce" value={newExtra} onChange={(e) => setNewExtra(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExtra()} />
          <button className="btn btn-primary" onClick={addExtra} aria-label="Aggiungi voce"><Plus size={15} /></button>
        </div>
      </section>
    </div>
  )
}

export default RoutinePage
