import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { listProviders, providerName, normalizeTargets, callProvider, defaultTarget } from './providers.js'
import { agente, creaLettore, schedaElemento, percorsoVault, riassumiNota, STRUMENTI_LETTURA, CARTELLE_VAULT, STATUS_LABELS } from './agente.js'
import admin from 'firebase-admin'
import webpush from 'web-push'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

dotenv.config()

// Firebase Admin init
import { readFileSync, existsSync } from 'fs'
import { readFile, readdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
const execAsync = promisify(exec)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Collaudo (tester/collauda.cjs): solo emulatori locali e progetto finto "demo-", senza credenziali.
// Con queste variabili firebase-admin parla soltanto con gli emulatori.
const EMULATORI = Boolean(process.env.FIRESTORE_EMULATOR_HOST && process.env.FIREBASE_AUTH_EMULATOR_HOST)
if (EMULATORI && !admin.apps.length) {
  if (!/^demo-/.test(process.env.GCLOUD_PROJECT || '')) {
    console.error('Emulatori: serve GCLOUD_PROJECT che inizi con "demo-".')
    process.exit(1)
  }
  admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT })
  console.log(`🧪 Emulatori Firebase, progetto ${process.env.GCLOUD_PROJECT}`)
}

if (!admin.apps.length) {
  let credential
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Render / produzione: credenziali da variabile d'ambiente
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    credential = admin.credential.cert(serviceAccount)
  } else if (existsSync(join(__dirname, 'serviceAccount.json'))) {
    // Sviluppo locale: credenziali da file
    const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccount.json'), 'utf8'))
    credential = admin.credential.cert(serviceAccount)
  } else {
    console.error('⚠️ Nessuna credenziale Firebase trovata! Imposta FIREBASE_SERVICE_ACCOUNT o aggiungi serviceAccount.json')
    process.exit(1)
  }
  admin.initializeApp({ credential, projectId: 'gestionale-polpo' })
}
const adminDb = admin.firestore()

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4321', 'https://gestionalepolpo.netlify.app', 'https://polpo-c9un.onrender.com', 'https://polpopoly.it', 'https://www.polpopoly.it'] }))
app.use(express.json({ limit: '1mb' }))

// I provider AI (Groq, Nvidia, ...) vivono in providers.js; le key stanno nelle env.
// Per titoli e altre chiamate di servizio si usa il primo provider configurato.
async function utilityChat(opts) {
  const target = defaultTarget()
  if (!target) throw Object.assign(new Error('Nessun provider AI configurato'), { status: 401 })
  return callProvider(target, opts)
}

// ============================================================================
// RATE LIMITING
// ============================================================================
const rateLimits = new Map()
const RATE_LIMIT = { maxRequests: 30, windowMs: 60000 }

function checkRateLimit(userId) {
  const now = Date.now()
  const userLimit = rateLimits.get(userId)
  if (!userLimit || now - userLimit.windowStart > RATE_LIMIT.windowMs) {
    rateLimits.set(userId, { windowStart: now, count: 1 })
    return true
  }
  if (userLimit.count >= RATE_LIMIT.maxRequests) return false
  userLimit.count++
  return true
}

setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimits) {
    if (now - val.windowStart > RATE_LIMIT.windowMs) rateLimits.delete(key)
  }
}, 120000)

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================
async function verifyUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Token mancante' })

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.userId = decoded.uid
    req.userEmail = decoded.email
    req.userName = decoded.name || decoded.email?.split('@')[0] || 'Utente'
    if (!checkRateLimit(req.userId)) {
      return res.status(429).json({ error: 'Troppe richieste. Riprova tra un minuto.' })
    }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token non valido' })
  }
}

