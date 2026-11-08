// Ponte verso Sonora, il laboratorio dei suoni di Paolo: gira solo sul suo PC (localhost:5190),
// quindi funziona dal PC dove Sonora è accesa e basta. Le registrazioni degli appunti partono
// come WAV sulla stessa strada che usa la stanza Mani (POST /api/libreria binario); Sonora
// riconosce il nostro sito con il permesso CORS.

export const SONORA_URL = import.meta.env.VITE_SONORA_URL || 'http://localhost:5190'

// È accesa? Risponde in fretta se sì, altrimenti il browser rifiuta la connessione.
export async function sonoraAccesa() {
  try {
    const r = await fetch(`${SONORA_URL}/api/stato`, { signal: AbortSignal.timeout(1500) })
    return r.ok
  } catch { return false }
}

// AudioBuffer → WAV PCM 16 bit (stessa scrittura di Sonora/public/js/wav.js)
export function inWav(buf) {
  const canali = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate
  const dati = n * canali * 2
  const out = new DataView(new ArrayBuffer(44 + dati))
  const scrivi = (o, s) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)))
  scrivi(0, 'RIFF'); out.setUint32(4, 36 + dati, true); scrivi(8, 'WAVE')
  scrivi(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true)
  out.setUint16(22, canali, true); out.setUint32(24, sr, true)
  out.setUint32(28, sr * canali * 2, true); out.setUint16(32, canali * 2, true); out.setUint16(34, 16, true)
  scrivi(36, 'data'); out.setUint32(40, dati, true)
  const ch = [...Array(canali)].map((_, c) => buf.getChannelData(c))
  let o = 44
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < canali; c++) {
      const v = Math.max(-1, Math.min(1, ch[c][i]))
      out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true)
      o += 2
    }
  }
  return new Blob([out.buffer], { type: 'audio/wav' })
}

// Il browser decodifica il webm/mp4 della registrazione e lo riscrive in WAV: Sonora vuole solo quello.
export async function inWavDaBlob(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ctx = new Ctx()
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer())
    return { wav: inWav(buf), durata: buf.duration }
  } finally { ctx.close?.() }
}

// Manda una registrazione nella libreria di Sonora. Ritorna la voce creata.
export async function mandaASonora(blob, { titolo }) {
  const { wav, durata } = await inWavDaBlob(blob)
  const q = new URLSearchParams({ titolo: titolo.slice(0, 80), durata: durata.toFixed(2), fonte: 'gestionale' })
  const r = await fetch(`${SONORA_URL}/api/libreria?${q}`, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wav })
    .catch(() => { throw new Error('Sonora non risponde: accendila sul PC (avvia.bat) e riprova.') })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.errore || `Sonora ha risposto ${r.status}`)
  return d
}
