// Il discorso del mattino: i conti, senza rete né database.   node --test tests/mattino.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { createSign, generateKeyPairSync } from 'node:crypto'
import {
  creaMattino, discorsoDiRiserva, discorsoValido, formatoFatti, oraDetta, perLaVoce, piuGiorni, proponiTreCose, pulisci, raccogliFatti, titoloVoce, verificaServizio
} from '../backend/mattino.js'
import { stesaDelGiorno } from '../backend/mazzoAnno.js'
import { leggiMazzo } from '../src/lib/mazzoAnno.js'

const OGGI = '2026-11-07' // sabato
const IERI = '2026-11-06'
const meteo = { cielo: 'sereno', min: 9, max: 16, pioggia: 0, frase: 'sereno, tra 9 e 16 gradi' }

test('i testi del vault diventano parole da dire', () => {
  assert.equal(pulisci('Vedi [[60-Chats/2026-11-06 Peppino|la chat]] e **[il sito](https://x.it)** `ora`'), 'Vedi la chat e il sito ora')
  assert.equal(titoloVoce("**Prova di Peppino sull'iPhone** (dal 06/11) — tocca il polpo"), "Prova di Peppino sull'iPhone")
  assert.equal(titoloVoce('Mandare il preventivo — con lo sconto'), 'Mandare il preventivo')
  assert.equal(perLaVoce('**Buongiorno** 🐙 Paolo'), 'Buongiorno Paolo')
  assert.equal(pulisci('Comprare <cavi> nuovi'), 'Comprare cavi nuovi')
})

test('oggi: appuntamenti, scadenze e pagamenti in ordine di ora; le cose indietro si contano', () => {
  const f = raccogliFatti({
    oggi: OGGI,
    eventi: [
      { title: 'Dentista', date: OGGI, time: '15:00' },
      { title: 'Colazione', date: OGGI, time: '08:30' },
      { title: 'Già fatto', date: OGGI, done: true },
      { title: 'Bollo auto', date: OGGI, admin: true, amount: 120 },
      { title: 'Tari', date: '2026-11-10', admin: true, amount: 88 },
      { title: 'Vecchia tassa', date: '2026-11-01', admin: true },
      { title: 'Cena', date: '2026-11-08', time: '20:00' },
      { title: 'Lontano', date: '2026-12-01' }
    ],
    progetti: [
      { id: 'a', name: 'Ungesto', deadline: OGGI, deadlineTime: '18:00', todos: [
        { text: 'Mandare fattura', deadline: OGGI, time: '10:00' },
        { text: 'Scaduta', deadline: '2026-11-02' },
        { text: 'Fatta', deadline: OGGI, completed: true }] },
      { id: 'b', name: 'Archiviato', archived: true, deadline: OGGI, todos: [] }
    ]
  })
  assert.deepEqual(f.impegni.map(i => i.testo), ['Colazione', 'Mandare fattura', 'Dentista', 'scade Ungesto', 'Bollo auto'])
  assert.equal(f.impegni.at(-1).importo, 120)
  assert.deepEqual(f.indietro, ['Vecchia tassa', 'Scaduta'])
  assert.deepEqual(f.pagamenti.map(p => p.testo), ['Tari'])
  assert.deepEqual(f.domani, [{ ora: '20:00', testo: 'Cena' }])
  assert.equal(f.giorno, 'sabato 7 novembre')
})

test('la routine vale solo nei suoi giorni, e di ieri si parla solo se è stata usata', () => {
  const routine = {
    tasks: [{ id: 't1', name: 'Sport', time: '18:00' }, { id: 't2', name: 'Solo lunedì', days: [1] }, { id: 't3', name: 'Disegno' }],
    timeBlocks: [{ id: 'b2', label: 'Pranzo', start: 13, end: 14 }, { id: 'b1', label: 'Lavoro', start: 7.5, end: 13 }],
    dayTasks: { [IERI]: { t1: true } }
  }
  const f = raccogliFatti({ oggi: OGGI, routine })
  assert.deepEqual(f.routine.attivita.map(a => a.nome), ['Sport', 'Disegno'])
  assert.deepEqual(f.routine.blocchi[0], { nome: 'Lavoro', da: '07:30', a: '13:00' })
  assert.deepEqual(f.ieri.routine, { fatte: 1, totali: 2, stato: '' })
  assert.equal(raccogliFatti({ oggi: OGGI, routine: { ...routine, dayTasks: {} } }).ieri.routine, null)
})

