import { useState } from 'react';
import { addProject, updateProject } from '../firebaseService';

const AddProjectForm = ({ onClose, onSuccess, onError, project }) => {
  const isEdit = !!project;
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'pending',
    tags: project?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        tags: tagsArray
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