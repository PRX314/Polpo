import { useState } from 'react'
import { addProject } from '../firebaseService'

// Deriva un nome progetto dal nome file (senza estensione, senza path)
const nameFromFilename = (filename) => {
  const base = filename.split('/').pop().split('\\').pop()
  return base.replace(/\.md$/i, '')
}

// Estrae una breve descrizione dal contenuto markdown: prima riga non vuota,
// non-heading, non dentro il blocco frontmatter YAML (--- ... ---)
const extractDescription = (text) => {
  let lines = text.split('\n')

  // Rimuovi frontmatter YAML se presente
  if (lines[0]?.trim() === '---') {
    const endIdx = lines.slice(1).findIndex(l => l.trim() === '---')
    if (endIdx !== -1) {
      lines = lines.slice(endIdx + 2)
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#')) continue
    if (line.startsWith('---')) continue
    return line.length > 200 ? line.slice(0, 200) + '…' : line
  }
  return ''
}

const VaultImport = ({ projects, onClose, onSuccess, onError }) => {
  const [candidates, setCandidates] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [importing, setImporting] = useState(false)

  const existingNames = new Set(
    (projects || []).map(p => (p.name || '').trim().toLowerCase())
  )

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.name.toLowerCase().endsWith('.md'))
    if (files.length === 0) return

    setLoadingFiles(true)
    try {
      const results = await Promise.all(files.map(async (file) => {
        const text = await file.text()
        const name = nameFromFilename(file.name)
        const description = extractDescription(text)
        const vaultNote = name
        const isIndexFile = file.name.toLowerCase() === '_index.md'
        const alreadyExists = existingNames.has(name.trim().toLowerCase())

        return {
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
          name,
          description,
          vaultNote,
          alreadyExists,
          checked: !isIndexFile && !alreadyExists
        }
      }))

      // Ordina alfabeticamente per comodità
      results.sort((a, b) => a.name.localeCompare(b.name))
      setCandidates(results)
    } catch (err) {
      console.error('Errore lettura file vault:', err)
      onError && onError('Errore nella lettura dei file selezionati')
    } finally {
      setLoadingFiles(false)
    }
  }

  const updateCandidate = (id, updates) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const checkedCount = candidates.filter(c => c.checked).length

  const handleImport = async () => {
    const toImport = candidates.filter(c => c.checked && c.name.trim())
    if (toImport.length === 0) return

    setImporting(true)
    try {
      for (const c of toImport) {
        await addProject({
          name: c.name.trim(),
          description: c.description.trim(),
          vaultNote: c.vaultNote || null,
          status: 'pending',
          tags: []
        })
      }
      onSuccess && onSuccess(toImport.length)
      onClose && onClose()
    } catch (err) {
      console.error('Errore import vault:', err)
      onError && onError('Errore durante l\'importazione dal vault')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <button onClick={onClose} className="back-button">
        ← Torna alla home
      </button>

      <div className="project-card mb-6">
        <h2 className="title-section mb-2">📔 Importa dal Vault</h2>
        <p className="text-description mb-4">
          Seleziona la cartella <code>20-Projects</code> del tuo vault Obsidian per creare
          progetti candidati a partire dai file <code>.md</code>. Niente viene salvato finché non
          confermi con "Importa selezionati".
        </p>

        <label className="btn-primary" style={{ display: 'inline-flex', cursor: 'pointer' }}>
          {loadingFiles ? '⏳ Leggendo file...' : '📁 Scegli cartella / file .md'}
          <input
            type="file"
            webkitdirectory="true"
            multiple
            accept=".md"
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </label>
      </div>

      {candidates.length > 0 && (
        <div className="project-card">
          <div className="flex-between mb-4">
            <h3 className="title-section" style={{ marginBottom: 0 }}>
              Trovati {candidates.length} file — {checkedCount} selezionati
            </h3>
            <button
              onClick={handleImport}
              className="btn-primary"
              disabled={importing || checkedCount === 0}
            >
              {importing ? '⏳ Importando...' : `Importa selezionati (${checkedCount})`}
            </button>
          </div>

          <div className="list-projects">
            {candidates.map(c => (
              <div
                key={c.id}
                className="project-list-item"
                style={{ cursor: 'default', flexWrap: 'wrap', alignItems: 'flex-start' }}
              >
                <input
                  type="checkbox"
                  checked={c.checked}
                  onChange={(e) => updateCandidate(c.id, { checked: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '0.4rem', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.25rem 0' }}>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateCandidate(c.id, { name: e.target.value })}
                    placeholder="Nome progetto"
                    style={{ fontWeight: 600 }}
                  />
                  <textarea
                    value={c.description}
                    onChange={(e) => updateCandidate(c.id, { description: e.target.value })}
                    placeholder="Breve descrizione"
                    rows={2}
                  />
                  <div className="text-meta" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>📔 {c.vaultNote}</span>
                    {c.alreadyExists && (
                      <span className="tag" style={{ color: '#dc2626' }}>già presente</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {candidates.length === 0 && !loadingFiles && (
        <div className="empty-state">
          <div className="empty-state-icon">📔</div>
          <p>Nessun file selezionato. Scegli la cartella del vault per iniziare.</p>
        </div>
      )}
    </div>
  )
}

export default VaultImport
