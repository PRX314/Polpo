import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlarmClock, CalendarPlus, Check, ChevronLeft, ChevronRight, ExternalLink, Plus, X } from 'lucide-react'
import EventForm from '../components/EventForm'
import AdminForm from '../components/AdminForm'
import { useData } from '../context/useData'
import { useToast } from '../context/useToast'
import { addEvent, updateEvent, deleteEvent, saveRoutine } from '../firebaseService'
import { etichettaAnticipo } from '../sveglie'
import { hourToTime, isoOf, longDate, oggiIso, addDaysIso, relativeDay, shortDate, toIso } from '../lib/dates'
import {
  AREE, GENERALI, SCADENZARIO, caricaFestivita, euro, generaliAccese, generaliTra, icsDaScadenze,
  nextOccurrence, occurrences, prossimaGenerale, rigaIcsPersonale, righeIcsGenerali, ripetiLabel
} from '../lib/amministrativa'
import { documentDeadlines, download } from '../services/localDocuments'
import './CalendarPage.css'

const STATUS_CYCLE = ['pending', 'done', 'skip']
const STATUS_LABEL = { pending: 'Da fare', done: 'Fatta', skip: 'Saltata' }
const STATUS_GLYPH = { pending: '○', done: '✓', skip: '—' }
const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const KIND = { documento: 'k-deadline', appuntamento: 'k-event', 'project-deadline': 'k-deadline', 'todo-deadline': 'k-todo', admin: 'k-admin', generale: 'k-general', festivo: 'k-holiday' }
const KIND_LABEL = { documento: 'Documento locale', appuntamento: 'Appuntamento', 'project-deadline': 'Scadenza di un elemento', 'todo-deadline': 'Cosa da fare', admin: 'Scadenza amministrativa', generale: 'Scadenza generale', festivo: 'Festa' }
const LEGENDA = {
  tutto: ['appuntamento', 'project-deadline', 'todo-deadline', 'documento', 'admin'],
  amministrativa: ['admin', 'documento', 'generale', 'festivo']
}
const FINESTRA = { tutto: 14, amministrativa: 90 }
const VISTA_KEY = 'gx-calendario-vista'

const vistaSalvata = () => {
  try { return localStorage.getItem(VISTA_KEY) === 'amministrativa' ? 'amministrativa' : 'tutto' } catch { return 'tutto' }
}

const scaricaIcs = (righe, nome) => download(new Blob([icsDaScadenze(righe)], { type: 'text/calendar;charset=utf-8' }), nome)

const CalendarPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { projects, events, routine, documents } = useData()
  const [current, setCurrent] = useState(() => new Date())
  const [selected, setSelected] = useState(() => oggiIso())
  const [eventForm, setEventForm] = useState(null)
  const [adminForm, setAdminForm] = useState(null)
  const [vista, setVista] = useState(vistaSalvata)
  const [festivita, setFestivita] = useState({})

  const admin = vista === 'amministrativa'
  const cambiaVista = (v) => {
    setVista(v)
    try { localStorage.setItem(VISTA_KEY, v) } catch { /* resta solo per questa visita */ }
  }

  const year = current.getFullYear()
  const month = current.getMonth()
  const today = oggiIso()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Intervallo da calcolare: il mese visibile più la finestra delle prossime scadenze
  const from = useMemo(() => [isoOf(year, month, 1), today].sort()[0], [year, month, today])
  const to = useMemo(() => [isoOf(year, month, daysInMonth), addDaysIso(FINESTRA[vista])].sort()[1], [year, month, daysInMonth, vista])

  // Festività degli anni in vista, una volta per anno
  const richieste = useRef(new Set())
  useEffect(() => {
    [Number(from.slice(0, 4)), Number(to.slice(0, 4))].forEach(y => {
      if (richieste.current.has(y)) return
      richieste.current.add(y)
      caricaFestivita(y).then(rows => setFestivita(f => ({ ...f, [y]: rows })))
    })
  }, [from, to])

  const festivi = useMemo(() => {
    const m = new Map()
    Object.values(festivita).flat().forEach(h => m.set(h.date, h.nome))
    return m
  }, [festivita])
  const festiviSet = useMemo(() => new Set(festivi.keys()), [festivi])
  const scelte = useMemo(() => routine?.amministrativa?.generali || {}, [routine])

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

  const adminEvents = useMemo(() => events.filter(e => e.admin && !e.done), [events])

  // Una scadenza che si ripete compare in tutte le sue volte; solo la prima si può segnare fatta
  const adminEntries = useMemo(() => adminEvents.flatMap(e => {
    const dates = occurrences(e, from, to)
    if (e.date < from) dates.unshift(e.date)
    return dates.map(d => ({ date: d, time: '', reminder: null, title: e.title, type: 'admin', evento: e, futura: d !== e.date, amount: e.amount, projectName: AREE[e.area] }))
  }), [adminEvents, from, to])

  const entries = useMemo(() => {
    if (admin) return [
      ...documentDeadlines(documents),
      ...adminEntries,
      ...generaliTra(scelte, from, to, festiviSet).map(({ date, generale }) => ({ date, time: '', reminder: null, title: generale.titolo, type: 'generale', generale })),
      ...[...festivi].filter(([d]) => d >= from && d <= to).map(([date, nome]) => ({ date, time: '', reminder: null, title: nome, type: 'festivo' }))
    ]
    return [
      ...deadlines,
      ...documentDeadlines(documents),
      ...events.filter(e => !e.admin).map(e => ({ date: e.date, time: e.time || '', reminder: e.reminder ?? null, title: e.title, type: 'appuntamento', evento: e })),
      ...adminEntries
    ]
  }, [admin, deadlines, events, documents, adminEntries, scelte, from, to, festivi, festiviSet])

  const byDate = useMemo(() => {
    const m = {}
    entries.forEach(v => { (m[v.date] ||= []).push(v) })
    for (const k in m) m[k].sort((a, b) => (a.time || '99').localeCompare(b.time || '99'))
    return m
  }, [entries])

  const upcoming = useMemo(() => {
    const limit = addDaysIso(FINESTRA[vista])
    return entries.filter(v => v.type !== 'festivo' && v.date >= today && v.date <= limit).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))
  }, [entries, today, vista])
  const overdue = useMemo(() => entries.filter(v => v.date < today && !v.futura && v.type !== 'generale' && v.type !== 'festivo').sort((a, b) => b.date.localeCompare(a.date)), [entries, today])
  const daPagare = useMemo(() => upcoming.reduce((n, v) => n + (Number(v.amount) || 0), 0), [upcoming])

  // ── Routine ──
  const tasks = admin ? [] : (routine?.tasks || [])
  const blocks = admin ? [] : (routine?.timeBlocks || [])
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

  // ── Amministrativa ──
  const toggleGenerale = (g, on) => {
    saveRoutine({ amministrativa: { generali: { ...scelte, [g.id]: !on } } }).catch(() => toast.err('Non sono riuscito a salvare la scelta'))
  }

  // Fatta o pagata: la ricorrenza sposta la data alla volta dopo, le altre spariscono dal calendario
  const segnaFatta = async (e) => {
    const history = [...(e.history || []), { date: e.date, doneAt: new Date().toISOString() }].slice(-50)
    const next = nextOccurrence(e)
    try {
      await updateEvent(e.id, next ? { date: next, history } : { done: true, history })
      toast.ok(next ? `Segnata. Prossima volta: ${shortDate(next)} ${next.slice(0, 4)}` : 'Segnata come fatta')
    } catch {
      toast.err('Non sono riuscito a segnarla')
    }
  }

  const tuttoAlCalendario = () => {
    const finoA = addDaysIso(365)
    scaricaIcs([...adminEvents.map(rigaIcsPersonale), ...righeIcsGenerali(scelte, today, finoA, festiviSet)], 'scadenze-amministrative.ics')
  }

  // ── Griglia del mese (settimana da lunedì) ──
  const firstDay = new Date(year, month, 1).getDay()
  const lead = firstDay === 0 ? 6 : firstDay - 1
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
    else if (v.type === 'admin') setAdminForm({ scadenza: v.evento })
    else if (v.evento) setEventForm({ evento: v.evento, data: v.date })
    else if (v.project) navigate(`/elementi/${v.project.id}`)
    else { goTo(new Date(`${v.date}T00:00:00`)) }
  }

  const saveEvent = async (data) => {
    if (eventForm?.evento) await updateEvent(eventForm.evento.id, data)
    else await addEvent(data)
  }
  const saveAdmin = async (data) => {
    if (adminForm?.scadenza) await updateEvent(adminForm.scadenza.id, data)
    else await addEvent(data)
  }

  const EntryLine = ({ v, showDate }) => (
    <button className="cal-entry" onClick={() => openEntry(v)}>
      <span className={`cal-kind ${KIND[v.type]}`} aria-hidden="true" />
      <span className="grow">
        <span className="cal-entry-title">{v.title}</span>
        {(v.projectName || v.time) && <span className="small faint"> {v.projectName}{v.time ? ` · ${v.time}` : ''}</span>}
      </span>
      {v.amount ? <span className="small cal-amount">{euro(v.amount)}</span> : null}
      {showDate && <span className="small muted">{relativeDay(v.date).text}</span>}
    </button>
  )

  // Nel giorno selezionato: scadenza personale con "fatta" e "al calendario", generale con la sua nota
  const AdminDetail = ({ v }) => {
    if (v.type === 'generale') return (
      <div className="cal-admin">
        <EntryLine v={v} />
        <p className="small muted">{v.generale.nota}</p>
        {v.generale.slitta && <a className="small cal-link" href={SCADENZARIO} target="_blank" rel="noreferrer">Verifica proroghe sullo scadenzario <ExternalLink size={12} /></a>}
      </div>
    )
    if (v.type !== 'admin') return <EntryLine v={v} />
    const e = v.evento
    return (
      <div className="cal-admin">
        <EntryLine v={v} />
        <p className="small muted">
          {[ripetiLabel(e), e.notes].filter(Boolean).join(' · ') || 'Una volta sola'}
          {v.futura && ` · prima c'è quella del ${shortDate(e.date)}`}
        </p>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {!v.futura && <button className="btn btn-sm" onClick={() => segnaFatta(e)}><Check size={14} /> {e.amount ? 'Pagata' : 'Fatta'}</button>}
          <button className="btn btn-sm" onClick={() => scaricaIcs([rigaIcsPersonale(e)], `${e.title.replace(/[^\w\- ]+/g, '').trim() || 'scadenza'}.ics`)}><CalendarPlus size={14} /> Aggiungi al calendario</button>
        </div>
      </div>
    )
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>{MESI[month]} {year}</h1>
          <p className="sub">
            {admin
              ? (upcoming.length ? `${upcoming.length} scadenze nei prossimi 90 giorni${daPagare ? ` · ${euro(daPagare)} da pagare` : ''}` : 'Niente di amministrativo nei prossimi 90 giorni')
              : (upcoming.length ? `${upcoming.length} in arrivo nelle prossime due settimane` : 'Due settimane sgombre')}
          </p>
        </div>
        <div className="page-actions">
          <div className="seg" role="group" aria-label="Vista del calendario">
            <button style={{ width: 'auto', padding: '0 12px' }} className={!admin ? 'is-on' : ''} aria-pressed={!admin} onClick={() => cambiaVista('tutto')}>Tutto</button>
            <button style={{ width: 'auto', padding: '0 12px' }} className={admin ? 'is-on' : ''} aria-pressed={admin} onClick={() => cambiaVista('amministrativa')}>Amministrativa</button>
          </div>
          <div className="seg">
            <button onClick={() => goTo(new Date(year, month - 1, 1))} aria-label="Mese precedente"><ChevronLeft size={16} /></button>
            <button style={{ width: 'auto', padding: '0 12px' }} onClick={() => goTo(new Date())}>Oggi</button>
            <button onClick={() => goTo(new Date(year, month + 1, 1))} aria-label="Mese successivo"><ChevronRight size={16} /></button>
          </div>
          {admin
            ? <button className="btn btn-primary" onClick={() => setAdminForm({ data: selected || today })}><Plus size={15} /> Scadenza</button>
            : <button className="btn btn-primary" onClick={() => setEventForm({ data: selected || today })}><Plus size={15} /> Appuntamento</button>}
        </div>
      </div>

      <div className={`cal-layout ${admin ? 'is-admin' : ''}`}>
        <div>
          <div className="cal-grid" role="grid" aria-label={`${MESI[month]} ${year}${admin ? ', vista amministrativa' : ''}`}>
            {GIORNI.map(d => <div key={d} className="cal-dow" role="columnheader">{d}</div>)}
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="cal-cell is-empty" role="gridcell" />
              const iso = isoOf(year, month, day)
              const list = byDate[iso] || []
              const st = dayStatus(iso)
              const n = doneCount(iso)
              const festa = festivi.get(iso)
              return (
                <button
                  key={i} role="gridcell" onClick={() => setSelected(iso)}
                  className={`cal-cell ${iso === today ? 'is-today' : ''} ${iso === selected ? 'is-selected' : ''} ${festa ? 'is-holiday' : ''}`}
                  title={festa || undefined}
                  aria-label={`${day} ${MESI[month]}${festa ? `, ${festa}` : ''}${list.length ? `, ${list.length} voci` : ''}`} aria-pressed={iso === selected}
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
            {LEGENDA[vista].map(k => <span key={k}><span className={`cal-kind ${KIND[k]}`} aria-hidden="true" /> {KIND_LABEL[k]}</span>)}
          </div>
        </div>

        <div className="stack">
          {selected && (
            <section className="card cal-day">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <h2 className="grow" style={{ textTransform: 'capitalize' }}>{longDate(selected)}</h2>
                <button className="btn-icon sm" onClick={() => (admin ? setAdminForm({ data: selected }) : setEventForm({ data: selected }))} aria-label={admin ? 'Nuova scadenza in questo giorno' : 'Nuovo appuntamento in questo giorno'}><Plus size={16} /></button>
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
                  <p className="cal-label">{admin ? 'Da fare in questo giorno' : 'Senza orario'}</p>
                  {untimed.map((v, i) => (admin || v.type === 'admin' ? <AdminDetail key={i} v={v} /> : <EntryLine key={i} v={v} />))}
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
                <p className="small muted">{admin ? 'Niente di amministrativo. Usa + per aggiungere una scadenza.' : 'Giornata libera. Usa + per aggiungere un appuntamento.'}</p>
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
            <h2 className="cal-head"><span>{admin ? 'Prossimi 90 giorni' : 'Prossime scadenze'}</span>{admin && daPagare > 0 && <span>{euro(daPagare)}</span>}</h2>
            {upcoming.length > 0
              ? upcoming.map((v, i) => <EntryLine key={i} v={v} showDate />)
              : <p className="small muted" style={{ padding: 12 }}>{admin ? 'Nessuna scadenza nei prossimi 90 giorni.' : 'Nessuna scadenza nelle prossime due settimane.'}</p>}
          </section>

          {admin && (
            <section className="card card-flush">
              <h2 className="cal-head"><span>Scadenze generali</span> <span className="count ghost">{generaliAccese(scelte).length}</span></h2>
              <div className="cal-generali">
                <p className="small muted">Uguali per tutti, ogni anno. Accendi solo quelle che ti riguardano.</p>
                {GENERALI.map(g => {
                  const on = generaliAccese(scelte).includes(g)
                  const quando = prossimaGenerale(g, today, festiviSet)
                  return (
                    <label key={g.id} className="cal-task" title={g.nota}>
                      <input type="checkbox" checked={on} onChange={() => toggleGenerale(g, on)} />
                      <span className="grow">{g.titolo}</span>
                      {quando && <span className="small faint">{shortDate(quando)}</span>}
                    </label>
                  )
                })}
                <a className="small cal-link" href={SCADENZARIO} target="_blank" rel="noreferrer">Le date fiscali possono slittare: scadenzario ufficiale <ExternalLink size={12} /></a>
                <button className="btn btn-sm" onClick={tuttoAlCalendario}><CalendarPlus size={14} /> Tutto nel calendario dell'iPhone</button>
                <p className="help">Scarica un file con le tue scadenze e le generali dei prossimi 12 mesi: aprilo e scegli «Aggiungi tutto». Gli avvisi poi li manda il telefono.</p>
              </div>
            </section>
          )}
        </div>
      </div>

      {eventForm && (
        <EventForm evento={eventForm.evento} data={eventForm.data} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setEventForm(null)} />
      )}
      {adminForm && (
        <AdminForm scadenza={adminForm.scadenza} data={adminForm.data} onSave={saveAdmin} onDelete={deleteEvent} onClose={() => setAdminForm(null)} />
      )}
    </div>
  )
}

export default CalendarPage
