#!/usr/bin/env node
/**
 * SINCRONIZZA I PROGETTI NEL GESTIONALE
 *
 *   node backend/sincronizza.js --prova         mostra cosa farebbe, non scrive
 *   node backend/sincronizza.js                 applica
 *   node backend/sincronizza.js --se-cambiato   applica solo se vault o scansione sono cambiati
 *                                               dall'ultimo giro (lo lancia il sync del vault
 *                                               ogni 10 minuti: PLANCIA/vault-sync/sync-vault.ps1)
 *
 * Unisce le due fonti che descrivono i progetti di Paolo e le riversa in
 * Firestore, cosi' che il gestionale li conosca tutti:
 *
 *   vault Obsidian (20-Projects/*.md)  il perche': visione, roadmap, decisioni
 *   scan-condiviso.json (scanner di PLANCIA)  il cosa: linguaggi, git, righe, TODO
 *
 * Perche' non bastava quello che c'era gia':
 *   - `dietroiprogetti/carica-gestionale.js` aggiorna solo il campo `scan` e
 *     "non crea mai progetti nuovi". Con 5 progetti sul gestionale non aveva
 *     nulla da arricchire. Inoltre abbinava per nome, che sbaglia spesso.
 *   - `VaultImport` nell'app legge solo nome file e prima riga: butta via
 *     frontmatter, codePath, stack e roadmap.
 * Qui l'abbinamento passa da `codePath`, che e' una chiave esatta.
 *
 * SI PUO' RILANCIARE QUANDO SI VUOLE. E' la ragione per cui esiste:
 *   - non duplica mai (riconosce per vaultNote, cartella, poi nome)
 *   - non tocca cio' che decidi nell'app: pinned, archived, deadline, sveglie,
 *     e le cose da fare che aggiungi a mano
 *   - le spunte non tornano mai indietro: una voce risulta fatta se lo e' nel
 *     vault OPPURE nell'app
 *   - scrive solo i documenti che cambiano davvero, e solo i campi cambiati.
 *     Fino al 24/10 riscriveva tutti e 94 i documenti a ogni giro con un
 *     updatedAt nuovo: "aggiornato X fa" diceva solo quando era girato il sync,
 *     ogni dispositivo riscaricava ~670 kB, e lanciarlo ogni 10 minuti sarebbe
 *     costato ~13.500 scritture al giorno (la quota gratuita e' 20.000)
 *
 * Chi possiede quali campi:
 *   - elementi del vault: nome, descrizione, stato, tag, obiettivi, roadmap,
 *     sezioni, il link "Online" e le voci di roadmap li decide il vault (l'app
 *     li mostra in sola lettura, vedi src/lib/vaultCampi.js)
 *   - elementi solo-codice: il sync aggiorna i dati del codice (scan); nome,
 *     stato e sezioni si scrivono alla nascita e poi li decidi nell'app
 */

import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ---------------------------------------------------------------- posizioni

const QUI = path.dirname(fileURLToPath(import.meta.url))
const VAULT_ROOT = 'C:/Users/paolo/Documents/Vault'
const VAULT = VAULT_ROOT + '/20-Projects'
const ARCHIVIO = VAULT_ROOT + '/50-Archive'
// Lo scanner vive dentro PLANCIA dal 2026-09-28 (prima era il progetto a sé dietroiprogetti)
const SCAN = 'C:/Users/paolo/Desktop/Progetti Codice/PLANCIA/scanner/scan-condiviso.json'
const SERVICE_ACCOUNT = path.join(QUI, 'serviceAccount.json')
const EMAIL = 'paoloandrearepetto@gmail.com'

const PROVA = process.argv.includes('--prova')
const SE_CAMBIATO = process.argv.includes('--se-cambiato')
// Impronta dell'ultimo giro riuscito, accanto allo stato del sync del vault
const STATO = path.join(process.env.LOCALAPPDATA || QUI, 'vault-sync', 'gestionale.json')

// ---------------------------------------------------------------- utilita'

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

// "2026-08-30 (sessione 14)" -> "2026-08-30"; tutto il resto -> ''
const dataDa = (v) => (/^\d{4}-\d{2}-\d{2}/.exec(String(v || '')) || [''])[0]

// Confronto che non dipende dall'ordine delle chiavi: Firestore non lo conserva
const stabile = (v) => JSON.stringify(v ?? null, (_, x) => (x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]]))
  : x))

// La data della scansione cambia a ogni giro dello scanner anche quando il resto e' identico
const senzaData = (scan) => { const { aggiornatoIl: _data, ...resto } = scan || {}; return resto }

// Vault (tutte le note, anche le note-catalogo) e scansione: nome, dimensione, data di modifica.
// Basta stat, niente letture: con ~400 note costa pochi millisecondi.
function impronta() {
  const h = crypto.createHash('sha1')
  const salta = new Set(['.obsidian', '.git', '.trash', 'node_modules'])
  const cammina = (dir) => {
    let voci = []
    try { voci = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const v of voci.sort((a, b) => a.name.localeCompare(b.name))) {
      if (salta.has(v.name)) continue
      const p = path.join(dir, v.name)
      if (v.isDirectory()) cammina(p)
      else if (v.name.endsWith('.md')) {
        const s = fs.statSync(p)
        h.update(`${p}|${s.size}|${s.mtimeMs}\n`)
      }
    }
  }
  cammina(VAULT_ROOT)
  if (fs.existsSync(SCAN)) { const s = fs.statSync(SCAN); h.update(`scan|${s.size}|${s.mtimeMs}`) }
  return h.digest('hex')
}
const leggiStato = () => { try { return JSON.parse(fs.readFileSync(STATO, 'utf8')) } catch { return {} } }
const scriviStato = (dati) => {
  try { fs.mkdirSync(path.dirname(STATO), { recursive: true }); fs.writeFileSync(STATO, JSON.stringify(dati, null, 2)) } catch { /* solo un promemoria */ }
}

// Da un codePath alla cartella che lo scanner conosce davvero.
//
// Prendere l'ultimo pezzo del percorso non basta, e sbagliava in tre note su
// trentacinque: `polpo/gestionale-x` e `basex/xwp` sono annidate (lo scanner
// guarda solo il primo livello), mentre Ephemera punta direttamente a un file,
// `ephemera-brand/ephemera-gestionale.html`. In tutti e tre i casi la cartella
// giusta e' piu' in alto, quindi si risale finche' se ne trova una scansionata.
const RADICE = 'progetticodice'

// I pezzi del percorso sotto "Progetti Codice", dal piu' profondo alla radice
const pezziDi = (codePath) => {
  if (!codePath || codePath === 'null') return []
  const p = codePath.replace(/\\/g, '/').replace(/\/+$/, '').split('/').filter(Boolean)
  const i = p.findIndex(x => norm(x) === RADICE)
  return (i === -1 ? p : p.slice(i + 1)).reverse()
}

// Prima passata: la cartella e' scansionata cosi' com'e' scritta?
const cartellaDiretta = (codePath, note) => {
  const p = pezziDi(codePath)
  return p.length && note.has(norm(p[0])) ? p[0] : ''
}

// Seconda passata, solo per chi non ha trovato niente: si risale.
//
// Serve per tre note su trentacinque: `polpo/gestionale-x` e `basex/xwp` sono
// annidate (lo scanner guarda solo il primo livello) ed Ephemera punta dritto a
// un file, `ephemera-brand/ephemera-gestionale.html`.
//
// Ma non si eredita da una cartella che un'altra nota rivendica gia' come
// propria: `X World` sta dentro `basex`, che e' un progetto a se' con la sua
// nota, e prendersi le sue statistiche direbbe che X World ha tutte le righe
// del padre. Meglio nessun dato che un dato falso.
const cartellaRisalendo = (codePath, note, rivendicate) => {
  const p = pezziDi(codePath)
  for (const pezzo of p) {
    if (note.has(norm(pezzo)) && !rivendicate.has(norm(pezzo))) return pezzo
  }
  return p.length ? p[0] : ''   // si tiene comunque il riferimento dichiarato
}

// Copie e cartelle di riferimento: entrano, ma gia' archiviate, altrimenti
// l'elenco principale si riempie di doppioni. CLAUDE.md dice esplicitamente
// che DeasyD-reference e' una copia datata su cui non si sviluppa.
// Anche le cartelle che iniziano con "_": `_archivio` e' dove si mettono via le cose vecchie.
const E_UNA_COPIA = (nome) => / - Copia$| copia$|-reference$|-backup$|^old-|_old$|^_/i.test(nome)

// vault: active/paused/idea/... -> gestionale: pending/in_progress/completed/paused
const STATO_VAULT = {
  active: 'in_progress',
  refactoring: 'in_progress',
  'roadmap-v2': 'in_progress',
  paused: 'paused',
  archived: 'completed',
  idea: 'pending',
  concept: 'pending',
  design: 'pending',
}
// scanner: attivo/fermo/dormiente
const STATO_SCAN = { attivo: 'in_progress', fermo: 'paused', dormiente: 'pending' }

