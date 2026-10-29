import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import TestiPronti from './TestiPronti'

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Oggi l'ora, quest'anno giorno e mese, prima anche l'anno
function quando(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const ora = new Date()
  if (d.toDateString() === ora.toDateString()) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', ...(d.getFullYear() !== ora.getFullYear() ? { year: 'numeric' } : {}) })
}

// L'ultima cosa detta, senza i segni del markdown
function anteprima(conv) {
  const ultimo = [...(conv.messages || [])].reverse().find(m => m.content)
  if (!ultimo) return ''
  const testo = ultimo.content.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1').replace(/[#*_`>[\]]/g, '').replace(/\s+/g, ' ').trim()
  return `${ultimo.role === 'user' ? 'Tu: ' : ''}${testo.slice(0, 140)}`
}

// La home della chat: i testi pronti e tutte le conversazioni. Prima lo storico era un pannello
// che si apriva sopra la conversazione; ora è la pagina da cui si parte e a cui si torna.
// Eliminare chiede conferma.
export default function ChatHome({ conversations, attiva, onApri, onElimina, onTesto }) {
  const [cerca, setCerca] = useState('')
  const [daEliminare, setDaEliminare] = useState(null)

  // Cerca nel titolo e dentro i messaggi
  const filtrate = useMemo(() => {
    const q = norm(cerca.trim())
    if (!q) return conversations
    return conversations.filter(c => norm(c.title).includes(q) || (c.messages || []).some(m => norm(m.content).includes(q)))
  }, [conversations, cerca])

  return (
    <div className="chat-home">
      <TestiPronti onUsa={onTesto} />

      <section className="chat-home-convs" aria-label="Conversazioni">
        <div className="chat-pronti-head">
          <h2 className="chat-pronti-label">Conversazioni <span className="count ghost">{conversations.length}</span></h2>
        </div>
        {conversations.length > 0 && (
          <input type="search" placeholder="Cerca nei titoli e nei messaggi" aria-label="Cerca nelle conversazioni" value={cerca} onChange={(e) => setCerca(e.target.value)} />
        )}
        <ul className="chat-convs">
          {filtrate.length === 0 && (
            <li className="small muted chat-convs-empty">{cerca ? 'Nessun risultato' : 'Ancora nessuna conversazione: scegli un testo pronto o tocca «Nuova».'}</li>
          )}
          {filtrate.map(conv => (
            <li key={conv.id} className={attiva === conv.id ? 'is-active' : ''}>
              <button className="chat-conv" onClick={() => onApri(conv)}>
                <span className="chat-conv-riga">
                  <span className="chat-conv-titolo">{conv.title || 'Conversazione'}</span>
                  <span className="small faint chat-conv-quando">{quando(conv.updatedAt)}</span>
                </span>
                <span className="small muted chat-conv-anteprima">{anteprima(conv)}</span>
                <span className="small faint">{conv.messageCount || conv.messages?.length || 0} messaggi</span>
              </button>
              <button className="btn-icon sm" onClick={() => setDaEliminare(conv)} aria-label={`Elimina la conversazione ${conv.title}`}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      </section>

      {daEliminare && (
        <Modal
          title="Eliminare la conversazione?" size="narrow" onClose={() => setDaEliminare(null)}
          footer={
            <>
              <button className="btn" onClick={() => setDaEliminare(null)}>Annulla</button>
              <button className="btn btn-primary" onClick={() => { onElimina(daEliminare.id); setDaEliminare(null) }}>Elimina</button>
            </>
          }
        >
          <div className="modal-body">
            <p><strong>{daEliminare.title || 'Conversazione'}</strong></p>
            <p className="muted">L&apos;eliminazione è definitiva: non si può annullare. Le azioni già confermate restano nel gestionale.</p>
          </div>
        </Modal>
      )}
    </div>
  )
}
