import { useState, useMemo } from 'react'

const Calendar = ({ projects, onProjectSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  // Collect all events: project deadlines + todo deadlines
  const events = useMemo(() => {
    const evts = []

    projects.forEach(p => {
      if (p.deadline) {
        evts.push({
          date: p.deadline,
          title: p.name,
          type: 'project-deadline',
          icon: '📁',
          color: '#667eea',
          project: p
        })
      }
      (p.todos || []).forEach(todo => {
        if (todo.deadline && !todo.completed) {
          evts.push({
            date: todo.deadline,
            title: todo.text,
            type: 'todo-deadline',
            icon: '✅',
            color: '#feca57',
            project: p,
            projectName: p.name
          })
        }
      })
    })

    return evts
  }, [projects])

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = {}
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    })
    return map
  }, [events])

  // Upcoming deadlines (next 14 days)
  const upcoming = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const twoWeeks = new Date(now)
    twoWeeks.setDate(twoWeeks.getDate() + 14)

    return events
      .filter(e => {
        const d = new Date(e.date)
        return d >= now && d <= twoWeeks
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [events])

  // Overdue
  const overdue = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return events
      .filter(e => new Date(e.date) < now)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [events])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => setCurrentDate(new Date())

  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
  const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

  // Adjust firstDay for Monday start (0=Mon, 6=Sun)
  const startDay = firstDay === 0 ? 6 : firstDay - 1

  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d)
  }

  const formatDate = (y, m, d) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  const isToday = (day) => {
    return day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  const getDaysUntil = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Oggi'
    if (diff === 1) return 'Domani'
    if (diff < 0) return `${Math.abs(diff)}g fa`
    return `tra ${diff}g`
  }

  return (
    <div className="calendar-container">
      <div className="calendar-layout">
        {/* Calendar Grid */}
        <div className="calendar-main">
          <div className="calendar-header">
            <button className="calendar-nav-btn" onClick={prevMonth}>‹</button>
            <div className="calendar-month-year">
              <span className="calendar-month">{monthNames[month]}</span>
              <span className="calendar-year">{year}</span>
            </div>
            <button className="calendar-today-btn" onClick={goToday}>Oggi</button>
            <button className="calendar-nav-btn" onClick={nextMonth}>›</button>
          </div>

          <div className="calendar-grid">
            {dayNames.map(d => (
              <div key={d} className="calendar-day-name">{d}</div>
            ))}
            {days.map((day, i) => {
              const dateStr = day ? formatDate(year, month, day) : null
              const dayEvents = dateStr ? (eventsByDate[dateStr] || []) : []
              return (
                <div
                  key={i}
                  className={`calendar-cell ${!day ? 'empty' : ''} ${isToday(day) ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                >
                  {day && (
                    <>
                      <span className="calendar-day-number">{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="calendar-cell-events">
                          {dayEvents.slice(0, 2).map((e, j) => (
                            <div
                              key={j}
                              className="calendar-event-dot"
                              title={e.title}
                              style={{ background: e.color }}
                              onClick={() => e.project && onProjectSelect(e.project)}
                            ></div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="calendar-event-more">+{dayEvents.length - 2}</span>
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

        {/* Sidebar: Upcoming & Overdue */}
        <div className="calendar-sidebar">
          {overdue.length > 0 && (
            <div className="calendar-section">
              <h3 className="calendar-section-title overdue-title">⚠️ Scaduti ({overdue.length})</h3>
              <div className="calendar-event-list">
                {overdue.slice(0, 5).map((e, i) => (
                  <div
                    key={i}
                    className="calendar-event-item overdue"
                    onClick={() => e.project && onProjectSelect(e.project)}
                  >
                    <span className="calendar-event-icon">{e.icon}</span>
                    <div className="calendar-event-info">
                      <div className="calendar-event-name">{e.title}</div>
                      {e.projectName && <div className="calendar-event-project">{e.projectName}</div>}
                    </div>
                    <span className="calendar-event-date">{getDaysUntil(e.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="calendar-section">
            <h3 className="calendar-section-title">📅 Prossime Scadenze</h3>
            {upcoming.length > 0 ? (
              <div className="calendar-event-list">
                {upcoming.map((e, i) => (
                  <div
                    key={i}
                    className="calendar-event-item"
                    onClick={() => e.project && onProjectSelect(e.project)}
                  >
                    <span className="calendar-event-icon">{e.icon}</span>
                    <div className="calendar-event-info">
                      <div className="calendar-event-name">{e.title}</div>
                      {e.projectName && <div className="calendar-event-project">{e.projectName}</div>}
                    </div>
                    <span className="calendar-event-date">{getDaysUntil(e.date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="calendar-empty">Nessuna scadenza nei prossimi 14 giorni</div>
            )}
          </div>

          {events.length === 0 && (
            <div className="calendar-empty-state">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              <p>Nessuna scadenza impostata</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Aggiungi una scadenza ai tuoi progetti o task per vederli qui</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Calendar
