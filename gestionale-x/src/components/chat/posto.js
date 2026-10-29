// Dove avevi lasciato la chat, su questo dispositivo: cosa era aperto (la home, una conversazione
// nuova o una salvata), fin dove avevi letto ogni conversazione e cosa stavi scrivendo.
// Sta nel browser e non in Firestore: il telefono e il computer ricordano ciascuno il suo.

const POSTO = 'polpo.chat.posto'   // 'home' | 'nuova' | id della conversazione
const LETTURA = 'polpo.chat.lettura' // { [id]: { i, off, fondo, t } }
const BOZZE = 'polpo.chat.bozze'   // { [id | 'nuova']: { testo, citati, t } }
const MAX_LETTURE = 60
const MAX_BOZZE = 30

const leggi = (chiave, vuoto) => {
  try { return JSON.parse(localStorage.getItem(chiave)) ?? vuoto } catch { return vuoto }
}
const scrivi = (chiave, valore) => {
  try { localStorage.setItem(chiave, JSON.stringify(valore)) } catch { /* storage pieno o non disponibile */ }
}
// Tiene solo le voci più recenti
const ultime = (mappa, quante) => Object.fromEntries(
  Object.entries(mappa).sort((a, b) => (b[1].t || 0) - (a[1].t || 0)).slice(0, quante)
)

export const leggiPosto = () => {
  const p = leggi(POSTO, null)
  return typeof p === 'string' && p ? p : null
}
export const salvaPosto = (posto) => scrivi(POSTO, posto)

// Il punto di lettura: il primo messaggio in vista (i) e di quanto sporge sopra (off), oppure
// "in fondo", per ritrovarsi lì anche se nel frattempo sono arrivati messaggi nuovi
export const leggiLettura = (id) => leggi(LETTURA, {})[id] || null
export const salvaLettura = (id, punto) => {
  scrivi(LETTURA, ultime({ ...leggi(LETTURA, {}), [id]: { ...punto, t: Date.now() } }, MAX_LETTURE))
}

export const leggiBozza = (chiave) => {
  const b = leggi(BOZZE, {})[chiave]
  return { testo: b?.testo || '', citati: Array.isArray(b?.citati) ? b.citati : [] }
}
export const salvaBozza = (chiave, testo, citati = []) => {
  const bozze = leggi(BOZZE, {})
  if (testo.trim()) bozze[chiave] = { testo, citati, t: Date.now() }
  else delete bozze[chiave]
  scrivi(BOZZE, ultime(bozze, MAX_BOZZE))
}
// La conversazione nuova, appena salvata, prende un id: la bozza la segue
export const spostaBozza = (da, a) => {
  const bozze = leggi(BOZZE, {})
  if (!bozze[da]) return
  bozze[a] = bozze[da]
  delete bozze[da]
  scrivi(BOZZE, bozze)
}
