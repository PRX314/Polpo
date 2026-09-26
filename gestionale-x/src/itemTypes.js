// Tipi unificati per tutti gli elementi del gestionale.
// Ogni tipo ha un'etichetta e le sezioni di partenza. Il tipo si riconosce dal
// testo, non dal colore: l'interfaccia è monocromatica.

export const ITEM_TYPES = {
  progetto: {
    label: 'Progetto',
    defaultSections: [
      { title: 'Obiettivi', content: '' },
      { title: 'Roadmap', content: '' },
    ]
  },
  idea: {
    label: 'Idea',
    defaultSections: [
      { title: 'Descrizione', content: '' },
      { title: 'Sviluppo', content: '' },
    ]
  },
  monologo: {
    label: 'Monologo',
    defaultSections: [
      { title: 'Testo', content: '' },
      { title: 'Temi e spunti', content: '' },
      { title: 'Note di regia', content: '' },
    ]
  },
  musica: {
    label: 'Musica',
    defaultSections: [
      { title: 'Testo / rime', content: '' },
      { title: 'Beat / produzione', content: '' },
      { title: 'Ispirazione', content: '' },
    ]
  },
  video: {
    label: 'Video',
    defaultSections: [
      { title: 'Hook', content: '' },
      { title: 'Script', content: '' },
      { title: 'CTA / chiusura', content: '' },
      { title: 'Hashtag / note', content: '' },
    ]
  },
  evento: {
    label: 'Evento',
    defaultSections: [
      { title: 'Programma', content: '' },
      { title: 'Location', content: '' },
      { title: 'Budget', content: '' },
    ]
  },
  nota: {
    label: 'Nota',
    defaultSections: []
  }
}

export const ITEM_TYPE_LIST = Object.entries(ITEM_TYPES).map(([key, val]) => ({ key, ...val }))

// Tipi che vivono come "note" collegate a un progetto tramite i tag
export const NOTE_TYPES = ['nota', 'idea', 'monologo', 'musica']

// Genera sezioni con ID unico dal template
export function createSectionsFromTemplate(typeKey) {
  const type = ITEM_TYPES[typeKey]
  if (!type || !type.defaultSections.length) return []
  return type.defaultSections.map((s, i) => ({
    id: `${Date.now()}-${i}`,
    title: s.title,
    content: s.content
  }))
}

export function getTypeInfo(typeKey) {
  return ITEM_TYPES[typeKey] || ITEM_TYPES.nota
}
