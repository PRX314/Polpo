import { useState } from 'react'
import Modal from './ui/Modal'
import { ANTICIPI, daSelect, aSelect } from '../sveglie'

// Form di un appuntamento: la prima cosa nel gestionale che ha un orario vero,
// da qui nasce la sveglia che la function fa suonare all'ora giusta.
const empty = (date) => ({ title: '', date: date || '', time: '', endTime: '', reminder: null, notes: '' })

const EventForm = ({ evento, data, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState(() => ({ ...empty(data), ...(evento || {}) }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const field = (name) => (e) => setForm(f => ({ ...f, [name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Serve un titolo')
    if (!form.date) return setError('Serve una data')
    // Una sveglia senza orario non saprebbe quando suonare: meglio dirlo qui che lasciarla muta
    if (form.reminder !== null && !form.time) return setError('Per la sveglia serve anche un orario')
    if (form.endTime && form.time && form.endTime < form.time) return setError('La fine viene prima dell\'inizio')

    setError(''); setSaving(true)
    try {
      await onSave({
        title: form.title.trim(), date: form.date, time: form.time || '', endTime: form.endTime || '',
        reminder: form.reminder, notes: (form.notes || '').trim()
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Salvataggio non riuscito')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={evento ? 'Modifica appuntamento' : 'Nuovo appuntamento'} size="narrow" onClose={onClose}
      footer={
        <>
          {evento && <button type="button" className="btn spacer" onClick={() => { onDelete(evento.id); onClose() }}>Elimina</button>}
          <button type="button" className="btn" onClick={onClose}>Annulla</button>
          <button type="submit" form="event-form" className="btn btn-primary" disabled={saving}>{saving ? 'Salvo…' : 'Salva'}</button>
        </>
      }
    >
      <form id="event-form" className="modal-body" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="ev-title">Titolo *</label>
          <input id="ev-title" value={form.title} onChange={field('title')} placeholder="Es. Dentista, chiamata con Ava" />
        </div>
        <div className="field-row keep">
          <div className="field">
            <label htmlFor="ev-date">Data *</label>
            <input id="ev-date" type="date" value={form.date} onChange={field('date')} />
          </div>
          <div className="field">
            <label htmlFor="ev-time">Ora</label>
            <input id="ev-time" type="time" value={form.time} onChange={field('time')} />
          </div>
        </div>
        <div className="field-row keep">
          <div className="field">
            <label htmlFor="ev-end">Fine (facoltativa)</label>
            <input id="ev-end" type="time" value={form.endTime} onChange={field('endTime')} />
          </div>
          <div className="field">
            <label htmlFor="ev-rem">Sveglia</label>
            <select id="ev-rem" value={aSelect(form.reminder)} onChange={(e) => setForm(f => ({ ...f, reminder: daSelect(e.target.value) }))}>
              {ANTICIPI.map(a => <option key={String(a.value)} value={aSelect(a.value)}>{a.label}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="ev-notes">Note</label>
          <textarea id="ev-notes" rows={2} value={form.notes} onChange={field('notes')} />
        </div>
        {form.reminder !== null && !form.time && <p className="help">Scegli un orario, altrimenti la sveglia non ha un momento a cui suonare.</p>}
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  )
}

export default EventForm
