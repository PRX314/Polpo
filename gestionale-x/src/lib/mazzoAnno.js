// Il Mazzo dell'Anno: calendario perpetuo di 13 mesi da 28 giorni, ogni data una stesa di quattro tarocchi.
// Lo stesso calcolo vive nella scheda #mazzo di Arcana (polpopoly-hub/public/arcana/index.html):
// se cambi una corrispondenza, cambiala in tutti e due.

// Le carte stanno nell'hub, sullo stesso dominio del gestionale. In locale non ci sono e si vede il disegno di riserva.
const CARTE = '/arcana/carte/'
const p2 = (n) => String(n).padStart(2, '0')
const imgMag = (n) => `${CARTE}m${p2(n)}.jpg`
const imgMin = (k, rango) => `${CARTE}${k}${p2(rango)}.jpg` // ranghi: 1-10, 11 Fante, 12 Cavaliere, 13 Regina, 14 Re

const MESI = [
  { v: 'Asso', vb: 'A', rango: 1, nome: 'Fondamento', l: 'ה', ln: 'He', g: 5, segno: 'Ariete', an: 4, arc: "L'Imperatore" },
  { v: 'Due', vb: 'II', rango: 2, nome: 'Voce', l: 'ו', ln: 'Vav', g: 6, segno: 'Toro', an: 5, arc: 'Il Papa' },
  { v: 'Tre', vb: 'III', rango: 3, nome: 'Bivio', l: 'ז', ln: 'Zayin', g: 7, segno: 'Gemelli', an: 6, arc: 'Gli Amanti' },
  { v: 'Quattro', vb: 'IV', rango: 4, nome: 'Soglia', l: 'ח', ln: 'Chet', g: 8, segno: 'Cancro', an: 7, arc: 'Il Carro' },
  { v: 'Cinque', vb: 'V', rango: 5, nome: 'Ardore', l: 'ט', ln: 'Tet', g: 9, segno: 'Leone', an: 8, arc: 'La Forza' },
  { v: 'Sei', vb: 'VI', rango: 6, nome: 'Lampada', l: 'י', ln: 'Yod', g: 10, segno: 'Vergine', an: 9, arc: "L'Eremita" },
  { v: 'Sette', vb: 'VII', rango: 7, nome: 'Bilancia', l: 'ל', ln: 'Lamed', g: 30, segno: 'Bilancia', an: 11, arc: 'La Giustizia' },
  { v: 'Otto', vb: 'VIII', rango: 8, nome: 'Muta', l: 'נ', ln: 'Nun', g: 50, segno: 'Scorpione', an: 13, arc: 'La Morte' },
  { v: 'Nove', vb: 'IX', rango: 9, nome: 'Mescolanza', l: 'ס', ln: 'Samekh', g: 60, segno: 'Sagittario', an: 14, arc: 'La Temperanza' },
  { v: 'Dieci', vb: 'X', rango: 10, nome: 'Vincolo', l: 'ע', ln: 'Ayin', g: 70, segno: 'Capricorno', an: 15, arc: 'Il Diavolo' },
  { v: 'Fante', vb: 'F', rango: 11, nome: 'Rugiada', l: 'צ', ln: 'Tzade', g: 90, segno: 'Acquario', an: 17, arc: 'Le Stelle' },
  { v: 'Cavaliere', vb: 'C', rango: 12, nome: 'Guado', l: 'ק', ln: 'Qof', g: 100, segno: 'Pesci', an: 18, arc: 'La Luna' },
  { v: 'Re', vb: 'R', rango: 14, nome: 'Compimento', l: 'ש', ln: 'Shin', g: 300, segno: 'Fuoco (madre)', an: 20, arc: 'Il Giudizio' }
]
const SEMI = [
  { nome: 'Bastoni', el: 'Fuoco', l: 'י', ln: 'Yod', g: 10, img: 'w' },
  { nome: 'Coppe', el: 'Acqua', l: 'ה', ln: 'He', g: 5, img: 'c' },
  { nome: 'Spade', el: 'Aria', l: 'ו', ln: 'Vav', g: 6, img: 's' },
  { nome: 'Denari', el: 'Terra', l: 'ה', ln: 'He finale', g: 5, img: 'p' }
]
// indice 0 = primo giorno del mese: ogni mese si apre di domenica
const GIORNI = [
  { nome: 'domenica', pia: 'Sole', l: 'ר', ln: 'Resh', g: 200, an: 19, arc: 'Il Sole' },
  { nome: 'lunedì', pia: 'Luna', l: 'ג', ln: 'Gimel', g: 3, an: 2, arc: 'La Papessa' },
  { nome: 'martedì', pia: 'Marte', l: 'פ', ln: 'Pe', g: 80, an: 16, arc: 'La Torre' },
  { nome: 'mercoledì', pia: 'Mercurio', l: 'ב', ln: 'Bet', g: 2, an: 1, arc: 'Il Mago' },
  { nome: 'giovedì', pia: 'Giove', l: 'כ', ln: 'Kaf', g: 20, an: 10, arc: 'La Ruota della Fortuna' },
  { nome: 'venerdì', pia: 'Venere', l: 'ד', ln: 'Dalet', g: 4, an: 3, arc: "L'Imperatrice" },
  { nome: 'sabato', pia: 'Saturno', l: 'ת', ln: 'Tav', g: 400, an: 21, arc: 'Il Mondo' }
]
const ARCANI = ['Il Matto', 'Il Mago', 'La Papessa', "L'Imperatrice", "L'Imperatore", 'Il Papa', 'Gli Amanti', 'Il Carro', 'La Forza', "L'Eremita", 'La Ruota della Fortuna', 'La Giustizia', "L'Appeso", 'La Morte', 'La Temperanza', 'Il Diavolo', 'La Torre', 'Le Stelle', 'La Luna', 'Il Sole', 'Il Giudizio', 'Il Mondo']
const ROM = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
const RISONANZE = { 13: ['אחד', 'uno — e אהבה, amore'], 15: ['יה', 'Yah'], 18: ['חי', 'vivo'], 26: ['יהוה', 'il Tetragramma'], 32: ['לב', 'cuore'], 86: ['אלהים', 'Elohim'], 91: ['אמן', 'amen'], 111: ['אלף', 'Aleph per esteso'], 314: ['שדי', 'Shaddai'], 358: ['משיח', 'Mashiach'] }
const MESIG = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
const D = 86400000
const utc = (y, m, d) => Date.UTC(y, m, d)