test('ieri: progetti toccati e decisioni prese dalle note del vault', () => {
  const f = raccogliFatti({
    oggi: OGGI,
    progetti: [{
      id: 'g', name: 'Gestionale X', fonte: 'vault', vaultAggiornato: IERI,
      sections: [{ title: 'Decisioni recenti', content: `- **${IERI} (Peppino svelto)**: Paolo: più veloce, [[una chat]].\n- **2026-10-29**: roba vecchia` }]
    }, { id: 'v', name: 'Fermo', fonte: 'vault', vaultAggiornato: '2026-05-01', todos: [] }]
  })
  assert.deepEqual(f.ieri.lavorato, ['Gestionale X'])
  assert.deepEqual(f.ieri.decisioni, [{ progetto: 'Gestionale X', testo: '(Peppino svelto) Paolo: più veloce, una chat.' }])
})

test('le tre cose: prima le scadenze, poi il primo piano, poi il lavoro recente; una per progetto, prima quelle scritte a mano', () => {
  const progetti = [
    { id: 'p1', name: 'Primo', pinned: true, fonte: 'vault', vaultAggiornato: '2026-10-01', todos: [
      { text: '**Passo dal vault** — lungo', daVault: true }, { text: 'Scritta a mano' }] },
    { id: 'p2', name: 'Recente', fonte: 'vault', vaultAggiornato: IERI, todos: [{ text: 'Passo recente', daVault: true }] },
    { id: 'p3', name: 'Fermo', fonte: 'vault', vaultAggiornato: '2026-01-01', todos: [{ text: 'Mai' }] },
    { id: 'p4', name: 'Personale', personale: true, todos: [{ text: 'Pagare il bollo', deadline: OGGI }] },
    { id: 'p5', name: 'Finito', status: 'completed', pinned: true, todos: [{ text: 'No' }] }
  ]
  const tre = proponiTreCose(progetti, OGGI)
  assert.deepEqual(tre.map(v => v.testo), ['Pagare il bollo', 'Scritta a mano', 'Passo recente'])
  assert.equal(tre[0].progetto, '')
  assert.equal(tre[1].todo, 'Scritta a mano')
})

test('le tre cose di Paolo vincono sulle proposte', () => {
  const routine = { treCose: { [OGGI]: { voci: [{ testo: 'Chiamare Walter' }, { testo: '  ' }] } } }
  const f = raccogliFatti({ oggi: OGGI, routine, progetti: [{ id: 'x', name: 'X', pinned: true, todos: [{ text: 'Altro' }] }] })
  assert.deepEqual(f.treCose, { voci: [{ testo: 'Chiamare Walter' }], scelte: true })
  assert.equal(raccogliFatti({ oggi: OGGI, routine: { treCose: { [OGGI]: { voci: [{ testo: 'A' }], proposte: true } } } }).treCose.scelte, false)
})

test('frasi e pensieri girano un giorno a testa, con le parole di Paolo', () => {
  const routine = { sveglia: { frasi: [{ testo: 'Una cosa alla volta' }, { testo: 'Prima il telefono spento' }] } }
  const appunti = [{ text: 'Chi aspetta il momento giusto non parte mai\n#pensieri', createdAt: '2026-10-01' }, { text: 'lista spesa' }, { text: '#pensiero corto' }]
  const giri = new Set()
  for (let i = 0; i < 3; i++) giri.add(raccogliFatti({ oggi: piuGiorni(OGGI, i), routine, appunti }).frase.testo)
  assert.deepEqual([...giri].sort(), ['Chi aspetta il momento giusto non parte mai', 'Prima il telefono spento', 'Una cosa alla volta'])
})

test('le voci spente non entrano nel discorso', () => {
  const routine = { sveglia: { voci: { meteo: false, agenda: false, routine: false, ieri: false, pensiero: false, primoPiano: false }, frasi: ['Una frase'] }, tasks: [{ id: 't', name: 'Sport' }] }
  const f = raccogliFatti({ oggi: OGGI, routine, meteo, eventi: [{ title: 'Dentista', date: OGGI }] })
  const testo = formatoFatti(f)
  for (const parola of ['METEO', '\nOGGI:', 'Dentista', 'Sport', 'FRASE']) assert.ok(!testo.includes(parola), parola)
})

