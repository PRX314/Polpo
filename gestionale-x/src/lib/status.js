export const STATUS_LABEL = {
  pending: 'Da fare',
  in_progress: 'In corso',
  completed: 'Completato',
  paused: 'In pausa'
}

export const STATUS_LIST = Object.keys(STATUS_LABEL)

// Il vecchio codice accettava anche queste grafie
export const normalizeStatus = (s) => {
  if (s === 'in-progress') return 'in_progress'
  if (s === 'on-hold') return 'paused'
  return STATUS_LABEL[s] ? s : 'pending'
}

export const progressOf = (project) => {
  const todos = project?.todos || []
  const done = todos.filter(t => t.completed).length
  return { done, total: todos.length, pct: todos.length ? Math.round((done / todos.length) * 100) : 0 }
}
