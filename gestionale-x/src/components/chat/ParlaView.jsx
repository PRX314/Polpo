import { useEffect, useRef, useState } from 'react'
import { Eco } from '../../lib/eco-client'
import { API_URL, parametriVoce } from '../../services/chatService'
import { inviaAudio, preparaTrascrizione } from '../../services/trascrizione'
import Peppino from './Peppino'
import './ParlaView.css'

const FASE = {
  fermo: 'Tocca Peppino e parla',
  ascolto: 'Ti ascolto…',
  penso: 'Ci penso…',
  parlo: 'Sto parlando · tocca per interrompermi'
}

// Le orecchie: lo stesso Whisper delle note vocali (funzione dell'hub online, se no il backend).
// Su un audio quasi vuoto Whisper a volte scrive i titoli di coda dei sottotitoli: si buttano.
const trascrivi = async (blob) => {
  let res
  try { res = await inviaAudio(blob) } catch { throw new Error('Serve la rete per capire quello che dici.') }
  const dati = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(dati.error || `Non sono riuscito a capire l'audio (errore ${res.status})`)
  const testo = (dati.testo || '').trim()
  return /amara\.org|sottotitoli (creati|e revisione|a cura)/i.test(testo) ? '' : testo
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
  const volumeRef = useRef(null)
  const peppino = useRef(null)

  useEffect(() => () => {
    attivaRef.current = false
    ecoRef.current?.fermaAscolto()
    ecoRef.current?.zitto()
  }, [])

  const eco = () => {
    if (ecoRef.current) return ecoRef.current
    ecoRef.current = new Eco({
      api: API_URL,
      // Whisper dove il browser sa registrare (anche iPhone): capisce meglio del riconoscimento di
      // Safari, che nell'app installata va e viene. Altrimenti il riconoscimento del browser.
      ascolto: Eco.saRegistrare() ? 'whisper' : 'browser', whisper: Eco.saRegistrare(), trascrivi,
      voce: 'server',                     // voce neurale dal backend, non quella robotica del browser
      parametriVoce,
      onLivello: (v) => { volumeRef.current?.style.setProperty('--livello', v); peppino.current?.livello(v) },
      onStato: (s) => setFase(s),
      onMessaggio: (m) => { if (m.chi === 'errore') setErrore(m.testo) },
      onDiario: (d) => console.info('[voce]', d)
    })
    peppino.current?.voce(() => ecoRef.current?.voceOra()) // la bocca segue la frase che sta suonando
    return ecoRef.current
  }

  const dici = async (e, testo) => {
    setRisposta(Eco.perVoce(testo)) // lo stesso testo che viene letto, senza asterischi e link
    await e.parla(testo)
  }

  const conversa = async () => {
    const e = eco()
    try {
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
      else await dici(e, 'Non ho capito. Le trovi in Scrivi, sotto la risposta.')
    }
    } catch (err) {
      // Di solito il microfono negato: senza questo il tasto restava morto
      setErrore(err?.name === 'NotAllowedError' ? Eco.ERRORI_ASCOLTO['not-allowed']
        : err?.name === 'NotFoundError' ? Eco.ERRORI_ASCOLTO['audio-capture'] : 'Il microfono non è partito. Riprova.')
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
    peppino.current?.tocco()
    preparaTrascrizione()
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
          aria-label={fase === 'parlo' ? 'Interrompi' : fase === 'ascolto' ? 'Ho finito di parlare' : 'Parla con Peppino'}
        >
          <Peppino fase={fase} motore={peppino} />
        </button>
        <div className={`parla-volume ${fase === 'ascolto' ? 'is-on' : ''}`} ref={volumeRef} aria-hidden="true"><i /></div>
        <p className="parla-fase" role="status">{FASE[fase]}</p>
        {fase !== 'fermo' && <button className="btn btn-sm btn-quiet" onClick={chiudi}>Basta così</button>}
      </div>

      <div className="parla-testi" aria-live="polite">
        {errore && <div className="form-error" role="alert">{errore}</div>}
        {detto && <p className="parla-tu"><span className="faint">Tu</span> {detto}</p>}
        {risposta && <p className="parla-polpo">{risposta}</p>}
        {!detto && !errore && <p className="small muted">Parli, Peppino ti risponde a voce e ti riascolta. Se stai zitto si ferma. Quello che vi dite resta nella conversazione: lo ritrovi in Scrivi.</p>}
      </div>
    </div>
  )
}

export default ParlaView
