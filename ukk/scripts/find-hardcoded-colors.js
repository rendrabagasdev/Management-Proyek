#!/usr/bin/env node

/**
 * Find Hardcoded Colors Script
 *
 * This script finds all hardcoded color classes in the codebase
 * that should be migrated to theme variables.
 */

const fs = require("fs");
const path = require("path");

const colors = {
  blue: "primary",
  purple: "secondary",
  orange: "accent",
  yellow: "accent",
  green: "success",
  red: "danger",
  emerald: "success",
  rose: "danger",
  amber: "warning",
};

const patterns = [
  // Background colors
  {
    regex:
      /bg-(blue|purple|orange|yellow|green|red|emerald|rose|amber)-(\d{2,3})/g,
    type: "background",
  },
  // Text colors
  {
    regex:
      /text-(blue|purple|orange|yellow|green|red|emerald|rose|amber)-(\d{2,3})/g,
    type: "text",
  },
  // Border colors
  {
    regex:
      /border-(blue|purple|orange|yellow|green|red|emerald|rose|amber)-(\d{2,3})/g,
    type: "border",
  },
  // Hover colors
  {
    regex:
      /hover:bg-(blue|purple|orange|yellow|green|red|emerald|rose|amber)-(\d{2,3})/g,
    type: "hover-bg",
  },
  {
    regex:
      /hover:text-(blue|purple|orange|yellow|green|red|emerald|rose|amber)-(\d{2,3})/g,
    type: "hover-text",
  },
  // Focus colors
  {
    regex:
      /focus:border-(blue|purple|orange|yellow|green|red|emerald|rose|amber)-(\d{2,3})/g,
    type: "focus-border",
  },
  // Dark mode colors
  {
    regex:
      /dark:bg-(blue|purple|orange|yellow|green|red|emerald|rose|amber)-(\d{2,3})/g,
    type: "dark-bg",
  },
  {
    regex:
      /dark:text-(blue|purple|orange|yellow|green|red|emerald|rose|amber)-(\d{2,3})/g,
    type: "dark-text",
  },
];

const excludeDirs = ["node_modules", ".next", "build", "dist", ".git"];
const includeExtensions = [".tsx", ".ts", ".jsx", ".js"];

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else {
      const ext = path.extname(file);
      if (includeExtensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const findings = [];

  patterns.forEach(({ regex, type }) => {
    let match;
    regex.lastIndex = 0; // Reset regex

    while ((match = regex.exec(content)) !== null) {
      const lines = content.substr(0, match.index).split("\n");
      const lineNumber = lines.length;
      const lineContent = content.split("\n")[lineNumber - 1];

      findings.push({
        type,
        match: match[0],
        color: match[1],
        shade: match[2],
        line: lineNumber,
        lineContent: lineContent.trim(),
      });
    }
  });

  return findings;
}

function getSuggestion(finding) {
  const themeColor = colors[finding.color] || "primary";
  const shade = parseInt(finding.shade);

  let variant = "";
  if (shade <= 200) {
    variant = "-light";
  } else if (shade >= 700) {
    variant = "-dark";
  }

  const typeMap = {
    background: `bg-[var(--theme-${themeColor}${variant})]`,
    text: `text-[var(--theme-${themeColor}${variant})]`,
    border: `border-[var(--theme-${themeColor}${variant})]`,
    "hover-bg": `hover:bg-[var(--theme-${themeColor}${variant})]`,
    "hover-text": `hover:text-[var(--theme-${themeColor}${variant})]`,
    "focus-border": `focus:border-[var(--theme-${themeColor}${variant})]`,
    "dark-bg": `dark:bg-[var(--theme-${themeColor}${variant})]`,
    "dark-text": `dark:text-[var(--theme-${themeColor}${variant})]`,
  };

  return typeMap[finding.type] || finding.match;
}

function main() {
  console.log("🔍 Scanning for hardcoded colors...\n");

  const files = findFiles(process.cwd());
  let totalFindings = 0;
  const fileResults = [];

  files.forEach((file) => {
    const findings = analyzeFile(file);
    if (findings.length > 0) {
      totalFindings += findings.length;
      fileResults.push({ file, findings });
    }
  });

  if (totalFindings === 0) {
    console.log("✅ No hardcoded colors found! Your code is theme-aware.");
    return;
  }

  console.log(
    `Found ${totalFindings} hardcoded color(s) in ${fileResults.length} file(s)\n`
  );
  console.log("=".repeat(80));

  fileResults.forEach(({ file, findings }) => {
    console.log(`\n📁 ${file.replace(process.cwd(), ".")}`);
    console.log("─".repeat(80));

    findings.forEach((finding) => {
      console.log(`\n  Line ${finding.line}:`);
      console.log(`  ❌ ${finding.match}`);
      console.log(`  ✅ ${getSuggestion(finding)}`);
      console.log(`     ${finding.lineContent}`);
    });
  });

  console.log("\n" + "=".repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   Total files: ${fileResults.length}`);
  console.log(`   Total findings: ${totalFindings}`);
  console.log(`\n💡 See docs/THEME_COLORS_MIGRATION.md for migration guide`);
}

main();
