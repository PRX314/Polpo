// Accesso al Gestionale Polpo tramite codice numerico (PIN).
// L'email dell'account è fissa: l'utente digita solo il codice, che è
// la vera password Firebase (così la protezione dei dati resta reale).
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';

const ACCOUNT_EMAIL = 'paoloandrearepetto@gmail.com';
const PIN_LENGTH = 6; // Firebase impone minimo 6 caratteri

const Auth = ({ onAuthSuccess }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const submittingRef = useRef(false);

  const submitPin = useCallback(async (code) => {
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, ACCOUNT_EMAIL, code);
      onAuthSuccess(cred.user);
    } catch {
      setError('Codice errato');
      setShake(true);
      setPin('');
      setTimeout(() => setShake(false), 450);
    } finally {
      setLoading(false);
    }
  }, [onAuthSuccess]);

  const addDigit = useCallback((d) => {
    if (loading) return;
    setError('');
    setPin((prev) => (prev.length >= PIN_LENGTH ? prev : prev + d));
  }, [loading]);

  const removeDigit = useCallback(() => {
    setError('');
    setPin((prev) => prev.slice(0, -1));
  }, []);

  // Invia automaticamente appena il codice è completo
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !submittingRef.current) {
      submittingRef.current = true;
      submitPin(pin).finally(() => { submittingRef.current = false; });
    }
  }, [pin, submitPin]);

  // Tastiera fisica (comodo da computer)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key);
      else if (e.key === 'Backspace') removeDigit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addDigit, removeDigit]);

  const handleReset = async () => {
    setLoading(true);
    setError('');
    setResetMsg('');
    try {
      await sendPasswordResetEmail(auth, ACCOUNT_EMAIL);
      setResetMsg('Ti ho inviato una mail per reimpostare il codice.');
    } catch {
      setError('Non riesco a inviare la mail di reset.');
    } finally {
      setLoading(false);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-header">
          <h1 className="title-main">🐙 Gestionale Polpo</h1>
          <p className="auth-subtitle">Inserisci il tuo codice</p>
        </div>

        {/* Pallini del codice */}
        <div
          style={{
            display: 'flex', justifyContent: 'center', gap: '0.9rem', margin: '1.6rem 0',
            animation: shake ? 'pin-shake 0.45s' : 'none'
          }}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 14, height: 14, borderRadius: '50%',
                background: i < pin.length ? '#54a0ff' : 'transparent',
                border: '2px solid ' + (i < pin.length ? '#54a0ff' : '#c7cdd6'),
                transition: 'all .15s'
              }}
            />
          ))}
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>{error}</div>
        )}
        {resetMsg && (
          <div style={{ color: '#065f46', fontSize: '0.85rem', marginBottom: '1rem' }}>{resetMsg}</div>
        )}

        {/* Tastierino */}
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
            maxWidth: 260, margin: '0 auto'
          }}
        >
          {keys.map((k, i) =>
            k === '' ? (
              <span key={i} />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => (k === '⌫' ? removeDigit() : addDigit(k))}
                disabled={loading}
                style={{
                  aspectRatio: '1', borderRadius: '50%', border: 'none',
                  fontSize: k === '⌫' ? '1.3rem' : '1.5rem', fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer', color: '#333',
                  background: k === '⌫' ? 'transparent' : '#f0f2f6',
                  transition: 'transform .08s, background .15s'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {k}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="switch-button"
          style={{ marginTop: '1.5rem', textAlign: 'center', display: 'block', width: '100%' }}
        >
          Codice dimenticato?
        </button>
      </div>

      <style>{`
        @keyframes pin-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
};

export default Auth;
