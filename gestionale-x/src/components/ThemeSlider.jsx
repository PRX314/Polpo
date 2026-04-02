import { useTheme } from '../ThemeContext'

const ThemeSlider = () => {
  const { currentTheme, themes, setShowThemeSettings } = useTheme()
  const theme = themes[currentTheme]

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => setShowThemeSettings(true)}
      title={`Tema: ${theme?.name || 'Default'}`}
    >
      {theme?.icon || '🎨'}
    </button>
  )
}

export default ThemeSlider
