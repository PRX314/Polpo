// Prova del discorso del mattino coi modelli VERI e la voce VERA, su dati finti: tre mattine diverse.
// Non tocca Firebase. Le chiavi arrivano da backend/.env (GROQ_API_KEY, ANTHROPIC_API_KEY).
//
//   node tester/prova-mattino.mjs [--env <percorso del .env>] [--voce] [--giri N]
//
// Con --voce registra i discorsi: gli MP3 finiscono in tester/referti/mattino-<data-ora>/.
// Come prova-chat costa qualche centesimo e dipende dalla rete: non sta in PLANCIA.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from '../backend/node_modules/dotenv/lib/main.js'
import { MsEdgeTTS, OUTPUT_FORMAT } from '../backend/node_modules/msedge-tts/dist/index.js'
import { discorsoDiRiserva, discorsoValido, meteoChiavari, oggiRoma, perLaVoce, piuGiorni, promptMattino, raccogliFatti } from '../backend/mattino.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const opzione = (nome) => { const i = argv.indexOf(nome); return i >= 0 ? argv[i + 1] : undefined }
dotenv.config({ path: opzione('--env') || join(QUI, '..', 'backend', '.env'), quiet: true })

const OGGI = oggiRoma()
const IERI = piuGiorni(OGGI, -1)
const decisione = `- **${IERI} (Peppino più svelto)**: Paolo: più veloce e con un modo di parlare normale. Ragionamento basso: prima parola in mezzo secondo invece di 5,7. Backend e frontend online la stessa mattina.\n- **2026-10-29**: roba vecchia`

const piena = {
  progetti: [
    { id: 'g', name: 'Gestionale X', fonte: 'vault', vaultAggiornato: IERI, pinned: true, status: 'in_progress', sections: [{ title: 'Decisioni recenti', content: decisione }],
      todos: [{ text: "**Prova di Peppino sull'iPhone** (dal 06/11) — tocca il polpo e parla", daVault: true }] },
    { id: 'u', name: 'Ungesto', fonte: 'vault', vaultAggiornato: IERI, pinned: true, status: 'in_progress', todos: [{ text: 'Mandare a Vinoria il foglio Registro' }] },
    { id: 'f', name: 'Fabulus', fonte: 'vault', vaultAggiornato: piuGiorni(OGGI, -4), pinned: true, status: 'in_progress', todos: [{ text: 'Rivedere il tutorial', daVault: true }] },
    { id: 'p', name: 'Personale', personale: true, status: 'in_progress', todos: [{ text: 'Chiamare il commercialista', deadline: OGGI, time: '11:00' }, { text: 'Rinnovo carta identità', deadline: piuGiorni(OGGI, -3) }] }
  ],
  eventi: [
    { title: 'Dentista', date: OGGI, time: '15:00' },
    { title: 'Bollo auto', date: piuGiorni(OGGI, 3), admin: true, amount: 187 },
    { title: 'Cena da Ava', date: piuGiorni(OGGI, 1), time: '20:30' }
  ],
  routine: {
    tasks: [{ id: 't1', name: 'Arte (disegno x Ava)' }, { id: 't2', name: 'Sport', time: '18:00' }, { id: 't3', name: 'Lavoro su PC' }],
    timeBlocks: [{ id: 'b1', label: 'Lavoro', start: 7, end: 13 }, { id: 'b2', label: 'Pranzo', start: 13, end: 14 }, { id: 'b3', label: '3h O.G.', start: 14, end: 17 }],
    dayTasks: { [IERI]: { t1: true, t3: true } },
    sveglia: { frasi: [{ testo: 'Prima finisco una cosa, poi ne apro un\'altra.' }] },
    treCose: { [OGGI]: { voci: [{ testo: 'Mandare il foglio a Vinoria' }, { testo: 'Provare Peppino sul telefono' }, { testo: 'Chiudere il preventivo di Walter' }] } }
  }
}

