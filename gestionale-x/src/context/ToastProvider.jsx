import { useCallback, useMemo, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { ToastContext } from './toastContext'

// Avvisi in basso: uno per messaggio, spariscono da soli.
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(1)

  const dismiss = useCallback((id) => setToasts(list => list.filter(t => t.id !== id)), [])

  const push = useCallback((kind, text) => {
    const id = nextId.current++
    setToasts(list => [...list.slice(-2), { id, kind, text }])
    setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500)
  }, [dismiss])

  const api = useMemo(() => ({
    ok: (text) => push('ok', text),
    err: (text) => push('error', text)
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast" data-kind={t.kind}>
            {t.kind === 'error' ? <X size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            <span>{t.text}</span>
            <button className="btn-icon" onClick={() => dismiss(t.id)} aria-label="Chiudi avviso"><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
