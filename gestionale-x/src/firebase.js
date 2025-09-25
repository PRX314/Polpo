// Firebase configuration for Gestionale Polpo
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
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

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;