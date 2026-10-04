// Push e sveglie su Cloudflare; ripiego locale solo quando non risultano registrate.
import { auth } from '../firebase'

const FN = '/api/gestionale-push'
const INTERVALLO_CONTROLLO = 60 * 60 * 1000
const CHIAVE_INVIATE = 'polpo_notified_deadlines'
const ICONA = `${import.meta.env.BASE_URL}icon-192.png`

// Chiave pubblica VAPID: e' pubblica per definizione (finisce comunque nel
// bundle servito a chiunque), quindi sta qui invece di costare una chiamata di
// rete al server addormentato solo per leggerla.
const VAPID_PUBLIC = 'BEluLj80kUivOmje8jrT0rgeuJHICXPhhxF-lfFM0Yna8ZMvy8__r8BKt4G8CnM4r4KObZaYh6oXMyiB1pjSJEQ'

// ============================================================================
// STATO DEL DISPOSITIVO
// ============================================================================

export const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // gli iPad recenti si spacciano per Mac: il touch li smaschera
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isInstallata = () =>
  window.navigator.standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

// Perche' le notifiche non si possono attivare, quando non si possono.
// Su iPhone Apple le concede solo alle app aggiunte alla schermata Home e
// aperte dalla loro icona: da una scheda Safari, o da un collegamento, non
// esiste alcun modo di riceverle.
export function ostacolo() {
  if (isIOS() && !isInstallata()) return 'installa-ios'
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'non-supportato'
  if (!('PushManager' in window)) return 'niente-push'
  if (Notification.permission === 'denied') return 'negato'
  return null
}

// ============================================================================
// SERVICE WORKER
// ============================================================================

let swRegistration = null

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    // percorso relativo alla base: vale sia in locale che sotto /gestionale/
    swRegistration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
    return swRegistration
  } catch (err) {
    console.error('Registrazione service worker fallita:', err)
    return null
  }
}

async function registrazione() {
  if (swRegistration) return swRegistration
  if (!('serviceWorker' in navigator)) return null
  swRegistration = (await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)) || await registerServiceWorker()
  return swRegistration
}

// ============================================================================
// PUSH
// ============================================================================

async function token() {
  return auth.currentUser?.getIdToken()
}

async function pushRequest(action, subscription) {
  const t = await token()
  if (!t) throw new Error('Sessione scaduta, rientra e riprova')
  const res = await fetch(FN + '/' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
    body: JSON.stringify({ subscription: subscription?.toJSON() }),
    signal: AbortSignal.timeout(15000)
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data) throw new Error(data?.error || 'Servizio notifiche non disponibile')
  return data
}

export async function subscribeToPush() {
  const reg = await registrazione()
  if (!reg?.pushManager) throw new Error('Service worker non disponibile')
  const existing = await reg.pushManager.getSubscription()
  const subscription = existing || await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ToUint8Array(VAPID_PUBLIC)
  })
  try {
    const result = await pushRequest('push-subscribe', subscription)
    if (result.ok !== true) throw new Error('Iscrizione non confermata dal server')
    stopDeadlineChecker()
    return true
  } catch (err) {
    if (!existing) await subscription.unsubscribe().catch(() => {})
    throw err
  }
}

export async function unsubscribeFromPush() {
  const reg = await registrazione()
  const subscription = await reg?.pushManager.getSubscription()
  // Si rimuove solo questo dispositivo; gli altri continuano a ricevere avvisi.
  if (subscription) {
    await pushRequest('push-unsubscribe', subscription)
    await subscription.unsubscribe()
  }
}

