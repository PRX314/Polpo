import { memo, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Mic, NotebookPen, RotateCcw } from 'lucide-react'
import { collegaElementi, renderMarkdown } from '../../lib/markdown'
import { salvaNelVault } from '../../services/chatService'
import { shortModel } from './useModelli'
import ActionCards from './ActionCards'
import Passaggi from './Passaggi'

// I nomi tra doppie quadre ([[Ungesto]]) diventano link agli elementi
const Markdown = ({ text, indice }) => {
  const html = useMemo(() => renderMarkdown(collegaElementi(text, indice)), [text, indice])
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}

// Il testo di Paolo, con le citazioni @Nome cliccabili
function TestoConCitati({ testo, citati }) {
  if (!citati?.length) return testo
  const nomi = [...citati].sort((a, b) => b.nome.length - a.nome.length)
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`@(${nomi.map(c => escape(c.nome)).join('|')})`, 'g')
  const pezzi = []
  let ultimo = 0
  for (const m of testo.matchAll(re)) {
    if (m.index > ultimo) pezzi.push(testo.slice(ultimo, m.index))
    const c = nomi.find(x => x.nome === m[1])
    pezzi.push(<Link key={m.index} to={`/elementi/${c.id}`} className="chat-cit">@{c.nome}</Link>)
    ultimo = m.index + m[0].length
  }
  pezzi.push(testo.slice(ultimo))
  return pezzi
}

const ora = (iso) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

// Un messaggio. Sotto le risposte si legge chi ha risposto (assistente e modello).
function ChatMessage({ msg, indice, indiceElementi, nomeAssistente, occupato, onRiprova, onAlternativa, onConferma, onRifiuta }) {
  const [copiato, setCopiato] = useState(false)
  // Invio al vault: 'idle' | 'invio' | 'fatto' | 'errore'
  const [salvataggio, setSalvataggio] = useState({ stato: 'idle', errore: '' })

  if (msg.role === 'user') {
    return (
      <div className={`chat-msg user ${msg.failed ? 'is-failed' : ''}`}>
        <div className="chat-bubble"><p className="pre"><TestoConCitati testo={msg.content} citati={msg.citati} /></p></div>
        <div className="chat-meta small faint">
          {msg.voce && <Mic size={11} aria-label="detto a voce" />}
          <span>{ora(msg.timestamp)}</span>
        </div>
        {msg.failed && (
          <div className="chat-failed small" role="alert">
            <span>Non partito{msg.errore ? `: ${msg.errore}` : ''}</span>
            <button className="btn btn-sm" onClick={() => onRiprova(indice)} disabled={occupato}><RotateCcw size={12} /> Riprova</button>
          </div>
        )}
      </div>
    )
  }

  const copia = () => {
    navigator.clipboard?.writeText(msg.content)
      .then(() => { setCopiato(true); setTimeout(() => setCopiato(false), 2000) })
      .catch(() => {})
  }
  const modello = !msg.alternatives && shortModel(msg.label?.split(' · ')[1])

  const inviaAlVault = () => {
    setSalvataggio({ stato: 'invio', errore: '' })
    salvaNelVault({ testo: msg.content, assistente: nomeAssistente(msg.assistant) })
      .then(() => setSalvataggio({ stato: 'fatto', errore: '' }))
      .catch(err => setSalvataggio({ stato: 'errore', errore: err.message }))
  }

  return (
    <div className="chat-msg assistant">
      {msg.alternatives?.length > 1 && (
        <div className="chat-alts" role="tablist" aria-label="Risposte a confronto">
          {msg.alternatives.map((alt, ai) => (
            <button
              key={ai} role="tab" aria-selected={msg.altIndex === ai}
              className={`chip ${msg.altIndex === ai ? 'is-active' : ''}`}
              onClick={() => onAlternativa(indice, ai)} disabled={!!alt.error || occupato} title={alt.error || alt.label}
            >
              {alt.error ? '! ' : ''}{shortModel(alt.label?.split(' · ')[1])}
              {alt.ms != null && <span className="n">{(alt.ms / 1000).toFixed(1)}s</span>}
            </button>
          ))}
        </div>
      )}

      <Passaggi
        passi={msg.passi} ragionamento={msg.ragionamento} pensiero={msg.pensiero}
        streaming={!!msg.streaming} haTesto={!!msg.content}
      />

      {msg.content ? (
        <div className={`chat-bubble ${msg.streaming ? 'is-streaming' : ''}`} aria-busy={msg.streaming || undefined}>
          <Markdown text={msg.content} indice={indiceElementi} />
        </div>
      ) : msg.streaming && (
        <div className="chat-bubble" role="status">
          <span className="chat-typing" aria-hidden="true"><i /><i /><i /></span>
          <span className="small muted"> {msg.passi?.length ? 'Ci sto pensando…' : 'Polpo sta pensando…'}</span>
        </div>
      )}

      {msg.alternatives?.some(a => a.error) && (
        <div className="chat-alt-errors small muted">
          {msg.alternatives.filter(a => a.error).map((a, ei) => <div key={ei}>! {a.label}: {a.error}</div>)}
        </div>
      )}

      {/* Conversazioni vecchie: le azioni eseguite erano salvate così */}
      {msg.executedActions?.length > 0 && (
        <div className="chat-done">
          {msg.executedActions.map((a, j) => <span key={j} className="tag"><Check size={11} /> {a.result?.message || a.label}</span>)}
        </div>
      )}

      {msg.actions?.length > 0 && (
        <ActionCards
          actions={msg.actions} occupato={occupato}
          onConferma={(ids) => onConferma(indice, ids)} onRifiuta={(ids) => onRifiuta(indice, ids)}
        />
      )}

      {!msg.streaming && <div className="chat-meta small faint">
        <span>{nomeAssistente(msg.assistant)}{modello ? ` · ${modello}` : ''} · {ora(msg.timestamp)}</span>
        <button className="btn btn-sm btn-quiet" onClick={copia}>
          {copiato ? <><Check size={12} /> Copiato</> : <><Copy size={12} /> Copia</>}
        </button>
        <button className="btn btn-sm btn-quiet" onClick={inviaAlVault} disabled={!msg.content || salvataggio.stato === 'invio'}>
          {salvataggio.stato === 'fatto' ? <><Check size={12} /> Nel vault</> : <><NotebookPen size={12} /> {salvataggio.stato === 'invio' ? 'Invio…' : 'Invia al vault'}</>}
        </button>
      </div>}
      {salvataggio.stato === 'errore' && (
        <div className="chat-failed small" role="alert"><span>Non salvato nel vault: {salvataggio.errore}</span></div>
      )}
    </div>
  )
}

export default memo(ChatMessage)
