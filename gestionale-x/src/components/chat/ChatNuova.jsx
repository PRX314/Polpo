import { FolderOpen, MessageCircle } from 'lucide-react'
import TestiPronti from './TestiPronti'

const TIPI = [
  { id: 'parliamo', icona: MessageCircle, nome: 'Parliamo', cosa: 'Di tutto: idee, dubbi, curiosità, ragionamenti. Peppino non guarda il gestionale, se non glielo chiedi.' },
  { id: 'cose', icona: FolderOpen, nome: 'Le mie cose', cosa: 'Progetti, agenda, appunti, cose da fare: li ha davanti e può salvare per te.' }
]

// La conversazione nuova, prima del primo messaggio: si sceglie di cosa parlare (dal 2026-11-07).
// Con «Le mie cose» sotto ci sono i testi pronti: toccarne uno lo mette nel campo per scrivere.
export default function ChatNuova({ tipo, onTipo, onTesto }) {
  return (
    <div className="chat-nuova">
      <div className="chat-nuova-dentro">
        <h2 className="chat-nuova-titolo">Di cosa parliamo?</h2>
        <div className="chat-tipi" role="radiogroup" aria-label="Tipo di conversazione">
          {TIPI.map(t => {
            const Icona = t.icona
            const on = tipo === t.id
            return (
              <button
                key={t.id} type="button" role="radio" aria-checked={on}
                className={`chat-tipo ${on ? 'is-on' : ''}`} onClick={() => onTipo(t.id)}
              >
                <span className="chat-tipo-nome"><Icona size={16} aria-hidden="true" /> {t.nome}</span>
                <span className="chat-tipo-cosa">{t.cosa}</span>
              </button>
            )
          })}
        </div>
        {tipo === 'cose' && <TestiPronti onUsa={onTesto} />}
      </div>
    </div>
  )
}
