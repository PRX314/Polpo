import { useState } from 'react'
import { Brain, Check, Drama, FileText, Lightbulb, Megaphone, Music, Pin } from 'lucide-react'
import Modal from '../ui/Modal'
import { RACCOLTE, chiave, hashtagIn, suggerisci, tagDi } from '../../lib/hashtag'
import { ultimaVolta } from '../../lib/vaultCampi'
import './MettiIn.css'

// "Metti in…": la finestrella per mettere un appunto in una raccolta o collegarlo a un progetto
// con un tocco. Non salva niente di suo: scrive o toglie il #tag nel testo, come a mano.

const ICONE = { musica: Music, documenti: FileText, idee: Lightbulb, ideesocial: Megaphone, monologhi: Drama, pensieri: Brain }
export const IconaRaccolta = ({ id, size = 14 }) => {
  const Icona = ICONE[id]
  return Icona ? <Icona size={size} aria-hidden="true" /> : null
}

const QUANTI = 10

export default function MettiIn({ testo, items, onAggiungi, onTogli, onClose }) {
  const [cerca, setCerca] = useState('')
  const tags = hashtagIn(testo)
  const dentro = (chiavi) => chiavi.some(k => tags.has(k))
  const cambia = (chiavi, tag) => (dentro(chiavi) ? onTogli(chiavi) : onAggiungi(tag))

  // Senza ricerca: prima i progetti già collegati, poi i fissati, poi quelli toccati di recente
  const progetti = items.filter(p => !p.archived && !p.personale && p.name)
  const lista = cerca.trim()
    ? suggerisci(cerca, progetti, QUANTI)
    : [...progetti].sort((a, b) => (dentro([chiave(b.name)]) - dentro([chiave(a.name)])) || (!!b.pinned - !!a.pinned)
      || ultimaVolta(b).localeCompare(ultimaVolta(a))).slice(0, QUANTI)

  return (
    <Modal title="Metti in" size="narrow" focusCampo={false} onClose={onClose}
      footer={<button type="button" className="btn btn-primary" onClick={onClose}>Fatto</button>}>
      <div className="modal-body mi">
        <section>
          <h3 className="mi-titolo">Raccolte</h3>
          <div className="mi-raccolte" role="group" aria-label="Raccolte">
            {RACCOLTE.map(r => {
              const on = dentro(r.chiavi)
              return (
                <button key={r.id} type="button" className={`chip ${on ? 'is-active' : ''}`} aria-pressed={on} onClick={() => cambia(r.chiavi, r.tag)}>
                  <IconaRaccolta id={r.id} /> {r.nome}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h3 className="mi-titolo">Progetti</h3>
          <input type="search" value={cerca} onChange={e => setCerca(e.target.value)} placeholder="Cerca un progetto…" aria-label="Cerca un progetto" />
          <div className="mi-progetti" role="group" aria-label="Progetti">
            {lista.map(p => {
              const on = dentro([chiave(p.name)])
              return (
                <button key={p.id} type="button" className={`chip ${on ? 'is-active' : ''}`} aria-pressed={on} onClick={() => cambia([chiave(p.name)], tagDi(p))}>
                  {on ? <Check size={14} aria-hidden="true" /> : p.pinned && <Pin size={12} aria-hidden="true" />} {p.name}
                </button>
              )
            })}
          </div>
          {!lista.length && <p className="small muted">Nessun progetto con questo nome.</p>}
        </section>

        <p className="small muted">Scrive il #tag nel testo: puoi anche scriverlo a mano, per esempio {RACCOLTE.find(r => r.id === 'pensieri').tag}.</p>
      </div>
    </Modal>
  )
}
