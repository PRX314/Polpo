// Livello "Amministrativa" del calendario: burocrazia e pagamenti, propri e di tutti.
//
// Le scadenze personali sono appuntamenti (collection `events`) con `admin: true`:
//   area       'burocrazia' | 'svago'
//   repeat     '' | 'month' | 'year'   (+ every = ogni quanti mesi/anni)
//   amount     euro, facoltativo
//   remindDays giorni di anticipo per l'avviso del calendario dell'iPhone (null = nessuno)
//   history    [{ date, doneAt }] le volte già pagate o fatte
// `date` è sempre la prossima volta da fare: segnarla fatta la sposta avanti di un giro.
//
// Le scadenze generali (uguali per tutti, ogni anno) sono scritte qui sotto e si accendono
// una per una; la scelta sta nel documento della routine, campo `amministrativa.generali`,
// così è la stessa su telefono e PC.

import { isoOf, pad, toIso } from './dates'

export const AREE = { burocrazia: 'Burocrazia', svago: 'Svago' }

export const RIPETI = [
  { value: '', label: 'Una volta sola' },
  { value: 'month:1', label: 'Ogni mese' },
  { value: 'month:3', label: 'Ogni 3 mesi' },
  { value: 'month:6', label: 'Ogni 6 mesi' },
  { value: 'year:1', label: 'Ogni anno' },
  { value: 'year:2', label: 'Ogni 2 anni' },
  { value: 'year:5', label: 'Ogni 5 anni' },
  { value: 'year:6', label: 'Ogni 6 anni' },
  { value: 'year:10', label: 'Ogni 10 anni' }
]

export const AVVISI = [
  { value: null, label: 'Nessun avviso' },
  { value: 0, label: 'Il giorno stesso' },
  { value: 1, label: 'Il giorno prima' },
  { value: 3, label: '3 giorni prima' },
  { value: 7, label: 'Una settimana prima' },
  { value: 15, label: '15 giorni prima' },
  { value: 30, label: 'Un mese prima' },
  { value: 90, label: '3 mesi prima' }
]

export const ripetiLabel = (e) => {
  if (!e?.repeat) return ''
  const n = Number(e.every) || 1
  if (e.repeat === 'month') return n === 1 ? 'ogni mese' : `ogni ${n} mesi`
  return n === 1 ? 'ogni anno' : `ogni ${n} anni`
}

