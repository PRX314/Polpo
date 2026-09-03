import { useEffect, useState } from 'react'
import {
  setupPushNotifications,
  unsubscribeFromPush,
  isPushSubscribed,
  inviaProva,
  ostacolo,
  isInstallata
} from '../services/notificationService'

// Il pannello deve rispondere a una domanda sola: "le notifiche mi arrivano,
// si' o no?". Prima diceva "Non attive" senza spiegare che su iPhone non
// potevano esserlo finche' l'app non veniva aggiunta alla schermata Home, e
// non c'era modo di provare senza aspettare una scadenza vera.

const NotificationSettings = ({ onClose }) => {
  const [attive, setAttive] = useState(false)
  const [controllo, setControllo] = useState(true)
  const [occupato, setOccupato] = useState('')
  const [errore, setErrore] = useState('')
  const [esito, setEsito] = useState('')

  const blocco = ostacolo()

  useEffect(() => {
    isPushSubscribed()
      .then(setAttive)
      .catch(() => setAttive(false))
      .finally(() => setControllo(false))
  }, [])

  const azione = async (nome, fn, messaggio) => {
    setOccupato(nome); setErrore(''); setEsito('')
    try {
      await fn()
      if (messaggio) setEsito(messaggio)
    } catch (e) {
      setErrore(e?.message || String(e))
    } finally {
      setOccupato('')
    }
  }

  const attiva = () => azione('attiva', async () => {
    await setupPushNotifications()
    setAttive(true)
  }, 'Attivate. Prova a mandarti una notifica qui sotto.')

  const disattiva = () => azione('disattiva', async () => {
    await unsubscribeFromPush()
    setAttive(false)
  })

  const prova = () => azione('prova', inviaProva,
    'Inviata: dovrebbe arrivarti entro qualche secondo.')

  return (
    <div className="form-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="theme-settings-modal">
        <div className="form-header">
          <h2>🔔 Notifiche</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div className="theme-settings-body">

          {blocco === 'installa-ios' && (
            <div className="notif-avviso">
              <h4>Su iPhone serve prima installare l'app</h4>
              <p>
                Apple concede le notifiche solo alle app aggiunte alla schermata Home
                e aperte dalla loro icona. Da una scheda di Safari, o da un
                collegamento, non è possibile riceverle — non è un limite del
                gestionale.
              </p>
              <ol>
                <li>Apri <strong>polpopoly.it/gestionale/</strong> con <strong>Safari</strong> (non Chrome)</li>
                <li>Tocca <strong>Condividi</strong>, il quadrato con la freccia in su</li>
                <li>Scegli <strong>Aggiungi a Home</strong> e conferma</li>
                <li>Apri il gestionale dalla nuova icona 🐙 e torna qui</li>
              </ol>
              <p className="notif-nota">
                Poi puoi cancellare il vecchio collegamento: da quello le notifiche
                non arriveranno mai.
              </p>
            </div>
          )}

          {blocco === 'negato' && (
            <div className="notif-avviso notif-avviso-rosso">
              <h4>Notifiche bloccate</h4>
              <p>
                Il permesso è stato negato per questo sito. Va riattivato dalle
                impostazioni {isInstallata() ? 'del telefono, alla voce del gestionale' : 'del browser (lucchetto o ⓘ nella barra indirizzo → Notifiche)'},
                perché da qui non è più possibile richiederlo.
              </p>
            </div>
          )}

          {(blocco === 'non-supportato' || blocco === 'niente-push') && (
            <div className="notif-avviso notif-avviso-rosso">
              <h4>Non disponibili qui</h4>
              <p>Questo browser non supporta le notifiche push. Prova con Chrome, Edge o Safari aggiornati.</p>
            </div>
          )}

          {!blocco && (
            <>
              <div className={`notif-stato ${attive ? 'notif-stato-on' : ''}`}>
                <span className="notif-pallino" />
                <div>
                  <strong>{controllo ? 'Controllo…' : attive ? 'Attive' : 'Non attive'}</strong>
                  <p>
                    {attive
                      ? 'Gli avvisi arrivano anche ad app chiusa: le manda il server, ogni cinque minuti controlla se è ora di suonare.'
                      : 'Finché non le attivi, gli avvisi compaiono solo mentre il gestionale è aperto.'}
                  </p>
                </div>
              </div>

              {esito && <p className="notif-esito">{esito}</p>}
              {errore && <p className="notif-errore">{errore}</p>}

              <div className="notif-azioni">
                {!controllo && (attive ? (
                  <>
                    <button className="btn-primary" onClick={prova} disabled={!!occupato}>
                      {occupato === 'prova' ? '⏳ Invio…' : '📨 Mandami una prova'}
                    </button>
                    <button className="btn-secondary" onClick={disattiva} disabled={!!occupato}>
                      {occupato === 'disattiva' ? '⏳ …' : 'Disattiva'}
                    </button>
                  </>
                ) : (
                  <button className="btn-primary" onClick={attiva} disabled={!!occupato}>
                    {occupato === 'attiva' ? '⏳ Attivazione…' : '🔔 Attiva le notifiche'}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="notif-nota">
            Cosa arriva: le sveglie che imposti su appuntamenti, routine e scadenze,
            più un riepilogo la mattina alle 8 per le cose che hanno solo la data.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings
