import { useState } from 'react';
import { addNote, updateNote } from '../firebaseService';

const AddNoteForm = ({ onClose, onSuccess, onError, note }) => {
  const isEdit = !!note;
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
    type: note?.type || 'note',
    priority: note?.priority || 'medium',
    projectTags: note?.projectTags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tagsArray = formData.projectTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const noteData = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        projectTags: tagsArray
      };

      if (isEdit) {
        await updateNote(note.id, noteData);
      } else {
        await addNote(noteData);
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding note:', error);
      const errorMessage = 'Errore durante il salvataggio della nota';
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
          <h3 className="title-section">
            {isEdit ? (formData.type === 'idea' ? '💡 Modifica Idea' : '📝 Modifica Nota') : (formData.type === 'idea' ? '💡 Nuova Idea' : '📝 Nuova Nota')}
          </h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="type">Tipo</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="note">📝 Nota</option>
              <option value="idea">💡 Idea</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Titolo *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Titolo della nota/idea"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Contenuto *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Scrivi qui il contenuto..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priorità</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="low">Bassa</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="projectTags">Tag Progetti (separati da virgola)</label>
            <input
              type="text"
              id="projectTags"
              name="projectTags"
              value={formData.projectTags}
              onChange={handleChange}
              placeholder="es: react, design, e-commerce"
            />
            <small className="form-help">
              I tag determinano a quali progetti questa nota sarà associata
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
              {loading ? 'Salvando...' : (isEdit ? `Aggiorna ${formData.type === 'idea' ? 'Idea' : 'Nota'}` : `Salva ${formData.type === 'idea' ? 'Idea' : 'Nota'}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteForm;