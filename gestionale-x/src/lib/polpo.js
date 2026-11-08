// Copia di ECO/web/polpo.js (Progetti Codice/ECO): la fonte è quella.
// Peppino — il polpo disegnato in codice con le regole di Fabulus (client/rendering): la griglia 16x24 degli
// omini, il manto viola delle bestie, il contorno di 1 px (#0d0b12, alpha 235, lo stesso di outline() in
// tileset.js). Nessuna immagine: ogni fotogramma si ridisegna da pochi numeri.
//
// Le forme sono scritte a mano, riga per riga (i tentacoli calcolati erano un groviglio). A muoverle è un
// motore a molle: ogni gesto dice solo dove il corpo vuole stare, e il passaggio da un gesto all'altro nasce
// da solo, con la rincorsa, il rimbalzo e le punte che arrivano dopo.
//
//   const peppino = creaPeppino(canvas, { bolla: true })
//   peppino.gesto('ascolta')             dorme | ascolta | pensa | parla | web
//   peppino.livello(0.4)                 il volume del microfono: mentre ascolta ci reagisce
//   peppino.voce(() => eco.voceOra())    la frase che sta suonando: la bocca la segue
//   peppino.tocco()                      il sussulto quando lo tocchi
//   peppino.spegni()

const OUT = '#0d0b12', BIANCO = '#f4f1ea', GUANCIA = '#e88aa6', LINGUA = '#e0607a', SEGNO = '#6fc3e6'
const C = '#8a5ac0'                                   // il manto viola delle bestie di Fabulus
const HI = '#a878de', LO = '#64349a'                  // i suoi due toni: shade +30 e -38, come omino.js
const LUCE = '#cfaef4', OMBRA = '#44267c'             // gli estremi tirano al rosa e al blu: fa volume
const BOCCA_DENTRO = '#3a1436', VETRO = '#2f5878', VETRO_LUCE = '#8fd0e8'
const TONO = [C, HI, LO], TONO_DIETRO = [LO, C, OMBRA], TONO_CHIARO = [HI, LUCE, C]

export const LATO = 44                                // il palco: 44 pixel, si vede a 220 (5x)
const W = 16, CX = 8, OX = 14, OY = 17                // il polpo sul palco
const PASSO = 1 / 15                                  // i pixel si muovono a scatti puliti, 15 volte al secondo
const FISICA = 1 / 60                                 // le molle invece a passo fisso, più fine

const rect = (ctx, x, y, w, h, c) => { if (w > 0 && h > 0) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h) } }
const px = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1) }
const lerp = (a, b, t) => a + (b - a) * t
const stringi = (v, a, b) => Math.max(a, Math.min(b, v))
const DUE_PI = Math.PI * 2

// La testa: quanto è larga ogni riga, dall'alto al collo. Cinque misure, dalla più schiacciata alla più
// allungata: il collo resta fermo alla riga 13 e si muove la cupola.
const TESTE = {
  '-2': [4, 6, 7, 8, 8, 8, 8, 8, 8, 7, 6],
  '-1': [4, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6],
  0: [3, 5, 6, 6, 7, 7, 7, 7, 7, 7, 7, 6, 6],
  1: [3, 4, 5, 6, 6, 7, 7, 7, 7, 7, 7, 7, 6, 6],
  2: [2, 4, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
}
const COLLO = 13

// La luce viene da in alto a sinistra: ogni pixel della testa prende il tono di una sfera.
const TONI = {}
for (const [liv, righe] of Object.entries(TESTE)) {
  const larga = Math.max(...righe), n = righe.length
  TONI[liv] = righe.map((m, j) => {
    const fila = []
    for (let x = -m; x < m; x++) {
      const nx = (x + 0.5) / (larga + 0.4), ny = ((j + 0.5) / n) * 2 - 1
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny * 0.92))
      const v = nx * -0.46 + ny * -0.62 + nz * 0.63
      fila.push(v > 0.95 ? LUCE : v > 0.66 ? HI : v > -0.02 ? C : v > -0.42 ? LO : OMBRA)
    }
    return fila
  })
}

// I tentacoli: [x, y, larghezza], metà sinistra, dal corpo alla punta. La metà destra è lo specchio.
// La y è sempre riferita al collo, e ogni posa ha lo stesso numero di righe: così una si scioglie nell'altra.
const POSE = {
  riposo: {
    fuori: [[2, 14, 3], [1, 15, 3], [0, 16, 3], [0, 17, 3], [-1, 18, 3], [-1, 19, 2], [-2, 20, 2], [-3, 20, 1]],
    dentro: [[5, 14, 3], [5, 15, 3], [4, 16, 3], [4, 17, 3], [3, 18, 3], [3, 19, 2], [2, 20, 2], [1, 21, 2]],
    dietro: [[6, 15, 2], [6, 16, 2], [6, 17, 2], [6, 18, 2], [6, 19, 2], [7, 20, 1], [7, 21, 1]],
  },
  nanna: {
    fuori: [[0, 13, 4], [-2, 14, 4], [-3, 15, 3], [-4, 16, 2], [-3, 17, 3], [-1, 17, 2], [-1, 16, 2], [0, 15, 1]],
    dentro: [[4, 14, 3], [2, 15, 5], [2, 16, 5], [2, 17, 5], [3, 18, 4], [3, 18, 4], [3, 18, 4], [3, 18, 4]],
    dietro: [[6, 14, 2], [6, 15, 2], [6, 16, 2], [6, 17, 2], [7, 17, 1], [7, 17, 1], [7, 17, 1]],
  },
  scia: {
    fuori: [[3, 14, 3], [3, 15, 3], [3, 16, 3], [3, 17, 2], [4, 18, 2], [4, 19, 2], [5, 20, 2], [5, 21, 1]],
    dentro: [[6, 14, 2], [6, 15, 2], [6, 16, 2], [6, 17, 2], [6, 18, 2], [6, 19, 2], [6, 20, 2], [7, 21, 1]],
    dietro: [[6, 15, 2], [6, 16, 2], [6, 17, 2], [6, 18, 2], [6, 19, 2], [7, 20, 1], [7, 21, 1]],
  },
}
// il braccio che si stacca dal fianco: la posa di mezzo, altrimenti a metà strada diventa uno stecco
const MEZZO = [[1, 14, 3], [0, 15, 3], [-1, 16, 3], [-3, 16, 3], [-4, 15, 3], [-5, 14, 2], [-5, 13, 2], [-5, 12, 1]]
// il sinistro si porta all'orecchio: sale lungo la testa e la punta si piega verso di lei
const ORECCHIO = [[1, 14, 3], [0, 13, 3], [-1, 12, 3], [-2, 11, 3], [-2, 10, 2], [-2, 9, 2], [-1, 8, 2], [0, 7, 2]]
// il destro si porta al mento: gomito in fuori e avambraccio davanti al viso (qui è scritto da sinistra)
const MENTO = [[2, 14, 3], [0, 15, 3], [-1, 14, 3], [-1, 13, 2], [0, 12, 2], [2, 12, 2], [3, 12, 2], [4, 11, 2]]

const unisci = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]

/** Una fila di pixel del tentacolo. Dove è sottile basta un tono e la sua ombra: due toni su due pixel fanno rumore. */
function striscia(ctx, x, y, w, [base, chiaro, scuro]) {
  rect(ctx, x, y, w, 1, base)
  if (w >= 3) { px(ctx, x, y, chiaro); px(ctx, x + w - 1, y, scuro) } else if (w === 2) px(ctx, x + 1, y, scuro)
}

function tentacolo(ctx, righe, specchio, tono) {
  let prima = null
  righe.forEach(([x, y, w], k) => {
    const ww = Math.max(1, Math.round(w)), yy = Math.round(y)
    let xx = specchio ? W - Math.round(x) - ww : Math.round(x)
    if (prima) {
      const passi = Math.abs(yy - prima.y)
      if (passi <= 1) xx = stringi(xx, prima.x - ww + 1, prima.x + prima.w - 1)  // mai a pezzi
      // due righe allontanate (a metà di un gesto) si uniscono
      for (let i = 1; i < passi; i++) {
        striscia(ctx, Math.round(lerp(prima.x, xx, i / passi)), Math.round(lerp(prima.y, yy, i / passi)), ww, tono)
      }
    }
    striscia(ctx, xx, yy, ww, k === 0 ? TONO_DIETRO : tono)
    prima = { x: xx, y: yy, w: ww }
  })
}

/** Un tentacolo davanti alla testa: è più chiaro di lei e le fa ombra sotto, solo dove c'è già qualcosa. */
function davanti(ctx, righe, specchio) {
  ctx.globalCompositeOperation = 'source-atop'
  for (const [x, y, w] of righe) {
    const ww = Math.round(w), xx = specchio ? W - Math.round(x) - ww : Math.round(x)
    rect(ctx, xx - 1, Math.round(y) + 1, ww + 1, 1, OMBRA)
  }
  ctx.globalCompositeOperation = 'source-over'
  tentacolo(ctx, righe, specchio, TONO_CHIARO)
}

function testa(ctx, liv, dy, pende) {
  const righe = TESTE[liv], toni = TONI[liv], n = righe.length
  righe.forEach((m, j) => {
    const y = COLLO - (n - 1 - j) + dy
    const sposta = Math.round(pende * (n - 1 - j) / (n - 1))
    toni[j].forEach((c, i) => px(ctx, CX - m + i + sposta, y, c))
  })
  // le macchie sulla cupola
  const su = Math.round(pende * 0.75), cima = COLLO - n + dy
  for (const [x, y, w] of [[10, 3, 2], [10, 4, 2], [12, 5, 1], [9, 6, 1]]) rect(ctx, x + su, cima + y, w, 1, LO)
}

function occhio(ctx, x, y, tipo) {
  if (tipo === 'nanna') {                                           // ad arco: dorme contento
    px(ctx, x - 1, y + 1, OUT); rect(ctx, x, y + 2, 2, 1, OUT); px(ctx, x + 2, y + 1, OUT)
  } else if (tipo === 'felice') {                                   // ad archetto all'insù: se la ride
    px(ctx, x - 1, y + 2, OUT); rect(ctx, x, y + 1, 2, 1, OUT); px(ctx, x + 2, y + 2, OUT)
  } else if (tipo === 'chiuso') {
    rect(ctx, x - 1, y + 2, 4, 1, OUT)
  } else if (tipo === 'mezzo') {
    rect(ctx, x, y + 1, 2, 2, OUT)
  } else if (tipo === 'sgrana') {                                   // sveglio di colpo: più alti, col riflesso grande
    rect(ctx, x, y - 1, 2, 4, OUT); rect(ctx, x, y - 1, 1, 2, BIANCO)
  } else {
    rect(ctx, x, y, 2, 3, OUT)                                      // neri e tondi
    px(ctx, x, y, BIANCO)                                           // il riflesso
  }
}

