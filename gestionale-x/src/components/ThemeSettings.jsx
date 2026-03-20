import { useTheme } from '../ThemeContext'

const ThemeSettings = () => {
  const { currentTheme, changeTheme, themes, setShowThemeSettings } = useTheme()

  const themeKeys = Object.keys(themes)

  return (
    <div className="form-modal" onClick={(e) => e.target === e.currentTarget && setShowThemeSettings(false)}>
      <div className="theme-settings-modal">
        <div className="form-header">
          <h2>🎨 Impostazioni Tema</h2>
          <button onClick={() => setShowThemeSettings(false)} className="close-button">×</button>
        </div>

        <div className="theme-settings-body">
          <p className="theme-settings-description">
            Scegli il tema che preferisci. La tua scelta viene salvata automaticamente.
          </p>

          <div className="theme-settings-grid">
            {themeKeys.map((key) => {
              const theme = themes[key]
              const isActive = currentTheme === key
              return (
                <button
                  key={key}
                  className={`theme-settings-card ${isActive ? 'active' : ''}`}
                  onClick={() => changeTheme(key)}
                >
                  <div className="theme-card-preview">
                    <div className="theme-card-preview-header" style={{ background: theme.preview[0] }}>
                      <div className="preview-dots">
                        <span style={{ background: theme.preview[2] }}></span>
                        <span style={{ background: theme.preview[2] }}></span>
                        <span style={{ background: theme.preview[2] }}></span>
                      </div>
                    </div>
                    <div className="theme-card-preview-body" style={{ background: theme.preview[3] }}>
                      <div className="preview-line" style={{ background: theme.preview[1], width: '70%' }}></div>
                      <div className="preview-line" style={{ background: theme.preview[1], width: '50%', opacity: 0.5 }}></div>
                      <div className="preview-cards">
                        <div className="preview-mini-card" style={{ background: theme.preview[2], borderLeft: `3px solid ${theme.preview[0]}` }}></div>
                        <div className="preview-mini-card" style={{ background: theme.preview[2], borderLeft: `3px solid ${theme.preview[1]}` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="theme-card-info">
                    <span className="theme-card-icon">{theme.icon}</span>
                    <span className="theme-card-name">{theme.name}</span>
                    {isActive && <span className="theme-card-active-badge">Attivo</span>}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="theme-settings-current">
            <span>Tema attuale:</span>
            <strong>{themes[currentTheme]?.icon} {themes[currentTheme]?.name}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeSettings
