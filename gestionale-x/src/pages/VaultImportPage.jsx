import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'
import { addProject } from '../firebaseService'
import { useData } from '../context/useData'
import { useToast } from '../context/useToast'

// Nome del progetto dal nome file (senza estensione, senza percorso)
const nameFromFilename = (filename) => filename.split('/').pop().split('\\').pop().replace(/\.md$/i, '')

// Breve descrizione dal contenuto markdown: prima riga non vuota, non titolo,
// non dentro il blocco frontmatter YAML (--- ... ---)
const extractDescription = (text) => {
  let lines = text.split('\n')
  if (lines[0]?.trim() === '---') {
    const end = lines.slice(1).findIndex(l => l.trim() === '---')
    if (end !== -1) lines = lines.slice(end + 2)
  }
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith('---')) continue
    return line.length > 200 ? `${line.slice(0, 200)}…` : line
  }
  return ''
}

const VaultImportPage = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { projects } = useData()
  const [candidates, setCandidates] = useState([])
  const [reading, setReading] = useState(false)
  const [importing, setImporting] = useState(false)

  const existing = new Set(projects.map(p => (p.name || '').trim().toLowerCase()))

  const onFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.name.toLowerCase().endsWith('.md'))
    if (!files.length) return
    setReading(true)
    try {
      const results = await Promise.all(files.map(async (file) => {
        const text = await file.text()
        const name = nameFromFilename(file.name)
        const exists = existing.has(name.trim().toLowerCase())
        return {
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
          name, description: extractDescription(text), vaultNote: name, alreadyExists: exists,
          checked: file.name.toLowerCase() !== '_index.md' && !exists
        }
      }))
      results.sort((a, b) => a.name.localeCompare(b.name))
      setCandidates(results)
    } catch (err) {
      console.error('Errore lettura file vault:', err)
      toast.err('Non riesco a leggere i file selezionati')
    } finally {
      setReading(false)
    }
  }

  const update = (id, patch) => setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  const checked = candidates.filter(c => c.checked).length

  const doImport = async () => {
    const chosen = candidates.filter(c => c.checked && c.name.trim())
    if (!chosen.length) return
    setImporting(true)
    try {
      for (const c of chosen) {
        await addProject({ name: c.name.trim(), description: c.description.trim(), vaultNote: c.vaultNote || null, status: 'pending', tags: [] })
      }
      toast.ok(`${chosen.length} ${chosen.length === 1 ? 'elemento importato' : 'elementi importati'} dal vault`)
      navigate('/elementi')
    } catch (err) {
      console.error('Errore import vault:', err)
      toast.err('Importazione non riuscita')
      setImporting(false)
    }
  }

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div><Link to="/" className="btn btn-quiet btn-sm"><ArrowLeft size={14} /> Oggi</Link></div>

      <div className="page-head" style={{ paddingBottom: 0 }}>
        <div>
          <h1>Importa dal vault</h1>
          <p className="sub" style={{ maxWidth: '60ch' }}>
            Scegli la cartella <code>20-Projects</code> del vault Obsidian per creare elementi dai file <code>.md</code>.
            Niente viene salvato finché non confermi.
          </p>
        </div>
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          <FolderOpen size={15} /> {reading ? 'Leggo i file…' : 'Scegli cartella'}
          <input type="file" webkitdirectory="true" multiple accept=".md" hidden onChange={(e) => onFiles(e.target.files)} />
        </label>
      </div>

      {candidates.length > 0 ? (
        <section className="card card-flush">
          <div className="row" style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)' }}>
            <strong className="grow">{candidates.length} file · {checked} selezionati</strong>
            <button className="btn btn-primary" onClick={doImport} disabled={importing || !checked}>
              {importing ? 'Importo…' : `Importa (${checked})`}
            </button>
          </div>
          <ul>
            {candidates.map(c => (
              <li key={c.id} className="vi-row">
                <input type="checkbox" checked={c.checked} onChange={(e) => update(c.id, { checked: e.target.checked })} aria-label={`Importa ${c.name}`} />
                <div className="stack grow" style={{ gap: 6 }}>
                  <input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} aria-label="Nome" style={{ fontWeight: 600 }} />
                  <textarea rows={2} value={c.description} onChange={(e) => update(c.id, { description: e.target.value })} aria-label="Descrizione" placeholder="Breve descrizione" />
                  <div className="row small faint">
                    <span>{c.vaultNote}</span>
                    {c.alreadyExists && <span className="tag">già presente</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : !reading && (
        <EmptyState title="Nessun file selezionato" hint="Scegli la cartella del vault per iniziare." />
      )}
    </div>
  )
}

export default VaultImportPage
