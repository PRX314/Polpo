import { useState } from 'react';
import { addProject, updateProject } from '../firebaseService';

const AddProjectForm = ({ onClose, onSuccess, onError, project }) => {
  const isEdit = !!project;
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'pending',
    tags: project?.tags?.join(', ') || '',
    deadline: project?.deadline || '',
    links: project?.links || [],
    roadmap: project?.roadmap || '',
    obiettivi: project?.obiettivi || '',
    todos: project?.todos || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [newTodo, setNewTodo] = useState('');
  const [newTodoDeadline, setNewTodoDeadline] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const projectData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        tags: tagsArray,
        deadline: formData.deadline || null,
        links: formData.links,
        roadmap: formData.roadmap,
        obiettivi: formData.obiettivi,
        todos: formData.todos
      };

      if (isEdit) {
        await updateProject(project.id, projectData);
      } else {
        await addProject(projectData);
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding project:', error);
      const errorMessage = 'Errore durante il salvataggio del progetto';
      setError(errorMessage);
      onError && onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddLink = () => {
    if (newLink.title.trim() && newLink.url.trim()) {
      setFormData({
        ...formData,
        links: [...formData.links, { ...newLink }]
      });
      setNewLink({ title: '', url: '' });
    }
  };

  const handleRemoveLink = (index) => {
    setFormData({
      ...formData,
      links: formData.links.filter((_, i) => i !== index)
    });
  };

  const handleLinkChange = (e) => {
    setNewLink({
      ...newLink,
      [e.target.name]: e.target.value
    });
  };

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      const todo = { text: newTodo.trim(), completed: false };
      if (newTodoDeadline) todo.deadline = newTodoDeadline;
      setFormData({
        ...formData,
        todos: [...formData.todos, todo]
      });
      setNewTodo('');
      setNewTodoDeadline('');
    }
  };

  const handleRemoveTodo = (index) => {
    setFormData({
      ...formData,
      todos: formData.todos.filter((_, i) => i !== index)
    });
  };

  const handleToggleTodo = (index) => {
    const updatedTodos = [...formData.todos];
    updatedTodos[index].completed = !updatedTodos[index].completed;
    setFormData({
      ...formData,
      todos: updatedTodos
    });
  };

  return (
    <div className="form-modal">
      <div className="form-modal-content">
        <div className="form-header">
          <h3 className="title-section">{isEdit ? 'Modifica Progetto' : 'Nuovo Progetto'}</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">Nome Progetto *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome del progetto"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Descrizione</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descrizione del progetto"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="pending">Da Fare</option>
              <option value="in_progress">In Corso</option>
              <option value="completed">Completato</option>
              <option value="paused">In Pausa</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tag (separati da virgola)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="es: react, design, e-commerce"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline">📅 Scadenza</label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
            />
            <small className="form-help">
              Data di scadenza del progetto (opzionale)
            </small>
          </div>

          <div className="form-group">
            <label>🔗 Links</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {formData.links.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {formData.links.map((link, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}>
                      <div style={{ flex: 1, fontSize: '0.85em' }}>
                        <strong>{link.title}</strong>
                        <div style={{ fontSize: '0.9em', color: '#666', wordBreak: 'break-all' }}>
                          {link.url}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="btn-icon btn-delete"
                        title="Rimuovi link"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <input
                  type="text"
                  name="title"
                  value={newLink.title}
                  onChange={handleLinkChange}
                  placeholder="Titolo link (es: GitHub, Demo, Docs)"
                  style={{ flex: 1 }}
                />
                <input
                  type="url"
                  name="url"
                  value={newLink.url}
                  onChange={handleLinkChange}
                  placeholder="URL (es: https://github.com/...)"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="btn-secondary"
                  disabled={!newLink.title.trim() || !newLink.url.trim()}
                  style={{ alignSelf: 'flex-start' }}
                >
                  + Aggiungi Link
                </button>
              </div>
            </div>
            <small className="form-help">
              Aggiungi link utili al progetto (repository, demo, documentazione, ecc.)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="roadmap">📍 Roadmap</label>
            <textarea
              id="roadmap"
              name="roadmap"
              value={formData.roadmap}
              onChange={handleChange}
              placeholder="Descrivi le fasi principali del progetto (milestone, feature da implementare, ecc.)"
              rows={4}
            />
            <small className="form-help">
              Piano di sviluppo e milestone del progetto
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="obiettivi">🎯 Obiettivi</label>
            <textarea
              id="obiettivi"
              name="obiettivi"
              value={formData.obiettivi}
              onChange={handleChange}
              placeholder="Elenca gli obiettivi principali del progetto"
              rows={3}
            />
            <small className="form-help">
              Obiettivi e risultati attesi del progetto
            </small>
          </div>

          <div className="form-group">
            <label>✅ Lista Cose da Fare</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {formData.todos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {formData.todos.map((todo, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: todo.completed ? 'linear-gradient(135deg, #d1fae5, #d1fae5)' : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(index)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          accentColor: '#20c997'
                        }}
                      />
                      <div style={{
                        flex: 1,
                        fontSize: '0.85em',
                        textDecoration: todo.completed ? 'line-through' : 'none',
                        color: todo.completed ? '#999' : '#333'
                      }}>
                        {todo.text}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTodo(index)}
                        className="btn-icon btn-delete"
                        title="Rimuovi task"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTodo())}
                  placeholder="Aggiungi una cosa da fare..."
                  style={{ flex: 1, minWidth: '150px' }}
                />
                <input
                  type="date"
                  value={newTodoDeadline}
                  onChange={(e) => setNewTodoDeadline(e.target.value)}
                  style={{ width: 'auto' }}
                  title="Scadenza (opzionale)"
                />
                <button
                  type="button"
                  onClick={handleAddTodo}
                  className="btn-secondary"
                  disabled={!newTodo.trim()}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  + Aggiungi
                </button>
              </div>
            </div>
            <small className="form-help">
              Lista di task da completare per il progetto
            </small>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : (isEdit ? 'Aggiorna Progetto' : 'Salva Progetto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectForm;