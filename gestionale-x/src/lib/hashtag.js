// Appunti legati ai progetti con un #hashtag nel titolo o nel testo.
// Il tag è il nome del progetto senza spazi né accenti, maiuscole indifferenti:
// "Gestionale X" → #GestionaleX, #gestionalex e #gestionale-x vanno tutti bene.
// Il collegamento non si salva: si ricava dal testo, così cambiare il testo basta a toglierlo.

export const chiave = (s = '') => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

// Come si scrive il tag di un progetto: le parole attaccate, ognuna con la maiuscola
export const tagDi = (p) => `#${(p.name || '').normalize('NFD').replace(/\p{M}/gu, '')
  .split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('')}`

// Un # a inizio parola: "C#" o un link con "#ancora" non sono hashtag
const HASHTAG = /(^|[^\p{L}\p{N}_&/#])#([\p{L}\p{N}_-]+)/gu

export const hashtagIn = (testo = '') => new Set([...testo.matchAll(HASHTAG)].map(m => chiave(m[2])).filter(Boolean))

export const progettiCitati = (testo, items) => {
  const tags = hashtagIn(testo)
  return tags.size ? items.filter(p => tags.has(chiave(p.name))) : []
}

export const testoAppunto = (a) => `${a.title || ''}\n${a.text || ''}`

// Il #parola che si sta scrivendo proprio prima del cursore, per suggerire i progetti
export const tagInCorso = (testo, cursore) => {
  const m = testo.slice(0, cursore).match(/(^|[^\p{L}\p{N}_&/#])#([\p{L}\p{N}_-]*)$/u)
  return m ? { parziale: m[2], inizio: cursore - m[2].length - 1 } : null
}

export const suggerisci = (parziale, items, quanti = 5) => {
  const k = chiave(parziale)
  return items
    .filter(p => !p.archived && p.name && chiave(p.name).includes(k))
    .sort((a, b) => (chiave(b.name).startsWith(k) - chiave(a.name).startsWith(k)) || (!!b.pinned - !!a.pinned) || a.name.localeCompare(b.name))
    .slice(0, quanti)
}