// ============================================================================
// TOOLS - L'AI propone azioni, l'utente conferma dal frontend
// ============================================================================
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'propose_actions',
      description: 'Propone una o più azioni da eseguire nel gestionale. L\'utente vedrà un\'anteprima e potrà confermare, modificare o rifiutare ogni azione. Usa SEMPRE questo tool quando vuoi creare/modificare/eliminare dati.',
      parameters: {
        type: 'object',
        properties: {
          actions: {
            type: 'array',
            description: 'Lista di azioni proposte',
            items: {
              type: 'object',
              properties: {
                tool: {
                  type: 'string',
                  enum: ['add_note', 'add_project', 'add_todo', 'complete_todo', 'update_project', 'update_note', 'add_link_to_project', 'delete_note', 'add_section_to_project'],
                  description: 'Tipo di azione'
                },
                args: {
                  type: 'object',
                  description: 'Parametri dell\'azione. Per add_project: {type (progetto/idea/monologo/musica/video/evento/nota), name, description, status, tags[], roadmap, obiettivi, deadline?, sections[{icon, title, content}]}. Per add_section_to_project: {projectName, icon, sectionTitle, content}. Per add_todo: {projectName, text, deadline? (AAAA-MM-GG), time? (HH:MM, solo con deadline)}. Per complete_todo: {projectName, todoText}. Per update_project: {projectName, status, description, roadmap, obiettivi, deadline? (AAAA-MM-GG)}. Le date si calcolano dalla data di oggi indicata nel contesto. Per add_link_to_project: {projectName, linkTitle, url}. Per add_note: {title, content, type, category, priority, projectTags[]} (LEGACY). Per update_note: {noteTitle, title, content, priority}. Per delete_note: {noteTitle}.'
                },
                label: {
                  type: 'string',
                  description: 'Descrizione breve dell\'azione in italiano per l\'utente (es: "Salva info prezzi Printful nel progetto Magliette")'
                }
              },
              required: ['tool', 'args', 'label']
            }
          }
        },
        required: ['actions']
      }
    }
  },
  // Mantengo i singoli tools per l'esecuzione diretta dopo conferma (usati dall'endpoint /api/chat/execute)
  {
    type: 'function',
    function: {
      name: 'add_note',
      description: 'NON usare direttamente. Usa propose_actions per proporre questa azione.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Titolo chiaro e descrittivo della nota' },
          content: { type: 'string', description: 'Contenuto dettagliato della nota con tutte le info utili' },
          type: { type: 'string', enum: ['note', 'idea', 'info', 'monologo', 'musica'], description: 'Tipo' },
          category: { type: 'string', description: 'Categoria: business, tecnico, creativo, contatti, risorse, prezzi, legale, marketing, scadenze, decisioni, altro' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Priorità' },
          projectTags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tag per collegare ai progetti. Collega SEMPRE ai progetti pertinenti'
          }
        },
        required: ['title', 'content', 'type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_project',
      description: 'NON usare direttamente. Usa propose_actions. Crea un elemento di qualsiasi tipo.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['progetto', 'idea', 'monologo', 'musica', 'video', 'evento', 'nota'], description: 'Tipo di elemento' },
          name: { type: 'string', description: 'Nome dell\'elemento' },
          description: { type: 'string', description: 'Descrizione' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'paused'], description: 'Stato iniziale' },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tag del progetto'
          },
          roadmap: { type: 'string', description: 'Roadmap (opzionale)' },
          obiettivi: { type: 'string', description: 'Obiettivi (opzionale)' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                icon: { type: 'string', description: 'Emoji icona della sezione' },
                title: { type: 'string', description: 'Titolo della sezione' },
                content: { type: 'string', description: 'Contenuto della sezione' }
              },
              required: ['title', 'content']
            },
            description: 'Sezioni personalizzate del progetto (es: Materiali, Design, Costi). Usa sezioni per organizzare informazioni dettagliate.'
          }
        },
        required: ['name', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_todo',
      description: 'NON usare direttamente. Usa propose_actions.',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string', description: 'Nome del progetto' },
          text: { type: 'string', description: 'Testo del task' }
        },
        required: ['projectName', 'text']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'complete_todo',
      description: 'NON usare direttamente. Usa propose_actions.',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string', description: 'Nome del progetto' },
          todoText: { type: 'string', description: 'Testo del todo da completare' }
        },
        required: ['projectName', 'todoText']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_project',
      description: 'NON usare direttamente. Usa propose_actions.',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string', description: 'Nome del progetto da aggiornare' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'paused'], description: 'Nuovo stato' },
          description: { type: 'string', description: 'Nuova descrizione' },
          roadmap: { type: 'string', description: 'Nuova roadmap' },
          obiettivi: { type: 'string', description: 'Nuovi obiettivi' }
        },
        required: ['projectName']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_note',
      description: 'NON usare direttamente. Usa propose_actions.',
      parameters: {
        type: 'object',
        properties: {
          noteTitle: { type: 'string', description: 'Titolo della nota da aggiornare' },
          title: { type: 'string', description: 'Nuovo titolo (opzionale)' },
          content: { type: 'string', description: 'Nuovo contenuto (opzionale)' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Nuova priorità (opzionale)' }
        },
        required: ['noteTitle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_link_to_project',
      description: 'Aggiunge un link/URL a un progetto esistente',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string', description: 'Nome del progetto' },
          linkTitle: { type: 'string', description: 'Titolo/etichetta del link' },
          url: { type: 'string', description: 'URL del link' }
        },
        required: ['projectName', 'linkTitle', 'url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_note',
      description: 'Elimina una nota dal gestionale. Chiedi SEMPRE conferma prima di eliminare.',
      parameters: {
        type: 'object',
        properties: {
          noteTitle: { type: 'string', description: 'Titolo esatto della nota da eliminare' }
        },
        required: ['noteTitle']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_section_to_project',
      description: 'Aggiunge una sezione personalizzata a un progetto esistente. Le sezioni servono per organizzare informazioni dettagliate (materiali, design, costi, ecc.).',
      parameters: {
        type: 'object',
        properties: {
          projectName: { type: 'string', description: 'Nome del progetto' },
          icon: { type: 'string', description: 'Emoji icona (es: 🎨, 🧵, 💰, 📦)' },
          sectionTitle: { type: 'string', description: 'Titolo della sezione' },
          content: { type: 'string', description: 'Contenuto della sezione' }
        },
        required: ['projectName', 'sectionTitle', 'content']
      }
    }
  }
]

// ============================================================================
// TOOL EXECUTION - Esegue le azioni su Firebase
// ============================================================================
// Scadenze proposte dall'AI: si salvano solo se il formato è quello che usa l'app
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/
const ORA_RE = /^\d{2}:\d{2}$/
const dataValida = (d) => typeof d === 'string' && DATA_RE.test(d) && !Number.isNaN(Date.parse(`${d}T12:00:00Z`))
const oraValida = (o) => typeof o === 'string' && ORA_RE.test(o)
const dicituraScadenza = (d, o) => (dataValida(d) ? ` entro ${d}${oraValida(o) ? ` alle ${o}` : ''}` : '')

async function executeTool(toolName, args, userId) {
  const timestamp = admin.firestore.Timestamp.fromDate(new Date())

  switch (toolName) {
    case 'add_note': {
      // Mappa i vecchi tipi nota ai nuovi tipi unificati
      const noteTypeMap = { note: 'nota', idea: 'idea', info: 'nota', monologo: 'monologo', musica: 'musica' }
      const unifiedType = noteTypeMap[args.type] || 'nota'
      const projectData = {
        type: unifiedType,
        name: args.title,
        description: args.content,
        status: 'pending',
        tags: args.projectTags || [],
        sections: [],
        todos: [],
        links: [],
        roadmap: '',
        obiettivi: '',
        userId,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const ref = await adminDb.collection('projects').add(projectData)
      const typeLabel = { nota: 'Nota', idea: 'Idea', monologo: 'Monologo', musica: 'Musica' }
      const linkedTo = args.projectTags?.length ? ` → collegata a: ${args.projectTags.join(', ')}` : ''
      return { success: true, message: `${typeLabel[unifiedType] || 'Elemento'} "${args.title}" creato${linkedTo}`, id: ref.id }
    }

    case 'add_project': {
      const sections = (args.sections || []).map((s, i) => ({
        id: `${Date.now()}-${i}`,
        icon: s.icon || '📄',
        title: s.title,
        content: s.content || ''
      }))
      const projectData = {
        type: args.type || 'progetto',
        name: args.name,
        description: args.description,
        status: args.status || 'pending',
        tags: args.tags || [],
        roadmap: args.roadmap || '',
        obiettivi: args.obiettivi || '',
        ...(dataValida(args.deadline) ? { deadline: args.deadline } : {}),
        todos: [],
        links: [],
        sections,
        userId,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const ref = await adminDb.collection('projects').add(projectData)
      const sectionsInfo = sections.length ? ` con ${sections.length} sezioni` : ''
      return { success: true, message: `Progetto "${args.name}" creato${sectionsInfo}`, id: ref.id }
    }

    case 'add_todo': {
      const project = await findProject(args.projectName, userId)
      if (!project) return { success: false, message: `Progetto "${args.projectName}" non trovato` }

      const todos = project.data.todos || []
      const todo = { text: args.text, completed: false }
      // Stessa forma delle cose da fare create dall'app: deadline e, solo con quella, time
      if (dataValida(args.deadline)) {
        todo.deadline = args.deadline
        if (oraValida(args.time)) todo.time = args.time
      }
      todos.push(todo)
      await adminDb.collection('projects').doc(project.id).update({ todos, updatedAt: timestamp })
      return { success: true, message: `Todo "${args.text}"${dicituraScadenza(args.deadline, args.time)} aggiunto al progetto "${project.data.name}"` }
    }

    case 'complete_todo': {
      const project = await findProject(args.projectName, userId)
      if (!project) return { success: false, message: `Progetto "${args.projectName}" non trovato` }

      const todos = project.data.todos || []
      const todoIdx = todos.findIndex(t =>
        t.text.toLowerCase().includes(args.todoText.toLowerCase()) && !t.completed
      )
      if (todoIdx === -1) return { success: false, message: `Todo "${args.todoText}" non trovato o già completato` }

      todos[todoIdx].completed = true
      await adminDb.collection('projects').doc(project.id).update({ todos, updatedAt: timestamp })
      return { success: true, message: `Todo "${todos[todoIdx].text}" completato nel progetto "${project.data.name}"` }
    }

    case 'update_project': {
      const project = await findProject(args.projectName, userId)
      if (!project) return { success: false, message: `Progetto "${args.projectName}" non trovato` }

      const updates = { updatedAt: timestamp }
      if (args.status) updates.status = args.status
      if (args.description) updates.description = args.description
      if (args.roadmap) updates.roadmap = args.roadmap
      if (args.obiettivi) updates.obiettivi = args.obiettivi
      if (dataValida(args.deadline)) updates.deadline = args.deadline

      await adminDb.collection('projects').doc(project.id).update(updates)
      const changes = Object.keys(updates).filter(k => k !== 'updatedAt').join(', ')
      return { success: true, message: `Progetto "${project.data.name}" aggiornato (${changes})` }
    }

    case 'update_note': {
      const note = await findNote(args.noteTitle, userId)
      if (!note) return { success: false, message: `Nota "${args.noteTitle}" non trovata` }

      const updates = { updatedAt: timestamp }
      if (args.title) updates.name = args.title
      if (args.content) updates.description = args.content

      await adminDb.collection('projects').doc(note.id).update(updates)
      return { success: true, message: `Nota "${note.data.name}" aggiornata` }
    }

    case 'add_link_to_project': {
      const project = await findProject(args.projectName, userId)
      if (!project) return { success: false, message: `Progetto "${args.projectName}" non trovato` }

      const links = project.data.links || []
      links.push({ title: args.linkTitle, url: args.url })
      await adminDb.collection('projects').doc(project.id).update({ links, updatedAt: timestamp })
      return { success: true, message: `Link "${args.linkTitle}" aggiunto al progetto "${project.data.name}"` }
    }

    case 'delete_note': {
      const note = await findNote(args.noteTitle, userId)
      if (!note) return { success: false, message: `Nota "${args.noteTitle}" non trovata` }

      await adminDb.collection('projects').doc(note.id).delete()
      return { success: true, message: `Nota "${note.data.name}" eliminata` }
    }

    case 'add_section_to_project': {
      const project = await findProject(args.projectName, userId)
      if (!project) return { success: false, message: `Progetto "${args.projectName}" non trovato` }

      const newSection = {
        id: Date.now().toString(),
        icon: args.icon || '📄',
        title: args.sectionTitle,
        content: args.content || ''
      }
      const existingSections = project.data.sections || []
      await adminDb.collection('projects').doc(project.id).update({
        sections: [...existingSections, newSection],
        updatedAt: timestamp
      })
      return { success: true, message: `Sezione "${args.sectionTitle}" aggiunta a "${project.data.name}"` }
    }

    default:
      return { success: false, message: `Azione "${toolName}" non riconosciuta` }
  }
}

// Helper: trova progetto per nome (fuzzy match)
async function findProject(name, userId) {
  const snap = await adminDb.collection('projects').where('userId', '==', userId).get()
  const nameLower = String(name || '').toLowerCase()
  if (!nameLower) return null
  // Solo elementi con un nome: uno vuoto "contiene" qualunque testo e verrebbe scelto a caso
  const docs = snap.docs.filter(d => typeof d.data().name === 'string' && d.data().name)

  // Match esatto prima
  let match = docs.find(d => d.data().name.toLowerCase() === nameLower)
  // Poi match parziale
  if (!match) match = docs.find(d => d.data().name.toLowerCase().includes(nameLower))
  if (!match) match = docs.find(d => nameLower.includes(d.data().name.toLowerCase()))

  return match ? { id: match.id, data: match.data() } : null
}

// Helper: trova nota per nome — cerca in projects (dove le note vengono salvate)
async function findNote(title, userId) {
  const NOTE_TYPES = ['nota', 'idea', 'monologo', 'musica']
  const snap = await adminDb.collection('projects')
    .where('userId', '==', userId)
    .where('type', 'in', NOTE_TYPES)
    .get()
  const titleLower = String(title || '').toLowerCase()
  if (!titleLower) return null
  const docs = snap.docs.filter(d => typeof d.data().name === 'string' && d.data().name)

  let match = docs.find(d => d.data().name.toLowerCase() === titleLower)
  if (!match) match = docs.find(d => d.data().name.toLowerCase().includes(titleLower))
  if (!match) match = docs.find(d => titleLower.includes(d.data().name.toLowerCase()))

  return match ? { id: match.id, data: match.data() } : null
}

// ============================================================================
// CONTESTO UTENTE
// ============================================================================
// In che ordine l'AI conosce gli elementi: prima ciò che è vivo adesso
const STATUS_ORDER = { 'In corso': 0, 'Da fare': 1, 'In pausa': 2, 'Completato': 3 }

// Il server gira in UTC: "oggi" è quello di Paolo, in Italia
const oggiRoma = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date())
const piuGiorni = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const conOra = (giorno, ora) => (ora ? `${giorno} ${ora}` : giorno)

async function getUserContext(userId) {
  const [projectsSnap, eventsSnap] = await Promise.all([
    adminDb.collection('projects').where('userId', '==', userId).get(),
    adminDb.collection('events').where('userId', '==', userId).get()
  ])
  const oggi = oggiRoma()
  const orizzonte = piuGiorni(oggi, 14)

  const projects = projectsSnap.docs.map(d => {
    const data = d.data()
    const todos = data.todos || []
    const aperti = todos.filter(t => !t.completed)
    const sections = data.sections || []
    return {
      nome: data.name || '(senza nome)',
      tipo: data.type || 'progetto',
      descrizione: data.description || '',
      stato: STATUS_LABELS[data.status] || data.status || 'Da fare',
      archiviato: !!data.archived,
      fissato: !!data.pinned,
      tags: data.tags || [],
      roadmap: data.roadmap || '',
      obiettivi: data.obiettivi || '',
      scadenza: data.deadline || '',
      scadenzaOra: data.deadlineTime || '',
      links: (data.links || []).map(l => `${l.title}: ${l.url}`).join(', '),
      sezioni: sections.map(s => `${s.title}: ${(s.content || '').slice(0, 100)}`).join(' | '),
      todoCompletati: todos.length - aperti.length,
      todoTotali: todos.length,
      // Solo le voci aperte: quelle già fatte sono rumore per chi deve consigliare cosa fare
      todoAperti: aperti,
      aggiornato: data.updatedAt?.toMillis?.() || 0,
      creatoIl: data.createdAt?.toDate()?.toLocaleDateString('it-IT') || 'N/D',
      aggiornatoIl: data.updatedAt?.toDate()?.toLocaleDateString('it-IT') || 'N/D'
    }
  })

  // Le note del vecchio formato (collezione `notes`) non si leggono più dal 2026-10-04:
  // sono state copiate nel vault (00-Inbox/2026-10-04 Note vecchie dal gestionale.md)
  const notes = []

  // Agenda: scadenze (anche già passate, se non fatte) e appuntamenti fino a due settimane da oggi.
  // È la risposta a "cosa devo fare oggi": prima all'AI non arrivava.
  const agenda = []
  for (const p of projects) {
    if (p.archiviato) continue
    if (p.scadenza && p.stato !== 'Completato' && p.scadenza <= orizzonte) {
      agenda.push({ giorno: p.scadenza, ora: p.scadenzaOra, testo: `Scadenza di "${p.nome}"` })
    }
    for (const t of p.todoAperti) {
      if (t.deadline && t.deadline <= orizzonte) {
        agenda.push({ giorno: t.deadline, ora: t.time || '', testo: `"${t.text}" (${p.nome})` })
      }
    }
  }
  for (const d of eventsSnap.docs) {
    const e = d.data()
    if (e.date && e.date >= oggi && e.date <= orizzonte) {
      agenda.push({ giorno: e.date, ora: e.time || '', testo: `Appuntamento: ${e.title || 'senza titolo'}` })
    }
  }
  agenda.sort((a, b) => conOra(a.giorno, a.ora).localeCompare(conOra(b.giorno, b.ora)))

  const attivi = projects.filter(p => !p.archiviato)
  const stats = {
    totaleProgetti: attivi.length,
    archiviati: projects.length - attivi.length,
    progettiInCorso: attivi.filter(p => p.stato === 'In corso').length,
    progettiCompletati: attivi.filter(p => p.stato === 'Completato').length,
    progettiDaFare: attivi.filter(p => p.stato === 'Da fare').length,
    progettiInPausa: attivi.filter(p => p.stato === 'In pausa').length,
    totaleNote: notes.length,
    todoTotali: attivi.reduce((s, p) => s + p.todoTotali, 0),
    todoCompletati: attivi.reduce((s, p) => s + p.todoCompletati, 0)
  }

  return { projects, notes, agenda, oggi, stats }
}

const clip = (v, n) => {
  const str = String(v || '').replace(/\s+/g, ' ').trim()
  return str.length > n ? str.slice(0, n) + '…' : str
}

// Quanto contesto: i dettagli si riempiono in ordine di importanza finché c'è spazio, così
// resta fuori il meno rilevante (prima erano i primi 40 nell'ordine casuale del database).
const BUDGET_DETTAGLIO = 5000
const BUDGET_TOTALE = 10000

function formatContext(ctx) {
  const s = ctx.stats
  let text = ''

  text += `=== AGENDA (oggi è ${ctx.oggi}; scadenze e appuntamenti fino a 14 giorni) ===\n`
  if (ctx.agenda.length) {
    for (const a of ctx.agenda.slice(0, 25)) {
      const segno = a.giorno < ctx.oggi ? ' (SCADUTA)' : a.giorno === ctx.oggi ? ' (OGGI)' : ''
      text += `- ${conOra(a.giorno, a.ora)}${segno}: ${a.testo}\n`
    }
  } else {
    text += 'Niente in agenda: nessuna scadenza né appuntamento nei prossimi 14 giorni.\n'
  }

  text += '\n=== PANORAMICA ===\n'
  text += `Elementi: ${s.totaleProgetti} (${s.progettiInCorso} in corso, ${s.progettiDaFare} da fare, ${s.progettiInPausa} in pausa, ${s.progettiCompletati} completati)`
  text += s.archiviati ? `, più ${s.archiviati} archiviati (non mostrati)\n` : '\n'
  text += `Cose da fare: ${s.todoTotali - s.todoCompletati} aperte su ${s.todoTotali}\n`

  const ordinati = ctx.projects
    .filter(p => !p.archiviato)
    .sort((a, b) =>
      (b.fissato - a.fissato) ||
      ((STATUS_ORDER[a.stato] ?? 1) - (STATUS_ORDER[b.stato] ?? 1)) ||
      (b.aggiornato - a.aggiornato))

  text += '\n=== ELEMENTI (dal più attivo) ===\n'
  const soloNome = []
  for (const p of ordinati) {
    const testa = `[${p.tipo}] "${p.nome}" — ${p.stato}${p.fissato ? ', fissato' : ''}${p.scadenza ? `, scadenza ${conOra(p.scadenza, p.scadenzaOra)}` : ''}`
    const voci = p.todoAperti.slice(0, 6).map(t => clip(t.text, 90) + (t.deadline ? ` (entro ${t.deadline})` : ''))
    const altre = p.todoAperti.length > 6 ? ` +${p.todoAperti.length - 6} altre` : ''
    let blocco
    if (text.length < BUDGET_DETTAGLIO) {
      blocco = `\n${testa}\n`
      if (p.descrizione) blocco += `  ${clip(p.descrizione, 240)}\n`
      if (p.tags.length) blocco += `  Tag: ${p.tags.join(', ')}\n`
      if (p.obiettivi) blocco += `  Obiettivi: ${clip(p.obiettivi, 160)}\n`
      if (p.roadmap) blocco += `  Roadmap: ${clip(p.roadmap, 200)}\n`
      if (p.sezioni) blocco += `  Sezioni: ${clip(p.sezioni, 200)}\n`
      if (p.links) blocco += `  Link: ${clip(p.links, 120)}\n`
      if (p.todoTotali) blocco += `  Da fare (${p.todoAperti.length} aperte su ${p.todoTotali}): ${voci.join('; ')}${altre}\n`
    } else {
      // Oltre il primo blocco: una riga sola per elemento, con le prime cose da fare
      const prime = voci.length ? ` | da fare: ${voci.slice(0, 3).join('; ')}${p.todoAperti.length > 3 ? '…' : ''}` : ''
      blocco = `- ${testa}${p.descrizione ? `: ${clip(p.descrizione, 90)}` : ''}${prime}\n`
    }
    if (text.length + blocco.length > BUDGET_TOTALE) { soloNome.push(p); continue }
    text += blocco
  }
  if (soloNome.length) {
    text += `\n…e altri ${soloNome.length} elementi, solo il nome: ${clip(soloNome.map(p => `"${p.nome}" (${p.stato})`).join(', '), 900)}\n`
  }

  return text
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================
// Regole comuni a ogni assistente: cos'è davvero il gestionale e come funzionano le proposte.
// Senza, il Content Creator inventava funzioni ("fatture e magazzino") che non esistono.
const REGOLE_COMUNI = `

## COS'È IL GESTIONALE (non inventare altro)
È lo strumento PERSONALE di Paolo per organizzare progetti, idee, note, cose da fare, scadenze e
appuntamenti. Non gestisce fatture, magazzino, clienti o vendite. Quando parli dei suoi progetti usa
SOLO ciò che trovi nel contesto qui sotto: non inventare funzioni, dati, numeri o risultati.

## PROPOSTE (tool propose_actions)
- Proponi azioni SOLO se l'utente chiede di creare, salvare, segnare, modificare o completare qualcosa
- Se una cosa ti sembra da salvare ma lui non l'ha chiesto, chiediglielo a parole: niente proposte non richieste
- Al massimo 5 azioni per volta
- Le proposte compaiono sotto la tua risposta e l'utente le conferma o le rifiuta una per una
- Nei messaggi precedenti trovi le tue proposte tra [Proposte: …] con il loro stato
- Una proposta "in attesa" NON è stata eseguita: nel gestionale non esiste. Se l'utente chiede di
  cambiarla, proponi SOLO la versione corretta (la vecchia viene scartata da sola). Non proporre di
  completare, modificare o eliminare la vecchia: toccheresti un'altra cosa con un nome simile
- Una proposta "fatta" invece esiste: per cambiarla serve un'azione di modifica

## PRIMA DI RISPONDERE, LEGGI (strumenti di sola lettura, senza conferma)
Il contesto qui sotto è un riassunto: molti elementi hanno poche righe o solo il nome. Puoi leggere:
- **apri_elemento**: la scheda completa di un elemento (sezioni, tutte le cose da fare, link, roadmap)
- **cerca_elementi**: trovare dove si parla di qualcosa
- **leggi_nota_vault**: la nota Obsidian di un progetto (visione, decisioni recenti, roadmap, storia) o di una sessione di lavoro
- **agenda**: scadenze e appuntamenti di un periodo oltre i 14 giorni
Quando usarli:
- La domanda riguarda un elemento di cui hai solo il nome o poche righe → aprilo prima di rispondere
- Paolo chiede il perché, le decisioni, a che punto è, cosa è stato fatto → leggi la nota del vault
- Non sai quale elemento c'entra → cerca
- Mai dire "non ho informazioni su X" senza aver prima aperto o cercato X
Non usarli per saluti, chiacchiere o domande che non riguardano i suoi dati. Di solito bastano 1-3 letture.

## ELEMENTI CITATI CON @
Se in fondo trovi "ELEMENTI CITATI", Paolo li ha indicati apposta: sono il centro della domanda e hai già la scheda completa
e la nota del vault. Non riaprirli con apri_elemento; dalla nota puoi chiedere una sezione intera, se quella che vedi è tagliata.

## COME NOMINARE GLI ELEMENTI
Quando nomini un elemento che esiste nel gestionale scrivi il suo nome esatto tra doppie quadre, così diventa un link: [[Gestionale X]].
Solo per elementi veri, non per concetti generici. Dentro un grassetto va bene: **[[Ungesto]]**.`

// System prompt per la chat: conversazione e, quando richiesto, proposte di azioni
const SYSTEM_PROMPT_MAIN = `Sei **Polpo AI** 🐙, l'assistente intelligente integrato nel Gestionale Polpo.

## Chi sei
- Un assistente personale intelligente e proattivo, integrato nel gestionale
- Parli SEMPRE in italiano, in modo **naturale e conversazionale** come un amico competente
- Sei un **partner creativo**: discuti, ragiona, proponi alternative, fai domande
- NON essere troppo formale o robotico - sii diretto, curioso e propositivo

## IL GESTIONALE
Sistema UNIFICATO: tutto è un "elemento" con un tipo.
Tipi: **progetto**, **idea**, **monologo**, **musica**, **video**, **evento**, **nota**.
Ogni elemento può avere: descrizione, status, tags, sezioni personalizzate, todo, link, deadline.

## IL TUO RUOLO IN QUESTA CHAT
Chat principale — conversazione E azioni.

### Cosa DEVI fare:
- **Discutere e ragionare** come un partner creativo
- **Analizzare criticamente**: valuta pro e contro, fai domande
- **Brainstorming attivo**: proponi idee, alternative, scenari
- Suggerire **connessioni** tra progetti/idee
- Aiutare a scrivere testi per monologhi, canzoni, idee creative
- Pianificare strategie, roadmap, obiettivi

### Azioni disponibili (vedi PROPOSTE più sotto per quando usarle):
- **add_project** → Nuovo elemento (con sezioni personalizzate)
- **add_section_to_project** → Aggiungere sezione a elemento esistente
- **add_note** → Nuova nota/idea/info
- **add_todo** → Nuovo task
- **complete_todo** → Completare un task
- **update_project** → Aggiornare stato/roadmap/obiettivi/descrizione
- **update_note** → Aggiornare una nota
- **add_link_to_project** → Aggiungere un link
- **delete_note** → Eliminare una nota

### Sezioni personalizzate:
- Per un NUOVO elemento: includi sections[{icon, title, content}] nell'azione add_project
- Per uno ESISTENTE: usa add_section_to_project
- Icone appropriate: 🎨 Design, 💰 Costi, 📦 Fornitori, 📐 Specifiche, ecc.

## Regole
- Usa i dati dei progetti/note dell'utente per dare risposte informate
- NON inventare dati che non hai nel contesto
- Risposte concise ma sostanziose, usa **grassetto** per i punti chiave`

// ============================================================================
// AI SPECIALISTS - Prompt dedicati per competenze specifiche
// ============================================================================
const SPECIALISTS = {
  content: {
    name: 'Content Creator',
    icon: '🎬',
    description: 'Esperto di Reel, TikTok e video social',
    prompt: `Sei **Polpo Content** 🎬, lo specialista di content creation per social media integrato nel Gestionale Polpo.

## Chi sei
- Un esperto di content creation per Reel, TikTok, Shorts e video social
- Parli SEMPRE in italiano, in modo diretto e pratico
- Non fai teoria: scrivi testi pronti, proponi hook concreti, dai feedback specifici
- Sei un coach/copywriter/regista che aiuta a creare contenuti che FUNZIONANO

## LE TUE COMPETENZE

### Struttura di un Reel efficace
1. **Hook** (primi 2-3 sec) — la parte più importante. Deve far dire "ok, resto". Tipi:
   - Shock: "Stai sbagliando tutto"
   - Curiosità: "Nessuno ti dice questa cosa"
   - Problema diretto: "Se fai così, stai buttando soldi"
   - Contrasto: "Tutti fanno così… ed è sbagliato"
   - Regola: deve parlare di LORO, non di te
2. **Sviluppo** — valore rapido. Problema → spiegazione → mini soluzione. Frasi corte, parole semplici, ritmo. Ogni 1-2 secondi = informazione o stimolo.
3. **Micro-tensione** — mantieni attenzione con cambi di ritmo e open loop ("E il punto è questo…", "Ma la cosa peggiore è…"). Il cervello odia le cose incomplete.
4. **Chiusura/CTA** — naturale, non forzata. "Salvalo perché ti servirà", "Vuoi la parte 2?", "Se fai anche tu questo errore, scrivilo".

### Tecniche avanzate che applichi SEMPRE
- **Pattern interrupt**: vai contro aspettativa ("Non dovresti fare Reel", "Questo consiglio è sbagliato")
- **Open loop**: apri promesse e chiudile dopo. Crea più loop interni per massimizzare retention.
- **Densità di valore**: se togli una frase e non cambia nulla → era da togliere. Zero pause inutili, zero ripetizioni.
- **Specificità**: "raddoppi le visual in 7 giorni" batte "migliora i tuoi risultati". Il cervello crede ai dettagli.
- **Identificazione**: il pubblico deve sentirsi preso in causa ("Se fai Reel ma nessuno li guarda…", "Registri 10 volte e poi cancelli").
- **Emozione > informazione**: le persone condividono ciò che fa provare qualcosa (frustrazione, sollievo, superiorità).
- **Compressione**: togli sempre il 30% delle parole. Se funziona uguale → hai migliorato.
- **Parole magnetiche**: "errore", "nessuno", "semplice", "subito", "vero", "sbagliato".
- **Autorità senza dirlo**: sicurezza, chiarezza, zero tentennamenti. "Fai così" > "secondo me dovresti".
- **Contrasto emotivo**: alterna tensione/soluzione, problema/sollievo, caos/chiarezza.
- **Ritmo scritto**: vai a capo spesso, frasi corte = più leggibile e dinamico.
- **Format ripetibile**: non creare Reel casuali. Crea format ("Errori che stai facendo", "Cose che nessuno ti dice").

### Regola d'oro
Un Reel forte NON è "informativo". È **tensione → rilascio** (problema/curiosità → soluzione/verità).
Domanda chiave: "Perché dovrebbero restare fino alla fine?"

### Checklist pre-pubblicazione
Hook forte? Si capisce subito il tema? È specifico? Ha ritmo? Tiene curiosità? C'è una chiusura? Se manca anche solo una → migliora.

## COME AIUTI L'UTENTE
- **Idea grezza** → trasformala in script strutturato (Hook → Sviluppo → CTA)
- **Script esistente** → analizzalo, comprimi, migliora hook e ritmo
- **Richiesta idee** → proponi format ripetibili basati sul suo stile/argomento
- **Richiesta miglioramento** → dai feedback specifico e concreto, mai generico
- Proponi SEMPRE almeno 2-3 varianti di hook
- Scrivi gli script PRONTI DA LEGGERE, non la teoria

## IL GESTIONALE
Puoi anche salvare contenuti nel gestionale usando il tool propose_actions.
- Quando crei un elemento video, usa le sezioni: 🎣 Hook, 📝 Script, 📢 CTA, 🏷️ Hashtag/Note
- Puoi creare todo, aggiornare progetti, aggiungere sezioni

### Azioni disponibili:
- **add_project** → Nuovo elemento video/idea/nota con sezioni
- **add_section_to_project** → Aggiungere sezione a elemento esistente
- **add_note** → Nuova nota/idea
- **add_todo** → Nuovo task
- **complete_todo** → Completare un task
- **update_project** → Aggiornare stato/descrizione
- **add_link_to_project** → Aggiungere un link

## Regole
- Usa i dati dei progetti/note dell'utente per dare risposte informate
- NON inventare dati che non hai nel contesto
- Sii PRATICO e CONCRETO: scrivi i testi, non spiegare come scriverli
- Usa **grassetto** per i punti chiave
- Quando l'utente ti dà un'idea → rispondi con lo script pronto, non con la teoria`
  },

  // Facoltativo per ogni specialista: effort, quanto ragiona scrivendo (low | medium | high).
  // A voce resta sempre low.
  pianificatore: {
    name: 'Pianificatore',
    icon: '🗓️',
    description: 'Settimana, priorità e scadenze realistiche',
    prompt: `Sei **Polpo Pianificatore** 🗓️, integrato nel gestionale di Paolo. Lo aiuti a decidere cosa fare e quando.
Parli in italiano, diretto e concreto, come un collega che tiene il calendario.

## Come lavori
- Parti SEMPRE dai dati. Prima di un piano guarda l'agenda (oltre i 14 giorni usa lo strumento agenda) e apri gli
  elementi in corso o fissati di cui hai solo poche righe. Non pianificare a memoria.
- Paolo porta avanti molti progetti in parallelo: il tuo lavoro è SCEGLIERE, non elencare tutto. Al massimo
  3 priorità per settimana, e di' esplicitamente cosa NON fare adesso.
- Ordine di priorità: scadenze vicine > cose che ne sbloccano altre > cose iniziate e quasi finite > novità.
- Piani realistici: stima in ore o mezze giornate, lascia margine, tieni conto degli appuntamenti già fissati.
- Se una scadenza non è realistica dillo, con una data alternativa.
- Se manca un'informazione che cambia il piano (quanto tempo ha, cosa conta di più), fai UNA domanda prima.

## Formato
- "Cosa faccio oggi": al massimo 3 cose, la prima è quella da cui partire, il perché in mezza riga.
- Piano della settimana: giorno per giorno in righe brevi, poi "Rimandato" con ciò che resta fuori.
  Giorni e date li prendi dal calendario nelle istruzioni, mai calcolati a mente.
- Scadenze da fissare: proponile con propose_actions (add_todo con deadline) solo se Paolo approva il piano o lo chiede.`
  },

  critico: {
    name: 'Critico',
    icon: '🧐',
    description: 'Avvocato del diavolo su progetti e idee',
    effort: 'high',
    prompt: `Sei **Polpo Critico** 🧐, l'avvocato del diavolo integrato nel gestionale di Paolo.
Il tuo compito è trovare i punti deboli prima che costino tempo. Parli in italiano, franco ma giusto.

## Come lavori
- Prima di criticare un progetto LEGGILO: apri l'elemento e la sua nota del vault (visione, decisioni recenti).
  Critica ciò che c'è davvero, non un'idea generica del tipo di progetto.
- Cerca: rischi, ipotesi mai verificate, costi nascosti (tempo, soldi, manutenzione), obiettivo che si allarga,
  doppioni con altri progetti di Paolo (usa cerca_elementi), cose iniziate e lasciate a metà.
- Niente complimenti di cortesia e niente stroncature gratuite. Ogni critica ha un "quindi": cosa tagliare,
  cosa verificare, cosa fare diversamente.
- Distingui: **grave** (blocca o fa perdere molto), **dubbio** (da verificare), **dettaglio**.
- Se Paolo difende una scelta con buone ragioni, riconoscilo e cambia idea: non sei contrario per principio.

## Formato
- Breve: al massimo 5 punti, ordinati dal più grave. Problema in grassetto, una riga di spiegazione, una di proposta.
- Chiudi con LA domanda più importante a cui Paolo dovrebbe rispondere prima di andare avanti.
- Non proporre azioni nel gestionale, salvo che Paolo lo chieda (es. "segna questi rischi nel progetto").`
  }
  // Qui si aggiungono altri specialisti in futuro:
  // music: { name: 'Music Producer', icon: '🎵', prompt: '...' },
  // events: { name: 'Event Planner', icon: '🎪', prompt: '...' },
}

// Aggiunta al prompt quando l'utente parla al microfono: la risposta viene letta ad alta voce,
// e una risposta scritta (elenchi, grassetti, paragrafi) detta a voce è lunghissima e illeggibile.
const VOICE_NOTE = `

## RISPOSTA A VOCE
L'utente ti sta parlando al microfono e la tua risposta verrà LETTA AD ALTA VOCE.
- Rispondi in 1-3 frasi brevi, come in una conversazione parlata
- Niente elenchi, titoli, tabelle, grassetti, emoji, link o doppie quadre: solo frasi normali
- Se serve un testo lungo (script, piano, elenco), dillo in una frase e proponi di salvarlo con propose_actions
- Se proponi azioni, riassumile in una frase: l'utente confermerà a voce`

// ============================================================================
// ROUTES
// ============================================================================

// Endpoint per ottenere la lista degli specialisti disponibili
app.get('/api/specialists', verifyUser, (req, res) => {
  const list = Object.entries(SPECIALISTS).map(([id, s]) => ({
    id, name: s.name, icon: s.icon, description: s.description
  }))
  res.json({ specialists: list })
})

app.get('/api/providers', verifyUser, (req, res) => {
  res.json({ providers: listProviders() })
})

// Traduce un errore di provider in messaggio leggibile + dettaglio tecnico.
function describeAiError(err, label) {
  const g = err?.error?.error || err?.error || {}
  const msg = g.message || err?.message || ''
  const detail = [g.code || err?.code, err?.status, msg].filter(Boolean).join(' · ').slice(0, 300)
  let status = 500
  let error = 'Errore nella generazione della risposta.'
  if (err?.status === 429 || /rate.?limit/i.test(msg)) {
    status = 429; error = `Limite richieste ${label} raggiunto. Riprova tra qualche secondo.`
  } else if (err?.status === 413 || /too large|context.?length|tokens per (minute|day)/i.test(msg)) {
    status = 413; error = 'Richiesta troppo grande per il modello: troppo contesto. Riprova con un messaggio più corto.'
  } else if (err?.status === 401 || err?.status === 403 || /api[_ ]?key|invalid.*key|authentication|organization/i.test(msg)) {
    status = 500; error = `Chiave ${label} non valida o mancante sul server.`
  } else if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
    status = 504; error = `${label} non ha risposto in tempo.`
  }
  return { status, error, detail }
}

// Contesto in memoria per 30 secondi: in una conversazione i messaggi arrivano a raffica e rileggere
// tutti i progetti dal database costava 1-2,5 s a ogni domanda. Si svuota quando confermi un'azione,
// così dopo una modifica fatta in chat l'AI non vede mai dati vecchi.
const CONTESTO_TTL = 30000
const contestiInMemoria = new Map()
async function contestoDi(userId) {
  const c = contestiInMemoria.get(userId)
  if (c && Date.now() - c.quando < CONTESTO_TTL) return c.dati
  const dati = await getUserContext(userId)
  contestiInMemoria.set(userId, { dati, quando: Date.now() })
  return dati
}
const dimenticaContesto = (userId) => contestiInMemoria.delete(userId)

// ============================================================================
// LETTURE PER L'AGENTE (vedi agente.js)
// ============================================================================
const progettiDi = async (userId) =>
  (await adminDb.collection('projects').where('userId', '==', userId).get()).docs.map(d => ({ id: d.id, ...d.data() }))
const eventiDi = async (userId) =>
  (await adminDb.collection('events').where('userId', '==', userId).get()).docs.map(d => ({ id: d.id, ...d.data() }))

// Il vault: dal disco quando il server gira sul PC (VAULT_PATH), altrimenti dalla copia su GitHub.
// Due minuti in memoria: in una conversazione la stessa nota si rilegge spesso.
const VAULT_TTL = 120000
const cacheVault = new Map()
async function daCacheVault(chiave, leggi) {
  const c = cacheVault.get(chiave)
  if (c && Date.now() - c.quando < VAULT_TTL) return c.valore
  const valore = await leggi()
  cacheVault.set(chiave, { valore, quando: Date.now() })
  if (cacheVault.size > 300) cacheVault.delete(cacheVault.keys().next().value)
  return valore
}
const lettoreVault = {
  leggi(percorso) {
    if (typeof percorso !== 'string' || percorso.includes('..') || !CARTELLE_VAULT.some(c => percorso.startsWith(c + '/'))) return null
    return daCacheVault(`f:${percorso}`, async () => {
      try {
        if (process.env.VAULT_PATH) return await readFile(join(process.env.VAULT_PATH, percorso), 'utf8')
        if (!GITHUB_TOKEN) return null
        const file = await githubFetch(percorso)
        return Buffer.from(file.content, 'base64').toString('utf-8')
      } catch { return null }
    })
  },
  elenca(cartella) {
    if (!CARTELLE_VAULT.includes(cartella)) return []
    return daCacheVault(`d:${cartella}`, async () => {
      try {
        if (process.env.VAULT_PATH) return await readdir(join(process.env.VAULT_PATH, cartella))
        if (!GITHUB_TOKEN) return []
        const items = await githubFetch(cartella)
        return Array.isArray(items) ? items.filter(i => i.type === 'file').map(i => i.name) : []
      } catch { return [] }
    })
  }
}
// Il vault è personale: solo il proprietario lo fa leggere all'AI
const vaultDi = async (userId) => {
  try { return userId === await uidProprietarioVault() ? lettoreVault : null } catch { return null }
}
const DEPS_LETTURA = { progetti: progettiDi, eventi: eventiDi, vault: vaultDi }

// Gli elementi citati con @: scheda completa più la nota del vault, già nelle istruzioni.
// Arrivano come id; si leggono solo tra quelli dell'utente.
const MAX_CITATI = 6
async function elementiCitati(ids, lettore) {
  const lista = [...new Set((Array.isArray(ids) ? ids : []).filter(id => typeof id === 'string' && /^[\w-]{1,64}$/.test(id)))].slice(0, MAX_CITATI)
  if (!lista.length) return { testo: '', passi: [] }
  const vault = await lettore.vault()
  const blocchi = []
  const passi = []
  for (const id of lista) {
    const p = await lettore.perId(id)
    if (!p) continue
    passi.push({ tipo: 'citato', testo: p.name, id: p.id })
    let blocco = schedaElemento(p)
    const percorso = percorsoVault(p)
    const nota = vault && percorso ? await vault.leggi(percorso) : null
    if (nota) {
      blocco += `\n\nDalla nota del vault (${percorso}):\n${riassumiNota(nota, { max: lista.length > 2 ? 3000 : 6000 })}`
      passi.push({ tipo: 'vault', testo: percorso.split('/').pop().replace(/\.md$/, ''), percorso, da: p.id })
    }
    blocchi.push(blocco)
  }
  if (!blocchi.length) return { testo: '', passi: [] }
  return {
    testo: `\n=== ELEMENTI CITATI DA PAOLO CON @ (scheda completa: sono il centro della domanda) ===\n\n${blocchi.join('\n\n---\n\n')}`,
    passi
  }
}

// A voce le doppie quadre si leggerebbero: restano solo i nomi
const perVoce = (req, testo) => (req.body.voce ? String(testo || '').replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, '$1') : testo)

// Una risposta completa dell'agente, con i passi delle citazioni davanti
async function rispondi(req, prep, target, eventi) {
  const r = await agente(target, prep.messages, prep.opts, eventi)
  return { ...r, reply: perVoce(req, r.reply), passi: [...prep.passiIniziali, ...r.passi] }
}

// Tutto ciò che serve a una risposta: modelli scelti, istruzioni, contesto, storia.
// Lo usano sia /api/chat sia /api/chat/stream, così costruiscono la richiesta allo stesso modo.
async function preparaChat(req, maxTargets) {
  const { message, history = [], specialist = null } = req.body
  if (!message?.trim()) return { errore: { status: 400, error: 'Messaggio vuoto' } }

  const targets = normalizeTargets(req.body.targets, maxTargets)
  if (!targets.length) return { errore: { status: 500, error: 'Nessun provider AI configurato sul server (mancano le chiavi).' } }

  const lettore = creaLettore(DEPS_LETTURA, req.userId)
  const [context, citati] = await Promise.all([contestoDi(req.userId), elementiCitati(req.body.citati, lettore)])
  // Cap duro: il tier gratuito ha un limite di token per richiesta.
  // formatContext e' gia' limitato per campo, questo e' la rete di sicurezza.
  const MAX_CONTEXT_CHARS = 14000
  const full = formatContext(context)
  const contextText = full.length > MAX_CONTEXT_CHARS
    ? full.slice(0, MAX_CONTEXT_CHARS) + '\n…(contesto troncato: troppi elementi)'
    : full
  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Rome'
  })

  // Le date si leggono, non si calcolano: "dopodomani" da lunedì 28 diventava il 1° ottobre
  const calendario = Array.from({ length: 15 }, (_, i) => {
    const iso = piuGiorni(oggiRoma(), i)
    const nome = new Date(`${iso}T12:00:00Z`).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    return `${nome} = ${iso}${['  (oggi)', '  (domani)', '  (dopodomani)'][i] || ''}`
  }).join('\n')

  // Il prompt dell'assistente scelto, più le regole comuni a tutti
  let systemPrompt = (SPECIALISTS[specialist]?.prompt || SYSTEM_PROMPT_MAIN) + REGOLE_COMUNI
  if (req.body.voce) systemPrompt += VOICE_NOTE

  const messages = [
    {
      role: 'system',
      content: [
        systemPrompt,
        `\nData di oggi: ${today}`,
        `Calendario dei prossimi giorni (per le date usa questo, non calcolarle):\n${calendario}`,
        `Nome utente: ${req.userName}`,
        '',
        contextText || 'L\'utente non ha ancora progetti o note. Suggerisci di iniziare!',
        citati.testo
      ].filter(Boolean).join('\n')
    },
    // Solo ruoli e testi validi: dalla history non deve poter entrare un messaggio di sistema
    ...history.slice(-24)
      .filter(m => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content)
      .map(m => ({ role: m.role, content: m.content.slice(0, 8000) })),
    { role: 'user', content: message }
  ]

  // All'AI: le letture (le fa da sola) e propose_actions. Le modifiche vere partono da
  // /api/chat/execute, dopo la conferma di Paolo.
  const tools = [...TOOLS.filter(t => t.function.name === 'propose_actions'), ...STRUMENTI_LETTURA]
  // Scrivendo ragiona di più; a voce conta la prontezza
  const effort = req.body.voce ? 'low' : (SPECIALISTS[specialist]?.effort || 'medium')
  const stats = {
    progetti: context.stats.totaleProgetti,
    note: context.stats.totaleNote,
    todoCompletati: context.stats.todoCompletati,
    todoTotali: context.stats.todoTotali
  }
  // max_tokens comprende anche il ragionamento: con 2048 una domanda complessa restava a metà
  return { targets, messages, opts: { maxTokens: 4096, tools, effort, lettore }, stats, passiIniziali: citati.passi }
}

