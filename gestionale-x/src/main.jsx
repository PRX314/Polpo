import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import './styles/ui.css'
import './styles/shell.css'
import App from './App.jsx'
import { ThemeProvider } from './theme/ThemeProvider'
import { ToastProvider } from './context/ToastProvider'
import { registerServiceWorker } from './services/notificationService'

// PWA: service worker registrato all'avvio (serve per install + notifiche)
registerServiceWorker()

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crash:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="loading-screen" style={{ flexDirection: 'column', textAlign: 'center', padding: 24 }}>
        <h1>Qualcosa è andato storto</h1>
        <p className="muted" style={{ maxWidth: 420 }}>{this.state.error?.message || 'Errore sconosciuto'}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Ricarica</button>
      </div>
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
