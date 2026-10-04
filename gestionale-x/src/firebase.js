// Firebase configuration for Gestionale Polpo
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Modalità collaudo (tester/collauda.cjs): Firestore e Auth sono gli emulatori locali,
// con un progetto finto "demo-": i dati veri non si possono raggiungere.
// La build di produzione non imposta mai VITE_EMULATORI.
const EMULATORI = import.meta.env.VITE_EMULATORI === '1'

const firebaseConfig = EMULATORI
  ? { apiKey: 'demo-key', authDomain: 'demo-gestionale-x.firebaseapp.com', projectId: 'demo-gestionale-x', appId: 'demo' }
  : {
    apiKey: "AIzaSyBwbrJutEEykPfYyE3SCki44-FHezwLXJQ",
    authDomain: "gestionale-polpo.firebaseapp.com",
    projectId: "gestionale-polpo",
    storageBucket: "gestionale-polpo.firebasestorage.app",
    messagingSenderId: "1075592140775",
    appId: "1:1075592140775:web:de5c9d88e03b0b47820f42",
    measurementId: "G-LF2JPFVBZ0"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Cache su disco invece che in memoria.
//
// Da quando il gestionale conosce tutti i progetti (79, con dentro il corpo
// delle note del vault) una apertura scarica circa 450 kB. Senza cache quel
// peso si ripaga tutte le volte, anche dal telefono in 4G. Con la cache
// persistente il primo avvio e' uguale, i successivi scaricano solo cio' che
// e' cambiato davvero — e l app si apre anche senza rete.
//
// tabManager: serve a far convivere piu schede aperte sullo stesso browser;
// senza, la seconda scheda resterebbe senza cache.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const auth = getAuth(app);
if (EMULATORI) {
  const [host, port] = import.meta.env.VITE_EMU_FIRESTORE.split(':');
  connectFirestoreEmulator(db, host, Number(port));
  connectAuthEmulator(auth, import.meta.env.VITE_EMU_AUTH, { disableWarnings: true });
}
export default app;