app.post('/api/chat', verifyUser, async (req, res) => {
  try {
    // Fino a 4 modelli a confronto
    const prep = await preparaChat(req, 4)
    if (prep.errore) return res.status(prep.errore.status).json({ error: prep.errore.error })
    const { targets, stats } = prep
    const forma = (r) => ({ reply: r.reply, proposedActions: r.proposedActions, passi: r.passi, ragionamento: r.ragionamento, provider: r.provider, model: r.model, label: r.label, ms: r.ms })

    // Un solo modello: stessa risposta di sempre (e stessi errori HTTP).
    if (targets.length === 1) {
      const r = await rispondi(req, prep, targets[0])
      return res.json({ ...forma(r), stats })
    }

    // Più modelli in parallelo: ognuno può fallire senza fermare gli altri.
    const settled = await Promise.allSettled(targets.map(t => rispondi(req, prep, t)))
    const replies = settled.map((s, i) => {
      if (s.status === 'fulfilled') return forma(s.value)
      const t = targets[i]
      const label = `${providerName(t.provider)} · ${t.model}`
      const { error, detail } = describeAiError(s.reason, providerName(t.provider))
      console.error(`Errore chat AI (${label}):`, detail)
      return { provider: t.provider, model: t.model, label, error, detail }
    })
    if (replies.every(r => r.error)) {
      const first = describeAiError(settled[0].reason, providerName(targets[0].provider))
      return res.status(first.status).json({ error: `Nessun modello ha risposto. ${first.error}`, detail: first.detail })
    }
    const first = replies.find(r => !r.error)
    res.json({ reply: first.reply, proposedActions: first.proposedActions, passi: first.passi, ragionamento: first.ragionamento, replies, stats })
  } catch (err) {
    const label = providerName(normalizeTargets(req.body?.targets, 1)[0]?.provider || 'groq')
    const { status, error, detail } = describeAiError(err, label)
    console.error('Errore chat AI:', err?.status, detail)
    res.status(status).json({ error, detail })
  }
})

