import { useEffect, useState } from 'react'
import Modal from './ui/Modal'
import {
  setupPushNotifications, unsubscribeFromPush, isPushSubscribed, inviaProva, ostacolo, isInstallata
} from '../services/notificationService'
import './NotificationSettings.css'

// Deve rispondere a una domanda sola: "le notifiche mi arrivano, sì o no?"
// Su iPhone non possono arrivare finché l'app non è aggiunta alla schermata Home,
// e non c'è modo di provare senza aspettare una scadenza vera: da qui il bottone di prova.
const NotificationSettings = ({ onClose }) => {
  const [active, setActive] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')

  const blocker = ostacolo()

  useEffect(() => {
    isPushSubscribed().then(setActive).catch(() => setActive(false)).finally(() => setChecking(false))
  }, [])

  const run = async (name, fn, message) => {
    setBusy(name); setError(''); setNote('')
    try {
      await fn()
      if (message) setNote(message)
    } catch (e) {
      setError(e?.message || String(e))
    } finally {
      setBusy('')
    }
  }

  const enable = () => run('enable', async () => { await setupPushNotifications(); setActive(true) }, 'Attivate. Prova a mandarti una notifica qui sotto.')
  const disable = () => run('disable', async () => { await unsubscribeFromPush(); setActive(false) })
  const test = () => run('test', inviaProva, 'Inviata: dovrebbe arrivarti entro qualche secondo.')

  return (
    <Modal
      title="Notifiche" size="narrow" onClose={onClose}
      footer={<button className="btn" onClick={onClose}>Chiudi</button>}
    >
      <div className="modal-body">
        {blocker === 'installa-ios' && (
          <div className="notif-box">
            <h3>Su iPhone serve prima installare l&apos;app</h3>
            <p className="muted">
              Apple concede le notifiche solo alle app aggiunte alla schermata Home e aperte dalla loro icona.
              Da una scheda di Safari, o da un collegamento, non è possibile riceverle: non è un limite del gestionale.
            </p>
            <ol>
              <li>Apri <strong>polpopoly.it/gestionale/</strong> con <strong>Safari</strong> (non Chrome)</li>
              <li>Tocca <strong>Condividi</strong>, il quadrato con la freccia in su</li>
              <li>Scegli <strong>Aggiungi a Home</strong> e conferma</li>
              <li>Apri il gestionale dalla nuova icona e torna qui</li>
            </ol>
            <p className="small faint">Poi puoi cancellare il vecchio collegamento: da quello le notifiche non arriveranno mai.</p>
          </div>
        )}

        {blocker === 'negato' && (
          <div className="notif-box">
            <h3>Notifiche bloccate</h3>
            <p className="muted">
              Il permesso è stato negato per questo sito. Va riattivato dalle impostazioni{' '}
              {isInstallata() ? 'del telefono, alla voce del gestionale' : 'del browser (lucchetto nella barra indirizzo, poi Notifiche)'}:
              da qui non è più possibile richiederlo.
            </p>
          </div>
        )}

        {(blocker === 'non-supportato' || blocker === 'niente-push') && (
          <div className="notif-box">
            <h3>Non disponibili qui</h3>
            <p className="muted">Questo browser non supporta le notifiche push. Prova con Chrome, Edge o Safari aggiornati.</p>
          </div>
        )}

        {!blocker && (
          <>
            <div className="notif-state">
              <span className={`status-mark ${active ? 'on' : ''}`} aria-hidden="true" />
              <div>
                <strong>{checking ? 'Controllo…' : active ? 'Attive' : 'Non attive'}</strong>
                <p className="small muted">
                  {active
                    ? 'Gli avvisi arrivano anche ad app chiusa: li manda il server, che ogni cinque minuti controlla se è ora di suonare.'
                    : 'Finché non le attivi, gli avvisi compaiono solo mentre il gestionale è aperto.'}
                </p>
              </div>
            </div>

            {note && <div className="form-ok">{note}</div>}
            {error && <div className="form-error" role="alert">{error}</div>}

            {!checking && (
              <div className="row row-wrap">
                {active ? (
                  <>
                    <button className="btn btn-primary" onClick={test} disabled={!!busy}>{busy === 'test' ? 'Invio…' : 'Mandami una prova'}</button>
                    <button className="btn" onClick={disable} disabled={!!busy}>{busy === 'disable' ? '…' : 'Disattiva'}</button>
                  </>
                ) : (
                  <button className="btn btn-primary" onClick={enable} disabled={!!busy}>{busy === 'enable' ? 'Attivazione…' : 'Attiva le notifiche'}</button>
                )}
              </div>
            )}
          </>
        )}

        <p className="small faint">
          Cosa arriva: le sveglie che imposti su appuntamenti, routine e scadenze, più un riepilogo alle 8 del mattino per le cose che hanno solo la data.
        </p>
      </div>
    </Modal>
  )
}

export default NotificationSettings