export async function isPushSubscribed() {
  const reg = await registrazione()
  const subscription = await reg?.pushManager?.getSubscription()
  if (!subscription) return false
  const status = await pushRequest('push-status', subscription)
  return status.active === true
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

// Attivazione completa: permesso -> service worker -> iscrizione.
// Va chiamata da un gesto dell'utente: quasi tutti i browser rifiutano di
// chiedere il permesso fuori da un click.
export async function setupPushNotifications() {
  if (!(await requestNotificationPermission())) {
    throw new Error('Permesso negato')
  }
  await registerServiceWorker()
  return subscribeToPush()
}

// Chiede al server di mandare subito una notifica, per verificare la catena
// senza aspettare una scadenza vera.
export async function inviaProva() {
  const reg = await registrazione()
  const subscription = await reg?.pushManager?.getSubscription()
  if (!subscription) throw new Error('Attiva prima le notifiche')
  await pushRequest('push-prova', subscription)
  return true
}

// ============================================================================
// RIPIEGO LOCALE (solo browser sul computer, solo a scheda aperta)
// ============================================================================

function inviate() {
  try { return JSON.parse(localStorage.getItem(CHIAVE_INVIATE) || '{}') } catch { return {} }
}

function segna(chiave) {
  const m = inviate()
  m[chiave] = Date.now()
  const settimanaFa = Date.now() - 7 * 86400000
  for (const k in m) if (m[k] < settimanaFa) delete m[k]
  localStorage.setItem(CHIAVE_INVIATE, JSON.stringify(m))
}

// new Notification() non esiste su iOS nemmeno da app installata: li' l'unica
// via e' il service worker. Proviamo sempre prima quella.
async function mostraLocale(title, body, tag) {
  if (getNotificationPermission() !== 'granted') return
  const reg = await registrazione()
  if (reg?.showNotification) {
    await reg.showNotification(title, { body, tag, icon: ICONA, badge: ICONA })
    return
  }
  const n = new Notification(title, { body, tag })
  n.onclick = () => { window.focus(); n.close() }
  setTimeout(() => n.close(), 10000)
}

const oggiIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function checkDeadlines(projects) {
  if (getNotificationPermission() !== 'granted') return
  const oggi = oggiIso()

  // Archiviati e completati non sono scadenze: segnalarli era il difetto che
  // riempiva anche il pannello "Scaduti" del calendario.
  const attivi = projects.filter(p => !p.archived && p.status !== 'completed')

  const righe = []
  for (const p of attivi) {
    if (p.deadline === oggi) righe.push(`\u{1F4C1} ${p.name}`)
    for (const todo of p.todos || []) {
      if (!todo.completed && todo.deadline === oggi) righe.push(`✅ ${todo.text}`)
    }
  }
  if (!righe.length) return

  // Un avviso solo per tutta la giornata, non uno per riga: prima ogni scadenza
  // era una notifica a se', ripetuta a ogni controllo.
  const chiave = `oggi-${oggi}-${righe.length}`
  if (inviate()[chiave]) return
  segna(chiave)
  mostraLocale(
    `\u{1F419} Oggi hai ${righe.length} ${righe.length === 1 ? 'scadenza' : 'scadenze'}`,
    righe.slice(0, 5).join('\n'),
    chiave
  )
}

let timer = null
let checkerVersion = 0

// Parte solo se la push NON e' attiva: altrimenti server e client manderebbero
// lo stesso avviso due volte, che e' esattamente quello che succedeva prima.
export async function startDeadlineChecker(getProjects) {
  stopDeadlineChecker()
  const version = checkerVersion
  const active = await isPushSubscribed().catch(() => false)
  if (active || version !== checkerVersion) return false
  checkDeadlines(getProjects())
  timer = setInterval(() => checkDeadlines(getProjects()), INTERVALLO_CONTROLLO)
  return true
}

export function stopDeadlineChecker() {
  checkerVersion++
  if (timer) { clearInterval(timer); timer = null }
}

// ============================================================================
// UTILI
// ============================================================================

function base64ToUint8Array(base64) {
  const padding = '='.repeat((4 - base64.length % 4) % 4)
  const grezzo = window.atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(grezzo.length)
  for (let i = 0; i < grezzo.length; i++) out[i] = grezzo.charCodeAt(i)
  return out
}
