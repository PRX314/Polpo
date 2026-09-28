// Le azioni che Polpo propone: come si chiamano, cosa mostrano, e come le racconta all'AI.
// Una proposta vive dentro il messaggio che l'ha fatta (msg.actions) e ha uno stato:
// pending → executing → confirmed | error, oppure rejected, oppure superseded
// (sostituita da una proposta più recente).

export const ACTION_LABEL = {
  add_note: 'Nuova nota',
  add_project: 'Nuovo elemento',
  add_todo: 'Nuova cosa da fare',
  complete_todo: 'Completa',
  update_project: 'Aggiorna elemento',
  update_note: 'Aggiorna nota',
  add_link_to_project: 'Nuovo link',
  add_section_to_project: 'Nuova sezione',
  delete_note: 'Elimina nota'
}

// Dettagli leggibili (markdown inline)
export function dettagliAzione({ tool, args = {}, label }) {
  switch (tool) {
    case 'add_note': return [
      args.title && `**${args.title}**`,
      args.type && `Tipo: ${args.type}`,
      args.projectTags?.length && `Collegata a: ${args.projectTags.join(', ')}`,
      args.content
    ].filter(Boolean)
    case 'add_project': return [
      `**${args.name}**`,
      args.type && `Tipo: ${args.type}`,
      args.status && `Stato: ${args.status}`,
      args.tags?.length && `Tag: ${args.tags.join(', ')}`,
      args.sections?.length && `${args.sections.length} sezioni: ${args.sections.map(s => s.title).join(', ')}`,
      args.description
    ].filter(Boolean)
    case 'add_section_to_project': return [
      `**${args.projectName}**`,
      args.sectionTitle,
      args.content?.length > 160 ? `${args.content.slice(0, 160)}…` : args.content
    ].filter(Boolean)
    case 'add_todo': return [`**${args.projectName}**`, args.text]
    case 'complete_todo': return [`**${args.projectName}**`, args.todoText]
    case 'update_project': return [
      `**${args.projectName}**`,
      args.status && `Nuovo stato: ${args.status}`,
      args.description && 'Descrizione aggiornata',
      args.roadmap && 'Roadmap aggiornata',
      args.obiettivi && 'Obiettivi aggiornati'
    ].filter(Boolean)
    case 'update_note': return [`**${args.noteTitle}**`, args.title && `Nuovo titolo: ${args.title}`].filter(Boolean)
    case 'add_link_to_project': return [`**${args.projectName}**`, `${args.linkTitle}: ${args.url}`]
    case 'delete_note': return [`**${args.noteTitle}**`]
    default: return [label]
  }
}

// Dalla risposta del server alle proposte salvate nel messaggio
let seme = 0
export const nuoveAzioni = (proposte = []) => proposte.map(a => ({
  id: `${Date.now().toString(36)}-${(seme++).toString(36)}`,
  tool: a.tool,
  args: a.args || {},
  label: a.label || ACTION_LABEL[a.tool] || 'Azione',
  status: 'pending'
}))

// Quando arrivano proposte nuove, quelle ancora in attesa nei messaggi precedenti sono superate
export const segnaSostituite = (messages) => messages.map(m =>
  m.actions?.some(a => a.status === 'pending')
    ? { ...m, actions: m.actions.map(a => (a.status === 'pending' ? { ...a, status: 'superseded' } : a)) }
    : m)

// Come l'AI legge lo stato di una proposta. Deve capire se esiste già nel gestionale: con un
// semplice "in attesa", per correggerla proponeva di "completare" la vecchia, che non esiste
// (e avrebbe spuntato un'altra cosa con un nome simile).
const STATO_PER_AI = {
  pending: 'IN ATTESA, non eseguita: nel gestionale non esiste',
  executing: 'in esecuzione',
  confirmed: 'FATTA: esiste nel gestionale',
  rejected: 'rifiutata: non esiste',
  superseded: 'sostituita: non esiste',
  error: 'non riuscita: non esiste'
}

// La storia che si manda all'AI: ruolo e testo, più un riassunto delle proposte e del loro stato.
// Senza, l'AI non sapeva cosa aveva proposto e non poteva correggerlo ("cambia il titolo").
export const perStoria = (messages) => messages
  .filter(m => !m.failed && m.content)
  .slice(-24)
  .map(m => {
    if (m.role !== 'assistant' || !m.actions?.length) return { role: m.role, content: m.content }
    const elenco = m.actions.map((a, i) => `${i + 1}) ${a.label} — ${STATO_PER_AI[a.status] || a.status}`).join('; ')
    return { role: 'assistant', content: `${m.content}\n\n[Proposte: ${elenco}]` }
  })

// Indice dell'ultimo messaggio con proposte ancora da decidere (per la conferma a voce)
export const ultimoConInAttesa = (messages) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].actions?.some(a => a.status === 'pending')) return i
  }
  return -1
}
