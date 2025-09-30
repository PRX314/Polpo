import { useState } from 'react';
import { addNote, updateNote } from '../firebaseService';

const AddNoteForm = ({ onClose, onSuccess, onError, note }) => {
  const isEdit = !!note;
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
    type: note?.type || 'note',
    priority: note?.priority || 'medium',
    projectTags: note?.projectTags?.join(', ') || '',
    links: note?.links || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newLink, setNewLink] = useState({ title: '', url: '' });

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
        projectTags: tagsArray,
        links: formData.links
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

  return (
    <div className="form-modal">
      <div className="form-modal-content">
        <div className="form-header">
          <h3 className="title-section">
            {isEdit ? (
              formData.type === 'idea' ? '💡 Modifica Idea' :
              formData.type === 'monologo' ? '🎭 Modifica Monologo' :
              formData.type === 'musica' ? '🎵 Modifica Musica' :
              '📝 Modifica Nota'
            ) : (
              formData.type === 'idea' ? '💡 Nuova Idea' :
              formData.type === 'monologo' ? '🎭 Nuovo Monologo' :
              formData.type === 'musica' ? '🎵 Nuova Musica' :
              '📝 Nuova Nota'
            )}
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
              <option value="monologo">🎭 Monologo</option>
              <option value="musica">🎵 Musica</option>
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
                  placeholder="Titolo link (es: Riferimento, Docs, Tutorial)"
                  style={{ flex: 1 }}
                />
                <input
                  type="url"
                  name="url"
                  value={newLink.url}
                  onChange={handleLinkChange}
                  placeholder="URL (es: https://...)"
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
              Link utili relativi a questa nota/idea
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
              {loading ? 'Salvando...' : (isEdit ? `Aggiorna ${
                formData.type === 'idea' ? 'Idea' :
                formData.type === 'monologo' ? 'Monologo' :
                formData.type === 'musica' ? 'Musica' : 'Nota'
              }` : `Salva ${
                formData.type === 'idea' ? 'Idea' :
                formData.type === 'monologo' ? 'Monologo' :
                formData.type === 'musica' ? 'Musica' : 'Nota'
              }`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteForm;