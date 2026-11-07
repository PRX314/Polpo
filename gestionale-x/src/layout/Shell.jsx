import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { SECTIONS } from './sezioni'

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
        {/* Nella chat no: le altre pagine di Peppino stanno nel suo menu, e una barra in meno lascia spazio ai messaggi */}
        {attiva?.sub && !pathname.startsWith('/ai') && (
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
