#!/usr/bin/env node

/**
 * Debug Firebase Environment Variables
 * This script checks and prints Firebase configuration from environment
 */

console.log("\n🔍 Debugging Firebase Environment Variables\n");
console.log("=".repeat(80));

// Check .env file
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envExists = fs.existsSync(envPath);

console.log("\n📁 Environment File Status:");
console.log(`   .env.local exists: ${envExists ? "✅" : "❌"}`);

// Check .env as fallback
const envFallbackPath = path.join(__dirname, "..", ".env");
const envFallbackExists = fs.existsSync(envFallbackPath);
console.log(`   .env exists: ${envFallbackExists ? "✅" : "❌"}`);

// Load environment variables
require("dotenv").config({ path: envExists ? envPath : envFallbackPath });

console.log("\n🌐 Firebase Client Config (Browser):");
console.log("-".repeat(80));
const clientVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

let clientConfigured = true;
for (const [key, value] of Object.entries(clientVars)) {
  const status = value && !value.includes("YOUR-") ? "✅" : "❌";
  const displayValue = value
    ? value.length > 50
      ? value.substring(0, 50) + "..."
      : value
    : "NOT SET";
  console.log(`   ${status} ${key}: ${displayValue}`);
  if (!value || value.includes("YOUR-")) clientConfigured = false;
}

console.log("\n🔐 Firebase Admin Config (Server):");
console.log("-".repeat(80));

const databaseUrl = process.env.FIREBASE_DATABASE_URL;
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

console.log(
  `   ${databaseUrl ? "✅" : "❌"} FIREBASE_DATABASE_URL: ${
    databaseUrl || "NOT SET"
  }`
);

let adminConfigured = false;
let serviceAccountParsed = null;

// Try FIREBASE_SERVICE_ACCOUNT first
if (serviceAccount) {
  try {
    serviceAccountParsed = JSON.parse(serviceAccount);
    console.log(
      `   ✅ FIREBASE_SERVICE_ACCOUNT: Valid JSON (${serviceAccount.length} chars)`
    );
    console.log(`      Project ID: ${serviceAccountParsed.project_id}`);
    console.log(`      Client Email: ${serviceAccountParsed.client_email}`);
    console.log(
      `      Private Key: ${
        serviceAccountParsed.private_key ? "Present ✅" : "Missing ❌"
      }`
    );
    adminConfigured = true;
  } catch (error) {
    console.log(
      `   ❌ FIREBASE_SERVICE_ACCOUNT: Invalid JSON - ${error.message}`
    );
  }
}

// Try FIREBASE_SERVICE_ACCOUNT_KEY as fallback
if (!serviceAccountParsed && serviceAccountKey) {
  try {
    serviceAccountParsed = JSON.parse(serviceAccountKey);
    console.log(
      `   ✅ FIREBASE_SERVICE_ACCOUNT_KEY: Valid JSON (${serviceAccountKey.length} chars)`
    );
    console.log(`      Project ID: ${serviceAccountParsed.project_id}`);
    console.log(`      Client Email: ${serviceAccountParsed.client_email}`);
    console.log(
      `      Private Key: ${
        serviceAccountParsed.private_key ? "Present ✅" : "Missing ❌"
      }`
    );
    adminConfigured = true;
  } catch (error) {
    console.log(
      `   ❌ FIREBASE_SERVICE_ACCOUNT_KEY: Invalid JSON - ${error.message}`
    );

    // Check if there's duplication
    if (
      serviceAccountKey &&
      serviceAccountKey.includes("FIREBASE_SERVICE_ACCOUNT_KEY=")
    ) {
      console.log(`   ⚠️  WARNING: Detected duplication in variable value!`);
      console.log(`      The value contains the variable name itself.`);
      console.log(`      This is likely a copy-paste error in .env file.`);
    }
  }
}

if (!serviceAccount && !serviceAccountKey) {
  console.log(`   ❌ FIREBASE_SERVICE_ACCOUNT: NOT SET`);
  console.log(`   ❌ FIREBASE_SERVICE_ACCOUNT_KEY: NOT SET`);
}

console.log("\n📊 Configuration Summary:");
console.log("-".repeat(80));
console.log(
  `   Client (Browser) Config: ${
    clientConfigured ? "✅ Configured" : "❌ Not Configured"
  }`
);
console.log(
  `   Admin (Server) Config: ${
    adminConfigured ? "✅ Configured" : "❌ Not Configured"
  }`
);

if (!clientConfigured || !adminConfigured) {
  console.log("\n⚠️  Configuration Issues Detected!");
  console.log("\n💡 Recommendations:");

  if (!adminConfigured) {
    console.log("\n1. Fix Firebase Admin Configuration:");
    console.log("   - Check .env or .env.local file");
    console.log("   - Look for FIREBASE_SERVICE_ACCOUNT_KEY variable");
    console.log(
      "   - Remove any duplication (e.g., FIREBASE_SERVICE_ACCOUNT_KEY=FIREBASE_SERVICE_ACCOUNT_KEY=...)"
    );
    console.log("   - Ensure JSON is properly formatted");
    console.log("   - Escape double quotes if needed");
  }

  if (!clientConfigured) {
    console.log("\n2. Configure Firebase Client:");
    console.log("   - Get config from Firebase Console > Project Settings");
    console.log("   - Add all NEXT_PUBLIC_FIREBASE_* variables to .env.local");
  }

  console.log("\n3. Restart the dev server after fixing:");
  console.log("   npm run dev");
}

console.log("\n" + "=".repeat(80) + "\n");
