import { useState, useEffect } from 'react'
import ThemeContext, { THEMES } from './ThemeContext'

// Applica il tema scelto scrivendo le variabili CSS su :root e lo ricorda
// in localStorage. Sta in un file suo perche' un file che esporta un
// componente non puo' esportare anche hook e costanti senza far ricaricare
// l'intera pagina a ogni modifica durante lo sviluppo.
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('gestionale-theme') || 'polpo'
  })
  const [showThemeSettings, setShowThemeSettings] = useState(false)

  useEffect(() => {
    const theme = THEMES[currentTheme]
    if (!theme) return

    const root = document.documentElement
    Object.entries(theme.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    localStorage.setItem('gestionale-theme', currentTheme)
  }, [currentTheme])

  const changeTheme = (themeId) => {
    if (THEMES[themeId]) {
      setCurrentTheme(themeId)
    }
  }

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      changeTheme,
      themes: THEMES,
      showThemeSettings,
      setShowThemeSettings
    }}>
      {children}
    </ThemeContext.Provider>
  )
}
