import { useContext } from 'react'
import ThemeContext from './ThemeContext'

// Tema corrente, cambio tema e apertura del pannello impostazioni.
// Vive in un file suo: accanto al contesto il linter lo segnalava, perche'
// un file che esporta qualcosa di simile a un componente non puo'
// esportare anche funzioni senza rompere l'aggiornamento a caldo.
export const useTheme = () => useContext(ThemeContext)
