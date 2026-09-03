// Service worker del gestionale: riceve le push e apre l'app al tocco.
//
// L'icona di ripiego punta a icon-192.png dentro lo scope. Prima era
// 'vite.svg' con il percorso assoluto, che sotto /gestionale/ non esiste: le
// notifiche arrivavano con il quadratino grigio del browser al posto del polpo.

const ICONA = self.registration.scope + 'icon-192.png'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

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
