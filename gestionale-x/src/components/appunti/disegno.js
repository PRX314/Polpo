// Disegno degli appunti: sfondi, tratti e foto. Lo usa la Lavagna, e serve a ridisegnare
// un disegno salvato (i tratti sono punti, non pixel).
//
// Coordinate in un foglio fisso di 1200 px di larghezza: sul telefono si vede rimpicciolito,
// ma i tratti restano nitidi e uguali su ogni schermo.

export const LARGHEZZA = 1200
const ALTEZZA_FOGLIO = 1600
const LATO_FOTO = 1600

export const COLORI = [
  { value: '#111111', label: 'Nero' }, { value: '#d11f1f', label: 'Rosso' }, { value: '#1f5fd1', label: 'Blu' },
  { value: '#1d8a3a', label: 'Verde' }, { value: '#e0a400', label: 'Giallo' }
]
export const SPESSORI = [3, 6, 12, 24]
export const SFONDI = { bianco: 'Bianco', righe: 'Righe', quadretti: 'Quadretti', foto: 'Foto' }

const linea = (ctx, x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke() }

export function disegnaSfondo(ctx, w, h, sfondo, foto) {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  if (sfondo === 'foto' && foto) { ctx.drawImage(foto, 0, 0, w, h); return }
  if (sfondo === 'righe') {
    ctx.strokeStyle = '#c8d3e3'; ctx.lineWidth = 2
    for (let y = 120; y < h; y += 56) linea(ctx, 0, y, w, y)
    ctx.strokeStyle = '#efb3b3'
    linea(ctx, 110, 0, 110, h)
  }
  if (sfondo === 'quadretti') {
    ctx.strokeStyle = '#d5dde8'; ctx.lineWidth = 1.5
    for (let x = 40; x < w; x += 40) linea(ctx, x, 0, x, h)
    for (let y = 40; y < h; y += 40) linea(ctx, 0, y, w, y)
  }
}

// punti = [x0, y0, x1, y1, …]; curve morbide passando per i punti medi
export const tratto = (ctx, t) => {
  const p = t.punti
  ctx.globalCompositeOperation = t.gomma ? 'destination-out' : 'source-over'
  ctx.strokeStyle = ctx.fillStyle = t.colore
  ctx.lineWidth = t.spessore
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  if (p.length <= 2) {
    ctx.beginPath(); ctx.arc(p[0], p[1], t.spessore / 2, 0, Math.PI * 2); ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(p[0], p[1])
  for (let i = 2; i < p.length - 2; i += 2) ctx.quadraticCurveTo(p[i], p[i + 1], (p[i] + p[i + 2]) / 2, (p[i + 1] + p[i + 3]) / 2)
  ctx.lineTo(p[p.length - 2], p[p.length - 1])
  ctx.stroke()
}

export function disegnaTratti(ctx, tratti) {
  ctx.save()
  tratti.forEach(t => tratto(ctx, t))
  ctx.restore()
}

// Foto ridotta a 1600 px sul lato lungo, in JPEG: dal telefono arrivano anche 5 MB
export async function preparaFoto(file) {
  const bitmap = await createImageBitmap(file)
  const scala = Math.min(1, LATO_FOTO / Math.max(bitmap.width, bitmap.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bitmap.width * scala); c.height = Math.round(bitmap.height * scala)
  c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height)
  bitmap.close?.()
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85))
  return { blob, bitmap: await createImageBitmap(blob) }
}

// Foglio: 1200×1600, oppure largo 1200 con le proporzioni della foto
export const misure = (foto) => {
  if (!foto) return { w: LARGHEZZA, h: ALTEZZA_FOGLIO }
  return { w: LARGHEZZA, h: Math.min(2400, Math.round(LARGHEZZA * foto.height / foto.width)) }
}
