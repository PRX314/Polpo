import { useEffect, useMemo, useState } from 'react'
import { subscribeToRoutine, saveRoutine } from '../firebaseService'
import { ANTICIPI, daSelect, aSelect, GIORNI as GIORNI_SETT } from '../sveglie'

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

// I blocchi sono nati con ore intere (start: 7). Restano numeri, ma ora possono
// avere anche i minuti (7.5 = 7:30): cosi' i dati gia' salvati continuano a
// valere e non serve nessuna conversione.
const oraDaNumero = (n) => {
  const tot = Math.round((Number(n) || 0) * 60)
  return `${pad(Math.floor(tot / 60))}:${pad(tot % 60)}`
}
const numeroDaOra = (s) => {
  const [h, m] = String(s || '0:0').split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}

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

// Quali giorni della settimana. Vuoto = tutti, come si comportava prima che
// esistesse il campo: i blocchi gia' salvati non cambiano significato.
const SceltaGiorni = ({ value, onChange }) => {
  const tutti = !Array.isArray(value) || value.length === 0
  const toggle = (g) => {
    const attuali = tutti ? [0, 1, 2, 3, 4, 5, 6] : value
    const next = attuali.includes(g) ? attuali.filter(x => x !== g) : [...attuali, g].sort()
    onChange(next.length === 7 ? [] : next)
  }
  return (
    <div className="giorni-scelta">
      {GIORNI_SETT.map(g => (
        <button
          key={g.value}
          type="button"
          className={`giorno-chip${tutti || value.includes(g.value) ? ' attivo' : ''}`}
          onClick={() => toggle(g.value)}
          title={tutti ? 'Tutti i giorni' : undefined}
        >{g.label}</button>
      ))}
    </div>
  )
}

// Ora + anticipo: la coppia che rende una voce capace di suonare.
const Sveglia = ({ time, reminder, onChange, mostraOra = true }) => (
  <>
    {mostraOra && (
      <input
        type="time"
        className="add-todo-input sveglia-ora"
        value={time || ''}
        onChange={(e) => onChange({ time: e.target.value })}
        title="A che ora"
      />
    )}
    <select
      className="add-todo-input sveglia-anticipo"
      value={aSelect(reminder)}
      onChange={(e) => onChange({ reminder: daSelect(e.target.value) })}
      title="Sveglia"
      disabled={mostraOra && !time}
    >
      {ANTICIPI.map(a => (
        <option key={String(a.value)} value={aSelect(a.value)}>{a.label}</option>
      ))}
    </select>
  </>
)

