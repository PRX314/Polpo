import { useState, useEffect } from 'react'
import { ANTICIPI, daSelect, aSelect } from '../sveglie'

const TodoListInteractive = ({ project, onUpdate }) => {
  const [todos, setTodos] = useState(project.todos || [])
  const [dragIndex, setDragIndex] = useState(null)
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoDeadline, setNewTodoDeadline] = useState('')
  const [newTodoTime, setNewTodoTime] = useState('')
  // Quale task ha aperto il pannellino della sveglia. I task nati prima che
  // esistesse l'orario devono poterne ricevere uno senza essere ricreati.
  const [sveglieAperte, setSveglieAperte] = useState(null)

  useEffect(() => {
    setTodos(project.todos || [])
  }, [project.todos])

  const handleToggle = async (index) => {
    const updated = [...todos]
    updated[index] = { ...updated[index], completed: !updated[index].completed }
    setTodos(updated)
    await onUpdate(updated)
  }

  const handleDragStart = (index) => setDragIndex(index)

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const updated = [...todos]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(index, 0, moved)
    setTodos(updated)
    setDragIndex(index)
  }

  const handleDragEnd = async () => {
    setDragIndex(null)
    await onUpdate(todos)
  }

  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return
    const todo = { text: newTodoText.trim(), completed: false }
    if (newTodoDeadline) {
      todo.deadline = newTodoDeadline
      if (newTodoTime) todo.time = newTodoTime
    }
    const updated = [...todos, todo]
    setTodos(updated)
    setNewTodoText('')
    setNewTodoDeadline('')
    setNewTodoTime('')
    await onUpdate(updated)
  }

  // Cambia scadenza, ora o sveglia di un task gia' esistente.
  // Una sveglia senza data e ora non ha un momento a cui suonare: se uno dei
  // due sparisce, sparisce anche lei.
  const patchTodo = async (index, patch) => {
    const updated = todos.map((t, i) => {
      if (i !== index) return t
      const next = { ...t, ...patch }
      if (!next.deadline || !next.time) next.reminder = null
      return next
    })
    setTodos(updated)
    await onUpdate(updated)
  }

  const handleDeleteTodo = async (index) => {
    const updated = todos.filter((_, i) => i !== index)
    setTodos(updated)
    await onUpdate(updated)
  }

  const done = todos.filter(t => t.completed).length
  const progress = todos.length > 0 ? Math.round((done / todos.length) * 100) : 0

  const formatDeadline = (dateStr) => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: `scaduto ${Math.abs(diff)}g fa`, cls: 'todo-deadline-overdue' }
    if (diff === 0) return { label: 'oggi!', cls: 'todo-deadline-today' }
    if (diff === 1) return { label: 'domani', cls: 'todo-deadline-soon' }
    return { label: d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }), cls: 'todo-deadline-normal' }
  }

  return (
    <div className="project-card mb-6">
      <div className="todo-header">
        <h3 className="title-section mb-2">
          ✅ Cose da Fare ({todos.length - done}/{todos.length})
        </h3>
        <span className="todo-progress-pct">{progress}%</span>
      </div>
      <div className="todo-progress-bar mb-4">
        <div className="todo-progress-fill" style={{
          width: `${progress}%`,
          background: progress === 100 ? '#22c55e' : 'var(--accent,#4f46e5)'
        }}></div>
      </div>
      <div className="todo-list">
        {todos.map((todo, index) => {
          const dl = !todo.completed ? formatDeadline(todo.deadline) : null
          return (
            <div
              key={index}
              className={`todo-item ${todo.completed ? 'todo-done' : ''} ${dragIndex === index ? 'todo-dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="todo-drag-handle" title="Trascina per riordinare">⠿</div>
              <div
                className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                onClick={() => handleToggle(index)}
              >
                {todo.completed && '✓'}
              </div>
              <div className="todo-text-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  className={`todo-text ${todo.completed ? 'completed' : ''}`}
                  onClick={() => handleToggle(index)}
                >
                  {todo.text}
                </div>
                {dl && (
                  <span className={`todo-deadline-badge ${dl.cls}`} style={{ fontSize: '0.7rem' }}>
                    📅 {dl.label}{todo.time ? ` · ${todo.time}` : ''}
                    {todo.reminder !== null && todo.reminder !== undefined && ' ⏰'}
                  </span>
                )}
                {sveglieAperte === index && (
                  <div className="todo-sveglia">
                    <input
                      type="date" value={todo.deadline || ''} title="Scadenza"
                      onChange={(e) => patchTodo(index, { deadline: e.target.value })}
                    />
                    <input
                      type="time" value={todo.time || ''} title="A che ora" disabled={!todo.deadline}
                      onChange={(e) => patchTodo(index, { time: e.target.value })}
                    />
                    <select
                      value={aSelect(todo.reminder)} title="Sveglia"
                      disabled={!todo.deadline || !todo.time}
                      onChange={(e) => patchTodo(index, { reminder: daSelect(e.target.value) })}
                    >
                      {ANTICIPI.map(a => (
                        <option key={String(a.value)} value={aSelect(a.value)}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button
                className="todo-delete"
                onClick={() => setSveglieAperte(sveglieAperte === index ? null : index)}
                title="Scadenza e sveglia"
              >⏰</button>
              <button className="todo-delete" onClick={() => handleDeleteTodo(index)} title="Elimina">×</button>
            </div>
          )
        })}
      </div>
      <div className="todo-add-row" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
          placeholder="Aggiungi un nuovo task..."
          className="todo-add-input"
          style={{ flex: 1, minWidth: '140px' }}
        />
        <input
          type="date"
          value={newTodoDeadline}
          onChange={(e) => setNewTodoDeadline(e.target.value)}
          title="Scadenza (opzionale)"
          style={{ width: 'auto' }}
        />
        <input
          type="time"
          value={newTodoTime}
          onChange={(e) => setNewTodoTime(e.target.value)}
          title="Ora (opzionale)"
          disabled={!newTodoDeadline}
          style={{ width: 'auto' }}
        />
        <button onClick={handleAddTodo} className="btn-primary" disabled={!newTodoText.trim()}>+</button>
      </div>
    </div>
  )
}

export default TodoListInteractive