// Risposta a pezzi (server-sent events), un modello solo. Eventi:
//   { t: 'passo', passo }   Polpo ha letto qualcosa: { tipo: citato|apri|cerca|vault|agenda, testo, id? }
//   { t: 'pensiero', d }    un pezzo del ragionamento
//   { t: 'testo', d }       un pezzo di testo
//   { t: 'fine', reply, proposedActions, passi, ragionamento, label, … }   la risposta completa, che fa fede
//   { t: 'errore', error, detail }
app.post('/api/chat/stream', verifyUser, async (req, res) => {
  const t0 = Date.now()
  let prep
  try {
    prep = await preparaChat(req, 1)
  } catch (err) {
    const { status, error, detail } = describeAiError(err, 'AI')
    return res.status(status).json({ error, detail })
  }
  if (prep.errore) return res.status(prep.errore.status).json({ error: prep.errore.error })

  res.set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' })
  res.flushHeaders()
  const invia = (evento) => res.write(`data: ${JSON.stringify(evento)}\n\n`)
  // Se il telefono si addormenta a metà, il proxy non deve chiudere la connessione per silenzio
  const battito = setInterval(() => res.write(': battito\n\n'), 15000)

  const tPronto = Date.now()
  let tPrimo = 0
  try {
    for (const passo of prep.passiIniziali) invia({ t: 'passo', passo })
    const r = await rispondi(req, prep, prep.targets[0], {
      onTesto: (d) => { tPrimo ||= Date.now(); invia({ t: 'testo', d }) },
      onPensiero: (d) => invia({ t: 'pensiero', d }),
      onPasso: (passo) => invia({ t: 'passo', passo })
    })
    // Dove va il tempo: preparazione (contesto dal database) e modello, fino al primo pezzo e alla fine
    console.log(`⏱ chat: contesto ${tPronto - t0}ms · primo testo ${tPrimo ? tPrimo - tPronto : '-'}ms · fine ${Date.now() - tPronto}ms · ${r.passi.length} letture · ${prep.messages[0].content.length} caratteri di istruzioni`)
    invia({ t: 'fine', reply: r.reply, proposedActions: r.proposedActions, passi: r.passi, ragionamento: r.ragionamento, provider: r.provider, model: r.model, label: r.label, ms: r.ms, stats: prep.stats })
  } catch (err) {
    const { error, detail } = describeAiError(err, providerName(prep.targets[0].provider))
    console.error('Errore chat AI (stream):', err?.status, detail)
    invia({ t: 'errore', error, detail })
  } finally {
    clearInterval(battito)
    res.end()
  }
})

