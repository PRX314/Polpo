import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../context/useData'
import { saveRoutine } from '../../firebaseService'
import { addDaysIso, longDate, oggiIso } from '../../lib/dates'
import { MAX_TESTO, vociDa } from '../../lib/treCose'
import './mattino.css'

// La sera: cosa hai chiuso oggi e cosa metti in cima domani. Domani mattina sono le tre cose scelte
// da Paolo, e Peppino le ricorda invece di proporne altre. Quelle rimaste aperte oggi partono già
// scritte. La domenica sera c'è anche la strada per pianificare la settimana in chat.
export default function Buonanotte() {
  const navigate = useNavigate()
  const { routine } = useData()
  const oggi = oggiIso()
  const domani = addDaysIso(1)
  const diOggi = (routine?.treCose?.[oggi]?.voci || []).filter(v => v?.testo)
  const giaScelte = (routine?.treCose?.[domani]?.voci || []).filter(v => v?.testo)
  const partenza = giaScelte.length ? giaScelte : diOggi.filter(v => !v.fatta)
  const [campi, setCampi] = useState(null)
  const [salvate, setSalvate] = useState(false)

  if (routine === undefined) return null

  const valori = campi || [0, 1, 2].map(i => partenza[i]?.testo || '')
  const fatte = diOggi.filter(v => v.fatta).length
  const domenica = new Date().getDay() === 0

  const conferma = async (e) => {
    e.preventDefault()
    await saveRoutine({ treCose: { [domani]: { voci: vociDa(valori, partenza), proposte: false } } }).catch(() => {})
    setSalvate(true)
  }

  return (
    <section className="card buonanotte" aria-label="Buonanotte">
      <h2 className="card-title"><span>Buonanotte</span></h2>
      {diOggi.length > 0 && <p className="small muted">Oggi ne hai chiuse {fatte} su {diOggi.length}.</p>}
      <form className="tre-form tre-form-sera" onSubmit={conferma}>
        <label className="field-label" htmlFor="domani-0">Le tre cose di {longDate(domani)}</label>
        {valori.map((c, i) => (
          <input
            key={i} id={`domani-${i}`} value={c} maxLength={MAX_TESTO} aria-label={`Domani, cosa numero ${i + 1}`}
            onChange={(e) => { setSalvate(false); setCampi(valori.map((x, j) => (j === i ? e.target.value : x))) }}
          />
        ))}
        <div className="row row-wrap">
          <button type="submit" className="btn btn-sm btn-primary">Salva per domani</button>
          {salvate && <span className="small muted" role="status">Domattina te le ricordo io.</span>}
        </div>
      </form>
      {domenica && (
        <button type="button" className="btn btn-sm buonanotte-settimana" onClick={() => navigate('/ai', { state: { message: 'Pianifichiamo la settimana' } })}>
          Pianifica la settimana con Peppino
        </button>
      )}
    </section>
  )
}
