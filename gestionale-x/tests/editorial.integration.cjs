// Called by the existing emulator runner: real React, Auth, Firestore rules and backend logic.
// Only language generation is injected. No production account/data is reachable.
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const { pathToFileURL } = require('node:url')

module.exports = async function testEditorial({ browser, owner, intruso, APP, BACKEND, OUT, preparaContesto, entra, passo, page, rest }) {
  const root = path.resolve(__dirname, '..')
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8299'
  const admin = require(path.join(root, 'backend/node_modules/firebase-admin'))
  const app = admin.initializeApp({ projectId: 'demo-gestionale-x' }, 'editorial-test')
  const db = app.firestore()
  const { creaEditor, leggiRisposta } = await import(pathToFileURL(path.join(root, 'backend/editoriale.js')))
  let calls = 0, failNext = false, delay = 0, contextSeen = ''
  const editor = creaEditor({
    db, timestamp: () => admin.firestore.FieldValue.serverTimestamp(),
    progetti: async userId => (await db.collection('projects').where('userId', '==', userId).get()).docs.map(d => ({ id: d.id, ...d.data() })),
    vault: async () => ({ leggi: async () => null }),
    genera: async messages => {
      calls++; contextSeen = JSON.stringify(messages)
      if (failNext) { failNext = false; throw new Error('Failure used by test') }
      await new Promise(r => setTimeout(r, delay))
      return {
        reply: `Partiamo dalle tue parole. **Due video collegati**: il primo mostra l’idea, il secondo la prova.\n\n${messages.at(-1).content}`,
        summary: 'Due video collegati: idea e prova. La frase originale va mantenuta. Voce ancora da decidere.',
        model: 'modello-simulato',
      }
    },
  })
  const contexts = []
  async function device(viewport) {
    const ctx = await browser.newContext({ viewport, locale: 'it-IT', timezoneId: 'Europe/Rome' })
    contexts.push(ctx)
    await preparaContesto(ctx)
    await ctx.route('**/api/editoriale/rispondi', async route => {
      const body = route.request().postDataJSON()
      try {
        await editor(owner.uid, body.threadId, body.turnId)
        await route.fulfill({ contentType: 'application/json', body: '{"ok":true}' })
      } catch (e) {
        await route.fulfill({ status: e.status || 502, contentType: 'application/json', body: JSON.stringify({ error: e.message }) })
      }
    })
    const pg = await ctx.newPage()
    await entra(pg)
    await pg.goto(`${APP}#/editoriale`)
    await pg.getByLabel('Il tuo spunto').waitFor()
    return { ctx, pg }
  }
  const waitFor = async fn => {
    for (let n = 0; n < 80; n++) { if (await fn()) return; await new Promise(r => setTimeout(r, 100)) }
    throw new Error('Editorial condition timed out')
  }
  let mobile, desktop, threadId, firstContentId
  try {
    await passo(page, 'Laboratorio: spunto dal telefono, bozza recuperata e ripresa dal PC', async () => {
      mobile = await device({ width: 390, height: 844 })
      await mobile.pg.getByLabel('Il tuo spunto').fill('Il mio gancio originale: una molletta sul naso. Due video!')
      await mobile.pg.reload()
      assert.equal(await mobile.pg.getByLabel('Il tuo spunto').inputValue(), 'Il mio gancio originale: una molletta sul naso. Due video!')
      await mobile.pg.getByRole('button', { name: 'Salva spunto', exact: true }).click()
      await mobile.pg.locator('article').getByText('Il mio gancio originale:', { exact: false }).waitFor()
      desktop = await device({ width: 1360, height: 900 })
      await desktop.pg.getByRole('button', { name: 'Sviluppa', exact: true }).click()
      await desktop.pg.getByLabel('Continua il discorso').waitFor()
      threadId = desktop.pg.url().split('/').at(-1)
      await desktop.pg.getByRole('button', { name: 'Chiedi all’assistente' }).click()
      await desktop.pg.getByText('Due video collegati', { exact: true }).waitFor()
      assert(contextSeen.includes('molletta sul naso'))
      await desktop.pg.screenshot({ path: path.join(OUT, 'editoriale-desktop.png'), fullPage: true })
      await mobile.pg.goto(`${APP}#/editoriale/${threadId}`)
      await mobile.pg.getByText('Due video collegati', { exact: true }).waitFor()
      assert(await mobile.pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      await mobile.pg.screenshot({ path: path.join(OUT, 'editoriale-telefono.png'), fullPage: true })
      await mobile.pg.locator('.ed-context > summary').click()
    })
    await passo(page, 'Laboratorio: due contenuti, versioni e riepilogo condivisi', async () => {
      const p = desktop.pg
      await p.getByRole('button', { name: 'Nuovo contenuto', exact: true }).click()
      await p.getByLabel('Titolo del contenuto').fill('Video 1 — La molletta')
      await p.getByLabel('Testo completo').fill('La mia prima versione, molto personale.')
      await p.getByLabel('Scaletta da parlare').fill('Mostro la molletta → racconto il problema')
      await p.getByRole('button', { name: 'Salva contenuto' }).click()
      await p.getByRole('button', { name: /Video 1 — La molletta/ }).waitFor()
      firstContentId = (await db.collection('editorial').where('kind', '==', 'content').get()).docs[0].id
      await p.getByRole('button', { name: 'Nuovo contenuto', exact: true }).click()
      await p.getByLabel('Titolo del contenuto').fill('Video 2 — La prova')
      await p.getByLabel('Scene da girare').fill('Primo piano, disegno su carta, risultato')
      await p.getByRole('button', { name: 'Salva contenuto' }).click()
      await mobile.pg.getByRole('button', { name: /Video 2 — La prova/ }).waitFor()
      await p.getByRole('button', { name: /Video 1 — La molletta/ }).click()
      await p.getByLabel('Testo completo').fill('Seconda versione con un attacco migliore.')
      await p.getByRole('button', { name: 'Salva contenuto' }).click()
      await waitFor(async () => {
        const versions = await db.collection('editorial').doc(firstContentId).collection('versions').get()
        return versions.docs.some(d => d.data().script === 'La mia prima versione, molto personale.')
      })
      assert((await db.collection('editorial').doc(threadId).get()).data().summary.includes('Due video'))
      await p.getByRole('button', { name: /Video 2 — La prova/ }).click()
      await p.screenshot({ path: path.join(OUT, 'editoriale-scheda.png'), fullPage: true })
      await p.getByRole('button', { name: 'Chiudi scheda' }).click()
    })
    await passo(page, 'Laboratorio: errore AI, originale conservato e riprova senza duplicati', async () => {
      failNext = true
      const p = desktop.pg
      await p.getByLabel('Continua il discorso').fill('Questa frase deve sopravvivere al guasto.')
      await p.getByRole('button', { name: 'Invia all’assistente' }).click()
      await p.getByRole('button', { name: 'Riprova risposta' }).waitFor()
      const before = await db.collection('editorial').doc(threadId).collection('turns').get()
      assert(before.docs.some(d => d.data().text === 'Questa frase deve sopravvivere al guasto.' && !d.data().reply))
      await p.getByRole('button', { name: 'Riprova risposta' }).click()
      await waitFor(async () => (await db.collection('editorial').doc(threadId).collection('turns').get()).docs.every(d => d.data().reply))
      const after = await db.collection('editorial').doc(threadId).collection('turns').get()
      assert.equal(after.size, before.size)
      const priorCalls = calls
      await editor(owner.uid, threadId, after.docs[0].id)
      assert.equal(calls, priorCalls, 'Idempotent retry must not call AI again')
    })
    await passo(page, 'Laboratorio: risposta tardiva e doppia richiesta non cambiano conversazione', async () => {
      delay = 1300
      const p = desktop.pg
      await p.getByLabel('Continua il discorso').fill('Vorrei collegare il primo video al secondo.')
      await p.getByRole('button', { name: 'Invia all’assistente' }).click()
      await waitFor(async () => (await db.collection('editorial').doc(threadId).get()).data().leaseUntil > Date.now())
      const pending = (await db.collection('editorial').doc(threadId).collection('turns').get()).docs.find(d => !d.data().reply)
      await assert.rejects(editor(owner.uid, threadId, pending.id), e => e.status === 409)
      await p.getByRole('link', { name: '← Tutto il laboratorio' }).click()
      await waitFor(async () => (await pending.ref.get()).data().reply)
      await p.goto(`${APP}#/editoriale/${threadId}`)
      await p.locator('.ed-answer').getByText('Vorrei collegare il primo video al secondo.', { exact: false }).waitFor()
      assert(contextSeen.includes('Video 2 — La prova'), 'AI sees content cards')
      delay = 0
    })
    await passo(page, 'Laboratorio: modifiche concorrenti segnalate e bozza preservata', async () => {
      await mobile.pg.getByRole('button', { name: /Video 1 — La molletta/ }).click()
      await mobile.pg.getByLabel('Testo completo').fill('Bozza dal telefono da non perdere.')
      await desktop.pg.getByRole('button', { name: /Video 1 — La molletta/ }).click()
      await desktop.pg.getByLabel('Testo completo').fill('Versione salvata dal computer.')
      await desktop.pg.getByRole('button', { name: 'Salva contenuto' }).click()
      await mobile.pg.getByRole('button', { name: 'Salva contenuto' }).click()
      await mobile.pg.getByRole('alert').filter({ hasText: 'Modificato su un altro dispositivo' }).waitFor()
      assert.equal(await mobile.pg.getByLabel('Testo completo').inputValue(), 'Bozza dal telefono da non perdere.')
      assert.equal((await db.collection('editorial').doc(firstContentId).get()).data().script, 'Versione salvata dal computer.')
    })
    await passo(page, 'Laboratorio: regole proprietario, originali immutabili e risposta JSON validata', async () => {
      assert.equal((await rest('GET', `/editorial/${threadId}`, null, intruso.token)).status, 403)
      const turns = (await db.collection('editorial').doc(threadId).collection('turns').get()).docs
      assert.equal((await rest('GET', `/editorial/${threadId}/turns/${turns[0].id}`, null, intruso.token)).status, 403)
      assert.equal((await rest('PATCH', `/editorial/${threadId}/turns/${turns[0].id}?updateMask.fieldPaths=text`, { fields: { text: { stringValue: 'Alterazione' } } }, owner.token)).status, 403)
      const r = await fetch(`${BACKEND}/api/editoriale/rispondi`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${intruso.token}` }, body: JSON.stringify({ threadId, turnId: turns[0].id }) })
      assert.equal(r.status, 403)
      await assert.rejects(editor(intruso.uid, threadId, turns[0].id), e => e.status === 404)
      assert.throws(() => leggiRisposta('{"reply":"tagliata'))
      assert.throws(() => leggiRisposta('{"reply":"ok"}'))
      assert.equal(leggiRisposta('```json\n{"reply":"ok","summary":"memoria"}\n```').reply, 'ok')
      fs.writeFileSync(path.join(OUT, 'editorial-evidence.json'), JSON.stringify({ calls, threadId, contentCount: 2, originalPreserved: true, model: 'simulated' }, null, 2))
    })
    await passo(page, 'Laboratorio: raccolta senza rete e regia con memoria di altri lavori', async () => {
      const p = desktop.pg
      await p.goto(`${APP}#/editoriale`)
      await p.getByLabel('Il tuo spunto').waitFor()
      await desktop.ctx.setOffline(true)
      await p.getByLabel('Il tuo spunto').fill('Spunto raccolto senza rete: conservare questa frase.')
      await p.getByRole('button', { name: 'Salva spunto', exact: true }).click()
      await p.getByText('In attesa di sincronizzazione', { exact: true }).waitFor()
      await desktop.ctx.setOffline(false)
      await waitFor(async () => (await db.collection('editorial').where('kind', '==', 'spark').get()).docs.some(d => d.data().original.startsWith('Spunto raccolto senza rete')))
      await p.getByLabel('Il tuo spunto').fill('Vediamo insieme tutti i lavori in corso.')
      await p.getByRole('button', { name: 'Ragioniamoci', exact: true }).click()
      await p.locator('.ed-answer').waitFor()
      assert(contextSeen.includes('Due video collegati: idea e prova.'), 'Regia receives other conversations summary')
      await p.goto(`${APP}#/editoriale`)
      await p.getByLabel('Il tuo spunto').waitFor()
      await p.screenshot({ path: path.join(OUT, 'editoriale-panoramica.png'), fullPage: true })
    })
  } finally {
    for (const ctx of contexts) await ctx.close()
    await app.delete()
  }
}
