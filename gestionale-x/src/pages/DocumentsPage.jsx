import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Camera, Download, FilePlus, ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { auth } from '../firebase'
import { useData } from '../context/useData'
import { attachments, CATEGORIES, deleteDocument, download, exportBackup, loadDocument, newDocument, restoreBackup, saveDocument, textReport } from '../services/localDocuments'
import { readDocument } from '../services/readDocument'
import './DocumentsPage.css'

// Modifiche non salvate lasciate uscendo col tasto Indietro: tornando sul documento vengono riproposte.
// Restano solo in memoria; ricaricare o chiudere la pagina passa dall'avviso del browser.
const drafts = new Map()
const fail = e => e?.name === 'QuotaExceededError' ? 'Spazio sul dispositivo esaurito. Scarica un backup e libera spazio prima di riprovare.' : (e?.message || 'Operazione non riuscita.')
const fileName = title => title.replace(/[^\p{L}\p{N} _-]/gu, '_').slice(0, 90) || 'documento'
const StorageNotice = () => <p className="doc-notice small">Archivio di questo dispositivo e browser. I documenti non vengono sincronizzati: scarica un backup prima di cancellare i dati del browser o cambiare dispositivo. Le scadenze locali compaiono in agenda, senza notifiche ad app chiusa.</p>
const PickFile = ({ camera, onFiles, disabled, multiple = true }) => <label className={`btn ${camera ? 'btn-primary' : ''} doc-pick`}>
  {camera ? <Camera size={16} /> : <FilePlus size={16} />}{camera ? 'Scatta foto' : 'Aggiungi file'}
  <input type="file" aria-label={camera ? 'Scatta foto' : 'Aggiungi file'} capture={camera ? 'environment' : undefined} accept={camera ? 'image/*' : undefined} multiple={!camera && multiple} disabled={disabled} onChange={e => { const files = Array.from(e.target.files); e.target.value = ''; if (files.length) onFiles(files) }} />
</label>
const Preview = ({ file }) => {
  const [url, setUrl] = useState('')
  useEffect(() => { const value = URL.createObjectURL(file.blob); setUrl(value); return () => URL.revokeObjectURL(value) }, [file.blob])
  return <div className="doc-file">
    {url && /^image\/(jpeg|png|webp|gif|bmp)$/.test(file.type) && <img src={url} alt={file.name} />}
    <span className="grow">{file.name}<small className="muted"> {(file.size / 1024 / 1024).toFixed(1)} MB</small></span>
    <button type="button" className="btn btn-sm" onClick={() => download(file.blob, file.name)}><Download size={14} /> Originale</button>
  </div>
}

