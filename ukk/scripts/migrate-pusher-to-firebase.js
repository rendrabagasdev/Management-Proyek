#!/usr/bin/env node

/**
 * Script to replace Pusher with Firebase across the codebase
 */

const fs = require("fs");
const path = require("path");

const replacements = [
  // Import replacements
  { from: /import.*from "@\/lib\/pusher-client";?\n?/g, to: "" },
  {
    from: /import { usePusherEvent } from "@\/lib\/pusher-client";/g,
    to: 'import { useFirebaseEvent } from "@/lib/firebase-hooks";',
  },
  {
    from: /import { triggerPusherEvent } from "@\/lib\/pusher";/g,
    to: 'import { triggerFirebaseEvent } from "@/lib/firebase-triggers";',
  },
  {
    from: /import { triggerCardEvent, triggerProjectEvent } from "@\/lib\/pusher";/g,
    to: 'import { triggerCardEvent, triggerProjectEvent } from "@/lib/firebase-triggers";',
  },
  {
    from: /import { triggerProjectEvent, triggerCardEvent } from "@\/lib\/pusher";/g,
    to: 'import { triggerCardEvent, triggerProjectEvent } from "@/lib/firebase-triggers";',
  },
  {
    from: /import { triggerCardEvent } from "@\/lib\/pusher";/g,
    to: 'import { triggerCardEvent } from "@/lib/firebase-triggers";',
  },
  {
    from: /import { triggerProjectEvent } from "@\/lib\/pusher";/g,
    to: 'import { triggerProjectEvent } from "@/lib/firebase-triggers";',
  },

  // Hook call replacements - card events
  {
    from: /usePusherEvent\(`card-\$\{([^}]+)\}`, /g,
    to: "useFirebaseEvent(`cards/${$1}/events`, ",
  },

  // Hook call replacements - user events
  {
    from: /usePusherEvent\(`user-\$\{([^}]+)\}`, /g,
    to: "useFirebaseEvent(`users/${$1}/events`, ",
  },

  // Hook call replacements - project events (for KanbanBoard)
  {
    from: /usePusherEvent\(`project-\$\{([^}]+)\}`, /g,
    to: "useFirebaseEvent(`projects/${$1}/events`, ",
  },

  // Server trigger replacements (don't change triggerCardEvent and triggerProjectEvent calls, just the import)
  { from: /triggerPusherEvent\(/g, to: "triggerFirebaseEvent(" },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let newContent = content;
  let changeCount = 0;

  replacements.forEach(({ from, to }) => {
    const matches = newContent.match(from);
    if (matches) {
      changeCount += matches.length;
      newContent = newContent.replace(from, to);
    }
  });

  if (changeCount > 0) {
    fs.writeFileSync(filePath, newContent, "utf8");
    console.log(`✓ ${filePath}: ${changeCount} replacements`);
    return changeCount;
  }

  return 0;
}

function processDirectory(dirPath, stats = { files: 0, replacements: 0 }) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath, stats);
    } else if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name)) {
      const count = processFile(fullPath);
      if (count > 0) {
        stats.files++;
        stats.replacements += count;
      }
    }
  }

  return stats;
}

// Process components, lib, and app directories
console.log("Starting Pusher → Firebase migration...\n");

const componentsDir = path.join(__dirname, "..", "components");
const libDir = path.join(__dirname, "..", "lib");
const appDir = path.join(__dirname, "..", "app");

console.log("Processing components...");
const componentStats = processDirectory(componentsDir);

console.log("\nProcessing lib...");
const libStats = processDirectory(libDir);

console.log("\nProcessing app...");
const appStats = processDirectory(appDir);

const totalStats = {
  files: componentStats.files + libStats.files + appStats.files,
  replacements:
    componentStats.replacements + libStats.replacements + appStats.replacements,
};

console.log("\n✨ Migration completed!");
console.log(`Files modified: ${totalStats.files}`);
console.log(`Total replacements: ${totalStats.replacements}`);
