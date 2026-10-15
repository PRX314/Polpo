import { useEffect, useRef, useState } from 'react'
import { Mic, Square, X } from 'lucide-react'

// Registra dal microfono e consegna un File audio. Chrome/Edge fanno webm/opus, Safari su iPhone mp4/aac.
// 32 kbit/s bastano per la voce e per Whisper: un'ora sta sotto i 20 MB dell'archivio locale.
const FORMATI = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']
const DURATA_MAX = 60 * 60
const due = n => String(n).padStart(2, '0')
const durata = s => `${due(Math.floor(s / 60))}:${due(s % 60)}`
const ERRORI = {
  NotAllowedError: 'Microfono negato: consentilo a questo sito nelle impostazioni del browser.',
  NotFoundError: 'Nessun microfono disponibile.',
  NotReadableError: 'Il microfono è occupato da un’altra app.',
}

export default function VoiceRecorder({ onRecorded, disabled }) {
  const [secondi, setSecondi] = useState(null) // null = fermo
  const [errore, setErrore] = useState('')
  const sessione = useRef(null)

  const chiudi = () => {
    const s = sessione.current
    if (!s) return
    clearInterval(s.timer)
    s.flusso.getTracks().forEach(t => t.stop())
    s.schermo?.release?.().catch(() => {})
    sessione.current = null
    setSecondi(null)
  }
  // Uscendo dalla pagina a metà registrazione si spegne il microfono, senza salvare.
  // onstop poi spegne tutto (chiudi) e, con annullata, non consegna niente.
  useEffect(() => () => { const s = sessione.current; if (s) { s.annullata = true; s.registratore.stop() } }, [])

  const avvia = async () => {
    setErrore('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') return setErrore('Questo browser non sa registrare l’audio.')
    let flusso
    try {
      flusso = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
    } catch (e) { return setErrore(ERRORI[e?.name] || 'Il microfono non è partito. Riprova.') }
    const formato = FORMATI.find(f => MediaRecorder.isTypeSupported?.(f))
    const registratore = new MediaRecorder(flusso, { ...(formato && { mimeType: formato }), audioBitsPerSecond: 32000 })
    const pezzi = []
    const inizio = new Date()
    const s = { flusso, registratore, annullata: false }
    sessione.current = s
    registratore.ondataavailable = e => { if (e.data.size) pezzi.push(e.data) }
    registratore.onstop = () => {
      chiudi()
      if (s.annullata) return
      const tipo = (registratore.mimeType || formato || 'audio/webm').split(';')[0]
      const blob = new Blob(pezzi, { type: tipo })
      if (!blob.size) return setErrore('Registrazione vuota: riprova.')
      const giorno = `${inizio.getFullYear()}-${due(inizio.getMonth() + 1)}-${due(inizio.getDate())}-${due(inizio.getHours())}${due(inizio.getMinutes())}`
      onRecorded(new File([blob], `nota-vocale-${giorno}.${tipo.includes('mp4') ? 'm4a' : 'webm'}`, { type: tipo }), inizio)
    }
    registratore.start(1000)
    // Sul telefono lo schermo che si spegne ferma la registrazione: finché registri resta acceso.
    navigator.wakeLock?.request('screen').then(w => { if (sessione.current === s) s.schermo = w; else w.release() }).catch(() => {})
    const partenza = Date.now()
    setSecondi(0)
    s.timer = setInterval(() => {
      const passati = Math.floor((Date.now() - partenza) / 1000)
      setSecondi(passati)
      if (passati >= DURATA_MAX) registratore.stop()
    }, 500)
  }
  const ferma = annulla => { const s = sessione.current; if (!s) return; s.annullata = annulla; s.registratore.stop() }

  if (secondi === null) return <>
    <button type="button" className="btn" disabled={disabled} onClick={avvia}><Mic size={16} /> Registra voce</button>
    {errore && <p role="alert" className="small voice-error">{errore}</p>}
  </>
  return <div className="voice-rec" role="group" aria-label="Registrazione in corso">
    <span className="voice-dot" aria-hidden="true" />
    <span className="voice-time" aria-live="off">{durata(secondi)}</span>
    <button type="button" className="btn btn-primary" onClick={() => ferma(false)}><Square size={14} /> Ferma e salva</button>
    <button type="button" className="btn-icon" aria-label="Annulla registrazione" onClick={() => ferma(true)}><X size={16} /></button>
  </div>
}