const RoutineView = () => {
  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [newTask, setNewTask] = useState({ name: '', duration: '' })
  const [newExtra, setNewExtra] = useState('')
  const [newBlock, setNewBlock] = useState({ label: '', start: '07:00', end: '08:00' })
  const [editingTasks, setEditingTasks] = useState(false)
  const [editingBlocks, setEditingBlocks] = useState(false)

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

  // ── Attivita' ────────────────────────────────────────────────────────
  const addTask = () => {
    if (!newTask.name.trim()) return
    persist({
      tasks: [...routine.tasks, {
        id: uid(), name: newTask.name.trim(), duration: newTask.duration.trim(),
        time: '', reminder: null, days: []
      }]
    })
    setNewTask({ name: '', duration: '' })
  }

  const patchTask = (id, patch) => persist({
    tasks: routine.tasks.map(t => {
      if (t.id !== id) return t
      const next = { ...t, ...patch }
      // Una sveglia senza orario non saprebbe quando suonare: se l'ora sparisce
      // sparisce anche l'anticipo, cosi' non resta un impegno muto.
      if (patch.time === '') next.reminder = null
      return next
    })
  })

  const removeTask = (id) => persist({ tasks: routine.tasks.filter(t => t.id !== id) })

  // ── Extra ────────────────────────────────────────────────────────────
  const addExtra = () => {
    if (!newExtra.trim()) return
    persist({ extras: [...routine.extras, { id: uid(), text: newExtra.trim(), done: false }] })
    setNewExtra('')
  }

  const toggleExtra = (id) => persist({ extras: routine.extras.map(e => e.id === id ? { ...e, done: !e.done } : e) })
  const removeExtra = (id) => persist({ extras: routine.extras.filter(e => e.id !== id) })

  // ── Blocchi ──────────────────────────────────────────────────────────
  const addBlock = () => {
    const start = numeroDaOra(newBlock.start)
    const end = numeroDaOra(newBlock.end)
    if (!newBlock.label.trim() || end <= start) return
    persist({
      timeBlocks: [...routine.timeBlocks, {
        id: uid(), label: newBlock.label.trim(), start, end, reminder: null, days: []
      }]
    })
    setNewBlock({ label: '', start: '07:00', end: '08:00' })
  }

  const patchBlock = (id, patch) => persist({
    timeBlocks: routine.timeBlocks.map(b => b.id === id ? { ...b, ...patch } : b)
  })

  const removeBlock = (id) => persist({ timeBlocks: routine.timeBlocks.filter(b => b.id !== id) })

  if (loading || !routine) {
    return <div className="empty-state"><p>Caricamento routine…</p></div>
  }

  const axisStart = HOURS[0]
  const axisEnd = HOURS[HOURS.length - 1]
  const axisSpan = axisEnd - axisStart

  const conSveglia = [
    ...routine.tasks.filter(t => t.time && t.reminder !== null && t.reminder !== undefined),
    ...routine.timeBlocks.filter(b => b.reminder !== null && b.reminder !== undefined)
  ].length

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 className="title-section" style={{ marginBottom: 0 }}>🗓️ Ogni Giorno (O.G.)</h2>
        {conSveglia > 0 && (
          <span className="text-meta">⏰ {conSveglia} {conSveglia === 1 ? 'sveglia attiva' : 'sveglie attive'}</span>
        )}
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
            <div key={t.id} className="routine-riga">
              <div className="routine-riga-testa">
                {t.time
                  ? <span className="routine-ora">{t.time}</span>
                  : t.duration ? <span className="tag">{t.duration}</span> : null}
                <span className="routine-nome">{t.name}</span>
                {t.time && t.reminder !== null && t.reminder !== undefined && (
                  <span className="routine-sveglia" title={`Sveglia ${ANTICIPI.find(a => a.value === t.reminder)?.label || ''}`}>⏰</span>
                )}
                {Array.isArray(t.days) && t.days.length > 0 && (
                  <span className="routine-giorni-nota">
                    {t.days.map(d => GIORNI_SETT.find(g => g.value === d)?.label).join('')}
                  </span>
                )}
                {editingTasks && (
                  <button className="todo-del" onClick={() => removeTask(t.id)} title="Rimuovi">×</button>
                )}
              </div>

              {editingTasks && (
                <div className="routine-riga-sveglia">
                  <Sveglia
                    time={t.time}
                    reminder={t.reminder}
                    onChange={(patch) => patchTask(t.id, patch)}
                  />
                  <SceltaGiorni value={t.days} onChange={(days) => patchTask(t.id, { days })} />
                </div>
              )}
            </div>
          ))}
          {routine.tasks.length === 0 && (
            <div className="todo-empty">
              La routine è vuota. Tocca ✏️ Modifica per aggiungere la prima attività.
            </div>
          )}
        </div>

        {editingTasks && (
          <>
            <div className="add-todo-row" style={{ marginBottom: '.5rem' }}>
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
            <p className="form-help" style={{ marginBottom: '1rem' }}>
              Metti un orario a un&apos;attività e scegli l&apos;anticipo: la sveglia suona da sola,
              ogni giorno, anche ad app chiusa. Non suona se hai già spuntato l&apos;attività
              o chiuso la giornata.
            </p>
          </>
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
                  border: isToday ? '2px solid var(--accent,#4f46e5)' : '1px solid var(--border-light, #e5e7eb)',
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
        <div className="flex-between mb-4">
          <h3 className="title-section" style={{ marginBottom: 0, fontSize: '0.95em' }}>Timeline giornata tipo</h3>
          <button className="btn-secondary" onClick={() => setEditingBlocks(v => !v)}>
            {editingBlocks ? 'Fatto' : '✏️ Modifica'}
          </button>
        </div>

        <div style={{ position: 'relative', margin: '1rem 0 0.5rem' }}>
          <div style={{ position: 'relative', height: 2, background: 'var(--border-light,#e5e7eb)' }}>
            {routine.timeBlocks.map(b => (
              <div key={b.id} title={`${b.label}: ${oraDaNumero(b.start)}–${oraDaNumero(b.end)}`}
                style={{
                  position: 'absolute', top: -3,
                  left: `${((b.start - axisStart) / axisSpan) * 100}%`,
                  width: `${((b.end - b.start) / axisSpan) * 100}%`,
                  height: 8, background: 'var(--accent,#4f46e5)', opacity: 0.75, borderRadius: 4
                }} />
            ))}
          </div>
          <div style={{ position: 'relative', height: 30 }}>
            {HOURS.filter(h => (h - axisStart) % 2 === 0 || h === axisEnd).map(h => (
              <span key={h} style={{
                position: 'absolute', left: `${((h - axisStart) / axisSpan) * 100}%`,
                transform: 'translateX(-50%)', fontSize: '0.65rem', color: 'var(--text-secondary,#6b7280)', top: 6
              }}>{h}</span>
            ))}
          </div>
          <div style={{ position: 'relative', height: 20 }}>
            {routine.timeBlocks.map(b => (
              <span key={b.id} style={{
                position: 'absolute',
                left: `${((b.start - axisStart) / axisSpan) * 100}%`,
                width: `${((b.end - b.start) / axisSpan) * 100}%`,
                textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent,#4f46e5)'
              }}>{b.label}</span>
            ))}
          </div>
        </div>

        {editingBlocks ? (
          <>
            <div className="list-projects mb-4">
              {routine.timeBlocks.map(b => (
                <div key={b.id} className="routine-riga">
                  <div className="routine-riga-testa">
                    <span className="routine-nome">{b.label}</span>
                    <input
                      type="time" className="add-todo-input sveglia-ora"
                      value={oraDaNumero(b.start)}
                      onChange={(e) => patchBlock(b.id, { start: numeroDaOra(e.target.value) })}
                    />
                    <input
                      type="time" className="add-todo-input sveglia-ora"
                      value={oraDaNumero(b.end)}
                      onChange={(e) => patchBlock(b.id, { end: numeroDaOra(e.target.value) })}
                    />
                    <button className="todo-del" onClick={() => removeBlock(b.id)} title="Rimuovi">×</button>
                  </div>
                  <div className="routine-riga-sveglia">
                    <Sveglia
                      mostraOra={false}
                      reminder={b.reminder}
                      onChange={(patch) => patchBlock(b.id, patch)}
                    />
                    <SceltaGiorni value={b.days} onChange={(days) => patchBlock(b.id, { days })} />
                  </div>
                </div>
              ))}
            </div>

            <div className="add-todo-row">
              <input
                className="add-todo-input"
                placeholder="Blocco (es. Palestra)"
                value={newBlock.label}
                onChange={(e) => setNewBlock(v => ({ ...v, label: e.target.value }))}
              />
              <input type="time" className="add-todo-input sveglia-ora"
                value={newBlock.start}
                onChange={(e) => setNewBlock(v => ({ ...v, start: e.target.value }))} />
              <input type="time" className="add-todo-input sveglia-ora"
                value={newBlock.end}
                onChange={(e) => setNewBlock(v => ({ ...v, end: e.target.value }))} />
              <button className="add-todo-btn" onClick={addBlock}>+</button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
            {routine.timeBlocks.map(b => (
              <span key={b.id} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {b.label} ({oraDaNumero(b.start)}–{oraDaNumero(b.end)})
                {b.reminder !== null && b.reminder !== undefined && <span title="Sveglia attiva">⏰</span>}
              </span>
            ))}
          </div>
        )}
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
          {routine.extras.length === 0 && <div className="todo-empty">Niente in sospeso. Raro.</div>}
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
