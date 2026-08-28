import { useEffect, useMemo, useState } from 'react'
import { subscribeToRoutine, saveRoutine } from '../firebaseService'

const DAY_KEYS = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const DAY_LABELS = { dom: 'DOM', lun: 'LUN', mar: 'MAR', mer: 'MER', gio: 'GIO', ven: 'VEN', sab: 'SAB' }
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

const pad = (n) => String(n).padStart(2, '0')
const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const uid = () => Math.random().toString(36).slice(2, 10)

// Restituisce le 7 date (Dom->Sab) della settimana con offset rispetto a oggi
function getWeekDates(offset) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay() + offset * 7)
  return DAY_KEYS.map((_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return d
  })
}

const STATUS_CYCLE = ['pending', 'done', 'skip']
const STATUS_ICON = { pending: '○', done: '✓', skip: '—' }
const STATUS_LABEL = { pending: 'Da fare', done: 'Fatto', skip: 'Saltato' }

const RoutineView = () => {
  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [newTask, setNewTask] = useState({ name: '', duration: '' })
  const [newExtra, setNewExtra] = useState('')
  const [newBlock, setNewBlock] = useState({ label: '', start: 7, end: 8 })
  const [editingTasks, setEditingTasks] = useState(false)

  useEffect(() => {
    const unsub = subscribeToRoutine((data) => {
      setRoutine(data || DEFAULT_ROUTINE)
      setLoading(false)
      if (!data) saveRoutine(DEFAULT_ROUTINE).catch(() => {})
    })
    return unsub
  }, [])

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const todayStr = toDateStr(new Date())

  const persist = (updates) => {
    const next = { ...routine, ...updates }
    setRoutine(next)
    saveRoutine(updates).catch(() => {})
  }

  const cycleStatus = (dateStr) => {
    const current = routine.weekStatus?.[dateStr] || 'pending'
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
    persist({ weekStatus: { ...(routine.weekStatus || {}), [dateStr]: next } })
  }

  const addTask = () => {
    if (!newTask.name.trim()) return
    persist({ tasks: [...routine.tasks, { id: uid(), name: newTask.name.trim(), duration: newTask.duration.trim() }] })
    setNewTask({ name: '', duration: '' })
  }

  const removeTask = (id) => persist({ tasks: routine.tasks.filter(t => t.id !== id) })

  const addExtra = () => {
    if (!newExtra.trim()) return
    persist({ extras: [...routine.extras, { id: uid(), text: newExtra.trim(), done: false }] })
    setNewExtra('')
  }

  const toggleExtra = (id) => persist({ extras: routine.extras.map(e => e.id === id ? { ...e, done: !e.done } : e) })
  const removeExtra = (id) => persist({ extras: routine.extras.filter(e => e.id !== id) })

  const addBlock = () => {
    if (!newBlock.label.trim() || newBlock.end <= newBlock.start) return
    persist({ timeBlocks: [...routine.timeBlocks, { id: uid(), ...newBlock, label: newBlock.label.trim() }] })
    setNewBlock({ label: '', start: 7, end: 8 })
  }

  const removeBlock = (id) => persist({ timeBlocks: routine.timeBlocks.filter(b => b.id !== id) })

  if (loading || !routine) {
    return <div className="empty-state"><p>Caricamento routine…</p></div>
  }

  const axisStart = HOURS[0]
  const axisEnd = HOURS[HOURS.length - 1]
  const axisSpan = axisEnd - axisStart

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 className="title-section" style={{ marginBottom: 0 }}>🗓️ Ogni Giorno (O.G.)</h2>
      </div>

      {/* ===== TASK LIST + WEEKLY TRACKER ===== */}
      <div className="project-card mb-6">
        <div className="flex-between mb-4">
          <h3 className="title-section" style={{ marginBottom: 0, fontSize: '0.95em' }}>Routine giornaliera</h3>
          <button className="btn-secondary" onClick={() => setEditingTasks(v => !v)}>
            {editingTasks ? 'Fatto' : '✏️ Modifica'}
          </button>
        </div>

        <div className="list-projects mb-4">
          {routine.tasks.map(t => (
            <div key={t.id} className="project-list-item" style={{ cursor: 'default' }}>
              <div style={{ flex: 1, display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                {t.duration && <span className="tag">{t.duration}</span>}
                <span>{t.name}</span>
              </div>
              {editingTasks && (
                <button className="todo-del" onClick={() => removeTask(t.id)} title="Rimuovi">×</button>
              )}
            </div>
          ))}
          {routine.tasks.length === 0 && <div className="todo-empty">Nessuna attività ancora</div>}
        </div>

        {editingTasks && (
          <div className="add-todo-row" style={{ marginBottom: '1rem' }}>
            <input
              className="add-todo-input"
              placeholder="Nome attività (es. Lettura)"
              value={newTask.name}
              onChange={(e) => setNewTask(v => ({ ...v, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <input
              className="add-todo-input"
              style={{ maxWidth: 110 }}
              placeholder="Durata (30 min)"
              value={newTask.duration}
              onChange={(e) => setNewTask(v => ({ ...v, duration: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <button className="add-todo-btn" onClick={addTask}>+</button>
          </div>
        )}

        {/* Weekly tracker */}
        <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
          <span className="text-meta">Settimana {weekOffset === 0 ? '(corrente)' : weekOffset > 0 ? `+${weekOffset}` : weekOffset}</span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn-icon" onClick={() => setWeekOffset(w => w - 1)} title="Settimana precedente">‹</button>
            <button className="btn-icon" onClick={() => setWeekOffset(0)} title="Oggi">•</button>
            <button className="btn-icon" onClick={() => setWeekOffset(w => w + 1)} title="Settimana successiva">›</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
          {weekDates.map((d, i) => {
            const dateStr = toDateStr(d)
            const status = routine.weekStatus?.[dateStr] || 'pending'
            const isToday = dateStr === todayStr
            return (
              <button
                key={dateStr}
                onClick={() => cycleStatus(dateStr)}
                title={`${DAY_LABELS[DAY_KEYS[i]]} ${d.getDate()}/${d.getMonth() + 1} — ${STATUS_LABEL[status]} (clicca per cambiare)`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                  padding: '0.5rem 0.2rem', borderRadius: 10, cursor: 'pointer',
                  border: isToday ? '2px solid #4f46e5' : '1px solid var(--border-light, #e5e7eb)',
                  background: status === 'done' ? 'rgba(16,185,129,0.12)' : status === 'skip' ? 'rgba(107,114,128,0.1)' : 'var(--bg-card, #fff)'
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary,#6b7280)' }}>{DAY_LABELS[DAY_KEYS[i]]}</span>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{STATUS_ICON[status]}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary,#6b7280)' }}>{d.getDate()}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== TIMELINE ===== */}
      <div className="project-card mb-6">
        <h3 className="title-section" style={{ fontSize: '0.95em' }}>Timeline giornata tipo</h3>

        <div style={{ position: 'relative', margin: '1.5rem 0 0.5rem' }}>
          <div style={{ position: 'relative', height: 2, background: 'var(--border-light,#e5e7eb)' }}>
            {routine.timeBlocks.map(b => {
              const left = ((b.start - axisStart) / axisSpan) * 100
              const width = ((b.end - b.start) / axisSpan) * 100
              return (
                <div key={b.id} title={`${b.label}: ${b.start}–${b.end}`}
                  style={{
                    position: 'absolute', top: -3, left: `${left}%`, width: `${width}%`, height: 8,
                    background: '#4f46e5', opacity: 0.75, borderRadius: 4
                  }} />
              )
            })}
          </div>
          <div style={{ position: 'relative', height: 30 }}>
            {HOURS.filter(h => h % 1 === 0 && (h - axisStart) % 2 === 0 || h === axisEnd).map(h => (
              <span key={h} style={{
                position: 'absolute', left: `${((h - axisStart) / axisSpan) * 100}%`,
                transform: 'translateX(-50%)', fontSize: '0.65rem', color: 'var(--text-secondary,#6b7280)', top: 6
              }}>{h}</span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 20 }}>
            {routine.timeBlocks.map(b => {
              const left = ((b.start - axisStart) / axisSpan) * 100
              const width = ((b.end - b.start) / axisSpan) * 100
              return (
                <span key={b.id} style={{
                  position: 'absolute', left: `${left}%`, width: `${width}%`, textAlign: 'center',
                  fontSize: '0.7rem', fontWeight: 600, color: '#4f46e5'
                }}>{b.label}</span>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
          {routine.timeBlocks.map(b => (
            <span key={b.id} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {b.label} ({b.start}–{b.end})
              <button className="todo-del" onClick={() => removeBlock(b.id)} title="Rimuovi">×</button>
            </span>
          ))}
        </div>

        <div className="add-todo-row" style={{ marginTop: '0.75rem' }}>
          <input
            className="add-todo-input"
            placeholder="Blocco (es. Palestra)"
            value={newBlock.label}
            onChange={(e) => setNewBlock(v => ({ ...v, label: e.target.value }))}
          />
          <input type="number" min={0} max={23} className="add-todo-input" style={{ maxWidth: 70 }}
            value={newBlock.start}
            onChange={(e) => setNewBlock(v => ({ ...v, start: Number(e.target.value) }))} />
          <input type="number" min={1} max={24} className="add-todo-input" style={{ maxWidth: 70 }}
            value={newBlock.end}
            onChange={(e) => setNewBlock(v => ({ ...v, end: Number(e.target.value) }))} />
          <button className="add-todo-btn" onClick={addBlock}>+</button>
        </div>
      </div>

      {/* ===== ALTRO / TEMPO X ===== */}
      <div className="project-card">
        <h3 className="title-section" style={{ fontSize: '0.95em' }}>Altro (Tempo X)</h3>
        <div className="list-projects mb-4">
          {routine.extras.map(e => (
            <div key={e.id} className="todo-item">
              <input type="checkbox" className="todo-check" checked={e.done} onChange={() => toggleExtra(e.id)} />
              <span className={`todo-text${e.done ? ' done' : ''}`}>{e.text}</span>
              <button className="todo-del" onClick={() => removeExtra(e.id)}>×</button>
            </div>
          ))}
          {routine.extras.length === 0 && <div className="todo-empty">Niente in sospeso</div>}
        </div>
        <div className="add-todo-row">
          <input
            className="add-todo-input"
            placeholder="Aggiungi (es. Burocrazia…)"
            value={newExtra}
            onChange={(e) => setNewExtra(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExtra()}
          />
          <button className="add-todo-btn" onClick={addExtra}>+</button>
        </div>
      </div>
    </div>
  )
}

export default RoutineView
