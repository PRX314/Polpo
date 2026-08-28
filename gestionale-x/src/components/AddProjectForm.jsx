import { useState, useRef } from 'react';
import { addProject, updateProject } from '../firebaseService';
import { ITEM_TYPES, ITEM_TYPE_LIST, createSectionsFromTemplate, getTypeInfo } from '../itemTypes';
import { uploadImage, getThumbnail } from '../services/imageService';

const AddProjectForm = ({ onClose, onSuccess, onError, project, initialType }) => {
  const isEdit = !!project;
  const [formData, setFormData] = useState({
    type: project?.type || initialType || 'progetto',
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'pending',
    tags: project?.tags?.join(', ') || '',
    deadline: project?.deadline || '',
    vaultNote: project?.vaultNote || '',
    links: project?.links || [],
    roadmap: project?.roadmap || '',
    obiettivi: project?.obiettivi || '',
    todos: project?.todos || [],
    sections: project?.sections || (isEdit ? [] : createSectionsFromTemplate(project?.type || initialType || 'progetto'))
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [newTodo, setNewTodo] = useState('');
  const [newTodoDeadline, setNewTodoDeadline] = useState('');
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState('📄');

  const typeInfo = getTypeInfo(formData.type);

  const handleTypeChange = (newType) => {
    const currentHasContent = formData.sections.some(s => s.content.trim());
    setFormData(prev => ({
      ...prev,
      type: newType,
      // Solo sovrascrivere le sezioni se sono vuote (template non compilato)
      sections: currentHasContent ? prev.sections : createSectionsFromTemplate(newType)
    }));
  };

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
        type: formData.type,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        tags: tagsArray,
        deadline: formData.deadline || null,
        vaultNote: formData.vaultNote.trim() || null,
        links: formData.links,
        roadmap: formData.roadmap,
        obiettivi: formData.obiettivi,
        todos: formData.todos,
        sections: formData.sections
      };

      if (isEdit) {
        await updateProject(project.id, projectData);
      } else {
        await addProject(projectData);
      }
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      setError('Errore durante il salvataggio');
      onError && onError('Errore durante il salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Links
  const handleAddLink = () => {
    if (newLink.title.trim() && newLink.url.trim()) {
      setFormData({ ...formData, links: [...formData.links, { ...newLink }] });
      setNewLink({ title: '', url: '' });
    }
  };
  const handleRemoveLink = (index) => {
    setFormData({ ...formData, links: formData.links.filter((_, i) => i !== index) });
  };
  const handleLinkChange = (e) => {
    setNewLink({ ...newLink, [e.target.name]: e.target.value });
  };

  // Todos
  const handleAddTodo = () => {
    if (newTodo.trim()) {
      const todo = { text: newTodo.trim(), completed: false };
      if (newTodoDeadline) todo.deadline = newTodoDeadline;
      setFormData({ ...formData, todos: [...formData.todos, todo] });
      setNewTodo('');
      setNewTodoDeadline('');
    }
  };
  const handleRemoveTodo = (index) => {
    setFormData({ ...formData, todos: formData.todos.filter((_, i) => i !== index) });
  };
  const handleToggleTodo = (index) => {
    const updatedTodos = [...formData.todos];
    updatedTodos[index].completed = !updatedTodos[index].completed;
    setFormData({ ...formData, todos: updatedTodos });
  };

  // Sections
  const handleAddSection = () => {
    if (newSectionTitle.trim()) {
      setFormData({
        ...formData,
        sections: [...formData.sections, {
          id: Date.now().toString(),
          icon: newSectionIcon,
          title: newSectionTitle.trim(),
          content: ''
        }]
      });
      setNewSectionTitle('');
      setNewSectionIcon('📄');
    }
  };
  const handleRemoveSection = (index) => {
    setFormData({ ...formData, sections: formData.sections.filter((_, i) => i !== index) });
  };
  const handleSectionChange = (index, field, value) => {
    const updated = [...formData.sections];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, sections: updated });
  };
  const handleMoveSection = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= formData.sections.length) return;
    const updated = [...formData.sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setFormData({ ...formData, sections: updated });
  };

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(null) // sectionIndex or null
  const fileInputRef = useRef(null)

  const handleImageUpload = async (sectionIndex, files) => {
    if (!files || files.length === 0) return
    setUploadingImage(sectionIndex)
    try {
      const newImages = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const result = await uploadImage(file)
        newImages.push({ url: result.url, name: file.name })
      }
      if (newImages.length > 0) {
        const updated = [...formData.sections]
        const existing = updated[sectionIndex].images || []
        updated[sectionIndex] = { ...updated[sectionIndex], images: [...existing, ...newImages] }
        setFormData({ ...formData, sections: updated })
      }
    } catch (err) {
      setError(err.message || 'Errore nel caricamento immagine')
    } finally {
      setUploadingImage(null)
    }
  }

  const handleRemoveImage = (sectionIndex, imageIndex) => {
    const updated = [...formData.sections]
    const images = [...(updated[sectionIndex].images || [])]
    images.splice(imageIndex, 1)
    updated[sectionIndex] = { ...updated[sectionIndex], images }
    setFormData({ ...formData, sections: updated })
  }

  const sectionIcons = ['📄', '🎨', '🧵', '📐', '💰', '📦', '🔧', '📊', '🎯', '💡', '📝', '🏷️', '🖼️', '🛒', '📋', '⚙️'];

  return (
    <div className="form-modal">
      <div className="form-modal-content">
        <div className="form-header">
          <h3 className="title-section">
            {isEdit ? `Modifica ${typeInfo.label}` : `${typeInfo.icon} Nuovo Elemento`}
          </h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          {/* Type selector */}
          {!isEdit && (
            <div className="form-group">
              <label>Tipo</label>
              <div className="type-selector">
                {ITEM_TYPE_LIST.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    className={`type-selector-btn ${formData.type === t.key ? 'active' : ''}`}
                    style={{
                      '--type-color': t.color,
                      '--type-color-light': t.colorLight
                    }}
                    onClick={() => handleTypeChange(t.key)}
                  >
                    <span className="type-selector-icon">{t.icon}</span>
                    <span className="type-selector-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Nome *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={`Nome ${typeInfo.label.toLowerCase()}`}
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
              placeholder="Breve descrizione"
              rows={3}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange}>
                <option value="pending">Da Fare</option>
                <option value="in_progress">In Corso</option>
                <option value="completed">Completato</option>
                <option value="paused">In Pausa</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="deadline">📅 Scadenza</label>
              <input type="date" id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tag (separati da virgola)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="es: marketing, design, musica"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vaultNote">📔 Nota Obsidian (opzionale)</label>
            <input
              type="text"
              id="vaultNote"
              name="vaultNote"
              value={formData.vaultNote}
              onChange={handleChange}
              placeholder="es: Ungesto (nome file senza estensione)"
            />
          </div>

          {/* Sections */}
          <div className="form-group">
            <label>📑 Sezioni</label>
            {formData.sections.length > 0 && (
              <div className="sections-list">
                {formData.sections.map((section, index) => (
                  <div key={section.id} className="section-editor">
                    <div className="section-editor-header">
                      <div className="section-editor-title-row">
                        <span className="section-editor-icon">{section.icon}</span>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                          className="section-editor-title-input"
                          placeholder="Titolo sezione"
                        />
                      </div>
                      <div className="section-editor-actions">
                        <button type="button" onClick={() => handleMoveSection(index, -1)} disabled={index === 0} className="btn-icon" title="Sposta su">↑</button>
                        <button type="button" onClick={() => handleMoveSection(index, 1)} disabled={index === formData.sections.length - 1} className="btn-icon" title="Sposta giù">↓</button>
                        <button type="button" onClick={() => handleRemoveSection(index)} className="btn-icon btn-delete" title="Rimuovi">×</button>
                      </div>
                    </div>
                    <textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                      placeholder="Scrivi qui il contenuto..."
                      rows={4}
                      className="section-editor-content"
                    />
                    {/* Images */}
                    <div className="section-images-area">
                      {(section.images || []).length > 0 && (
                        <div className="section-images-grid">
                          {section.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="section-image-thumb">
                              <img src={getThumbnail(img.url, 150)} alt={img.name || ''} />
                              <button
                                type="button"
                                className="section-image-remove"
                                onClick={() => handleRemoveImage(index, imgIdx)}
                                title="Rimuovi"
                              >×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="section-image-upload-btn" title="Aggiungi immagini">
                        {uploadingImage === index ? '⏳ Caricando...' : '🖼️ Aggiungi immagini'}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                          disabled={uploadingImage !== null}
                          onChange={(e) => handleImageUpload(index, e.target.files)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="section-add-row">
              <div className="section-icon-picker">
                {sectionIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`section-icon-btn ${newSectionIcon === icon ? 'active' : ''}`}
                    onClick={() => setNewSectionIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSection())}
                  placeholder="Nuova sezione (es: Materiali, Costi...)"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={handleAddSection} className="btn-secondary" disabled={!newSectionTitle.trim()}>
                  + Sezione
                </button>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="form-group">
            <label>🔗 Links</label>
            {formData.links.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {formData.links.map((link, index) => (
                  <div key={index} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
                    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)', borderRadius: '6px', border: '1px solid #ddd'
                  }}>
                    <div style={{ flex: 1, fontSize: '0.85em' }}>
                      <strong>{link.title}</strong>
                      <div style={{ fontSize: '0.9em', color: '#666', wordBreak: 'break-all' }}>{link.url}</div>
                    </div>
                    <button type="button" onClick={() => handleRemoveLink(index)} className="btn-icon btn-delete" title="Rimuovi">×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <input type="text" name="title" value={newLink.title} onChange={handleLinkChange} placeholder="Titolo link" style={{ flex: 1 }} />
              <input type="url" name="url" value={newLink.url} onChange={handleLinkChange} placeholder="URL" style={{ flex: 1 }} />
              <button type="button" onClick={handleAddLink} className="btn-secondary" disabled={!newLink.title.trim() || !newLink.url.trim()} style={{ alignSelf: 'flex-start' }}>
                + Aggiungi Link
              </button>
            </div>
          </div>

          {/* Todos */}
          <div className="form-group">
            <label>✅ Cose da Fare</label>
            {formData.todos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {formData.todos.map((todo, index) => (
                  <div key={index} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
                    background: todo.completed ? 'linear-gradient(135deg, #d1fae5, #d1fae5)' : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                    borderRadius: '6px', border: '1px solid #ddd'
                  }}>
                    <input type="checkbox" checked={todo.completed} onChange={() => handleToggleTodo(index)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#20c997' }} />
                    <div style={{ flex: 1, fontSize: '0.85em', textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? '#999' : '#333' }}>
                      {todo.text}
                    </div>
                    <button type="button" onClick={() => handleRemoveTodo(index)} className="btn-icon btn-delete" title="Rimuovi">×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTodo())}
                placeholder="Aggiungi task..." style={{ flex: 1, minWidth: '150px' }} />
              <input type="date" value={newTodoDeadline} onChange={(e) => setNewTodoDeadline(e.target.value)} style={{ width: 'auto' }} title="Scadenza" />
              <button type="button" onClick={handleAddTodo} className="btn-secondary" disabled={!newTodo.trim()}>+ Aggiungi</button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Annulla</button>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ background: `linear-gradient(135deg, ${typeInfo.color}, ${typeInfo.color}dd)` }}>
              {loading ? 'Salvando...' : (isEdit ? 'Aggiorna' : `Crea ${typeInfo.label}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProjectForm;