const ICONE = {
  'Visione': '🎯', 'Stack': '🧱', 'Stack tecnico': '🧱', 'Roadmap': '📍',
  'Decisioni recenti': '⚖️', 'File chiave': '📂', 'Note tecniche': '🔧',
  'Funzionalità': '✨', 'Stato attuale': '📊', 'Come va online': '🚀',
  'Struttura': '🗂️', "Cos'è": '💡', 'Definizione': '💡', 'Concept': '💡',
  'Link': '🔗', 'Prossimi passi': '📍',
}

// Sezioni che diventano altri campi, quindi non vanno anche fra le sezioni
const NON_SEZIONI = new Set(['Visione', 'Roadmap', 'Prossimi passi'])

// ---------------------------------------------------------------- lettura vault

function leggiFrontmatter(testo) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(testo)
  if (!m) return {}
  const out = {}
  for (const riga of m[1].split(/\r?\n/)) {
    const c = /^([a-zA-Z_]+):\s*(.*)$/.exec(riga)
    if (!c) continue
    let v = c[2].trim().replace(/^["']|["']$/g, '')
    if (v.startsWith('[') && v.endsWith(']')) {
      v = v.slice(1, -1).split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean)
    }
    out[c[1]] = v
  }
  return out
}

// Spezza il corpo della nota in sezioni di primo livello (## Titolo)
function leggiSezioni(testo) {
  const corpo = testo.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
  const out = []
  const re = /^## (.+)$/gm
  let m, precedente = null
  while ((m = re.exec(corpo)) !== null) {
    if (precedente) precedente.contenuto = corpo.slice(precedente.da, m.index).trim()
    precedente = { titolo: m[1].trim(), da: m.index + m[0].length }
    out.push(precedente)
  }
  if (precedente) precedente.contenuto = corpo.slice(precedente.da).trim()
  return out.map(s => ({ titolo: s.titolo, contenuto: s.contenuto || '' }))
}

// Markdown -> testo semplice.
//
// Le righe della roadmap sono scritte per Obsidian: grassetti, backtick, wikilink.
// Nell'elenco delle cose da fare comparivano con gli asterischi e i backtick a vista.
// La chiave di riconoscimento non cambia (norm() toglie gia' tutto cio' che non e'
// lettera o cifra), quindi ripulire il testo non spezza la fusione.
const testoSemplice = (s) => String(s || '')
  .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')   // [[nota|come si legge]]
  .replace(/\[\[([^\]]+)\]\]/g, '$1')               // [[nota]]
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')           // [testo](url)
  .replace(/`{1,3}/g, '')
  .replace(/\*\*|__/g, '')
  .replace(/\s+/g, ' ')
  .trim()

// Caselle `- [ ]` / `- [x]`, comprese le righe di continuazione indentate
function leggiCaselle(testo) {
  const righe = testo.split(/\r?\n/)
  const out = []
  for (let i = 0; i < righe.length; i++) {
    const m = /^\s*- \[([ xX])\]\s+(.*)$/.exec(righe[i])
    if (!m) continue
    let testoVoce = m[2].trim()
    // le righe successive piu' indentate e non-elenco appartengono alla stessa voce
    while (i + 1 < righe.length && /^\s{4,}\S/.test(righe[i + 1]) && !/^\s*- \[/.test(righe[i + 1])) {
      testoVoce += ' ' + righe[++i].trim()
    }
    out.push({ testo: testoSemplice(testoVoce), fatta: m[1].toLowerCase() === 'x' })
  }
  return out
}

// Primo paragrafo utile: serve da descrizione breve
function primoParagrafo(testo, max = 300) {
  for (const blocco of testo.split(/\r?\n\r?\n/)) {
    const t = blocco.trim()
    if (!t || t.startsWith('#') || t.startsWith('>') || t.startsWith('- ') || t.startsWith('|')) continue
    const pulito = t.replace(/\r?\n/g, ' ').replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1').replace(/[*`]/g, '')
    return pulito.length > max ? pulito.slice(0, max) + '…' : pulito
  }
  return ''
}

