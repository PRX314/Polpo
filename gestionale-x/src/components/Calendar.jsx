import { useState, useMemo, useEffect } from 'react'
import {
  subscribeToRoutine, saveRoutine,
  subscribeToEvents, addEvent, updateEvent, deleteEvent
} from '../firebaseService'
import EventForm from './EventForm'
import { etichettaAnticipo } from '../sveglie'

const STATUS_CYCLE = ['pending', 'done', 'skip']
const STATUS_ICON = { pending: '○', done: '✓', skip: '—' }
const STATUS_LABEL = { pending: 'Da fare', done: 'Fatta', skip: 'Saltata' }

const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const COLORE = {
  appuntamento: '#20c997',
  'project-deadline': '#667eea',
  'todo-deadline': '#feca57'
}

const pad = (n) => String(n).padStart(2, '0')
const isoDi = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const oggiIso = () => { const d = new Date(); return isoDi(d.getFullYear(), d.getMonth(), d.getDate()) }

// '7' o 7.5 -> '07:30'. I blocchi della routine sono nati con ore intere:
// il formato vecchio deve continuare a funzionare senza conversioni.
const oraDaNumero = (n) => {
  const tot = Math.round(n * 60)
  return `${pad(Math.floor(tot / 60))}:${pad(tot % 60)}`
}

