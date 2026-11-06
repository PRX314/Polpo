// Copia di ECO/web/polpo.js (Progetti Codice/ECO): la fonte è quella.
// Peppino — il polpo disegnato in codice con le regole di Fabulus (client/rendering): la griglia 16x24 degli
// omini, il manto viola delle bestie coi suoi due toni (shade +30 e -38, come omino.js), il contorno di 1 px
// (#0d0b12, alpha 235, lo stesso di outline() in tileset.js). Nessuna immagine: ogni gesto si ridisegna.

const OUT = '#0d0b12', VIOLA = '#8a5ac0', BIANCO = '#f4f1ea', GUANCIA = '#e88aa6', LINGUA = '#e0607a', SEGNO = '#8fd0e8'
const W = 16, CX = 8

/** I gesti: quanti fotogrammi e ogni quanti millisecondi. */
export const STATI = {
  dorme: { fotogrammi: 8, ms: 420 },
  ascolta: { fotogrammi: 8, ms: 230 },
  pensa: { fotogrammi: 8, ms: 260 },
  parla: { fotogrammi: 6, ms: 130 },
  web: { fotogrammi: 8, ms: 120 },
}

function shade(hex, amt) {
  const h = hex.replace('#', '')
  const n = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2) || '80', 16) + amt
    return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')
  })
  return '#' + n.join('')
}
const rect = (ctx, x, y, w, h, c) => { if (w > 0 && h > 0) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h) } }
const px = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1) }
const C = VIOLA, HI = shade(C, 30), LO = shade(C, -38)

// I tentacoli sono scritti a mano, riga per riga: [x, y, larghezza], metà sinistra, dal corpo alla punta.
// La metà destra è lo specchio. Si muovono solo le punte: così restano separati.
const TESTA = { y0: 2, righe: [3, 4, 5, 6, 6, 6, 6, 6, 6, 6, 6, 5] }
const RIPOSO = [
  [[2, 15, 3], [1, 16, 3], [0, 17, 3], [0, 18, 2], [1, 19, 2], [2, 20, 2]],
  [[6, 15, 2], [6, 16, 2], [5, 17, 2], [5, 18, 2], [5, 19, 2], [6, 20, 2], [6, 21, 2]],
]
const NANNA = [
  [[1, 20, 3], [0, 21, 3], [0, 22, 2]],
  [[5, 20, 3], [4, 21, 3], [4, 22, 3]],
]
const SCIA = [
  [[4, 15, 2], [4, 16, 2], [4, 17, 2], [5, 18, 2], [5, 19, 2], [5, 20, 1], [5, 21, 1]],
  [[6, 15, 2], [7, 16, 1], [7, 17, 1], [7, 18, 1], [7, 19, 1], [7, 20, 1], [7, 21, 1], [7, 22, 1]],
]
const ALZA = [[1, 14, 2], [0, 13, 2], [0, 12, 2], [0, 11, 2], [0, 10, 1]]

function tentacolo(ctx, righe, specchio, spinta, dy) {
  const n = righe.length
  righe.forEach(([x, y, w], t) => {
    const coda = t >= n - 2 ? spinta : 0
    const xx = (specchio ? W - x - w : x) + (specchio ? -coda : coda)
    rect(ctx, xx, y + dy, w, 1, C)
    if (w > 1) { px(ctx, xx, y + dy, HI); px(ctx, xx + w - 1, y + dy, LO) }
  })
}

