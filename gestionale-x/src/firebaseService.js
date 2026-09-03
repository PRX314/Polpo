// Firebase service functions for Gestionale Polpo
import {
  collection,
  doc,
  getDocs,
  addDoc,
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

  const docRef = await addDoc(projectsCollection, newProject);
  return docRef.id;
};

// Update project
export const updateProject = async (projectId, updates) => {
  const projectRef = doc(db, "projects", projectId);
  await updateDoc(projectRef, {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  });
};

// Delete project
export const deleteProject = async (projectId) => {
  const projectRef = doc(db, "projects", projectId);
  await deleteDoc(projectRef);
};

// ============================================================================
// NOTES COLLECTION
// ============================================================================

export const notesCollection = collection(db, "notes");

// Get all notes for current user (legacy collection)
export const getNotes = async () => {
  if (!auth.currentUser) return [];
  const q = query(
    notesCollection,
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

// Listen to notes changes (realtime, legacy collection)
export const subscribeToNotes = (callback, onError) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const q = query(
    notesCollection,
    where("userId", "==", auth.currentUser.uid)
  );
  return onSnapshot(q,
    (snapshot) => {
      const notes = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
          updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : (data.updatedAt || null)
        }
      }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback(notes);
    },
    (error) => {
      console.error('Error in notes subscription:', error);
      onError && onError(error);
    }
  );
};

// Add new note
export const addNote = async (noteData) => {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated');
  }

  const newNote = {
    ...noteData,
    userId: auth.currentUser.uid,
    createdAt: Timestamp.fromDate(new Date()),
    updatedAt: Timestamp.fromDate(new Date())
  };

  const docRef = await addDoc(notesCollection, newNote);
  return docRef.id;
};

// Update note
export const updateNote = async (noteId, updates) => {
  const noteRef = doc(db, "notes", noteId);
  await updateDoc(noteRef, {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  });
};

// Delete note
export const deleteNote = async (noteId) => {
  const noteRef = doc(db, "notes", noteId);
  await deleteDoc(noteRef);
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
  await setDoc(ref, data, { merge: true });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Initialize sample data if collections are empty
export const initializeSampleData = async () => {
  // Function kept for compatibility but does nothing
  // Users will start with empty projects and notes
  return Promise.resolve();
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
  const docRef = await addDoc(eventsCollection, {
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
  });
  return docRef.id;
};

export const updateEvent = async (eventId, updates) => {
  await updateDoc(doc(db, "events", eventId), {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date())
  });
};

export const deleteEvent = async (eventId) => {
  await deleteDoc(doc(db, "events", eventId));
};