const Calendar = ({ projects, onProjectSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  // La routine "Ogni Giorno" vive nello stesso documento della sua schermata
  // (routines/{uid}): qui la si legge e si aggiorna, senza duplicare nulla.
  const [routine, setRoutine] = useState(null)
  const [appuntamenti, setAppuntamenti] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [formEvento, setFormEvento] = useState(null)

  useEffect(() => subscribeToRoutine(setRoutine, () => {}), [])
  useEffect(() => subscribeToEvents(setAppuntamenti, () => {}), [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const oggi = oggiIso()

  // Scadenze di progetti e task.
  //
  // Archiviati e completati restano fuori: prima entravano tutti, e il pannello
  // "Scaduti" si riempiva di progetti chiusi da mesi che non erano piu' scaduti
  // di niente.
  const scadenze = useMemo(() => {
    const out = []
    projects
      .filter(p => !p.archived && p.status !== 'completed')
      .forEach(p => {
        if (p.deadline) {
          out.push({
            date: p.deadline, time: p.deadlineTime || '', reminder: p.reminder ?? null,
            title: p.name, type: 'project-deadline', icon: '📁', project: p
          })
        }
        ;(p.todos || []).forEach(todo => {
          if (todo.deadline && !todo.completed) {
            out.push({
              date: todo.deadline, time: todo.time || '', reminder: todo.reminder ?? null,
              title: todo.text, type: 'todo-deadline', icon: '✅',
              project: p, projectName: p.name
            })
          }
        })
      })
    return out
  }, [projects])

  // Tutto quello che compare nel calendario, scadenze e appuntamenti insieme
  const voci = useMemo(() => ([
    ...scadenze,
    ...appuntamenti.map(e => ({
      date: e.date, time: e.time || '', reminder: e.reminder ?? null,
      title: e.title, type: 'appuntamento', icon: '📅', evento: e
    }))
  ]), [scadenze, appuntamenti])

  const perData = useMemo(() => {
    const m = {}
    voci.forEach(v => { (m[v.date] ||= []).push(v) })
    for (const k in m) m[k].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
    return m
  }, [voci])

  const giorniDa = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const diff = Math.round((d - now) / 86400000)
    if (diff === 0) return 'Oggi'
    if (diff === 1) return 'Domani'
    if (diff < 0) return `${Math.abs(diff)}g fa`
    return `tra ${diff}g`
  }

  const inArrivo = useMemo(() => {
    const limite = new Date(); limite.setHours(0, 0, 0, 0)
    limite.setDate(limite.getDate() + 14)
    const limiteIso = isoDi(limite.getFullYear(), limite.getMonth(), limite.getDate())
    return voci.filter(v => v.date >= oggi && v.date <= limiteIso)
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
  }, [voci, oggi])

  const scaduti = useMemo(
    () => voci.filter(v => v.date < oggi).sort((a, b) => b.date.localeCompare(a.date)),
    [voci, oggi]
  )

  // ── Routine del giorno ────────────────────────────────────────────────
  const tasks = routine?.tasks || []
  const blocchi = routine?.timeBlocks || []
  const statoDi = (d) => routine?.weekStatus?.[d] || 'pending'
  /* dayTasks e' un campo nuovo: le spunte per singola attivita' di quel giorno.
     weekStatus resta com'era, cosi' i dati gia' salvati continuano a valere. */
  const spunteDi = (d) => routine?.dayTasks?.[d] || {}
  const fatteDi = (d) => tasks.filter(t => spunteDi(d)[t.id]).length

  const persist = (patch) => {
    const next = { ...(routine || {}), ...patch }
    setRoutine(next)
    // Solo la parte cambiata: salvare il documento intero sovrascriverebbe
    // quello che nel frattempo ha scritto un altro dispositivo.
    saveRoutine(patch).catch(() => {})
  }
  const cambiaStato = (d) => {
    const i = STATUS_CYCLE.indexOf(statoDi(d))
    persist({ weekStatus: { ...(routine?.weekStatus || {}), [d]: STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length] } })
  }
  const spunta = (d, id) => {
    const cur = spunteDi(d)
    persist({ dayTasks: { ...(routine?.dayTasks || {}), [d]: { ...cur, [id]: !cur[id] } } })
  }

  // ── Salvataggio appuntamenti ──────────────────────────────────────────
  const salvaEvento = async (dati) => {
    if (formEvento?.evento) await updateEvent(formEvento.evento.id, dati)
    else await addEvent(dati)
  }

  // ── Griglia del mese ──────────────────────────────────────────────────
  const primoGiorno = new Date(year, month, 1).getDay()
  const inizio = primoGiorno === 0 ? 6 : primoGiorno - 1  // settimana da lunedi
  const quanti = new Date(year, month + 1, 0).getDate()
  const celle = [...Array(inizio).fill(null), ...Array.from({ length: quanti }, (_, i) => i + 1)]

  // ── La giornata selezionata ───────────────────────────────────────────
  const sel = selectedDay
  const selData = sel ? new Date(sel + 'T00:00:00') : null
  const selEtichetta = selData
    ? selData.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    : ''
  const selGiornoSettimana = selData ? selData.getDay() : null

  // Blocchi validi per quel giorno: `days` e' facoltativo, assente = tutti
  const blocchiDelGiorno = blocchi.filter(
    b => !Array.isArray(b.days) || !b.days.length || b.days.includes(selGiornoSettimana)
  )

  // Tutto cio' che ha un orario, in fila dal mattino alla sera. E' la vista che
  // mancava: prima il giorno selezionato mostrava solo elenchi separati.
  const conOrario = sel ? [
    ...blocchiDelGiorno.map(b => ({
      key: `b-${b.id}`, time: oraDaNumero(b.start), fine: oraDaNumero(b.end),
      titolo: b.label, tipo: 'blocco', reminder: b.reminder ?? null
    })),
    ...(perData[sel] || []).filter(v => v.time).map((v, i) => ({
      key: `v-${i}`, time: v.time, fine: v.evento?.endTime || '',
      titolo: v.title, tipo: v.type, voce: v, reminder: v.reminder
    }))
  ].sort((a, b) => a.time.localeCompare(b.time)) : []

  const senzaOrario = sel ? (perData[sel] || []).filter(v => !v.time) : []

  const asseInizio = 6, asseFine = 22, asse = asseFine - asseInizio

  return (
    <div className="calendar-container">
      <div className="calendar-layout">
        {/* ── Griglia del mese ── */}
        <div className="calendar-main">
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>‹</button>
            <div className="calendar-month-year">
              <span className="calendar-month">{MESI[month]}</span>
              <span className="calendar-year">{year}</span>
            </div>
            <button className="calendar-today-btn" onClick={() => { setCurrentDate(new Date()); setSelectedDay(oggi) }}>Oggi</button>
            <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>›</button>
          </div>

          <div className="calendar-grid">
            {GIORNI.map(d => <div key={d} className="calendar-day-name">{d}</div>)}
            {celle.map((day, i) => {
              const iso = day ? isoDi(year, month, day) : null
              const delGiorno = iso ? (perData[iso] || []) : []
              return (
                <div
                  key={i}
                  onClick={() => day && setSelectedDay(iso)}
                  className={`calendar-cell${!day ? ' empty' : ''}${iso === oggi ? ' today' : ''}${delGiorno.length ? ' has-events' : ''}${iso === sel ? ' selected' : ''}`}
                >
                  {day && (
                    <>
                      <span className="calendar-day-number">{day}</span>
                      {/* stato della routine del giorno: un colpo d'occhio sul mese */}
                      {tasks.length > 0 && (() => {
                        const st = statoDi(iso)
                        const n = fatteDi(iso)
                        if (st === 'pending' && n === 0) return null
                        const col = st === 'done' ? '#22c55e' : st === 'skip' ? '#9ca3af' : 'var(--accent,#4f46e5)'
                        return (
                          <span
                            className="calendar-routine-flag"
                            style={{ color: col }}
                            title={`Routine: ${STATUS_LABEL[st]}${n ? ` · ${n}/${tasks.length}` : ''}`}
                          >
                            {st === 'done' ? '✓' : st === 'skip' ? '—' : `${n}/${tasks.length}`}
                          </span>
                        )
                      })()}
                      {delGiorno.length > 0 && (
                        <div className="calendar-cell-events">
                          {delGiorno.slice(0, 3).map((v, j) => (
                            <span key={j} className="calendar-event-dot"
                              title={`${v.time ? v.time + ' · ' : ''}${v.title}`}
                              style={{ background: COLORE[v.type] }} />
                          ))}
                          {delGiorno.length > 3 && (
                            <span className="calendar-event-more">+{delGiorno.length - 3}</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Colonna laterale ── */}
        <div className="calendar-sidebar">
          {sel && (
            <div className="calendar-section">
              <div className="giornata-header">
                <h3 className="calendar-section-title giornata-titolo">🗓️ {selEtichetta}</h3>
                <div className="giornata-azioni">
                  <button className="btn-icon" title="Nuovo appuntamento"
                    onClick={() => setFormEvento({ data: sel })}>+</button>
                  <button className="btn-icon" title="Chiudi" onClick={() => setSelectedDay(null)}>×</button>
                </div>
              </div>

              {tasks.length > 0 && (
                <button className={`giornata-stato giornata-stato-${statoDi(sel)}`} onClick={() => cambiaStato(sel)}>
                  {STATUS_ICON[statoDi(sel)]} Giornata: {STATUS_LABEL[statoDi(sel)]}
                </button>
              )}

              {/* Orari: blocchi, appuntamenti e scadenze con un'ora, in fila */}
              {conOrario.length > 0 && (
                <div className="giornata-orari">
                  {conOrario.map(r => (
                    <div
                      key={r.key}
                      className={`giornata-riga giornata-riga-${r.tipo}`}
                      onClick={() => {
                        if (r.voce?.evento) setFormEvento({ evento: r.voce.evento, data: sel })
                        else if (r.voce?.project) onProjectSelect(r.voce.project)
                      }}
                      style={{ cursor: r.voce ? 'pointer' : 'default' }}
                    >
                      <span className="giornata-ora">{r.time}</span>
                      <span className="giornata-testo">
                        {r.titolo}
                        {r.fine && <span className="giornata-fine"> → {r.fine}</span>}
                      </span>
                      {r.reminder !== null && r.reminder !== undefined && (
                        <span className="giornata-sveglia" title={etichettaAnticipo(r.reminder)}>⏰</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {senzaOrario.length > 0 && (
                <div className="giornata-sezione">
                  <span className="giornata-etichetta">Senza orario</span>
                  {senzaOrario.map((v, i) => (
                    <div key={i} className="giornata-riga"
                      onClick={() => v.evento ? setFormEvento({ evento: v.evento, data: sel }) : v.project && onProjectSelect(v.project)}
                      style={{ cursor: 'pointer' }}>
                      <span className="giornata-icona">{v.icon}</span>
                      <span className="giornata-testo">{v.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {tasks.length > 0 && (
                <div className="giornata-sezione">
                  <span className="giornata-etichetta">Routine</span>
                  {tasks.map(t => {
                    const fatta = !!spunteDi(sel)[t.id]
                    return (
                      <label key={t.id} className={`giornata-task${fatta ? ' fatta' : ''}`}>
                        <input type="checkbox" checked={fatta} onChange={() => spunta(sel, t.id)} />
                        <span className="giornata-testo">{t.name}</span>
                        {t.time && <span className="giornata-ora-task">{t.time}</span>}
                        {!t.time && t.duration && <span className="giornata-durata">{t.duration}</span>}
                        {t.time && t.reminder !== null && t.reminder !== undefined && (
                          <span className="giornata-sveglia" title={etichettaAnticipo(t.reminder)}>⏰</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}

              {blocchiDelGiorno.length > 0 && (
                <div className="giornata-barra">
                  <div className="giornata-barra-fondo">
                    {blocchiDelGiorno.map(b => (
                      <div key={b.id} title={`${b.label}: ${oraDaNumero(b.start)}–${oraDaNumero(b.end)}`}
                        className="giornata-barra-blocco"
                        style={{
                          left: `${((b.start - asseInizio) / asse) * 100}%`,
                          width: `${((b.end - b.start) / asse) * 100}%`
                        }} />
                    ))}
                  </div>
                  <div className="giornata-barra-ore">
                    {[6, 10, 14, 18, 22].map(h => (
                      <span key={h} style={{ left: `${((h - asseInizio) / asse) * 100}%` }}>{h}</span>
                    ))}
                  </div>
                </div>
              )}

              {conOrario.length === 0 && senzaOrario.length === 0 && tasks.length === 0 && (
                <div className="calendar-empty">Giornata libera. Usa + per aggiungere un appuntamento.</div>
              )}
            </div>
          )}

          {scaduti.length > 0 && (
            <div className="calendar-section">
              <h3 className="calendar-section-title overdue-title">⚠️ Scaduti ({scaduti.length})</h3>
              <div className="calendar-event-list">
                {scaduti.slice(0, 5).map((v, i) => (
                  <div key={i} className="calendar-event-item overdue"
                    onClick={() => v.evento ? setFormEvento({ evento: v.evento, data: v.date }) : v.project && onProjectSelect(v.project)}>
                    <span className="calendar-event-icon">{v.icon}</span>
                    <div className="calendar-event-info">
                      <div className="calendar-event-name">{v.title}</div>
                      {v.projectName && <div className="calendar-event-project">{v.projectName}</div>}
                    </div>
                    <span className="calendar-event-date">{giorniDa(v.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="calendar-section">
            <h3 className="calendar-section-title">📅 Prossime Scadenze</h3>
            {inArrivo.length > 0 ? (
              <div className="calendar-event-list">
                {inArrivo.map((v, i) => (
                  <div key={i} className="calendar-event-item"
                    onClick={() => v.evento ? setFormEvento({ evento: v.evento, data: v.date }) : v.project && onProjectSelect(v.project)}>
                    <span className="calendar-event-icon">{v.icon}</span>
                    <div className="calendar-event-info">
                      <div className="calendar-event-name">{v.title}</div>
                      {v.projectName && <div className="calendar-event-project">{v.projectName}</div>}
                      {v.time && <div className="calendar-event-project">alle {v.time}</div>}
                    </div>
                    <span className="calendar-event-date">{giorniDa(v.date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="calendar-empty">Due settimane sgombre</div>
            )}
          </div>

          {voci.length === 0 && (
            <div className="calendar-empty-state">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              <p>Nessun appuntamento né scadenza</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Tocca un giorno e poi + per aggiungere un appuntamento con la sua sveglia
              </p>
            </div>
          )}
        </div>
      </div>

      {formEvento && (
        <EventForm
          evento={formEvento.evento}
          data={formEvento.data}
          onSave={salvaEvento}
          onDelete={deleteEvent}
          onClose={() => setFormEvento(null)}
        />
      )}
    </div>
  )
}

export default Calendar
