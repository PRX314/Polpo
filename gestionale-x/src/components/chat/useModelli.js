import { useEffect, useState } from 'react'
import { getProviders } from '../../services/chatService'

// Con quali modelli risponde Polpo: uno solo = chat normale, più di uno = risposte a confronto.
// È una preferenza tua, uguale per tutte le conversazioni: resta nel browser.
const TARGETS_KEY = 'polpo.chatTargets'
export const MAX_TARGETS = 4

const salvati = () => {
  try { return JSON.parse(localStorage.getItem(TARGETS_KEY)) || [] } catch { return [] }
}

// "openai/gpt-oss-120b" -> "gpt-oss-120b"
export const shortModel = (model) => (model || '').split('/').pop()

export function useModelli() {
  const [providers, setProviders] = useState([])
  const [targets, setTargets] = useState(salvati)

  // Quelli configurati sul server; le scelte salvate che non esistono più si scartano
  useEffect(() => {
    getProviders().then(list => {
      setProviders(list)
      setTargets(prev => {
        const validi = prev.filter(t => list.some(p => p.id === t.provider && p.models.includes(t.model)))
        if (validi.length) return validi
        return list[0] ? [{ provider: list[0].id, model: list[0].defaultModel }] : []
      })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    try { localStorage.setItem(TARGETS_KEY, JSON.stringify(targets)) } catch { /* storage non disponibile */ }
  }, [targets])

  const isOn = (provider, model) => targets.some(t => t.provider === provider && t.model === model)

  // Almeno uno resta sempre acceso
  const toggle = (provider, model) => setTargets(prev => {
    if (prev.some(t => t.provider === provider && t.model === model)) {
      return prev.length > 1 ? prev.filter(t => !(t.provider === provider && t.model === model)) : prev
    }
    return prev.length >= MAX_TARGETS ? prev : [...prev, { provider, model }]
  })

  const etichetta = targets.length > 1 ? `${targets.length} modelli a confronto` : shortModel(targets[0]?.model)

  return { providers, targets, isOn, toggle, etichetta }
}
