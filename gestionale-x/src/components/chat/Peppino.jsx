import { useEffect, useRef } from 'react'
import { LATO, creaPeppino } from '../../lib/polpo'

// Peppino, il polpo di lib/polpo.js (lo stesso della finestra sul PC). Nel gestionale è fuori casa: sta
// sempre nella bolla, perché da qui risponde ma non arriva al computer. In `motore` lascia i suoi comandi:
// chi lo usa gli passa il volume del microfono, la voce e il tocco.
const GESTI = { fermo: 'dorme', ascolto: 'ascolta', penso: 'pensa', parlo: 'parla' }

export default function Peppino({ fase, motore }) {
  const ref = useRef(null)

  useEffect(() => {
    const peppino = creaPeppino(ref.current, { bolla: true })
    motore.current = peppino
    return () => { peppino.spegni(); motore.current = null }
  }, [motore])

  useEffect(() => { motore.current?.gesto(GESTI[fase] || 'dorme') }, [fase, motore])

  return <canvas ref={ref} className="peppino" width={LATO} height={LATO} aria-hidden="true" />
}
