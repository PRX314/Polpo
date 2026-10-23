import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Download, ImagePlus, Loader, NotebookPen, PenLine, Play, Plus, RotateCcw, TextQuote, Trash2 } from 'lucide-react'
import VoiceRecorder from '../components/VoiceRecorder'
import Lavagna from '../components/appunti/Lavagna'
import { preparaFoto, SFONDI } from '../components/appunti/disegno'
import { useData } from '../context/useData'
import { useToast } from '../context/useToast'
import { download } from '../services/localDocuments'
import { salvaNelVault } from '../services/chatService'
import { relativeDay, toIso } from '../lib/dates'
import { progettiCitati, suggerisci, tagDi, tagInCorso, testoAppunto } from '../lib/hashtag'
import {
  GIORNI_CESTINO, aggiornaAppunto, aggiungiBlocco, aggiungiRegistrazione, aggiornaBlocco, creaAppunto, eliminaFile, eliminaPerSempre,
  leggiFile, nelCestino, nuovoId, ripristina, salvaFile, sostituisciBlocco, subscribeToAppunti, svuotaScaduti, togliBlocco, trascrivi
} from '../services/appuntiService'
import './AppuntiPage.css'

// Appunti: testo libero, registrazioni con la trascrizione, disegni su foglio o sopra una foto.
// Tutto sincronizzato tra telefono e PC (vedi appuntiService). Eliminare manda nel cestino.

