// Accesso al gestionale tramite codice numerico (PIN).
// L'email dell'account è fissa: l'utente digita solo il codice, che è
// la vera password Firebase (così la protezione dei dati resta reale).
import { useState, useEffect, useRef, useCallback } from 'react'
import { Delete } from 'lucide-react'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from '../firebase'
import './Auth.css'

const ACCOUNT_EMAIL = 'paoloandrearepetto@gmail.com'
const PIN_LENGTH = 6 // Firebase impone minimo 6 caratteri

const Auth = ({ onAuthSuccess }) => {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [resetMsg, setResetMsg] = useState('')
  const submittingRef = useRef(false)

  const submitPin = useCallback(async (code) => {
    setLoading(true)
    setError('')
    try {
      const cred = await signInWithEmailAndPassword(auth, ACCOUNT_EMAIL, code)
      onAuthSuccess(cred.user)
    } catch {
      setError('Codice errato')
      setShake(true)
      setPin('')
      setTimeout(() => setShake(false), 450)
    } finally {
      setLoading(false)
    }
  }, [onAuthSuccess])

  const addDigit = useCallback((d) => {
    if (loading) return
    setError('')
    setPin((prev) => (prev.length >= PIN_LENGTH ? prev : prev + d))
  }, [loading])

  const removeDigit = useCallback(() => {
    setError('')
    setPin((prev) => prev.slice(0, -1))
  }, [])

  // Invia automaticamente appena il codice è completo
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !submittingRef.current) {
      submittingRef.current = true
      submitPin(pin).finally(() => { submittingRef.current = false })
    }
  }, [pin, submitPin])

  // Tastiera fisica (comodo da computer)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key)
      else if (e.key === 'Backspace') removeDigit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [addDigit, removeDigit])

  // "Accedi con Google" funziona solo dopo che l'account è stato collegato
  // (dal menu utente, mentre già loggato col PIN): prima di quel collegamento
  // Firebase creerebbe un utente Google separato, con un uid diverso da quello
  // che possiede tutti i dati esistenti. Anche dopo il collegamento controlliamo
  // comunque l'email: è solo un secondo controllo, non l'unica difesa (quella
  // vera sono le regole di Firestore, che legano ogni documento all'uid di questo account).
  const accediConGoogle = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider())
      if (cred.user.email !== ACCOUNT_EMAIL) {
        await signOut(auth)
        setError('Questo account Google non è autorizzato.')
        return
      }
      onAuthSuccess(cred.user)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Accesso con Google non riuscito. Riprova o usa il PIN.')
      }
    } finally {
      setLoading(false)
    }
  }, [onAuthSuccess])

  const handleReset = async () => {
    setLoading(true)
    setError('')
    setResetMsg('')
    try {
      await sendPasswordResetEmail(auth, ACCOUNT_EMAIL)
      setResetMsg('Ti ho inviato una mail per reimpostare il codice.')
    } catch {
      setError('Non riesco a inviare la mail di reset.')
    } finally {
      setLoading(false)
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark" aria-hidden="true" />
          <h1>Polpo</h1>
        </div>
        <p className="muted">Inserisci il tuo codice</p>

        <div className={`auth-dots ${shake ? 'shake' : ''}`} role="img" aria-label={`${pin.length} cifre su ${PIN_LENGTH}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span key={i} className={i < pin.length ? 'on' : ''} />
          ))}
        </div>

        <div className="auth-msg" aria-live="polite">
          {error && <div className="form-error" role="alert">{error}</div>}
          {resetMsg && <div className="form-ok">{resetMsg}</div>}
        </div>

        <div className="auth-keys">
          {keys.map((k, i) =>
            k === '' ? (
              <span key={i} />
            ) : (
              <button
                key={i} type="button" disabled={loading}
                aria-label={k === 'del' ? 'Cancella l\'ultima cifra' : k}
                onClick={() => (k === 'del' ? removeDigit() : addDigit(k))}
              >
                {k === 'del' ? <Delete size={20} aria-hidden="true" /> : k}
              </button>
            )
          )}
        </div>

        <button type="button" className="btn btn-quiet btn-block" onClick={handleReset} disabled={loading}>
          Codice dimenticato?
        </button>

        <div className="auth-or"><span>oppure</span></div>

        <button type="button" className="btn btn-block" onClick={accediConGoogle} disabled={loading}>
          Accedi con Google
        </button>
      </div>
    </div>
  )
}

export default Auth
