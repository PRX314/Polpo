// Collaudatore di Gestionale X: usa l'app come farebbe Paolo, in un browser vero,
// e scrive un referto con gli screenshot di ogni passo.
//
// Gira tutto in locale: Firestore e Auth sono gli EMULATORI di Firebase, con un
// progetto finto "demo-gestionale-x". Il progetto vero gestionale-polpo non si
// può raggiungere: l'app è costruita in modalità emulatori, il backend parte senza
// credenziali e il browser blocca ogni richiesta che esce da questo PC.
// L'AI è simulata: le risposte della chat sono finte, l'esecuzione delle azioni no
// (la fa il backend vero, sull'emulatore).
//
// Il giro: codice sbagliato e giusto, dati già presenti, elementi nuovi con nomi
// scomodi, ricerca, testo "cattivo" nelle sezioni, cose da fare, modifica, Oggi,
// Da fare, Calendario, Routine, Documenti, chat con una proposta confermata,
// notifiche, tema, duplica/elimina, regole Firestore viste da un altro account,
// vault protetto, telefono, uscita. Ordine e dettagli cambiano col "seme".
//
//   npm run collauda               → veloce, senza finestra
//   npm run collauda:vedi          → finestra visibile e rallentata
//   aggiungi -- --seme 12345       → rifà esattamente quel giro
//   aggiungi -- --no-apri          → non aprire il referto alla fine
//
// Serve la CLI di Firebase (npm i -g firebase-tools). Java 21 viene scaricato una
// volta sola in tester/cache se sul PC non c'è.
// Referto: tester/referti/<data-ora>/referto.html; riassunto per PLANCIA/Claude:
// tester/referti/ultimo.json.
const { spawn, spawnSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const { chromium, devices } = require(path.join(ROOT, 'node_modules', 'playwright'));

const argv = process.argv.slice(2);
const opzione = nome => { const i = argv.indexOf(nome); return i >= 0 ? argv[i + 1] : undefined; };
const VEDI = argv.includes('--vedi');
const APRI = !argv.includes('--no-apri');
const PROGETTO = 'demo-gestionale-x';
const PORTE = { firestore: 8299, auth: 9299, app: 5297, backend: 5097 };
const APP = `http://127.0.0.1:${PORTE.app}/gestionale/`;
const BACKEND = `http://127.0.0.1:${PORTE.backend}`;
const CACHE = path.join(__dirname, 'cache');
const REFERTI = path.join(__dirname, 'referti');
const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
const OUT = path.join(REFERTI, stamp);

// L'email è fissa in Auth.jsx: l'account esiste solo nell'emulatore, con un PIN nuovo a ogni giro.
const EMAIL = 'paoloandrearepetto@gmail.com';
const PIN = String(crypto.randomInt(100000, 1000000));
const INTRUSO = { email: 'intruso@collaudo.test', password: crypto.randomBytes(9).toString('base64url') };

// ── il caso, ripetibile ──
const SEME = Number(opzione('--seme')) || crypto.randomInt(1, 1e9);
const caso = (() => { let a = SEME >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
const tra = (a, b) => a + Math.floor(caso() * (b - a + 1));
const moneta = () => caso() < 0.5;
const scegli = arr => arr[tra(0, arr.length - 1)];
const mescola = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(caso() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Nomi scelti per mettere in difficoltà l'app: virgolette, apostrofi, < > &, accenti, emoji.
const NOMI = ['Trasloco "casa nuova"', 'Spettacolo all\'Archivolto', 'Bollette & tasse 2026', 'Canzone <senza titolo>',
  'Video: perché sì', 'Zoë e il café', 'Idea — app per la spesa', 'Monologo dell\'onestà', 'Torneo 10/10 😀', 'Rinnovo C.I. (urgente)'];
const TODO = ['Chiamare l\'idraulico', 'Pagare F24 & IMU', 'Scrivere "intro"', 'Comprare <cavi>', 'Prenotare 2° appuntamento', 'Rispondere a Zoë'];
const EVENTI = ['Dentista (controllo)', 'Cena dall\'Ava', 'Riunione "Polpopoly"', 'Prove <spettacolo>', 'Commercialista & co.'];
const ATTIVITA = ['Lettura 📚', 'Corsa all\'alba', 'Chitarra & voce', 'Stretching <10 min>'];
const TIPI = { progetto: 'Progetto', idea: 'Idea', monologo: 'Monologo', musica: 'Musica', video: 'Video', evento: 'Evento', nota: 'Nota' };
// Markdown "cattivo": se una di queste righe esegue codice, window.__xss cambia.
const CATTIVO = 'Testo con **grassetto**, <img src=x onerror="window.__xss=\'img\'"> e [un link](javascript:window.__xss=\'link\') e <script>window.__xss=\'script\'</script> fine.';

// ── date, nel fuso di Roma come le vede Paolo ──
const oggi = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
const traGiorni = n => { const d = new Date(`${oggi()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ora = () => `${String(tra(8, 21)).padStart(2, '0')}:${scegli(['00', '15', '30', '45'])}`;
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ── registro dei passi (stesso formato del collaudatore di Ungesto) ──
const passi = [];
const osservazioni = [];
const mosse = [];
const bloccate = new Set();
let erroriCorrenti = [];
let fotoDa = null;

// ignora: errori di console attesi in quel passo (es. il 400 di Firebase per un codice sbagliato)
async function passo(page, nome, fn, { ignora } = {}) {
  erroriCorrenti = [];
  const p = { nome, esito: 'ok', dettaglio: '', foto: '', erroriJs: [] };
  passi.push(p);
  process.stdout.write(`  … ${nome}`);
  try {
    const nota = await fn();
    if (nota) p.dettaglio = nota;
  } catch (e) {
    p.esito = 'ko';
    p.dettaglio = (e.message || String(e)).split('\n')[0];
  }
  const dove = fotoDa && !fotoDa.isClosed() ? fotoDa : page;
  fotoDa = null;
  await dove.waitForTimeout(250).catch(() => {});
  p.erroriJs = erroriCorrenti.filter(e => !ignora || !ignora.test(e));
  if (p.esito === 'ok' && p.erroriJs.length) p.esito = 'avviso';
  const file = `${String(passi.length).padStart(2, '0')}.png`;
  try { await dove.screenshot({ path: path.join(OUT, file) }); p.foto = file; } catch { /* pagina chiusa */ }
  // Un passo fallito può lasciare aperta una finestra che copre tutto: Esc la chiude.
  if (p.esito === 'ko') await dove.keyboard.press('Escape').catch(() => {});
  const icona = { ok: '✓', avviso: '!', ko: '✗' }[p.esito];
  process.stdout.write(`\r  ${icona} ${nome}${p.dettaglio ? ' — ' + p.dettaglio : ''}\n`);
  for (const e of p.erroriJs) console.log(`      errore JS: ${e}`);
  return p.esito !== 'ko';
}
function verifica(cond, msg) { if (!cond) throw new Error(msg); }
async function attendi(fn, msg, ms = 8000) {
  const fine = Date.now() + ms;
  let ultimo;
  while (Date.now() < fine) {
    try { ultimo = await fn(); if (ultimo) return ultimo; } catch { /* riprova */ }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error(msg);
}

// ── Firestore e Auth dell'emulatore, via REST ──
const FS = `http://127.0.0.1:${PORTE.firestore}/v1/projects/${PROGETTO}/databases/(default)/documents`;
const aFs = v => v === null || v === undefined ? { nullValue: null }
  : typeof v === 'string' ? { stringValue: v }
    : typeof v === 'boolean' ? { booleanValue: v }
      : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
        : v instanceof Date ? { timestampValue: v.toISOString() }
          : Array.isArray(v) ? { arrayValue: { values: v.map(aFs) } }
            : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aFs(x)])) } };
const daFs = f => 'stringValue' in f ? f.stringValue : 'integerValue' in f ? Number(f.integerValue) : 'doubleValue' in f ? f.doubleValue
  : 'booleanValue' in f ? f.booleanValue : 'nullValue' in f ? null : 'timestampValue' in f ? f.timestampValue
    : 'arrayValue' in f ? (f.arrayValue.values || []).map(daFs)
      : 'mapValue' in f ? Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, daFs(x)])) : undefined;
