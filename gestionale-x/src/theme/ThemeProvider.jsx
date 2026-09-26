import { useEffect, useState, useCallback } from 'react'
import { ThemeContext } from './themeContext'

// Due temi soli: chiaro e scuro. Senza una scelta salvata segue il sistema.
// Lo script in index.html applica il tema prima del primo disegno, così non
// c'è il lampo bianco all'avvio; qui lo si tiene allineato.
const KEY = 'gestionale-theme'
const COLORS = { light: '#ffffff', dark: '#0a0a0a' }

const systemTheme = () =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const savedTheme = () => {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => savedTheme() || systemTheme())
  const [chosen, setChosen] = useState(() => !!savedTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme])
  }, [theme])

  // Finché l'utente non sceglie, un cambio del tema di sistema si riflette qui
  useEffect(() => {
    if (chosen || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setTheme(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [chosen])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try { localStorage.setItem(KEY, next) } catch { /* storage non disponibile */ }
      return next
    })
    setChosen(true)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
