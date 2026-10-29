import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/useData'
import { auth } from '../firebase'
import { renderMarkdown } from '../lib/markdown'
import { createEntry, editEntry, watchEditorial, watchTurns, watchVersions, saveTurn, askEditor } from '../services/editorialService'
import { useDraft } from '../components/editorial/useDraft'
import VoiceRecorder from '../components/VoiceRecorder'
import { attachments, newDocument, saveDocument, download } from '../services/localDocuments'
import { readDocument } from '../services/readDocument'
import './EditorialPage.css'

const base = '/editoriale'
const draftKey = id => `editorial:${auth.currentUser.uid}:${id}`
const titleOf = text => text.trim().split('\n')[0].slice(0, 100) || 'Nuovo ragionamento'
const STATI = ['Idea', 'In scrittura', 'Da registrare', 'Registrato', 'In montaggio', 'Pronto']
const blankContent = { title: '', script: '', outline: '', scenes: '', notes: '', voice: 'Da decidere', status: 'Idea' }
function ErrorNotice({ text }) { return text ? <p role="alert" className="ed-error">{text}</p> : null }
function Markdown({ text }) { return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} /> }

function Capture({ entries, run, busy }) {
  const navigate = useNavigate()
  const [text, change, clear, storageError] = useDraft(draftKey('capture'), '')
  const [destination, setDestination] = useState('')
  const [voiceStatus, setVoiceStatus] = useState('')
  const textRef = useRef(text)
  textRef.current = text
  const conversations = entries.filter(e => e.kind === 'conversation' && !e.archived)
  async function save(mode) {
    const original = text.trim()
    if (!original) return
    // Il blocco di invio impedisce duplicati da doppio clic.
    const id = crypto.randomUUID()
    await createEntry('spark', { title: titleOf(original), original, threadId: mode === 'attach' ? destination : '' }, id)
    clear('')
    if (mode === 'save') return
    const threadId = mode === 'attach' ? destination : await createEntry('conversation', { title: titleOf(original), summary: '', projectIds: [] })
    if (mode !== 'attach') await editEntry({ id, revision: 0 }, { threadId })
    // Lo spunto è salvato anche se il messaggio/AI dovesse fallire.
    const turnId = await saveTurn(threadId, original)
    navigate(`${base}/${threadId}`)
    await askEditor(threadId, turnId)
  }
  async function recorded(file) {
    const d = { ...newDocument(), category: 'Nota vocale', title: 'Spunto editoriale · ' + new Date().toLocaleString('it-IT'), files: attachments([file]) }
    await saveDocument(auth.currentUser.uid, d)
    const r = await readDocument(d.files, setVoiceStatus)
    await saveDocument(auth.currentUser.uid, { ...d, text: r.text, summary: r.text })
    if (r.text) change([textRef.current, r.text].filter(Boolean).join('\n\n').slice(0, 12000))
    setVoiceStatus(r.warnings.join(' ') || 'Trascrizione aggiunta. Originale audio conservato in Documenti su questo dispositivo.')
  }
  return <section className="ed-panel ed-capture">
    <div className="ed-eyebrow">Comincia da quello che hai in testa</div>
    <h2>Una frase, una scena, un’idea</h2>
    <label>Il tuo spunto<textarea maxLength={12000} value={text} onChange={e => change(e.target.value)} placeholder="Oggi mi va di raccontare… Ho già in mente questa apertura…" /></label>
    <ErrorNotice text={storageError} />
    <div className="ed-actions">
      <button className="btn btn-primary" disabled={busy || !text.trim()} onClick={() => run(() => save('save'))}>Salva spunto</button>
      <button className="btn" disabled={busy || !text.trim()} onClick={() => run(() => save('develop'))}>Ragioniamoci</button>
      <VoiceRecorder disabled={busy} onRecorded={file => run(() => recorded(file))} />
    </div>
    <details><summary>Aggiungi a un discorso già aperto</summary>
      <label>Conversazione di destinazione<select value={destination} onChange={e => setDestination(e.target.value)}>
        <option value="">Scegli una conversazione</option>
        {conversations.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select></label>
      <button className="btn" disabled={busy || !text.trim() || !destination} onClick={() => run(() => save('attach'))}>Aggiungi al lavoro</button>
    </details>
    {voiceStatus && <p className="small" role="status">{voiceStatus}</p>}
  </section>
}

function Overview({ entries, run, busy, projects }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showArchive, setShowArchive] = useState(false)
  const visible = entries.filter(e => Boolean(e.archived) === showArchive && `${e.title} ${e.original || ''} ${e.summary || ''} ${e.script || ''}`.toLowerCase().includes(search.toLowerCase()))
  const sparks = visible.filter(e => e.kind === 'spark')
  const conversations = visible.filter(e => e.kind === 'conversation')
  const contents = visible.filter(e => e.kind === 'content')
  const start = async () => navigate(`${base}/${await createEntry('conversation', { title: 'Regia · ' + new Date().toLocaleDateString('it-IT'), summary: '', projectIds: [] })}`)
  const develop = async spark => {
    let id = spark.threadId
    if (!entries.some(e => e.kind === 'conversation' && e.id === id)) {
      id = await createEntry('conversation', { title: spark.title, summary: '', projectIds: [] })
      await editEntry(spark, { threadId: id })
      await saveTurn(id, spark.original)
    }
    navigate(`${base}/${id}`)
  }
  return <>
    <Capture entries={entries} run={run} busy={busy} />
    <div className="ed-toolbar">
      <div><h2>Il filo dei tuoi lavori</h2><span className="ed-count">{conversations.length} conversazioni · {sparks.length} spunti · {contents.length} contenuti</span></div>
      <button className="btn" disabled={busy} onClick={() => run(start)}>Apri la regia</button>
    </div>
    <input className="ed-search" aria-label="Cerca nel laboratorio" type="search" placeholder="Cerca una frase, un progetto, un lavoro…" value={search} onChange={e => setSearch(e.target.value)} />
    <label className="ed-check"><input type="checkbox" checked={showArchive} onChange={e => setShowArchive(e.target.checked)} /> Mostra archivio</label>
    <div className="ed-content-grid">
      <section className="ed-panel"><h2>Conversazioni</h2><div className="ed-list">
        {!conversations.length && <p className="ed-empty">Apri la regia per scegliere da dove partire, oppure sviluppa uno spunto. Una conversazione può contenere più video.</p>}
        {conversations.map(c => <div key={c.id}><Link className="ed-list-item" to={`${base}/${c.id}`}><strong>{c.title}</strong><p>{(c.summary || 'Il discorso deve ancora cominciare.').slice(0, 180)}</p><span className="ed-count">{(c.projectIds || []).map(id => projects.find(p => p.id === id)?.name).filter(Boolean).join(' · ')}</span></Link>
          <button className="btn btn-quiet" disabled={busy} onClick={() => run(() => editEntry(c, { archived: !c.archived }))}>{c.archived ? 'Ripristina' : 'Archivia'} conversazione</button></div>)}
      </div></section>
      <section className="ed-panel"><h2>Spunti da ritrovare</h2><div className="ed-list">
        {!sparks.length && <p className="ed-empty">I ganci e le frasi raccolti al volo restano qui, nella tua versione originale.</p>}
        {sparks.map(s => <article className="ed-list-item" key={s.id}><p className="ed-original">{s.original}</p>
          <div className="ed-actions"><button className="btn" disabled={busy} onClick={() => run(() => develop(s))}>{s.threadId ? 'Riprendi il discorso' : 'Sviluppa'}</button>
            <button className="btn" disabled={busy} onClick={() => run(() => editEntry(s, { archived: !s.archived }))}>{s.archived ? 'Ripristina spunto' : 'Archivia spunto'}</button></div>
          {s.pending && <span role="status">In attesa di sincronizzazione</span>}
        </article>)}
      </div></section>
    </div>
    <section className="ed-panel"><h2>Contenuti in preparazione</h2><div className="ed-content-grid">
      {!contents.length && <p className="ed-empty">Le schede dei video nasceranno dentro le conversazioni.</p>}
      {contents.map(c => <Link className="ed-list-item" key={c.id} to={`${base}/${c.threadId}?contenuto=${c.id}`}><span className="ed-status">{c.status}</span><strong>{c.title}</strong><p>{c.outline || c.script?.slice(0, 140) || 'Da sviluppare'}</p></Link>)}
    </div></section>
  </>
}

