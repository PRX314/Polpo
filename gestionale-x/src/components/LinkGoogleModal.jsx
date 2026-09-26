import { useState } from 'react'
import { GoogleAuthProvider, linkWithPopup, unlink } from 'firebase/auth'
import { auth } from '../firebase'
import Modal from './ui/Modal'

// Collega l'account Google a QUESTO utente (stesso uid del PIN), non ne crea
// uno nuovo. È l'operazione sicura: "Accedi con Google" da soli, senza prima
// collegare, creerebbe un uid diverso e i dati esistenti (progetti, note,
// chat, eventi) resterebbero appesi al vecchio uid, invisibili — sembrerebbe
// un gestionale vuoto senza che niente sia stato davvero perso.
const GOOGLE_PROVIDER_ID = 'google.com'

const LinkGoogleModal = ({ onClose }) => {
  const google = auth.currentUser?.providerData?.find(p => p.providerId === GOOGLE_PROVIDER_ID)
  const [linked, setLinked] = useState(!!google)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const collega = async () => {
    setLoading(true); setError(''); setNote('')
    try {
      await linkWithPopup(auth.currentUser, new GoogleAuthProvider())
      setLinked(true)
      setNote('Google collegato. Da ora puoi entrare anche con “Accedi con Google” nella schermata di accesso.')
    } catch (err) {
      if (err.code === 'auth/credential-already-in-use') {
        setError('Questo account Google è già collegato a un altro utente. Non ho toccato niente.')
      } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Non sono riuscito a collegare Google. Riprova.')
      }
    } finally {
      setLoading(false)
    }
  }

  const scollega = async () => {
    setLoading(true); setError(''); setNote('')
    try {
      await unlink(auth.currentUser, GOOGLE_PROVIDER_ID)
      setLinked(false)
      setNote('Google scollegato. Il PIN resta comunque attivo per entrare.')
    } catch {
      setError('Non sono riuscito a scollegare Google. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Accesso con Google" size="narrow" onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Chiudi</button>
          {linked
            ? <button className="btn" onClick={scollega} disabled={loading}>{loading ? 'Un momento…' : 'Scollega Google'}</button>
            : <button className="btn btn-primary" onClick={collega} disabled={loading}>{loading ? 'Un momento…' : 'Collega account Google'}</button>}
        </>
      }
    >
      <div className="modal-body">
        {linked ? (
          <p>Google è collegato a questo account{google?.email ? ` (${google.email})` : ''}. Puoi usarlo per entrare oltre al PIN: restano validi entrambi.</p>
        ) : (
          <p>Collega il tuo account Google a questo profilo per entrare anche senza digitare il PIN. Il PIN resta attivo come riserva.</p>
        )}
        {note && <div className="form-ok">{note}</div>}
        {error && <div className="form-error" role="alert">{error}</div>}
      </div>
    </Modal>
  )
}

export default LinkGoogleModal