test('il discorso di riserva si capisce anche senza modello', () => {
  const f = raccogliFatti({ oggi: OGGI, meteo, eventi: [{ title: 'Dentista', date: OGGI, time: '15:00' }, { title: 'Vecchia', date: '2026-11-01', admin: true }] })
  const testo = discorsoDiRiserva(f)
  for (const pezzo of ['sabato 7 novembre', 'sereno', 'alle 15 Dentista', 'Una cosa è rimasta indietro']) assert.ok(testo.includes(pezzo), pezzo)
  assert.ok(discorsoDiRiserva(raccogliFatti({ oggi: OGGI })).includes('In agenda oggi non c\'è niente'))
  const conFrase = raccogliFatti({ oggi: OGGI, routine: { sveglia: { frasi: ['Una cosa alla volta'] } } })
  assert.ok(discorsoDiRiserva(conFrase).includes('Ti eri scritto: Una cosa alla volta. '))
})

test('gli orari si dicono come si parla', () => {
  assert.equal(oraDetta('15:00'), '15')
  assert.equal(oraDetta('09:30'), '9 e 30')
})

test('il controllo butta le invenzioni: orari che non ci sono e frasi mai scritte', () => {
  const f = raccogliFatti({
    oggi: OGGI,
    eventi: [{ title: 'Dentista', date: OGGI, time: '15:00' }],
    routine: { timeBlocks: [{ id: 'b', label: 'Lavoro', start: 7, end: 13 }] }
  })
  const riempi = Array(45).fill('parola').join(' ')
  assert.equal(discorsoValido(`Buongiorno Paolo, alle 15 il dentista e lavori dalle 7 alle 13. ${riempi}`, f), true)
  assert.equal(discorsoValido(`Buongiorno Paolo, alle 16 il dentista. ${riempi}`, f), false)
  assert.equal(discorsoValido(`Buongì, alle 15 il dentista. ${riempi}`, f), false)
  assert.equal(discorsoValido(`Buongiorno Paolo, ti eri scritto: mi sento pronto. ${riempi}`, f), false)
  assert.equal(discorsoValido('Buongiorno Paolo, corto.', f), false)
})

test('le parole di Paolo restano le sue: storpiate o saltate, il discorso si butta', () => {
  const f = raccogliFatti({ oggi: OGGI, routine: { sveglia: { frasi: ["Prima finisco una cosa, poi ne apro un'altra."] } } })
  const riempi = Array(45).fill('parola').join(' ')
  assert.equal(discorsoValido(`Buongiorno Paolo. Ti eri scritto: «Prima finisco una cosa, poi ne apro un’altra.» ${riempi}`, f), true)
  assert.equal(discorsoValido(`Buongiorno Paolo. Ti eri scritto: prima finisco una cosa, poi ne aprò l'altra. ${riempi}`, f), false)
  assert.equal(discorsoValido(`Buongiorno Paolo. ${riempi}`, f), false)
})

test('tra le voci di un progetto si propongono quelle che si possono dire', () => {
  const progetti = [{ id: 'p', name: 'P', pinned: true, todos: [
    { text: '`firebase-admin` 12 → 14', daVault: true }, { text: 'Riordino delle cose da fare col dito', daVault: true }] }]
  assert.equal(proponiTreCose(progetti, OGGI)[0].testo, 'Riordino delle cose da fare col dito')
  assert.equal(perLaVoce('firebase-admin 12 → 14'), 'firebase-admin 12 verso 14')
})

test('quello che manca si dice al modello, così non lo riempie', () => {
  const testo = formatoFatti(raccogliFatti({ oggi: OGGI }))
  for (const riga of ['IERI: nessun dato, non parlarne', 'FRASE DI PAOLO: nessuna, non citarne', 'OGGI: niente in agenda', 'LE COSE DI OGGI: nessuna, non proporne']) assert.ok(testo.includes(riga), riga)
})

test('dei blocchi passa solo il primo, e le proposte sono dette come idee di Peppino', () => {
  const testo = formatoFatti(raccogliFatti({
    oggi: OGGI,
    routine: { timeBlocks: [{ id: 'b', label: '3h O.G.', start: 14, end: 17 }, { id: 'a', label: 'Lavoro', start: 7, end: 13 }] },
    progetti: [{ id: 'p', name: 'P', pinned: true, todos: [{ text: 'Passo' }] }]
  }))
  assert.ok(testo.includes('PRIMO BLOCCO DELLA GIORNATA: Lavoro dalle 7 alle 13'))
  assert.ok(!testo.includes('O.G.'))
  assert.ok(testo.includes('LE TUE PROPOSTE PER OGGI (idee tue, non sue)'))
})