function bocca(ctx, y, tipo, dx) {
  const x = CX + dx
  if (tipo === 'sorriso') {
    px(ctx, x - 2, y, OUT); px(ctx, x + 1, y, OUT)
    rect(ctx, x - 1, y + 1, 2, 1, OUT)
  } else if (tipo === 'piccola') {
    rect(ctx, x - 1, y + 1, 2, 1, OUT)
  } else if (tipo === 'chiusa') {
    rect(ctx, x - 2, y + 1, 4, 1, OUT)
  } else if (tipo === 'o') {
    rect(ctx, x - 1, y, 2, 2, OUT)
  } else if (tipo === 'e') {
    rect(ctx, x - 2, y, 4, 2, OUT)
    rect(ctx, x - 1, y + 1, 2, 1, LINGUA)
  } else if (tipo === 'a') {
    rect(ctx, x - 2, y, 4, 3, OUT)
    rect(ctx, x - 1, y + 1, 2, 2, BOCCA_DENTRO)
    rect(ctx, x - 1, y + 2, 2, 1, LINGUA)
  } else if (tipo === 'sbadiglio') {
    rect(ctx, x - 2, y - 1, 4, 4, OUT)
    rect(ctx, x - 1, y, 2, 3, BOCCA_DENTRO)
    rect(ctx, x - 1, y + 2, 2, 1, LINGUA)
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

/** Il corpo, dati i numeri della posa. */
function corpo(ctx, p) {
  const { nanna, scia, onda, su, dy, ritardi, liv, pende, faccia } = p

  const muovi = (nome, specchio, n) => {
    const braccio = nome === 'fuori' ? su[specchio ? 1 : 0] : 0
    return POSE.riposo[nome].map((r, k, tutte) => {
      let q = unisci(unisci(r, POSE.nanna[nome][k], nanna), POSE.scia[nome][k], scia)
      if (braccio > 0) {
        q = braccio < 0.5 ? unisci(q, MEZZO[k], braccio * 2)
          : unisci(MEZZO[k], (specchio ? MENTO : ORECCHIO)[k], stringi(braccio * 2 - 1, 0, 1))
      }
      // l'onda cresce verso la punta; un braccio alzato segue il corpo senza ondeggiare
      const f = (k + 1) / tutte.length
      const dx = onda.quanto * Math.pow(f, 1.6) * 1.25 * Math.sin(onda.fase - k * 0.55 + n * 1.1 + (specchio && n < 2 ? 0.7 : 0))
      const batte = specchio && nome === 'fuori' && k >= 6 ? p.batte * stringi(braccio * 2 - 1, 0, 1) : 0
      return [q[0] + (specchio ? -dx : dx) * (1 - braccio) - onda.apri * Math.pow(f, 1.4), q[1] + lerp(ritardi[k], dy, braccio) + batte, q[2]]
    })
  }

  for (const s of [false, true]) tentacolo(ctx, muovi('dietro', s, 2), s, TONO_DIETRO)
  for (const s of [false, true]) tentacolo(ctx, muovi('dentro', s, 1), s, TONO)
  tentacolo(ctx, muovi('fuori', false, 0), false, TONO)
  const destro = muovi('fuori', true, 0), alMento = su[1] > 0.55
  if (!alMento) tentacolo(ctx, destro, true, TONO)
  testa(ctx, liv, dy, pende)

  // la faccia: guardando di lato si sposta tutta, e la testa sembra girarsi
  const { occhi, gx, gy, bocca: forma, boccaDx, guance } = faccia
  const ey = 7 + dy + gy, sposta = Math.round(pende * 0.5) + gx
  occhio(ctx, CX - 4 + sposta, ey, occhi)
  occhio(ctx, CX + 2 + sposta, ey, occhi)
  const cy = 10 + dy, gl = Math.round(pende * 0.4)
  rect(ctx, CX - 6 + gl, cy, 2, guance ? 2 : 1, GUANCIA)
  rect(ctx, CX + 4 + gl, cy, 2, guance ? 2 : 1, GUANCIA)
  bocca(ctx, 10 + dy, forma, sposta + boccaDx)
  if (alMento) davanti(ctx, destro, true)
}

/** La bocca per una lettera: serve a seguire la frase che sta suonando. Null = resta com'è. */
function boccaDa(lettera) {
  if ('aà'.includes(lettera)) return 'a'
  if ('oòóuù'.includes(lettera)) return 'o'
  if ('eèéiì'.includes(lettera)) return 'e'
  if ('mbp'.includes(lettera)) return 'chiusa'
  if (' ,.;:!?\n'.includes(lettera)) return 'piccola'
  return null
}

// Il gesto è solo un assetto: dove il corpo vuole stare. Il passaggio lo fanno le molle.
const ASSETTI = {
  dorme: { alto: 5, nanna: 1, scia: 0, su: [0, 0], onda: 0, ritmo: 0.2 },
  sveglio: { alto: 0, nanna: 0, scia: 0, su: [0, 0], onda: 0.45, ritmo: 0.35 },
  ascolta: { alto: -1, nanna: 0, scia: 0, su: [1, 0], onda: 0.7, ritmo: 0.45 },
  pensa: { alto: -1, nanna: 0, scia: 0, su: [0, 1], onda: 0.6, ritmo: 0.3 },
  parla: { alto: 0, nanna: 0, scia: 0, su: [0, 0], onda: 0.8, ritmo: 0.6 },
  web: { alto: 0, nanna: 0, scia: 1, su: [0, 0], onda: 1, ritmo: 1 },
}

const molla = (v, k, c) => ({ v, vel: 0, a: 0, meta: v, k, c })
function spingi(m, dt) {
  m.a = m.k * (m.meta - m.v) - m.c * m.vel
  m.vel += m.a * dt
  m.v += m.vel * dt
}

export function creaPeppino(canvas, { bolla: sempreInBolla = false } = {}) {
  canvas.width = LATO; canvas.height = LATO
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const senzaMoto = matchMedia('(prefers-reduced-motion: reduce)').matches
  const partenza = sempreInBolla ? -3 : 5

  const s = {
    t: 0, gesto: 'dorme', dal: 0, addormenta: 0, sbadiglia: false,
    alto: molla(partenza, 90, 11), nanna: molla(1, 70, 13), scia: molla(0, 60, 12),
    suS: molla(0, 110, 13), suD: molla(0, 110, 13), pende: molla(0, 60, 9),
    spinta: molla(0, 200, 16), bolla: molla(sempreInBolla ? 1 : 0, 160, 15),
    livello: 0, forte: false, voce: null, fase: 0,
    battito: 2, chiudi: -1, sgrana: 0, felice: 0, scoppio: -9,
    gx: 0, gy: 0, sguardo: 1.5, gesticola: 0,
    storia: new Array(20).fill(partenza), bocca: 'piccola', boccaFino: 0, sillabe: 0,
  }
  const molle = [s.alto, s.nanna, s.scia, s.suS, s.suD, s.pende, s.spinta, s.bolla]

  const assetto = () => ASSETTI[s.gesto === 'dorme' && s.t < s.addormenta ? 'sveglio' : s.gesto]
  // quanto sta sopra o sotto il suo posto, galleggiamento compreso
  const altezza = () => s.alto.v + s.spinta.v + (1 - s.nanna.v) * Math.sin(s.t * DUE_PI / 2.2) * 0.9

  function scegliMete() {
    const a = assetto(), sonno = a === ASSETTI.dorme
    s.alto.meta = a.alto + (s.bolla.meta > 0.5 ? (sonno ? -8 : -6) : 0)
    s.nanna.meta = a.nanna; s.scia.meta = a.scia
    s.alto.k = sonno ? 34 : 90; s.alto.c = sonno ? 10 : 11           // si addormenta piano, si sveglia di scatto
    s.nanna.k = sonno ? 26 : 70; s.nanna.c = sonno ? 9 : 13
    if (s.gesto !== 'parla') { s.suS.meta = a.su[0]; s.suD.meta = a.su[1] }
  }

  function assesta() {
    scegliMete()
    for (const m of molle) { m.v = m.meta; m.vel = 0; m.a = 0 }
    s.storia.fill(s.alto.v)
  }

  /** Il gesto nuovo. Da sveglio non crolla subito: resta un attimo a guardarsi intorno. */
  function gesto(nome) {
    if (nome === s.gesto) return
    const prima = s.gesto
    s.gesto = nome; s.dal = s.t; s.sguardo = s.t; s.gesticola = s.t
    if (nome === 'dorme') { s.addormenta = senzaMoto ? 0 : s.t + 3.5; s.sbadiglia = Math.random() < 0.5 }
    if (prima === 'dorme' && s.nanna.v > 0.3) s.sgrana = s.t + 0.5                       // svegliato
    if (prima === 'pensa' && nome === 'parla') { s.spinta.vel -= 26; s.felice = s.t + 0.32 } // eccola, la risposta
    if (nome === 'web') s.bolla.meta = 1
    else if (!sempreInBolla && s.bolla.meta > 0) { s.bolla.meta = 0; s.bolla.v = 0; s.bolla.vel = 0; s.scoppio = s.t }
    if (senzaMoto) {                                                 // il tempo è fermo: niente che debba finire da solo
      s.sgrana = 0; s.felice = 0; s.scoppio = -9
      assesta(); disegna()
    }
  }

  function guardati(a) {
    const r = Math.random
    if (a === ASSETTI.dorme) { s.gx = 0; s.gy = 0; s.sguardo = s.t + 1 }
    else if (s.gesto === 'pensa') { s.gx = r() < 0.7 ? 1 : -1; s.gy = -1; s.sguardo = s.t + 0.9 + r() * 1.3 }
    else if (s.gesto === 'ascolta' || s.gesto === 'parla') { s.gx = r() < 0.72 ? 0 : r() < 0.5 ? -1 : 1; s.gy = 0; s.sguardo = s.t + 0.7 + r() * 1.8 }
    else { s.gx = r() < 0.5 ? 0 : r() < 0.5 ? -1 : 1; s.gy = 0; s.sguardo = s.t + 0.8 + r() * 1.5 }
  }

  // La bocca segue la frase che sta suonando: la lettera a quel punto del tempo. Se la voce non c'è ancora
  // resta chiusa, e senza chi gliela racconta (le prove) inventa una parlata.
  function muoviBocca(t) {
    if (t < s.boccaFino) return
    const v = s.voce?.()
    let forma = null
    if (v) {
      const durata = Number.isFinite(v.durata) && v.durata > 0 ? v.durata : v.testo.length / 14
      forma = boccaDa(v.testo[Math.floor(stringi(v.tempo / durata, 0, 0.999) * v.testo.length)].toLowerCase())
    } else if (s.voce) forma = 'piccola'
    else {
      s.sillabe++
      forma = s.sillabe % 7 === 0 ? 'piccola' : ['a', 'e', 'o', 'chiusa', 'a', 'e'][Math.floor(Math.random() * 6)]
    }
    if (!forma || forma === s.bocca) return
    if (forma === 'a') s.spinta.vel -= 3                             // sulle vocali aperte la testa dà un colpetto
    s.bocca = forma
    s.boccaFino = t + 0.11                                           // ogni forma si vede: niente tremolio
  }

  function avanza(dt) {
    s.t += dt
    scegliMete()
    const a = assetto(), t = s.t
    for (const m of molle) spingi(m, dt)

    // gesticola parlando: a turno stacca un braccio dal fianco
    if (s.gesto === 'parla') {
      if (t > s.gesticola) {
        const lato = Math.random() < 0.5, quanto = 0.22 + Math.random() * 0.26
        s.gesticola = t + 0.7 + Math.random() * 0.9
        s.suS.meta = lato ? quanto : 0
        s.suD.meta = lato ? 0 : quanto
        s.pende.meta = lato ? -1 : 1
      }
      muoviBocca(t)
    } else s.pende.meta = s.gesto === 'pensa' ? 1.4 : s.gesto === 'ascolta' ? -1.2 : 0

    s.fase += dt * DUE_PI * a.ritmo * (1 + s.livello * 1.5)

    // il battito delle palpebre: ogni tanto, a volte doppio
    if (t > s.battito && a !== ASSETTI.dorme) {
      s.chiudi = t
      s.battito = t + (Math.random() < 0.2 ? 0.32 : 1.8 + Math.random() * 3.6)
    }
    if (t > s.sguardo) guardati(a)

    // ti sente: un piccolo balzo ogni volta che alzi la voce
    const forte = s.gesto === 'ascolta' && s.livello > (s.forte ? 0.3 : 0.45)
    if (forte && !s.forte) s.spinta.vel -= 7
    s.forte = forte

    // il getto, quando nuota
    if (s.gesto === 'web' && Math.floor(t / 0.9) !== Math.floor((t - dt) / 0.9)) s.spinta.vel -= 18

    // la memoria della posizione: le punte la seguono in ritardo
    s.storia.unshift(altezza()); s.storia.pop()
  }

  function posa() {
    const a = assetto(), t = s.t, dorme = a === ASSETTI.dorme
    const nanna = stringi(s.nanna.v, 0, 1)
    const sbadiglia = s.gesto === 'dorme' && s.sbadiglia && t < s.addormenta && t > s.addormenta - 1.1
    // il respiro: il sonno è lento e profondo, da sveglio appena
    const respiro = Math.sin(t * DUE_PI / (dorme ? 3.6 : 2.4)) * (dorme ? 0.62 : 0.5)
    // la gelatina: spinto da sotto si schiaccia, a fine corsa si allunga
    const inerzia = (s.alto.a + s.spinta.a) * 0.0042
    const liv = stringi(Math.round(inerzia + respiro - nanna * 1.4 + (sbadiglia ? 1 : 0)), -2, 2)

    let occhi = 'aperto'
    if (dorme) occhi = nanna > 0.45 ? 'nanna' : 'mezzo'
    else if (sbadiglia) occhi = 'chiuso'
    else if (t < s.sgrana) occhi = 'sgrana'
    else if (t < s.felice) occhi = 'felice'
    else if (s.chiudi >= 0 && t - s.chiudi < 0.18) occhi = t - s.chiudi < 0.05 || t - s.chiudi >= 0.13 ? 'mezzo' : 'chiuso'

    let forma = sbadiglia ? 'sbadiglio' : 'sorriso', boccaDx = 0
    if (dorme) forma = 'piccola'
    else if (s.gesto === 'pensa') { forma = 'piccola'; boccaDx = 1 }
    else if (s.gesto === 'web') forma = 'o'
    else if (s.gesto === 'parla') forma = s.bocca

    return {
      nanna, scia: stringi(s.scia.v, 0, 1), liv, dy: Math.round(altezza()),
      ritardi: Array.from({ length: 8 }, (_, k) => s.storia[Math.round(k * 2.2)]),
      // nel sonno i tentacoli stanno fermi, salvo un fremito ogni tanto
      onda: {
        quanto: a.onda * (1 + s.livello) + (dorme ? Math.max(0, Math.sin(t * 0.6)) ** 60 * 0.9 : 0),
        fase: dorme ? t * 9 : s.fase,
        apri: s.gesto === 'web' ? Math.max(0, -s.spinta.v) * 0.7 : 0,
      },
      su: [stringi(s.suS.v, 0, 1.1), stringi(s.suD.v, 0, 1.1)],
      pende: stringi(s.pende.v, -2, 2), batte: Math.sin(t * DUE_PI * 2.1) > 0.2 ? -1 : 0,
      faccia: { occhi, gx: s.gx, gy: s.gy, bocca: forma, boccaDx, guance: t < s.felice },
    }
  }

  // i segni fuori dal corpo: la zeta del sonno, le bollicine del pensiero, le onde della tua voce
  function segni() {
    const t = s.t, inBolla = s.bolla.v > 0.5, alto = Math.round(s.alto.v)
    if (assetto() === ASSETTI.dorme && s.nanna.v > 0.7) {
      for (const inizio of inBolla ? [0] : [0, 1.9]) {
        const f = ((t + inizio) % 3.8) / 3.8
        const x = Math.round(CX + 8 + f * (inBolla ? 3 : 7) + Math.sin(f * 7)), y = Math.round(7 - f * (inBolla ? 8 : 17)) + alto - 5
        const righe = f < 0.55 ? [[0, 0, 4], [2, 1, 1], [1, 2, 1], [0, 3, 4]] : [[0, 0, 5], [3, 1, 1], [2, 2, 1], [1, 3, 1], [0, 4, 5]]
        ctx.globalAlpha = f > 0.86 ? 0.45 : 1
        for (const [a, b, w] of righe) rect(ctx, x + a, y + b, w, 1, SEGNO)
        ctx.globalAlpha = 1
      }
    }
    if (s.gesto === 'pensa') {
      const f = ((t - s.dal) % 2.1) / 2.1, quanti = f < 0.2 ? 1 : f < 0.42 ? 2 : 3
      const bolle = inBolla ? [[17, 10, 1], [19, 6, 2], [18, 0, 3]] : [[15, 3, 1], [17, 0, 2], [19, -4, 3]]
      bolle.slice(0, quanti).forEach(([x, y, l], i) => {
        const yy = y + alto + Math.round(Math.sin(t * 3 + i) * 0.7)
        if (l === 3) { rect(ctx, x + 1, yy, 1, 3, SEGNO); rect(ctx, x, yy + 1, 3, 1, SEGNO) } else rect(ctx, x, yy, l, l, SEGNO)
      })
    }
    if (s.gesto === 'ascolta' && s.livello > 0.06) {
      const quanti = s.livello > 0.35 ? 2 : 1, f = (t * 1.5) % 1, y = 9 + alto
      for (let i = 0; i < quanti; i++) {
        const x = -5 - Math.round((i + 1 - f) * 2.5), m = 1 + i
        rect(ctx, x, y - m + 1, 1, m * 2, SEGNO)
        px(ctx, x - 1, y - m, SEGNO); px(ctx, x - 1, y + m + 1, SEGNO)
      }
    }
  }

  /** La bolla che scoppia: gocce che volano via dal bordo. */
  function schizzi(f) {
    const c = LATO / 2 - 0.5
    ctx.globalAlpha = f > 0.6 ? 0.5 : 1
    for (let i = 0; i < 16; i++) {
      const a = (i * DUE_PI) / 16 + (i % 2) * 0.2, d = 17 + f * (i % 2 ? 6 : 3)
      px(ctx, Math.round(c + Math.cos(a) * d), Math.round(c + Math.sin(a) * d), i % 3 ? SEGNO : VETRO)
    }
    ctx.globalAlpha = 1
  }

  /** La bolla a pixel: si deforma appena, sente i colpi di chi sta dentro, e dentro salgono le bollicine. */
  const pieno = new Uint8Array((LATO + 2) * (LATO + 2))              // con un pixel di margine su ogni lato
  const qui = (x, y) => pieno[(y + 1) * (LATO + 2) + x + 1]
  function vetro(quanto) {
    const t = s.t, c = LATO / 2 - 0.5, r = 19.9 * quanto
    const urto = stringi(s.spinta.v * 0.25, -0.6, 0.6), onda = Math.sin(t * 1.7) * 0.45
    const rx = r + onda - urto, ry = r - onda + urto, dy = Math.round(Math.sin(t * DUE_PI / 3.1) * 0.8)
    for (let y = 0; y < LATO; y++) for (let x = 0; x < LATO; x++) {
      pieno[(y + 1) * (LATO + 2) + x + 1] = ((x - c) / rx) ** 2 + ((y - c - dy) / ry) ** 2 <= 1 ? 1 : 0
    }
    const bordo = (x, y) => qui(x, y) && !(qui(x - 1, y) && qui(x + 1, y) && qui(x, y - 1) && qui(x, y + 1))
    // sotto il polpo: prima le bollicine che salgono, poi l'acqua
    ctx.globalCompositeOperation = 'destination-over'
    for (const [ritardo, x0, l] of [[0, -12, 1], [1.3, -8, 2], [2.4, 11, 1]]) {
      const f = ((t + ritardo) % 3.6) / 3.6
      const x = Math.round(c + x0 + Math.sin(f * 9) * 0.8), y = Math.round(c + 15 - f * 26 + dy)
      if (qui(x - 2, y) && qui(x + 3, y) && qui(x, y - 2)) rect(ctx, x, y, l, l, 'rgba(143, 208, 232, .9)')
    }
    ctx.fillStyle = 'rgba(143, 208, 232, .2)'
    for (let y = 0; y < LATO; y++) for (let x = 0; x < LATO; x++) if (qui(x, y)) ctx.fillRect(x, y, 1, 1)
    ctx.globalCompositeOperation = 'source-over'
    for (let y = 0; y < LATO; y++) for (let x = 0; x < LATO; x++) {
      if (bordo(x, y)) px(ctx, x, y, VETRO)
      else if (qui(x, y) && (x - c) + (y - c - dy) > 8 && (bordo(x - 1, y) || bordo(x + 1, y) || bordo(x, y - 1) || bordo(x, y + 1))) {
        px(ctx, x, y, VETRO_LUCE)                                    // il bordo si accende dalla parte opposta alla luce
      }
    }
    // il riflesso: un arco spesso in alto a sinistra e un punto dopo di lui
    for (let a = 3.55; a < 4.35; a += 0.04) {
      for (const d of [0.74, 0.79]) px(ctx, Math.round(c + Math.cos(a) * rx * d), Math.round(c + dy + Math.sin(a) * ry * d), '#ffffff')
    }
    rect(ctx, Math.round(c + Math.cos(4.6) * rx * 0.76), Math.round(c + dy + Math.sin(4.6) * ry * 0.76), 2, 2, '#ffffff')
  }

  function disegna() {
    const dentro = stringi(s.bolla.v, 0, 1)
    ctx.clearRect(0, 0, LATO, LATO)
    ctx.setTransform(1, 0, 0, 1, OX, OY)
    corpo(ctx, posa())
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    contorno(ctx, LATO, LATO)
    ctx.setTransform(1, 0, 0, 1, OX, OY)
    segni()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (dentro > 0.04) vetro(dentro)
    if (s.t - s.scoppio < 0.36) schizzi((s.t - s.scoppio) / 0.36)
    if (dentro < 0.5) {                                              // l'ombra a terra: più stretta quanto più sta in alto
      const w = 2 * Math.round(stringi(8 + (s.alto.v + s.spinta.v) * 0.7, 4, 12))
      ctx.globalCompositeOperation = 'destination-over'
      rect(ctx, LATO / 2 - w / 2 + 2, 42, w - 4, 1, 'rgba(120, 120, 135, .3)')
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  let attesa = 0, ultimo = 0, daMuovere = 0, daDisegnare = 0, spento = false
  function giro(ora) {
    if (spento) return
    attesa = requestAnimationFrame(giro)
    const dt = Math.min(0.12, (ora - ultimo) / 1000 || 0)
    ultimo = ora
    daMuovere += dt; daDisegnare += dt
    while (daMuovere >= FISICA) { avanza(FISICA); daMuovere -= FISICA }
    if (daDisegnare >= PASSO) { daDisegnare %= PASSO; disegna() }
  }
  disegna()
  if (!senzaMoto) attesa = requestAnimationFrame(giro)

  return {
    gesto,
    livello(v) { s.livello = stringi(v, 0, 1) },
    voce(fn) { s.voce = fn },
    tocco() { s.spinta.vel += 16; s.sgrana = s.t + 0.16 },
    spegni() { spento = true; cancelAnimationFrame(attesa) },
    // per i fogli di prova: avanti di tot secondi senza aspettare
    prova(secondi) { for (let i = 0; i < secondi * 60; i++) avanza(FISICA); disegna() },
  }
}
