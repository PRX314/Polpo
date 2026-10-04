import { NavLink, Outlet } from 'react-router-dom'
import { House, FileText, Folder, ListChecks, Calendar, Repeat, MessageSquare } from 'lucide-react'

const SECTIONS = [
  { to: '/', label: 'Oggi', icon: House, end: true },
  { to: '/elementi', label: 'Elementi', icon: Folder },
  { to: '/da-fare', label: 'Da fare', icon: ListChecks },
  { to: '/calendario', label: 'Calendario', icon: Calendar, short: 'Agenda' },
  { to: '/routine', label: 'Routine', icon: Repeat },
  { to: '/documenti', label: 'Documenti', short: 'File', icon: FileText },
  { to: '/ai', label: 'Polpo AI', icon: MessageSquare, short: 'AI' }
]

const Shell = ({ header }) => (
  <div className="shell">
    <a href="#main" className="skip-link">Vai al contenuto</a>
    <div className="chrome">
      {header}
      <nav className="tabs" aria-label="Sezioni">
        {SECTIONS.map(s => (
          <NavLink key={s.to} to={s.to} end={s.end} className={({ isActive }) => `tab ${isActive ? 'is-active' : ''}`}>
            {s.label}
          </NavLink>
        ))}
      </nav>
    </div>

    <main id="main" className="main">
      <Outlet />
    </main>

    <nav className="bottomnav" aria-label="Sezioni">
      {SECTIONS.map(s => {
        const Icon = s.icon
        return (
          <NavLink key={s.to} to={s.to} end={s.end} className={({ isActive }) => `bottomnav-item ${isActive ? 'is-active' : ''}`}>
            <Icon size={20} aria-hidden="true" />
            <span>{s.short || s.label}</span>
          </NavLink>
        )
      })}
    </nav>
  </div>
)

export default Shell
