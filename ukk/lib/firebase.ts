// Firebase Client Configuration (Browser)
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

// Firebase configuration (replace with real keys from Firebase Console)
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key-replace-me",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "your-project.firebaseapp.com",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "https://your-project-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "your-project.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:dummy",
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let database: Database;

export const getFirebaseApp = () => {
  if (!app && typeof window !== "undefined") {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
};

export const getFirebaseDatabase = () => {
  if (!database && typeof window !== "undefined") {
    const firebaseApp = getFirebaseApp();
    database = getDatabase(firebaseApp);
  }
  return database;
};
