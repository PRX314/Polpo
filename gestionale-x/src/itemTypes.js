// Tipi unificati per tutti gli elementi del gestionale
// Ogni tipo ha: icon, label, color, defaultSections (template)

export const ITEM_TYPES = {
  progetto: {
    icon: '📁',
    label: 'Progetto',
    color: '#54a0ff',
    colorLight: '#e8f0fe',
    defaultSections: [
      { icon: '🎯', title: 'Obiettivi', content: '' },
      { icon: '📍', title: 'Roadmap', content: '' },
    ]
  },
  idea: {
    icon: '💡',
    label: 'Idea',
    color: '#feca57',
    colorLight: '#fff9e0',
    defaultSections: [
      { icon: '📝', title: 'Descrizione', content: '' },
      { icon: '🚀', title: 'Sviluppo', content: '' },
    ]
  },
  monologo: {
    icon: '🎭',
    label: 'Monologo',
    color: '#ff6b6b',
    colorLight: '#ffe0e0',
    defaultSections: [
      { icon: '📝', title: 'Testo', content: '' },
      { icon: '🎯', title: 'Temi e Spunti', content: '' },
      { icon: '💡', title: 'Note Regia', content: '' },
    ]
  },
  musica: {
    icon: '🎵',
    label: 'Musica',
    color: '#a78bfa',
    colorLight: '#f0ebff',
    defaultSections: [
      { icon: '📝', title: 'Testo / Rime', content: '' },
      { icon: '🎹', title: 'Beat / Produzione', content: '' },
      { icon: '💡', title: 'Ispirazione', content: '' },
    ]
  },
  video: {
    icon: '🎬',
    label: 'Video',
    color: '#ff9f43',
    colorLight: '#fff0e0',
    defaultSections: [
      { icon: '📝', title: 'Concept', content: '' },
      { icon: '🎬', title: 'Script / Scaletta', content: '' },
      { icon: '📦', title: 'Attrezzatura / Location', content: '' },
    ]
  },
  evento: {
    icon: '🎪',
    label: 'Evento',
    color: '#20c997',
    colorLight: '#e0fbf1',
    defaultSections: [
      { icon: '📋', title: 'Programma', content: '' },
      { icon: '📍', title: 'Location', content: '' },
      { icon: '💰', title: 'Budget', content: '' },
    ]
  },
  nota: {
    icon: '📝',
    label: 'Nota',
    color: '#6b7280',
    colorLight: '#f0f1f3',
    defaultSections: []
  }
}

export const ITEM_TYPE_LIST = Object.entries(ITEM_TYPES).map(([key, val]) => ({
  key,
  ...val
}))

// Genera sezioni con ID unico dal template
export function createSectionsFromTemplate(typeKey) {
  const type = ITEM_TYPES[typeKey]
  if (!type || !type.defaultSections.length) return []
  return type.defaultSections.map((s, i) => ({
    id: `${Date.now()}-${i}`,
    icon: s.icon,
    title: s.title,
    content: s.content
  }))
}

export function getTypeInfo(typeKey) {
  return ITEM_TYPES[typeKey] || ITEM_TYPES.nota
}
