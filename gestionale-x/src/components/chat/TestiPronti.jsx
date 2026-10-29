import { useState } from 'react'
import { ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import { MAX_TESTO, MAX_TITOLO, nuovoId, titoloDi, useTestiPronti } from './useTestiPronti'

// I testi pronti, nella home della chat e nella conversazione nuova. Toccarne uno non lo manda:
// lo mette nel campo per scrivere (onUsa), così lo completi prima di inviarlo.
export default function TestiPronti({ onUsa }) {
  const { caricamento, testi, salva } = useTestiPronti()
  const [modifica, setModifica] = useState(false)

  if (caricamento) return null

  return (
    <section className="chat-pronti" aria-label="Testi pronti">
      <div className="chat-pronti-head">
        <h2 className="chat-pronti-label">Testi pronti</h2>
        <button type="button" className="btn btn-sm btn-quiet" onClick={() => setModifica(true)}>
          <Pencil size={13} /> Modifica
        </button>
      </div>
      {testi.length > 0 ? (
        <div className="chat-pronti-list">
          {testi.map(t => (
            <button key={t.id} type="button" className="chat-pronto" onClick={() => onUsa(t.testo)} aria-label={`Testo pronto: ${titoloDi(t)}`}>
              <span className="chat-pronto-titolo">{titoloDi(t)}</span>
              <span className="chat-pronto-testo">{t.testo}</span>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="btn btn-sm" onClick={() => setModifica(true)}><Plus size={14} /> Aggiungi un testo pronto</button>
      )}

      {modifica && (
        <ModificaTesti
          testi={testi}
          onSalva={async (lista) => { await salva(lista); setModifica(false) }}
          onChiudi={() => setModifica(false)}
        />
      )}
    </section>
  )
}

function ModificaTesti({ testi, onSalva, onChiudi }) {
  const [lista, setLista] = useState(() => testi.map(t => ({ id: t.id, titolo: t.titolo || '', testo: t.testo })))
  const [errore, setErrore] = useState('')
  const [salvo, setSalvo] = useState(false)

  const cambia = (id, campo, valore) => setLista(l => l.map(t => (t.id === id ? { ...t, [campo]: valore } : t)))
  const togli = (id) => setLista(l => l.filter(t => t.id !== id))
  const suUno = (i) => setLista(l => (i > 0 ? [...l.slice(0, i - 1), l[i], l[i - 1], ...l.slice(i + 1)] : l))
  const aggiungi = () => setLista(l => [...l, { id: nuovoId(), titolo: '', testo: '' }])

  const conferma = async () => {
    setSalvo(true)
    setErrore('')
    try {
      await onSalva(lista)
    } catch (err) {
      setErrore(`Non salvato: ${err.message}`)
      setSalvo(false)
    }
  }

  return (
    <Modal
      title="Testi pronti" onClose={onChiudi} focusCampo={false}
      footer={
        <>
          <button type="button" className="btn" onClick={onChiudi}>Annulla</button>
          <button type="button" className="btn btn-primary" onClick={conferma} disabled={salvo}>Salva</button>
        </>
      }
    >
      <div className="modal-body chat-pronti-edit">
        <p className="help">Toccandone uno nella chat finisce nel campo per scrivere. Valgono su telefono e computer. Senza testo un testo pronto non si salva.</p>
        {lista.map((t, i) => (
          <div key={t.id} className="chat-pronti-voce">
            <div className="chat-pronti-riga">
              <input
                value={t.titolo} maxLength={MAX_TITOLO} placeholder="Titolo (facoltativo)"
                aria-label={`Titolo del testo ${i + 1}`} onChange={(e) => cambia(t.id, 'titolo', e.target.value)}
              />
              <button type="button" className="btn-icon sm" onClick={() => suUno(i)} disabled={i === 0} aria-label={`Sposta su il testo ${i + 1}`}><ArrowUp size={14} /></button>
              <button type="button" className="btn-icon sm" onClick={() => togli(t.id)} aria-label={`Elimina il testo ${i + 1}`}><Trash2 size={14} /></button>
            </div>
            <textarea
              value={t.testo} rows={3} maxLength={MAX_TESTO} placeholder="Il testo che finisce nel messaggio"
              aria-label={`Testo ${i + 1}`} onChange={(e) => cambia(t.id, 'testo', e.target.value)}
            />
          </div>
        ))}
        <button type="button" className="btn btn-sm" onClick={aggiungi}><Plus size={14} /> Aggiungi testo</button>
        {errore && <div className="form-error" role="alert">{errore}</div>}
      </div>
    </Modal>
  )
}
