import { useRef } from 'react'
import { useTheme } from '../ThemeContext'

const ThemeSlider = () => {
  const { currentTheme, changeTheme, themes, setShowThemeSettings } = useTheme()
  const sliderRef = useRef(null)

  const themeKeys = Object.keys(themes)

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = 70
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="theme-slider-wrapper">
      <div className="theme-slider-label">Tema</div>
      <div className="theme-slider-container">
        <button
          className="theme-slider-arrow theme-arrow-left"
          onClick={() => scroll('left')}
          aria-label="Scorri temi a sinistra"
        >
          ‹
        </button>

        <div className="theme-slider-track" ref={sliderRef}>
          {themeKeys.map((key) => {
            const theme = themes[key]
            const isActive = currentTheme === key
            return (
              <button
                key={key}
                className={`theme-slider-item ${isActive ? 'active' : ''}`}
                onClick={() => changeTheme(key)}
                title={theme.name}
                aria-label={`Tema ${theme.name}`}
              >
                <div className="theme-slider-preview">
                  {theme.preview.map((color, i) => (
                    <div
                      key={i}
                      className="theme-preview-segment"
                      style={{ background: color }}
                    />
                  ))}
                </div>
                <span className="theme-slider-icon">{theme.icon}</span>
              </button>
            )
          })}
        </div>

        <button
          className="theme-slider-arrow theme-arrow-right"
          onClick={() => scroll('right')}
          aria-label="Scorri temi a destra"
        >
          ›
        </button>

        <button
          className="theme-settings-gear"
          onClick={() => setShowThemeSettings(true)}
          title="Impostazioni tema"
          aria-label="Apri impostazioni tema"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ThemeSlider
