import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Modal from './ui/Modal'

const ChangePasswordModal = ({ onClose, onSubmit }) => {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (next.length < 6) return setError('La nuova password deve avere almeno 6 caratteri')
    if (next !== confirm) return setError('Le password non coincidono')
    if (current === next) return setError('La nuova password deve essere diversa dall\'attuale')

    setLoading(true)
    try {
      await onSubmit(current, next)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Cambia password" size="narrow" onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>Annulla</button>
          <button type="submit" form="pw-form" className="btn btn-primary" disabled={loading}>{loading ? 'Cambio…' : 'Cambia password'}</button>
        </>
      }
    >
      <form id="pw-form" className="modal-body" onSubmit={submit}>
        <div className="field">
          <label htmlFor="pw-current">Password attuale</label>
          <div className="input-affix">
            <input id="pw-current" type={show ? 'text' : 'password'} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            <button type="button" className="btn-icon" onClick={() => setShow(s => !s)} aria-label={show ? 'Nascondi le password' : 'Mostra le password'}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="pw-new">Nuova password</label>
          <input id="pw-new" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={6} value={next} onChange={(e) => setNext(e.target.value)} required />
          <span className="help">Minimo 6 caratteri.</span>
        </div>
        <div className="field">
          <label htmlFor="pw-confirm">Ripeti la nuova password</label>
          <input id="pw-confirm" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  )
}

export default ChangePasswordModal