const maggiore = (pos, n, sotto) => ({ pos, img: imgMag(n), titolo: `${ROM[n]} — ${ARCANI[n]}`, sotto, riserva: ROM[n] })
const vuota = (pos, sotto) => ({ pos, img: null, titolo: '—', sotto, riserva: '', spenta: true })

// iso: 'AAAA-MM-GG'. L'anno del mazzo comincia il 21 marzo; i giorni oltre il 364° stanno fuori dal mazzo.
export function leggiMazzo(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const ms = utc(y, m - 1, d)
  let sy = y
  if (ms < utc(sy, 2, 21)) sy--
  const inizio = utc(sy, 2, 21)
  const tot = (utc(sy + 1, 2, 21) - inizio) / D
  const giorno = Math.round((ms - inizio) / D) + 1
  const quando = `${d} ${MESIG[m - 1]} ${y} · anno ${sy}/${String(sy + 1).slice(2)} · giorno ${giorno} di ${tot}`

  if (giorno > 364) {
    const inter = tot === 366 && giorno === 365
    const rs = SEMI[sy % 4]
    return {
      iso, quando, fuori: true,
      nome: inter ? 'Giorno Intercalare' : 'Giorno del Jolly',
      breve: inter ? 'fuori dal mazzo · XII L\'Appeso' : `fuori dal mazzo · Regina di ${rs.nome}`,
      carte: [
        inter
          ? vuota('La carta', 'Il mazzo non copre questo giorno')
          : { pos: 'La carta', img: imgMin(rs.img, 13), titolo: `Regina di ${rs.nome}`, sotto: "Il rango che l'anno non ospita", riserva: 'D' },
        inter ? maggiore("L'arcano", 12, 'מ Mem · Acqua') : maggiore("L'arcano", 0, 'א Aleph · Aria'),
        vuota('Il mese', 'Non appartiene ad alcun mese'),
        vuota('Il giorno', 'Fuori dal conteggio settimanale')
      ],
      dati: [
        { k: 'Gematria', v: inter ? '40' : '1', m: 'Non somma nulla, perché non entra in nessuna somma', grande: true },
        { k: 'Lettera madre', v: inter ? 'מ' : 'א', m: inter ? "Mem · l'Acqua: il tempo sospeso" : "Aleph · l'Aria: il respiro senza numero", ebraico: true },
        { k: 'Seme', v: inter ? '—' : rs.nome, m: inter ? 'Fuori dai quattro elementi' : 'Ciclo di 4 anni' },
        { k: 'Pianeta', v: '—', m: 'Fuori dal tempo' }
      ]
    }
  }

  const im = Math.ceil(giorno / 28) - 1
  const gm = giorno - im * 28
  const is = Math.ceil(gm / 7) - 1
  const gs = GIORNI[(gm - 1) % 7] // perpetuo: dedotto dalla posizione, non dal gregoriano
  const mese = MESI[im], seme = SEMI[is]
  const gem = mese.g + seme.g + gs.g
  const arcGem = gem % 22
  const ris = RISONANZE[gem]
  return {
    iso, quando, fuori: false,
    nome: `${mese.v} di ${seme.nome}`,
    breve: `${mese.nome} ${gm}/28 · ${gs.nome} · gematria ${gem}`,
    carte: [
      { pos: 'La settimana', img: imgMin(seme.img, mese.rango), titolo: `${mese.v} di ${seme.nome}`, sotto: `Minori · ${seme.el} · sett. ${im * 4 + is + 1}/52`, riserva: mese.vb },
      maggiore('Il mese', mese.an, `${mese.segno} · ${mese.l} ${mese.ln}`),
      maggiore('Il giorno', gs.an, `${gs.nome} · ${gs.pia}`),
      maggiore('Il riflesso', arcGem, `Gematria ${gem} mod 22`)
    ],
    dati: [
      { k: 'Gematria', v: String(gem), m: `${mese.g} + ${seme.g} + ${gs.g} · mod 22 = ${arcGem}${ris ? ` · ${ris[0]} ${ris[1]}` : ''}`, grande: true },
      { k: 'Radice', v: mese.l + seme.l + gs.l, m: `${mese.ln} – ${seme.ln} – ${gs.ln}`, ebraico: true },
      { k: 'Mese', v: `${im + 1} — ${mese.nome}`, m: `${mese.segno} · ${ROM[mese.an]} ${mese.arc} · ${mese.l} ${mese.ln} = ${mese.g}` },
      { k: 'Giorno del mese', v: `${gm} di 28`, m: `Settimana ${is + 1} di 4 · ${gs.nome}, sempre` },
      { k: 'Seme', v: seme.nome, m: `${seme.el} · ${seme.l} = ${seme.g}` },
      { k: 'Pianeta', v: gs.pia, m: `${gs.nome} · ${gs.l} = ${gs.g}` }
    ]
  }
}

// Il 20 marzo dell'anno solare della data: il Giorno del Jolly
export const jollyDi = (iso) => `${iso.slice(0, 4)}-03-20`

// La stessa data nella scheda completa di Arcana, con spiegazioni e tabelle
export const linkArcana = (iso) => `https://polpopoly.it/arcana/?data=${iso}#mazzo`
