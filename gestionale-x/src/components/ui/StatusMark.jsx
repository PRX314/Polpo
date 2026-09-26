import { STATUS_LABEL, normalizeStatus } from '../../lib/status'

// Lo stato si legge dalla forma del quadratino, non dal colore:
// vuoto = da fare, mezzo pieno = in corso, pieno = completato, barra = in pausa.
const StatusMark = ({ status, label = true }) => {
  const s = normalizeStatus(status)
  return (
    <span className={`status status-${s}`}>
      <span className="status-mark" aria-hidden="true" />
      {label ? STATUS_LABEL[s] : <span className="sr-only">{STATUS_LABEL[s]}</span>}
    </span>
  )
}

export default StatusMark
