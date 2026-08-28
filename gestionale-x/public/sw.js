// Service Worker for Gestionale Polpo - Push Notifications

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()

  const options = {
    body: data.body || '',
    icon: data.icon || self.registration.scope + 'vite.svg',
    badge: data.badge || self.registration.scope + 'vite.svg',
    vibrate: [200, 100, 200],
    tag: data.tag || 'polpo-notification',
    renotify: true,
    actions: [
      { action: 'open', title: 'Apri' },
      { action: 'close', title: 'Chiudi' }
    ],
    data: {
      url: data.url || self.registration.scope
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '🐙 Gestionale Polpo', options)
  )
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // If already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          return client.focus()
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(event.notification.data?.url || self.registration.scope)
    })
  )
})
