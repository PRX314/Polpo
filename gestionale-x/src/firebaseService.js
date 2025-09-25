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
  orderBy,
  where,
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
    where("userId", "==", auth.currentUser.uid),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
  }));
};

// Listen to projects changes (realtime)
export const subscribeToProjects = (callback, onError) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const q = query(
    projectsCollection,
    where("userId", "==", auth.currentUser.uid),
  );
  return onSnapshot(q,
    (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
      }));
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

// Get all notes for current user
export const getNotes = async () => {
  if (!auth.currentUser) return [];
  const q = query(
    notesCollection,
    where("userId", "==", auth.currentUser.uid),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
  }));
};

// Listen to notes changes (realtime)
export const subscribeToNotes = (callback, onError) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const q = query(
    notesCollection,
    where("userId", "==", auth.currentUser.uid),
  );
  return onSnapshot(q,
    (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
      }));
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

// Get notes by project tags
export const getNotesByProjectTags = async (tags) => {
  const q = query(
    notesCollection,
    where("projectTags", "array-contains-any", tags),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate()?.toISOString() || new Date().toISOString()
  }));
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Initialize sample data if collections are empty
export const initializeSampleData = async () => {
  const [projects, notes] = await Promise.all([getProjects(), getNotes()]);

  if (projects.length === 0) {
    const sampleProjects = [
      {
        name: "Sito Magliette",
        description: "E-commerce per vendita magliette con temi dinamici",
        status: "in_progress",
        tags: ["e-commerce", "react", "design"]
      },
      {
        name: "Portfolio Polpo",
        description: "Portfolio personale con minigiochi e progetti",
        status: "completed",
        tags: ["portfolio", "games", "vanilla-js"]
      },
      {
        name: "Hunter Gaming",
        description: "Piattaforma di gamificazione con sistema di missioni",
        status: "in_progress",
        tags: ["gaming", "mongodb", "react"]
      }
    ];

    await Promise.all(sampleProjects.map(project => addProject(project)));
  }

  if (notes.length === 0) {
    const sampleNotes = [
      {
        title: "Idea: Animazioni tema G Power",
        content: "Creare animazioni più dinamiche per il tema G Power ma senza far ballare troppo la finestra",
        type: "idea",
        projectTags: ["e-commerce", "design"],
        priority: "high"
      },
      {
        title: "Nota: Ottimizzazione mobile",
        content: "Verificare responsive design su dispositivi touch per tutti i progetti",
        type: "note",
        projectTags: ["portfolio", "e-commerce"],
        priority: "medium"
      },
      {
        title: "Idea: Sistema di achievements",
        content: "Implementare badge e achievement unlockabili per aumentare engagement",
        type: "idea",
        projectTags: ["gaming"],
        priority: "high"
      },
      {
        title: "Nota: Performance CSS",
        content: "Utilizzare transform3d invece di transform per hardware acceleration",
        type: "note",
        projectTags: ["design", "portfolio"],
        priority: "low"
      }
    ];

    await Promise.all(sampleNotes.map(note => addNote(note)));
  }
};