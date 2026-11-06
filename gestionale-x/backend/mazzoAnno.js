// La stesa del Mazzo dell'Anno per il discorso del mattino: solo i nomi, in poche righe.
// Il calcolo completo sta in src/lib/mazzoAnno.js (e nella scheda #mazzo di Arcana). Render non vede
// i file del frontend, quindi qui ce n'è una copia ridotta: tests/mattino.test.mjs controlla che
// dia gli stessi nomi per tutto l'anno.
const MESI = [['Asso', 4], ['Due', 5], ['Tre', 6], ['Quattro', 7], ['Cinque', 8], ['Sei', 9], ['Sette', 11], ['Otto', 13], ['Nove', 14], ['Dieci', 15], ['Fante', 17], ['Cavaliere', 18], ['Re', 20]]
const GEMATRIA_MESI = [5, 6, 7, 8, 9, 10, 30, 50, 60, 70, 90, 100, 300]
const SEMI = [['Bastoni', 10], ['Coppe', 5], ['Spade', 6], ['Denari', 5]]
const GIORNI = [[19, 200], [2, 3], [16, 80], [1, 2], [10, 20], [3, 4], [21, 400]]
const ARCANI = ['Il Matto', 'Il Mago', 'La Papessa', "L'Imperatrice", "L'Imperatore", 'Il Papa', 'Gli Amanti', 'Il Carro', 'La Forza', "L'Eremita", 'La Ruota della Fortuna', 'La Giustizia', "L'Appeso", 'La Morte', 'La Temperanza', 'Il Diavolo', 'La Torre', 'Le Stelle', 'La Luna', 'Il Sole', 'Il Giudizio', 'Il Mondo']
const D = 86400000

export function stesaDelGiorno(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const ms = Date.UTC(y, m - 1, d)
  const anno = ms < Date.UTC(y, 2, 21) ? y - 1 : y
  const inizio = Date.UTC(anno, 2, 21)
  const totale = (Date.UTC(anno + 1, 2, 21) - inizio) / D
  const giorno = Math.round((ms - inizio) / D) + 1

  if (giorno > 364) {
    const intercalare = totale === 366 && giorno === 365
    return { nome: intercalare ? 'Giorno Intercalare' : 'Giorno del Jolly', giorno: '', mese: '', riflesso: '' }
  }
  const mese = Math.ceil(giorno / 28) - 1
  const delMese = giorno - mese * 28
  const seme = SEMI[Math.ceil(delMese / 7) - 1]
  const settimana = GIORNI[(delMese - 1) % 7]
  return {
    nome: `${MESI[mese][0]} di ${seme[0]}`,
    giorno: ARCANI[settimana[0]],
    mese: ARCANI[MESI[mese][1]],
    riflesso: ARCANI[(GEMATRIA_MESI[mese] + seme[1] + settimana[1]) % 22]
  }
}