// Esegue le azioni confermate dall'utente
app.post('/api/chat/execute', verifyUser, async (req, res) => {
  try {
    const { actions = [] } = req.body
    if (!actions.length) return res.status(400).json({ error: 'Nessuna azione da eseguire' })

    const results = []
    dimenticaContesto(req.userId) // i dati stanno per cambiare
    for (const action of actions) {
      console.log(`✅ Confermata: ${action.tool}`, action.args)
      const result = await executeTool(action.tool, action.args, req.userId)
      results.push({ tool: action.tool, label: action.label, result })
    }

    // Riletto dopo le modifiche: serve alle statistiche e diventa il contesto fresco per la prossima domanda
    const context = await getUserContext(req.userId)
    contestiInMemoria.set(req.userId, { dati: context, quando: Date.now() })

    res.json({
      results,
      stats: {
        progetti: context.stats.totaleProgetti,
        note: context.stats.totaleNote,
        todoCompletati: context.stats.todoCompletati,
        todoTotali: context.stats.todoTotali
      }
    })
  } catch (err) {
    console.error('Errore esecuzione azioni:', err.message)
    res.status(500).json({ error: 'Errore nell\'esecuzione delle azioni' })
  }
})

// Genera titolo conversazione
app.post('/api/chat/title', verifyUser, async (req, res) => {
  try {
    const { messages: convMessages = [] } = req.body
    if (convMessages.length < 2) {
      return res.json({ title: convMessages[0]?.content?.substring(0, 40) || 'Nuova conversazione' })
    }
    const firstExchange = convMessages.slice(0, 4).map(m => `${m.role}: ${m.content}`).join('\n')
    const completion = await utilityChat({
      messages: [
        { role: 'system', content: 'Genera un titolo breve (max 5 parole, in italiano) che riassuma questa conversazione. Rispondi SOLO con il titolo.' },
        { role: 'user', content: firstExchange }
      ],
      temperature: 0.3,
      // I modelli con ragionamento (gpt-oss) consumano i token pensando: con pochi token il titolo esce vuoto.
      max_tokens: 300
    })
    const title = completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') || 'Conversazione'
    res.json({ title })
  } catch (err) {
    res.json({ title: 'Conversazione' })
  }
})