// Legge le note progetto da `20-Projects` e da `50-Archive`.
//
// L'archivio ha lo stesso formato — frontmatter con `codePath`, sezioni, roadmap —
// solo con `status: archived`. Ignorarlo lasciava fuori progetti veri (rpg,
// dnd-companion) che finivano nel gestionale come schede nude dello scanner,
// mentre il vault li documentava per bene.
//
// Se un nome compare in entrambe le cartelle vince quella attiva: Skylab ha una
// nota in 20-Projects e una in 50-Archive, ed e' stato riattivato.
function leggiVault(cartelleNote) {
  const cartelle = [
    { dir: VAULT, archivio: false },
    { dir: ARCHIVIO, archivio: true },
  ].filter(c => fs.existsSync(c.dir))

  const visti = new Set()
  const note = cartelle.flatMap(({ dir, archivio }) => fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_'))
    .filter(f => { const k = norm(f); if (visti.has(k)) return false; visti.add(k); return true })
    // Fuori solo chi si dichiara qualcos'altro: in 50-Archive vive "Eventi
    // passati" (type: archive-index), che e' un catalogo, e fra i doc di DeasyD
    // ci sono note di tipo `doc` e `vision`. Chi non dichiara niente resta dentro:
    // tre note vere non avevano il campo, e scartarle sarebbe stato peggio.
    .filter(f => {
      const m = /^type:\s*(\S+)/m.exec(fs.readFileSync(path.join(dir, f), 'utf8'))
      return !m || m[1] === 'project'
    })
    .map(f => {
      const testo = fs.readFileSync(path.join(dir, f), 'utf8')
      const daArchivio = archivio
      const fm = leggiFrontmatter(testo)
      const sezioni = leggiSezioni(testo)
      const trova = (t) => sezioni.find(s => s.titolo === t)
      const visione = trova('Visione') || trova("Cos'è") || trova('Definizione') || trova('Concept')
      const roadmap = trova('Roadmap') || trova('Prossimi passi')
      return {
        fonte: 'vault',
        cartellaVault: daArchivio ? '50-Archive' : '20-Projects',
        // Se il vault dichiara un progetto archiviato, quello e' l'ultimo verdetto:
        // e' l'unico caso in cui la sincronizzazione tocca un campo dell'app.
        archiviatoDalVault: daArchivio || fm.status === 'archived',
        nomeNota: f.replace(/\.md$/, ''),
        frontmatter: fm,
        codePath: fm.codePath || '',
        cartella: '',
        visione: visione ? visione.contenuto : '',
        descrizione: primoParagrafo(visione ? visione.contenuto : testo),
        roadmapTesto: roadmap ? roadmap.contenuto : '',
        caselle: leggiCaselle(testo),
        sezioni: sezioni.filter(s => !NON_SEZIONI.has(s.titolo) && s.contenuto),
      }
    }))

  // Prima chi punta dritto a una cartella scansionata: quelle sono sue.
  note.forEach(v => { v.cartella = cartellaDiretta(v.codePath, cartelleNote) })
  const rivendicate = new Set(note.filter(v => v.cartella).map(v => norm(v.cartella)))
  // Poi chi non ha trovato niente prova a risalire, senza rubare a nessuno.
  note.forEach(v => {
    if (!v.cartella) v.cartella = cartellaRisalendo(v.codePath, cartelleNote, rivendicate)
  })
  return note
}

// ---------------------------------------------------------------- note-catalogo