function testa(ctx, dy, tolte) {
  const { y0, righe } = TESTA
  righe.forEach((m, i) => {
    if (i < tolte) return
    const y = y0 + i + dy
    rect(ctx, CX - m, y, m * 2, 1, C)
    rect(ctx, CX + m - 2, y, 2, 1, LO)
    px(ctx, CX - m, y, shade(C, 12))
  })
  const m0 = righe[tolte], y = y0 + tolte + dy, m1 = righe[tolte + 2]
  rect(ctx, CX - m0 + 1, y, m0 * 2 - 3, 1, HI)                     // la luce in cima
  rect(ctx, CX - m1 + 2, y + 2, Math.ceil(m1 * 0.6), 1, HI)
  px(ctx, CX - m1 + 1, y + 3, HI); px(ctx, CX - m1 + 2, y + 3, HI)
  px(ctx, CX + 3, y + 3, LO); px(ctx, CX + 4, y + 4, LO)            // le macchie sulla testa
}

function occhio(ctx, x, y, chiuso) {
  if (chiuso) {                                                     // ad arco: dorme contento
    rect(ctx, x, y + 1, 2, 1, OUT)
    px(ctx, x - 1, y, OUT)
    px(ctx, x + 2, y, OUT)
    return
  }
  rect(ctx, x, y, 2, 3, OUT)
  px(ctx, x, y, BIANCO)                                             // il riflesso
}

function bocca(ctx, y, tipo) {
  if (tipo === 'sorriso') {
    px(ctx, CX - 2, y, OUT); px(ctx, CX + 1, y, OUT)
    rect(ctx, CX - 1, y + 1, 2, 1, OUT)
  } else if (tipo === 'piccola') {
    rect(ctx, CX - 1, y + 1, 2, 1, OUT)
  } else if (tipo === 'o') {
    rect(ctx, CX - 1, y, 2, 2, OUT)
  } else if (tipo === 'aperta') {
    rect(ctx, CX - 1, y, 2, 2, OUT)
    rect(ctx, CX - 1, y + 1, 2, 1, LINGUA)
  } else if (tipo === 'grande') {
    rect(ctx, CX - 2, y, 4, 3, OUT)
    rect(ctx, CX - 1, y + 1, 2, 2, shade(C, -70))
    rect(ctx, CX - 1, y + 2, 2, 1, LINGUA)
  }
}

function corpo(ctx, stato, i) {
  const dorme = stato === 'dorme', web = stato === 'web'
  const onda = [0, 1, 0, -1]
  const su = web ? onda[i % 4] : stato === 'parla' ? (i % 2 ? -1 : 0) : 0
  const dy = (dorme ? 5 + (i % 8 < 4 ? 0 : 1) : 0) + su

  // i tentacoli stanno dietro la testa
  if (dorme) {
    NANNA.forEach((r) => { tentacolo(ctx, r, false, 0, 0); tentacolo(ctx, r, true, 0, 0) })
    rect(ctx, 2, 19, 12, 1, C); rect(ctx, 12, 19, 2, 1, LO)
  } else {
    const ampiezza = stato === 'parla' || web ? 1 : (stato === 'ascolta' || stato === 'pensa') && i % 4 === 1 ? 1 : 0
    ;(web ? SCIA : RIPOSO).forEach((r, k) => {
      for (const s of [false, true]) {
        const spinta = ampiezza * onda[(i + k * 2 + (s ? 1 : 0)) % 4]
        // ascolta: alza un braccio; pensa: si gratta la testa con quello dall'altra parte
        if (stato === 'ascolta' && !s && k === 0) { tentacolo(ctx, ALZA, false, 0, i % 4 < 2 ? 0 : -1); continue }
        if (stato === 'pensa' && s && k === 0) { tentacolo(ctx, ALZA, true, 0, i % 2 ? -1 : -2); continue }
        tentacolo(ctx, r, s, spinta, su)
      }
    })
    rect(ctx, 3, 14 + su, 10, 1, C); rect(ctx, 11, 14 + su, 2, 1, LO)
  }
  testa(ctx, dy, dorme ? 2 : 0)

  // la faccia
  const ey = 7 + dy, guarda = stato === 'pensa' ? [1, -1] : stato === 'ascolta' ? [i % 8 < 4 ? -1 : 1, 0] : web ? [0, -1] : [0, 0]
  const chiuso = dorme || (i === 5 && (stato === 'ascolta' || stato === 'pensa'))   // ogni tanto sbatte le palpebre
  const oy = chiuso ? ey + 1 : ey + guarda[1]
  occhio(ctx, CX - 4 + guarda[0], oy, chiuso)
  occhio(ctx, CX + 2 + guarda[0], oy, chiuso)
  rect(ctx, CX - 6, 10 + dy, 2, 1, GUANCIA)
  rect(ctx, CX + 4, 10 + dy, 2, 1, GUANCIA)
  const tipo = dorme || stato === 'pensa' ? 'piccola' : web ? 'o'
    : stato === 'parla' ? ['sorriso', 'aperta', 'grande', 'aperta', 'grande', 'aperta'][i % 6] : 'sorriso'
  bocca(ctx, 10 + dy, tipo)
}

