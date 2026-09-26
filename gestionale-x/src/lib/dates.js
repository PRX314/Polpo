// Date in formato ISO locale (YYYY-MM-DD): un solo posto, prima erano copiate in cinque file.

export const pad = (n) => String(n).padStart(2, '0')

export const isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
export const toIso = (date) => isoOf(date.getFullYear(), date.getMonth(), date.getDate())
export const oggiIso = () => toIso(new Date())

export const addDaysIso = (n, from = new Date()) => {
  const d = new Date(from)
  d.setDate(d.getDate() + n)
  return toIso(d)
}

const dayStart = (iso) => new Date(`${iso}T00:00:00`)

// Giorni da oggi: negativo = scaduto
export const daysFromToday = (iso) => {
  if (!iso) return null
  return Math.round((dayStart(iso) - dayStart(oggiIso())) / 86400000)
}

// "oggi", "domani", "3g fa", "tra 5g", oppure la data quando è lontana.
// tone: late | today | soon | '' — serve a scegliere l'enfasi, non un colore.
export const relativeDay = (iso) => {
  const diff = daysFromToday(iso)
  if (diff === null) return null
  if (diff < 0) return { text: `${Math.abs(diff)}g fa`, tone: 'late', diff }
  if (diff === 0) return { text: 'oggi', tone: 'today', diff }
  if (diff === 1) return { text: 'domani', tone: 'soon', diff }
  if (diff <= 7) return { text: `tra ${diff}g`, tone: 'soon', diff }
  return { text: shortDate(iso), tone: '', diff }
}

export const shortDate = (iso) =>
  dayStart(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

export const longDate = (iso) =>
  dayStart(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

export const fullDate = (value) =>
  value ? new Date(value).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

export const timeAgo = (value) => {
  if (!value) return ''
  const diff = Math.floor((Date.now() - new Date(value)) / 1000)
  if (diff < 60) return 'ora'
  if (diff < 3600) return `${Math.floor(diff / 60)} min fa`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h fa`
  if (diff < 604800) return `${Math.floor(diff / 86400)} g fa`
  return new Date(value).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

// 7 o 7.5 -> '07:00' / '07:30': i blocchi della routine sono nati con ore numeriche
export const hourToTime = (n) => {
  const tot = Math.round((Number(n) || 0) * 60)
  return `${pad(Math.floor(tot / 60))}:${pad(tot % 60)}`
}
export const timeToHour = (s) => {
  const [h, m] = String(s || '0:0').split(':').map(Number)
  return (h || 0) + (m || 0) / 60
}