export const euro = (n) => (Number(n) || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

// ── Date ──

const parse = (iso) => iso.split('-').map(Number)

// Aggiunge mesi tenendo il giorno: 31 gennaio + 1 mese = 28/29 febbraio, non 3 marzo
export const addMonthsIso = (iso, n) => {
  const [y, m, d] = parse(iso)
  const tot = (m - 1) + n
  const yy = y + Math.floor(tot / 12)
  const mm = ((tot % 12) + 12) % 12
  const last = new Date(yy, mm + 1, 0).getDate()
  return isoOf(yy, mm, Math.min(d, last))
}

const stepMonths = (e) => (e.repeat === 'year' ? 12 : 1) * (Number(e.every) || 1)

export const nextOccurrence = (e) => (e.repeat ? addMonthsIso(e.date, stepMonths(e)) : null)

// Tutte le volte di una scadenza personale tra from e to (compresi). La prima è `date` stessa.
export const occurrences = (e, from, to) => {
  if (!e.date) return []
  if (!e.repeat) return e.date >= from && e.date <= to ? [e.date] : []
  const out = []
  const step = stepMonths(e)
  for (let k = 0; k < 600; k++) {
    const iso = addMonthsIso(e.date, k * step)
    if (iso > to) break
    if (iso >= from) out.push(iso)
  }
  return out
}

// ── Festività nazionali ──
// Fonte: Nager.Date (gratis, senza chiave), una chiamata per anno e poi in memoria del browser.
// Se la rete manca si calcolano qui: date fisse più Pasqua.

const pasqua = (y) => {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(y, month - 1, day)
}

export const festivitaLocali = (y) => {
  const p = pasqua(y)
  const lun = new Date(p); lun.setDate(p.getDate() + 1)
  const fisse = [
    ['01-01', 'Capodanno'], ['01-06', 'Epifania'], ['04-25', 'Festa della Liberazione'], ['05-01', 'Festa del Lavoro'],
    ['06-02', 'Festa della Repubblica'], ['08-15', 'Ferragosto'], ['11-01', 'Tutti i Santi'],
    ['12-08', 'Immacolata Concezione'], ['12-25', 'Natale'], ['12-26', 'Santo Stefano']
  ]
  // San Francesco torna festa nazionale dal 2026
  if (y >= 2026) fisse.push(['10-04', "San Francesco d'Assisi"])
  return [
    ...fisse.map(([md, nome]) => ({ date: `${y}-${md}`, nome })),
    { date: toIso(p), nome: 'Pasqua' }, { date: toIso(lun), nome: "Lunedì dell'Angelo" }
  ].sort((a, b) => a.date.localeCompare(b.date))
}

const CACHE = 'gx-festivita-'
export const caricaFestivita = async (y) => {
  try {
    const salvate = localStorage.getItem(CACHE + y)
    if (salvate) return JSON.parse(salvate)
  } catch { /* memoria del browser non disponibile: si scarica di nuovo */ }
  try {
    const r = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/IT`)
    if (!r.ok) throw new Error(String(r.status))
    // global=false sono feste solo locali (es. Pentecoste in Alto Adige)
    const rows = (await r.json()).filter(h => h.global).map(h => ({ date: h.date, nome: h.localName }))
    if (!rows.length) throw new Error('vuoto')
    try { localStorage.setItem(CACHE + y, JSON.stringify(rows)) } catch { /* pazienza */ }
    return rows
  } catch {
    return festivitaLocali(y)
  }
}

// ── Scadenze generali ──
// Per un privato, senza partita IVA. Le date fiscali che cadono di sabato, domenica o festa
// slittano al primo giorno lavorativo. Possono cambiare con le proroghe: vanno ricontrollate.

export const SCADENZARIO = 'https://www1.agenziaentrate.gov.it/servizi/scadenzario/main.php'

const ultimaDomenica = (y, m) => {
  const d = new Date(y, m + 1, 0)
  d.setDate(d.getDate() - d.getDay())
  return toIso(d)
}

export const GENERALI = [
  { id: 'isee', md: '01-01', titolo: 'ISEE da rinnovare', nota: "La DSU dell'anno scorso è scaduta il 31 dicembre: rifalla se ti servono bonus o agevolazioni.", acceso: false },
  { id: 'canone-rai', md: '01-31', titolo: 'Canone RAI: esenzione', nota: 'Solo se in casa non hai la TV: dichiarazione sostitutiva entro fine gennaio, altrimenti il canone arriva in bolletta.', slitta: true, acceso: false },
  { id: 'ora-legale', calcola: y => ultimaDomenica(y, 2), titolo: 'Ora legale', nota: "Alle 2 di notte le lancette vanno avanti di un'ora.", acceso: true },
  { id: 'gomme-estive', md: '04-15', titolo: 'Fine obbligo gomme invernali', nota: "C'è un mese di tolleranza, fino al 15 maggio, per montare le estive.", acceso: false },
  { id: '730-precompilato', md: '04-30', titolo: '730 precompilato disponibile', nota: "Si consulta sul sito dell'Agenzia delle Entrate con SPID o CIE; per l'invio di solito si aspetta metà maggio.", acceso: true },
  { id: 'imu-acconto', md: '06-16', titolo: 'IMU: acconto', nota: 'Solo per seconde case, terreni o prima casa di lusso.', slitta: true, acceso: false },
  { id: '730-invio', md: '09-30', titolo: '730: ultimo giorno per inviarlo', nota: 'Da solo, con il CAF o con il commercialista.', slitta: true, acceso: true },
  { id: 'redditi-pf', md: '10-31', titolo: 'Modello Redditi', nota: 'Solo se non hai fatto il 730.', slitta: true, acceso: false },
  { id: 'ora-solare', calcola: y => ultimaDomenica(y, 9), titolo: 'Ora solare', nota: "Alle 3 di notte le lancette tornano indietro di un'ora.", acceso: true },
  { id: 'gomme-invernali', md: '11-15', titolo: 'Gomme invernali o catene', nota: "Obbligo dove c'è il cartello, fino al 15 aprile.", acceso: false },
  { id: 'imu-saldo', md: '12-16', titolo: 'IMU: saldo', nota: 'Solo per seconde case, terreni o prima casa di lusso.', slitta: true, acceso: false }
]

export const generaliAccese = (scelte = {}) => GENERALI.filter(g => (g.id in scelte ? !!scelte[g.id] : g.acceso))

const giornoLavorativo = (iso, festivi) => {
  const d = new Date(`${iso}T00:00:00`)
  while (d.getDay() === 0 || d.getDay() === 6 || festivi.has(toIso(d))) d.setDate(d.getDate() + 1)
  return toIso(d)
}

const dataGenerale = (g, y, festivi) => {
  const iso = g.calcola ? g.calcola(y) : `${y}-${g.md}`
  return g.slitta ? giornoLavorativo(iso, festivi) : iso
}

// Le scadenze generali accese, anno per anno, che cadono tra from e to
export const generaliTra = (scelte, from, to, festivi = new Set()) => {
  const out = []
  const y0 = Number(from.slice(0, 4)), y1 = Number(to.slice(0, 4))
  for (let y = y0; y <= y1; y++) {
    for (const g of generaliAccese(scelte)) {
      const iso = dataGenerale(g, y, festivi)
      if (iso >= from && iso <= to) out.push({ date: iso, generale: g })
    }
  }
  return out
}

// La prossima volta di una generale, accesa o no
export const prossimaGenerale = (g, from, festivi = new Set()) => {
  const y = Number(from.slice(0, 4))
  const iso = dataGenerale(g, y, festivi)
  return iso >= from ? iso : dataGenerale(g, y + 1, festivi)
}

// ── File .ics per il calendario dell'iPhone ──
// Ricorrenza e avviso li gestisce poi il calendario del telefono, anche ad app chiusa.

const icsText = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
const icsDate = (iso) => iso.replace(/-/g, '')
const icsStamp = () => {
  const d = new Date()
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}
const giornoDopo = (iso) => { const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + 1); return toIso(d) }

// L'avviso suona alle 9 del mattino, `giorni` prima della scadenza
const allarme = (giorni) => {
  const ore = giorni * 24 - 9
  return ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Promemoria', ore > 0 ? `TRIGGER:-PT${ore}H` : 'TRIGGER:PT9H', 'END:VALARM']
}

const vevent = ({ uid, date, titolo, nota, repeat, every, remindDays }) => [
  'BEGIN:VEVENT',
  `UID:${uid}`,
  `DTSTAMP:${icsStamp()}`,
  `DTSTART;VALUE=DATE:${icsDate(date)}`,
  `DTEND;VALUE=DATE:${icsDate(giornoDopo(date))}`,
  `SUMMARY:${icsText(titolo)}`,
  ...(nota ? [`DESCRIPTION:${icsText(nota)}`] : []),
  ...(repeat ? [`RRULE:FREQ=${repeat === 'year' ? 'YEARLY' : 'MONTHLY'};INTERVAL=${Number(every) || 1}`] : []),
  ...(remindDays !== null && remindDays !== undefined ? allarme(Number(remindDays)) : []),
  'END:VEVENT'
]

export const icsDaScadenze = (righe) => [
  'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Polpopoly//Gestionale X//IT', 'CALSCALE:GREGORIAN',
  ...righe.flatMap(vevent),
  'END:VCALENDAR'
].join('\r\n') + '\r\n'

export const rigaIcsPersonale = (e) => ({
  uid: `gx-${e.id}@polpopoly.it`, date: e.date, repeat: e.repeat, every: e.every, remindDays: e.remindDays,
  titolo: e.title, nota: [e.amount ? euro(e.amount) : '', e.notes].filter(Boolean).join(' — ')
})

// Le generali non hanno RRULE: gli slittamenti cambiano di anno in anno, quindi un evento per anno
export const righeIcsGenerali = (scelte, from, to, festivi) =>
  generaliTra(scelte, from, to, festivi).map(({ date, generale: g }) => ({
    uid: `gx-gen-${g.id}-${date.slice(0, 4)}@polpopoly.it`, date, titolo: g.titolo, nota: g.nota, remindDays: g.slitta ? 7 : null
  }))
