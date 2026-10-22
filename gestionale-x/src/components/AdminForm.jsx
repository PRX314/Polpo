import { useState } from 'react'
import Modal from './ui/Modal'
import { AREE, AVVISI, RIPETI } from '../lib/amministrativa'

// Form di una scadenza amministrativa personale: bollo, assicurazione, abbonamento, rinnovo di un documento.
// È un appuntamento con `admin: true` e una ricorrenza: la data è sempre la prossima volta da fare.
const empty = (date) => ({ title: '', date: date || '', area: 'burocrazia', repeat: '', every: 1, amount: '', remindDays: 7, notes: '' })

const ripetiValue = (f) => (f.repeat ? `${f.repeat}:${Number(f.every) || 1}` : '')
const avvisoValue = (v) => (v === null || v === undefined ? '' : String(v))

const AdminForm = ({ scadenza, data, onSave, onDelete, onClose }) => {
  const [form, setForm] = useState(() => ({ ...empty(data), ...(scadenza || {}), amount: scadenza?.amount ?? '' }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const field = (name) => (e) => setForm(f => ({ ...f, [name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Serve un titolo')
    if (!form.date) return setError('Serve la data della prossima volta')
    const amount = String(form.amount).trim() === '' ? null : Number(String(form.amount).replace(',', '.'))
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) return setError('Importo non valido')

    setError(''); setSaving(true)
    try {
      await onSave({
        admin: true, title: form.title.trim(), date: form.date, time: '', endTime: '', reminder: null,
        area: form.area, repeat: form.repeat || '', every: form.repeat ? Number(form.every) || 1 : 1,
        amount, remindDays: form.remindDays, notes: (form.notes || '').trim(), done: false
      })
      onClose()
    } catch (err) {
      setError(err?.message || 'Salvataggio non riuscito')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={scadenza ? 'Modifica scadenza' : 'Nuova scadenza'} size="narrow" onClose={onClose}
      footer={
        <>
          {scadenza && <button type="button" className="btn spacer" onClick={() => { onDelete(scadenza.id); onClose() }}>Elimina</button>}
          <button type="button" className="btn" onClick={onClose}>Annulla</button>
          <button type="submit" form="admin-form" className="btn btn-primary" disabled={saving}>{saving ? 'Salvo…' : 'Salva'}</button>
        </>
      }
    >
      <form id="admin-form" className="modal-body" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="ad-title">Cosa *</label>
          <input id="ad-title" value={form.title} onChange={field('title')} placeholder="Es. Bollo auto, rinnovo carta d'identità, Netflix" />
        </div>
        <div className="field">
          <span className="field-label">Tipo</span>
          <div className="seg" role="group" aria-label="Tipo">
            {Object.entries(AREE).map(([k, label]) => (
              <button key={k} type="button" style={{ width: 'auto', padding: '0 12px' }} className={form.area === k ? 'is-on' : ''} aria-pressed={form.area === k} onClick={() => setForm(f => ({ ...f, area: k }))}>{label}</button>
            ))}
          </div>
        </div>
        <div className="field-row keep">
          <div className="field">
            <label htmlFor="ad-date">Prossima volta *</label>
            <input id="ad-date" type="date" value={form.date} onChange={field('date')} />
          </div>
          <div className="field">
            <label htmlFor="ad-amount">Importo €</label>
            <input id="ad-amount" inputMode="decimal" value={form.amount} onChange={field('amount')} placeholder="facoltativo" />
          </div>
        </div>
        <div className="field-row keep">
          <div className="field">
            <label htmlFor="ad-repeat">Si ripete</label>
            <select id="ad-repeat" value={ripetiValue(form)} onChange={(e) => {
              const [repeat, every] = e.target.value ? e.target.value.split(':') : ['', '1']
              setForm(f => ({ ...f, repeat, every: Number(every) }))
            }}>
              {RIPETI.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ad-remind">Avviso</label>
            <select id="ad-remind" value={avvisoValue(form.remindDays)} onChange={(e) => setForm(f => ({ ...f, remindDays: e.target.value === '' ? null : Number(e.target.value) }))}>
              {AVVISI.map(a => <option key={avvisoValue(a.value)} value={avvisoValue(a.value)}>{a.label}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="ad-notes">Note</label>
          <textarea id="ad-notes" rows={2} value={form.notes} onChange={field('notes')} placeholder="Es. targa, numero di polizza, dove si paga" />
        </div>
        <p className="help">L'avviso arriva dal calendario dell'iPhone: dopo aver salvato, tocca «Aggiungi al calendario».</p>
        {error && <div className="form-error" role="alert">{error}</div>}
      </form>
    </Modal>
  )
}

export default AdminForm
