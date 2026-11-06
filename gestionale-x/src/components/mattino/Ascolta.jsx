import { useEffect, useRef, useState } from 'react'
import { Square, Volume2 } from 'lucide-react'
import { Eco } from '../../lib/eco-client'
import { API_URL, parametriVoce } from '../../services/chatService'

// Un bottone che legge un testo con la voce di Peppino, frase per frase, come in Parla.
// Se la voce del server non arriva si passa da soli a quella del browser.
export default function Ascolta({ testo, onErrore }) {
  const [parla, setParla] = useState(false)
  const ecoRef = useRef(null)

  useEffect(() => () => ecoRef.current?.zitto(), [])

  const eco = () => (ecoRef.current ??= new Eco({
    api: API_URL,
    voce: 'server',
    parametriVoce,
    onStato: (s) => setParla(s === 'parlo'),
    onMessaggio: (m) => { if (m.chi === 'errore') onErrore?.(m.testo) }
  }))

  const tocca = () => {
    const e = eco()
    if (parla) return e.zitto()
    e.sblocca() // subito, dentro il tocco: la voce arriva dopo e iPhone la bloccherebbe
    e.parla(testo).catch(() => onErrore?.('La voce non è partita. Riprova.'))
  }

  return (
    <button type="button" className="btn btn-sm" onClick={tocca} aria-label={parla ? 'Ferma Peppino' : 'Ascolta il discorso'}>
      {parla ? <Square size={14} /> : <Volume2 size={14} />} {parla ? 'Ferma' : 'Ascolta'}
    </button>
  )
}
