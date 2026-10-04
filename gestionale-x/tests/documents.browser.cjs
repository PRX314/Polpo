const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = require('node:path').resolve(__dirname, '..').replaceAll('\\', '/');
(async () => {
 const { createServer, transformWithEsbuild } = await import(pathToFileURL(root+'/node_modules/vite/dist/node/index.js'));
 const mockFirebase = `export const auth={currentUser:{uid:'local-test'}}; export const db={}; export default {};`;
 const mockServices = `const noop=()=>{}; export const subscribeToProjects=fn=>{fn([{id:'test-project',name:'Casa di prova',type:'progetto',status:'in_progress',obiettivi:'Ridurre le spese'}]);return noop}; export const subscribeToNotes=fn=>{fn([]);return noop}; export const subscribeToRoutine=fn=>{fn(null);return noop}; export const subscribeToEvents=fn=>{fn([]);return noop}; export const addProject=noop,updateProject=noop,deleteProject=noop,deleteNote=noop,addEvent=noop,updateEvent=noop,deleteEvent=noop,saveRoutine=noop;`;
 const harness = `import React from 'react'; import {createRoot} from 'react-dom/client'; import {HashRouter,Routes,Route} from 'react-router-dom'; import {DataProvider} from '/src/context/DataProvider.jsx'; import Documents from '/src/pages/DocumentsPage.jsx'; import Calendar from '/src/pages/CalendarPage.jsx'; import Oggi from '/src/pages/OggiPage.jsx'; import Item from '/src/pages/ItemDetailPage.jsx'; import Shell from '/src/layout/Shell.jsx'; import '/src/styles/tokens.css'; import '/src/styles/base.css'; import '/src/styles/ui.css'; import '/src/styles/shell.css'; createRoot(document.getElementById('root')).render(<DataProvider><HashRouter><Routes><Route element={<Shell header={<h2>Gestionale X · prova locale</h2>}/>}><Route path='/' element={<Oggi/>}/><Route path='/documenti' element={<Documents/>}/><Route path='/documenti/:id' element={<Documents/>}/><Route path='/calendario' element={<Calendar/>}/><Route path='/elementi/:id' element={<Item/>}/></Route></Routes></HashRouter></DataProvider>);`;
 const server = await createServer({ root, configFile:false, esbuild:{jsx:'automatic'}, base:'/', server:{host:'127.0.0.1',port:5296,strictPort:true}, plugins:[{
  name:'local-documents-test', enforce:'pre',
  resolveId(id){ if (/^(\.\.\/|\.\/)firebase$/.test(id)) return '\0mock-firebase'; if (id.endsWith('/firebaseService')) return '\0mock-services'; if (id === '/harness.jsx') return '\0harness.jsx'; },
  async load(id){ if(id==='\0mock-firebase')return mockFirebase; if(id==='\0mock-services')return mockServices; if(id==='\0harness.jsx')return (await transformWithEsbuild(harness, 'harness.jsx', {loader:'jsx',jsx:'automatic'})).code; },
  configureServer(server){ server.middlewares.use((req,res,next)=>{if(req.url==='/test'){res.setHeader('Content-Type','text/html');res.end('<html><body><div id="root"></div><script type="module" src="/harness.jsx"></script></body></html>')}else next()}); }
 }] });
 await server.listen();
 const browser = await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge',headless:true});
 const page = await browser.newPage({viewport:{width:390,height:844}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto('http://127.0.0.1:5296/test#/documenti');
  await page.getByRole('heading',{name:'Documenti e file'}).waitFor();
  const synthetic='BOLLETTA DI PROVA\nFornitore Esempio\nTotale EUR 42,50\nScadenza 10/10/2026\nDocumento sintetico per collaudo.';
  await page.getByLabel('Aggiungi file',{exact:true}).setInputFiles({name:'bolletta-prova.txt',mimeType:'text/plain',buffer:Buffer.from(synthetic)});
  await page.getByText('Testo letto. Verifica il riepilogo e le scadenze con gli originali.',{exact:true}).waitFor();
  assert((await page.getByLabel('Riepilogo dettagliato').inputValue()).includes('42,50'));
  await page.getByLabel('Elemento o progetto collegato').selectOption('test-project');
  await page.getByLabel('Obiettivo di riferimento').fill('Ridurre le spese');
  await page.getByRole('button',{name:'Aggiungi scadenza',exact:true}).click();
  // Scadenza tra 6 giorni: deve cadere nelle "prossime due settimane" del calendario in qualsiasi giorno giri il test.
  const due=new Date(Date.now()+6*86400000); const dueIso=`${due.getFullYear()}-${String(due.getMonth()+1).padStart(2,'0')}-${String(due.getDate()).padStart(2,'0')}`;
  await page.getByLabel('Data',{exact:true}).fill(dueIso);
  await page.getByLabel('Importo €').fill('42,50');
  await page.getByRole('button',{name:'Salva modifiche',exact:true}).first().click();
  await page.getByText('Salvato su questo dispositivo',{exact:true}).waitFor();
  const detailUrl=page.url();
  await page.reload(); await page.getByLabel('Riepilogo dettagliato').waitFor();
  assert.equal(await page.getByLabel('Importo €').inputValue(),'42,50');
  // Tasto Indietro con modifiche non salvate: tornando sul documento la bozza viene riproposta.
  await page.getByLabel('Obiettivo di riferimento').fill('Bozza non salvata');
  await page.goBack(); await page.getByRole('heading',{name:'Documenti e file'}).waitFor();
  await page.goForward(); await page.getByText('Ho recuperato le modifiche non salvate',{exact:false}).waitFor();
  assert.equal(await page.getByLabel('Obiettivo di riferimento').inputValue(),'Bozza non salvata');
  await page.getByText('Modifiche da salvare',{exact:true}).waitFor();
  await page.getByLabel('Obiettivo di riferimento').fill('Ridurre le spese');
  await page.getByRole('button',{name:'Salva modifiche',exact:true}).first().click();
  await page.getByText('Salvato su questo dispositivo',{exact:true}).waitFor();
  const downloadPromise=page.waitForEvent('download'); await page.getByRole('button',{name:'Originale',exact:true}).click();
  const original=await downloadPromise; assert.equal(fs.readFileSync(await original.path(),'utf8'),synthetic);
  const textPromise=page.waitForEvent('download'); await page.getByRole('button',{name:'Scarica testo completo'}).click();
  const text=await textPromise; assert(fs.readFileSync(await text.path(),'utf8').includes('Ridurre le spese'));
  await page.getByRole('link',{name:'Apri Casa di prova'}).click();
  await page.getByRole('link',{name:'bolletta-prova · Ridurre le spese',exact:true}).waitFor();
  await page.goto('http://127.0.0.1:5296/test#/calendario');
  await page.getByRole('button').filter({hasText:'bolletta-prova · Scadenza'}).first().waitFor();
  await page.goto(detailUrl); await page.getByLabel('Riepilogo dettagliato').waitFor();
  await page.screenshot({path:require('node:path').join(require('node:os').tmpdir(), 'gestionale-documenti-mobile.png'),fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
  const result=await page.evaluate(async()=>{
   const m=await import('/src/services/localDocuments.js');
   const rows=await m.listDocuments('local-test'); const d=rows[0];
   if((await m.listDocuments('other-test')).length)throw Error('Cross-account leak');
   const backup=await m.exportBackup('local-test');
   const raw=JSON.parse(await backup.text());
   // A blank deadline is a valid draft, and must remain restorable.
   raw.documents[0].deadlines.push({id:'blank',date:'',label:'Da definire',amount:'',done:false});
   m.validateBackup(raw);
   const restored=await m.restoreBackup('other-test',backup);
   const second=await m.restoreBackup('other-test',backup);
   const copy=(await m.listDocuments('other-test'))[0];
   if(await copy.files[0].blob.text()!==await d.files[0].blob.text())throw Error('Original changed');
   if(m.documentDeadlines([d]).length!==1)throw Error('Missing calendar deadline');
   if(m.documentDeadlines([{...d,status:'chiuso'}]).length!==0)throw Error('Closed deadline remains');
   if(m.documentDeadlines([{...d,deadlines:d.deadlines.map(s=>({...s,done:true}))}]).length!==0)throw Error('Paid deadline remains');
   let rejected=false;raw.documents[0].files[0].size++;
   try{await m.restoreBackup('third-test',new Blob([JSON.stringify(raw)]))}catch{rejected=true}
   if(!rejected||(await m.listDocuments('third-test')).length)throw Error('Corrupt backup partially restored');
   await m.deleteDocument('other-test',d.id);
   if(!(await m.loadDocument('local-test',d.id)))throw Error('Cross-account delete');
   return {restored,second};
  });
  assert.equal(result.restored.restored,1);assert.equal(result.second.skipped,1);
  await page.getByLabel('Pagata / fatta').check();
  await page.getByRole('button',{name:'Salva modifiche',exact:true}).first().click();
  await page.getByText('Salvato su questo dispositivo',{exact:true}).waitFor();
  await page.goto('http://127.0.0.1:5296/test#/calendario');
  await page.getByText('Nessuna scadenza nelle prossime due settimane.').waitFor();
  await page.goto('http://127.0.0.1:5296/test#/documenti');
  const photo=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1400;c.height=550;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.fillStyle='black';x.font='48px Arial';['BOLLETTA DI PROVA','Fornitore Esempio','Totale EUR 42,50','Scadenza 10/10/2026'].forEach((s,i)=>x.fillText(s,50,90+i*110));return c.toDataURL('image/png').split(',')[1]});
  await page.getByLabel('Aggiungi file',{exact:true}).setInputFiles({name:'foto-prova.png',mimeType:'image/png',buffer:Buffer.from(photo,'base64')});
  await page.getByText('Testo letto. Verifica il riepilogo e le scadenze con gli originali.',{exact:true}).waitFor({timeout:300000}); // al primo uso l'OCR scarica alcuni MB di dizionari
  assert((await page.getByLabel('Riepilogo dettagliato').inputValue()).includes('42,50'),'Real image OCR');
  const stream='BT /F1 18 Tf 50 740 Td (RICEVUTA DI PROVA - Totale EUR 19,90 - Pagata il 03/10/2026) Tj ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 700 800] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`});const xref=pdf.length;pdf+='xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  await page.goto('http://127.0.0.1:5296/test#/documenti');
  await page.getByLabel('Aggiungi file',{exact:true}).setInputFiles({name:'ricevuta-prova.pdf',mimeType:'application/pdf',buffer:Buffer.from(pdf)});
  await page.getByText('Testo letto. Verifica il riepilogo e le scadenze con gli originali.',{exact:true}).waitFor({timeout:120000});
  assert((await page.getByLabel('Riepilogo dettagliato').inputValue()).includes('19,90'),'Real PDF extraction');
  assert.deepEqual(errors,[]);
  console.log('PASS: upload, lettura testo/foto OCR/PDF reali, salvataggio/reload, bozza col tasto Indietro, download originale identico, report, progetto, calendario, mobile 390px, isolamento account, backup/ripristino, duplicati, corruzione atomica, chiusura e pagamento.');
 } finally { await browser.close(); await server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
