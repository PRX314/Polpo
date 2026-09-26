import { useState } from 'react'
import { ArrowDown, ArrowUp, ImagePlus, Plus, X } from 'lucide-react'
import Modal from './ui/Modal'
import { addProject, updateProject } from '../firebaseService'
import { ITEM_TYPE_LIST, createSectionsFromTemplate, getTypeInfo } from '../itemTypes'
import { STATUS_LABEL, STATUS_LIST } from '../lib/status'
import { uploadImage, getThumbnail } from '../services/imageService'
import { ANTICIPI, daSelect, aSelect } from '../sveglie'
import './ProjectForm.css'

const ProjectForm = ({ project, initialType, onClose, onSaved }) => {
  const isEdit = !!project
  const startType = project?.type || initialType || 'progetto'

  const [form, setForm] = useState({
    type: startType,
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'pending',
    tags: project?.tags?.join(', ') || '',
    deadline: project?.deadline || '',
    // Una scadenza con un'ora può avere una sveglia; senza ora finisce solo nel riepilogo del mattino
    deadlineTime: project?.deadlineTime || '',
    reminder: project?.reminder ?? null,
    vaultNote: project?.vaultNote || '',
    links: project?.links || [],
    roadmap: project?.roadmap || '',
    obiettivi: project?.obiettivi || '',
    todos: project?.todos || [],
    sections: project?.sections || (isEdit ? [] : createSectionsFromTemplate(startType))
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newLink, setNewLink] = useState({ title: '', url: '' })
  const [newTodo, setNewTodo] = useState({ text: '', deadline: '' })
  const [newSection, setNewSection] = useState('')
  const [uploading, setUploading] = useState(null)

  const typeInfo = getTypeInfo(form.type)
  const set = (patch) => setForm(f => ({ ...f, ...patch }))
  const onField = (e) => set({ [e.target.name]: e.target.value })

  const changeType = (type) => {
    // Le sezioni si sostituiscono solo se il template non è stato compilato
    const filled = form.sections.some(s => (s.content || '').trim())
    set({ type, sections: filled ? form.sections : createSectionsFromTemplate(type) })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Serve un nome')
    setSaving(true)
    setError('')
    try {
      const data = {
        type: form.type,
        name: form.name.trim(),
        description: form.description,
        status: form.status,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        deadline: form.deadline || null,
        // Ora e sveglia esistono solo appese a una data: senza, la function non ha un momento a cui suonare
        deadlineTime: form.deadline ? (form.deadlineTime || '') : '',
        reminder: form.deadline && form.deadlineTime ? form.reminder : null,
        vaultNote: form.vaultNote.trim() || null,
        links: form.links,
        roadmap: form.roadmap,
        obiettivi: form.obiettivi,
        todos: form.todos,
        sections: form.sections
      }
      if (isEdit) await updateProject(project.id, data)
      else await addProject(data)
      onSaved?.(isEdit)
      onClose()
    } catch (err) {
      console.error('Errore salvataggio:', err)
      setError('Salvataggio non riuscito. Riprova.')
      setSaving(false)
    }
  }

  // ── Link ──
  const addLink = () => {
    if (!newLink.title.trim() || !newLink.url.trim()) return
    set({ links: [...form.links, { title: newLink.title.trim(), url: newLink.url.trim() }] })
    setNewLink({ title: '', url: '' })
  }
  const removeLink = (i) => set({ links: form.links.filter((_, idx) => idx !== i) })

  // ── Cose da fare ──
  const addTodo = () => {
    if (!newTodo.text.trim()) return
    const todo = { text: newTodo.text.trim(), completed: false }
    if (newTodo.deadline) todo.deadline = newTodo.deadline
    set({ todos: [...form.todos, todo] })
    setNewTodo({ text: '', deadline: '' })
  }
  const toggleTodo = (i) => set({ todos: form.todos.map((t, idx) => idx === i ? { ...t, completed: !t.completed } : t) })
  const removeTodo = (i) => set({ todos: form.todos.filter((_, idx) => idx !== i) })

  // ── Sezioni ──
  const addSection = () => {
    if (!newSection.trim()) return
    set({ sections: [...form.sections, { id: Date.now().toString(), title: newSection.trim(), content: '' }] })
    setNewSection('')
  }
  const patchSection = (i, patch) => set({ sections: form.sections.map((s, idx) => idx === i ? { ...s, ...patch } : s) })
  const removeSection = (i) => set({ sections: form.sections.filter((_, idx) => idx !== i) })
  const moveSection = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= form.sections.length) return
    const next = [...form.sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    set({ sections: next })
  }

  const uploadImages = async (i, files) => {
    if (!files?.length) return
    setUploading(i)
    try {
      const added = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const res = await uploadImage(file)
        added.push({ url: res.url, name: file.name })
      }
      if (added.length) patchSection(i, { images: [...(form.sections[i].images || []), ...added] })
    } catch (err) {
      setError(err.message || 'Caricamento immagine non riuscito')
    } finally {
      setUploading(null)
    }
  }
  const removeImage = (i, k) => patchSection(i, { images: form.sections[i].images.filter((_, idx) => idx !== k) })

  return (
    <Modal
      title={isEdit ? `Modifica ${typeInfo.label.toLowerCase()}` : 'Nuovo elemento'}
      size="wide"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={saving}>Annulla</button>
          <button type="submit" form="project-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvo…' : isEdit ? 'Salva' : 'Crea'}
          </button>
        </>
      }
    >
      <form id="project-form" className="modal-body" onSubmit={submit} noValidate>
        {!isEdit && (
          <div className="field">
            <span className="field-label">Tipo</span>
            <div className="chips wrap" role="radiogroup" aria-label="Tipo di elemento">
              {ITEM_TYPE_LIST.map(t => (
                <button
                  key={t.key} type="button" role="radio" aria-checked={form.type === t.key}
                  className={`chip ${form.type === t.key ? 'is-active' : ''}`} onClick={() => changeType(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="pf-name">Nome *</label>
          <input id="pf-name" name="name" value={form.name} onChange={onField} placeholder={`Nome ${typeInfo.label.toLowerCase()}`} />
        </div>

        <div className="field">
          <label htmlFor="pf-desc">Descrizione</label>
          <textarea id="pf-desc" name="description" rows={3} value={form.description} onChange={onField} placeholder="Breve descrizione" />
        </div>

        <div className="field-row keep">
          <div className="field">
            <label htmlFor="pf-status">Stato</label>
            <select id="pf-status" name="status" value={form.status} onChange={onField}>
              {STATUS_LIST.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pf-deadline">Scadenza</label>
            <input id="pf-deadline" type="date" name="deadline" value={form.deadline} onChange={onField} />
          </div>
        </div>

        {form.deadline && (
          <>
            <div className="field-row keep">
              <div className="field">
                <label htmlFor="pf-time">A che ora</label>
                <input id="pf-time" type="time" name="deadlineTime" value={form.deadlineTime} onChange={onField} />
              </div>
              <div className="field">
                <label htmlFor="pf-rem">Sveglia</label>
                <select
                  id="pf-rem" value={aSelect(form.reminder)} disabled={!form.deadlineTime}
                  onChange={(e) => set({ reminder: daSelect(e.target.value) })}
                >
                  {ANTICIPI.map(a => <option key={String(a.value)} value={aSelect(a.value)}>{a.label}</option>)}
                </select>
              </div>
            </div>
            {!form.deadlineTime && (
              <p className="help">Senza un&apos;ora la scadenza finisce nel riepilogo del mattino. Mettine una per farla suonare a un momento preciso.</p>
            )}
          </>
        )}

        <div className="field">
          <label htmlFor="pf-tags">Tag, separati da virgola</label>
          <input id="pf-tags" name="tags" value={form.tags} onChange={onField} placeholder="marketing, design, musica" />
        </div>

        <div className="field">
          <label htmlFor="pf-vault">Nota Obsidian (facoltativa)</label>
          <input id="pf-vault" name="vaultNote" value={form.vaultNote} onChange={onField} placeholder="Ungesto (nome del file senza estensione)" />
        </div>

        <fieldset className="pf-block">
          <legend>Sezioni</legend>
          {form.sections.map((s, i) => (
            <div key={s.id || i} className="pf-section">
              <div className="row">
                <input
                  className="grow" value={s.title} placeholder="Titolo sezione" aria-label={`Titolo della sezione ${i + 1}`}
                  onChange={(e) => patchSection(i, { title: e.target.value })}
                />
                <button type="button" className="btn-icon sm" onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label="Sposta su"><ArrowUp size={14} /></button>
                <button type="button" className="btn-icon sm" onClick={() => moveSection(i, 1)} disabled={i === form.sections.length - 1} aria-label="Sposta giù"><ArrowDown size={14} /></button>
                <button type="button" className="btn-icon sm" onClick={() => removeSection(i)} aria-label="Rimuovi sezione"><X size={14} /></button>
              </div>
              <textarea
                rows={4} value={s.content || ''} placeholder="Contenuto…" aria-label={`Contenuto della sezione ${i + 1}`}
                onChange={(e) => patchSection(i, { content: e.target.value })}
              />
              {(s.images || []).length > 0 && (
                <div className="pf-images">
                  {s.images.map((img, k) => (
                    <div key={k} className="pf-image">
                      <img src={getThumbnail(img.url, 150)} alt={img.name || ''} />
                      <button type="button" className="btn-icon sm" onClick={() => removeImage(i, k)} aria-label="Rimuovi immagine"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
              <label className="btn btn-sm btn-quiet pf-upload">
                <ImagePlus size={14} /> {uploading === i ? 'Carico…' : 'Aggiungi immagini'}
                <input type="file" accept="image/*" multiple hidden disabled={uploading !== null} onChange={(e) => uploadImages(i, e.target.files)} />
              </label>
            </div>
          ))}
          <div className="row">
            <input
              className="grow" value={newSection} placeholder="Nuova sezione (es. Materiali, Costi)" aria-label="Titolo della nuova sezione"
              onChange={(e) => setNewSection(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSection() } }}
            />
            <button type="button" className="btn" onClick={addSection} disabled={!newSection.trim()}><Plus size={14} /> Sezione</button>
          </div>
        </fieldset>

        <fieldset className="pf-block">
          <legend>Link</legend>
          {form.links.map((l, i) => (
            <div key={i} className="pf-item">
              <div className="grow">
                <strong>{l.title}</strong>
                <div className="small muted" style={{ wordBreak: 'break-all' }}>{l.url}</div>
              </div>
              <button type="button" className="btn-icon sm" onClick={() => removeLink(i)} aria-label={`Rimuovi il link ${l.title}`}><X size={14} /></button>
            </div>
          ))}
          <div className="field-row">
            <input value={newLink.title} placeholder="Titolo" aria-label="Titolo del link" onChange={(e) => setNewLink(l => ({ ...l, title: e.target.value }))} />
            <input type="url" value={newLink.url} placeholder="https://…" aria-label="Indirizzo del link" onChange={(e) => setNewLink(l => ({ ...l, url: e.target.value }))} />
          </div>
          <div><button type="button" className="btn btn-sm" onClick={addLink} disabled={!newLink.title.trim() || !newLink.url.trim()}><Plus size={14} /> Aggiungi link</button></div>
        </fieldset>

        <fieldset className="pf-block">
          <legend>Cose da fare</legend>
          {form.todos.map((t, i) => (
            <div key={i} className="pf-item">
              <input type="checkbox" checked={!!t.completed} onChange={() => toggleTodo(i)} aria-label={`Segna “${t.text}” come fatta`} />
              <span className={`grow ${t.completed ? 'muted' : ''}`} style={t.completed ? { textDecoration: 'line-through' } : undefined}>{t.text}</span>
              <button type="button" className="btn-icon sm" onClick={() => removeTodo(i)} aria-label={`Rimuovi “${t.text}”`}><X size={14} /></button>
            </div>
          ))}
          <div className="row row-wrap">
            <input
              className="grow" style={{ minWidth: 160 }} value={newTodo.text} placeholder="Nuova cosa da fare" aria-label="Testo della cosa da fare"
              onChange={(e) => setNewTodo(t => ({ ...t, text: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTodo() } }}
            />
            <input type="date" style={{ width: 150 }} value={newTodo.deadline} aria-label="Scadenza" onChange={(e) => setNewTodo(t => ({ ...t, deadline: e.target.value }))} />
            <button type="button" className="btn" onClick={addTodo} disabled={!newTodo.text.trim()}><Plus size={14} /> Aggiungi</button>
          </div>
        </fieldset>

        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  )
}

export default ProjectForm