const documento = d => ({ id: d.name.split('/').pop(), ...daFs({ mapValue: d }) });
// token "owner" = accesso amministrativo dell'emulatore, che salta le regole
async function rest(method, percorso, body, token = 'owner') {
  const r = await fetch(FS + percorso, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const testo = await r.text();
  return { status: r.status, dati: testo ? JSON.parse(testo) : null };
}
const scrivi = (coll, id, dati) => rest('PATCH', `/${coll}/${id}`, { fields: aFs(dati).mapValue.fields });
async function leggi(coll) {
  const r = await rest('GET', `/${coll}?pageSize=500`);
  return (r.dati?.documents || []).map(documento);
}
async function leggiUno(coll, id) {
  const r = await rest('GET', `/${coll}/${id}`);
  return r.status === 200 ? documento(r.dati) : null;
}
async function nuovoUtente(email, password) {
  const r = await fetch(`http://127.0.0.1:${PORTE.auth}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const d = await r.json();
  if (!d.localId) throw new Error(`Utente di prova non creato: ${JSON.stringify(d)}`);
  return { uid: d.localId, token: d.idToken };
}

// ── avvio dei pezzi ──
const figli = [];
let logEmulatori = '', logBackend = '';
const libera = async porta => { try { await fetch(`http://127.0.0.1:${porta}/`, { signal: AbortSignal.timeout(1500) }); return false; } catch { return true; } };
async function aspettaUrl(url, secondi, figlio, nome) {
  const fine = Date.now() + secondi * 1000;
  while (Date.now() < fine) {
    if (figlio && figlio.exitCode !== null) throw new Error(`${nome} si è fermato appena partito`);
    try { const r = await fetch(url, { signal: AbortSignal.timeout(2000) }); if (r.status < 500) return; } catch { /* non ancora */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`${nome} non risponde dopo ${secondi} s`);
}
function versioneJava(java) {
  const r = spawnSync(java, ['-version'], { encoding: 'utf8' });
  const m = /version "(\d+)/.exec(r.stderr || '');
  return m ? Number(m[1]) : 0;
}
// firebase-tools vuole Java 21: se il PC ha una versione più vecchia, ne scarico uno portatile in cache.
async function javaHome() {
  const locale = fs.existsSync(CACHE) && fs.readdirSync(CACHE).find(d => /^jdk-21/.test(d) && fs.existsSync(path.join(CACHE, d, 'bin', 'java.exe')));
  if (locale) return path.join(CACHE, locale);
  if (versioneJava('java') >= 21) return null;
  console.log('  Scarico Java 21 portatile in tester/cache (una volta sola, ~200 MB)…');
  fs.mkdirSync(CACHE, { recursive: true });
  const zip = path.join(CACHE, 'jdk21.zip');
  const r = await fetch('https://aka.ms/download-jdk/microsoft-jdk-21-windows-x64.zip');
  if (!r.ok) throw new Error(`Download di Java non riuscito (${r.status})`);
  fs.writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
  const tar = spawnSync(path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-xf', zip], { cwd: CACHE, encoding: 'utf8' });
  fs.rmSync(zip, { force: true });
  if (tar.status !== 0) throw new Error(`Estrazione di Java non riuscita: ${tar.stderr}`);
  return javaHome();
}
async function avviaEmulatori() {
  for (const p of [PORTE.firestore, PORTE.auth]) if (!(await libera(p))) throw new Error(`La porta ${p} è occupata: c'è ancora un collaudo o un emulatore acceso?`);
  const home = await javaHome();
  const env = { ...process.env };
  if (home) { env.JAVA_HOME = home; env.PATH = `${path.join(home, 'bin')}${path.delimiter}${process.env.PATH}`; }
  // La CLI va lanciata con node, senza shell: i percorsi con spazi resterebbero spezzati.
  // firebase.json sta nella cartella di lavoro (tester/), quindi niente --config.
  // Con "npm --prefix ..." npm passa quel prefisso ai figli: senza toglierlo, "root -g" guarderebbe lì.
  const envNpm = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^npm_config_prefix$/i.test(k)));
  const radice = spawnSync('npm root -g', { encoding: 'utf8', shell: true, env: envNpm }).stdout?.trim();
  // L'emulatore accetta solo regole dentro la sua cartella: copio quelle vere a ogni giro.
  fs.copyFileSync(path.join(ROOT, 'firestore.rules'), path.join(CACHE, 'firestore.rules'));
  const cli = radice && path.join(radice, 'firebase-tools', 'lib', 'bin', 'firebase.js');
  if (!cli || !fs.existsSync(cli)) throw new Error('CLI di Firebase non trovata: installala con npm i -g firebase-tools');
  const figlio = spawn(process.execPath, [cli, 'emulators:start', '--only', 'firestore,auth', '--project', PROGETTO],
    { cwd: __dirname, env, windowsHide: true });
  figlio.stdout.on('data', d => { logEmulatori += d; });
  figlio.stderr.on('data', d => { logEmulatori += d; });
  figli.push(figlio);
  try {
    await aspettaUrl(`http://127.0.0.1:${PORTE.firestore}/`, 240, figlio, 'L\'emulatore Firestore');
    await aspettaUrl(`http://127.0.0.1:${PORTE.auth}/`, 60, figlio, 'L\'emulatore Auth');
  } catch (e) {
    const coda = logEmulatori.split('\n').slice(-8).join('\n');
    throw new Error(`${e.message}. ${/firebase.*(not recognized|non è riconosciuto)/i.test(coda) ? 'Installa la CLI: npm i -g firebase-tools.' : coda}`);
  }
}
async function avviaBackend() {
  if (!(await libera(PORTE.backend))) throw new Error(`La porta ${PORTE.backend} è occupata`);
  // Chiavi vuote: dotenv non sovrascrive le variabili già impostate, quindi il .env vero resta ignorato.
  const env = {
    ...process.env, PORT: String(PORTE.backend), GCLOUD_PROJECT: PROGETTO,
    FIRESTORE_EMULATOR_HOST: `127.0.0.1:${PORTE.firestore}`, FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${PORTE.auth}`,
    FIREBASE_SERVICE_ACCOUNT: '', GROQ_API_KEY: '', NVIDIA_API_KEY: '', GITHUB_TOKEN: '', VAPID_PRIVATE_KEY: '',
    VAULT_PATH: path.join(os.tmpdir(), 'gestionale-collaudo-vault-inesistente'),
  };
  const figlio = spawn(process.execPath, [path.join(ROOT, 'backend', 'server.js')], { cwd: CACHE, env, windowsHide: true });
  figlio.stdout.on('data', d => { logBackend += d; });
  figlio.stderr.on('data', d => { logBackend += d; });
  figli.push(figlio);
  await aspettaUrl(`${BACKEND}/api/health`, 30, figlio, 'Il backend');
  verifica(/Emulatori Firebase/.test(logBackend), 'Il backend non è partito in modalità emulatori: fermo tutto');
}
let anteprima;
async function avviaApp() {
  const vite = await import(pathToFileURL(path.join(ROOT, 'node_modules', 'vite', 'dist', 'node', 'index.js')).href);
  Object.assign(process.env, { VITE_EMULATORI: '1', VITE_EMU_FIRESTORE: `127.0.0.1:${PORTE.firestore}`, VITE_EMU_AUTH: `http://127.0.0.1:${PORTE.auth}`, VITE_AI_API_URL: '' });
  const outDir = path.join(CACHE, 'app');
  // Build vera (come in produzione), ma in modalità emulatori
  await vite.build({ root: ROOT, mode: 'collaudo', logLevel: 'error', build: { outDir, emptyOutDir: true } });
  verifica(fs.readFileSync(path.join(outDir, 'index.html'), 'utf8').includes('/gestionale/'), 'Build senza base /gestionale/');
  anteprima = await vite.preview({ root: ROOT, mode: 'collaudo', logLevel: 'error', build: { outDir }, preview: { port: PORTE.app, strictPort: true, host: '127.0.0.1' } });
}
function chiudiFigli() {
  for (const f of figli) {
    if (f.exitCode !== null) continue;
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(f.pid), '/T', '/F'], { windowsHide: true });
    else f.kill('SIGTERM');
  }
}
process.on('SIGINT', () => { chiudiFigli(); process.exit(130); });

// ── dati già presenti nell'account, come se Paolo usasse l'app da mesi ──
async function preparaAccount(owner, intruso) {
  const adesso = new Date();
  const giaPresenti = [
    { id: 'storico-progetto', type: 'progetto', name: 'Gestionale di prova', status: 'in_progress', description: 'Progetto già esistente prima del collaudo',
      tags: ['storico', 'polpo'], roadmap: '- [x] Partire\n- [ ] Finire', obiettivi: 'Vedere se **tutto** regge', deadline: null, deadlineTime: '', reminder: null,
      vaultNote: null, links: [{ title: 'Sito', url: 'https://polpopoly.it' }],
      todos: [{ text: 'Scadenza dimenticata', completed: false, deadline: traGiorni(-2) }, { text: 'Già fatta', completed: true }],
      sections: [{ id: 's1', title: 'Obiettivi', content: 'Primo obiettivo' }], userId: owner.uid, createdAt: adesso, updatedAt: adesso },
    { id: 'storico-idea', type: 'idea', name: 'Idea dal vault', status: 'pending', description: 'Arriva da Obsidian', tags: ['vault'], roadmap: '', obiettivi: '',
      deadline: null, deadlineTime: '', reminder: null, vaultNote: 'Idea dal vault', links: [], todos: [], sections: [], source: 'vault', userId: owner.uid, createdAt: adesso, updatedAt: adesso },
  ];
  for (const p of giaPresenti) { const { id, ...dati } = p; await scrivi('projects', id, dati); }
  await scrivi('notes', 'nota-vecchia', { title: 'Nota del vecchio formato', content: 'Scritta prima che le note diventassero elementi', type: 'idea', userId: owner.uid, createdAt: adesso, updatedAt: adesso });
  await scrivi('events', 'evento-storico', { title: 'Appuntamento già in agenda', date: traGiorni(1), time: '09:30', endTime: '', reminder: null, notes: '', done: false, userId: owner.uid, createdAt: adesso, updatedAt: adesso });
  await scrivi('routines', owner.uid, {
    tasks: [{ id: 't1', name: 'Sport', duration: '30 min' }, { id: 't2', name: 'Lavoro su PC', duration: '1h' }],
    timeBlocks: [{ id: 'b1', label: 'Lavoro', start: 9, end: 13 }], extras: [{ id: 'e1', text: 'Burocrazia', done: false }], weekStatus: {},
  });
  // Dati di un altro account: non devono mai comparire.
  await scrivi('projects', 'progetto-intruso', { type: 'progetto', name: 'SEGRETO di un altro account', status: 'pending', tags: [], todos: [], sections: [], links: [], userId: intruso.uid, createdAt: adesso, updatedAt: adesso });
}

// ── il browser: niente esce da questo PC, l'AI è finta ──
let scenarioChat = { testo: 'Ciao!', proposte: [] };
async function preparaContesto(ctx) {
  await ctx.route('**/*', async route => {
    const req = route.request();
    const u = new URL(req.url());
    if (!/^https?:$/.test(u.protocol)) return route.continue();
    if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') {
      // Tutto ciò che esce viene bloccato. È un errore solo se punta ai dati di Firebase:
      // vorrebbe dire che l'app non sta usando gli emulatori. Il resto (es. lo script
      // apis.google.com che l'SDK di Auth carica da sé) finisce tra le osservazioni.
      bloccate.add(`${u.hostname}${u.pathname}`);
      if (/(firestore|identitytoolkit|securetoken|firebaseinstallations)\.googleapis\.com|firebaseio\.com/.test(u.hostname)) {
        erroriCorrenti.push(`ATTENZIONE: tentativo di raggiungere Firebase vero (${u.hostname}), bloccato`);
      }
      return route.abort('blockedbyclient');
    }
    if (!u.pathname.startsWith('/api/') || String(u.port) === String(PORTE.backend)) return route.continue();
    const json = (dati, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(dati) });
    if (u.pathname === '/api/chat/stream') {
      const pezzi = scenarioChat.testo.match(/.{1,12}/gs) || [''];
      const corpo = pezzi.map(d => `data: ${JSON.stringify({ t: 'testo', d })}\n\n`).join('')
        + `data: ${JSON.stringify({ t: 'fine', reply: scenarioChat.testo, proposedActions: scenarioChat.proposte, label: 'Modello finto' })}\n\n`;
      return route.fulfill({ status: 200, headers: { 'Content-Type': 'text/event-stream' }, body: corpo });
    }
    if (u.pathname === '/api/chat') return json({ reply: scenarioChat.testo, proposedActions: scenarioChat.proposte });
    if (u.pathname === '/api/chat/title') return json({ title: 'Conversazione di collaudo' });
    if (u.pathname === '/api/providers') return json({ providers: [{ id: 'finto', name: 'Modello finto', models: ['collaudo-1'] }] });
    if (u.pathname === '/api/specialists') return json({ specialists: [] });
    if (u.pathname.startsWith('/api/gestionale-push')) return json({ ok: true, active: false });
    if (u.pathname.startsWith('/api/parla')) return json({ error: 'Voce spenta nel collaudo' }, 404);
    // Tutto il resto (esecuzione azioni, vault, health) va al backend vero, collegato all'emulatore.
    return route.continue({ url: BACKEND + u.pathname + u.search });
  });
}
function ascolta(pg) {
  pg.on('pageerror', e => erroriCorrenti.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT/.test(m.text())) erroriCorrenti.push(m.text()); });
  pg.on('dialog', d => d.accept().catch(() => {}));
}
async function entra(pg) {
  await pg.goto(APP);
  await pg.getByRole('button', { name: '1', exact: true }).waitFor({ timeout: 20000 });
  await pg.keyboard.type(PIN, { delay: 40 });
  await pg.getByRole('navigation', { name: 'Sezioni' }).first().waitFor({ timeout: 20000 });
}
const vai = async (pg, testo) => {
  await pg.getByRole('navigation', { name: 'Sezioni' }).first().getByRole('link', { name: testo, exact: true }).click();
};
const toast = (pg, testo) => pg.locator('.toasts').getByText(testo).first().waitFor({ timeout: 8000 });
const finestra = pg => pg.getByRole('dialog');
const senzaOverflow = pg => pg.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(CACHE, { recursive: true });
  console.log(`\nCollaudo Gestionale X · seme ${SEME}\n`);
  let browser;
  const creati = [];   // { nome, tipo, scadenza, ora, id }
  try {
    process.stdout.write('  Avvio emulatori Firebase…');
    const t0 = Date.now();
    await avviaEmulatori();
    process.stdout.write(` pronti in ${Math.round((Date.now() - t0) / 1000)} s\n  Backend e build dell'app…`);
    const owner = await nuovoUtente(EMAIL, PIN);
    const intruso = await nuovoUtente(INTRUSO.email, INTRUSO.password);
    await avviaBackend();
    await avviaApp();
    await preparaAccount(owner, intruso);
    process.stdout.write(' pronti\n\n');

    browser = await chromium.launch({ headless: !VEDI, slowMo: VEDI ? 150 : 0 });
    const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, locale: 'it-IT', timezoneId: 'Europe/Rome' });
    await preparaContesto(ctx);
    const page = await ctx.newPage();
    ascolta(page);

    // ── piano del giro, deciso dal seme ──
    const nomi = mescola(NOMI).slice(0, tra(3, 4));
    const tipi = mescola(Object.keys(TIPI));
    const scadenze = mescola([-1, 0, tra(2, 5), null]);
    nomi.forEach((nome, i) => {
      const s = scadenze[i % scadenze.length];
      creati.push({ nome, tipo: tipi[i], scadenza: s === null ? null : traGiorni(s), giorni: s, ora: s === 0 && moneta() ? ora() : '' });
    });
    mosse.push(`elementi: ${creati.map(c => `${c.nome} (${TIPI[c.tipo]}${c.scadenza ? `, scade ${c.giorni === 0 ? 'oggi' : c.giorni < 0 ? 'ieri' : `tra ${c.giorni} giorni`}${c.ora ? ` alle ${c.ora}` : ''}` : ''})`).join('; ')}`);
    const cattivo = creati[tra(0, creati.length - 1)];
    mosse.push(`testo "cattivo" nelle sezioni di: ${cattivo.nome}`);

    // ── accesso ──
    await passo(page, 'Apertura: schermata del codice', async () => {
      await page.goto(APP);
      await page.getByRole('button', { name: '1', exact: true }).waitFor({ timeout: 20000 });
      verifica(await senzaOverflow(page), 'La schermata del codice esce dai bordi');
    });
    await passo(page, 'Codice sbagliato', async () => {
      let sbagliato; do { sbagliato = String(tra(100000, 999999)); } while (sbagliato === PIN);
      await page.keyboard.type(sbagliato, { delay: 40 });
      await page.getByText('Codice errato').waitFor({ timeout: 10000 });
    }, { ignora: /status of 400/ });
    const dentro = await passo(page, 'Entra col codice giusto', async () => {
      await page.keyboard.type(PIN, { delay: 40 });
      await page.getByRole('navigation', { name: 'Sezioni' }).first().waitFor({ timeout: 20000 });
      const dati = [...bloccate].filter(b => /googleapis\.com|firebaseio\.com/.test(b) && !/^apis\.google\.com/.test(b));
      verifica(!dati.length, `L'app ha provato a raggiungere Firebase vero: ${dati.join(', ')}`);
    });
    if (!dentro) throw new Error('Senza accesso il giro non può continuare');

    await passo(page, 'Dati già presenti, e nessun dato di un altro account', async () => {
      await vai(page, 'Elementi');
      await page.getByRole('heading', { name: 'Elementi', level: 1 }).waitFor();
      await page.getByText('Gestionale di prova').first().waitFor({ timeout: 10000 });
      await page.getByText('Idea dal vault').first().waitFor();
      verifica(!(await page.getByText('SEGRETO di un altro account').count()), 'Si vede un elemento di un altro account');
    });

    // ── giro delle sezioni, in ordine casuale ──
    const sezioni = mescola(['Oggi', 'Elementi', 'Da fare', 'Calendario', 'Routine', 'Documenti', 'Polpo AI']);
    mosse.push(`ordine delle sezioni: ${sezioni.join(' → ')}`);
    await passo(page, 'Tutte le sezioni si aprono', async () => {
      const rotte = [];
      for (const s of sezioni) {
        await vai(page, s);
        await page.locator('main h1, main [role="tablist"], main textarea').first().waitFor({ timeout: 10000 }).catch(() => rotte.push(`${s}: niente titolo`));
        if (!(await senzaOverflow(page))) rotte.push(`${s}: esce dai bordi`);
      }
      verifica(!rotte.length, rotte.join('; '));
    });

    // ── elementi nuovi ──
    for (const c of creati) {
      await passo(page, `Crea ${TIPI[c.tipo].toLowerCase()}: ${c.nome}`, async () => {
        await vai(page, 'Elementi');
        await page.getByRole('button', { name: 'Nuovo', exact: true }).click();
        const f = finestra(page);
        await f.getByRole('radio', { name: TIPI[c.tipo], exact: true }).click();
        await f.locator('#pf-name').fill(`  ${c.nome}  `);
        await f.locator('#pf-desc').fill(`Creato dal collaudo (seme ${SEME})`);
        // Lo stato conta: Oggi nasconde gli elementi completati e le loro cose da fare.
        // Il primo elemento non è mai completato, così c'è sempre dove mettere le prove.
        const stati = await f.locator('#pf-status option').evaluateAll(o => o.map(x => x.value));
        c.stato = stati[tra(0, 2)];
        if (c === creati[0] && c.stato === 'completed') c.stato = 'pending';
        await f.locator('#pf-status').selectOption(c.stato);
        if (c.scadenza) {
          await f.locator('#pf-deadline').fill(c.scadenza);
          if (c.ora) { await f.locator('#pf-time').fill(c.ora); await f.locator('#pf-rem').selectOption({ index: 1 }); }
        }
        await f.locator('#pf-tags').fill('collaudo, prova speciale ,  ');
        const testo = c === cattivo ? CATTIVO : 'Contenuto normale della **prima** sezione';
        if (await f.getByLabel('Contenuto della sezione 1').count()) await f.getByLabel('Contenuto della sezione 1').fill(testo);
        else { await f.getByLabel('Titolo della nuova sezione').fill('Note'); await f.getByRole('button', { name: 'Sezione' }).click(); await f.getByLabel('Contenuto della sezione 1').fill(testo); }
        await f.getByLabel('Testo della cosa da fare').fill(scegli(TODO));
        await f.getByRole('button', { name: 'Aggiungi', exact: true }).click();
        await f.getByRole('button', { name: 'Crea', exact: true }).click();
        await toast(page, 'Elemento creato');
        await finestra(page).waitFor({ state: 'detached', timeout: 5000 });
        const doc = await attendi(async () => (await leggi('projects')).find(p => p.name === c.nome), 'Elemento non trovato in Firestore');
        c.id = doc.id;
        verifica(doc.userId === owner.uid, 'userId sbagliato');
        verifica(doc.type === c.tipo, `tipo salvato "${doc.type}" invece di "${c.tipo}"`);
        verifica(doc.status === c.stato, `stato salvato "${doc.status}" invece di "${c.stato}"`);
        verifica(JSON.stringify(doc.tags) === JSON.stringify(['collaudo', 'prova speciale']), `tag salvati male: ${JSON.stringify(doc.tags)}`);
        verifica((doc.deadline || null) === c.scadenza, `scadenza salvata ${doc.deadline} invece di ${c.scadenza}`);
        if (c.ora) verifica(doc.deadlineTime === c.ora && doc.reminder !== null, 'ora o sveglia non salvate');
        verifica(doc.todos?.length === 1, 'la cosa da fare del form non è stata salvata');
        await page.locator(`a[href="#/elementi/${c.id}"]`).first().waitFor({ timeout: 5000 });
      });
    }
    const vivi = () => creati.filter(c => c.id && !c.eliminato);

    await passo(page, 'Nome vuoto non si salva', async () => {
      await page.getByRole('button', { name: 'Nuovo', exact: true }).click();
      await finestra(page).locator('#pf-name').fill('   ');
      await finestra(page).getByRole('button', { name: 'Crea', exact: true }).click();
      await finestra(page).getByText('Serve un nome').waitFor({ timeout: 3000 });
      await page.keyboard.press('Escape');
      await finestra(page).waitFor({ state: 'detached', timeout: 3000 });
    });

    await passo(page, 'Ricerca negli elementi (accenti e simboli)', async () => {
      const c = scegli(vivi());
      const pezzo = c.nome.slice(0, Math.max(4, Math.ceil(c.nome.length / 2)));
      await page.getByLabel('Cerca negli elementi').fill(pezzo);
      await page.locator(`a[href="#/elementi/${c.id}"]`).first().waitFor({ timeout: 5000 });
      verifica(!(await page.locator('a[href="#/elementi/storico-progetto"]').count()) || pezzo.length < 4, 'la ricerca non filtra');
      await page.getByLabel('Cerca negli elementi').fill('');
      return `cercato "${pezzo}"`;
    });

    await passo(page, 'Ricerca globale porta al dettaglio', async () => {
      const c = scegli(vivi());
      await page.getByLabel('Cerca ovunque').first().fill(c.nome.slice(0, 6));
      await page.getByRole('option').filter({ hasText: c.nome }).first().click();
      await page.getByRole('heading', { name: c.nome, level: 1 }).waitFor({ timeout: 5000 });
      return c.nome;
    });

    await passo(page, 'Testo "cattivo" nelle sezioni non esegue codice', async () => {
      await page.goto(`${APP}#/elementi/${cattivo.id}`);
      await page.getByRole('heading', { name: cattivo.nome, level: 1 }).waitFor();
      await page.getByText('grassetto', { exact: false }).first().waitFor({ timeout: 5000 });
      const xss = await page.evaluate(() => window.__xss || null);
      verifica(!xss, `il markdown ha eseguito codice (${xss})`);
      const pericolosi = await page.locator('main a[href^="javascript:"]').count();
      verifica(!pericolosi, 'c\'è un link javascript: cliccabile');
    });

    const attivi = () => vivi().filter(c => c.stato !== 'completed');
    const conTodo = scegli(attivi());
    const nuovoTodo = scegli(TODO.filter(t => t !== conTodo.todo));
    const oraTodo = ora();
    mosse.push(`cosa da fare "${nuovoTodo}" su ${conTodo.nome}, oggi alle ${oraTodo}`);
    await passo(page, 'Cose da fare nel dettaglio: aggiungi e spunta', async () => {
      await page.goto(`${APP}#/elementi/${conTodo.id}`);
      const lista = page.getByRole('region', { name: 'Cose da fare' });
      await lista.getByLabel('Nuova cosa da fare').fill(nuovoTodo);
      await lista.getByLabel('Scadenza (facoltativa)').fill(oggi());
      await lista.getByLabel('Ora (facoltativa)').fill(oraTodo);
      await lista.getByRole('button', { name: 'Aggiungi' }).click();
      await lista.getByText(nuovoTodo, { exact: true }).waitFor();
      await lista.getByRole('checkbox').first().check();
      const doc = await attendi(async () => {
        const d = await leggiUno('projects', conTodo.id);
        return d?.todos?.length === 2 && d.todos[0].completed && d.todos[1].text === nuovoTodo ? d : null;
      }, 'le cose da fare non risultano salvate in Firestore');
      verifica(doc.todos[1].deadline === oggi() && doc.todos[1].time === oraTodo, 'scadenza o ora della cosa da fare non salvate');
    });

    await passo(page, 'Modifica elemento e cambio stato', async () => {
      const c = scegli(vivi());
      await page.goto(`${APP}#/elementi/${c.id}`);
      await page.getByRole('button', { name: 'Modifica', exact: true }).first().click();
      const nuovoNome = `${c.nome} (rivisto)`;
      await finestra(page).locator('#pf-name').fill(nuovoNome);
      await finestra(page).getByRole('button', { name: 'Salva', exact: true }).click();
      await toast(page, 'Modifiche salvate');
      await page.getByRole('heading', { name: nuovoNome, level: 1 }).waitFor({ timeout: 5000 });
      c.nome = nuovoNome;
      // Mai "completato" se l'elemento ha scadenze o la cosa da fare di prova: Oggi le nasconderebbe
      const stato = scegli(['pending', 'in_progress', 'completed'].filter(s => s !== 'completed' || (!c.scadenza && c !== conTodo)));
      await page.getByLabel('Stato', { exact: true }).first().selectOption(stato);
      await attendi(async () => (await leggiUno('projects', c.id))?.status === stato, `lo stato "${stato}" non è arrivato in Firestore`);
      c.stato = stato;
      return `${nuovoNome} → ${stato}`;
    });

    await passo(page, 'Oggi: ogni scadenza nel blocco giusto', async () => {
      await vai(page, 'Oggi');
      const blocco = titolo => page.locator('section').filter({ has: page.locator('h2.ag-head', { hasText: new RegExp(`^${titolo}`) }) });
      const errori = [];
      for (const c of vivi().filter(x => x.scadenza && x.stato !== 'completed')) {
        const titolo = c.giorni < 0 ? 'Scadute' : c.giorni === 0 ? 'Oggi' : 'Prossimi 7 giorni';
        const visto = await blocco(titolo).getByText(c.nome, { exact: true }).first().waitFor({ timeout: 4000 }).then(() => true, () => false);
        if (!visto) errori.push(`${c.nome} non è in "${titolo}"`);
      }
      const todoVisto = await blocco('Oggi').getByText(nuovoTodo, { exact: true }).first().waitFor({ timeout: 4000 }).then(() => true, () => false);
      if (!todoVisto) errori.push(`la cosa da fare "${nuovoTodo}" non è in "Oggi"`);
      const scaduta = await blocco('Scadute').getByText('Scadenza dimenticata').first().waitFor({ timeout: 4000 }).then(() => true, () => false);
      if (!scaduta) errori.push('la cosa da fare scaduta già presente non è in "Scadute"');
      verifica(!errori.length, errori.join('; '));
    });

    await passo(page, 'Da fare: elenco e filtro "Scadute"', async () => {
      await vai(page, 'Da fare');
      await page.getByText(nuovoTodo, { exact: true }).first().waitFor({ timeout: 5000 });
      await page.getByRole('tab', { name: /Scadute/ }).click();
      await page.getByText('Scadenza dimenticata').first().waitFor({ timeout: 5000 });
      verifica(!(await page.getByText(nuovoTodo, { exact: true }).count()), `"${nuovoTodo}" (di oggi) compare tra le scadute`);
    });

    // ── calendario ──
    const evento = { titolo: scegli(EVENTI), data: traGiorni(tra(0, 6)), ora: ora() };
    evento.fine = `${String(Math.min(23, Number(evento.ora.slice(0, 2)) + 1)).padStart(2, '0')}:${evento.ora.slice(3)}`;
    mosse.push(`appuntamento "${evento.titolo}" il ${evento.data} alle ${evento.ora}`);
    await passo(page, 'Calendario: nuovo appuntamento con sveglia', async () => {
      await vai(page, 'Calendario');
      await page.getByRole('button', { name: 'Appuntamento', exact: true }).click();
      const f = finestra(page);
      await f.locator('#ev-title').fill(evento.titolo);
      await f.locator('#ev-date').fill(evento.data);
      await f.locator('#ev-time').fill(evento.ora);
      // Prima la fine sbagliata: deve fermarmi
      await f.locator('#ev-end').fill('07:00');
      await f.getByRole('button', { name: 'Salva', exact: true }).click();
      await f.getByRole('alert').filter({ hasText: /fine viene prima/i }).waitFor({ timeout: 3000 });
      await f.locator('#ev-end').fill(evento.fine);
      await f.locator('#ev-rem').selectOption({ index: 1 });
      await f.locator('#ev-notes').fill('Portare <documenti> & tessera');
      await f.getByRole('button', { name: 'Salva', exact: true }).click();
      await finestra(page).waitFor({ state: 'detached', timeout: 5000 });
      const doc = await attendi(async () => (await leggi('events')).find(e => e.title === evento.titolo), 'appuntamento non salvato in Firestore');
      evento.id = doc.id;
      verifica(doc.date === evento.data && doc.time === evento.ora && doc.endTime === evento.fine, 'data o orari salvati male');
      verifica(doc.reminder !== null && doc.userId === owner.uid, 'sveglia o proprietario mancanti');
      await page.getByRole('button').filter({ hasText: evento.titolo }).first().waitFor({ timeout: 5000 });
    });
    const eliminaEvento = moneta();
    mosse.push(eliminaEvento ? 'l\'appuntamento viene poi eliminato' : 'l\'appuntamento viene poi rinominato');
    await passo(page, eliminaEvento ? 'Calendario: elimina appuntamento' : 'Calendario: rinomina appuntamento', async () => {
      await page.getByRole('button').filter({ hasText: evento.titolo }).first().click();
      const f = finestra(page);
      await f.getByRole('heading', { name: 'Modifica appuntamento' }).waitFor();
      if (eliminaEvento) {
        await f.getByRole('button', { name: 'Elimina', exact: true }).click();
        await attendi(async () => !(await leggiUno('events', evento.id)), 'appuntamento ancora in Firestore');
      } else {
        evento.titolo += ' (spostato)';
        await f.locator('#ev-title').fill(evento.titolo);
        await f.getByRole('button', { name: 'Salva', exact: true }).click();
        await attendi(async () => (await leggiUno('events', evento.id))?.title === evento.titolo, 'nuovo titolo non salvato');
      }
      await finestra(page).waitFor({ state: 'detached', timeout: 5000 });
    });

    // ── routine ──
    const attivita = scegli(ATTIVITA);
    await passo(page, 'Routine: nuova attività e voce spuntata, anche dopo ricarica', async () => {
      await vai(page, 'Routine');
      const schedaAttivita = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Attività giornaliere' }) });
      await schedaAttivita.getByRole('button', { name: 'Modifica' }).click();
      await page.getByLabel('Nome dell\'attività').fill(attivita);
      await page.getByRole('button', { name: 'Aggiungi attività' }).click();
      await schedaAttivita.getByRole('button', { name: 'Fatto' }).click();
      await page.getByLabel('Nuova voce').fill('Rinnovare l\'abbonamento');
      await page.getByRole('button', { name: 'Aggiungi voce' }).click();
      // La spunta della routine dipende solo dalla risposta di Firestore: misuro quanto tarda.
      const casella = page.getByRole('checkbox', { name: /Segna “Rinnovare l'abbonamento”/ }).first();
      const t0 = Date.now();
      await casella.click();
      await attendi(() => casella.isChecked(), 'la voce non risulta spuntata nemmeno dopo 5 secondi', 5000);
      const ritardo = Date.now() - t0;
      if (ritardo > 500) osservazioni.push(`Routine: la spunta di una voce compare dopo ${ritardo} ms (lo stato aspetta Firestore, nessun aggiornamento immediato).`);
      const doc = await attendi(async () => {
        const d = await leggiUno('routines', owner.uid);
        return d?.tasks?.some(t => t.name === attivita) && d.extras?.some(e => e.text === 'Rinnovare l\'abbonamento' && e.done) ? d : null;
      }, 'routine non salvata in Firestore (gli errori di salvataggio della routine sono silenziosi)');
      verifica(doc.tasks.some(t => t.name === 'Sport'), 'le attività già presenti sono sparite');
      await page.reload();
      await page.getByText(attivita, { exact: true }).first().waitFor({ timeout: 10000 });
      return attivita;
    });

    // ── documenti locali ──
    await passo(page, 'Documenti: solo testo con scadenza, visibile in Oggi', async () => {
      await vai(page, 'Documenti');
      await page.getByRole('button', { name: 'Solo testo' }).click();
      await page.getByLabel('Titolo', { exact: true }).fill('Multa di prova');
      await page.getByLabel('Riepilogo dettagliato').fill('Verbale n. 123 — importo € 41,00');
      await page.getByRole('button', { name: 'Aggiungi scadenza' }).click();
      await page.getByLabel('Data', { exact: true }).fill(traGiorni(2));
      await page.getByRole('button', { name: 'Salva modifiche', exact: true }).first().click();
      await page.getByText('Salvato su questo dispositivo', { exact: true }).waitFor();
      await vai(page, 'Oggi');
      await page.getByText('Multa di prova · Scadenza').first().waitFor({ timeout: 5000 });
    });

    // ── chat: risposta finta, azione vera sul backend ──
    const bersaglio = scegli(vivi());
    const todoChat = `Dalla chat: ${scegli(TODO)}`;
    scenarioChat = {
      testo: `Certo! Aggiungo "${todoChat}" a **${bersaglio.nome}**.`,
      proposte: [{ tool: 'add_todo', args: { projectName: bersaglio.nome, text: todoChat, deadline: traGiorni(1) }, label: 'Aggiungi cosa da fare' }],
    };
    mosse.push(`chat: propone "${todoChat}" su ${bersaglio.nome}`);
    await passo(page, 'Polpo AI: risposta, proposta confermata, azione eseguita', async () => {
      await vai(page, 'Polpo AI');
      await page.getByLabel('Messaggio').fill(`Aggiungi una cosa da fare a ${bersaglio.nome}`);
      await page.getByRole('button', { name: 'Invia' }).click();
      await page.getByText('Aggiungo', { exact: false }).first().waitFor({ timeout: 10000 });
      await page.getByRole('button', { name: 'Conferma: Aggiungi cosa da fare' }).click();
      const doc = await attendi(async () => {
        const d = await leggiUno('projects', bersaglio.id);
        return d?.todos?.some(t => t.text === todoChat) ? d : null;
      }, 'l\'azione confermata non ha aggiunto la cosa da fare (backend /api/chat/execute)', 15000);
      verifica(doc.todos.find(t => t.text === todoChat).deadline === traGiorni(1), 'scadenza della cosa da fare dalla chat sbagliata');
      const chat = await attendi(async () => (await leggi('chats')).find(c => c.userId === owner.uid), 'la conversazione non è stata salvata');
      verifica(Array.isArray(chat.messages) && chat.messages.length >= 2, 'conversazione salvata senza messaggi');
    });

    await passo(page, 'Notifiche: la finestra si apre e si chiude', async () => {
      await page.getByRole('button', { name: /^Notifiche/ }).first().click();
      await finestra(page).first().waitFor({ timeout: 5000 });
      await page.keyboard.press('Escape');
      await finestra(page).waitFor({ state: 'detached', timeout: 5000 });
    });

    await passo(page, 'Tema scuro e ritorno', async () => {
      const tema = () => page.evaluate(() => `${document.documentElement.getAttribute('data-theme')}|${document.documentElement.className}`);
      const prima = await tema();
      await page.getByRole('button', { name: /Passa al tema/ }).click();
      const dopo = await tema();
      verifica(prima !== dopo, 'il tema non cambia');
      fotoDa = null;
      await page.screenshot({ path: path.join(OUT, 'tema-alternativo.png') }).catch(() => {});
      await page.getByRole('button', { name: /Passa al tema/ }).click();
      verifica((await tema()) === prima, 'il tema non torna com\'era');
    });

    const duplica = moneta();
    if (duplica) {
      await passo(page, 'Duplica un elemento', async () => {
        const c = scegli(vivi());
        await vai(page, 'Elementi');
        await page.getByRole('button', { name: `Azioni per ${c.nome}`, exact: true }).first().click();
        await page.getByRole('menuitem', { name: 'Duplica' }).click();
        await toast(page, 'Elemento duplicato');
        const copia = await attendi(async () => (await leggi('projects')).find(p => p.name === `${c.nome} (copia)`), 'copia non trovata in Firestore');
        verifica(copia.userId === owner.uid && copia.todos?.length === (await leggiUno('projects', c.id)).todos.length, 'la copia non ha proprietario o cose da fare uguali');
        return c.nome;
      });
    }

    await passo(page, 'Elimina un elemento', async () => {
      const c = scegli(vivi());
      await vai(page, 'Elementi');
      await page.getByRole('button', { name: `Azioni per ${c.nome}`, exact: true }).first().click();
      await page.getByRole('menuitem', { name: 'Elimina…' }).click();
      await finestra(page).getByRole('button', { name: 'Elimina', exact: true }).click();
      await attendi(async () => !(await leggiUno('projects', c.id)), 'elemento ancora in Firestore');
      await page.locator(`a[href="#/elementi/${c.id}"]`).first().waitFor({ state: 'detached', timeout: 5000 });
      c.eliminato = true;
      return c.nome;
    });

    await passo(page, 'Ricarica: resti dentro e i dati ci sono', async () => {
      await page.reload();
      await page.getByRole('navigation', { name: 'Sezioni' }).first().waitFor({ timeout: 15000 });
      await vai(page, 'Elementi');
      for (const c of vivi()) await page.locator(`a[href="#/elementi/${c.id}"]`).first().waitFor({ timeout: 8000 });
    });

    // ── sicurezza, vista da fuori ──
    await passo(page, 'Regole Firestore: un altro account non legge né scrive i tuoi dati', async () => {
      const c = vivi()[0];
      const letto = await rest('GET', `/projects/${c.id}`, null, intruso.token);
      verifica(letto.status === 403, `un altro account legge il tuo elemento (HTTP ${letto.status})`);
      const elenco = await rest('POST', ':runQuery', { structuredQuery: { from: [{ collectionId: 'projects' }], where: { fieldFilter: { field: { fieldPath: 'userId' }, op: 'EQUAL', value: { stringValue: owner.uid } } } } }, intruso.token);
      verifica(elenco.status === 403, `un altro account elenca i tuoi elementi (HTTP ${elenco.status})`);
      const finto = await rest('POST', '/projects', { fields: aFs({ name: 'Intrusione', userId: owner.uid }).mapValue.fields }, intruso.token);
      verifica(finto.status === 403, `un altro account crea elementi a tuo nome (HTTP ${finto.status})`);
      const routine = await rest('GET', `/routines/${owner.uid}`, null, intruso.token);
      verifica(routine.status === 403, `un altro account legge la tua routine (HTTP ${routine.status})`);
    });
    await passo(page, 'Regole Firestore: il proprietario di un elemento non si cambia', async () => {
      const c = vivi()[0];
      const token = await page.evaluate(async () => {
        const db = await new Promise(res => { const r = indexedDB.open('firebaseLocalStorageDb'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); });
        if (!db) return null;
        return new Promise(res => {
          const q = db.transaction('firebaseLocalStorage').objectStore('firebaseLocalStorage').getAll();
          q.onsuccess = () => res(q.result.map(x => x.value?.stsTokenManager?.accessToken).find(Boolean) || null);
          q.onerror = () => res(null);
        });
      });
      verifica(token, 'token di accesso non trovato nel browser');
      const cambio = await rest('PATCH', `/projects/${c.id}?updateMask.fieldPaths=userId`, { fields: { userId: { stringValue: intruso.uid } } }, token);
      verifica(cambio.status === 403, `il proprietario si può cambiare (HTTP ${cambio.status})`);
    });
    await passo(page, 'Vault sul backend: chiuso agli altri account', async () => {
      const fuori = await fetch(`${BACKEND}/api/vault/last-sync`, { headers: { Authorization: `Bearer ${intruso.token}` } });
      verifica(fuori.status === 403, `un altro account entra nel vault (HTTP ${fuori.status})`);
      const senza = await fetch(`${BACKEND}/api/vault/last-sync`);
      verifica(senza.status === 401, `senza accesso il vault risponde ${senza.status}`);
    });

    // ── telefono ──
    const { defaultBrowserType: _tipo, ...iphone } = devices['iPhone 13'];
    const tel = await browser.newContext({ ...iphone, locale: 'it-IT', timezoneId: 'Europe/Rome' });
    await preparaContesto(tel);
    const pt = await tel.newPage();
    ascolta(pt);
    await passo(page, 'Telefono: accesso e tutte le sezioni dal menu in basso', async () => {
      fotoDa = pt;
      await entra(pt);
      const rotte = [];
      const voci = pt.locator('nav.bottomnav a');
      const n = await voci.count();
      verifica(n >= 7, `menu in basso con ${n} voci`);
      for (let i = 0; i < n; i++) {
        await voci.nth(i).click();
        await pt.waitForTimeout(400);
        if (!(await senzaOverflow(pt))) rotte.push(`${(await voci.nth(i).innerText()).trim()}: esce dai bordi`);
      }
      verifica(!rotte.length, rotte.join('; '));
    });
    await passo(page, 'Telefono: il form di un elemento sta nello schermo', async () => {
      fotoDa = pt;
      await pt.goto(`${APP}#/elementi`);
      await pt.getByRole('button', { name: 'Nuovo', exact: true }).click();
      const box = await finestra(pt).boundingBox();
      verifica(box && box.x >= -1 && box.x + box.width <= iphone.viewport.width + 1, 'la finestra esce dallo schermo');
      verifica(await senzaOverflow(pt), 'la pagina scorre di lato con il form aperto');
    });
    await tel.close();

    await passo(page, 'Esci: torna la schermata del codice', async () => {
      await page.getByRole('button', { name: 'Menu utente' }).click();
      await page.getByRole('menuitem', { name: 'Esci' }).click();
      await page.getByRole('button', { name: '1', exact: true }).waitFor({ timeout: 10000 });
    });
  } catch (e) {
    passi.push({ nome: 'Collaudo interrotto', esito: 'ko', dettaglio: e.message, foto: '', erroriJs: [] });
    console.log(`\n  ✗ Collaudo interrotto: ${e.message}`);
  } finally {
    await browser?.close().catch(() => {});
    await anteprima?.close().catch(() => {});
    chiudiFigli();
  }

  if (bloccate.size) osservazioni.push(`Rete: l'app ha cercato di contattare ${[...bloccate].join(', ')}. Richieste bloccate dal collaudatore: verificare se servono davvero.`);
  if (/Error|Errore/i.test(logBackend)) osservazioni.push('Il backend ha scritto errori nel suo log: vedi backend.log nella cartella del referto.');
  fs.writeFileSync(path.join(OUT, 'backend.log'), logBackend);
  fs.writeFileSync(path.join(OUT, 'emulatori.log'), logEmulatori);
  const file = scriviReferto();
  const n = t => passi.filter(p => p.esito === t).length;
  fs.writeFileSync(path.join(REFERTI, 'ultimo.json'), JSON.stringify({
    quando: new Date().toISOString(), seme: SEME, referto: file,
    conteggi: { ok: n('ok'), avviso: n('avviso'), ko: n('ko') },
    elementi: creati.map(c => ({ nome: c.nome, tipo: c.tipo, scadenza: c.scadenza, eliminato: !!c.eliminato })),
    mosse, osservazioni,
    problemi: passi.filter(p => p.esito !== 'ok').map(p => ({ passo: p.nome, esito: p.esito, dettaglio: p.dettaglio, erroriJs: p.erroriJs })),
  }, null, 2));
  console.log(`\n${n('ok')} ok · ${n('avviso')} con errori JS · ${n('ko')} falliti · ${osservazioni.length} osservazioni`);
  console.log(`Seme ${SEME} — per rifare questo giro: npm run collauda -- --seme ${SEME}`);
  console.log(`Referto: ${file}\n`);
  if (APRI) exec(`start "" "${file}"`);
  process.exitCode = n('ko') || n('avviso') ? 1 : 0;
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function scriviReferto() {
  const n = t => passi.filter(p => p.esito === t).length;
  const riga = p => `
    <details class="passo ${p.esito}"${p.esito === 'ok' ? '' : ' open'}>
      <summary><span class="dot"></span>${esc(p.nome)}${p.dettaglio ? `<span class="det">${esc(p.dettaglio)}</span>` : ''}</summary>
      ${p.erroriJs.length ? `<ul class="err">${p.erroriJs.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
      ${p.foto ? `<a href="${p.foto}" target="_blank"><img loading="lazy" src="${p.foto}" alt=""></a>` : ''}
    </details>`;
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Collaudo Gestionale X ${stamp}</title>
<style>
  :root{--bg:#fff;--fg:#111;--mut:#777;--line:#e5e5e5;--ko:#c0392b}
  @media (prefers-color-scheme:dark){:root{--bg:#111;--fg:#eee;--mut:#888;--line:#2a2a2a;--ko:#ff6b5b}}
  body{background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif;max-width:860px;margin:0 auto;padding:40px 16px}
  h1{font-weight:600;letter-spacing:-.02em;margin:0}
  .sub{color:var(--mut);margin:4px 0 28px}
  .sub code{color:var(--fg)}
  .conta{display:flex;gap:28px;margin-bottom:32px;font-variant-numeric:tabular-nums}
  .conta b{display:block;font-size:32px;font-weight:600}
  .conta span{color:var(--mut);font-size:13px}
  .conta .rosso b{color:var(--ko)}
  .giro{color:var(--mut);font-size:13px;margin:0 0 28px}
  .giro b{color:var(--fg);font-weight:500}
  .oss{border-left:3px solid var(--fg);padding:4px 14px;margin:0 0 28px}
  .passo{border-top:1px solid var(--line)}
  summary{cursor:pointer;padding:10px 0;list-style:none;display:flex;align-items:baseline;gap:10px}
  summary::-webkit-details-marker{display:none}
  .dot{width:8px;height:8px;border-radius:50%;border:1.5px solid var(--fg);flex-shrink:0;transform:translateY(-1px)}
  .ok .dot{background:var(--fg)}
  .ko .dot{background:var(--ko);border-color:var(--ko)}
  .ko summary{color:var(--ko)}
  .det{color:var(--mut);font-size:13px;margin-left:auto;text-align:right}
  .err{color:var(--ko);font:12px ui-monospace,monospace;margin:0 0 10px}
  img{width:100%;border:1px solid var(--line);margin-bottom:14px}
</style></head><body>
<h1>Collaudo Gestionale X</h1>
<p class="sub">${new Date().toLocaleString('it-IT')} · seme <code>${SEME}</code> · emulatori Firebase, progetto finto · pieno = ok, vuoto = errori JS, rosso = fallito</p>
<div class="conta">
  <div><b>${n('ok')}</b><span>ok</span></div>
  <div><b>${n('avviso')}</b><span>con errori JS</span></div>
  <div class="${n('ko') ? 'rosso' : ''}"><b>${n('ko')}</b><span>falliti</span></div>
</div>
<p class="giro"><b>Il giro di oggi</b> — ${mosse.map(esc).join('; ')}.<br>
Per rifarlo identico: <code>npm run collauda -- --seme ${SEME}</code></p>
${osservazioni.map(o => `<p class="oss">${esc(o)}</p>`).join('')}
${passi.map(riga).join('')}
</body></html>`;
  const file = path.join(OUT, 'referto.html');
  fs.writeFileSync(file, html);
  return file;
}

main();
