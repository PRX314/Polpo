import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import Groq from 'groq-sdk'
import admin from 'firebase-admin'
import webpush from 'web-push'

dotenv.config()

// Firebase Admin init
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
app.use(cors({ origin: ['http://localhost:5173', 'https://gestionalepolpo.netlify.app', 'https://polpo-c9un.onrender.com'] }))
app.use(express.json({ limit: '1mb' }))

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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
                  description: 'Parametri dell\'azione. Per add_project: {type (progetto/idea/monologo/musica/video/evento/nota), name, description, status, tags[], roadmap, obiettivi, sections[{icon, title, content}]}. Per add_section_to_project: {projectName, icon, sectionTitle, content}. Per add_todo: {projectName, text}. Per complete_todo: {projectName, todoText}. Per update_project: {projectName, status, description, roadmap, obiettivi}. Per add_link_to_project: {projectName, linkTitle, url}. Per add_note: {title, content, type, category, priority, projectTags[]} (LEGACY). Per update_note: {noteTitle, title, content, priority}. Per delete_note: {noteTitle}.'
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
async function executeTool(toolName, args, userId) {
  const timestamp = admin.firestore.Timestamp.fromDate(new Date())

  switch (toolName) {
    case 'add_note': {
      const noteData = {
        title: args.title,
        content: args.content,
        type: args.type || 'note',
        category: args.category || '',
        priority: args.priority || 'medium',
        projectTags: args.projectTags || [],
        autoSaved: args.type === 'info',
        userId,
        createdAt: timestamp,
        updatedAt: timestamp
      }
      const ref = await adminDb.collection('notes').add(noteData)
      const typeLabel = { note: 'Nota', idea: 'Idea', info: 'Info', monologo: 'Monologo', musica: 'Musica' }
      const linkedTo = args.projectTags?.length ? ` → collegata a: ${args.projectTags.join(', ')}` : ''
      return { success: true, message: `${typeLabel[args.type] || 'Nota'} "${args.title}" salvata${linkedTo}`, id: ref.id }
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
      todos.push({ text: args.text, completed: false })
      await adminDb.collection('projects').doc(project.id).update({ todos, updatedAt: timestamp })
      return { success: true, message: `Todo "${args.text}" aggiunto al progetto "${project.data.name}"` }
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

      await adminDb.collection('projects').doc(project.id).update(updates)
      const changes = Object.keys(updates).filter(k => k !== 'updatedAt').join(', ')
      return { success: true, message: `Progetto "${project.data.name}" aggiornato (${changes})` }
    }

    case 'update_note': {
      const note = await findNote(args.noteTitle, userId)
      if (!note) return { success: false, message: `Nota "${args.noteTitle}" non trovata` }

      const updates = { updatedAt: timestamp }
      if (args.title) updates.title = args.title
      if (args.content) updates.content = args.content
      if (args.priority) updates.priority = args.priority

      await adminDb.collection('notes').doc(note.id).update(updates)
      return { success: true, message: `Nota "${note.data.title}" aggiornata` }
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

      await adminDb.collection('notes').doc(note.id).delete()
      return { success: true, message: `Nota "${note.data.title}" eliminata` }
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
  const nameLower = name.toLowerCase()

  // Match esatto prima
  let match = snap.docs.find(d => d.data().name.toLowerCase() === nameLower)
  // Poi match parziale
  if (!match) match = snap.docs.find(d => d.data().name.toLowerCase().includes(nameLower))
  if (!match) match = snap.docs.find(d => nameLower.includes(d.data().name.toLowerCase()))

  return match ? { id: match.id, data: match.data() } : null
}

// Helper: trova nota per titolo (fuzzy match)
async function findNote(title, userId) {
  const snap = await adminDb.collection('notes').where('userId', '==', userId).get()
  const titleLower = title.toLowerCase()

  let match = snap.docs.find(d => d.data().title.toLowerCase() === titleLower)
  if (!match) match = snap.docs.find(d => d.data().title.toLowerCase().includes(titleLower))
  if (!match) match = snap.docs.find(d => titleLower.includes(d.data().title.toLowerCase()))

  return match ? { id: match.id, data: match.data() } : null
}

// ============================================================================
// CONTESTO UTENTE
// ============================================================================
const STATUS_LABELS = {
  pending: 'Da Fare', in_progress: 'In Corso', 'in-progress': 'In Corso',
  completed: 'Completato', paused: 'In Pausa', 'on-hold': 'In Pausa'
}
const PRIORITY_LABELS = { high: 'Alta', medium: 'Media', low: 'Bassa' }

async function getUserContext(userId) {
  const [projectsSnap, notesSnap] = await Promise.all([
    adminDb.collection('projects').where('userId', '==', userId).get(),
    adminDb.collection('notes').where('userId', '==', userId).get()
  ])

  const projects = projectsSnap.docs.map(d => {
    const data = d.data()
    const todos = data.todos || []
    const sections = data.sections || []
    return {
      nome: data.name,
      tipo: data.type || 'progetto',
      descrizione: data.description,
      stato: STATUS_LABELS[data.status] || data.status,
      tags: data.tags || [],
      roadmap: data.roadmap || '',
      obiettivi: data.obiettivi || '',
      links: (data.links || []).map(l => `${l.title}: ${l.url}`).join(', '),
      sezioni: sections.length > 0 ? sections.map(s => `${s.icon || '📄'} ${s.title}: ${(s.content || '').slice(0, 100)}`).join(' | ') : '',
      todoCompletati: todos.filter(t => t.completed).length,
      todoTotali: todos.length,
      todos: todos.map(t => `${t.completed ? '[FATTO]' : '[DA FARE]'} ${t.text}`).join('\n'),
      creatoIl: data.createdAt?.toDate()?.toLocaleDateString('it-IT') || 'N/D',
      aggiornatoIl: data.updatedAt?.toDate()?.toLocaleDateString('it-IT') || 'N/D'
    }
  })

  const notes = notesSnap.docs.map(d => {
    const data = d.data()
    return {
      titolo: data.title,
      contenuto: data.content,
      tipo: data.type || 'nota',
      priorita: PRIORITY_LABELS[data.priority] || data.priority || 'Media',
      tags: data.projectTags || [],
      creatoIl: data.createdAt?.toDate()?.toLocaleDateString('it-IT') || 'N/D'
    }
  })

  const stats = {
    totaleProgetti: projects.length,
    progettiInCorso: projects.filter(p => p.stato === 'In Corso').length,
    progettiCompletati: projects.filter(p => p.stato === 'Completato').length,
    progettiDaFare: projects.filter(p => p.stato === 'Da Fare').length,
    progettiInPausa: projects.filter(p => p.stato === 'In Pausa').length,
    totaleNote: notes.length,
    noteAltaPriorita: notes.filter(n => n.priorita === 'Alta').length,
    todoTotali: projects.reduce((s, p) => s + p.todoTotali, 0),
    todoCompletati: projects.reduce((s, p) => s + p.todoCompletati, 0),
    tipiNote: {
      note: notes.filter(n => n.tipo === 'note' || n.tipo === 'nota').length,
      idee: notes.filter(n => n.tipo === 'idea').length,
      monologhi: notes.filter(n => n.tipo === 'monologo').length,
      musica: notes.filter(n => n.tipo === 'musica').length
    }
  }

  return { projects, notes, stats }
}

function formatContext(ctx) {
  let text = ''
  const s = ctx.stats
  // Count by type
  const typeCounts = {}
  ctx.projects.forEach(p => { const t = p.tipo || 'progetto'; typeCounts[t] = (typeCounts[t] || 0) + 1 })
  const typesSummary = Object.entries(typeCounts).map(([t, c]) => `${c} ${t}`).join(', ')

  text += '=== PANORAMICA RAPIDA ===\n'
  text += `Elementi: ${s.totaleProgetti} totali (${typesSummary})\n`
  text += `Per stato: ${s.progettiInCorso} in corso, ${s.progettiCompletati} completati, ${s.progettiDaFare} da fare, ${s.progettiInPausa} in pausa\n`
  if (s.totaleNote > 0) text += `Note legacy: ${s.totaleNote}\n`
  text += `Todo: ${s.todoCompletati}/${s.todoTotali} completati\n`

  if (ctx.projects.length > 0) {
    text += '\n=== DETTAGLIO ELEMENTI ===\n'
    ctx.projects.forEach((p, i) => {
      const tipo = (p.tipo || 'progetto').charAt(0).toUpperCase() + (p.tipo || 'progetto').slice(1)
      text += `\n[${tipo} ${i + 1}] "${p.nome}"\n`
      text += `  Tipo: ${p.tipo || 'progetto'} | Stato: ${p.stato} | Creato: ${p.creatoIl} | Aggiornato: ${p.aggiornatoIl}\n`
      text += `  Descrizione: ${p.descrizione}\n`
      if (p.tags.length) text += `  Tags: ${p.tags.join(', ')}\n`
      if (p.links) text += `  Links: ${p.links}\n`
      if (p.roadmap) text += `  Roadmap: ${p.roadmap}\n`
      if (p.obiettivi) text += `  Obiettivi: ${p.obiettivi}\n`
      if (p.sezioni) text += `  Sezioni: ${p.sezioni}\n`
      if (p.todoTotali > 0) {
        text += `  Progresso Todo: ${p.todoCompletati}/${p.todoTotali}\n`
        text += `  ${p.todos}\n`
      }
    })
  }

  if (ctx.notes.length > 0) {
    text += '\n=== DETTAGLIO NOTE E IDEE ===\n'
    ctx.notes.forEach((n, i) => {
      text += `\n[${n.tipo.charAt(0).toUpperCase() + n.tipo.slice(1)} ${i + 1}] "${n.titolo}"\n`
      text += `  Priorità: ${n.priorita} | Creato: ${n.creatoIl}\n`
      text += `  Contenuto: ${n.contenuto}\n`
      if (n.tags.length) text += `  Collegato a: ${n.tags.join(', ')}\n`
    })
  }

  return text
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================
// System prompt per la CHAT PRINCIPALE: solo conversazione, zero azioni
const SYSTEM_PROMPT_MAIN = `Sei **Polpo AI** 🐙, l'assistente intelligente integrato nel Gestionale Polpo.

## Chi sei
- Un assistente personale intelligente e proattivo, integrato nel gestionale
- Parli SEMPRE in italiano, in modo **naturale e conversazionale** come un amico competente
- Rispondi come farebbe ChatGPT: discuti, ragiona, proponi alternative, fai domande
- NON essere troppo formale o robotico - sii genuino, curioso e propositivo

## IL GESTIONALE
Il gestionale usa un sistema UNIFICATO: tutto è un "elemento" con un tipo.
Tipi disponibili: **progetto**, **idea**, **monologo**, **musica**, **video**, **evento**, **nota**.
Ogni elemento può avere: descrizione, status, tags, sezioni personalizzate, todo, link, deadline.

## IL TUO RUOLO IN QUESTA CHAT
Questa è la **chat principale** — conversazione E azioni.
Il tuo compito è DISCUTERE, ANALIZZARE, RAGIONARE e quando serve CREARE/MODIFICARE elementi.

### Cosa DEVI fare:
- **Discutere e ragionare** come un partner creativo
- **Analizzare criticamente**: se l'utente propone qualcosa, valuta pro e contro, fai domande
- Fare **brainstorming attivo**: proponi idee, alternative, scenari
- Suggerire **connessioni** tra progetti e idee che l'utente potrebbe non vedere
- Aiutare a scrivere testi per monologhi, canzoni, idee creative
- Pianificare strategie, roadmap e obiettivi
- Approfondire ogni argomento con curiosità e competenza

### Quando AGIRE (usare il tool propose_actions):
- Se l'utente chiede di creare un progetto, una nota, un todo → USA propose_actions
- Se l'utente dice "crea", "aggiungi", "salva", "segna", "scrivi" → USA propose_actions
- Se dalla conversazione emerge qualcosa di concreto da salvare → PROPONI l'azione
- Puoi proporre più azioni insieme (es: crea progetto + aggiungi todo + salva nota)
- Le azioni NON vengono eseguite subito: l'utente le vedrà in anteprima e potrà confermare, modificare o rifiutare

### Azioni disponibili:
- **add_note** → Nuova nota/idea/info/monologo/musica
- **add_project** → Nuovo progetto (con nome, descrizione, status, tags, roadmap, obiettivi, sezioni personalizzate)
- **add_section_to_project** → Aggiungere una sezione a un progetto esistente (materiali, design, costi, ecc.)
- **add_todo** → Nuovo task in un progetto
- **complete_todo** → Completare un task
- **update_project** → Aggiornare stato/roadmap/obiettivi/descrizione
- **update_note** → Aggiornare una nota
- **add_link_to_project** → Aggiungere un link a un progetto
- **delete_note** → Eliminare una nota

### Sezioni personalizzate nei progetti:
Quando l'utente vuole organizzare informazioni dettagliate (es: materiali, design, costi, fornitori, varianti), usa le **sezioni**.
- Per un NUOVO progetto: includi le sezioni nell'azione add_project con il campo sections[{icon, title, content}]
- Per un progetto ESISTENTE: usa add_section_to_project per aggiungere sezioni una alla volta
- Scegli icone appropriate: 🎨 Design, 🧵 Materiali, 💰 Costi, 📦 Fornitori, 📐 Specifiche, 🖼️ Varianti, ecc.

## Regole
- Usa i dati dei progetti/note dell'utente per dare risposte informate
- NON inventare dati che non hai nel contesto
- Risposte concise ma sostanziose, usa **grassetto** per i punti chiave, emoji con moderazione`

// System prompt per la MINI-CHAT del PANNELLO: azioni e organizzazione
const SYSTEM_PROMPT_PANEL = `Sei **Polpo AI** 🐙, l'assistente organizzativo del Gestionale Polpo.

## IL TUO RUOLO
Questa è la **mini-chat del pannello azioni**, dedicata a ORGANIZZARE e SALVARE.
Il tuo compito qui è proporre azioni concrete per salvare, creare e gestire dati nel gestionale.

## COME FUNZIONI
Quando vuoi creare, modificare o eliminare qualcosa, usa SEMPRE il tool **propose_actions**.
Le azioni NON vengono eseguite subito: l'utente le vedrà in anteprima e potrà CONFERMARE, MODIFICARE o RIFIUTARE ogni singola azione.

### Azioni disponibili da proporre:
- **add_note** → Nuova nota/idea/info/monologo/musica
- **add_project** → Nuovo progetto (con sezioni personalizzate: sections[{icon, title, content}])
- **add_section_to_project** → Aggiungere una sezione a progetto esistente (materiali, design, costi, ecc.)
- **add_todo** → Nuovo task in un progetto
- **complete_todo** → Completare un task
- **update_project** → Aggiornare stato/roadmap/obiettivi/descrizione
- **update_note** → Aggiornare una nota
- **add_link_to_project** → Aggiungere un link a un progetto
- **delete_note** → Eliminare una nota

## QUANDO PROPORRE azioni:
- Prezzi, costi, preventivi → add_note type "info", categoria "prezzi"
- Contatti, fornitori, servizi → add_note type "info", categoria "contatti"
- Dati tecnici, specifiche → add_note type "info", categoria "tecnico"
- Idee di business, strategie → add_note type "idea", categoria "business"
- Risorse, tool, siti utili → add_note type "info", categoria "risorse"
- Scadenze, date, appuntamenti → add_note type "info", categoria "scadenze"
- Decisioni prese → add_note type "info", categoria "decisioni"
- Nuovi progetti → add_project
- Task operativi → add_todo
- L'utente dice "aggiungi", "crea", "scrivi", "segna", "salva" → PROPONI l'azione

## COME PROPORRE:
- Titolo: chiaro e specifico
- Contenuto: tutte le info rilevanti
- ProjectTags: collega SEMPRE ai progetti pertinenti se esistono
- Proponi più azioni insieme quando ha senso
- Rispondi brevemente e vai dritto al punto

## Regole
- USA SEMPRE propose_actions (mai i tools singoli direttamente)
- Usa i nomi ESATTI dei progetti/note dal contesto
- Se non trovi un progetto/nota, chiedi all'utente di specificare
- NON inventare dati che non hai nel contesto
- Parla in italiano, risposte brevi e operative`

// ============================================================================
// ROUTES
// ============================================================================

app.post('/api/chat', verifyUser, async (req, res) => {
  try {
    const { message, history = [], source = 'main' } = req.body
    if (!message?.trim()) return res.status(400).json({ error: 'Messaggio vuoto' })

    const isPanel = source === 'panel'
    const context = await getUserContext(req.userId)
    const contextText = formatContext(context)
    const today = new Date().toLocaleDateString('it-IT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const systemPrompt = isPanel ? SYSTEM_PROMPT_PANEL : SYSTEM_PROMPT_MAIN

    const messages = [
      {
        role: 'system',
        content: [
          systemPrompt,
          `\nData di oggi: ${today}`,
          `Nome utente: ${req.userName}`,
          '',
          contextText || 'L\'utente non ha ancora progetti o note. Suggerisci di iniziare!'
        ].join('\n')
      },
      ...history.slice(-24).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ]

    // Tools propose_actions disponibili sia per la chat principale che per il pannello
    const proposeTools = TOOLS.filter(t => t.function.name === 'propose_actions')

    const completionOpts = {
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: isPanel ? 1024 : 2048
    }
    completionOpts.tools = proposeTools
    completionOpts.tool_choice = 'auto'

    const completion = await groq.chat.completions.create(completionOpts)

    const responseMsg = completion.choices[0]?.message
    let proposedActions = []

    // Se l'AI ha usato propose_actions, estrai le azioni proposte
    if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
      messages.push(responseMsg)

      for (const toolCall of responseMsg.tool_calls) {
        if (toolCall.function.name === 'propose_actions') {
          let toolArgs
          try {
            toolArgs = JSON.parse(toolCall.function.arguments)
          } catch {
            toolArgs = { actions: [] }
          }
          proposedActions = toolArgs.actions || []
          console.log(`📋 Proposte ${proposedActions.length} azioni:`, proposedActions.map(a => a.label))
        }

        // Rispondi al tool call dicendo che le azioni sono in attesa
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify({ status: 'proposed', message: 'Azioni proposte all\'utente, in attesa di conferma' })
        })
      }

      // Seconda chiamata per la risposta testuale
      const followUp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 1024
      })

      const reply = followUp.choices[0]?.message?.content || 'Ecco le azioni proposte.'

      return res.json({
        reply,
        proposedActions,
        stats: {
          progetti: context.stats.totaleProgetti,
          note: context.stats.totaleNote,
          todoCompletati: context.stats.todoCompletati,
          todoTotali: context.stats.todoTotali
        }
      })
    }

    // Nessun tool usato - risposta semplice
    const reply = responseMsg.content || 'Non sono riuscito a elaborare una risposta.'

    res.json({
      reply,
      proposedActions: [],
      stats: {
        progetti: context.stats.totaleProgetti,
        note: context.stats.totaleNote,
        todoCompletati: context.stats.todoCompletati,
        todoTotali: context.stats.todoTotali
      }
    })
  } catch (err) {
    console.error('Errore chat AI:', err.message)
    if (err.status === 429 || err.message?.includes('rate_limit')) {
      return res.status(429).json({ error: 'Limite richieste raggiunto. Riprova tra qualche secondo.' })
    }
    if (err.status === 401 || err.message?.includes('api_key')) {
      return res.status(500).json({ error: 'Errore configurazione API. Controlla la chiave Groq.' })
    }
    res.status(500).json({ error: 'Errore nella generazione della risposta. Riprova.' })
  }
})

