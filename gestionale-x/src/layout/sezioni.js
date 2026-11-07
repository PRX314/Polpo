import { House, Folder, HeartPulse, MessageSquare } from 'lucide-react'

// Quattro sezioni (decise il 2026-10-04): prima erano sette, e Oggi, Da fare, Calendario e
// Routine mostravano in buona parte le stesse cose.
//   Oggi      cosa conta oggi e questa settimana
//   Progetti  elenco e cose da fare dei progetti (roadmap dal vault comprese)
//   Vita      agenda, documenti, appunti, routine: le cose personali
//   Peppino     la chat
// Le pagine di prima restano ai loro indirizzi: Progetti e Vita le raggruppano con una barra
// di sotto-sezioni, così i link già esistenti (anche nelle chat salvate) continuano a funzionare.
export const SECTIONS = [
  { to: '/', label: 'Oggi', icon: House, match: (p) => p === '/' },
  {
    to: '/elementi', label: 'Progetti', icon: Folder,
    match: (p) => p.startsWith('/elementi') || p.startsWith('/da-fare'),
    sub: [
      { to: '/elementi', label: 'Elenco', match: (p) => p.startsWith('/elementi') },
      { to: '/da-fare', label: 'Cose da fare', match: (p) => p.startsWith('/da-fare') }
    ]
  },
  {
    to: '/calendario', label: 'Vita', icon: HeartPulse,
    match: (p) => ['/calendario', '/documenti', '/appunti', '/routine'].some(x => p.startsWith(x)),
    sub: [
      { to: '/calendario', label: 'Agenda', match: (p) => p.startsWith('/calendario') },
      { to: '/documenti', label: 'Documenti', match: (p) => p.startsWith('/documenti') },
      { to: '/appunti', label: 'Appunti', match: (p) => p.startsWith('/appunti') },
      { to: '/routine', label: 'Routine', match: (p) => p.startsWith('/routine') }
    ]
  },
  {
    to: '/ai', label: 'Peppino', icon: MessageSquare,
    match: p => p.startsWith('/ai') || p.startsWith('/sveglia'),
    sub: [
      { to: '/ai', label: 'Chat', match: p => p.startsWith('/ai') },
      { to: '/sveglia', label: 'Sveglia', match: p => p.startsWith('/sveglia') }
    ]
  }
]

// Le altre pagine di Peppino (tutte tranne la chat): nella chat stanno nel menu delle conversazioni
export const ALTRE_DI_PEPPINO = SECTIONS.find(s => s.to === '/ai').sub.filter(s => s.to !== '/ai')
