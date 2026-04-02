import { useState, useEffect } from 'react'

const TodoListInteractive = ({ project, onUpdate }) => {
  const [todos, setTodos] = useState(project.todos || [])
  const [dragIndex, setDragIndex] = useState(null)
  const [newTodoText, setNewTodoText] = useState('')

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
    const updated = [...todos, { text: newTodoText.trim(), completed: false }]
    setTodos(updated)
    setNewTodoText('')
    await onUpdate(updated)
  }

  const handleDeleteTodo = async (index) => {
    const updated = todos.filter((_, i) => i !== index)
    setTodos(updated)
    await onUpdate(updated)
  }

  const done = todos.filter(t => t.completed).length
  const progress = todos.length > 0 ? Math.round((done / todos.length) * 100) : 0

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
          background: progress === 100 ? '#22c55e' : '#4f46e5'
        }}></div>
      </div>
      <div className="todo-list">
        {todos.map((todo, index) => (
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
            <div
              className={`todo-text ${todo.completed ? 'completed' : ''}`}
              onClick={() => handleToggle(index)}
            >
              {todo.text}
            </div>
            <button className="todo-delete" onClick={() => handleDeleteTodo(index)} title="Elimina">×</button>
          </div>
        ))}
      </div>
      <div className="todo-add-row">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
          placeholder="Aggiungi un nuovo task..."
          className="todo-add-input"
        />
        <button onClick={handleAddTodo} className="btn-primary" disabled={!newTodoText.trim()}>+</button>
      </div>
    </div>
  )
}

export default TodoListInteractive
