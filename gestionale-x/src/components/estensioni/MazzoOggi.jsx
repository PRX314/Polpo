import { Link } from 'react-router-dom'
import { oggiIso } from '../../lib/dates'
import { leggiMazzo } from '../../lib/mazzoAnno'
import CartaMazzo from './CartaMazzo'

// Riquadro di Oggi: la stesa del giorno in piccolo, un tocco apre l'estensione.
const MazzoOggi = () => {
  const r = leggiMazzo(oggiIso())
  return (
    <section className="card card-flush" aria-label="Il Mazzo dell'Anno, oggi">
      <h2 className="ag-head"><span>Mazzo dell&apos;Anno</span> <span className="small faint" style={{ letterSpacing: 0, textTransform: 'none' }}>la stesa di oggi</span></h2>
      <Link to="/estensioni/mazzo-anno" className="mz-oggi">
        <div className="mz-oggi-carte">
          {r.carte.map(c => <CartaMazzo key={`${c.pos}-${c.img}`} carta={c} piccola />)}
        </div>
        <div className="grow">
          <strong>{r.nome}</strong>
          <div className="small muted">{r.breve}</div>
        </div>
      </Link>
    </section>
  )
}

export default MazzoOggi
