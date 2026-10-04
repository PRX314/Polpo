import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { MAX_TARGETS, shortModel } from './useModelli'
import { GENERICO } from './assistenti'

// Chi risponde e con quale modello, in un posto solo. Prima erano due file di pulsanti in alto
// (assistenti e modello) che non si capiva cosa facessero.
export default function ChatSettings({ specialisti, assistente, onAssistente, modelli }) {
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
  const nome = tutti.find(s => s.id === assistente)?.name || GENERICO.name

  return (
    <div className="chat-set" ref={ref}>
      <button
        type="button" className="chat-sub" onClick={() => setAperto(v => !v)}
        aria-expanded={aperto} aria-haspopup="dialog" aria-label={`Assistente ${nome}, modello ${modelli.etichetta}: cambia`}
      >
        <span className="trunc">{nome}{modelli.etichetta ? ` · ${modelli.etichetta}` : ''}</span>
        <ChevronDown size={12} aria-hidden="true" />
      </button>

      {aperto && (
        <div className="chat-pop" role="dialog" aria-label="Assistente e modello">
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

          {modelli.providers.length > 0 && (
            <>
              <p className="chat-pop-name">Modello</p>
              <p className="help">Uno: chat normale. Fino a {MAX_TARGETS}: ricevi tutte le risposte e scegli la migliore.</p>
              {modelli.providers.map(p => (
                <div key={p.id} className="chat-pop-group">
                  {modelli.providers.length > 1 && <div className="small faint">{p.name}</div>}
                  {p.models.map(m => {
                    const on = modelli.isOn(p.id, m)
                    return (
                      <label key={m} className={`chat-pop-row ${on ? 'is-on' : ''}`}>
                        <input
                          type="checkbox" checked={on} onChange={() => modelli.toggle(p.id, m)}
                          disabled={!on && modelli.targets.length >= MAX_TARGETS}
                        />
                        <span>{shortModel(m)}</span>
                      </label>
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
