// Polpo che ragiona: prima di rispondere può leggere il gestionale e il vault, anche più volte.
//
// Prima l'AI riceveva tutto il gestionale compresso in ~12.000 caratteri: con 80 elementi gli ultimi
// arrivavano col solo nome e non c'era modo di saperne di più. Ora ha strumenti di sola lettura
// (cerca, apri un elemento, leggi una nota del vault, agenda di un periodo) e li usa a giri:
// pensa → legge → pensa → risponde. Le modifiche restano proposte (propose_actions) che Paolo conferma.
//
// Questo modulo non conosce Express né Firebase direttamente: server.js gli passa come leggere i dati.

import { streamProvider, providerName } from './providers.js'

export const STATUS_LABELS = {
  pending: 'Da fare', in_progress: 'In corso', 'in-progress': 'In corso',
  completed: 'Completato', paused: 'In pausa', 'on-hold': 'In pausa'
}

const clip = (v, n) => {
  const s = String(v ?? '').trim()
  return s.length > n ? s.slice(0, n) + '…' : s
}
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()
const dataIt = (ts) => ts?.toDate?.()?.toLocaleDateString('it-IT') || ''
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/

// ============================================================================
// STRUMENTI DI LETTURA (quelli che l'AI può chiamare da sola, senza conferma)
// ============================================================================
export const STRUMENTI_LETTURA = [
  {
    type: 'function',
    function: {
      name: 'cerca_elementi',
      description: 'Cerca negli elementi del gestionale (nome, descrizione, tag, sezioni, cose da fare). Restituisce i più pertinenti con una riga di riassunto. Usalo quando non sai quale elemento c\'entra o per trovare dove si parla di qualcosa.',
      parameters: {
        type: 'object',
        properties: {
          testo: { type: 'string', description: 'Parole da cercare' },
          archiviati: { type: 'boolean', description: 'Includi anche gli elementi archiviati (default no)' }
        },
        required: ['testo']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'apri_elemento',
      description: 'Apre la scheda completa di un elemento: descrizione, obiettivi, roadmap, tutte le sezioni, tutte le cose da fare, link, scadenze, dati dal codice. Usalo prima di rispondere su un elemento di cui hai solo il nome o poche righe.',
      parameters: {
        type: 'object',
        properties: { nome: { type: 'string', description: 'Nome dell\'elemento (anche parziale)' } },
        required: ['nome']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'leggi_nota_vault',
      description: 'Legge una nota del vault Obsidian di Paolo: lì ci sono visione, decisioni recenti, roadmap e storia dei progetti, e le note delle sessioni di lavoro (60-Chats). Le note lunghe arrivano riassunte per sezione: per leggere una sezione intera passa anche "sezione".',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome della nota o dell\'elemento collegato (es. "Gestionale X"), oppure percorso tipo "20-Projects/Ungesto.md"' },
          sezione: { type: 'string', description: 'Facoltativo: titolo della sezione da leggere per intero (es. "Decisioni recenti")' }
        },
        required: ['nome']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'agenda',
      description: 'Scadenze (elementi e cose da fare) e appuntamenti in un periodo, anche oltre i 14 giorni del contesto. Massimo 92 giorni.',
      parameters: {
        type: 'object',
        properties: {
          da: { type: 'string', description: 'Primo giorno, AAAA-MM-GG' },
          a: { type: 'string', description: 'Ultimo giorno, AAAA-MM-GG' }
        },
        required: ['da', 'a']
      }
    }
  }
]
const NOMI_LETTURA = new Set(STRUMENTI_LETTURA.map(t => t.function.name))

