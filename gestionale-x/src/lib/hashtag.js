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

// Raccolte: i posti fissi per gli appunti che non sono di un progetto (dal 2026-10-28).
// Funzionano come i progetti: #Musica nel testo e l'appunto sta in Musica.
// Gli alias sono gli altri modi di scriverlo (#pensiero = #Pensieri, #social = #IdeeSocial).
export const RACCOLTE = [
  { id: 'musica', nome: 'Musica', alias: [], descrizione: 'Testi, melodie, ascolti, idee per brani.' },
  { id: 'documenti', nome: 'Documenti', alias: ['documento'], descrizione: 'Appunti su carte, pratiche e testi da tenere.' },
  { id: 'idee', nome: 'Idee', alias: ['idea'], descrizione: 'Idee generali, di qualsiasi tipo, anche grezze.' },
  { id: 'ideesocial', nome: 'Idee social', alias: ['ideasocial', 'social'], descrizione: 'Reel, post e storie da fare.' },
  { id: 'monologhi', nome: 'Monologhi', alias: ['monologo'], descrizione: 'Pezzi parlati, stand-up, cose da dire a voce.' },
  { id: 'pensieri', nome: 'Pensieri', alias: ['pensiero'], descrizione: 'Riflessioni, discussioni interne, punti di vista sull\'umano.' }
].map(r => ({ ...r, tag: tagDi({ name: r.nome }), chiavi: [r.id, ...r.alias] }))

export const raccolteCitate = (testo) => {
  const tags = hashtagIn(testo)
  return tags.size ? RACCOLTE.filter(r => r.chiavi.some(k => tags.has(k))) : []
}

export const suggerisciRaccolte = (parziale) => {
  const k = chiave(parziale)
  return RACCOLTE.filter(r => r.chiavi.some(c => c.includes(k)))
}

// Una riga fatta solo di #tag: la prima di un appunto messo in una raccolta o in un progetto
const SOLO_TAG = /^\s*(#[\p{L}\p{N}_-]+\s*)+$/u

// Il selettore "Metti in…" scrive il tag sulla riga dei tag in cima, o ne apre una
export const conTag = (testo, tag) => {
  const [prima, ...resto] = testo.split('\n')
  if (SOLO_TAG.test(prima)) return [`${prima.trimEnd()} ${tag}`, ...resto].join('\n')
  return testo.trim() ? `${tag}\n\n${testo}` : `${tag}\n\n`
}

// Toglie i #tag con queste chiavi ovunque siano; una riga rimasta vuota se ne va
export const senzaTag = (testo, chiavi) => {
  const via = new Set(chiavi)
  return testo.split('\n').flatMap(riga => {
    const nuova = riga.replace(HASHTAG, (tutto, prima, nome) => (via.has(chiave(nome)) ? prima : tutto))
    if (nuova === riga) return [riga]
    const pulita = nuova.trim().replace(/[ \t]{2,}/g, ' ')
    return pulita ? [riga.match(/^[ \t]*/)[0] + pulita] : []
  }).join('\n').replace(/^\n+/, '')
}

// Il testo senza le righe di soli #tag, per titoli ed estratti
export const senzaRigheTag = (testo = '') => testo.split('\n').filter(r => !SOLO_TAG.test(r)).join('\n').trim()