// Come il gestionale al 24/10: niente date, niente primo piano, routine ferma. Solo il lavoro di ieri.
const povera = {
  progetti: [
    { id: 'g', name: 'Gestionale X', fonte: 'vault', vaultAggiornato: IERI, status: 'in_progress', sections: [{ title: 'Decisioni recenti', content: decisione }],
      todos: [{ text: '**`firebase-admin` 12 → 14** (2 alte di `node-forge`)', daVault: true }, { text: 'Riordino delle cose da fare col dito su iPhone', daVault: true }] },
    { id: 'e', name: 'ECO', fonte: 'vault', vaultAggiornato: IERI, status: 'in_progress', todos: [{ text: 'Smart Turn in `/api/ascolta` al posto del secondo di silenzio fisso', daVault: true }] }
  ],
  routine: { tasks: [{ id: 't1', name: 'Sport' }], timeBlocks: [{ id: 'b1', label: 'Lavoro', start: 7, end: 13 }] }
}

const vuota = { progetti: [], eventi: [], routine: null }

const CASI = { piena, povera, vuota }

async function groq(messaggi) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-oss-120b', messages: messaggi, max_tokens: 4000, reasoning_effort: 'medium' })
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error?.message || r.status)
  return d.choices[0].message.content
}

async function haiku(messaggi) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-5-5', max_tokens: 16000, system: messaggi[0].content, messages: messaggi.slice(1), thinking: { type: 'adaptive' }, output_config: { effort: 'medium' } })
  })
  const d = await r.json()
  if (!r.ok) throw new Error(d.error?.message || r.status)
  return d.content.filter(b => b.type === 'text').map(b => b.text).join('')
}

function voce(testo) {
  return new Promise((risolvi, rifiuta) => {
    const tts = new MsEdgeTTS()
    const pezzi = []
    tts.setMetadata('it-IT-IsabellaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3).then(() => {
      const { audioStream } = tts.toStream(testo, { rate: '+12%', pitch: '-25Hz' })
      audioStream.on('data', p => pezzi.push(p))
      audioStream.on('error', rifiuta)
      audioStream.on('end', () => { try { tts.close() } catch { /* già chiuso */ } risolvi(Buffer.concat(pezzi)) })
    }).catch(rifiuta)
  })
}

const VOCE = argv.includes('--voce')
const GIRI = Number(opzione('--giri')) || 1
const OUT = join(QUI, 'referti', `mattino-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}`)
if (VOCE) mkdirSync(OUT, { recursive: true })

const meteo = await meteoChiavari()
console.log(`Meteo vero: ${meteo?.frase || 'non arrivato'}\n`)

for (const [nome, dati] of Object.entries(CASI)) {
  const fatti = raccogliFatti({ ...dati, oggi: OGGI, meteo })
  console.log(`━━━ Mattina ${nome} ━━━`)
  console.log(`Tre cose: ${fatti.treCose.voci.map(v => v.testo).join(' | ') || '(nessuna)'}`)
  console.log(`\n[riserva] ${discorsoDiRiserva(fatti)}\n`)
  for (const [modello, scrivi] of [['Groq gpt-oss-120b', groq], ['Claude Haiku 5.5', haiku]]) {
    let validi = 0
    for (let giro = 1; giro <= GIRI; giro++) {
      const t0 = Date.now()
      try {
        const testo = perLaVoce(await scrivi(promptMattino(fatti)))
        const valido = discorsoValido(testo, fatti)
        if (valido) validi++
        // Di ogni modello si legge il primo giro e quelli scartati
        if (giro === 1 || !valido) console.log(`[${modello}, giro ${giro}] ${testo.split(/\s+/).length} parole, ${((Date.now() - t0) / 1000).toFixed(1)} s, ${valido ? 'valido' : 'SCARTATO'}\n${testo}\n`)
        if (VOCE && giro === 1) {
          const t1 = Date.now()
          const audio = await voce(testo)
          const file = join(OUT, `${nome}-${modello.split(' ')[0].toLowerCase()}.mp3`)
          writeFileSync(file, audio)
          console.log(`  voce: ${(audio.length / 1024).toFixed(0)} kB, circa ${(audio.length / 6000).toFixed(0)} s di parlato, registrata in ${((Date.now() - t1) / 1000).toFixed(1)} s\n`)
        }
      } catch (err) {
        console.log(`[${modello}, giro ${giro}] ERRORE: ${err.message}\n`)
      }
    }
    if (GIRI > 1) console.log(`→ ${modello}: ${validi} validi su ${GIRI}\n`)
  }
}
