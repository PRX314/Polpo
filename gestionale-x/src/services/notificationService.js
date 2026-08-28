// Notification Service - Push notifications + local fallback
import { auth } from '../firebase'

const API_URL = import.meta.env.VITE_AI_API_URL || ''
const NOTIFICATION_CHECK_INTERVAL = 60 * 60 * 1000
const NOTIFIED_KEY = 'polpo_notified_deadlines'

// ============================================================================
// LOCAL NOTIFICATION FALLBACK (when push not available)
// ============================================================================

function getNotified() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}')
  } catch {
    return {}
  }
}

function markNotified(key) {
  const notified = getNotified()
  notified[key] = Date.now()
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  for (const k in notified) {
    if (notified[k] < weekAgo) delete notified[k]
  }
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(notified))
}

function wasNotified(key) {
  return !!getNotified()[key]
}

function showLocalNotification(title, body, tag) {
  if (Notification.permission !== 'granted') return
  const n = new Notification(title, { body, tag, requireInteraction: false })
  n.onclick = () => { window.focus(); n.close() }
  setTimeout(() => n.close(), 10000)
}

// ============================================================================
// PUSH SUBSCRIPTION (Service Worker + Web Push)
// ============================================================================

let swRegistration = null

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    // percorso relativo alla base (funziona sia su / che su /gestionale/)
    swRegistration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
    console.log('Service Worker registrato')
    return swRegistration
  } catch (err) {
    console.error('Errore registrazione SW:', err)
    return null
  }
}

export async function subscribeToPush() {
  if (!swRegistration) await registerServiceWorker()
  if (!swRegistration) return false

  try {
    // Get VAPID key from backend
    const vapidRes = await fetch(`${API_URL}/api/push/vapid-key`)
    const { publicKey } = await vapidRes.json()

    // Convert VAPID key
    const applicationServerKey = urlBase64ToUint8Array(publicKey)

    // Subscribe to push
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    })

    // Send subscription to backend
    const token = await auth.currentUser?.getIdToken()
    if (!token) return false

    await fetch(`${API_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription: subscription.toJSON() })
    })

    console.log('Push subscription attiva')
    return true
  } catch (err) {
    console.error('Errore push subscribe:', err)
    return false
  }
}

export async function unsubscribeFromPush() {
  if (!swRegistration) return
  try {
    const subscription = await swRegistration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }

    const token = await auth.currentUser?.getIdToken()
    if (token) {
      await fetch(`${API_URL}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
    }
  } catch (err) {
    console.error('Errore unsubscribe:', err)
  }
}

export async function isPushSubscribed() {
  if (!swRegistration) await registerServiceWorker()
  if (!swRegistration) return false
  const subscription = await swRegistration.pushManager.getSubscription()
  return !!subscription
}

// ============================================================================
// PERMISSION & SETUP
// ============================================================================

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// Full setup: request permission + register SW + subscribe to push
export async function setupPushNotifications() {
  const granted = await requestNotificationPermission()
  if (!granted) return false

  await registerServiceWorker()
  const subscribed = await subscribeToPush()
  return subscribed
}

// ============================================================================
// LOCAL DEADLINE CHECKER (fallback when push not working)
// ============================================================================

export function checkDeadlines(projects) {
  if (Notification.permission !== 'granted') return

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  projects.forEach(project => {
    if (project.deadline) {
      const deadline = new Date(project.deadline)
      deadline.setHours(0, 0, 0, 0)
      const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

      if (diffDays === 0 && !wasNotified(`project-today-${project.id}`)) {
        showLocalNotification('⚠️ Scadenza oggi!', `"${project.name}" scade oggi!`, `project-today-${project.id}`)
        markNotified(`project-today-${project.id}`)
      } else if (diffDays === 1 && !wasNotified(`project-tomorrow-${project.id}`)) {
        showLocalNotification('📅 Scadenza domani', `"${project.name}" scade domani`, `project-tomorrow-${project.id}`)
        markNotified(`project-tomorrow-${project.id}`)
      } else if (diffDays === 3 && !wasNotified(`project-3days-${project.id}`)) {
        showLocalNotification('📅 Tra 3 giorni', `"${project.name}" scade tra 3 giorni`, `project-3days-${project.id}`)
        markNotified(`project-3days-${project.id}`)
      } else if (diffDays < 0 && !wasNotified(`project-overdue-${project.id}`)) {
        showLocalNotification('🚨 Scaduto!', `"${project.name}" era in scadenza ${Math.abs(diffDays)}g fa`, `project-overdue-${project.id}`)
        markNotified(`project-overdue-${project.id}`)
      }
    }

    (project.todos || []).forEach((todo, i) => {
      if (todo.deadline && !todo.completed) {
        const deadline = new Date(todo.deadline)
        deadline.setHours(0, 0, 0, 0)
        const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
        const key = `todo-${project.id}-${i}`

        if (diffDays === 0 && !wasNotified(`${key}-today`)) {
          showLocalNotification('✅ Task oggi!', `"${todo.text}" (${project.name})`, `${key}-today`)
          markNotified(`${key}-today`)
        } else if (diffDays === 1 && !wasNotified(`${key}-tomorrow`)) {
          showLocalNotification('✅ Task domani', `"${todo.text}" (${project.name})`, `${key}-tomorrow`)
          markNotified(`${key}-tomorrow`)
        }
      }
    })
  })
}

let checkInterval = null

export function startDeadlineChecker(getProjects) {
  if (checkInterval) clearInterval(checkInterval)
  checkDeadlines(getProjects())
  checkInterval = setInterval(() => checkDeadlines(getProjects()), NOTIFICATION_CHECK_INTERVAL)
}

export function stopDeadlineChecker() {
  if (checkInterval) { clearInterval(checkInterval); checkInterval = null }
}

// ============================================================================
// UTILS
// ============================================================================

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
