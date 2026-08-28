import { useEffect, useState } from 'react'
import { setupPushNotifications, isPushSubscribed, getNotificationPermission, unsubscribeFromPush } from '../services/notificationService'

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = () => window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches

const NotificationSettings = ({ onClose }) => {
  const [subscribed, setSubscribed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const permission = getNotificationPermission()
  const needsInstall = isIOS() && !isStandalone()

  useEffect(() => {
    isPushSubscribed().then((v) => { setSubscribed(v); setChecking(false) })
  }, [])

  const handleEnable = async () => {
    setBusy(true)
    setError('')
    try {
      const ok = await setupPushNotifications()
      setSubscribed(ok)
      if (!ok) setError('Permesso non concesso. Controlla le impostazioni di notifiche del browser/telefono.')
    } catch (e) {
      setError('Errore durante l\'attivazione: ' + (e?.message || e))
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async () => {
    setBusy(true)
    try {
      await unsubscribeFromPush()
      setSubscribed(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="form-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="theme-settings-modal">
        <div className="form-header">
          <h2>🔔 Notifiche</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="theme-settings-body">
          <p className="theme-settings-description">
            Ricevi un avviso su scadenze di progetti e task in arrivo (oggi, domani, tra 3 giorni) — controllate ogni ora.
          </p>

          {needsInstall && (
            <div style={{ background: 'rgba(254, 202, 87, 0.12)', border: '1px solid rgba(254, 202, 87, 0.4)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>⚠️ Su iPhone serve installare l'app prima</h4>
              <p style={{ marginBottom: 6, fontSize: '0.85em' }}>
                Safari non permette le notifiche in una scheda normale. Devi prima aggiungere Gestionale-X alla schermata Home:
              </p>
              <ol style={{ paddingLeft: 18, fontSize: '0.85em' }}>
                <li>Apri questa pagina con <strong>Safari</strong> (non Chrome)</li>
                <li>Tocca l'icona <strong>Condividi</strong> (il quadrato con la freccia in su)</li>
                <li>Scegli <strong>"Aggiungi a Home"</strong></li>
                <li>Apri l'app dall'icona in home, poi torna qui e attiva le notifiche</li>
              </ol>
            </div>
          )}

          {!needsInstall && permission === 'unsupported' && (
            <p style={{ color: 'var(--red, #e94560)' }}>Questo browser non supporta le notifiche push.</p>
          )}

          {!needsInstall && permission === 'denied' && (
            <p style={{ color: 'var(--red, #e94560)' }}>
              Le notifiche sono bloccate per questo sito. Riattivale dalle impostazioni del browser (icona lucchetto/ⓘ nella barra indirizzo → Notifiche).
            </p>
          )}

          {!needsInstall && (permission === 'default' || permission === 'granted') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span>
                Stato: {checking ? '…' : subscribed ? '✅ Attive' : '⭕ Non attive'}
              </span>
            </div>
          )}

          {error && <p style={{ color: 'var(--red, #e94560)', fontSize: '0.85em', marginBottom: 12 }}>{error}</p>}

          {!needsInstall && permission !== 'denied' && permission !== 'unsupported' && !checking && (
            subscribed ? (
              <button className="btn-secondary" onClick={handleDisable} disabled={busy}>
                {busy ? '⏳ …' : 'Disattiva notifiche'}
              </button>
            ) : (
              <button className="btn-primary" onClick={handleEnable} disabled={busy}>
                {busy ? '⏳ Attivazione…' : '🔔 Attiva notifiche'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings
