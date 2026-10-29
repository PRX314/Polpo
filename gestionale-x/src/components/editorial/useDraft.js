import { useState } from 'react'

// Chiave comprensiva di utente e lavoro. Scrittura durante la digitazione:
// cambiare pagina, ricaricare o perdere la rete non cancella il testo.
export function useDraft(key, initial) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial } catch { return initial }
  })
  const [storageError, setStorageError] = useState('')
  function change(next) {
    setValue(next)
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageError('') }
    catch { setStorageError('La bozza non può essere salvata su questo dispositivo. Copia il testo prima di uscire.') }
  }
  function clear(next = initial) {
    setValue(next)
    try { localStorage.removeItem(key) } catch { /* Il testo rimane in memoria. */ }
  }
  return [value, change, clear, storageError]
}
