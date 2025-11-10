import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSettings() {
  console.log("🌱 Seeding default settings...");

  const defaultSettings = [
    // Branding
    {
      key: "app_name",
      value: "UKK Project Management",
      category: "branding",
      description: "Application name displayed in browser and header",
    },
    {
      key: "app_description",
      value: "Collaborative project management platform",
      category: "branding",
      description: "Brief description for SEO and social sharing",
    },
    {
      key: "app_logo_url",
      value: "",
      category: "branding",
      description: "URL to application logo",
    },
    {
      key: "app_favicon_url",
      value: "",
      category: "branding",
      description: "URL to favicon",
    },

    // Appearance
    {
      key: "theme_primary_color",
      value: "#3b82f6",
      category: "appearance",
      description: "Primary theme color",
    },
    {
      key: "theme_secondary_color",
      value: "#8b5cf6",
      category: "appearance",
      description: "Secondary theme color",
    },
    {
      key: "theme_accent_color",
      value: "#f59e0b",
      category: "appearance",
      description: "Accent theme color",
    },
    {
      key: "theme_default_mode",
      value: "system",
      category: "appearance",
      description: "Default theme mode (light, dark, or system)",
    },

    // Features
    {
      key: "feature_notifications",
      value: "true",
      category: "features",
      description: "Enable real-time notifications via Pusher",
    },
    {
      key: "feature_time_tracking",
      value: "true",
      category: "features",
      description: "Allow users to log time on cards",
    },
    {
      key: "feature_comments",
      value: "true",
      category: "features",
      description: "Enable commenting on cards",
    },
    {
      key: "feature_subtasks",
      value: "true",
      category: "features",
      description: "Allow creating subtasks within cards",
    },

    // General
    {
      key: "max_upload_size_mb",
      value: "10",
      category: "general",
      description: "Maximum file upload size in megabytes",
    },
    {
      key: "session_timeout_minutes",
      value: "60",
      category: "general",
      description: "Session timeout in minutes",
    },
    {
      key: "items_per_page",
      value: "20",
      category: "general",
      description: "Default number of items per page in lists",
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const setting of defaultSettings) {
    const existing = await prisma.appSettings.findUnique({
      where: { key: setting.key },
    });

    if (!existing) {
      await prisma.appSettings.create({
        data: setting,
      });
      console.log(`✅ Created setting: ${setting.key}`);
      created++;
    } else {
      console.log(`⏭️  Skipped existing setting: ${setting.key}`);
      skipped++;
    }
  }

  console.log(
    `\n✨ Seeding completed! Created: ${created}, Skipped: ${skipped}`
  );
}

seedSettings()
  .then(() => {
    console.log("✅ Settings seeded successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error seeding settings:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