function ContentEditor({ entry, onClose, run, busy }) {
  const fields = Object.fromEntries(Object.keys(blankContent).map(k => [k, entry[k] || blankContent[k]]))
  const [draft, change, clear, storageError] = useDraft(draftKey(`content:${entry.id}`), { ...fields, baseRevision: entry.revision || 0 })
  const [versions, setVersions] = useState([])
  const [historyError, setHistoryError] = useState('')
  useEffect(() => watchVersions(entry.id, setVersions, e => setHistoryError(e.message)), [entry.id])
  const field = (k, value) => change({ ...draft, [k]: value })
  const save = async () => {
    const patch = Object.fromEntries(Object.keys(blankContent).map(k => [k, draft[k] || '']))
    if (!patch.title.trim()) throw new Error('Dai un titolo al contenuto')
    await editEntry({ ...entry, revision: draft.baseRevision }, patch)
    clear({ ...draft, baseRevision: draft.baseRevision + 1 })
    onClose()
  }
  return <section className="ed-panel" aria-label="Scheda contenuto">
    <div className="ed-toolbar"><h2>Scheda del contenuto</h2><button className="btn" onClick={onClose}>Chiudi scheda</button></div>
    <ErrorNotice text={storageError || historyError} />
    <div className="ed-editor-fields">
      <label className="ed-wide">Titolo del contenuto<input maxLength={150} value={draft.title} onChange={e => field('title', e.target.value)} /></label>
      <label>Stato del contenuto<select value={draft.status} onChange={e => field('status', e.target.value)}>{STATI.map(s => <option key={s}>{s}</option>)}</select></label>
      <label>Come userai la voce<select value={draft.voice} onChange={e => field('voice', e.target.value)}>{['Da decidere', 'Voce fuori campo', 'Parlo mentre faccio', 'Misto'].map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="ed-wide">Testo completo<textarea rows={8} maxLength={20000} value={draft.script} onChange={e => field('script', e.target.value)} /></label>
      <label>Scaletta da parlare<textarea rows={5} maxLength={8000} value={draft.outline} onChange={e => field('outline', e.target.value)} /></label>
      <label>Scene da girare<textarea rows={5} maxLength={8000} value={draft.scenes} onChange={e => field('scenes', e.target.value)} /></label>
      <label className="ed-wide">Riprese, montaggio e materiali<textarea maxLength={10000} value={draft.notes} onChange={e => field('notes', e.target.value)} placeholder="Cosa hai già registrato, cosa manca, nomi o link dei file…" /></label>
    </div>
    <div className="ed-actions"><button className="btn btn-primary" disabled={busy} onClick={() => run(save)}>Salva contenuto</button>
      <button className="btn" onClick={() => download(new Blob([`${draft.title}\n\nTESTO\n${draft.script}\n\nSCALETTA\n${draft.outline}\n\nSCENE\n${draft.scenes}\n\nNOTE\n${draft.notes}`], { type: 'text/plain;charset=utf-8' }), `${draft.title.replace(/[<>:"/\\|?*]/g, '-').slice(0, 80) || 'contenuto'}.txt`)}>Scarica testo</button>
    </div>
    {draft.baseRevision !== (entry.revision || 0) && <p role="alert">C’è una versione più recente. La tua bozza è conservata. <button className="btn" onClick={() => clear({ ...fields, baseRevision: entry.revision || 0 })}>Carica versione salvata</button></p>}
    <details><summary>Versioni precedenti ({versions.length})</summary>{versions.map(v => <article className="ed-list-item" key={v.id}><strong>{v.title} · versione {(v.revision || 0) + 1}</strong><p>{v.script?.slice(0, 250)}</p><button className="btn" onClick={() => change({ ...draft, ...Object.fromEntries(Object.keys(blankContent).map(k => [k, v[k] || blankContent[k]])) })}>Riparti da questa versione</button></article>)}</details>
  </section>
}

function Conversation({ thread, entries, projects, run, busy }) {
  const [turns, setTurns] = useState([])
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now)
  const [text, change, clear, storageError] = useDraft(draftKey(`message:${thread.id}`), '')
  const [title, setTitle] = useState(thread.title)
  const [detailsOpen, setDetailsOpen] = useState(() => window.matchMedia('(min-width: 721px)').matches)
  const [contentId, setContentId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1]).get('contenuto') || '')
  const content = entries.find(e => e.kind === 'content' && e.id === contentId && e.threadId === thread.id)
  const contents = entries.filter(e => e.kind === 'content' && e.threadId === thread.id && !e.archived)
  useEffect(() => watchTurns(thread.id, setTurns, e => setError(e.message)), [thread.id])
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(timer)
  }, [])
  const send = async () => {
    const original = text.trim()
    if (!original) return
    const id = await saveTurn(thread.id, original)
    clear('')
    await askEditor(thread.id, id)
  }
  const newContent = async (script = '', sourceTurn = '') => {
    const id = await createEntry('content', { ...blankContent, title: `Contenuto ${contents.length + 1}`, script, threadId: thread.id, sourceTurn })
    setContentId(id)
  }
  const pending = turns.find(t => !t.reply)
  return <div className="ed-grid">
    <aside>
      <Link className="btn" to={base}>← Tutto il laboratorio</Link>
      <details className="ed-panel ed-context" open={detailsOpen} onToggle={e => setDetailsOpen(e.currentTarget.open)} style={{ marginTop: 16 }}>
        <summary>Riepilogo e contenuti ({contents.length})</summary>
        <div className="ed-eyebrow">Questo discorso</div>
        <label>Titolo della conversazione<input value={title} maxLength={150} onChange={e => setTitle(e.target.value)} /></label>
        <button className="btn" disabled={busy || !title.trim() || title === thread.title} onClick={() => run(() => editEntry(thread, { title: title.trim() }))}>Rinomina</button>
        <details><summary>Progetti collegati ({(thread.projectIds || []).length})</summary>
          {projects.filter(p => !p.archived).map(p => <label className="ed-check" key={p.id}><input type="checkbox" disabled={busy} checked={(thread.projectIds || []).includes(p.id)} onChange={e => run(() => editEntry(thread, { projectIds: e.target.checked ? [...(thread.projectIds || []), p.id].slice(0, 4) : (thread.projectIds || []).filter(id => id !== p.id) }))} />{p.name}</label>)}
          <p className="small">Fino a quattro progetti per il contesto dettagliato.</p>
        </details>
        <details open><summary>Dove siamo arrivati</summary><div className="ed-summary">{thread.summary || 'Il riepilogo si aggiorna dopo ogni risposta. Puoi partire da un gancio o ragionare su più idee.'}</div></details>
        <h2>Contenuti ({contents.length})</h2>
        <div className="ed-list">{contents.map(c => <button className={`ed-list-item ${c.id === contentId ? 'is-active' : ''}`} key={c.id} onClick={() => setContentId(c.id)}><strong>{c.title}</strong><span className="ed-count">{c.status}</span></button>)}</div>
        <div className="ed-actions"><button className="btn" disabled={busy} onClick={() => run(() => newContent())}>Nuovo contenuto</button></div>
      </details>
    </aside>
    <div>
      {content && <ContentEditor key={content.id} entry={content} onClose={() => setContentId('')} run={run} busy={busy} />}
      <section className="ed-panel">
        <div className="ed-eyebrow">Conversazione di lavoro</div><h2>{thread.title}</h2>
        <ErrorNotice text={error || storageError} />
        <div className="ed-turns" aria-label="Messaggi della conversazione">{turns.map(t => <article key={t.id}>
          <div className="ed-message"><span className="ed-meta">Tu · originale{t.pending ? ' · in sincronizzazione' : ''}</span><div className="ed-original">{t.text}</div></div>
          {t.reply ? <div className="ed-message ed-answer"><span className="ed-meta">Compagno editoriale</span><Markdown text={t.reply} />
            {t.sources?.length > 0 && <details><summary>Contesto consultato</summary><p className="small">{t.sources.map(s => `${s.name}: ${s.vault ? 'scheda e nota del vault' : 'scheda del gestionale'}`).join(' · ')}</p></details>}
            <div className="ed-actions"><button className="btn" disabled={busy} onClick={() => run(() => newContent(t.reply, t.id))}>Usa in un nuovo contenuto</button></div>
          </div> : <div className="ed-actions">
            <span role="status">{t.state === 'failed' ? t.error : t.state === 'working' ? 'Sto preparando la risposta…' : 'Spunto salvato. Possiamo svilupparlo.'}</span>
            <button className="btn" disabled={busy || t.pending || pending?.id !== t.id || (t.state === 'working' && thread.leaseUntil > now)} onClick={() => run(() => askEditor(thread.id, t.id))}>{t.state === 'failed' ? 'Riprova risposta' : 'Chiedi all’assistente'}</button>
          </div>}
        </article>)}</div>
        {!turns.length && <p className="ed-empty">Segui il filo: una frase, due video collegati, una domanda sul modo di cominciare. Possiamo deciderlo qui.</p>}
        <label>Continua il discorso<textarea maxLength={12000} rows={4} value={text} onChange={e => change(e.target.value)} placeholder="Vorrei partire da… Questa frase mi piace, però…" /></label>
        <p className="small muted">La bozza resta su questo dispositivo. I messaggi inviati si ritrovano anche dal telefono.</p>
        <div className="ed-actions"><button className="btn btn-primary" disabled={busy || !text.trim() || pending} onClick={() => run(send)}>Invia all’assistente</button></div>
        {pending && <p className="small">Completa la risposta al messaggio salvato prima di proseguire.</p>}
      </section>
    </div>
  </div>
}

