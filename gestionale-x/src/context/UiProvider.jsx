import { useCallback, useMemo, useState } from 'react'
import ProjectForm from '../components/ProjectForm'
import Modal from '../components/ui/Modal'
import { useToast } from './useToast'
import { useData } from './useData'
import { UiContext } from './uiContext'

// Le due finestre che servono a più pagine: creare/modificare un elemento e
// confermare un'eliminazione. Qualunque pagina le apre con openForm / confirmDelete.
export const UiProvider = ({ children }) => {
  const toast = useToast()
  const { actions } = useData()
  const [form, setForm] = useState(null)       // { project?, type? }
  const [pending, setPending] = useState(null) // { item, onDone }

  const openForm = useCallback((opts = {}) => setForm(opts), [])
  const confirmDelete = useCallback((item, onDone) => setPending({ item, onDone }), [])

  const doDelete = async () => {
    const { item, onDone } = pending
    setPending(null)
    // Si torna subito all'elenco: aspettare la conferma del server lasciava in vista, per un attimo, "Elemento non trovato"
    onDone?.()
    await actions.remove(item)
  }

  const api = useMemo(() => ({ openForm, confirmDelete }), [openForm, confirmDelete])

  return (
    <UiContext.Provider value={api}>
      {children}
      {form && (
        <ProjectForm
          project={form.project}
          initialType={form.type}
          onClose={() => setForm(null)}
          onSaved={(edited) => toast.ok(edited ? 'Modifiche salvate' : 'Elemento creato')}
        />
      )}
      {pending && (
        <Modal
          title="Eliminare questo elemento?" size="narrow" onClose={() => setPending(null)}
          footer={
            <>
              <button className="btn" onClick={() => setPending(null)}>Annulla</button>
              <button className="btn btn-primary" onClick={doDelete}>Elimina</button>
            </>
          }
        >
          <div className="modal-body">
            <p><strong>{pending.item.name || pending.item.title}</strong></p>
            <p className="muted">L&apos;eliminazione è definitiva: non si può annullare.</p>
          </div>
        </Modal>
      )}
    </UiContext.Provider>
  )
}
