// Sveglie: le scelte di anticipo, uguali ovunque.
//
// Un solo posto per appuntamenti, routine e scadenze, cosi' le tre schermate
// offrono le stesse opzioni e la function sul server legge sempre lo stesso
// significato: reminder = minuti di anticipo, null = nessuna sveglia.

export const ANTICIPI = [
  { value: null, label: 'Nessuna sveglia' },
  { value: 0, label: "All'ora esatta" },
  { value: 5, label: '5 minuti prima' },
  { value: 10, label: '10 minuti prima' },
  { value: 15, label: '15 minuti prima' },
  { value: 30, label: '30 minuti prima' },
  { value: 60, label: "Un'ora prima" },
  { value: 120, label: '2 ore prima' },
  { value: 1440, label: 'Il giorno prima' }
]

// Le <option> di una select sono sempre stringhe: null e 0 andrebbero persi.
export const daSelect = (v) => (v === '' ? null : Number(v))
export const aSelect = (v) => (v === null || v === undefined ? '' : String(v))

export const etichettaAnticipo = (min) => {
  if (min === null || min === undefined) return ''
  const trovato = ANTICIPI.find(a => a.value === min)
  if (trovato) return trovato.label
  return min < 60 ? `${min} minuti prima` : `${Math.round(min / 60)} ore prima`
}

// Giorni della settimana con lo stesso indice di Date.getDay(), cosi' combacia
// con quello che gia' usano RoutineView e la function delle sveglie.
export const GIORNI = [
  { value: 1, label: 'L' }, { value: 2, label: 'M' }, { value: 3, label: 'M' },
  { value: 4, label: 'G' }, { value: 5, label: 'V' }, { value: 6, label: 'S' },
  { value: 0, label: 'D' }
]

// Un campo ora valido, o stringa vuota: evita di salvare '7' o '25:00'
export const oraValida = (v) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : '')
