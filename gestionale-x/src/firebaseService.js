// Firebase service functions for Gestionale Polpo
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  setDoc,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "./firebase";

// ============================================================================
// SCRITTURE CHE NON ASPETTANO LA RETE
// ============================================================================
//
// Firestore scrive subito nella cache del dispositivo (e onSnapshot lo mostra), ma la promessa di
// setDoc/updateDoc si risolve solo quando il server conferma: senza segnale, mai. Così "Appunto",
// "Da fare" e "Appuntamento" restavano su "Salvo…" finché non tornava la rete. Qui si aspetta il
// server al massimo un attimo: un errore vero (permessi) arriva in tempo, altrimenti la scrittura
// è in coda e parte da sola appena c'è campo.
export const senzaAttendereLaRete = (scrittura, ms = 1500) => {
  scrittura.catch(e => console.error('Scrittura non confermata dal server:', e))
  return Promise.race([scrittura, new Promise(resolve => setTimeout(resolve, ms))])
}

// ============================================================================
// PROJECTS COLLECTION
// ============================================================================

export const projectsCollection = collection(db, "projects");

// Get all projects for current user
export const getProjects = async () => {
  if (!auth.currentUser) return [];
  const q = query(
    projectsCollection,
    where("userId", "==", auth.currentUser.uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
      updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : (data.updatedAt || null)
    }
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Listen to projects changes (realtime)
export const subscribeToProjects = (callback, onError) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const q = query(
    projectsCollection,
    where("userId", "==", auth.currentUser.uid)
  );
  return onSnapshot(q,
    (snapshot) => {
      const projects = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : (data.updatedAt || null)
        }
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback(projects);
    },
    (error) => {
      console.error('Error in projects subscription:', error);
      onError && onError(error);
    }
  );
};

// Add new project
export const addProject = async (projectData) => {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated');
  }

  const newProject = {
    ...projectData,
    userId: auth.currentUser.uid,
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date())
  };

  // L'id nasce sul dispositivo: serve subito, anche senza rete
  const docRef = doc(projectsCollection);
  await senzaAttendereLaRete(setDoc(docRef, newProject));
  return docRef.id;
};

// Update project
export const updateProject = async (projectId, updates) => {
  const projectRef = doc(db, "projects", projectId);
  await senzaAttendereLaRete(updateDoc(projectRef, {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  }));
};

// Delete project
export const deleteProject = async (projectId) => {
  const projectRef = doc(db, "projects", projectId);
  await senzaAttendereLaRete(deleteDoc(projectRef));
};

// ============================================================================
// ROUTINE (documento unico per utente: "ogni giorno" + timeline + extra)
// ============================================================================

// Listen to the current user's routine document (realtime)
export const subscribeToRoutine = (callback, onError) => {
  if (!auth.currentUser) {
    callback(null);
    return () => {};
  }
  const ref = doc(db, "routines", auth.currentUser.uid);
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? snap.data() : null),
    (error) => { console.error("Error subscribing to routine:", error); onError?.(error); }
  );
};

// Upsert (merge) the current user's routine document
export const saveRoutine = async (data) => {
  if (!auth.currentUser) return;
  const ref = doc(db, "routines", auth.currentUser.uid);
  await senzaAttendereLaRete(setDoc(ref, data, { merge: true }));
};

// ============================================================================
// EVENTS (appuntamenti del calendario: data, ora, sveglia)
// ============================================================================
//
// Prima nel gestionale non esisteva niente con un orario: progetti e task hanno
// solo una data. Senza un'ora non c'e' un momento a cui suonare, quindi non si
// poteva chiedere "avvisami alle 15". Questa collection colma quel buco.
//
// reminder = minuti di anticipo (0 = all'ora esatta, null = nessuna sveglia).
// Chi manda l'avviso e' la Netlify Scheduled Function, non il browser.

export const eventsCollection = collection(db, "events");

export const subscribeToEvents = (callback, onError) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }
  const q = query(eventsCollection, where("userId", "==", auth.currentUser.uid));
  return onSnapshot(q,
    (snapshot) => {
      const events = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
      callback(events);
    },
    (error) => {
      console.error('Error in events subscription:', error);
      onError && onError(error);
    }
  );
};

export const addEvent = async (data) => {
  if (!auth.currentUser) throw new Error('User must be authenticated');
  const docRef = doc(eventsCollection);
  await senzaAttendereLaRete(setDoc(docRef, {
    title: '',
    date: '',
    time: '',
    endTime: '',
    reminder: null,
    notes: '',
    done: false,
    ...data,
    userId: auth.currentUser.uid,
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date())
  }));
  return docRef.id;
};

export const updateEvent = async (eventId, updates) => {
  await senzaAttendereLaRete(updateDoc(doc(db, "events", eventId), {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  }));
};

export const deleteEvent = async (eventId) => {
  await senzaAttendereLaRete(deleteDoc(doc(db, "events", eventId)));
};
