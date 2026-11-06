// Il giro completo del mattino, coi pezzi veri: backend, modello, voce di Isabella e il codice del
// Worker, su emulatori Firebase e dati finti. Il progetto Firebase vero non si tocca.
//   1. il gettone del Worker fa preparare il discorso, uno finto no
//   2. l'audio salvato su Firestore esce intero dal codice del Worker, con la chiave del Comando
//   3. in chat Peppino sa cosa ha detto stamattina e conosce la routine di oggi
//
//   node tester/prova-mattino-giro.mjs --env <percorso del .env> --worker <cartella di gestionale-push>
//
// Costa qualche centesimo e dipende dalla rete: non sta in PLANCIA.
import { spawn, spawnSync } from 'node:child_process'
import { createHash, generateKeyPairSync, randomInt } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, delimiter, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import dotenv from '../backend/node_modules/dotenv/lib/main.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(QUI, '..')
const CACHE = join(QUI, 'cache')
const argv = process.argv.slice(2)
const opzione = (nome) => { const i = argv.indexOf(nome); return i >= 0 ? argv[i + 1] : undefined }
dotenv.config({ path: opzione('--env') || join(ROOT, 'backend', '.env'), quiet: true })
const WORKER = resolve(opzione('--worker') || join(ROOT, '..', '..', 'polpopoly-hub', 'workers', 'gestionale-push'))

const PROGETTO = 'demo-gestionale-x'
const PORTE = { firestore: 8299, auth: 9299, backend: 5097 }
const BACKEND = `http://127.0.0.1:${PORTE.backend}`
const FS = `http://127.0.0.1:${PORTE.firestore}/v1/projects/${PROGETTO}/databases/(default)/documents`
const EMAIL = 'paoloandrearepetto@gmail.com'
const PIN = String(randomInt(100000, 1000000))
const OGGI = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date())
const CHIAVE = 'chiave-del-comando-di-prova'

const figli = []
let logBackend = ''
const risultati = []
const verifica = (nome, ok, dettaglio = '') => {
  risultati.push(ok)
  console.log(`  ${ok ? '✓' : '✗'} ${nome}${dettaglio ? ` — ${dettaglio}` : ''}`)
}

const aFs = v => v === null || v === undefined ? { nullValue: null }
  : typeof v === 'string' ? { stringValue: v }
    : typeof v === 'boolean' ? { booleanValue: v }
      : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
        : Array.isArray(v) ? { arrayValue: { values: v.map(aFs) } }
          : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aFs(x)])) } }
const scriviDoc = (coll, id, dati) => fetch(`${FS}/${coll}/${id}`, {
  method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: aFs(dati).mapValue.fields })
})

const aspettaUrl = async (url, secondi, nome) => {
  const fine = Date.now() + secondi * 1000
  while (Date.now() < fine) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(2000) }); if (r.status < 500) return } catch { /* non ancora */ }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`${nome} non risponde`)
}

async function avviaEmulatori() {
  const jdk = readdirSync(CACHE).find(d => /^jdk-21/.test(d))
  const env = { ...process.env }
  if (jdk) { env.JAVA_HOME = join(CACHE, jdk); env.PATH = `${join(CACHE, jdk, 'bin')}${delimiter}${process.env.PATH}` }
  const radice = spawnSync('npm root -g', { encoding: 'utf8', shell: true }).stdout?.trim()
  copyFileSync(join(ROOT, 'firestore.rules'), join(CACHE, 'firestore.rules'))
  const cli = join(radice, 'firebase-tools', 'lib', 'bin', 'firebase.js')
  if (!existsSync(cli)) throw new Error('CLI di Firebase non trovata')
  figli.push(spawn(process.execPath, [cli, 'emulators:start', '--only', 'firestore,auth', '--project', PROGETTO], { cwd: QUI, env, windowsHide: true }))
  await aspettaUrl(`http://127.0.0.1:${PORTE.firestore}/`, 240, 'L\'emulatore Firestore')
  await aspettaUrl(`http://127.0.0.1:${PORTE.auth}/`, 60, 'L\'emulatore Auth')
}

