import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { House, Folder, HeartPulse, MessageSquare } from 'lucide-react'

// Quattro sezioni (decise il 2026-10-04): prima erano sette, e Oggi, Da fare, Calendario e
// Routine mostravano in buona parte le stesse cose.
//   Oggi      cosa conta oggi e questa settimana
//   Progetti  elenco e cose da fare dei progetti (roadmap dal vault comprese)
//   Vita      agenda, documenti, routine: le cose personali con una data
//   Polpo     la chat
// Le pagine di prima restano ai loro indirizzi: Progetti e Vita le raggruppano con una barra
// di sotto-sezioni, così i link già esistenti (anche nelle chat salvate) continuano a funzionare.
const SECTIONS = [
  { to: '/', label: 'Oggi', icon: House, match: (p) => p === '/' },
  {
    to: '/elementi', label: 'Progetti', icon: Folder,
    match: (p) => p.startsWith('/elementi') || p.startsWith('/da-fare'),
    sub: [
      { to: '/elementi', label: 'Elenco', match: (p) => p.startsWith('/elementi') },
      { to: '/da-fare', label: 'Cose da fare', match: (p) => p.startsWith('/da-fare') }
    ]
  },
  {
    to: '/calendario', label: 'Vita', icon: HeartPulse,
    match: (p) => ['/calendario', '/documenti', '/routine'].some(x => p.startsWith(x)),
    sub: [
      { to: '/calendario', label: 'Agenda', match: (p) => p.startsWith('/calendario') },
      { to: '/documenti', label: 'Documenti', match: (p) => p.startsWith('/documenti') },
      { to: '/routine', label: 'Routine', match: (p) => p.startsWith('/routine') }
    ]
  },
  { to: '/ai', label: 'Polpo', icon: MessageSquare, match: (p) => p.startsWith('/ai') }
]

const Shell = ({ header }) => {
  const { pathname } = useLocation()
  const attiva = SECTIONS.find(s => s.match(pathname))

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Vai al contenuto</a>
      <div className="chrome">
        {header}
        <nav className="tabs" aria-label="Sezioni">
          {SECTIONS.map(s => (
            <NavLink key={s.to} to={s.to} className={`tab ${s === attiva ? 'is-active' : ''}`} aria-current={s === attiva ? 'page' : undefined}>
              {s.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <main id="main" className="main">
        {attiva?.sub && (
          <nav className="subnav chips" aria-label={`Sottosezioni di ${attiva.label}`}>
            {attiva.sub.map(s => (
              <NavLink key={s.to} to={s.to} className={`chip ${s.match(pathname) ? 'is-active' : ''}`} aria-current={s.match(pathname) ? 'page' : undefined}>
                {s.label}
              </NavLink>
            ))}
          </nav>
        )}
        <Outlet />
      </main>

      <nav className="bottomnav" aria-label="Sezioni">
        {SECTIONS.map(s => {
          const Icon = s.icon
          return (
            <NavLink key={s.to} to={s.to} className={`bottomnav-item ${s === attiva ? 'is-active' : ''}`} aria-current={s === attiva ? 'page' : undefined}>
              <Icon size={20} aria-hidden="true" />
              <span>{s.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export default Shell