export default function DocumentsPage() {
  const { id } = useParams()
  return id ? <DocumentDetail key={id} id={id} /> : <DocumentList />
}
function DocumentList() {
  const { documents = [], documentsError, documentsLoading } = useData()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('tutti')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const restoreRef = useRef()
  const run = async fn => { setBusy(true); setError(''); setMessage(''); try { await fn() } catch (e) { setError(fail(e)) } finally { setBusy(false) } }
  const create = files => run(async () => {
    const row = newDocument(params.get('elemento') || '')
    row.files = attachments(files)
    if (files.length) row.title = files[0].name.replace(/\.[^.]+$/, '')
    await saveDocument(auth.currentUser.uid, row)
    navigator.storage?.persist?.().catch(() => {})
    navigate(`/documenti/${row.id}${files.length ? '?leggi=1' : ''}`)
  })
  const list = documents.filter(d => (status === 'tutti' || d.status === status) && (!params.get('elemento') || d.projectId === params.get('elemento')) && `${d.title} ${d.category} ${d.summary} ${d.text} ${d.objective}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="stack doc-page">
    <header className="page-head"><div><h1>Documenti e file</h1><p className="sub">Originali, testi e scadenze, nello stesso posto.</p></div><div className="page-actions"><PickFile camera disabled={busy} onFiles={create} /><PickFile disabled={busy} onFiles={create} /><button className="btn" disabled={busy} onClick={() => create([])}>Solo testo</button></div></header>
    <StorageNotice />
    <div className="row row-wrap">
      <button className="btn" disabled={busy || !documents.length} onClick={() => run(async () => { download(await exportBackup(auth.currentUser.uid), `gestionale-documenti-${new Date().toISOString().slice(0, 10)}.json`); setMessage('Backup preparato: conserva il file scaricato, contiene anche tutti gli originali. Non è cifrato.') })}><Download size={15} /> Backup completo</button>
      <button className="btn" disabled={busy} onClick={() => restoreRef.current.click()}>Ripristina backup</button>
      <input ref={restoreRef} hidden type="file" accept="application/json,.json" onChange={e => { const file = e.target.files[0]; e.target.value = ''; if (file) run(async () => { const result = await restoreBackup(auth.currentUser.uid, file); setMessage(`${result.restored} documenti ripristinati, ${result.skipped} già presenti lasciati invariati.`) }) }} />
      <span className="small muted">Il ripristino aggiunge i documenti mancanti senza sovrascrivere quelli presenti.</span>
    </div>
    {(error || documentsError) && <p role="alert">{error || documentsError}</p>}
    <p role="status" className="small muted">{busy ? 'Operazione in corso…' : message}</p>
    <div className="doc-filters"><input type="search" placeholder="Cerca nei titoli e nei testi…" aria-label="Cerca documenti" value={query} onChange={e => setQuery(e.target.value)} /><select aria-label="Filtra stato" value={status} onChange={e => setStatus(e.target.value)}><option value="tutti">Tutti</option><option value="aperto">Da gestire</option><option value="chiuso">Chiusi</option></select></div>
    {params.get('elemento') && <Link to="/documenti" className="small">Mostra tutti i documenti</Link>}
    {documentsLoading ? <p>Carico l’archivio locale…</p> : !list.length ? <section className="card"><h2>Nessun documento{query ? ' trovato' : ''}</h2><p className="muted">Scatta una foto o aggiungi un file. Puoi conservare anche PDF, ricevute e allegati di altro tipo.</p></section> : <div className="doc-list">{list.map(d => <Link className="card doc-card" to={`/documenti/${d.id}`} key={d.id}><div className="row"><span className="tag">{d.category}</span><span className="small muted">{d.status === 'chiuso' ? 'Chiuso' : 'Da gestire'}</span></div><h2>{d.title}</h2><p className="small muted">{d.fileCount} allegati · {d.deadlines.filter(s => !s.done).length} scadenze aperte</p><p className="doc-excerpt">{d.summary || 'Apri per leggere e completare i dati.'}</p></Link>)}</div>}
  </div>
}
function DocumentDetail({ id }) {
  const owner = auth.currentUser.uid
  const { items } = useData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const autoRead = useRef(params.get('leggi') === '1')
  const draftKey = `${owner}:${id}`
  // La bozza entra nello stato iniziale: regge anche il doppio montaggio di StrictMode.
  const [doc, setDoc] = useState(() => drafts.get(draftKey) || null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(() => drafts.has(draftKey) ? 'Ho recuperato le modifiche non salvate: salvale, oppure esci per scartarle.' : '')
  const [dirty, setDirty] = useState(() => drafts.has(draftKey))
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty
  const docRef = useRef(null)
  docRef.current = doc
  useEffect(() => {
    if (drafts.has(draftKey)) { drafts.delete(draftKey); return }
    let active = true
    loadDocument(owner, id).then(row => { if (active) { setDoc(row || false); if (!row) setError('Documento non presente su questo dispositivo. Puoi ripristinarlo dal backup.') } }).catch(e => setError(fail(e)))
    return () => { active = false }
  }, [owner, id, draftKey])
  // Uscita senza passare da un link (tasto Indietro, swipe): conserva la bozza invece di perderla.
  useEffect(() => () => { if (dirtyRef.current && docRef.current) drafts.set(draftKey, docRef.current) }, [draftKey])
  useEffect(() => {
    const beforeUnload = e => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = '' } }
    const beforeNavigate = e => {
      if (!dirtyRef.current || !e.target.closest('a[href]')) return
      if (window.confirm('Ci sono modifiche non salvate. Vuoi uscire senza salvarle?')) dirtyRef.current = false
      else { e.preventDefault(); e.stopPropagation() }
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', beforeNavigate, true)
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', beforeNavigate, true) }
  }, [])
  const edit = patch => { setDoc(d => ({ ...d, ...patch })); setDirty(true) }
  const persist = async row => { const saved = await saveDocument(owner, row); setDoc(saved); setDirty(false); return saved }
  const run = async fn => { setBusy(true); setError(''); try { await fn() } catch (e) { setError(fail(e)) } finally { setBusy(false) } }
  const read = async row => {
    setProgress('Preparo la lettura locale…')
    const result = await readDocument(row.files, setProgress)
    if (result.text) await persist({ ...row, text: result.text, summary: !row.summary || row.summary === row.text ? result.text : row.summary })
    setProgress(result.warnings.join(' ') || (result.text ? 'Testo letto. Verifica il riepilogo e le scadenze con gli originali.' : 'Nessun testo riconosciuto. Puoi inserirlo a mano.'))
  }
  useEffect(() => {
    if (!doc || !autoRead.current) return
    autoRead.current = false
    setParams({}, { replace: true })
    run(() => read(doc))
    // Una sola lettura al primo ingresso; non rilanciare quando cambia il testo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc])
  const addFiles = files => run(async () => {
    const saved = await persist({ ...doc, files: [...doc.files, ...attachments(files)] })
    setProgress('Originali salvati. Premi “Leggi gli originali” per aggiornare il testo.')
    return saved
  })
  if (!doc) return <div className="stack"><Link to="/documenti">← Documenti</Link><p role={error ? 'alert' : 'status'}>{error || 'Apro il documento…'}</p></div>
  const project = items.find(p => p.id === doc.projectId)
  return <div className="stack doc-page">
    <Link to="/documenti" className="btn btn-quiet doc-back"><ArrowLeft size={15} /> Documenti</Link>
    <header className="page-head"><div><h1>{doc.title}</h1><p className="sub">{dirty ? 'Modifiche da salvare' : 'Salvato su questo dispositivo'}</p></div><button className="btn btn-primary" disabled={busy || !dirty} onClick={() => run(() => persist(doc))}>Salva modifiche</button></header>
    <StorageNotice />
    {error && <p role="alert">{error}</p>}
    <p role="status" className="small muted">{busy ? progress || 'Salvataggio…' : progress}</p>
    <fieldset disabled={busy} className="doc-fieldset stack">
      <section className="card stack">
        <h2>Dati e collegamenti</h2>
        <label className="doc-label">Titolo<input maxLength={300} value={doc.title} onChange={e => edit({ title: e.target.value })} /></label>
        <div className="doc-filters"><label className="doc-label">Tipo<select value={doc.category} onChange={e => edit({ category: e.target.value })}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label><label className="doc-label">Stato<select value={doc.status} onChange={e => edit({ status: e.target.value })}><option value="aperto">Da gestire</option><option value="chiuso">Chiuso / pagato</option></select></label></div>
        <label className="doc-label">Elemento o progetto collegato<select value={doc.projectId} onChange={e => edit({ projectId: e.target.value })}><option value="">Nessuno</option>{doc.projectId && !project && <option value={doc.projectId}>Elemento non disponibile</option>}{items.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        {project && <Link to={`/elementi/${project.id}`} className="small">Apri {project.name}</Link>}
        <label className="doc-label">Obiettivo di riferimento<input maxLength={2000} value={doc.objective} placeholder="Es. Spese della casa / rinnovo contratto" onChange={e => edit({ objective: e.target.value })} /></label>
      </section>
      <section className="card stack"><h2>Originali</h2><p className="small muted">Fino a 20 MB per file. Il download conserva il file ricevuto, senza conversioni.</p><div className="row row-wrap"><PickFile camera onFiles={addFiles} /><PickFile onFiles={addFiles} /><button className="btn" disabled={!doc.files.length} onClick={() => { if (doc.text && !window.confirm('Rileggere gli originali sostituirà il testo estratto. Il riepilogo modificato resterà invariato. Continuare?')) return; run(async () => { const saved = await persist(doc); await read(saved) }) }}>Leggi gli originali</button></div><p className="small muted">Foto JPG/PNG/WebP (HEIC su iPhone), PDF e testo: lettura sul dispositivo. Al primo uso serve una connessione per scaricare il motore OCR. Altri formati vengono conservati come allegati.</p>{doc.files.map(f => <Preview key={f.id} file={f} />)}</section>
      <section className="card stack"><h2>Riepilogo e testo</h2><p className="small muted">La prima lettura riporta il contenuto riconosciuto nel riepilogo. Puoi riorganizzarlo e correggerlo; confronta sempre importi e date con l’originale.</p><label className="doc-label">Riepilogo dettagliato<textarea rows={10} maxLength={2000000} value={doc.summary} onChange={e => edit({ summary: e.target.value })} /></label><details><summary>Testo integrale riconosciuto</summary><textarea aria-label="Testo integrale riconosciuto" rows={12} maxLength={2000000} value={doc.text} onChange={e => edit({ text: e.target.value })} /></details><button className="btn doc-back" onClick={() => run(async () => { await persist(doc); download(new Blob([textReport(doc, project?.name)], { type: 'text/plain;charset=utf-8' }), `${fileName(doc.title)}.txt`) })}><Download size={15} /> Scarica testo completo</button></section>
      <section className="card stack"><h2>Scadenze confermate</h2><p className="small muted">Aggiungi date verificate per mostrarle in Oggi e Calendario su questo dispositivo. Segna le rate pagate; chiudendo il documento tutte le scadenze escono dall’agenda.</p>{doc.deadlines.map((s, i) => <div className="doc-deadline" key={s.id}><label className="doc-label">Descrizione<input maxLength={300} value={s.label} onChange={e => edit({ deadlines: doc.deadlines.map((x, k) => k === i ? { ...x, label: e.target.value } : x) })} /></label><label className="doc-label">Data<input type="date" value={s.date} onChange={e => edit({ deadlines: doc.deadlines.map((x, k) => k === i ? { ...x, date: e.target.value } : x) })} /></label><label className="doc-label">Importo €<input inputMode="decimal" maxLength={40} value={s.amount} onChange={e => edit({ deadlines: doc.deadlines.map((x, k) => k === i ? { ...x, amount: e.target.value } : x) })} /></label><label className="row small"><input type="checkbox" checked={s.done} onChange={e => edit({ deadlines: doc.deadlines.map((x, k) => k === i ? { ...x, done: e.target.checked } : x) })} /> Pagata / fatta</label><button className="btn-icon" aria-label={`Rimuovi scadenza ${s.label}`} onClick={() => edit({ deadlines: doc.deadlines.filter((_, k) => k !== i) })}><Trash2 size={16} /></button></div>)}<button className="btn doc-back" onClick={() => edit({ deadlines: [...doc.deadlines, { id: crypto.randomUUID(), date: '', label: 'Scadenza', amount: '', done: false }] })}><Plus size={15} /> Aggiungi scadenza</button></section>
      <div className="row row-wrap"><button className="btn btn-primary" disabled={!dirty} onClick={() => run(() => persist(doc))}>Salva modifiche</button><button className="btn" onClick={() => run(async () => { await persist(doc); download(await exportBackup(owner, id), `${fileName(doc.title)}-backup.json`) })}>Backup di questo documento</button><button className="btn" onClick={() => { if (window.confirm('Eliminare questo documento e tutti gli originali dal dispositivo? Per recuperarli servirà un backup già scaricato.')) run(async () => { await deleteDocument(owner, id); dirtyRef.current = false; navigate('/documenti') }) }}>Elimina documento</button></div>
    </fieldset>
  </div>
}
