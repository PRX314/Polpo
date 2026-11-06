import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { useData } from '../../context/useData'
import { saveRoutine } from '../../firebaseService'
import { oggiIso } from '../../lib/dates'
import { MAX_TESTO, vociDa } from '../../lib/treCose'
import './mattino.css'

const righe = (voci) => [0, 1, 2].map(i => voci[i]?.testo || '')

// Le tre cose di oggi. Di notte, se Paolo non le ha scritte, le propone Peppino: restano proposte
// finché non le modifica. Spuntarne una legata a una cosa da fare spunta anche quella, altrimenti
// la mattina dopo tornerebbe tra le proposte.
export default function TreCose() {
  const { routine, items, actions } = useData()
  const oggi = oggiIso()
  const giorno = routine?.treCose?.[oggi]
  const voci = (giorno?.voci || []).filter(v => v?.testo)
  const [campi, setCampi] = useState(null) // null = si guardano, un elenco = si modificano

  if (routine === undefined) return null

  const salva = (nuove, proposte) => saveRoutine({ treCose: { [oggi]: { voci: nuove, proposte } } }).catch(() => {})

  const spunta = (voce) => {
    const fatta = !voce.fatta
    salva(voci.map(v => (v === voce ? { ...v, fatta } : v)), !!giorno?.proposte)
    const progetto = voce.progettoId && items.find(p => p.id === voce.progettoId)
    if (!progetto || !(progetto.todos || []).some(t => t.text === voce.todo)) return
    actions.update(progetto.id, { todos: progetto.todos.map(t => (t.text === voce.todo ? { ...t, completed: fatta } : t)) })
  }

  const conferma = (e) => {
    e.preventDefault()
    salva(vociDa(campi, voci), false)
    setCampi(null)
  }

  return (
    <section className="card card-flush tre-cose" aria-label="Le tre cose di oggi">
      <h2 className="ag-head">
        <span>Le tre cose di oggi</span>
        {giorno?.proposte && voci.length > 0 && <span className="small faint tre-nota">proposte da Peppino</span>}
      </h2>

      {campi ? (
        <form className="tre-form" onSubmit={conferma}>
          {campi.map((c, i) => (
            <input
              key={i} value={c} maxLength={MAX_TESTO} aria-label={`Cosa numero ${i + 1}`} placeholder={i ? '' : 'Cosa conta di più oggi?'}
              onChange={(e) => setCampi(l => l.map((x, j) => (j === i ? e.target.value : x)))}
            />
          ))}
          <div className="row">
            <button type="submit" className="btn btn-sm btn-primary">Salva</button>
            <button type="button" className="btn btn-sm btn-quiet" onClick={() => setCampi(null)}>Annulla</button>
          </div>
        </form>
      ) : (
        <>
          {voci.length > 0 ? (
            <ul>
              {voci.map((v, i) => (
                <li key={i} className="ag-row">
                  <input type="checkbox" checked={!!v.fatta} onChange={() => spunta(v)} aria-label={`Segna “${v.testo}” come fatta`} />
                  <div className={`grow ${v.fatta ? 'tre-fatta' : ''}`}>
                    <span className="ag-text">{v.testo}</span>
                    {v.progetto && <div className="small faint">{v.progetto}</div>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted tre-vuoto">Scegli le cose che contano oggi: al massimo tre.</p>
          )}
          <button type="button" className="ag-more tre-modifica" onClick={() => setCampi(righe(voci))}>
            <Pencil size={13} aria-hidden="true" /> {voci.length ? 'Cambia' : 'Scrivile'}
          </button>
        </>
      )}
    </section>
  )
}