// Non tutti i progetti meritano una nota propria, e il vault lo sa gia': in
// `40-Resources/Esperimenti.md` e in `50-Archive/Eventi passati.md` decine di
// cartelle sono catalogate a elenco puntato, con una riga di descrizione a testa.
//
// Quelle righe sono la miglior descrizione che esista di quelle cartelle — scritta
// da Paolo — ma senza `codePath` nessuno le collegava al codice: nel gestionale
// comparivano schede nude, mentre il vault sapeva benissimo cosa fossero.
//
// Qui si legge quel formato, che e' gia' il suo:  - **nome-cartella** — descrizione
function leggiCataloghi(cartelleNote) {
  const trovate = new Map()
  const salta = new Set(['node_modules', '.git', '.obsidian', '.trash'])

  const cammina = (dir) => {
    let voci = []
    try { voci = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const v of voci) {
      if (v.name.startsWith('.') || salta.has(v.name)) continue
      const p = path.join(dir, v.name)
      if (v.isDirectory()) { cammina(p); continue }
      if (!v.name.endsWith('.md')) continue

      const rel = path.relative(VAULT_ROOT, p).split(path.sep).join('/')
      // la nota di triage elenca tutto per definizione: non e' una descrizione
      if (rel.startsWith('00-Inbox/') && /Cartelle senza nota/.test(rel)) continue

      let testo = ''
      try { testo = fs.readFileSync(p, 'utf8') } catch { continue }
      const righe = testo.split(/\r?\n/)
      for (let i = 0; i < righe.length; i++) {
        // due formati, entrambi gia' usati nel vault:
        //   - **nome-cartella** — descrizione            (Esperimenti)
        //   | `nome-cartella/` | descrizione | data |    (Eventi passati)
        const m = /^\s*-\s+\*\*([^*]+)\*\*\s*[—–-]\s*(.*)$/.exec(righe[i])
          || /^\s*\|\s*`([^`]+?)\/?`\s*\|\s*([^|]+?)\s*\|/.exec(righe[i])
        if (!m) continue
        const nome = m[1].trim()
        if (!cartelleNote.has(norm(nome))) continue
        let desc = m[2].trim()
        // righe di continuazione indentate
        while (i + 1 < righe.length && /^\s{2,}\S/.test(righe[i + 1]) && !/^\s*-\s/.test(righe[i + 1])) {
          desc += ' ' + righe[++i].trim()
        }
        // la prima nota che la nomina vince: le altre di solito la citano di sfuggita
        if (!trovate.has(norm(nome))) {
          trovate.set(norm(nome), {
            descrizione: desc.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1').replace(/\*\*/g, ''),
            nota: path.basename(rel, '.md'),
            percorso: rel,
          })
        }
      }
    }
  }

  cammina(VAULT_ROOT)
  return trovate
}

// ---------------------------------------------------------------- lettura scanner

function leggiScan() {
  if (!fs.existsSync(SCAN)) {
    console.log('  ! scan-condiviso.json non trovato: procedo senza i dati del codice')
    return { generatoIl: null, progetti: [] }
  }
  const scan = JSON.parse(fs.readFileSync(SCAN, 'utf8'))
  // Una scansione di una cartella sola (il 22/10: le 14 sottocartelle di un progetto) avrebbe
  // creato "client", "engine", "server"... come progetti. Meglio fermarsi che scrivere dati falsi.
  // Le scansioni nuove dichiarano la radice; per quelle vecchie basta il numero di cartelle.
  const valida = scan.radice ? scan.radice === 'Progetti Codice' : (scan.progetti || []).length >= 30
  if (!valida) {
    console.error(`\n  La scansione non e' di tutta Progetti Codice (${(scan.progetti || []).length} cartelle).`
      + '\n  Rilanciala: cd PLANCIA/scanner && node scan.js --no-open\n')
    process.exit(2)
  }
  return scan
}

// ---------------------------------------------------------------- fusione

function sezioniGestionale(sezioni) {
  return sezioni.map((s, i) => ({
    id: `vault-${norm(s.titolo)}-${i}`,
    icon: ICONE[s.titolo] || '📄',
    title: s.titolo,
    // 8.000 caratteri tagliavano proprio "Decisioni recenti", che e' la sezione
    // piu' utile. Il documento piu' pesante resta sotto i 60 kB contro il limite
    // di 1 MiB di Firestore, quindi c'e' spazio.
    content: s.contenuto.length > 20000 ? s.contenuto.slice(0, 20000) + '\n\n…(continua nel vault)' : s.contenuto,
  }))
}

// Le cose da fare del vault si fondono con quelle gia' presenti.
//
// Tre regole, in ordine di importanza:
//  - le voci scritte a mano nell'app non si toccano mai;
//  - una spunta non torna mai indietro: vale se e' fatta nel vault OPPURE qui;
//  - una voce che veniva dal vault e li' non c'e' piu', se non e' ancora fatta,
//    sparisce. Senza questa regola correggere il testo di una riga della
//    roadmap lasciava due voci: la vecchia e la nuova, per sempre.
function fondiTodos(esistenti, caselle, dalVault) {
  const chiaviVault = new Set(caselle.map(c => norm(c.testo)).filter(Boolean))

  const sopravvive = (t) => {
    if (!dalVault) return true          // schede fatte solo di dati del codice
    if (!t.daVault) return true         // scritta a mano nell'app
    if (t.completed) return true        // gia' fatta: resta come storia
    return chiaviVault.has(norm(t.text))
  }

  const tenute = (esistenti || []).filter(sopravvive)
  const rimosse = (esistenti || []).length - tenute.length
  const out = tenute.map(t => ({ ...t }))
  const indice = new Map(out.map((t, i) => [norm(t.text), i]))
  let nuove = 0

  for (const c of caselle) {
    const chiave = norm(c.testo)
    if (!chiave) continue
    const i = indice.get(chiave)
    if (i === undefined) {
      out.push({ text: c.testo, completed: c.fatta, daVault: true })
      indice.set(chiave, out.length - 1)
      nuove++
    } else {
      // stessa voce: si aggiorna il testo (puo' essere stato riscritto nel vault)
      // e la spunta puo' solo andare avanti, mai tornare indietro
      out[i].text = c.testo
      out[i].daVault = true
      if (c.fatta) out[i].completed = true
    }
  }
  return { todos: out, nuove, rimosse }
}