const quando = (d) => new Date(d).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const titoloDi = (a) => a.title?.trim() || a.text?.trim().split('\n')[0].slice(0, 80) || 'Senza titolo'
const conta = (a, type) => a.blocks.filter(b => b.type === type).length
const peso = (n) => (n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} kB` : `${(n / 1024 / 1024).toFixed(1)} MB`)
const nomeFile = (s) => s.replace(/[^\p{L}\p{N} _-]/gu, '_').slice(0, 80) || 'appunto'

export default function AppuntiPage() {
  const { id } = useParams()
  const [appunti, setAppunti] = useState(null)
  const [errore, setErrore] = useState('')
  useEffect(() => subscribeToAppunti(setAppunti, () => setErrore('Non riesco a leggere gli appunti. Controlla la connessione.')), [])
  if (errore && !appunti) return <p role="alert">{errore}</p>
  return id ? <Dettaglio key={id} id={id} appunti={appunti} /> : <Elenco appunti={appunti} />
}

function Elenco({ appunti }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { items } = useData()
  const [cerca, setCerca] = useState('')
  const [cestino, setCestino] = useState(false)
  const [occupato, setOccupato] = useState(false)
  const pulito = useRef(false)

  useEffect(() => {
    if (appunti && !pulito.current) { pulito.current = true; svuotaScaduti(appunti) }
  }, [appunti])

  const lista = useMemo(() => (appunti || [])
    .filter(a => (cestino ? !!a.deletedAt : !a.deletedAt))
    .filter(a => `${a.title} ${a.text} ${a.blocks.map(b => b.trascrizione || '').join(' ')}`.toLowerCase().includes(cerca.toLowerCase())),
  [appunti, cestino, cerca])
  const nelCestinoN = (appunti || []).filter(a => a.deletedAt).length

  const nuovo = async (extra) => {
    setOccupato(true)
    try {
      const id = await creaAppunto(extra)
      return id
    } catch {
      toast.err('Non sono riuscito a creare l\'appunto')
      return null
    } finally { setOccupato(false) }
  }
  const registrato = async (file, inizio) => {
    const id = await nuovo({ title: `Nota vocale · ${quando(inizio)}` })
    if (!id) return
    aggiungiRegistrazione(id, file, inizio).catch(() => {})
    navigate(`/appunti/${id}`)
  }

  return (
    <div className="stack ap-page">
      <header className="page-head">
        <div>
          <h1>Appunti</h1>
          <p className="sub">Testo, voce e disegni. Li ritrovi uguali sul telefono e sul PC.</p>
        </div>
        <div className="page-actions">
          <VoiceRecorder disabled={occupato} onRecorded={registrato} />
          <button className="btn btn-primary" disabled={occupato} onClick={async () => { const id = await nuovo(); if (id) navigate(`/appunti/${id}`) }}><Plus size={15} /> Nuovo appunto</button>
        </div>
      </header>

      <div className="ap-filtri">
        <input type="search" placeholder="Cerca nei titoli, nei testi e nelle trascrizioni…" aria-label="Cerca negli appunti" value={cerca} onChange={e => setCerca(e.target.value)} />
        <div className="seg" role="group" aria-label="Quali appunti">
          <button style={{ width: 'auto', padding: '0 12px' }} className={!cestino ? 'is-on' : ''} aria-pressed={!cestino} onClick={() => setCestino(false)}>Appunti</button>
          <button style={{ width: 'auto', padding: '0 12px' }} className={cestino ? 'is-on' : ''} aria-pressed={cestino} onClick={() => setCestino(true)}>Cestino{nelCestinoN ? ` (${nelCestinoN})` : ''}</button>
        </div>
      </div>
      {cestino && <p className="small muted">Gli appunti nel cestino spariscono da soli dopo {GIORNI_CESTINO} giorni, con le loro registrazioni e i disegni.</p>}

      {appunti === null ? <p className="muted">Carico gli appunti…</p>
        : !lista.length ? (
          <section className="card">
            <h2>{cestino ? 'Il cestino è vuoto' : cerca ? 'Nessun appunto trovato' : 'Ancora nessun appunto'}</h2>
            {!cestino && !cerca && <p className="muted">Scrivi, registra la voce (la trascrizione arriva da sola) o disegna, anche sopra una foto.</p>}
          </section>
        ) : (
          <div className="ap-lista">
            {lista.map(a => cestino ? (
              <div className="card ap-card" key={a.id}>
                <h2>{titoloDi(a)}</h2>
                <p className="small muted">Eliminato {relativeDay(toIso(new Date(a.deletedAt))).text}</p>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => ripristina(a.id).then(() => toast.ok('Appunto ripristinato'))}><RotateCcw size={14} /> Ripristina</button>
                  <button className="btn btn-sm" onClick={() => { if (window.confirm('Eliminare per sempre? Non si potrà recuperare.')) eliminaPerSempre(a).then(() => toast.ok('Eliminato per sempre')) }}><Trash2 size={14} /> Elimina per sempre</button>
                </div>
              </div>
            ) : (
              <Link className="card ap-card" to={`/appunti/${a.id}`} key={a.id}>
                <h2>{titoloDi(a)}</h2>
                <p className="small muted">
                  {quando(a.updatedAt)}
                  {conta(a, 'audio') > 0 && ` · ${conta(a, 'audio')} registrazion${conta(a, 'audio') === 1 ? 'e' : 'i'}`}
                  {conta(a, 'disegno') > 0 && ` · ${conta(a, 'disegno')} disegn${conta(a, 'disegno') === 1 ? 'o' : 'i'}`}
                </p>
                <p className="ap-estratto">{a.text?.trim() || a.blocks.find(b => b.trascrizione)?.trascrizione || ''}</p>
                <ProgettiCollegati progetti={progettiCitati(testoAppunto(a), items)} link={false} />
              </Link>
            ))}
          </div>
        )}
    </div>
  )
}

function Dettaglio({ id, appunti }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { items } = useData()
  const a = appunti?.find(x => x.id === id)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [stato, setStato] = useState('')
  const [lavagna, setLavagna] = useState(null) // { blocco?, iniziale }
  const [cursore, setCursore] = useState(null)
  const [alVault, setAlVault] = useState('') // '' | 'invio' | 'fatto'
  const area = useRef(null)
  const collegati = useMemo(() => progettiCitati(`${title}\n${text}`, items), [title, text, items])
  const inCorso = cursore === null ? null : tagInCorso(text, cursore)
  const proposte = inCorso ? suggerisci(inCorso.parziale, items) : []
  const iniziato = useRef(false)
  const ultimo = useRef({ title: '', text: '' })
  const inAttesa = useRef(false)

  // Titolo e testo si caricano una volta: poi comanda quello che scrivi qui
  useEffect(() => {
    if (a && !iniziato.current) {
      iniziato.current = true
      setTitle(a.title || ''); setText(a.text || '')
      ultimo.current = { title: a.title || '', text: a.text || '' }
    }
  }, [a])

  // Salvataggio automatico dopo una pausa di scrittura, e comunque uscendo
  useEffect(() => {
    if (!iniziato.current || (title === ultimo.current.title && text === ultimo.current.text)) return
    inAttesa.current = true
    setStato('modificato')
    const t = setTimeout(() => {
      ultimo.current = { title, text }
      inAttesa.current = false
      aggiornaAppunto(id, { title, text }).then(() => setStato('salvato')).catch(() => setStato('errore'))
    }, 700)
    return () => clearTimeout(t)
  }, [title, text, id])
  const valori = useRef({ title, text })
  valori.current = { title, text }
  useEffect(() => () => { if (inAttesa.current) aggiornaAppunto(id, valori.current).catch(() => {}) }, [id])

  if (appunti === null) return <p className="muted">Carico l'appunto…</p>
  if (!a) return (
    <div className="stack">
      <Link to="/appunti" className="btn ap-indietro"><ArrowLeft size={15} /> Appunti</Link>
      <section className="card"><h2>Appunto non trovato</h2><p className="muted">Forse è stato eliminato per sempre.</p></section>
    </div>
  )

  const aggiungiAlTesto = (testo) => {
    setText(t => (t.trim() ? `${t.replace(/\s+$/, '')}\n\n${testo}` : testo))
    toast.ok('Aggiunto al testo')
  }

  const apriFoto = async (file) => {
    try {
      const f = await preparaFoto(file)
      setLavagna({ iniziale: { tratti: [], sfondo: 'foto', foto: f.blob } })
    } catch {
      toast.err('Questa foto non si apre qui. Prova con un JPEG o uno screenshot.')
    }
  }

  const apriDisegno = async (b) => {
    try {
      const [tratti, foto] = await Promise.all([leggiFile(b.tratti).then(bl => bl.text()).then(JSON.parse), b.foto ? leggiFile(b.foto) : null])
      setLavagna({ blocco: b, iniziale: { tratti, sfondo: b.sfondo, foto } })
    } catch (e) {
      toast.err(e.message || 'Non riesco ad aprire il disegno')
    }
  }

  const salvaDisegno = async ({ tratti, sfondo, foto, immagine }) => {
    const vecchio = lavagna.blocco
    const stessaFoto = vecchio?.foto && foto && foto === lavagna.iniziale.foto
    const blocco = {
      id: vecchio?.id || nuovoId(), type: 'disegno', sfondo, createdAt: vecchio?.createdAt || new Date().toISOString(),
      file: salvaFile(id, immagine).meta,
      tratti: salvaFile(id, new Blob([JSON.stringify(tratti)], { type: 'application/json' })).meta,
      foto: foto ? (stessaFoto ? vecchio.foto : salvaFile(id, foto).meta) : null
    }
    if (vecchio) {
      sostituisciBlocco(id, blocco).catch(() => toast.err('Disegno non salvato'))
      ;[vecchio.file, vecchio.tratti, stessaFoto ? null : vecchio.foto].filter(Boolean).forEach(m => eliminaFile(m).catch(() => {}))
    } else {
      aggiungiBlocco(id, blocco).catch(() => toast.err('Disegno non salvato'))
    }
    setLavagna(null)
  }

  const togli = (b) => {
    if (!window.confirm(b.type === 'audio' ? 'Eliminare questa registrazione?' : 'Eliminare questo disegno?')) return
    togliBlocco(id, b.id).catch(() => toast.err('Non sono riuscito a toglierlo'))
    ;[b.file, b.tratti, b.foto].filter(Boolean).forEach(m => eliminaFile(m).catch(() => {}))
  }

  const scaricaTesto = () => {
    const trascrizioni = a.blocks.filter(b => b.trascrizione).map(b => `[${quando(b.createdAt)}] ${b.trascrizione}`).join('\n\n')
    const corpo = `${title || 'Senza titolo'}\n${'='.repeat(40)}\n\n${text}${trascrizioni ? `\n\nTRASCRIZIONI\n\n${trascrizioni}` : ''}\n`
    download(new Blob([corpo], { type: 'text/plain;charset=utf-8' }), `${nomeFile(title || 'appunto')}.txt`)
  }

  // Completa il #parola che stai scrivendo col tag del progetto scelto
  const completaTag = (p) => {
    const tag = `${tagDi(p)} `
    const prima = text.slice(0, inCorso.inizio)
    const dopo = text.slice(cursore).replace(/^[\p{L}\p{N}_-]*\s?/u, '')
    setText(prima + tag + dopo)
    const pos = prima.length + tag.length
    setCursore(pos)
    requestAnimationFrame(() => { area.current?.focus(); area.current?.setSelectionRange(pos, pos) })
  }

  // L'appunto fa anche da "pensiero al volo": una copia va in 00-Inbox/Gestionale X del vault
  const mandaAlVault = () => {
    const trascrizioni = a.blocks.filter(b => b.trascrizione).map(b => b.trascrizione)
    const legami = collegati.map(p => `[[${p.vaultNote || p.name}]]`).join(' · ')
    const testo = [text.trim(), ...trascrizioni, legami && `Progetti: ${legami}`].filter(Boolean).join('\n\n')
    if (!testo) return toast.err('L\'appunto è vuoto: scrivi qualcosa prima')
    setAlVault('invio')
    salvaNelVault({ testo, titolo: title.trim() || undefined, tipo: 'appunto' })
      .then(() => { setAlVault('fatto'); toast.ok('Nel vault, in 00-Inbox') })
      .catch(e => { setAlVault(''); toast.err(e.message || 'Non è arrivato al vault') })
  }

  const cestina = () => {
    nelCestino(id).catch(() => {})
    toast.ok(`Nel cestino: lo puoi ripristinare per ${GIORNI_CESTINO} giorni`)
    navigate('/appunti')
  }

  return (
    <div className="stack ap-page">
      <div className="row ap-testa">
        <Link to="/appunti" className="btn ap-indietro"><ArrowLeft size={15} /> Appunti</Link>
        <span className="grow small muted" role="status">{{ modificato: 'Modifiche…', salvato: 'Salvato', errore: 'Non salvato: riprovo alla prossima modifica' }[stato] || ''}</span>
        <button className="btn btn-sm" onClick={mandaAlVault} disabled={alVault === 'invio'} title="Una copia in 00-Inbox del vault">
          {alVault === 'fatto' ? <><Check size={14} /> Nel vault</> : <><NotebookPen size={14} /> {alVault === 'invio' ? 'Invio…' : 'Al vault'}</>}
        </button>
        <button className="btn btn-sm" onClick={scaricaTesto}><Download size={14} /> Testo</button>
        <button className="btn btn-sm" onClick={cestina}><Trash2 size={14} /> Cestino</button>
      </div>

      <input className="ap-titolo" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo" aria-label="Titolo dell'appunto" />

      <div className="row ap-azioni">
        <VoiceRecorder onRecorded={(file, inizio) => aggiungiRegistrazione(id, file, inizio).catch(() => toast.err('Registrazione non salvata'))} />
        <button className="btn" onClick={() => setLavagna({ iniziale: { tratti: [], sfondo: 'bianco' } })}><PenLine size={16} /> Disegna</button>
        <label className="btn ap-file">
          <ImagePlus size={16} /> Foto da annotare
          <input type="file" accept="image/*" aria-label="Foto da annotare" onChange={e => { const f = e.target.files[0]; e.target.value = ''; if (f) apriFoto(f) }} />
        </label>
      </div>

      <textarea
        ref={area} className="ap-testo" value={text} rows={10}
        placeholder="Scrivi qui… Con #NomeProgetto lo colleghi a un progetto" aria-label="Testo dell'appunto"
        onChange={e => { setText(e.target.value); setCursore(e.target.selectionStart) }}
        onSelect={e => setCursore(e.target.selectionStart)}
        onBlur={() => setTimeout(() => setCursore(null), 200)}
      />
      {proposte.length > 0 && (
        <div className="chips ap-proposte" role="group" aria-label="Collega a un progetto">
          {proposte.map(p => (
            <button key={p.id} type="button" className="chip" onMouseDown={e => e.preventDefault()} onClick={() => completaTag(p)}>{tagDi(p)}</button>
          ))}
        </div>
      )}
      <ProgettiCollegati progetti={collegati} />

      {a.blocks.length > 0 && (
        <div className="ap-blocchi">
          {a.blocks.map(b => b.type === 'audio'
            ? <BloccoAudio key={b.id} b={b} noteId={id} onAggiungi={aggiungiAlTesto} onTogli={() => togli(b)} />
            : <BloccoDisegno key={b.id} b={b} onApri={() => apriDisegno(b)} onTogli={() => togli(b)} />)}
        </div>
      )}

      {lavagna && <Lavagna iniziale={lavagna.iniziale} onSalva={salvaDisegno} onChiudi={() => setLavagna(null)} />}
    </div>
  )
}

// I progetti citati con #: nel dettaglio portano al progetto, nell'elenco (già dentro un link) sono solo etichette
function ProgettiCollegati({ progetti, link = true }) {
  if (!progetti.length) return null
  return (
    <div className="row ap-collegati">
      <span className="small muted">Collegato a</span>
      {progetti.map(p => (link
        ? <Link key={p.id} to={`/elementi/${p.id}`} className="tag">{p.name}</Link>
        : <span key={p.id} className="tag">{p.name}</span>))}
    </div>
  )
}

function useFile(meta, subito) {
  const [url, setUrl] = useState('')
  const [errore, setErrore] = useState('')
  const [chiesto, setChiesto] = useState(subito)
  useEffect(() => {
    if (!chiesto || !meta) return
    let vivo = true, creato = ''
    leggiFile(meta).then(blob => { if (vivo) { creato = URL.createObjectURL(blob); setUrl(creato) } }).catch(e => vivo && setErrore(e.message))
    return () => { vivo = false; if (creato) URL.revokeObjectURL(creato) }
  }, [meta, chiesto])
  return { url, errore, carica: () => setChiesto(true) }
}

function BloccoAudio({ b, noteId, onAggiungi, onTogli }) {
  const { url, errore, carica } = useFile(b.file, false)
  const [riprovo, setRiprovo] = useState(false)
  const toast = useToast()
  const riprova = async () => {
    setRiprovo(true)
    try {
      const blob = await leggiFile(b.file)
      await aggiornaBlocco(noteId, b.id, { stato: 'trascrivo', errore: '' })
      const testo = await trascrivi(blob)
      await aggiornaBlocco(noteId, b.id, { trascrizione: testo, stato: testo ? 'ok' : 'vuota', errore: '' })
    } catch (e) {
      await aggiornaBlocco(noteId, b.id, { stato: 'errore', errore: e.message }).catch(() => {})
    } finally { setRiprovo(false) }
  }
  return (
    <section className="card ap-blocco">
      <div className="row">
        <span className="tag">Registrazione</span>
        <span className="grow small muted">{quando(b.createdAt)} · {peso(b.file.size)}</span>
        <button className="btn-icon sm" onClick={onTogli} aria-label="Elimina la registrazione"><Trash2 size={15} /></button>
      </div>
      {url ? <audio controls autoPlay src={url} className="ap-audio" aria-label="Ascolta la registrazione" />
        : <button className="btn btn-sm ap-ascolta" onClick={carica}><Play size={14} /> Ascolta</button>}
      {errore && <p className="small" role="alert">{errore}</p>}
      {b.stato === 'trascrivo' || riprovo ? <p className="small muted ap-attesa"><Loader size={14} /> Trascrivo…</p>
        : b.stato === 'errore' ? (
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <p className="small grow" role="alert">{b.errore}</p>
            <button className="btn btn-sm" onClick={riprova}><RotateCcw size={14} /> Riprova la trascrizione</button>
          </div>
        ) : b.stato === 'vuota' ? <p className="small muted">Non ho sentito parole in questa registrazione.</p>
        : b.trascrizione ? (
          <>
            <p className="ap-trascrizione">{b.trascrizione}</p>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <button className="btn btn-sm" onClick={() => onAggiungi(b.trascrizione)}><TextQuote size={14} /> Aggiungi al testo</button>
              <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(b.trascrizione).then(() => toast.ok('Copiato'), () => toast.err('Copia non riuscita'))}><Copy size={14} /> Copia</button>
            </div>
          </>
        ) : null}
    </section>
  )
}

function BloccoDisegno({ b, onApri, onTogli }) {
  const { url, errore } = useFile(b.file, true)
  return (
    <section className="card ap-blocco">
      <div className="row">
        <span className="tag">Disegno{b.sfondo && b.sfondo !== 'bianco' ? ` · ${SFONDI[b.sfondo] || b.sfondo}` : ''}</span>
        <span className="grow small muted">{quando(b.createdAt)}</span>
        <button className="btn-icon sm" onClick={onTogli} aria-label="Elimina il disegno"><Trash2 size={15} /></button>
      </div>
      <button className="ap-disegno" onClick={onApri} aria-label="Apri il disegno per modificarlo">
        {url ? <img src={url} alt="Disegno" /> : <span className="small muted">{errore || 'Carico il disegno…'}</span>}
      </button>
    </section>
  )
}
