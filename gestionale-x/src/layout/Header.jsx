import { Link } from 'react-router-dom'
import { Bell, Sun, Moon, LogOut, Lock, BookOpen } from 'lucide-react'
import GlobalSearch from './GlobalSearch'
import Menu from '../components/ui/Menu'
import { useTheme } from '../theme/useTheme'

const Header = ({ user, pushActive, onNotifications, onPassword, onLogout, onImport }) => {
  const { theme, toggleTheme } = useTheme()
  const name = user.displayName || user.email || 'Utente'
  const initial = (name[0] || '?').toUpperCase()

  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="Polpo, vai a Oggi">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Polpo</span>
      </Link>

      <GlobalSearch />

      <div className="topbar-actions">
        <button
          className="btn-icon" onClick={onNotifications}
          aria-label={pushActive === false ? 'Notifiche non attive: attivale' : 'Notifiche'}
          title={pushActive === false ? 'Notifiche non attive' : 'Notifiche attive'}
        >
          <Bell size={18} />
          {pushActive === false && <span className="dot-pending" aria-hidden="true" />}
        </button>
        <button
          className="btn-icon" onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Menu
          label="Menu utente"
          trigger={<span className="avatar" aria-hidden="true">{initial}</span>}
          items={[
            { header: name },
            { label: 'Notifiche', icon: Bell, onClick: onNotifications },
            { label: 'Cambia password', icon: Lock, onClick: onPassword },
            { label: 'Importa dal vault', icon: BookOpen, onClick: onImport },
            'sep',
            { label: 'Esci', icon: LogOut, onClick: onLogout }
          ]}
        />
      </div>
    </header>
  )
}

export default Header
