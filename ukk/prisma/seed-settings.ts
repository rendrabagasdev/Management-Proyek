import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedSettings() {
  console.log("🌱 Seeding default app settings...");

  const defaultSettings = [
    // Branding
    {
      key: "app_name",
      value: "UKK Project Management",
      category: "branding",
      description: "Application name displayed in browser tab and header",
    },
    {
      key: "app_description",
      value: "Sistem Manajemen Proyek untuk UKK RPL",
      category: "branding",
      description: "Application description for SEO and social sharing",
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
      description: "Default theme mode (light/dark/system)",
    },

    // Features
    {
      key: "feature_notifications",
      value: "true",
      category: "features",
      description: "Enable real-time notifications",
    },
    {
      key: "feature_time_tracking",
      value: "true",
      category: "features",
      description: "Enable time tracking on cards",
    },
    {
      key: "feature_comments",
      value: "true",
      category: "features",
      description: "Enable comments on cards",
    },
    {
      key: "feature_subtasks",
      value: "true",
      category: "features",
      description: "Enable subtasks within cards",
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
      description: "Default items per page in lists",
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.appSettings.upsert({
      where: { key: setting.key },
      create: setting,
      update: {
        value: setting.value,
        category: setting.category,
        description: setting.description,
      },
    });
  }

  console.log("✅ Default settings seeded successfully!");
}

seedSettings()
  .catch((e) => {
    console.error("❌ Error seeding settings:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
