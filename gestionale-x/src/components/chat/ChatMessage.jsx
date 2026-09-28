import { memo, useMemo, useState } from 'react'
import { Check, Copy, Mic, RotateCcw } from 'lucide-react'
import { renderMarkdown } from '../../lib/markdown'
import { shortModel } from './useModelli'
import ActionCards from './ActionCards'

const Markdown = ({ text }) => {
  const html = useMemo(() => renderMarkdown(text), [text])
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}

const ora = (iso) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

// Un messaggio. Sotto le risposte si legge chi ha risposto (assistente e modello).
function ChatMessage({ msg, indice, nomeAssistente, occupato, onRiprova, onAlternativa, onConferma, onRifiuta }) {
  const [copiato, setCopiato] = useState(false)

  if (msg.role === 'user') {
    return (
      <div className={`chat-msg user ${msg.failed ? 'is-failed' : ''}`}>
        <div className="chat-bubble"><p className="pre">{msg.content}</p></div>
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

      <div className="chat-bubble"><Markdown text={msg.content} /></div>

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

      <div className="chat-meta small faint">
        <span>{nomeAssistente(msg.assistant)}{modello ? ` · ${modello}` : ''} · {ora(msg.timestamp)}</span>
        <button className="btn btn-sm btn-quiet" onClick={copia}>
          {copiato ? <><Check size={12} /> Copiato</> : <><Copy size={12} /> Copia</>}
        </button>
      </div>
    </div>
  )
}

export default memo(ChatMessage)
