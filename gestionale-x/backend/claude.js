// Claude come testa di Peppino, accanto a Groq. Il resto del backend parla nel formato di OpenAI
// (messaggi, tool_calls, delta): qui si traduce verso l'API Messages di Anthropic e ritorno, così
// agente.js non cambia. Serve ANTHROPIC_API_KEY (su Render la mette Paolo).
import Anthropic from '@anthropic-ai/sdk'

let client = null
let clientKey = null
function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!client || clientKey !== key) {
    client = new Anthropic({ apiKey: key })
    clientKey = key
  }
  return client
}

// Opus e Sonnet 5.5 hanno filtri di sicurezza che possono rifiutare una richiesta: con il ripiego
// lato server la stessa richiesta riparte da sola su un altro modello. Haiku non ce l'ha.
const conRipiego = (model) => /^claude-(opus|sonnet)-5-5/.test(model)
const BETA_RIPIEGO = 'server-side-fallback-2026-07-01'

const testo = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map(p => p?.text || '').join('') : '')

// Messaggi OpenAI → { system, messages } di Anthropic.
// - il primo messaggio di sistema diventa `system`; quelli a metà conversazione (agente.js ne manda
//   uno per dire «ora rispondi») si accodano come testo all'ultimo messaggio dell'utente
// - le risposte degli strumenti (role: tool) diventano tool_result, tutte nello stesso messaggio
// - un messaggio dell'assistente che porta `_anthropic` (i blocchi originali, col ragionamento)
//   torna indietro così com'è: Claude vuole rileggere i suoi blocchi senza modifiche
function traduciMessaggi(messaggi) {
  let system = ''
  const out = []
  const ultimoUtente = () => {
    let u = out[out.length - 1]
    if (u?.role !== 'user') { u = { role: 'user', content: [] }; out.push(u) }
    return u
  }
  messaggi.forEach((m, i) => {
    if (m.role === 'system') {
      if (i === 0) system = testo(m.content)
      else ultimoUtente().content.push({ type: 'text', text: `[Istruzione di sistema] ${testo(m.content)}` })
    } else if (m.role === 'tool') {
      ultimoUtente().content.push({ type: 'tool_result', tool_use_id: m.tool_call_id, content: testo(m.content) || '(vuoto)' })
    } else if (m.role === 'user') {
      ultimoUtente().content.push({ type: 'text', text: testo(m.content) || '(vuoto)' })
    } else if (m.role === 'assistant') {
      if (m._anthropic) return out.push({ role: 'assistant', content: m._anthropic })
      const blocchi = []
      if (testo(m.content)) blocchi.push({ type: 'text', text: testo(m.content) })
      for (const c of m.tool_calls || []) {
        let input = {}
        try { input = JSON.parse(c.function?.arguments || '{}') } catch { /* argomenti rotti: vuoti */ }
        blocchi.push({ type: 'tool_use', id: c.id, name: c.function?.name, input })
      }
      if (blocchi.length) out.push({ role: 'assistant', content: blocchi })
    }
  })
  return { system, messages: out }
}

// Le opzioni di una chiamata in stile OpenAI → parametri di messages.create / messages.stream.
// La temperatura non si manda: i modelli di oggi la rifiutano.
function parametri(model, opts) {
  const { system, messages } = traduciMessaggi(opts.messages || [])
  const p = {
    model,
    // max_tokens comprende il ragionamento: sotto 16000 una risposta lunga resterebbe a metà
    max_tokens: Math.max(opts.max_tokens || 0, 16000),
    messages,
    cache_control: { type: 'ephemeral' }, // istruzioni e contesto si ripetono a ogni giro: costano un decimo
    thinking: { type: 'adaptive', display: 'summarized' },
    output_config: { effort: opts.reasoning_effort || 'low' }
  }
  if (system) p.system = system
  if (opts.tools?.length) {
    p.tools = opts.tools.map(t => ({ name: t.function.name, description: t.function.description || '', input_schema: t.function.parameters || { type: 'object', properties: {} } }))
  }
  if (conRipiego(model)) { p.betas = [BETA_RIPIEGO]; p.fallbacks = 'default' }
  return p
}

const api = (model) => (conRipiego(model) ? getClient().beta.messages : getClient().messages)

// Dopo un ripiego a metà risposta, i blocchi di ragionamento e le chiamate a strumenti scritti
// prima del passaggio non vanno rimandati: restano il testo e tutto ciò che viene dopo.
function daRimandare(content) {
  const taglio = content.map(b => b.type).lastIndexOf('fallback')
  if (taglio < 0) return content
  return content.filter((b, i) => b.type !== 'fallback' && (i > taglio || !['thinking', 'redacted_thinking', 'tool_use'].includes(b.type)))
}

function rifiuto(messaggio) {
  if (messaggio.stop_reason !== 'refusal') return
  const perche = messaggio.stop_details?.explanation || messaggio.stop_details?.category || ''
  throw Object.assign(new Error(`Claude non ha voluto rispondere a questa richiesta${perche ? ` (${perche})` : ''}.`), { status: 422, code: 'refusal' })
}

// A pezzi, negli stessi "delta" di OpenAI che agente.js sa leggere: { content }, { reasoning },
// { tool_calls: [{ index, id, function: { name, arguments } }] }. In coda un delta { _anthropic }
// con i blocchi originali, da rimandare al giro dopo.
export async function* streamClaude(model, opts) {
  const stream = api(model).stream(parametri(model, opts))
  const indici = new Map() // indice del blocco → posizione tra le chiamate agli strumenti
  for await (const ev of stream) {
    if (ev.type === 'content_block_start' && ev.content_block.type === 'tool_use') {
      const index = indici.size
      indici.set(ev.index, index)
      yield { tool_calls: [{ index, id: ev.content_block.id, function: { name: ev.content_block.name, arguments: '' } }] }
    } else if (ev.type === 'content_block_delta') {
      if (ev.delta.type === 'text_delta') yield { content: ev.delta.text }
      else if (ev.delta.type === 'thinking_delta') yield { reasoning: ev.delta.thinking }
      else if (ev.delta.type === 'input_json_delta' && indici.has(ev.index)) {
        yield { tool_calls: [{ index: indici.get(ev.index), function: { arguments: ev.delta.partial_json } }] }
      }
    }
  }
  const finale = await stream.finalMessage()
  rifiuto(finale)
  yield { _anthropic: daRimandare(finale.content) }
}

// Tutta insieme, nella forma di una risposta OpenAI (per i titoli e le chiamate di servizio)
export async function callClaude(model, opts) {
  const finale = await api(model).stream(parametri(model, opts)).finalMessage()
  rifiuto(finale)
  const tool_calls = finale.content.filter(b => b.type === 'tool_use')
    .map(b => ({ id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input || {}) } }))
  return {
    model: finale.model,
    choices: [{ message: {
      role: 'assistant',
      content: finale.content.filter(b => b.type === 'text').map(b => b.text).join(''),
      ...(tool_calls.length ? { tool_calls } : {}),
      _anthropic: daRimandare(finale.content)
    } }]
  }
}
