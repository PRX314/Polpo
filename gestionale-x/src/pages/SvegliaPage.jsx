import { useState } from 'react'
import { Check, Copy, Plus, RefreshCw, Trash2 } from 'lucide-react'
import Ascolta from '../components/mattino/Ascolta'
import Buonanotte from '../components/mattino/Buonanotte'
import { useData } from '../context/useData'
import { useToast } from '../context/useToast'
import { saveRoutine } from '../firebaseService'
import { fullDate, oggiIso } from '../lib/dates'
import { creaChiave, INDIRIZZO_MATTINO, preparaDiscorso } from '../services/mattinoService'
import { oraValida } from '../sveglie'
import './SvegliaPage.css'

// Le stesse voci di backend/mattino.js. Il Mazzo parte spento.
const VOCI = [
  { id: 'meteo', nome: 'Il meteo di Chiavari', di: true },
  { id: 'agenda', nome: 'Appuntamenti, scadenze e pagamenti', di: true },
  { id: 'routine', nome: 'La routine di oggi', di: true },
  { id: 'ieri', nome: 'Cosa hai fatto ieri', di: true },
  { id: 'primoPiano', nome: 'I progetti in primo piano', di: true },
  { id: 'pensiero', nome: 'Le tue frasi e i tuoi Pensieri', di: true },
  { id: 'mazzo', nome: "La stesa del Mazzo dell'Anno", di: false }
]
const MAX_FRASE = 280
const ORA_SERA = '21:30'

const nuovoId = () => globalThis.crypto?.randomUUID?.() || `f${Date.now()}`

// Il discorso di oggi: si legge, si ascolta, si rifà a mano
function Discorso({ mattino }) {
  const toast = useToast()
  const [lavoro, setLavoro] = useState(false)
  const [errore, setErrore] = useState('')
  const oggi = mattino?.data === oggiIso()

  const rifai = async () => {
    setLavoro(true)
    setErrore('')
    try {
      const esito = await preparaDiscorso({ forza: true })
      toast.ok(esito.audio ? 'Discorso pronto, con la voce' : 'Il testo è pronto, la voce no: il Comando suonerà il messaggio di riserva')
    } catch (err) {
      setErrore(err.message)
    }
    setLavoro(false)
  }

  return (
    <section className="card" aria-label="Il discorso di oggi">
      <h2 className="card-title"><span>Il discorso di oggi</span></h2>
      {oggi
        ? <p className="sveglia-discorso">{mattino.testo}</p>
        : <p className="small muted">Oggi non c&apos;è ancora. Con la sveglia accesa lo scrivo io di notte, oppure fammelo scrivere adesso.</p>}
      {errore && <div className="form-error" role="alert">{errore}</div>}
      <div className="row row-wrap sveglia-azioni">
        {oggi && <Ascolta testo={mattino.testo} onErrore={setErrore} />}
        <button type="button" className="btn btn-sm" onClick={rifai} disabled={lavoro}>
          {lavoro ? <span className="spinner" aria-hidden="true" /> : <RefreshCw size={14} />} {lavoro ? 'Lo scrivo…' : oggi ? 'Riscrivilo adesso' : 'Scrivilo adesso'}
        </button>
      </div>
    </section>
  )
}

