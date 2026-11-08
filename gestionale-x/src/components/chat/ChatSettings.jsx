import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { MAX_TARGETS, shortModel } from './useModelli'
import { GENERICO } from './assistenti'

const TIPI = [
  { id: 'parliamo', nome: 'Parliamo', cosa: 'Di tutto, senza il gestionale davanti' },
  { id: 'cose', nome: 'Le mie cose', cosa: 'Progetti, agenda, appunti: li ha davanti' }
]

// Sotto il titolo, una riga sola: che conversazione è, chi risponde e con quale modello. Toccandola si
// apre il menu per cambiarli. Il modello lo scegli sempre tu: «Ragiona» non lo cambia.
// Gli assistenti (Content Creator, Pianificatore, Critico) ci sono solo nelle «Le mie cose».
export default function ChatSettings({ tipo, onTipo, specialisti, assistente, onAssistente, modelli }) {
  const [aperto, setAperto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!aperto) return
    const fuori = (e) => { if (!ref.current?.contains(e.target)) setAperto(false) }
    const esc = (e) => { if (e.key === 'Escape') setAperto(false) }
    document.addEventListener('mousedown', fuori)
    document.addEventListener('touchstart', fuori)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fuori)
      document.removeEventListener('touchstart', fuori)
      document.removeEventListener('keydown', esc)
    }
  }, [aperto])

  const tutti = [GENERICO, ...specialisti]
  const cose = tipo === 'cose'
  const nomeTipo = TIPI.find(t => t.id === tipo)?.nome || 'Parliamo'
  const specialista = cose && assistente ? tutti.find(s => s.id === assistente)?.name : null
  const riga = [nomeTipo, specialista, modelli.etichetta].filter(Boolean).join(' · ')

  return (
    <div className="chat-set" ref={ref}>
      <button
        type="button" className="chat-sub" onClick={() => setAperto(v => !v)}
        aria-expanded={aperto} aria-haspopup="dialog" aria-label={`${riga}: cambia`}
      >
        <span className="trunc">{riga}</span>
        <ChevronDown size={12} aria-hidden="true" />
      </button>

      {aperto && (
        <div className="chat-pop" role="dialog" aria-label="Conversazione e modello">
          <p className="chat-pop-name">Conversazione</p>
          {TIPI.map(t => (
            <label key={t.id} className={`chat-pop-row ${tipo === t.id ? 'is-on' : ''}`}>
              <input type="radio" name="chat-tipo" checked={tipo === t.id} onChange={() => onTipo(t.id)} />
              <span className="chat-pop-text">
                <span>{t.nome}</span>
                <span className="small muted">{t.cosa}</span>
              </span>
            </label>
          ))}

          {cose && (
            <>
              <p className="chat-pop-name">Assistente</p>
              {tutti.map(s => (
                <label key={s.id ?? 'generico'} className={`chat-pop-row ${assistente === s.id ? 'is-on' : ''}`}>
                  <input type="radio" name="chat-assistente" checked={assistente === s.id} onChange={() => onAssistente(s.id)} />
                  <span className="chat-pop-text">
                    <span>{s.icon ? `${s.icon} ` : ''}{s.name}</span>
                    {s.description && <span className="small muted">{s.description}</span>}
                  </span>
                </label>
              ))}
            </>
          )}

          {modelli.providers.length > 0 && (
            <>
              <p className="chat-pop-name">Modello</p>
              <p className="help">Tocca un modello per cambiare. Con «confronta» ne aggiungi altri (fino a {MAX_TARGETS}): ricevi tutte le risposte e scegli la migliore.</p>
              {modelli.providers.map(p => (
                <div key={p.id} className="chat-pop-group">
                  {modelli.providers.length > 1 && <div className="small faint">{p.name}</div>}
                  {p.models.map(m => {
                    const on = modelli.isOn(p.id, m)
                    const solo = on && modelli.targets.length === 1
                    return (
                      <div key={m} className={`chat-pop-row chat-pop-modello ${on ? 'is-on' : ''}`}>
                        <label>
                          <input type="radio" name="chat-modello" checked={solo} onChange={() => modelli.scegli(p.id, m)} />
                          <span>{shortModel(m)}</span>
                        </label>
                        {!solo && (
                          <button
                            type="button" className="btn btn-sm btn-quiet" onClick={() => modelli.toggle(p.id, m)}
                            disabled={!on && modelli.targets.length >= MAX_TARGETS}
                            aria-label={on ? `Togli ${shortModel(m)} dal confronto` : `Aggiungi ${shortModel(m)} al confronto`}
                          >
                            {on ? 'togli' : '+ confronta'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