// ============================================================================
// LETTORE: i dati di un utente, letti una volta per richiesta
// ============================================================================
// deps: {
//   progetti(userId) → [{ id, ...data }]
//   eventi(userId) → [{ id, ...data }]
//   vault(userId) → null se l'utente non può leggere il vault, altrimenti
//                   { leggi(percorso) → testo | null, elenca(cartella) → [nomeFile] }
// }
export function creaLettore(deps, userId) {
  let progetti = null
  const tutti = async () => (progetti ??= await deps.progetti(userId))

  // Trova un elemento per nome: esatto, poi "comincia con", poi "contiene", poi tutte le parole
  const trova = async (nome) => {
    const q = norm(nome)
    if (!q) return { candidati: [] }
    const lista = (await tutti()).filter(p => typeof p.name === 'string' && p.name)
    const esatto = lista.filter(p => norm(p.name) === q)
    if (esatto.length) return { elemento: esatto.find(p => !p.archived) || esatto[0] }
    const parole = q.split(' ')
    const punteggio = (p) => {
      const n = norm(p.name)
      if (n.startsWith(q)) return 3
      if (n.includes(q)) return 2
      if (q.includes(n) && n.length >= 4) return 2
      if (parole.every(w => n.includes(w))) return 1
      return 0
    }
    const trovati = lista.map(p => ({ p, s: punteggio(p) - (p.archived ? 0.5 : 0) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s)
    if (!trovati.length) return { candidati: [] }
    if (trovati.length === 1 || trovati[0].s > trovati[1].s) return { elemento: trovati[0].p }
    return { candidati: trovati.slice(0, 6).map(x => x.p) }
  }

  return {
    tutti,
    trova,
    async perId(id) {
      return (await tutti()).find(p => p.id === id) || null
    },
    vault: () => deps.vault(userId),
    eventi: () => deps.eventi(userId)
  }
}

// ============================================================================
// SCHEDA COMPLETA DI UN ELEMENTO
// ============================================================================
export function schedaElemento(p) {
  const righe = []
  const stato = STATUS_LABELS[p.status] || p.status || 'Da fare'
  righe.push(`# "${p.name}" [${p.type || 'progetto'}] — ${stato}${p.pinned ? ', fissato' : ''}${p.archived ? ', ARCHIVIATO' : ''}`)
  if (p.deadline) righe.push(`Scadenza: ${p.deadline}${p.deadlineTime ? ` ${p.deadlineTime}` : ''}`)
  if (p.tags?.length) righe.push(`Tag: ${p.tags.join(', ')}`)
  const date = [dataIt(p.createdAt) && `creato il ${dataIt(p.createdAt)}`, dataIt(p.updatedAt) && `aggiornato il ${dataIt(p.updatedAt)}`].filter(Boolean)
  if (date.length) righe.push(date.join(', '))
  if (p.description) righe.push(`\nDescrizione:\n${clip(p.description, 2000)}`)
  if (p.obiettivi) righe.push(`\nObiettivi:\n${clip(p.obiettivi, 1500)}`)
  if (p.roadmap) righe.push(`\nRoadmap:\n${clip(p.roadmap, 2500)}`)

  let spazio = 6000
  for (const s of p.sections || []) {
    if (spazio <= 0) { righe.push('\n(altre sezioni non mostrate)'); break }
    const testo = clip(s.content, Math.min(2000, spazio))
    spazio -= testo.length
    righe.push(`\nSezione ${s.icon || ''} ${s.title || '(senza titolo)'}:\n${testo}`)
  }

  const todos = p.todos || []
  const aperti = todos.filter(t => !t.completed)
  const fatti = todos.filter(t => t.completed)
  if (todos.length) {
    righe.push(`\nCose da fare: ${aperti.length} aperte, ${fatti.length} fatte`)
    for (const t of aperti.slice(0, 40)) {
      righe.push(`- [ ] ${clip(t.text, 200)}${t.deadline ? ` (entro ${t.deadline}${t.time ? ` ${t.time}` : ''})` : ''}`)
    }
    if (aperti.length > 40) righe.push(`  …e altre ${aperti.length - 40} aperte`)
    for (const t of fatti.slice(-5)) righe.push(`- [x] ${clip(t.text, 120)}`)
  }
  if (p.links?.length) righe.push(`\nLink:\n${p.links.slice(0, 15).map(l => `- ${l.title || l.url}: ${l.url}`).join('\n')}`)

  const scan = p.scan
  if (scan && typeof scan === 'object') {
    const pezzi = [
      scan.stack && `stack ${Array.isArray(scan.stack) ? scan.stack.join(', ') : scan.stack}`,
      scan.righe && `${scan.righe} righe`,
      scan.git?.ultimoCommit && `ultimo commit ${scan.git.ultimoCommit}`,
      scan.todo != null && `${scan.todo} TODO nel codice`
    ].filter(Boolean)
    if (pezzi.length) righe.push(`\nDal codice: ${pezzi.join(', ')}`)
  }
  const nota = percorsoVault(p)
  if (nota) righe.push(`\nNota nel vault: ${nota} (leggibile con leggi_nota_vault)`)
  return righe.join('\n')
}

export const percorsoVault = (p) => p?.vaultPath || (p?.vaultNote ? `20-Projects/${p.vaultNote}.md` : '')

// ============================================================================
// NOTE DEL VAULT
// ============================================================================
export const CARTELLE_VAULT = ['20-Projects', '30-Areas', '40-Resources', '60-Chats']

// Note lunghe (Polpopoly Hub supera i 60.000 caratteri): l'inizio di ogni sezione, e l'elenco dei
// titoli, così l'AI sa cosa c'è e può chiedere la sezione intera.
export function riassumiNota(testo, { sezione = '', max = 9000 } = {}) {
  const corpo = String(testo || '')
  const parti = corpo.split(/\n(?=## )/)
  if (sezione) {
    const q = norm(sezione)
    const trovata = parti.find(p => p.startsWith('## ') && norm(p.split('\n')[0].slice(3)).includes(q))
    if (trovata) return clip(trovata, max)
    return `Sezione "${sezione}" non trovata. Sezioni: ${parti.filter(p => p.startsWith('## ')).map(p => p.split('\n')[0].slice(3)).join(' · ')}`
  }
  if (corpo.length <= max) return corpo
  const titoli = parti.filter(p => p.startsWith('## ')).map(p => p.split('\n')[0].slice(3))
  const quota = Math.max(300, Math.floor((max - 400) / parti.length))
  const testa = `(Nota lunga ${corpo.length} caratteri: per ogni sezione solo l'inizio. Sezioni: ${titoli.join(' · ')})\n\n`
  return testa + parti.map(p => clip(p, quota)).join('\n\n')
}

async function trovaNotaVault(vault, nome, lettore) {
  const richiesta = String(nome || '').trim()
  if (!richiesta) return null
  // Percorso esplicito
  if (/\.md$/i.test(richiesta) && richiesta.includes('/')) {
    if (richiesta.includes('..') || !CARTELLE_VAULT.some(c => richiesta.startsWith(c + '/'))) return null
    const testo = await vault.leggi(richiesta)
    return testo != null ? { percorso: richiesta, testo } : null
  }
  // Un elemento del gestionale collegato a una nota
  const { elemento } = await lettore.trova(richiesta)
  const candidati = []
  if (percorsoVault(elemento)) candidati.push(percorsoVault(elemento))
  candidati.push(`20-Projects/${richiesta}.md`)
  for (const percorso of candidati) {
    const testo = await vault.leggi(percorso)
    if (testo != null) return { percorso, testo }
  }
  // Per nome di file, in tutte le cartelle (le chat più recenti prima)
  const q = norm(richiesta.replace(/\.md$/i, ''))
  for (const cartella of CARTELLE_VAULT) {
    const nomi = (await vault.elenca(cartella)).filter(n => n.endsWith('.md'))
    if (cartella === '60-Chats') nomi.sort().reverse()
    const trovato = nomi.find(n => norm(n.slice(0, -3)) === q) || nomi.find(n => norm(n).includes(q))
    if (trovato) {
      const percorso = `${cartella}/${trovato}`
      const testo = await vault.leggi(percorso)
      if (testo != null) return { percorso, testo }
    }
  }
  return null
}

// ============================================================================
// ESECUZIONE DEGLI STRUMENTI DI LETTURA
// ============================================================================
const giornoBreve = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// Restituisce { testo (per l'AI), passo: { tipo, testo, id? } (per lo schermo) }
export async function eseguiLettura(nome, args, lettore) {
  switch (nome) {
    case 'cerca_elementi': {
      const q = norm(args.testo)
      if (!q) return { testo: 'Ricerca vuota.', passo: { tipo: 'cerca', testo: 'ricerca vuota' } }
      const parole = q.split(' ').filter(w => w.length > 1)
      const lista = (await lettore.tutti()).filter(p => p.name && (args.archiviati || !p.archived))
      const risultati = lista.map(p => {
        const campi = {
          nome: norm(p.name),
          tag: norm((p.tags || []).join(' ')),
          descrizione: norm(`${p.description || ''} ${p.obiettivi || ''} ${p.roadmap || ''}`),
          sezioni: norm((p.sections || []).map(s => `${s.title} ${s.content}`).join(' ')),
          todo: norm((p.todos || []).map(t => t.text).join(' '))
        }
        let s = 0
        const dove = new Set()
        for (const w of parole) {
          if (campi.nome.includes(w)) { s += 5; dove.add('nome') }
          if (campi.tag.includes(w)) { s += 3; dove.add('tag') }
          if (campi.descrizione.includes(w)) { s += 2; dove.add('descrizione') }
          if (campi.sezioni.includes(w)) { s += 1; dove.add('sezioni') }
          if (campi.todo.includes(w)) { s += 1; dove.add('cose da fare') }
        }
        if (campi.nome.includes(q)) s += 10
        return { p, s, dove }
      }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 8)

      const passo = { tipo: 'cerca', testo: `“${clip(args.testo, 40)}” · ${risultati.length} ${risultati.length === 1 ? 'risultato' : 'risultati'}` }
      if (!risultati.length) return { testo: `Nessun elemento corrisponde a "${args.testo}".`, passo }
      return {
        testo: risultati.map(({ p, dove }) => {
          const aperti = (p.todos || []).filter(t => !t.completed).length
          return `- "${p.name}" [${p.type || 'progetto'}, ${STATUS_LABELS[p.status] || p.status || 'Da fare'}${p.archived ? ', archiviato' : ''}]` +
            `${p.description ? `: ${clip(p.description.replace(/\s+/g, ' '), 140)}` : ''}` +
            `${aperti ? ` · ${aperti} cose da fare aperte` : ''} (trovato in: ${[...dove].join(', ')})`
        }).join('\n'),
        passo
      }
    }

    case 'apri_elemento': {
      const { elemento, candidati } = await lettore.trova(args.nome)
      if (elemento) return { testo: schedaElemento(elemento), passo: { tipo: 'apri', testo: elemento.name, id: elemento.id } }
      if (candidati?.length) {
        return {
          testo: `Più elementi corrispondono a "${args.nome}": ${candidati.map(p => `"${p.name}"`).join(', ')}. Apri quello giusto col nome esatto.`,
          passo: { tipo: 'cerca', testo: `“${clip(args.nome, 40)}” · ${candidati.length} possibili` }
        }
      }
      return { testo: `Nessun elemento si chiama "${args.nome}". Prova cerca_elementi.`, passo: { tipo: 'apri', testo: `${clip(args.nome, 40)} (non trovato)` } }
    }

    case 'leggi_nota_vault': {
      const vault = await lettore.vault()
      if (!vault) return { testo: 'Il vault non è disponibile da qui.', passo: { tipo: 'vault', testo: 'vault non disponibile' } }
      const nota = await trovaNotaVault(vault, args.nome, lettore)
      if (!nota) return { testo: `Nessuna nota del vault trovata per "${args.nome}".`, passo: { tipo: 'vault', testo: `${clip(args.nome, 40)} (non trovata)` } }
      const nomeNota = nota.percorso.split('/').pop().replace(/\.md$/, '')
      return {
        testo: `Nota ${nota.percorso}:\n\n${riassumiNota(nota.testo, { sezione: args.sezione })}`,
        passo: { tipo: 'vault', testo: args.sezione ? `${nomeNota} › ${clip(args.sezione, 30)}` : nomeNota, percorso: nota.percorso }
      }
    }

    case 'agenda': {
      if (!DATA_RE.test(args.da || '') || !DATA_RE.test(args.a || '')) return { testo: 'Date non valide: usa AAAA-MM-GG.', passo: { tipo: 'agenda', testo: 'date non valide' } }
      let { da, a } = args
      if (a < da) [da, a] = [a, da]
      const giorni = (new Date(`${a}T12:00:00Z`) - new Date(`${da}T12:00:00Z`)) / 86400000
      if (giorni > 92) a = new Date(new Date(`${da}T12:00:00Z`).getTime() + 92 * 86400000).toISOString().slice(0, 10)
      const voci = []
      const dentro = (g) => g && g >= da && g <= a
      for (const p of await lettore.tutti()) {
        if (p.archived) continue
        if (dentro(p.deadline) && p.status !== 'completed') voci.push({ g: p.deadline, o: p.deadlineTime || '', t: `Scadenza di "${p.name}"` })
        for (const t of p.todos || []) {
          if (!t.completed && dentro(t.deadline)) voci.push({ g: t.deadline, o: t.time || '', t: `"${clip(t.text, 120)}" (${p.name})` })
        }
      }
      for (const e of await lettore.eventi()) {
        if (dentro(e.date)) voci.push({ g: e.date, o: e.time || '', t: `Appuntamento: ${e.title || 'senza titolo'}` })
      }
      voci.sort((x, y) => `${x.g} ${x.o}`.localeCompare(`${y.g} ${y.o}`))
      const passo = { tipo: 'agenda', testo: `${giornoBreve(da)} – ${giornoBreve(a)} · ${voci.length} voci` }
      if (!voci.length) return { testo: `Niente in agenda dal ${da} al ${a}.`, passo }
      return { testo: voci.slice(0, 80).map(v => `- ${v.g}${v.o ? ` ${v.o}` : ''}: ${v.t}`).join('\n'), passo }
    }

    default:
      return { testo: `Strumento ${nome} sconosciuto.`, passo: null }
  }
}

// ============================================================================
// IL GIRO: pensa → legge → pensa → risponde
// ============================================================================
// Solo i modelli che ragionano accettano reasoning_effort (gli altri rispondono 400)
export const ragiona = (target) => target.provider === 'groq' && /gpt-oss/i.test(target.model || '')

const MAX_RAGIONAMENTO = 6000

// Legge uno stream: testo, ragionamento e tool call (queste arrivano a pezzi e si ricompongono)
async function consuma(target, opts, { onTesto, onPensiero }) {
  let content = ''
  let reasoning = ''
  const calls = []
  for await (const delta of streamProvider(target, opts)) {
    if (delta.reasoning) {
      reasoning += delta.reasoning
      onPensiero(delta.reasoning)
    }
    if (delta.content) {
      content += delta.content
      onTesto(delta.content)
    }
    for (const tc of delta.tool_calls || []) {
      const c = (calls[tc.index ?? 0] ??= { id: '', type: 'function', function: { name: '', arguments: '' } })
      if (tc.id) c.id = tc.id
      if (tc.function?.name) c.function.name += tc.function.name
      if (tc.function?.arguments) c.function.arguments += tc.function.arguments
    }
  }
  return { content, reasoning, toolCalls: calls.filter(Boolean) }
}

// opzioni: { tools, maxTokens, effort, lettore, maxGiri }
// eventi: { onTesto(pezzo), onPensiero(pezzo), onPasso(passo) }
// Restituisce { reply, proposedActions, passi, ragionamento, label, ms, provider, model }
export async function agente(target, baseMessages, opzioni, eventi = {}) {
  const { tools = [], maxTokens = 2048, effort = 'medium', lettore, maxGiri = 6 } = opzioni
  const onTesto = eventi.onTesto || (() => {})
  const onPensiero = eventi.onPensiero || (() => {})
  const onPasso = eventi.onPasso || (() => {})
  const started = Date.now()
  const label = `${providerName(target.provider)} · ${target.model}`
  const messages = [...baseMessages]
  const passi = []
  const parti = []
  let ragionamento = ''
  let proposedActions = []
  let scritto = false
  let aCapo = false
  let conStrumenti = tools.length > 0
  const giaLetti = new Map() // stessa lettura due volte: stessa risposta, senza rileggere

  const scrivi = (t) => {
    if (aCapo) { aCapo = false; onTesto('\n\n') }
    scritto = true
    onTesto(t)
  }
  let nuovoPensiero = false // il ragionamento di un giro nuovo va a capo
  const pensa = (t) => {
    if (nuovoPensiero) { nuovoPensiero = false; t = `\n\n${t}` }
    if (ragionamento.length < MAX_RAGIONAMENTO) ragionamento += t
    onPensiero(t)
  }

  let riprovato = false
  let chiuso = false
  for (let giro = 0; giro < maxGiri; giro++) {
    // All'ultimo giro (o dopo aver proposto azioni) niente strumenti: deve rispondere.
    // Va detto: dopo qualche lettura il modello prova a leggere ancora, e Groq rifiuta la risposta.
    const strumentiQui = conStrumenti && giro < maxGiri - 1
    if (!strumentiQui && !chiuso && messages.some(m => m.role === 'tool')) {
      messages.push({ role: 'system', content: 'Non chiamare altri strumenti: rispondi ora a Paolo, a parole, con quello che sai. Se manca qualcosa, dillo.' })
      chiuso = true
    }
    const opts = {
      messages, temperature: 0.7, max_tokens: maxTokens,
      ...(strumentiQui ? { tools, tool_choice: 'auto' } : {}),
      ...(ragiona(target) ? { reasoning_effort: effort, include_reasoning: true } : {})
    }
    nuovoPensiero = ragionamento.length > 0
    let r
    try {
      r = await consuma(target, opts, { onTesto: scrivi, onPensiero: pensa })
    } catch (err) {
      // Chiamata a uno strumento malformata o non permessa: si riprova una volta
      const codice = (err?.error?.error || err?.error || {}).code || err?.code
      if (codice === 'tool_use_failed' && !riprovato) {
        riprovato = true
        console.warn(`${label}: chiamata a uno strumento non valida, riprovo`)
        giro--
        continue
      }
      // Modello senza tool: si riprova senza, ma solo se non è ancora uscito niente
      if (scritto || !strumentiQui || err?.status !== 400 || !/tool|function/i.test(err?.message || '')) throw err
      console.warn(`${label}: tool non supportati, riprovo senza`)
      conStrumenti = false
      giro--
      continue
    }
    if (r.content) parti.push(r.content)
    if (!r.toolCalls.length) break

    messages.push({ role: 'assistant', content: r.content || null, tool_calls: r.toolCalls })
    if (r.content) aCapo = true
    for (const call of r.toolCalls) {
      let args
      try { args = JSON.parse(call.function.arguments || '{}') } catch { args = null }
      let contenuto
      if (call.function.name === 'propose_actions') {
        const nuove = Array.isArray(args?.actions) ? args.actions : []
        proposedActions = [...proposedActions, ...nuove].slice(0, 8)
        console.log(`📋 ${label}: proposte ${nuove.length} azioni:`, nuove.map(a => a.label))
        contenuto = { status: 'proposed', message: 'Azioni mostrate all\'utente sotto la tua risposta, in attesa di conferma. Ora rispondi a parole.' }
        conStrumenti = false
      } else if (NOMI_LETTURA.has(call.function.name) && lettore) {
        const chiave = `${call.function.name}|${call.function.arguments}`
        let esito = giaLetti.get(chiave)
        if (!esito) {
          try {
            esito = args ? await eseguiLettura(call.function.name, args, lettore) : { testo: 'Argomenti non validi (JSON rotto).', passo: null }
          } catch (err) {
            console.error(`Lettura ${call.function.name} fallita:`, err.message)
            esito = { testo: `Lettura non riuscita: ${err.message}`, passo: null }
          }
          giaLetti.set(chiave, esito)
          if (esito.passo) { passi.push(esito.passo); onPasso(esito.passo) }
        }
        contenuto = esito.testo
      } else {
        contenuto = `Lo strumento ${call.function.name} non esiste.`
      }
      messages.push({ role: 'tool', tool_call_id: call.id, content: typeof contenuto === 'string' ? contenuto : JSON.stringify(contenuto) })
    }
  }

  const reply = parti.join('\n\n').trim() || (proposedActions.length ? 'Ecco cosa ti propongo.' : 'Non sono riuscito a elaborare una risposta.')
  return {
    provider: target.provider, model: target.model, label,
    reply, proposedActions, passi, ragionamento: ragionamento.trim(), ms: Date.now() - started
  }
}
