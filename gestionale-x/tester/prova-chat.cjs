// Prova della chat con il modello VERO, su dati finti: emulatori Firebase come il collaudatore,
// ma /api/chat/stream arriva al backend locale con la chiave Groq di backend/.env.
// Serve a vedere la chat che lavora davvero: citazioni @, letture (scheda, vault, agenda),
// ragionamento, nomi cliccabili. Non tocca il progetto Firebase vero.
//
//   node tester/prova-chat.cjs            → screenshot in tester/referti/chat-<data-ora>/
//   node tester/prova-chat.cjs --vedi     → con la finestra
//
// A differenza del collaudo costa qualche centesimo di Groq e dipende dalla rete: non sta in PLANCIA.
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const { chromium, devices } = require(path.join(ROOT, 'node_modules', 'playwright'));
const VEDI = process.argv.includes('--vedi');
const PROGETTO = 'demo-gestionale-x';
const PORTE = { firestore: 8299, auth: 9299, app: 5297, backend: 5097 };
const APP = `http://127.0.0.1:${PORTE.app}/gestionale/`;
const BACKEND = `http://127.0.0.1:${PORTE.backend}`;
const CACHE = path.join(__dirname, 'cache');
const OUT = path.join(__dirname, 'referti', `chat-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}`);
const EMAIL = 'paoloandrearepetto@gmail.com';
const PIN = String(crypto.randomInt(100000, 1000000));

const oggi = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
const traGiorni = n => { const d = new Date(`${oggi()}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

// ── Firestore dell'emulatore, via REST (token "owner" = amministratore) ──
const FS = `http://127.0.0.1:${PORTE.firestore}/v1/projects/${PROGETTO}/databases/(default)/documents`;
const aFs = v => v === null || v === undefined ? { nullValue: null }
  : typeof v === 'string' ? { stringValue: v }
    : typeof v === 'boolean' ? { booleanValue: v }
      : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
        : v instanceof Date ? { timestampValue: v.toISOString() }
          : Array.isArray(v) ? { arrayValue: { values: v.map(aFs) } }
            : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aFs(x)])) } };
const scrivi = (coll, id, dati) => fetch(`${FS}/${coll}/${id}`, {
  method: 'PATCH', headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: aFs(dati).mapValue.fields }),
});

// ── avvio (come tester/collauda.cjs) ──
const figli = [];
let logBackend = '';
const aspettaUrl = async (url, secondi, nome) => {
  const fine = Date.now() + secondi * 1000;
  while (Date.now() < fine) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(2000) }); if (r.status < 500) return; } catch { /* non ancora */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`${nome} non risponde`);
};
async function avviaEmulatori() {
  const jdk = fs.readdirSync(CACHE).find(d => /^jdk-21/.test(d));
  const env = { ...process.env };
  if (jdk) { env.JAVA_HOME = path.join(CACHE, jdk); env.PATH = `${path.join(CACHE, jdk, 'bin')}${path.delimiter}${process.env.PATH}`; }
  const envNpm = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^npm_config_prefix$/i.test(k)));
  const radice = spawnSync('npm root -g', { encoding: 'utf8', shell: true, env: envNpm }).stdout?.trim();
  fs.copyFileSync(path.join(ROOT, 'firestore.rules'), path.join(CACHE, 'firestore.rules'));
  const cli = path.join(radice, 'firebase-tools', 'lib', 'bin', 'firebase.js');
  figli.push(spawn(process.execPath, [cli, 'emulators:start', '--only', 'firestore,auth', '--project', PROGETTO], { cwd: __dirname, env, windowsHide: true }));
  await aspettaUrl(`http://127.0.0.1:${PORTE.firestore}/`, 240, 'Emulatore Firestore');
  await aspettaUrl(`http://127.0.0.1:${PORTE.auth}/`, 60, 'Emulatore Auth');
}
function chiaveGroq() {
  const env = fs.readFileSync(path.join(ROOT, 'backend', '.env'), 'utf8');
  const m = env.match(/^GROQ_API_KEY=(.+)$/m);
  if (!m) throw new Error('GROQ_API_KEY non trovata in backend/.env');
  return m[1].trim();
}
async function avviaBackend(vault) {
  const env = {
    ...process.env, PORT: String(PORTE.backend), GCLOUD_PROJECT: PROGETTO,
    FIRESTORE_EMULATOR_HOST: `127.0.0.1:${PORTE.firestore}`, FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${PORTE.auth}`,
    FIREBASE_SERVICE_ACCOUNT: '', GROQ_API_KEY: chiaveGroq(), NVIDIA_API_KEY: '', GITHUB_TOKEN: '', VAPID_PRIVATE_KEY: '', VAULT_PATH: vault,
  };
  const figlio = spawn(process.execPath, [path.join(ROOT, 'backend', 'server.js')], { cwd: CACHE, env, windowsHide: true });
  figlio.stdout.on('data', d => { logBackend += d; });
  figlio.stderr.on('data', d => { logBackend += d; });
  figli.push(figlio);
  await aspettaUrl(`${BACKEND}/api/health`, 30, 'Backend');
  if (!/Emulatori Firebase/.test(logBackend)) throw new Error('Backend non in modalità emulatori');
}
async function avviaApp() {
  const vite = await import(pathToFileURL(path.join(ROOT, 'node_modules', 'vite', 'dist', 'node', 'index.js')).href);
  Object.assign(process.env, { VITE_EMULATORI: '1', VITE_EMU_FIRESTORE: `127.0.0.1:${PORTE.firestore}`, VITE_EMU_AUTH: `http://127.0.0.1:${PORTE.auth}`, VITE_AI_API_URL: '' });
  const outDir = path.join(CACHE, 'app');
  await vite.build({ root: ROOT, mode: 'collaudo', logLevel: 'error', build: { outDir, emptyOutDir: true } });
  await vite.preview({ root: ROOT, mode: 'collaudo', logLevel: 'error', build: { outDir }, preview: { port: PORTE.app, strictPort: true, host: '127.0.0.1' } });
}
const chiudi = () => { for (const f of figli) if (f.exitCode === null) spawnSync('taskkill', ['/pid', String(f.pid), '/T', '/F'], { windowsHide: true }); };

// ── dati finti, abbastanza ricchi da far lavorare Polpo ──
function preparaVault() {
  const dir = path.join(os.tmpdir(), 'gestionale-prova-chat-vault');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, '20-Projects'), { recursive: true });
  fs.writeFileSync(path.join(dir, '20-Projects', 'Bottega.md'), `---
type: project
status: active
---

# Bottega

## Visione
E-commerce minimal nostro, da riusare per i clienti. Primo cliente candidato: Freak.

## Decisioni recenti
- **${traGiorni(-1)}**: scelto Cloudflare Workers + D1 + R2; Stripe Checkout solo in fase 2. Scartato YourNextStore perché dipende dal loro servizio.
- **${traGiorni(-3)}**: obbligatorio il pulsante di recesso; niente piattaforma ODR.

## Roadmap
- [x] Fase 1: catalogo, varianti, foto, vetrina
- [ ] Fase 2: pagamenti con Stripe Checkout
- [ ] Riserva della giacenza durante il pagamento
`);
  return dir;
}
async function preparaDati(uid) {
  const adesso = new Date();
  const el = (id, d) => scrivi('projects', id, { tags: [], todos: [], sections: [], links: [], roadmap: '', obiettivi: '', deadline: null, deadlineTime: '', userId: uid, createdAt: adesso, updatedAt: adesso, ...d });
  await el('bottega', {
    type: 'progetto', name: 'Bottega', status: 'in_progress', pinned: true, vaultNote: 'Bottega',
    description: 'Base e-commerce minimal su Cloudflare, riusabile per i clienti.',
    tags: ['ecommerce', 'cloudflare'],
    sections: [{ id: 's1', icon: '💰', title: 'Costi', content: 'Workers gratis fino a 100k richieste/giorno. Stripe 1,5% + 0,25 € a transazione.' }],
    todos: [
      { id: 't1', text: 'Collegare Stripe Checkout in modalità test', completed: false, deadline: traGiorni(5) },
      { id: 't2', text: 'Scrivere la pagina del diritto di recesso', completed: false, deadline: traGiorni(20) },
      { id: 't3', text: 'Catalogo e varianti', completed: true },
    ],
  });
  await el('freak', { type: 'progetto', name: 'Freak — negozio', status: 'pending', description: 'Negozio di abbigliamento, primo cliente di Bottega.', todos: [{ id: 'f1', text: 'Chiedere le foto dei prodotti', completed: false, deadline: traGiorni(35) }] });
  await el('ungesto', { type: 'progetto', name: 'Ungesto', status: 'in_progress', description: 'Gestionale per bar e ristoranti con menu digitale.' });
  await el('monologo', { type: 'monologo', name: 'Monologo sul traffico', status: 'pending', description: 'Pezzo comico sulla coda in tangenziale.' });
  for (let i = 1; i <= 25; i++) await el(`riempitivo-${i}`, { type: i % 3 ? 'idea' : 'progetto', name: `Idea numero ${i}`, status: 'pending', description: `Un'idea qualsiasi, la numero ${i}.` });
  await scrivi('events', 'dentista', { title: 'Dentista', date: traGiorni(40), time: '10:00', userId: uid, createdAt: adesso, updatedAt: adesso });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  let browser;
  try {
    console.log('Avvio emulatori, backend (Groq vero) e app…');
    await avviaEmulatori();
    const r = await fetch(`http://127.0.0.1:${PORTE.auth}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PIN, returnSecureToken: true }),
    });
    const { localId: uid } = await r.json();
    await avviaBackend(preparaVault());
    await avviaApp();
    await preparaDati(uid);

    browser = await chromium.launch({ headless: !VEDI });
    const prova = async (nome, ctxOpts, fn) => {
      const ctx = await browser.newContext({ locale: 'it-IT', timezoneId: 'Europe/Rome', ...ctxOpts });
      // Il browser parla solo con questo PC; /api va al backend locale
      await ctx.route('**/*', route => {
        const u = new URL(route.request().url());
        if (!/^https?:$/.test(u.protocol)) return route.continue();
        if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') return route.abort('blockedbyclient');
        if (u.pathname.startsWith('/api/') && String(u.port) !== String(PORTE.backend)) return route.continue({ url: BACKEND + u.pathname + u.search });
        return route.continue();
      });
      const page = await ctx.newPage();
      const errori = [];
      page.on('pageerror', e => errori.push(e.message));
      page.on('console', m => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT|gestionale-push/.test(m.text())) errori.push(m.text()); });
      await page.goto(APP);
      await page.getByRole('button', { name: '1', exact: true }).waitFor({ timeout: 20000 });
      await page.keyboard.type(PIN, { delay: 30 });
      await page.getByRole('navigation', { name: 'Sezioni' }).first().waitFor({ timeout: 20000 });
      await page.goto(`${APP}#/ai`);
      await page.getByLabel('Messaggio').waitFor();
      try { await fn(page); } finally {
        console.log(`  ${nome}: ${errori.length ? `errori JS: ${errori.join(' | ')}` : 'nessun errore JS'}`);
        await ctx.close();
      }
    };
    const foto = (page, nome) => page.screenshot({ path: path.join(OUT, `${nome}.png`) });
    const aspettaRisposta = async (page) => {
      await page.locator('.chat-msg.assistant .chat-meta').last().waitFor({ timeout: 120000 });
      await page.waitForFunction(() => !document.querySelector('.is-streaming'), null, { timeout: 120000 });
      await page.waitForTimeout(400);
    };

    await prova('computer', { viewport: { width: 1280, height: 860 } }, async (page) => {
      const campo = page.getByLabel('Messaggio');
      await campo.click();
      await campo.pressSequentially('Come procede @Bot', { delay: 30 });
      await page.locator('.chat-menzioni').waitFor();
      await foto(page, '01-menu-citazioni');
      await campo.press('Enter');
      await campo.pressSequentially('e qual è la prossima cosa da fare? Cosa abbiamo deciso di recente?', { delay: 5 });
      await foto(page, '02-citato');
      await campo.press('Enter');
      await page.locator('.chat-passaggi.is-live').waitFor({ timeout: 30000 });
      await foto(page, '03-sta-lavorando');
      await aspettaRisposta(page);
      await foto(page, '04-risposta');
      const link = page.locator('.chat-msg.assistant .prose a.link-el').first();
      console.log(`  nomi cliccabili nella risposta: ${await page.locator('.chat-msg.assistant .prose a.link-el').count()}`);
      await page.getByRole('button', { name: 'Come ci ha ragionato' }).last().click();
      await foto(page, '05-ragionamento');

      await campo.pressSequentially('Cosa ho in agenda nei prossimi due mesi, appuntamenti compresi?', { delay: 5 });
      await campo.press('Enter');
      await page.waitForTimeout(800);
      await aspettaRisposta(page);
      await foto(page, '06-agenda');

      await campo.pressSequentially('C\'è qualcosa nei miei progetti che parla di tangenziale?', { delay: 5 });
      await campo.press('Enter');
      await page.waitForTimeout(800);
      await aspettaRisposta(page);
      await foto(page, '07-ricerca');

      if (await link.count()) {
        await link.click();
        await page.waitForURL(/#\/elementi\//, { timeout: 5000 });
        console.log(`  clic sul nome → ${page.url().split('#')[1]}`);
        await foto(page, '08-clic-sul-nome');
      }
      const testi = await page.locator('.chat-msg').allInnerTexts();
      fs.writeFileSync(path.join(OUT, 'conversazione.txt'), testi.join('\n\n────────\n\n'));
    });

    await prova('telefono', { ...devices['iPhone 13'], browserName: undefined }, async (page) => {
      await page.waitForTimeout(1500);
      await foto(page, '09-telefono-conversazione');
      await page.getByRole('button', { name: 'Cita un elemento' }).click();
      await page.locator('.chat-menzioni').waitFor();
      await foto(page, '10-telefono-menu');
    });
    console.log(`\nScreenshot in ${OUT}`);
  } catch (e) {
    console.error('ERRORE:', e.message);
    console.error(logBackend.split('\n').slice(-15).join('\n'));
    process.exitCode = 1;
  } finally {
    await browser?.close();
    chiudi();
    console.log(logBackend.split('\n').filter(l => l.includes('⏱')).join('\n'));
    process.exit();
  }
}
main();
