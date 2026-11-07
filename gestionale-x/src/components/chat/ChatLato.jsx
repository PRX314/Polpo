import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AlarmClock, FolderOpen, MessageCircle, Newspaper, Search, SquarePen, Trash2, X } from 'lucide-react'
import Modal from '../ui/Modal'
import { ALTRE_DI_PEPPINO } from '../../layout/sezioni'
import { tipoDi } from './useChat'

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

const TIPI = {
  parliamo: { icona: MessageCircle, nome: 'Parliamo' },
  cose: { icona: FolderOpen, nome: 'Le mie cose' }
}
const ICONE_PAGINE = { '/sveglia': AlarmClock, '/editoriale': Newspaper }

// Le conversazioni, come nelle chat di tutti i giorni: sul computer una colonna fissa a sinistra, sul
// telefono un pannello che si apre col ☰ (prima erano una «home» a parte, con i testi pronti).
// In fondo le altre pagine di Peppino, che prima stavano in una barra sopra la chat.
// Eliminare chiede conferma.
export default function ChatLato({ conversations, attiva, onApri, onElimina, onNuova, onChiudi }) {
  const [cerca, setCerca] = useState('')
  const [daEliminare, setDaEliminare] = useState(null)

  // Cerca nel titolo e dentro i messaggi
  const filtrate = useMemo(() => {
    const q = norm(cerca.trim())
    if (!q) return conversations
    return conversations.filter(c => norm(c.title).includes(q) || (c.messages || []).some(m => norm(m.content).includes(q)))
  }, [conversations, cerca])

  return (
    <>
    <aside className="chat-lato" aria-label="Conversazioni">
      <div className="chat-lato-testa">
        <button type="button" className="chat-lato-nuova" onClick={onNuova}>
          <SquarePen size={16} aria-hidden="true" /> Nuova conversazione
        </button>
        <button type="button" className="chat-tasto chat-lato-chiudi" onClick={onChiudi} aria-label="Chiudi le conversazioni">
          <X size={18} />
        </button>
      </div>

      {conversations.length > 0 && (
        <label className="chat-lato-cerca">
          <Search size={14} aria-hidden="true" />
          <input type="search" placeholder="Cerca nelle conversazioni" aria-label="Cerca nelle conversazioni" value={cerca} onChange={(e) => setCerca(e.target.value)} />
        </label>
      )}

      <ul className="chat-convs">
        {filtrate.length === 0 && (
          <li className="small muted chat-convs-empty">{cerca ? 'Nessun risultato' : 'Ancora nessuna conversazione.'}</li>
        )}
        {filtrate.map(conv => {
          const tipo = TIPI[tipoDi(conv)]
          const Icona = tipo.icona
          return (
            <li key={conv.id} className={attiva === conv.id ? 'is-active' : ''}>
              <button className="chat-conv" onClick={() => onApri(conv)} aria-current={attiva === conv.id ? 'true' : undefined}>
                <span className="chat-conv-riga">
                  <Icona size={13} className="chat-conv-tipo" aria-label={tipo.nome} />
                  <span className="chat-conv-titolo">{conv.title || 'Conversazione'}</span>
                  <span className="chat-conv-quando">{quando(conv.updatedAt)}</span>
                </span>
                <span className="chat-conv-anteprima">{anteprima(conv)}</span>
              </button>
              <button className="chat-tasto chat-conv-elimina" onClick={() => setDaEliminare(conv)} aria-label={`Elimina la conversazione ${conv.title}`}>
                <Trash2 size={14} />
              </button>
            </li>
          )
        })}
      </ul>

      {ALTRE_DI_PEPPINO.length > 0 && (
        <nav className="chat-lato-pagine" aria-label="Altro di Peppino">
          {ALTRE_DI_PEPPINO.map(p => {
            const Icona = ICONE_PAGINE[p.to] || MessageCircle
            return <NavLink key={p.to} to={p.to} className="chat-lato-pagina"><Icona size={15} aria-hidden="true" /> {p.label}</NavLink>
          })}
        </nav>
      )}
    </aside>

    {/* Fuori dal pannello: sul telefono il pannello scorre, e una finestra fissa dentro di lui scorrerebbe con lui */}
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
