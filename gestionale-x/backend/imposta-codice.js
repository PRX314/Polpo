// Imposta il codice di accesso al Gestionale (= password Firebase) SENZA email.
// Usa le chiavi di amministrazione in serviceAccount.json.
//
// Uso:  node imposta-codice.js 241190
//       (metti le TUE 6 cifre al posto di 241190)

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const serviceAccount = JSON.parse(
  readFileSync(new URL('./serviceAccount.json', import.meta.url), 'utf8')
);

const EMAIL = 'paoloandrearepetto@gmail.com';
const codice = process.argv[2];

if (!/^\d{6}$/.test(codice || '')) {
  console.error('\n  Serve un codice di ESATTAMENTE 6 cifre.');
  console.error('  Esempio:  node imposta-codice.js 241190\n');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

try {
  const user = await admin.auth().getUserByEmail(EMAIL);
  await admin.auth().updateUser(user.uid, { password: codice });
  console.log(`\n  ✓ Codice impostato per ${EMAIL}.`);
  console.log('  Ora entri nel gestionale digitando quelle 6 cifre.\n');
  process.exit(0);
} catch (e) {
  console.error(`\n  Errore: ${e.message}\n`);
  process.exit(1);
}