function avviaBackend(account) {
  const figlio = spawn(process.execPath, [join(ROOT, 'backend', 'server.js')], {
    cwd: CACHE, windowsHide: true,
    env: {
      ...process.env, PORT: String(PORTE.backend), GCLOUD_PROJECT: PROGETTO,
      FIRESTORE_EMULATOR_HOST: `127.0.0.1:${PORTE.firestore}`, FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${PORTE.auth}`,
      // Solo per controllare il gettone: con gli emulatori firebase-admin non usa credenziali
      FIREBASE_SERVICE_ACCOUNT: JSON.stringify(account), GITHUB_TOKEN: '', VAPID_PRIVATE_KEY: ''
    }
  })
  figlio.stdout.on('data', d => { logBackend += d })
  figlio.stderr.on('data', d => { logBackend += d })
  figli.push(figlio)
  return aspettaUrl(`${BACKEND}/api/health`, 30, 'Il backend')
}

function chiudi() {
  for (const f of figli) if (f.exitCode === null) spawnSync('taskkill', ['/pid', String(f.pid), '/T', '/F'], { windowsHide: true })
}

async function main() {
  mkdirSync(CACHE, { recursive: true })
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const account = { project_id: PROGETTO, client_email: 'servizio@collaudo.test', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) }
  const env = { FIREBASE_SERVICE_ACCOUNT: JSON.stringify(account), OWNER_UID: '' }

  console.log('\nGiro completo del mattino\n')
  await avviaEmulatori()
  const nuovo = await (await fetch(`http://127.0.0.1:${PORTE.auth}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PIN, returnSecureToken: true })
  })).json()
  const uid = nuovo.localId
  const token = nuovo.idToken
  env.OWNER_UID = uid

  await scriviDoc('projects', 'ungesto', {
    userId: uid, name: 'Ungesto', type: 'progetto', status: 'in_progress', pinned: true, fonte: 'vault', vaultAggiornato: OGGI, tags: [], links: [], sections: [],
    todos: [{ text: 'Mandare a Vinoria il foglio Registro', completed: false }]
  })
  await scriviDoc('events', 'dentista', { userId: uid, title: 'Dentista', date: OGGI, time: '15:00', done: false })
  await scriviDoc('routines', uid, {
    tasks: [{ id: 't1', name: 'Sport serale', time: '18:00' }],
    timeBlocks: [{ id: 'b1', label: 'Lavoro', start: 7, end: 13 }],
    sveglia: { attiva: true, chiaveHash: createHash('sha256').update(CHIAVE).digest('hex'), voci: { meteo: true } }
  })
  await avviaBackend(account)

  const { gettoneServizio, serviMattino } = await import(pathToFileURL(join(WORKER, 'mattino.js')).href)
  const { decode } = await import(pathToFileURL(join(WORKER, 'firebase.js')).href)

  // ── 1. chi può chiedere il discorso
  const chiedi = (intestazioni) => fetch(`${BACKEND}/api/mattino/prepara`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...intestazioni }, body: '{}' })
  verifica('un gettone finto non passa', (await chiedi({ 'X-Servizio': 'a.b.c' })).status === 401)
  const t0 = Date.now()
  const risposta = await chiedi({ 'X-Servizio': gettoneServizio(env) })
  const esito = await risposta.json()
  const secondi = ((Date.now() - t0) / 1000).toFixed(1)
  verifica('il gettone del Worker fa preparare il discorso', risposta.ok && esito.stato === 'pronto', `${secondi} s, modello ${esito.modello}`)
  verifica('il discorso ha la voce', esito.audio === true)
  verifica('il modello ha scritto, non è la riserva', esito.modello !== 'riserva')
  console.log(`\n  «${esito.testo}»\n`)
  verifica('una seconda richiesta non rifà il lavoro', (await (await chiedi({ 'X-Servizio': gettoneServizio(env) })).json()).stato === 'gia-pronto')

  // ── 2. l'audio esce intero dal codice del Worker, letto dall'emulatore come farebbe in produzione
  const db = {
    async get(coll, id) {
      const r = await fetch(`${FS}/${coll}/${id}`, { headers: { Authorization: 'Bearer owner' } })
      return r.status === 200 ? decode({ mapValue: { fields: (await r.json()).fields } }) : null
    }
  }
  const richiesta = (query) => new Request(`https://www.polpopoly.it/api/gestionale-push/mattino${query}`)
  verifica('senza chiave il Worker non consegna', (await serviMattino(richiesta('?k=sbagliata'), env, db)).status === 401)
  const audio = await serviMattino(richiesta(`?k=${CHIAVE}`), env, db)
  const byte = Buffer.from(await audio.arrayBuffer())
  const eMp3 = byte[0] === 0xff || byte.subarray(0, 3).toString() === 'ID3'
  verifica('il Worker consegna un MP3 vero', audio.status === 200 && eMp3 && byte.length > 20000, `${(byte.length / 1024).toFixed(0)} kB, circa ${(byte.length / 6000).toFixed(0)} s`)
  const file = join(QUI, 'referti', `mattino-giro-${OGGI}.mp3`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, byte)
  const testo = await (await serviMattino(richiesta(`?k=${CHIAVE}&testo=1`), env, db)).text()
  verifica('il testo per la voce dell\'iPhone è quello di oggi', testo === esito.testo)
  verifica('la riserva è stata registrata', !!(await db.get('mattini', `${uid}_riserva`))?.audio)

  // ── 3. Peppino sa cosa ha detto
  const chat = async (message) => {
    const r = await fetch(`${BACKEND}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ message, history: [] })
    })
    return { status: r.status, ...(await r.json()) }
  }
  const prima = await chat('Stamattina cosa mi hai detto che ho alle 15?')
  verifica('in chat sa cosa ha detto stamattina', prima.status === 200 && /dentista/i.test(prima.reply), (prima.reply || prima.error || '').slice(0, 140))
  const seconda = await chat('Cosa ho in routine oggi?')
  verifica('in chat conosce la routine di oggi', seconda.status === 200 && /sport/i.test(seconda.reply), (seconda.reply || seconda.error || '').slice(0, 140))
  const terza = await chat('Quali sono le mie tre cose di oggi?')
  verifica('in chat conosce le tre cose di oggi', terza.status === 200 && /vinoria|registro/i.test(terza.reply), (terza.reply || terza.error || '').slice(0, 140))

  const falliti = risultati.filter(ok => !ok).length
  console.log(`\n${risultati.length - falliti} ok · ${falliti} falliti\nAudio: ${file}\n`)
  return falliti
}

main().then((falliti) => { chiudi(); process.exit(falliti ? 1 : 0) }).catch((err) => {
  console.error(`\nFermo: ${err.message}\n${logBackend.split('\n').slice(-8).join('\n')}`)
  chiudi()
  process.exit(1)
})
