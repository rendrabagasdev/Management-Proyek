#!/usr/bin/env node

/**
 * Script untuk mengganti sintaks [var(--theme-*)] menjadi (--theme-*)
 * Sesuai dengan rekomendasi Tailwind CSS canonical classes
 */

const fs = require("fs");
const path = require("path");

// File extensions to process
const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

// Directories to search
const SEARCH_DIRS = ["app", "components", "lib"];

// Pattern to match: [var(--theme-xxx)] -> (--theme-xxx)
const PATTERN = /\[var\((--theme-[a-z-]+)\)\]/g;

function simplifyFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const newContent = content.replace(PATTERN, "($1)");

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, "utf8");
    const matches = content.match(PATTERN) || [];
    return matches.length;
  }

  return 0;
}

function processDirectory(dir) {
  let totalReplacements = 0;
  let filesModified = 0;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const result = processDirectory(fullPath);
      totalReplacements += result.replacements;
      filesModified += result.files;
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.includes(ext)) {
        const replacements = simplifyFile(fullPath);
        if (replacements > 0) {
          console.log(`✅ ${fullPath}: ${replacements} replacements`);
          totalReplacements += replacements;
          filesModified++;
        }
      }
    }
  }

  return { replacements: totalReplacements, files: filesModified };
}

console.log("🔄 Simplifying CSS variable syntax...\n");

let grandTotal = 0;
let totalFiles = 0;

for (const dir of SEARCH_DIRS) {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`📁 Processing ${dir}/...`);
    const result = processDirectory(dirPath);
    grandTotal += result.replacements;
    totalFiles += result.files;
  }
}

console.log("\n" + "=".repeat(80));
console.log(
  `\n✨ Done! Simplified ${grandTotal} CSS variables in ${totalFiles} files`
);
console.log("\nPattern changed: [var(--theme-*)] → (--theme-*)\n");