export default function EditorialPage() {
  const { id } = useParams()
  const { projects } = useData()
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  useEffect(() => watchEditorial(setEntries, e => setError(`Archivio non disponibile: ${e.message}`)), [])
  async function run(fn) {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true); setError('')
    try { await fn() }
    catch (e) { setError(e.message || 'Operazione non riuscita. Il testo resta nella bozza o nel messaggio salvato.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  const thread = entries?.find(e => e.id === id && e.kind === 'conversation')
  return <div className="editorial">
    <header className="ed-header"><div className="ed-eyebrow">Polpo / laboratorio editoriale</div><h1>Dalle idee alle prime riprese.</h1><p className="muted">Raccogli gli spunti, segui un discorso, prepara ciò che vuoi raccontare.</p></header>
    <ErrorNotice text={error} />
    {busy && <p className="small" role="status">Operazione in corso. Se manca la rete, il testo rimane conservato.</p>}
    {!entries ? <p>Carico il laboratorio…</p> : id
      ? thread ? <Conversation key={id} thread={thread} entries={entries} projects={projects} run={run} busy={busy} /> : <p>Conversazione non disponibile. <Link to={base}>Torna al laboratorio</Link></p>
      : <Overview entries={entries} projects={projects} run={run} busy={busy} />}
  </div>
}
