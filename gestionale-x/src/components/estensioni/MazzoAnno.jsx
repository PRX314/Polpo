import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { addDaysIso, oggiIso } from '../../lib/dates'
import { jollyDi, leggiMazzo, linkArcana } from '../../lib/mazzoAnno'
import CartaMazzo from './CartaMazzo'
import './MazzoAnno.css'

const sposta = (iso, n) => addDaysIso(n, new Date(`${iso}T12:00:00`))

// Estensione «Il Mazzo dell'Anno»: la stesa di una data. Regole e tabelle stanno nella scheda di Arcana.
const MazzoAnno = () => {
  const [iso, setIso] = useState(oggiIso)
  const r = useMemo(() => leggiMazzo(iso), [iso])

  // Frecce della tastiera: giorno prima e dopo, tranne mentre si scrive in un campo
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return
      if (e.key === 'ArrowLeft') setIso(i => sposta(i, -1))
      else if (e.key === 'ArrowRight') setIso(i => sposta(i, 1))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>Il Mazzo dell&apos;Anno</h1>
          <p className="sub">13 mesi da 28 giorni: ogni data è una stesa di quattro carte e una radice di tre lettere.</p>
        </div>
        <div className="page-actions">
          <a className="btn" href={linkArcana(iso)} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={15} aria-hidden="true" /> Regole e tabelle in Arcana
          </a>
        </div>
      </div>

      <div className="mz-comandi">
        <button className="btn-icon" onClick={() => setIso(i => sposta(i, -1))} aria-label="Giorno precedente"><ArrowLeft size={18} /></button>
        <input type="date" value={iso} aria-label="Data da interrogare" onChange={(e) => { if (e.target.value) setIso(e.target.value) }} />
        <button className="btn-icon" onClick={() => setIso(i => sposta(i, 1))} aria-label="Giorno successivo"><ArrowRight size={18} /></button>
        <button className="btn" onClick={() => setIso(oggiIso())} disabled={iso === oggiIso()}>Oggi</button>
        <button className="btn" onClick={() => setIso(jollyDi(iso))}>Il Jolly</button>
      </div>

      <div className="mz-esito" aria-live="polite">
        <h2>{r.nome}</h2>
        <span className="small muted">{r.quando}</span>
      </div>

      <div className="mz-stesa">
        {r.carte.map(c => <CartaMazzo key={`${c.pos}-${c.img}`} carta={c} />)}
      </div>

      <div className="mz-dati">
        {r.dati.map(d => (
          <div key={d.k} className="card mz-dato">
            <div className="card-title">{d.k}</div>
            <div className={`mz-v ${d.grande ? 'is-grande' : ''} ${d.ebraico ? 'is-ebraico' : ''}`} dir={d.ebraico ? 'rtl' : undefined}>{d.v}</div>
            <div className="small muted">{d.m}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MazzoAnno
