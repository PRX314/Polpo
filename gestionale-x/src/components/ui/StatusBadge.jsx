const StatusBadge = ({ status }) => {
  const statusLabels = {
    'completed': 'Completato',
    'in_progress': 'In Corso',
    'pending': 'Da Fare',
    'paused': 'In Pausa'
  }

  return (
    <span className={`badge badge-status-${status}`}>
      {statusLabels[status]}
    </span>
  )
}

export default StatusBadge