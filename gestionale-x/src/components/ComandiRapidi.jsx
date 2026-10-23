import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, Camera, ListPlus, NotebookPen } from 'lucide-react'
import { auth } from '../firebase'
import { addEvent } from '../firebaseService'
import { useData } from '../context/useData'
import { useToast } from '../context/useToast'
import { oggiIso } from '../lib/dates'
import { aggiungiRegistrazione, creaAppunto } from '../services/appuntiService'
import { attachments, newDocument, saveDocument } from '../services/localDocuments'
import EventForm from './EventForm'
import Modal from './ui/Modal'
import VoiceRecorder from './VoiceRecorder'
import './ComandiRapidi.css'

// Comandi rapidi della pagina Oggi: fissare qualcosa in due tocchi, soprattutto dal telefono.
// Per spostarsi tra le pagine c'è già la barra delle sezioni: qui solo cose che creano.
// L'appunto fa anche da "pensiero al volo": dentro c'è "Al vault" per mandarlo in 00-Inbox.

const quando = (d) => d.toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function ComandiRapidi() {
  const navigate = useNavigate()
  const toast = useToast()
  const [occupato, setOccupato] = useState(false)
  const [aperto, setAperto] = useState(null) // 'evento' | 'todo'

  const prova = async (fn, errore) => {
    setOccupato(true)
    try { await fn() } catch { toast.err(errore) } finally { setOccupato(false) }
  }

  const appunto = () => prova(async () => navigate(`/appunti/${await creaAppunto()}`), 'Non sono riuscito a creare l\'appunto')

  const voce = (file, inizio) => prova(async () => {
    const id = await creaAppunto({ title: `Nota vocale · ${quando(inizio)}` })
    aggiungiRegistrazione(id, file, inizio).catch(() => {})
    navigate(`/appunti/${id}`)
  }, 'Registrazione non salvata')

  // Come "Scatta foto" in Documenti: la foto resta su questo dispositivo e aprendola parte la lettura
  const foto = (file) => prova(async () => {
    const row = newDocument('')
    row.files = attachments([file])
    row.title = `Foto · ${quando(new Date())}`
    await saveDocument(auth.currentUser.uid, row)
    navigator.storage?.persist?.().catch(() => {})
    navigate(`/documenti/${row.id}?leggi=1`)
  }, 'Foto non salvata')

  return (
    <>
      <div className="comandi" role="group" aria-label="Comandi rapidi">
        <button className="btn btn-sm" disabled={occupato} onClick={appunto}><NotebookPen size={14} /> Appunto</button>
        <VoiceRecorder piccolo etichetta="Voce" disabled={occupato} onRecorded={voce} />
        <button className="btn btn-sm" disabled={occupato} onClick={() => setAperto('todo')}><ListPlus size={14} /> Da fare</button>
        <button className="btn btn-sm" disabled={occupato} onClick={() => setAperto('evento')}><CalendarPlus size={14} /> Appuntamento</button>
        <label className={`btn btn-sm comandi-file ${occupato ? 'is-disabled' : ''}`}>
          <Camera size={14} /> Foto documento
          <input type="file" accept="image/*" capture="environment" disabled={occupato} aria-label="Foto documento"
            onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) foto(f) }} />
        </label>
      </div>

      {aperto === 'evento' && (
        <EventForm data={oggiIso()} onSave={async (dati) => { await addEvent(dati); toast.ok('Appuntamento salvato') }} onClose={() => setAperto(null)} />
      )}
      {aperto === 'todo' && <NuovaCosaDaFare onClose={() => setAperto(null)} />}
    </>
  )
}

// Una cosa da fare dentro un progetto, senza aprirlo: i fissati in cima, poi gli altri per nome
function NuovaCosaDaFare({ onClose }) {
  const { items, actions } = useData()
  const toast = useToast()
  const progetti = items.filter(p => !p.archived && p.status !== 'completed')
    .sort((a, b) => (!!b.pinned - !!a.pinned) || a.name.localeCompare(b.name))
  const [testo, setTesto] = useState('')
  const [progettoId, setProgettoId] = useState(progetti[0]?.id || '')
  const [data, setData] = useState('')
  const [errore, setErrore] = useState('')
  const [salvo, setSalvo] = useState(false)

  const salva = async (e) => {
    e.preventDefault()
    const p = items.find(x => x.id === progettoId)
    if (!testo.trim()) return setErrore('Scrivi cosa c\'è da fare')
    if (!p) return setErrore('Scegli un progetto')
    const todo = { text: testo.trim(), completed: false, ...(data && { deadline: data }) }
    setSalvo(true)
    try {
      await actions.update(p.id, { todos: [...(p.todos || []), todo] })
      toast.ok(`Aggiunta a ${p.name}`)
      onClose()
    } catch {
      setErrore('Non salvata: riprova')
      setSalvo(false)
    }
  }

  return (
    <Modal title="Nuova cosa da fare" size="narrow" onClose={onClose} footer={
      <>
        <button type="button" className="btn" onClick={onClose}>Annulla</button>
        <button type="submit" form="nuova-cosa" className="btn btn-primary" disabled={salvo}>{salvo ? 'Salvo…' : 'Aggiungi'}</button>
      </>
    }>
      <form id="nuova-cosa" className="modal-body stack" onSubmit={salva}>
        <label className="stack" style={{ gap: 4 }}>
          <span className="small muted">Cosa</span>
          <input value={testo} onChange={e => setTesto(e.target.value)} maxLength={500} placeholder="Es. chiamare il commercialista" />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          <span className="small muted">Progetto</span>
          <select value={progettoId} onChange={e => setProgettoId(e.target.value)}>
            {progetti.map(p => <option key={p.id} value={p.id}>{p.pinned ? '★ ' : ''}{p.name}</option>)}
          </select>
        </label>
        <label className="stack" style={{ gap: 4 }}>
          <span className="small muted">Entro il (facoltativo)</span>
          <input type="date" value={data} onChange={e => setData(e.target.value)} />
        </label>
        {errore && <p className="small" role="alert">{errore}</p>}
      </form>
    </Modal>
  )
}
