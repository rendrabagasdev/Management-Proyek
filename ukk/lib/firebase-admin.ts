// Firebase Admin SDK Configuration (Server-side)
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getDatabase, Database } from "firebase-admin/database";

// Initialize Firebase Admin (singleton pattern)
let adminApp: App;
let adminDatabase: Database;

export const getFirebaseAdminApp = () => {
  if (!adminApp) {
    // For dummy setup, we'll use just the database URL
    // In production, you need service account credentials
    const databaseURL =
      process.env.FIREBASE_DATABASE_URL ||
      "https://your-project-default-rtdb.firebaseio.com";

    try {
      if (!getApps().length) {
        // Check if we have service account credentials
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT
          );
          adminApp = initializeApp({
            credential: cert(serviceAccount),
            databaseURL,
          });
        } else {
          // Dummy initialization for development
          // This won't work in production without proper credentials
          console.warn(
            "⚠️ Firebase Admin: No service account found. Using dummy config for development."
          );
          adminApp = initializeApp({
            databaseURL,
          });
        }
      } else {
        adminApp = getApps()[0];
      }
    } catch (error) {
      console.error("❌ Firebase Admin initialization error:", error);
      throw error;
    }
  }
  return adminApp;
};

export const getFirebaseAdminDatabase = () => {
  if (!adminDatabase) {
    const app = getFirebaseAdminApp();
    adminDatabase = getDatabase(app);
  }
  return adminDatabase;
};