function costruisci(voce, datiScan, esistente, catalogo) {
  const fm = voce.frontmatter || {}
  const tags = new Set()
  if (Array.isArray(fm.tags)) fm.tags.forEach(t => tags.add(String(t).replace(/^#/, '')))
  else if (typeof fm.tags === 'string' && fm.tags) tags.add(fm.tags.replace(/^#/, ''))
  // Nemmeno il nome della cartella e' un tag: era li' per farla trovare dalla
  // ricerca, ma 63 nomi di cartella facevano 63 tag usati una volta sola. Ora la
  // ricerca guarda direttamente il campo `cartella`.
  // I linguaggi NON diventano tag: aggiungendoli, la nuvola era passata a 142 voci
  // con l'85% usate una volta sola, e "HTML" su 44 progetti non aiuta a trovare
  // niente. Restano in `scan.linguaggi`, che l'interfaccia mostra gia' a parte.

  const stato = voce.fonte === 'vault'
    ? (STATO_VAULT[fm.status] || 'pending')
    : (STATO_SCAN[datiScan && datiScan.stato] || 'pending')

  // L'indirizzo online lo possiede il vault (`liveUrl:` nel frontmatter), quindi va
  // riallineato a ogni giro. Ma i link aggiunti a mano nell'app non si toccano:
  // sostituisco solo la voce "Online", lascio tutto il resto dov'e'.
  const fondiLinks = (vecchi) => {
    const altri = (vecchi || []).filter((l) => l && l.title !== 'Online')
    return fm.liveUrl ? [{ title: 'Online', url: fm.liveUrl }, ...altri] : altri
  }

  const { todos, nuove, rimosse } = fondiTodos(
    esistente && esistente.todos, voce.caselle || [], voce.fonte === 'vault')

  // Solo campi derivati dalle fonti: quello che decidi nell'app non compare qui
  const campi = {
    name: voce.nomeNota || voce.cartella,
    type: 'progetto',
    description: (catalogo && catalogo.descrizione) || voce.descrizione || '',
    status: stato,
    tags: [...tags],
    obiettivi: voce.visione || '',
    roadmap: voce.roadmapTesto || '',
    todos,
    links: fondiLinks(esistente && esistente.links),
    sections: sezioniGestionale(voce.sezioni || []),
    vaultNote: voce.nomeNota || '',
    // Percorso completo della nota: il collegamento a Obsidian dava per scontato
    // `20-Projects/`, e per le note-catalogo in `40-Resources/` sarebbe rotto.
    vaultPath: voce.nomeNota
      ? `${voce.cartellaVault || '20-Projects'}/${voce.nomeNota}.md`
      : (catalogo ? catalogo.percorso : ''),
    // Quale nota del vault racconta questa cartella, quando non ne ha una propria
    vaultCatalogo: catalogo ? catalogo.nota : '',
    cartella: voce.cartella || '',
    fonte: voce.fonte,
    // Quando hai toccato la nota l'ultima volta (`lastUpdated:`): e' il segno piu' fedele di
    // "su cosa stai lavorando", e Oggi lo usa quando non c'e' niente in primo piano
    vaultAggiornato: dataDa(fm.lastUpdated),
  }
  if (datiScan) {
    // __generatoIl e' un appoggio interno: va tolto, altrimenti finisce nel
    // documento e ci resta per sempre.
    const { __generatoIl, ...soloDati } = datiScan
    campi.scan = { ...soloDati, aggiornatoIl: __generatoIl || null }
  }
  return { campi, nuoveTodo: nuove, todoRimosse: rimosse }
}

// Per un elemento che esiste gia', cosa puo' cambiare il sync.
// Vault: tutto quello che costruisci() ricava. Solo codice: i dati del codice e i riferimenti;
// nome, stato e sezioni restano quelli che hai deciso nell'app (prima li azzerava a ogni giro,
// sezioni scritte a mano comprese). La descrizione si aggiorna solo se la scrive il vault
// in una nota-catalogo.
const SOLO_CODICE = ['scan', 'cartella', 'fonte', 'vaultCatalogo', 'vaultPath']
function aggiornabili(voce, campi, catalogo) {
  if (voce.fonte === 'vault') return campi
  const out = {}
  for (const k of SOLO_CODICE) if (k in campi) out[k] = campi[k]
  if (catalogo && catalogo.descrizione) out.description = campi.description
  return out
}

// Solo i campi diversi da quelli salvati (lo scan senza la sua data)
function differenze(campi, esistente) {
  const out = {}
  for (const [k, v] of Object.entries(campi)) {
    const prima = esistente[k]
    const uguale = k === 'scan'
      ? stabile(senzaData(v)) === stabile(senzaData(prima))
      : stabile(v) === stabile(prima)
    if (!uguale) out[k] = v
  }
  return out
}

// ---------------------------------------------------------------- principale

async function main() {
  // Il giro automatico parte ogni 10 minuti: se niente e' cambiato non apre nemmeno Firestore
  const improntaOra = impronta()
  if (SE_CAMBIATO && !PROVA && leggiStato().impronta === improntaOra) {
    console.log('  invariato: vault e scansione come all\'ultimo giro')
    process.exit(0)
  }

  console.log('\n  ── Sincronizzazione progetti ──' + (PROVA ? '  (PROVA: non scrivo nulla)' : ''))

  if (!fs.existsSync(SERVICE_ACCOUNT)) {
    console.error('\n  Manca backend/serviceAccount.json: senza non posso scrivere su Firestore.\n')
    process.exit(1)
  }
  // Caricato qui e non in cima: il controllo dell'impronta resta istantaneo
  const { default: admin } = await import('firebase-admin')
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync(SERVICE_ACCOUNT, 'utf8'))),
  })
  const db = admin.firestore()
  const utente = await admin.auth().getUserByEmail(EMAIL)
  const uid = utente.uid

  // ---- fonti (prima lo scanner: al vault serve sapere quali cartelle esistono)
  const scan = leggiScan()
  const perCartella = new Map()
  for (const p of scan.progetti) {
    perCartella.set(norm(p.nome), { ...p, __generatoIl: scan.generatoIl })
  }
  const vault = leggiVault(new Set(perCartella.keys()))
  const cataloghi = leggiCataloghi(new Set(perCartella.keys()))
  console.log(`  cartelle descritte in una nota-catalogo: ${cataloghi.size}`)
  console.log(`  vault: ${vault.length} note   scanner: ${scan.progetti.length} cartelle`)
  if (scan.generatoIl) {
    const giorni = Math.floor((Date.now() - new Date(scan.generatoIl)) / 86400000)
    console.log(`  scansione di ${giorni} giorni fa` + (giorni > 7 ? '  (conviene rilanciarla)' : ''))
  }

  // ---- le cartelle senza nota nel vault entrano come schede leggere
  const cartelleDelVault = new Set(vault.filter(v => v.cartella).map(v => norm(v.cartella)))
  const soloCodice = scan.progetti
    .filter(p => !cartelleDelVault.has(norm(p.nome)))
    .map(p => ({
      fonte: 'scanner',
      nomeNota: '',
      frontmatter: {},
      cartella: p.nome,
      visione: '',
      descrizione: p.descrizione || '',
      roadmapTesto: '',
      caselle: [],
      sezioni: [],
    }))
  console.log(`  da importare: ${vault.length} dal vault + ${soloCodice.length} solo codice`)

  // ---- cosa c'e' gia'
  const snap = await db.collection('projects').where('userId', '==', uid).get()
  const esistenti = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  const perNome = new Map()
  const doppi = new Set()
  for (const e of esistenti) {
    const k = norm(e.name)
    if (perNome.has(k)) doppi.add(k)
    perNome.set(k, e)
  }
  const perVaultNote = new Map(esistenti.filter(e => e.vaultNote).map(e => [norm(e.vaultNote), e]))
  const perCartellaEsistente = new Map(esistenti.filter(e => e.cartella).map(e => [norm(e.cartella), e]))
  console.log(`  gia' sul gestionale: ${esistenti.length}`)

  const trovaEsistente = (voce) => {
    if (voce.nomeNota && perVaultNote.has(norm(voce.nomeNota))) return perVaultNote.get(norm(voce.nomeNota))
    if (voce.cartella && perCartellaEsistente.has(norm(voce.cartella))) return perCartellaEsistente.get(norm(voce.cartella))
    const k = norm(voce.nomeNota || voce.cartella)
    // un nome ambiguo non basta a decidere: meglio creare che sovrascrivere l'altro
    if (perNome.has(k) && !doppi.has(k)) return perNome.get(k)
    return null
  }

  // ---- giro
  let creati = 0, aggiornati = 0, invariati = 0, todoNuove = 0, todoTolte = 0
  const nuoviNomi = []
  const adesso = () => admin.firestore.Timestamp.fromDate(new Date())

  // Cosa scrivere su un elemento esistente: solo le differenze. updatedAt si muove solo se cambia
  // qualcosa che si vede (non per i soli dati del codice), cosi' "aggiornato X fa" torna a dire il vero.
  const patchPer = (voce, datiScan, esistente, catalogo) => {
    const { campi, nuoveTodo, todoRimosse } = costruisci(voce, datiScan, esistente, catalogo)
    const patch = differenze(aggiornabili(voce, campi, catalogo), esistente)
    // unico campo dell'app che la sincronizzazione puo' imporre, e solo per
    // dirlo archiviato: il vault e' la fonte di verita' sullo stato
    if (voce.archiviatoDalVault && !esistente.archived) patch.archived = true
    return { patch, nome: campi.name, nuoveTodo, todoRimosse }
  }

  // Un documento appartiene a una voce sola. Il vault viene prima: se una cartella dello scanner
  // porta lo stesso nome di una nota (Freak, Musica Libera) non le ruba la scheda. Prima se la
  // riscrivevano a turno a ogni giro, nota e cartella.
  const presi = new Set()

  for (const voce of [...vault, ...soloCodice]) {
    const datiScan = voce.cartella ? perCartella.get(norm(voce.cartella)) : null
    const esistente = trovaEsistente(voce)
    const catalogo = voce.cartella ? cataloghi.get(norm(voce.cartella)) : null
    if (esistente && presi.has(esistente.id)) continue
    if (esistente) presi.add(esistente.id)

    if (esistente) {
      const prova = patchPer(voce, datiScan, esistente, catalogo)
      const chiavi = Object.keys(prova.patch)
      if (!chiavi.length) { invariati++; continue }
      if (!PROVA) {
        // In transazione: se intanto hai spuntato qualcosa dal telefono, si rifà il conto
        // sul documento fresco invece di riscrivere la lista vecchia sopra la tua spunta
        const ref = db.collection('projects').doc(esistente.id)
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(ref)
          if (!snap.exists) return
          const { patch } = patchPer(voce, datiScan, { id: snap.id, ...snap.data() }, catalogo)
          if (!Object.keys(patch).length) return
          const visibile = Object.keys(patch).some(k => k !== 'scan')
          tx.update(ref, { ...patch, sincronizzatoIl: new Date().toISOString(), ...(visibile ? { updatedAt: adesso() } : {}) })
        })
      }
      aggiornati++
      todoNuove += prova.nuoveTodo
      todoTolte += prova.todoRimosse
      const parti = chiavi.filter(k => k !== 'todos')
      if (prova.nuoveTodo) parti.push(`+${prova.nuoveTodo} da fare`)
      if (prova.todoRimosse) parti.push(`-${prova.todoRimosse} da fare`)
      if (chiavi.includes('todos') && !prova.nuoveTodo && !prova.todoRimosse) parti.push('spunte')
      console.log(`  ~ ${prova.nome}  (${parti.join(', ')})`)
    } else {
      const { campi, nuoveTodo } = costruisci(voce, datiScan, null, catalogo)
      todoNuove += nuoveTodo
      if (!PROVA) {
        await db.collection('projects').add({
          ...campi,
          sincronizzatoIl: new Date().toISOString(),
          // decisioni dell'app: si impostano solo alla nascita, poi mai piu'
          archived: voce.archiviatoDalVault || E_UNA_COPIA(campi.cartella || campi.name),
          pinned: false,
          userId: uid,
          createdAt: admin.firestore.Timestamp.fromDate(new Date()),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date()),
        })
      }
      creati++
      nuoviNomi.push(campi.name + (E_UNA_COPIA(campi.cartella || campi.name) ? ' [archiviato: copia]' : ''))
    }
  }

  if (nuoviNomi.length) {
    console.log('\n  nuovi:')
    nuoviNomi.forEach(n => console.log('    + ' + n))
  }
  // Ultima riga = riassunto: il sync del vault la copia nel suo registro
  const riassunto = `creati: ${creati}   aggiornati: ${aggiornati}   invariati: ${invariati}   da fare: +${todoNuove} -${todoTolte}`
  if (PROVA) console.log('\n  (era una prova: non ho scritto niente. Rilancia senza --prova per applicare)')
  else scriviStato({ impronta: improntaOra, quando: new Date().toISOString(), esito: riassunto })
  console.log(`\n  ${riassunto}\n`)
  process.exit(0)
}

main().catch((err) => {
  console.error('\n  Sincronizzazione fallita: ' + err.message + '\n')
  process.exit(1)
})