// Esegue le azioni confermate dall'utente
app.post('/api/chat/execute', verifyUser, async (req, res) => {
  try {
    const { actions = [] } = req.body
    if (!actions.length) return res.status(400).json({ error: 'Nessuna azione da eseguire' })

    const results = []
    for (const action of actions) {
      console.log(`✅ Confermata: ${action.tool}`, action.args)
      const result = await executeTool(action.tool, action.args, req.userId)
      results.push({ tool: action.tool, label: action.label, result })
    }

    const context = await getUserContext(req.userId)

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
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Genera un titolo breve (max 5 parole, in italiano) che riassuma questa conversazione. Rispondi SOLO con il titolo.' },
        { role: 'user', content: firstExchange }
      ],
      temperature: 0.3,
      max_tokens: 30
    })
    const title = completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') || 'Conversazione'
    res.json({ title })
  } catch (err) {
    res.json({ title: 'Conversazione' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Polpo AI', version: '2.1.0', uptime: Math.floor(process.uptime()) })
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

// Run deadline check every hour
setInterval(checkAndNotifyDeadlines, 60 * 60 * 1000)
// And once at startup (after 30s to let things initialize)
setTimeout(checkAndNotifyDeadlines, 30000)

const PORT = process.env.PORT || 5032
app.listen(PORT, () => {
  console.log(`🐙 Polpo AI v2.1 avviato su porta ${PORT}`)
  console.log(`   Tools disponibili: ${TOOLS.map(t => t.function.name).join(', ')}`)
  console.log(`   Health check: http://localhost:${PORT}/api/health`)
  console.log(`   Push notifications: ${VAPID_PRIVATE ? '✅ attive' : '❌ disabilitate (manca VAPID_PRIVATE_KEY)'}`)
})
