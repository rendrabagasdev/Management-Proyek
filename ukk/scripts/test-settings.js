#!/usr/bin/env node

/**
 * Settings System Health Check
 *
 * This script verifies that the settings system is working correctly.
 * Run with: node scripts/test-settings.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testSettings() {
  console.log("🧪 Testing Settings System...\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Check if settings table exists and has data
  try {
    const count = await prisma.appSettings.count();
    if (count > 0) {
      console.log(`✅ Test 1: Settings table has ${count} records`);
      passed++;
    } else {
      console.log("❌ Test 1: Settings table is empty");
      console.log("   Run: npx tsx scripts/seed-settings.ts");
      failed++;
    }
  } catch (error) {
    console.log("❌ Test 1: Settings table not found");
    console.log("   Error:", error.message);
    failed++;
  }

  // Test 2: Check required settings exist
  const requiredSettings = [
    "app_name",
    "feature_notifications",
    "feature_time_tracking",
    "feature_comments",
    "feature_subtasks",
    "theme_primary_color",
  ];

  try {
    const settings = await prisma.appSettings.findMany({
      where: { key: { in: requiredSettings } },
    });

    const foundKeys = settings.map((s) => s.key);
    const missingKeys = requiredSettings.filter((k) => !foundKeys.includes(k));

    if (missingKeys.length === 0) {
      console.log(
        `✅ Test 2: All ${requiredSettings.length} required settings exist`
      );
      passed++;
    } else {
      console.log("⚠️  Test 2: Some required settings are missing:");
      missingKeys.forEach((key) => console.log(`   - ${key}`));
      console.log("   Run: npx tsx scripts/seed-settings.ts");
      failed++;
    }
  } catch (error) {
    console.log("❌ Test 2: Failed to check required settings");
    console.log("   Error:", error.message);
    failed++;
  }

  // Test 3: Check settings by category
  try {
    const categories = ["branding", "appearance", "features", "general"];
    let allCategoriesOk = true;

    for (const category of categories) {
      const count = await prisma.appSettings.count({ where: { category } });
      if (count > 0) {
        console.log(`   ${category}: ${count} settings`);
      } else {
        console.log(`   ${category}: ⚠️  No settings`);
        allCategoriesOk = false;
      }
    }

    if (allCategoriesOk) {
      console.log("✅ Test 3: All categories have settings");
      passed++;
    } else {
      console.log("⚠️  Test 3: Some categories are empty");
      failed++;
    }
  } catch (error) {
    console.log("❌ Test 3: Failed to check categories");
    console.log("   Error:", error.message);
    failed++;
  }

  // Test 4: Verify feature flags format
  try {
    const features = await prisma.appSettings.findMany({
      where: { category: "features" },
    });

    const invalidFeatures = features.filter(
      (f) => f.value !== "true" && f.value !== "false"
    );

    if (invalidFeatures.length === 0) {
      console.log("✅ Test 4: All feature flags have valid boolean values");
      passed++;
    } else {
      console.log("⚠️  Test 4: Some feature flags have invalid values:");
      invalidFeatures.forEach((f) =>
        console.log(`   - ${f.key}: "${f.value}" (should be "true" or "false")`)
      );
      failed++;
    }
  } catch (error) {
    console.log("❌ Test 4: Failed to check feature flags");
    console.log("   Error:", error.message);
    failed++;
  }

  // Test 5: Check color format
  try {
    const colors = await prisma.appSettings.findMany({
      where: {
        key: {
          in: [
            "theme_primary_color",
            "theme_secondary_color",
            "theme_accent_color",
          ],
        },
      },
    });

    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    const invalidColors = colors.filter(
      (c) => c.value && !hexColorRegex.test(c.value)
    );

    if (invalidColors.length === 0) {
      console.log("✅ Test 5: All theme colors are valid hex colors");
      passed++;
    } else {
      console.log("⚠️  Test 5: Some colors have invalid format:");
      invalidColors.forEach((c) =>
        console.log(`   - ${c.key}: "${c.value}" (should be hex like #3b82f6)`)
      );
      failed++;
    }
  } catch (error) {
    console.log("❌ Test 5: Failed to check color format");
    console.log("   Error:", error.message);
    failed++;
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`Tests Passed: ${passed}`);
  console.log(`Tests Failed: ${failed}`);
  console.log("=".repeat(50));

  if (failed === 0) {
    console.log("\n✨ All tests passed! Settings system is working correctly.");
    return 0;
  } else {
    console.log(
      "\n⚠️  Some tests failed. Please check the errors above and run:"
    );
    console.log("   npx tsx scripts/seed-settings.ts");
    return 1;
  }
}

testSettings()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
