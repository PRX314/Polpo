import { useState } from 'react'
import { ANTICIPI, daSelect, aSelect } from '../sveglie'

// Form di un appuntamento. E' la prima cosa nel gestionale che ha un orario
// vero: da qui nasce la sveglia che la function fa suonare all'ora giusta.

const vuoto = (data) => ({
  title: '', date: data || '', time: '', endTime: '',
  reminder: null, notes: ''
})

const EventForm = ({ evento, data, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState(() => ({ ...vuoto(data), ...(evento || {}) }))
  const [errore, setErrore] = useState('')
  const [salvataggio, setSalvataggio] = useState(false)

  const campo = (nome) => (e) => setForm(f => ({ ...f, [nome]: e.target.value }))

  const salva = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setErrore('Serve un titolo')
    if (!form.date) return setErrore('Serve una data')
    // Una sveglia senza orario non saprebbe quando suonare: meglio dirlo qui
    // che lasciarla muta senza spiegazioni.
    if (form.reminder !== null && !form.time) {
      return setErrore('Per la sveglia serve anche un orario')
    }
    if (form.endTime && form.time && form.endTime < form.time) {
      return setErrore('La fine viene prima dell inizio')
    }

    setErrore(''); setSalvataggio(true)
    try {
      await onSave({
        title: form.title.trim(),
        date: form.date,
        time: form.time || '',
        endTime: form.endTime || '',
        reminder: form.reminder,
        notes: (form.notes || '').trim()
      })
      onClose()
    } catch (err) {
      setErrore(err?.message || 'Salvataggio fallito')
      setSalvataggio(false)
    }
  }

  return (
    <div className="form-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="form-modal-content">
        <div className="form-header">
          <h2>{evento ? 'Modifica appuntamento' : 'Nuovo appuntamento'}</h2>
          <button onClick={onClose} className="close-button" type="button">×</button>
        </div>

        <form className="form" onSubmit={salva}>
          <div className="form-group">
            <label htmlFor="ev-title">Titolo *</label>
            <input
              id="ev-title" type="text" value={form.title} onChange={campo('title')}
              placeholder="Es. Dentista, chiamata con Ava…" autoFocus
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="ev-date">📅 Data *</label>
              <input id="ev-date" type="date" value={form.date} onChange={campo('date')} />
            </div>
            <div className="form-group">
              <label htmlFor="ev-time">🕒 Ora</label>
              <input id="ev-time" type="time" value={form.time} onChange={campo('time')} />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="ev-end">Fine (facoltativa)</label>
              <input id="ev-end" type="time" value={form.endTime} onChange={campo('endTime')} />
            </div>
            <div className="form-group">
              <label htmlFor="ev-rem">⏰ Sveglia</label>
              <select
                id="ev-rem"
                value={aSelect(form.reminder)}
                onChange={(e) => setForm(f => ({ ...f, reminder: daSelect(e.target.value) }))}
              >
                {ANTICIPI.map(a => (
                  <option key={String(a.value)} value={aSelect(a.value)}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ev-notes">Note</label>
            <textarea id="ev-notes" rows={2} value={form.notes} onChange={campo('notes')} />
          </div>

          {form.reminder !== null && !form.time && (
            <p className="form-help">Scegli un orario, altrimenti la sveglia non ha un momento a cui suonare.</p>
          )}
          {errore && <div className="error-message">{errore}</div>}

          <div className="form-actions">
            {evento && (
              <button type="button" className="btn-secondary" onClick={() => { onDelete(evento.id); onClose() }}>
                🗑 Elimina
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn-primary" disabled={salvataggio}>
              {salvataggio ? '⏳ …' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventForm
