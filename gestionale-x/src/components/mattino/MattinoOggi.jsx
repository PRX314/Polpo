import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../../context/useData'
import { oggiIso } from '../../lib/dates'
import Ascolta from './Ascolta'

// Il riquadro in Oggi: il discorso che Peppino ha preparato stamattina, da leggere o riascoltare
export default function MattinoOggi() {
  const { routine } = useData()
  const [aperto, setAperto] = useState(false)
  const [errore, setErrore] = useState('')
  const mattino = routine?.mattino

  if (mattino?.data !== oggiIso() || !mattino.testo) return null

  return (
    <section className="card mattino" aria-label="Il mattino di Peppino">
      <h2 className="card-title"><span>Il mattino di Peppino</span> <Link to="/sveglia" className="small faint">Sveglia</Link></h2>
      <p className={aperto ? '' : 'clamp-2'}>{mattino.testo}</p>
      {errore && <div className="form-error" role="alert">{errore}</div>}
      <div className="row row-wrap mattino-azioni">
        <Ascolta testo={mattino.testo} onErrore={setErrore} />
        <button type="button" className="btn btn-sm btn-quiet" onClick={() => setAperto(a => !a)}>{aperto ? 'Accorcia' : 'Leggi tutto'}</button>
      </div>
    </section>
  )
}
