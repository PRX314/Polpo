import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { Eco } from '../../lib/eco-client'
import { API_URL, parametriVoce } from '../../services/chatService'
import './ParlaView.css'

const FASE = {
  fermo: 'Tocca e parla',
  ascolto: 'Ti ascolto…',
  penso: 'Ci penso…',
  parlo: 'Sto parlando · tocca per interrompermi'
}

// Modalità "Parla": una conversazione a voce, come una telefonata. Un tocco e si va avanti
// da soli: ascolta, risponde a voce, torna ad ascoltare. Si ferma se non dici niente.
// Il testo della risposta compare mentre la dice, non prima.
// invia(testo) → { reply, proposedActions } | null   (la chat salva lo scambio come sempre)
// azioni.current → { confirmAll, rejectAll }         (letti al momento, non alla partenza)
function ParlaView({ invia, azioni }) {
  const [fase, setFase] = useState('fermo')
  const [detto, setDetto] = useState('')
  const [risposta, setRisposta] = useState('')
  const [errore, setErrore] = useState('')
  const ecoRef = useRef(null)
  const attivaRef = useRef(false)

  useEffect(() => () => {
    attivaRef.current = false
    ecoRef.current?.fermaAscolto()
    ecoRef.current?.zitto()
  }, [])

  const eco = () => (ecoRef.current ??= new Eco({
    api: API_URL,
    ascolto: 'browser', whisper: false, // il backend del gestionale non ha Whisper
    voce: 'server',                     // voce neurale dal backend, non quella robotica del browser
    parametriVoce,
    onStato: (s) => setFase(s),
    onMessaggio: (m) => { if (m.chi === 'errore') setErrore(m.testo) },
    onDiario: (d) => console.info('[voce]', d)
  }))

  const dici = async (e, testo) => {
    setRisposta(Eco.perVoce(testo)) // lo stesso testo che viene letto, senza asterischi e link
    await e.parla(testo)
  }

  const conversa = async () => {
    const e = eco()
    while (attivaRef.current) {
      const testo = await e.ascolta()
      if (!attivaRef.current) break
      if (!testo) break // silenzio: ci si ferma, si riparte col tocco
      setDetto(testo); setRisposta(''); setErrore('')
      setFase('penso')
      const esito = await invia(testo)
      if (!esito || !attivaRef.current) break
      await dici(e, esito.reply)

      const n = esito.proposedActions.length
      if (!n || e.interrotto || !attivaRef.current) continue
      await dici(e, n === 1 ? 'Confermi?' : `Confermi tutte e ${n}?`)
      if (e.interrotto) continue
      const si = Eco.risposta(await e.ascolta({ attesaMax: 6000 }))
      if (si === 'si') { await azioni.current.confirmAll(); await dici(e, 'Fatto.') }
      else if (si === 'no') { azioni.current.rejectAll(); await dici(e, 'Va bene, lascio stare.') }
      else await dici(e, 'Non ho capito. Le trovi nel pannello azioni.')
    }
    attivaRef.current = false
    setFase('fermo')
  }

  const tocca = () => {
    if (!Eco.supportato()) {
      setErrore('Questo browser non sa ascoltare. Usa Chrome, Edge o Safari; su iPhone, se dall\'app installata non va, prova da Safari.')
      return
    }
    const e = eco()
    e.sblocca() // subito, dentro il tocco: la voce arriva secondi dopo e iPhone la bloccherebbe
    if (fase === 'parlo') return e.zitto()         // interrompi: la conversazione torna ad ascoltarti
    if (fase === 'ascolto') return e.fermaAscolto() // ho finito di parlare
    if (fase === 'penso' || attivaRef.current) return
    setErrore('')
    attivaRef.current = true
    conversa()
  }

  const chiudi = () => {
    attivaRef.current = false
    ecoRef.current?.fermaAscolto()
    ecoRef.current?.zitto()
  }

  return (
    <div className="parla">
      <div className="parla-centro">
        <button
          className={`parla-tasto is-${fase}`} onClick={tocca} disabled={fase === 'penso'}
          aria-label={fase === 'parlo' ? 'Interrompi' : fase === 'ascolto' ? 'Ho finito di parlare' : 'Parla con Polpo'}
        >
          {fase === 'parlo' ? <Square size={28} /> : fase === 'penso' ? <span className="spinner" aria-hidden="true" /> : <Mic size={32} />}
        </button>
        <p className="parla-fase" role="status">{FASE[fase]}</p>
        {fase !== 'fermo' && <button className="btn btn-sm btn-quiet" onClick={chiudi}>Basta così</button>}
      </div>

      <div className="parla-testi" aria-live="polite">
        {errore && <div className="form-error" role="alert">{errore}</div>}
        {detto && <p className="parla-tu"><span className="faint">Tu</span> {detto}</p>}
        {risposta && <p className="parla-polpo">{risposta}</p>}
        {!detto && !errore && <p className="small muted">Parli, Polpo ti risponde a voce e ti riascolta. Se stai zitto si ferma. Quello che vi dite resta nella conversazione: lo ritrovi in Scrivi.</p>}
      </div>
    </div>
  )
}

export default ParlaView