// ============================================================================
// VOCE - modalità "Parla": voce neurale di Microsoft Edge (la stessa di ECO), gratis
// ============================================================================
// GET perché la suona un <audio src>, che non manda intestazioni: il token Firebase
// viaggia nel parametro k. Limite a parte dalla chat: ogni frase letta è una richiesta.
const VOCE = process.env.VOCE_EDGE || 'it-IT-IsabellaNeural'
const VOCE_VELOCITA = process.env.VOCE_VELOCITA || '+10%'
const voceLimits = new Map()

app.get('/api/parla', async (req, res) => {
  const testo = String(req.query.t || '').slice(0, 600).trim()
  if (!testo) return res.status(400).end()

  let uid
  try {
    uid = (await admin.auth().verifyIdToken(String(req.query.k || ''))).uid
  } catch {
    return res.status(401).end()
  }
  const ora = Date.now()
  const l = voceLimits.get(uid)
  if (!l || ora - l.inizio > 60000) voceLimits.set(uid, { inizio: ora, n: 1 })
  else if (++l.n > 150) return res.status(429).end()

  const tts = new MsEdgeTTS()
  const chiudi = () => { try { tts.close() } catch { /* già chiuso */ } }
  try {
    await tts.setMetadata(VOCE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(testo, { rate: VOCE_VELOCITA })
    res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' })
    audioStream.on('error', (err) => { console.error('Voce:', err?.message); chiudi(); res.end() })
    audioStream.on('close', chiudi)
    req.on('close', chiudi) // hai interrotto: niente audio scaricato per niente
    audioStream.pipe(res)
  } catch (err) {
    console.error('Voce non disponibile:', err?.message)
    chiudi()
    if (!res.headersSent) res.status(502).end()
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Polpo AI', version: '2.3.0', model: defaultTarget()?.model, providers: listProviders().map(p => p.id), uptime: Math.floor(process.uptime()) })
})

// ============================================================================
// VAULT — lettura note Obsidian via GitHub API
// ============================================================================
const GITHUB_OWNER = 'PRX314'
const GITHUB_REPO  = 'vault-obsidian-gestionale'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

const VAULT_FOLDERS = ['20-Projects', '30-Areas', '40-Resources']

async function githubFetch(path) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`)
  return res.json()
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { frontmatter: {}, body: raw.trim() }
  const body = raw.slice(match[0].length).trim()
  const frontmatter = {}
  match[1].split('\n').forEach(line => {
    const colon = line.indexOf(':')
    if (colon === -1) return
    const key = line.slice(0, colon).trim()
    const val = line.slice(colon + 1).trim().replace(/^\[|\]$/g, '')
    frontmatter[key] = val
  })
  return { frontmatter, body }
}

// Il vault è personale: autenticarsi nel progetto Firebase non basta.
let vaultOwnerUid;
async function uidProprietarioVault() {
  vaultOwnerUid ||= process.env.VAULT_OWNER_UID ||
    (await admin.auth().getUserByEmail(process.env.VAULT_OWNER_EMAIL || 'paoloandrearepetto@gmail.com')).uid;
  return vaultOwnerUid;
}
async function verifyVaultOwner(req, res, next) {
  try {
    const uid = await uidProprietarioVault();
    if (req.userId !== uid) return res.status(403).json({ error: 'Accesso al vault non consentito' });
    next();
  } catch {
    return res.status(503).json({ error: 'Accesso al vault non configurato' });
  }
}

// Lista file .md nelle cartelle del vault
app.get('/api/vault/tree', verifyUser, verifyVaultOwner, async (req, res) => {
  if (!GITHUB_TOKEN) return res.status(503).json({ error: 'GitHub token non configurato. Aggiungi GITHUB_TOKEN al .env' })
  try {
    const tree = {}
    await Promise.all(VAULT_FOLDERS.map(async folder => {
      try {
        const items = await githubFetch(folder)
        tree[folder] = Array.isArray(items)
          ? items.filter(i => i.name.endsWith('.md')).map(i => ({ name: i.name.replace(/\.md$/, ''), path: i.path }))
          : []
      } catch { tree[folder] = [] }
    }))
    res.json({ tree })
  } catch (err) {
    console.error('Vault tree error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Ultimo commit (timestamp ultimo sync)
app.get('/api/vault/last-sync', verifyUser, verifyVaultOwner, async (req, res) => {
  if (!GITHUB_TOKEN) return res.status(503).json({ error: 'GitHub token non configurato' })
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits/main`
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'X-GitHub-Api-Version': '2022-11-28' }
    })
    const commit = await r.json()
    res.json({
      lastSync: commit.commit?.committer?.date || commit.commit?.author?.date,
      message:  commit.commit?.message,
      sha:      commit.sha?.slice(0, 7)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Sync manuale vault → GitHub (solo locale)
app.post('/api/vault/sync', verifyUser, verifyVaultOwner, async (req, res) => {
  const vaultPath = process.env.VAULT_PATH
  if (!vaultPath) return res.status(503).json({ error: 'Sync manuale disponibile solo in locale (VAULT_PATH non impostato)' })
  try {
    const date = new Date().toLocaleString('it-IT', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    await execAsync(`git -C "${vaultPath}" add -A`)
    await execAsync(`git -C "${vaultPath}" commit -m "vault: sync manuale ${date}" --allow-empty`)
    await execAsync(`git -C "${vaultPath}" push`)
    res.json({ success: true, message: `Sync completato — ${date}` })
  } catch (err) {
    console.error('Vault sync error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Leggi contenuto di una nota
app.get('/api/vault/note', verifyUser, verifyVaultOwner, async (req, res) => {
  if (!GITHUB_TOKEN) return res.status(503).json({ error: 'GitHub token non configurato' })
  const { path } = req.query
  if (!path || !path.endsWith('.md') || path.includes('..')) return res.status(400).json({ error: 'Path non valido' })
  if (!VAULT_FOLDERS.some(f => path.startsWith(f + '/'))) return res.status(403).json({ error: 'Cartella non consentita' })
  try {
    const file = await githubFetch(path)
    const raw = Buffer.from(file.content, 'base64').toString('utf-8')
    const { frontmatter, body } = parseFrontmatter(raw)
    res.json({ path, name: file.name.replace(/\.md$/, ''), frontmatter, body, raw })
  } catch (err) {
    console.error('Vault note error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Salva un messaggio della chat in una cartella dedicata del vault (sempre nuovo file, mai sovrascritto).
// Il sync sul PC lo riporta in Obsidian. Solo Gestionale X: niente altre cartelle.
const INBOX_GESTIONALE = '00-Inbox/Gestionale X'

function slugNome(testo) {
  return String(testo || '').replace(/[\\/:*?"<>|#^[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50) || 'Messaggio'
}

async function githubCrea(path, contenuto, messaggio) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: messaggio, content: Buffer.from(contenuto, 'utf-8').toString('base64') })
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`)
  return res.json()
}

app.post('/api/vault/salva-inbox', verifyUser, verifyVaultOwner, async (req, res) => {
  if (!GITHUB_TOKEN) return res.status(503).json({ error: 'GitHub token non configurato: il vault non è scrivibile' })
  const { testo, titolo, assistente } = req.body || {}
  if (typeof testo !== 'string' || !testo.trim() || testo.length > 50000) return res.status(400).json({ error: 'Testo non valido' })
  try {
    const adesso = new Date()
    const stampa = adesso.toLocaleString('sv-SE', { timeZone: 'Europe/Rome' }).slice(0, 16).replace(':', '')   // 2026-10-06 1712
    const nome = `${stampa} ${slugNome(titolo || testo.split('\n')[0])}.md`
    const path = `${INBOX_GESTIONALE}/${nome}`
    const fm = [
      '---',
      'fonte: gestionale-x',
      'tipo: chat',
      `creato: ${adesso.toISOString()}`,
      assistente ? `assistente: ${String(assistente).replace(/[\r\n]/g, ' ')}` : null,
      '---',
      ''
    ].filter(x => x !== null).join('\n')
    await githubCrea(path, `${fm}\n${testo.trim()}\n`, `gestionale: salva nel vault ${nome}`)
    res.json({ success: true, path })
  } catch (err) {
    console.error('Vault salva-inbox error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ============================================================================
// WEB PUSH NOTIFICATIONS
// ============================================================================

const VAPID_PUBLIC = 'BEluLj80kUivOmje8jrT0rgeuJHICXPhhxF-lfFM0Yna8ZMvy8__r8BKt4G8CnM4r4KObZaYh6oXMyiB1pjSJEQ'
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''

if (VAPID_PRIVATE) {
  webpush.setVapidDetails('mailto:paoloandrearepetto@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE)
  console.log('🔔 Web Push configurato')
} else {
  console.warn('⚠️ VAPID_PRIVATE_KEY non impostata - notifiche push disabilitate')
}

// Save push subscription for a user
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'Non autenticato' })

    const token = authHeader.split('Bearer ')[1]
    const decoded = await admin.auth().verifyIdToken(token)
    const userId = decoded.uid
    const { subscription } = req.body

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription non valida' })
    }

    // Save to Firestore (overwrite per user)
    await adminDb.collection('push_subscriptions').doc(userId).set({
      userId,
      subscription,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Errore salvataggio subscription:', err)
    res.status(500).json({ error: 'Errore server' })
  }
})

// Unsubscribe
app.post('/api/push/unsubscribe', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'Non autenticato' })

    const token = authHeader.split('Bearer ')[1]
    const decoded = await admin.auth().verifyIdToken(token)

    await adminDb.collection('push_subscriptions').doc(decoded.uid).delete()
    res.json({ success: true })
  } catch (err) {
    console.error('Errore unsubscribe:', err)
    res.status(500).json({ error: 'Errore server' })
  }
})

// Get VAPID public key
app.get('/api/push/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC })
})

// Cron: check deadlines every hour and send push notifications
async function checkAndNotifyDeadlines() {
  if (!VAPID_PRIVATE) return

  try {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const threeDays = new Date(now)
    threeDays.setDate(threeDays.getDate() + 3)

    const formatDate = (d) => d.toISOString().split('T')[0]
    const todayStr = formatDate(now)
    const tomorrowStr = formatDate(tomorrow)
    const threeDaysStr = formatDate(threeDays)

    // Get all subscriptions
    const subsSnapshot = await adminDb.collection('push_subscriptions').get()
    if (subsSnapshot.empty) return

    for (const subDoc of subsSnapshot.docs) {
      const { userId, subscription } = subDoc.data()

      // Get user's projects
      const projectsSnapshot = await adminDb.collection('projects')
        .where('userId', '==', userId)
        .get()

      const notifications = []

      projectsSnapshot.forEach(doc => {
        const project = doc.data()

        // Check project deadline
        if (project.deadline) {
          if (project.deadline === todayStr) {
            notifications.push({ title: '⚠️ Scadenza oggi!', body: `"${project.name}" scade oggi` })
          } else if (project.deadline === tomorrowStr) {
            notifications.push({ title: '📅 Scadenza domani', body: `"${project.name}" scade domani` })
          } else if (project.deadline === threeDaysStr) {
            notifications.push({ title: '📅 Tra 3 giorni', body: `"${project.name}" scade tra 3 giorni` })
          }
        }

        // Check todo deadlines
        ;(project.todos || []).forEach(todo => {
          if (todo.deadline && !todo.completed) {
            if (todo.deadline === todayStr) {
              notifications.push({ title: '✅ Task oggi!', body: `"${todo.text}" (${project.name})` })
            } else if (todo.deadline === tomorrowStr) {
              notifications.push({ title: '✅ Task domani', body: `"${todo.text}" (${project.name})` })
            }
          }
        })
      })

      // Send notifications
      for (const notif of notifications) {
        try {
          await webpush.sendNotification(subscription, JSON.stringify({
            title: notif.title,
            body: notif.body,
            icon: '/vite.svg',
            badge: '/vite.svg'
          }))
        } catch (pushErr) {
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            // Subscription expired, remove it
            await adminDb.collection('push_subscriptions').doc(userId).delete()
          }
          console.error('Push error:', pushErr.statusCode || pushErr.message)
        }
      }
    }
  } catch (err) {
    console.error('Errore check deadlines:', err)
  }
}

// DISATTIVATO — le notifiche le manda ora la Netlify Scheduled Function
// (polpopoly-hub/netlify/functions/sveglie.mjs).
//
// Due motivi. Il primo: questo processo si addormenta dopo un quarto d'ora di
// inattivita', quindi un intervallo di un'ora non arrivava quasi mai a
// scattare. Il secondo: girava sulla stessa collection push_subscriptions,
// perche' senza memoria di cosa aveva gia' mandato rispediva la stessa
// scadenza a ogni giro. Riattivarlo adesso significherebbe notifiche doppie.
//
// Il codice qui sopra resta come riferimento, ma non parte piu' da solo.
// setInterval(checkAndNotifyDeadlines, 60 * 60 * 1000)
// setTimeout(checkAndNotifyDeadlines, 30000)
void checkAndNotifyDeadlines

const PORT = process.env.PORT || 5032
app.listen(PORT, () => {
  console.log(`🐙 Polpo AI v2.1 avviato su porta ${PORT}`)
  console.log(`   Tools disponibili: ${TOOLS.map(t => t.function.name).join(', ')}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
  console.log(`   Push notifications: ${VAPID_PRIVATE ? '✅ attive' : '❌ disabilitate (manca VAPID_PRIVATE_KEY)'}`)
})
