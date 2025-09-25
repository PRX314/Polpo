// Authentication component for Gestionale Polpo
import { useState } from 'react';
import {
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../firebase';

const Auth = ({ onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Caricamento...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;