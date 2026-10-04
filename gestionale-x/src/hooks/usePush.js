import { useEffect, useRef, useState } from 'react'
import {
  registerServiceWorker, startDeadlineChecker, stopDeadlineChecker, isPushSubscribed
} from '../services/notificationService'

// Registra il service worker, tiene d'occhio se le notifiche push sono attive
// e accende il controllo locale delle scadenze solo se la push non lo è.
export function usePush(projects, panelOpen) {
  // null = non ancora saputo, false = da attivare (campanella col segno)
  const [active, setActive] = useState(null)
  const projectsRef = useRef(projects)
  projectsRef.current = projects

  useEffect(() => {
    registerServiceWorker().catch(() => {})
  }, [])

  // Si ricontrolla quando il pannello si chiude, così il segno sparisce appena le attivi
  useEffect(() => {
    if (panelOpen) return
    isPushSubscribed().then(setActive).catch(() => setActive(false))
  }, [panelOpen])

  const count = projects.length
  useEffect(() => {
    if (count === 0 || active !== false) { stopDeadlineChecker(); return }
    startDeadlineChecker(() => projectsRef.current)
      .catch(e => console.warn('Deadline checker failed:', e))
    return stopDeadlineChecker
  }, [count, active])

  return active
}
