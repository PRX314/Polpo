import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { renderInline } from '../../lib/markdown'
import { ACTION_LABEL, dettagliAzione } from './azioni'

const STATO = {
  executing: 'Salvo…',
  confirmed: 'Fatta',
  rejected: 'Rifiutata',
  superseded: 'Sostituita',
  error: 'Non riuscita'
}

// Le proposte di Polpo, sotto la risposta che le ha fatte. Prima stavano in un pannello a parte
// che su telefono copriva tutta la chat (anche la modalità Parla) e si perdeva ricaricando.
export default function ActionCards({ actions, occupato, onConferma, onRifiuta }) {
  const [aperta, setAperta] = useState(null)
  const inAttesa = actions.filter(a => a.status === 'pending').length

  return (
    <section className="chat-proposte" aria-label="Proposte di Polpo">
      <p className="chat-proposte-head cal-label">
        {inAttesa ? `Da confermare · ${inAttesa}` : 'Proposte'}
      </p>
      <ul>
        {actions.map(a => {
          const open = aperta === a.id
          return (
            <li key={a.id} className={`chat-proposta is-${a.status}`}>
              <div className="chat-proposta-top">
                <button className="chat-proposta-info" onClick={() => setAperta(open ? null : a.id)} aria-expanded={open}>
                  <span className="tag tag-type">{ACTION_LABEL[a.tool] || 'Azione'}</span>
                  <span className="chat-proposta-label">{a.label}</span>
                  <ChevronDown size={14} className="chat-proposta-chev" aria-hidden="true" />
                </button>
                {a.status === 'pending' ? (
                  <span className="chat-proposta-btns">
                    <button className="btn-icon sm bordered" onClick={() => onConferma([a.id])} disabled={occupato} aria-label={`Conferma: ${a.label}`}><Check size={14} /></button>
                    <button className="btn-icon sm bordered" onClick={() => onRifiuta([a.id])} disabled={occupato} aria-label={`Rifiuta: ${a.label}`}><X size={14} /></button>
                  </span>
                ) : (
                  <span className={`tag ${a.status === 'confirmed' ? 'tag-invert' : ''}`}>{STATO[a.status] || a.status}</span>
                )}
              </div>
              {a.status === 'error' && a.result?.message && !open && <p className="chat-proposta-err small">{a.result.message}</p>}
              {open && (
                <div className="chat-proposta-det">
                  {dettagliAzione(a).map((d, i) => <div key={i} className="prose" dangerouslySetInnerHTML={{ __html: renderInline(String(d)) }} />)}
                  {a.result?.message && <div className="small muted">{a.result.success ? 'Fatto' : 'Non riuscita'}: {a.result.message}</div>}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {inAttesa > 1 && (
        <div className="chat-proposte-tutte">
          <button className="btn btn-sm btn-primary" onClick={() => onConferma(null)} disabled={occupato}><Check size={14} /> Conferma tutte</button>
          <button className="btn btn-sm" onClick={() => onRifiuta(null)} disabled={occupato}><X size={14} /> Rifiuta tutte</button>
        </div>
      )}
    </section>
  )
}