// i segni fuori dal corpo: la zeta del sonno, i puntini del pensiero. Si disegnano dopo il contorno.
function segni(ctx, stato, i) {
  if (stato === 'dorme') {
    const passo = i % 8, x = W - 6 + (passo >> 2), y = 5 - (passo >> 1)
    for (const [a, b, w] of [[0, 0, 4], [2, 1, 1], [1, 2, 1], [0, 3, 4]]) rect(ctx, x + a, y + b, w, 1, SEGNO)
  } else if (stato === 'pensa') {
    const quanti = 1 + Math.min(2, (i % 8) >> 1)
    ;[[13, 4, 1], [14, 1, 2], [11, -1, 2]].slice(0, quanti).forEach(([x, y, l]) => rect(ctx, x, y, l, l, SEGNO))
  }
}

/** Contorno di 1 px attorno ai pixel pieni, come outline() di tileset.js. */
function contorno(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  const pieno = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 160
  const bordo = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (pieno(x, y)) continue
    if (pieno(x - 1, y) || pieno(x + 1, y) || pieno(x, y - 1) || pieno(x, y + 1)) bordo.push(x, y)
  }
  for (let k = 0; k < bordo.length; k += 2) {
    const o = (bordo[k + 1] * w + bordo[k]) * 4
    d[o] = 13; d[o + 1] = 11; d[o + 2] = 18; d[o + 3] = 235
  }
  ctx.putImageData(img, 0, 0)
}

/** Peppino finito su un canvas suo (22x30), con il margine per il contorno e i segni. */
export function sprite(stato = 'dorme', i = 0) {
  const c = document.createElement('canvas')
  c.width = W + 6; c.height = 30
  const ctx = c.getContext('2d')
  ctx.translate(3, 3)
  corpo(ctx, stato, i)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  contorno(ctx, c.width, c.height)
  ctx.translate(3, 3)
  segni(ctx, stato, i)
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  return c
}

/** La bolla a pixel, con la stessa grana del polpo: il raggio è in pixel del disegno. */
export function bolla(raggio) {
  const lato = raggio * 2 + 2
  const c = document.createElement('canvas')
  c.width = lato; c.height = lato
  const ctx = c.getContext('2d')
  const m = lato / 2 - 0.5
  for (let y = 0; y < lato; y++) for (let x = 0; x < lato; x++) {
    const d = Math.hypot(x - m, y - m)
    if (d > raggio + 0.3) continue
    if (d > raggio - 0.9) px(ctx, x, y, '#2f5878')
    else if (d > raggio - 1.9) px(ctx, x, y, '#8fd0e8')
    else px(ctx, x, y, 'rgba(143, 208, 232, 0.13)')
  }
  const a = Math.round(raggio * 0.42)
  for (const [x, y, w] of [[a + 3, a - 1, 4], [a + 1, a, 3], [a, a + 1, 2], [a - 1, a + 3, 1], [a - 1, a + 4, 1]]) rect(ctx, x, y, w, 1, '#ffffff')
  return c
}