function Frasi({ frasi, onSalva }) {
  const [testo, setTesto] = useState('')

  const aggiungi = (e) => {
    e.preventDefault()
    if (!testo.trim()) return
    onSalva([...frasi, { id: nuovoId(), testo: testo.trim().slice(0, MAX_FRASE) }])
    setTesto('')
  }

  return (
    <section className="card" aria-label="Le tue frasi">
      <h2 className="card-title"><span>Le tue frasi</span> <span className="count ghost">{frasi.length}</span></h2>
      <p className="help">Ogni mattina Peppino ne dice una con le tue parole, a giro, insieme agli appunti nella raccolta Pensieri.</p>
      {frasi.length > 0 && (
        <ul className="sveglia-frasi">
          {frasi.map(f => (
            <li key={f.id} className="row">
              <span className="grow">{f.testo}</span>
              <button type="button" className="btn-icon sm" onClick={() => onSalva(frasi.filter(x => x.id !== f.id))} aria-label={`Elimina la frase: ${f.testo}`}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <form className="sveglia-nuova" onSubmit={aggiungi}>
        <input value={testo} maxLength={MAX_FRASE} onChange={(e) => setTesto(e.target.value)} placeholder="Una frase che vuoi sentirti dire" aria-label="Nuova frase" />
        <button type="submit" className="btn" disabled={!testo.trim()} aria-label="Aggiungi la frase"><Plus size={15} /></button>
      </form>
    </section>
  )
}

// Il Comando sull'iPhone. La chiave si vede una volta sola: su Firestore c'è solo la sua impronta.
function Iphone({ sveglia }) {
  const toast = useToast()
  const [chiave, setChiave] = useState('')
  const indirizzo = chiave ? `${INDIRIZZO_MATTINO}?k=${chiave}` : ''

  const crea = async () => {
    if (sveglia.chiaveHash && !window.confirm('La chiave di prima smette di funzionare: andrà cambiata anche nel Comando. Continuo?')) return
    setChiave(await creaChiave())
  }
  const copia = async () => {
    await navigator.clipboard.writeText(indirizzo)
    toast.ok('Indirizzo copiato')
  }

  return (
    <section className="card" aria-label="Collega l'iPhone">
      <h2 className="card-title"><span>Collega l&apos;iPhone</span></h2>
      <ol className="sveglia-passi">
        <li>Crea qui sotto il tuo indirizzo e copialo.</li>
        <li>Nell&apos;app Comandi: Automazione, +, Sveglia, «quando viene interrotta», Esegui subito.</li>
        <li>Nel comando nuovo: Ottieni contenuti dell&apos;URL, con il tuo indirizzo.</li>
        <li>Sotto: Riproduci suono. Prima puoi mettere Imposta volume.</li>
      </ol>
      {chiave ? (
        <>
          <p className="help">Copialo adesso: dopo non si vede più. Chi lo ha può sentire il tuo discorso di oggi, e basta.</p>
          <div className="sveglia-indirizzo">
            <code>{indirizzo}</code>
            <button type="button" className="btn btn-sm" onClick={copia}><Copy size={14} /> Copia</button>
          </div>
        </>
      ) : (
        <div className="row row-wrap">
          <button type="button" className="btn btn-sm" onClick={crea}>{sveglia.chiaveHash ? 'Crea un indirizzo nuovo' : 'Crea il mio indirizzo'}</button>
          {sveglia.chiaveHash && <span className="small muted"><Check size={13} aria-hidden="true" /> Creato il {fullDate(sveglia.chiaveCreata)}</span>}
        </div>
      )}
    </section>
  )
}

const SvegliaPage = () => {
  const { routine } = useData()

  if (routine === undefined) return <div className="row" style={{ padding: 24 }}><span className="spinner" aria-hidden="true" /></div>
  if (routine === false) return <div className="form-error" role="alert">Non riesco a leggere le impostazioni. Controlla la rete e riapri la pagina.</div>

  const sveglia = routine?.sveglia || {}
  const frasi = (sveglia.frasi || []).filter(f => f?.testo)
  const accesa = (v) => sveglia.voci?.[v.id] ?? v.di
  const salva = (cambio) => saveRoutine({ sveglia: cambio }).catch(() => {})

  return (
    <div className="stack sveglia" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>Sveglia</h1>
          <p className="sub">Fermi la sveglia dell&apos;iPhone e parte Peppino.</p>
        </div>
      </div>

      <div className="sveglia-grid">
        <div className="stack">
          <Discorso mattino={routine?.mattino} />
          <Iphone sveglia={sveglia} />
          <Frasi frasi={frasi} onSalva={(lista) => salva({ frasi: lista })} />
        </div>

        <div className="stack">
          <section className="card" aria-label="Ogni mattina">
            <h2 className="card-title"><span>Ogni mattina</span></h2>
            <label className="sveglia-voce">
              <input type="checkbox" checked={!!sveglia.attiva} onChange={(e) => salva({ attiva: e.target.checked })} />
              <span className="grow">Preparami il discorso di notte</span>
            </label>
            <p className="help">Prima delle 5 lo scrivo e lo registro, così quando fermi la sveglia è già pronto.</p>
          </section>

          <section className="card" aria-label="Cosa ti dice">
            <h2 className="card-title"><span>Cosa ti dice</span></h2>
            {VOCI.map(v => (
              <label key={v.id} className="sveglia-voce">
                <input type="checkbox" checked={accesa(v)} onChange={(e) => salva({ voci: { [v.id]: e.target.checked } })} />
                <span className="grow">{v.nome}</span>
              </label>
            ))}
          </section>

          <Buonanotte />

          <section className="card" aria-label="Notifica della sera">
            <h2 className="card-title"><span>La sera</span></h2>
            <label className="sveglia-voce">
              <input type="checkbox" checked={!!sveglia.buonanotte} onChange={(e) => salva({ buonanotte: e.target.checked, oraSera: sveglia.oraSera || ORA_SERA })} />
              <span className="grow">Ricordamelo con una notifica</span>
            </label>
            {sveglia.buonanotte && (
              <div className="field sveglia-ora">
                <label htmlFor="ora-sera">Alle</label>
                <input id="ora-sera" type="time" value={sveglia.oraSera || ORA_SERA} onChange={(e) => { if (oraValida(e.target.value)) salva({ oraSera: e.target.value }) }} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default SvegliaPage
