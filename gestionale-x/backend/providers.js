import Groq from 'groq-sdk'

// Le variabili d'ambiente si leggono a ogni chiamata, non all'import:
// server.js carica dotenv dopo gli import.
const csv = (v, fallback) => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : fallback)

const GROQ_FALLBACK_MODEL = 'llama-3.1-8b-instant'

// Il modello di ripiego non ragiona: con questi parametri risponderebbe 400
// eslint-disable-next-line no-unused-vars
const senzaRagionamento = ({ reasoning_effort, include_reasoning, ...resto }) => resto

const PROVIDERS = {
  groq: {
    name: 'Groq',
    key: () => process.env.GROQ_API_KEY,
    defaultModel: () => process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    models: () => csv(process.env.GROQ_MODELS, [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.1-8b-instant'
    ])
  },
  nvidia: {
    name: 'Nvidia',
    baseURL: () => process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    key: () => process.env.NVIDIA_API_KEY,
    defaultModel: () => process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct',
    models: () => csv(process.env.NVIDIA_MODELS, [
      'meta/llama-3.3-70b-instruct',
      'meta/llama-3.1-8b-instruct',
      'nvidia/llama-3.1-nemotron-70b-instruct'
    ])
  }
}

let groqClient = null
let groqClientKey = null
function getGroq() {
  const key = PROVIDERS.groq.key()
  if (!groqClient || groqClientKey !== key) {
    groqClient = new Groq({ apiKey: key })
    groqClientKey = key
  }
  return groqClient
}

export function listProviders() {
  return Object.entries(PROVIDERS)
    .filter(([, p]) => p.key())
    .map(([id, p]) => {
      const defaultModel = p.defaultModel()
      const models = p.models()
      return { id, name: p.name, defaultModel, models: models.includes(defaultModel) ? models : [defaultModel, ...models] }
    })
}

export function providerName(id) {
  return PROVIDERS[id]?.name || id
}

export function defaultTarget() {
  const first = listProviders()[0]
  if (!first) return null
  return { provider: first.id, model: first.defaultModel }
}

const MODEL_RE = /^[\w./:-]{1,120}$/

// Valida i target scelti dall'utente; ne scarta i non configurati o malformati.
export function normalizeTargets(raw, max = 4) {
  const configured = new Set(listProviders().map(p => p.id))
  const seen = new Set()
  const out = []
  for (const t of Array.isArray(raw) ? raw : []) {
    if (!t || !configured.has(t.provider)) continue
    const model = typeof t.model === 'string' && MODEL_RE.test(t.model) ? t.model : PROVIDERS[t.provider].defaultModel()
    const key = `${t.provider}|${model}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ provider: t.provider, model })
    if (out.length >= max) break
  }
  if (!out.length) {
    const d = defaultTarget()
    if (d) out.push(d)
  }
  return out
}

async function openAiCompatible(p, model, opts) {
  const res = await fetch(`${p.baseURL()}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key()}` },
    body: JSON.stringify({ model, ...opts }),
    signal: AbortSignal.timeout(90000)
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    // Stessa forma degli errori dell'SDK Groq, così il catch di /api/chat li legge uguale.
    const e = data?.error && typeof data.error === 'object' ? data.error : { message: data?.detail || data?.error || res.statusText }
    const err = new Error(e.message || `HTTP ${res.status}`)
    err.status = res.status
    err.code = e.code
    err.error = { error: e }
    throw err
  }
  return data
}

// Stessa chiamata di callProvider, ma a pezzi: restituisce i "delta" (testo e tool call parziali)
// man mano che il modello li scrive. Gli errori di partenza (chiave, modello, tool non supportati)
// arrivano prima del primo pezzo, quindi chi chiama può ancora riprovare in un altro modo.
export async function* streamProvider({ provider, model }, opts) {
  const p = PROVIDERS[provider]
  if (!p || !p.key()) throw Object.assign(new Error(`Provider ${provider} non configurato`), { status: 401 })
  const m = model || p.defaultModel()

  if (provider === 'groq') {
    const groq = getGroq()
    let stream
    try {
      stream = await groq.chat.completions.create({ model: m, ...opts, stream: true })
    } catch (err) {
      const code = err?.error?.error?.code || err?.code
      if (err?.status !== 404 && code !== 'model_not_found') throw err
      console.warn(`Modello ${m} non disponibile su Groq → fallback ${GROQ_FALLBACK_MODEL}`)
      stream = await groq.chat.completions.create({ model: GROQ_FALLBACK_MODEL, ...senzaRagionamento(opts), stream: true })
    }
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta
      if (delta) yield delta
    }
    return
  }

  // Compatibile OpenAI: server-sent events, una riga "data: {…}" per pezzo
  const res = await fetch(`${p.baseURL()}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key()}` },
    body: JSON.stringify({ model: m, ...opts, stream: true }),
    signal: AbortSignal.timeout(120000)
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const e = data?.error && typeof data.error === 'object' ? data.error : { message: data?.detail || data?.error || res.statusText }
    throw Object.assign(new Error(e.message || `HTTP ${res.status}`), { status: res.status, code: e.code, error: { error: e } })
  }
  const decoder = new TextDecoder()
  let resto = ''
  for await (const pezzo of res.body) {
    resto += decoder.decode(pezzo, { stream: true })
    const righe = resto.split('\n')
    resto = righe.pop()
    for (const riga of righe) {
      const dato = riga.replace(/^data:\s*/, '').trim()
      if (!riga.startsWith('data:') || !dato || dato === '[DONE]') continue
      try {
        const delta = JSON.parse(dato).choices?.[0]?.delta
        if (delta) yield delta
      } catch { /* riga incompleta o di servizio */ }
    }
  }
}

export async function callProvider({ provider, model }, opts) {
  const p = PROVIDERS[provider]
  if (!p || !p.key()) throw Object.assign(new Error(`Provider ${provider} non configurato`), { status: 401 })
  const m = model || p.defaultModel()

  if (provider === 'groq') {
    const groq = getGroq()
    try {
      return await groq.chat.completions.create({ model: m, ...opts })
    } catch (err) {
      const code = err?.error?.error?.code || err?.code
      if (err?.status === 404 || code === 'model_not_found') {
        console.warn(`Modello ${m} non disponibile su Groq → fallback ${GROQ_FALLBACK_MODEL}`)
        return await groq.chat.completions.create({ model: GROQ_FALLBACK_MODEL, ...senzaRagionamento(opts) })
      }
      throw err
    }
  }

  return openAiCompatible(p, m, opts)
}
