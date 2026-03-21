// Export Service - CSV and PDF export for projects and notes

// ============================================================================
// CSV EXPORT
// ============================================================================

function escapeCsv(val) {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportProjectsCSV(projects, notes) {
  const rows = [
    ['Progetto', 'Descrizione', 'Stato', 'Tags', 'Scadenza', 'Todo Completati', 'Todo Totali', 'Progresso %', 'Note Associate', 'Creato'].join(',')
  ]

  projects.forEach(p => {
    const associatedNotes = notes.filter(n =>
      n.projectId === p.id ||
      (n.projectTags && n.projectTags.some(t => p.tags && p.tags.includes(t)))
    )
    const done = (p.todos || []).filter(t => t.completed).length
    const total = (p.todos || []).length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0

    rows.push([
      escapeCsv(p.name),
      escapeCsv(p.description),
      escapeCsv(p.status),
      escapeCsv((p.tags || []).join('; ')),
      escapeCsv(p.deadline || ''),
      done,
      total,
      progress,
      associatedNotes.length,
      escapeCsv(p.createdAt ? new Date(p.createdAt).toLocaleDateString('it-IT') : '')
    ].join(','))
  })

  downloadFile(rows.join('\n'), 'progetti_polpo.csv', 'text/csv;charset=utf-8;')
}

export function exportNotesCSV(notes, projects) {
  const rows = [
    ['Titolo', 'Tipo', 'Priorita', 'Contenuto', 'Progetto', 'Tags', 'Colore', 'Creato'].join(',')
  ]

  notes.forEach(n => {
    const project = n.projectId ? projects.find(p => p.id === n.projectId) : null
    rows.push([
      escapeCsv(n.title),
      escapeCsv(n.type),
      escapeCsv(n.priority),
      escapeCsv(n.content?.slice(0, 200)),
      escapeCsv(project?.name || ''),
      escapeCsv((n.projectTags || []).join('; ')),
      escapeCsv(n.color || ''),
      escapeCsv(n.createdAt ? new Date(n.createdAt).toLocaleDateString('it-IT') : '')
    ].join(','))
  })

  downloadFile(rows.join('\n'), 'note_polpo.csv', 'text/csv;charset=utf-8;')
}

export function exportAllCSV(projects, notes) {
  exportProjectsCSV(projects, notes)
  setTimeout(() => exportNotesCSV(notes, projects), 500)
}

// ============================================================================
// PDF EXPORT (Print-based)
// ============================================================================

export function exportProjectPDF(project, associatedNotes) {
  const html = buildProjectHTML(project, associatedNotes)
  printHTML(html, `Progetto: ${project.name}`)
}

export function exportAllProjectsPDF(projects, notes) {
  const sections = projects.map(p => {
    const pNotes = notes.filter(n =>
      n.projectId === p.id ||
      (n.projectTags && n.projectTags.some(t => p.tags && p.tags.includes(t)))
    )
    return buildProjectHTML(p, pNotes)
  })

  const html = sections.join('<div style="page-break-after: always;"></div>')
  printHTML(html, 'Tutti i Progetti - Gestionale Polpo')
}

function buildProjectHTML(project, associatedNotes) {
  const statusLabels = { pending: 'Da Fare', in_progress: 'In Corso', completed: 'Completato', paused: 'In Pausa' }
  const done = (project.todos || []).filter(t => t.completed).length
  const total = (project.todos || []).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  let html = `
    <div style="margin-bottom: 2rem;">
      <h1 style="margin: 0 0 0.25rem; font-size: 1.5rem; color: #333;">${esc(project.name)}</h1>
      <div style="display: flex; gap: 1rem; font-size: 0.85rem; color: #666; margin-bottom: 1rem;">
        <span><strong>Stato:</strong> ${statusLabels[project.status] || project.status}</span>
        ${project.deadline ? `<span><strong>Scadenza:</strong> ${new Date(project.deadline).toLocaleDateString('it-IT')}</span>` : ''}
        <span><strong>Creato:</strong> ${project.createdAt ? new Date(project.createdAt).toLocaleDateString('it-IT') : ''}</span>
      </div>
      ${project.description ? `<p style="color: #555; line-height: 1.6;">${esc(project.description)}</p>` : ''}
      ${(project.tags || []).length > 0 ? `<p style="color: #888; font-size: 0.85rem;">Tags: ${project.tags.map(t => '#' + t).join(', ')}</p>` : ''}
  `

  if (project.roadmap) {
    html += `<div style="margin: 1rem 0;"><h3 style="font-size: 1rem; color: #333;">Roadmap</h3><p style="white-space: pre-wrap; color: #555; font-size: 0.9rem;">${esc(project.roadmap)}</p></div>`
  }

  if (project.obiettivi) {
    html += `<div style="margin: 1rem 0;"><h3 style="font-size: 1rem; color: #333;">Obiettivi</h3><p style="white-space: pre-wrap; color: #555; font-size: 0.9rem;">${esc(project.obiettivi)}</p></div>`
  }

  if (total > 0) {
    html += `<div style="margin: 1rem 0;">
      <h3 style="font-size: 1rem; color: #333;">Cose da Fare (${done}/${total} - ${progress}%)</h3>
      <div style="height: 8px; background: #eee; border-radius: 4px; margin-bottom: 0.5rem;">
        <div style="height: 100%; width: ${progress}%; background: ${progress === 100 ? '#20c997' : '#54a0ff'}; border-radius: 4px;"></div>
      </div>
      <ul style="padding-left: 1.25rem; color: #555; font-size: 0.9rem;">`
    ;(project.todos || []).forEach(t => {
      html += `<li style="margin-bottom: 0.25rem; ${t.completed ? 'text-decoration: line-through; color: #999;' : ''}">${esc(t.text)}${t.deadline ? ` <span style="color: #888; font-size: 0.8rem;">(${new Date(t.deadline).toLocaleDateString('it-IT')})</span>` : ''}</li>`
    })
    html += `</ul></div>`
  }

  if (associatedNotes.length > 0) {
    html += `<div style="margin: 1rem 0;">
      <h3 style="font-size: 1rem; color: #333;">Note Associate (${associatedNotes.length})</h3>`
    associatedNotes.forEach(n => {
      html += `<div style="padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid #ddd; border-radius: 6px; ${n.color ? 'border-left: 4px solid ' + n.color + ';' : ''}">
        <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem;">${esc(n.title)}</div>
        <div style="font-size: 0.8rem; color: #666;">${esc(n.content?.slice(0, 300) || '')}${(n.content?.length || 0) > 300 ? '...' : ''}</div>
      </div>`
    })
    html += `</div>`
  }

  html += `</div>`
  return html
}

// ============================================================================
// UTILS
// ============================================================================

function esc(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function downloadFile(content, filename, mimeType) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function printHTML(bodyHTML, title) {
  const win = window.open('', '_blank')
  if (!win) {
    alert('Consenti i popup per esportare in PDF')
    return
  }
  win.document.write(`<!DOCTYPE html>
<html><head>
  <title>${esc(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #333; }
    h1 { border-bottom: 2px solid #667eea; padding-bottom: 0.5rem; }
    @media print { body { margin: 0; } }
  </style>
</head><body>
  <div style="text-align: center; margin-bottom: 2rem; color: #888; font-size: 0.85rem;">
    Gestionale Polpo - Esportato il ${new Date().toLocaleDateString('it-IT')}
  </div>
  ${bodyHTML}
</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 500)
}
