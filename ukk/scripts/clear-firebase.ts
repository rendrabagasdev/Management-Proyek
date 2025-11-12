/**
 * Script to clear all data from Firebase Realtime Database
 * Run with: npx tsx scripts/clear-firebase.ts
 */

import admin from "firebase-admin";
import { config } from "dotenv";

// Load environment variables
config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();

async function clearFirebase() {
  try {
    console.log("🔥 Starting Firebase cleanup...\n");

    // Clear all main paths
    const paths = [
      "events/cards",
      "events/comments",
      "events/notifications",
      "events/subtasks",
      "events/timeLogs",
      "events/assignments",
      "events/projects",
      "events/boards",
    ];

    for (const path of paths) {
      console.log(`Clearing ${path}...`);
      await db.ref(path).remove();
    }

    console.log("\n✅ Firebase database cleared successfully!");
    console.log("All event data has been removed.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing Firebase:", error);
    process.exit(1);
  }
}

clearFirebase();
