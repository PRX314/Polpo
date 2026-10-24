// Service worker del gestionale: riceve le push e apre l'app al tocco.
//
// L'icona di ripiego punta a icon-192.png dentro lo scope. Prima era
// 'vite.svg' con il percorso assoluto, che sotto /gestionale/ non esiste: le
// notifiche arrivavano con il quadratino grigio del browser al posto del polpo.

const ICONA = self.registration.scope + 'icon-192.png'

// ---- L'app si apre anche senza rete (dal 24/10/2026)
//
// I dati erano gia' offline (cache di Firestore), ma la pagina no: senza campo la PWA mostrava
// l'errore del browser. Due regole sole:
//   - la pagina (navigazione): prima la rete, cosi' una versione nuova arriva subito; senza rete
//     l'ultima copia salvata. Mai "prima la cache" sull'HTML: e' cio' che lascia app vecchie in giro.
//   - /assets/: i file di Vite hanno l'impronta nel nome e non cambiano mai, quindi cache e basta.
// Tutto il resto (Firebase, Render, font) passa come prima.
const CACHE = 'gestionale-shell-v1'
const PAGINA = self.registration.scope
const MAX_FILE = 80   // le versioni vecchie dei file si accumulano: si tengono gli ultimi 80

// La pagina e i file che dichiara (script, stili, moduli precaricati): al primo avvio vengono
// scaricati prima che questo service worker prenda il controllo, quindi senza questo passo una
// riapertura offline troverebbe la pagina ma non i file, cioe' uno schermo bianco.
const salvaPagina = async (risposta) => {
  const cache = await caches.open(CACHE)
  await cache.put(PAGINA, risposta.clone())
  const html = await risposta.text()
  const file = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map(m => new URL(m[1], PAGINA).href)
  await Promise.all(file.map(async (u) => { if (!(await cache.match(u))) await cache.add(u).catch(() => {}) }))
}

self.addEventListener('install', (event) => {
  event.waitUntil(fetch(PAGINA).then(r => (r.ok ? salvaPagina(r) : null)).catch(() => {}).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys()
    .then(nomi => Promise.all(nomi.filter(n => n.startsWith('gestionale-shell-') && n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim())
))

const tieni = async (chiave, risposta) => {
  const cache = await caches.open(CACHE)
  await cache.put(chiave, risposta)
  const chiavi = await cache.keys()
  if (chiavi.length > MAX_FILE) await Promise.all(chiavi.slice(0, chiavi.length - MAX_FILE).filter(k => k.url !== PAGINA).map(k => cache.delete(k)))
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || !req.url.startsWith(PAGINA)) return

  if (req.mode === 'navigate') {
    event.respondWith(fetch(req)
      .then(res => { if (res.ok) event.waitUntil(salvaPagina(res.clone()).catch(() => {})); return res })
      .catch(() => caches.match(PAGINA).then(copia => copia || Response.error())))
    return
  }

  if (new URL(req.url).pathname.includes('/assets/')) {
    // ignoreVary: gli script modulo partono con l'intestazione Origin, i file salvati da salvaPagina
    // no; con "Vary: Origin" la cache non li riconosceva e offline restava lo schermo di caricamento
    event.respondWith(caches.match(req, { ignoreVary: true }).then(copia => copia || fetch(req).then(res => {
      if (res.ok) event.waitUntil(tieni(req, res.clone()))
      return res
    })))
  }
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '🐙 Gestionale Polpo', {
      body: data.body || '',
      icon: data.icon || ICONA,
      badge: data.badge || ICONA,
      vibrate: [200, 100, 200],
      tag: data.tag || 'polpo',
      renotify: true,
      data: { url: data.url || self.registration.scope }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destinazione = event.notification.data?.url || self.registration.scope

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((finestre) => {
      // Se l'app e' gia' aperta la portiamo in primo piano invece di aprirne
      // un'altra copia, e la mandiamo dove punta la notifica.
      for (const f of finestre) {
        if (f.url.startsWith(self.registration.scope)) {
          return f.focus().then((c) => (c.navigate ? c.navigate(destinazione) : c))
        }
      }
      return self.clients.openWindow(destinazione)
    })
  )
})
