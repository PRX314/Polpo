import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import Modal from '../ui/Modal'

// Lo storico delle conversazioni. Eliminare chiede conferma: prima bastava un tocco sul cestino.
export default function ConversationList({ conversations, attiva, onApri, onElimina, onChiudi }) {
  const [cerca, setCerca] = useState('')
  const [daEliminare, setDaEliminare] = useState(null)

  const filtrate = cerca
    ? conversations.filter(c => (c.title || '').toLowerCase().includes(cerca.toLowerCase()))
    : conversations

  return (
    <>
      <div className="chat-backdrop soft" onClick={onChiudi} />
      <aside className="chat-side" aria-label="Conversazioni">
        <div className="chat-side-head">
          <strong>Conversazioni</strong> <span className="count ghost">{conversations.length}</span>
          <button className="btn-icon sm chat-side-close" onClick={onChiudi} aria-label="Chiudi"><X size={16} /></button>
        </div>
        <input type="search" placeholder="Cerca" aria-label="Cerca nelle conversazioni" value={cerca} onChange={(e) => setCerca(e.target.value)} />
        <ul className="chat-convs">
          {filtrate.length === 0 && <li className="small muted chat-convs-empty">{cerca ? 'Nessun risultato' : 'Ancora nessuna conversazione'}</li>}
          {filtrate.map(conv => (
            <li key={conv.id} className={attiva === conv.id ? 'is-active' : ''}>
              <button className="chat-conv" onClick={() => onApri(conv)}>
                <span className="trunc">{conv.title || 'Conversazione'}</span>
                <span className="small faint">
                  {new Date(conv.updatedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} · {conv.messageCount || conv.messages?.length || 0} messaggi
                </span>
              </button>
              <button className="btn-icon sm" onClick={() => setDaEliminare(conv)} aria-label={`Elimina la conversazione ${conv.title}`}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      </aside>

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
    </>
  )
}