test('il Mazzo ridotto dà gli stessi nomi di quello completo, tutto l\'anno e negli anni bisestili', () => {
  for (const inizio of ['2026-03-01', '2027-12-01']) {
    for (let i = 0; i < 400; i++) {
      const iso = piuGiorni(inizio, i)
      const pieno = leggiMazzo(iso)
      const breve = stesaDelGiorno(iso)
      assert.equal(breve.nome, pieno.nome, iso)
      if (pieno.fuori) continue
      assert.ok(pieno.carte[2].titolo.endsWith(breve.giorno), iso)
      assert.ok(pieno.carte[1].titolo.endsWith(breve.mese), iso)
      assert.ok(pieno.carte[3].titolo.endsWith(breve.riflesso), iso)
    }
  }
})

test('il gettone del Worker: firma giusta sì; scaduto, altro destinatario o altra chiave no', () => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const altra = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey
  const pem = (k) => k.export({ type: 'pkcs8', format: 'pem' })
  const account = { client_email: 'servizio@test', private_key: pem(privateKey) }
  const ora = 1800000000
  const b64 = (x) => Buffer.from(JSON.stringify(x)).toString('base64url')
  const gettone = (dati, chiave = privateKey) => {
    const testa = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64(dati)}`
    return `${testa}.${createSign('RSA-SHA256').update(testa).sign(chiave, 'base64url')}`
  }
  const buono = { iss: 'servizio@test', aud: 'mattino', iat: ora, exp: ora + 120 }
  assert.equal(verificaServizio(gettone(buono), account, ora * 1000), true)
  assert.equal(verificaServizio(gettone(buono), account, (ora + 200) * 1000), false)
  assert.equal(verificaServizio(gettone({ ...buono, exp: ora + 4000 }), account, ora * 1000), false)
  assert.equal(verificaServizio(gettone({ ...buono, aud: 'altro' }), account, ora * 1000), false)
  assert.equal(verificaServizio(gettone({ ...buono, iss: 'altro@test' }), account, ora * 1000), false)
  assert.equal(verificaServizio(gettone(buono, altra), account, ora * 1000), false)
  assert.equal(verificaServizio('non.un.gettone', account, ora * 1000), false)
  assert.equal(verificaServizio(gettone(buono), null, ora * 1000), false)
})

// ---------------------------------------------------------------- la preparazione

function dbFinto(iniziali = {}) {
  const docs = new Map(Object.entries(iniziali))
  const doc = (coll, id) => ({
    async get() { const d = docs.get(`${coll}/${id}`); return { exists: !!d, data: () => d, id } },
    async set(valore, opzioni) {
      const prima = opzioni?.merge ? docs.get(`${coll}/${id}`) || {} : {}
      const dopo = { ...prima, ...valore }
      for (const [k, v] of Object.entries(valore)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date) && !Buffer.isBuffer(v)) {
          dopo[k] = { ...prima[k], ...v }
          for (const [c, x] of Object.entries(v)) if (x === CANCELLA) delete dopo[k][c]
        }
      }
      docs.set(`${coll}/${id}`, dopo)
    },
    async delete() { docs.delete(`${coll}/${id}`) }
  })
  const collezione = (coll) => ({
    doc: (id) => doc(coll, id),
    where: () => collezione(coll),
    async get() {
      return { docs: [...docs].filter(([k]) => k.startsWith(`${coll}/`)).map(([k, v]) => ({ id: k.split('/')[1], data: () => v })) }
    }
  })
  return { docs, collection: collezione }
}
const CANCELLA = Symbol('cancella')
const FieldValue = { delete: () => CANCELLA }
const silenzio = { warn() {} }
const lungo = `Buongiorno Paolo, ${Array.from({ length: 70 }, (_, i) => `parola${i}`).join(' ')}`

const mattinoDi = (db, altro = {}) => creaMattino({
  db, FieldValue, giorno: () => OGGI, meteo: async () => meteo, log: silenzio,
  scrivi: async () => ({ testo: lungo, modello: 'finto' }),
  voce: async () => Buffer.from('mp3'),
  ...altro
})

test('prepara: testo nell\'app, audio a parte, proposte salvate, una volta sola', async () => {
  const db = dbFinto({ 'projects/p': { name: 'P', pinned: true, todos: [{ text: 'Passo' }] } })
  let chiamate = 0
  const m = mattinoDi(db, { scrivi: async () => { chiamate++; return { testo: lungo, modello: 'finto' } } })
  const esito = await m.prepara('paolo')
  assert.equal(esito.stato, 'pronto')
  assert.equal(esito.audio, true)
  const routine = db.docs.get('routines/paolo')
  assert.equal(routine.mattino.data, OGGI)
  assert.equal(routine.mattino.testo, lungo)
  assert.deepEqual(routine.treCose[OGGI].voci.map(v => v.testo), ['Passo'])
  assert.equal(routine.treCose[OGGI].proposte, true)
  assert.ok(Buffer.isBuffer(db.docs.get(`mattini/paolo_${OGGI}`).audio))
  assert.ok(db.docs.get('mattini/paolo_riserva').audio)

  assert.equal((await m.prepara('paolo')).stato, 'gia-pronto')
  assert.equal(chiamate, 1)
  assert.equal((await m.prepara('paolo', { forza: true })).stato, 'pronto')
  assert.equal(chiamate, 2)
})

test('prepara: le tre cose di Paolo non si toccano, quelle vecchie si tolgono', async () => {
  const vecchia = piuGiorni(OGGI, -30)
  const db = dbFinto({ 'routines/paolo': { treCose: { [OGGI]: { voci: [{ testo: 'Mia' }] }, [vecchia]: { voci: [] } } } })
  await mattinoDi(db).prepara('paolo')
  const { treCose } = db.docs.get('routines/paolo')
  assert.deepEqual(treCose[OGGI].voci, [{ testo: 'Mia' }])
  assert.equal(treCose[vecchia], undefined)
})

test('prepara: senza modello parla coi dati, senza voce resta il testo', async () => {
  const db = dbFinto()
  const esito = await mattinoDi(db, {
    scrivi: async () => { throw new Error('giù') },
    voce: async () => { throw new Error('giù') }
  }).prepara('paolo')
  assert.equal(esito.modello, 'riserva')
  assert.equal(esito.audio, false)
  assert.match(esito.testo, /^Buongiorno Paolo/)
  assert.equal(db.docs.has(`mattini/paolo_${OGGI}`), false)
})

test('prepara: un discorso scartato si riprova una volta', async () => {
  let chiamate = 0
  const esito = await mattinoDi(dbFinto(), { scrivi: async () => ({ testo: ++chiamate === 1 ? 'Buongì.' : lungo, modello: 'finto' }) }).prepara('paolo')
  assert.equal(chiamate, 2)
  assert.equal(esito.modello, 'finto')
})

test('prepara: un discorso troppo corto o troppo lungo si butta', async () => {
  for (const testo of ['Buongiorno.', `Buongiorno Paolo ${Array(300).fill('parola').join(' ')}`]) {
    const esito = await mattinoDi(dbFinto(), { scrivi: async () => ({ testo, modello: 'finto' }) }).prepara('paolo')
    assert.equal(esito.modello, 'riserva')
  }
})

test('prepara: due richieste insieme fanno un lavoro solo', async () => {
  let chiamate = 0
  const m = mattinoDi(dbFinto(), { scrivi: async () => { chiamate++; return { testo: lungo, modello: 'finto' } } })
  await Promise.all([m.prepara('paolo'), m.prepara('paolo')])
  assert.equal(chiamate, 1)
})

test('prepara: gli audio più vecchi di una settimana si cancellano, la riserva resta', async () => {
  const vecchio = piuGiorni(OGGI, -9)
  const db = dbFinto({ [`mattini/paolo_${vecchio}`]: { audio: 'x' }, [`mattini/paolo_${piuGiorni(OGGI, -3)}`]: { audio: 'y' } })
  await mattinoDi(db).prepara('paolo')
  assert.equal(db.docs.has(`mattini/paolo_${vecchio}`), false)
  assert.equal(db.docs.has(`mattini/paolo_${piuGiorni(OGGI, -3)}`), true)
  assert.equal(db.docs.has('mattini/paolo_riserva'), true)
})
