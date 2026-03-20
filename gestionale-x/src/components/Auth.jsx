// Authentication component for Gestionale Polpo
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';

const Auth = ({ onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Solo login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      onAuthSuccess(userCredential.user);
    } catch (error) {
      console.error('Auth error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Utente non trovato';
      case 'auth/wrong-password':
        return 'Password errata';
      case 'auth/invalid-email':
        return 'Email non valida';
      default:
        return 'Errore durante l\'accesso';
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email.trim()) {
      setError('Inserisci la tua email prima di cliccare "Password dimenticata"');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setResetSent(true);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError('Nessun account trovato con questa email');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email non valida');
      } else {
        setError('Errore nell\'invio della mail di reset');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="title-main">🐙 Gestionale Polpo</h1>
          <p className="auth-subtitle">
            Accedi al tuo account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="tua@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '0.25rem',
                  opacity: 0.6
                }}
                title={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {resetSent && (
            <div style={{
              background: 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
              color: '#065f46',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              border: '1px solid #a7f3d0',
              fontFamily: "'JetBrains Mono', monospace"
            }}>
              Email di reset inviata a <strong>{formData.email}</strong>. Controlla la tua casella di posta.
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Caricamento...' : 'Accedi'}
          </button>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
            className="switch-button"
            style={{ marginTop: '0.5rem', textAlign: 'center', display: 'block', width: '100%' }}
          >
            Password dimenticata?
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;