import { useEffect, useRef } from 'react'
import { STATI, sprite, bolla } from '../../lib/polpo'

// Peppino, il polpo disegnato da lib/polpo.js (lo stesso della finestra sul PC). Nel gestionale è
// fuori casa: sta sempre nella bolla, perché da qui risponde ma non arriva al computer.
const GESTI = { fermo: 'dorme', ascolto: 'ascolta', penso: 'pensa', parlo: 'parla' }
const LATO = 38
const disegni = new Map()
let laBolla = null

const disegno = (gesto, i) => {
  const k = gesto + i
  if (!disegni.has(k)) disegni.set(k, sprite(gesto, i))
  return disegni.get(k)
}

export default function Peppino({ fase }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    const gesto = GESTI[fase] || 'dorme'
    const fermo = matchMedia('(prefers-reduced-motion: reduce)').matches
    laBolla ??= bolla(16)
    let i = 0, timer = 0
    const giro = () => {
      const s = disegno(gesto, i)
      const su = fermo ? 0 : Math.floor(Date.now() / 900) % 2 // la bolla galleggia
      ctx.clearRect(0, 0, LATO, LATO)
      ctx.drawImage(s, (LATO - s.width) / 2, (LATO - s.height) / 2 - su)
      ctx.drawImage(laBolla, (LATO - laBolla.width) / 2, (LATO - laBolla.height) / 2 - su)
      if (fermo) return
      timer = setTimeout(() => { i = (i + 1) % STATI[gesto].fotogrammi; giro() }, STATI[gesto].ms)
    }
    giro()
    return () => clearTimeout(timer)
  }, [fase])

  return <canvas ref={ref} className="peppino" width={LATO} height={LATO} aria-hidden="true" />
}
