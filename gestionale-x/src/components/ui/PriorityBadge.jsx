const PriorityBadge = ({ priority }) => {
  const priorityLabels = {
    'high': 'Alta',
    'medium': 'Media',
    'low': 'Bassa'
  }

  return (
    <span className={`badge badge-priority-${priority}`}>
      {priorityLabels[priority]}
    </span>
  )
}

export default PriorityBadge