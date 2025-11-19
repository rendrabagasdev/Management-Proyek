/*
  Prisma seed for development - Creates sample data
*/
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  async function safeDelete(model, name) {
    try {
      await model.deleteMany();
      console.log(`   - Cleared ${name}`);
    } catch (err) {
      if (err.code === "P2021") {
        console.log(`   - Skipped ${name} (table not found)`);
      } else {
        throw err;
      }
    }
  }
  console.log("🌱 Prisma seed: starting...");

  // Hash password untuk semua user
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🗑️  Cleaning existing data...");
  await safeDelete(prisma.notification, "notifications");
  await safeDelete(prisma.timeLog, "time logs");
  await safeDelete(prisma.comment, "comments");
  await safeDelete(prisma.subtask, "subtasks");
  await safeDelete(prisma.cardAssignment, "card assignments");
  await safeDelete(prisma.card, "cards");
  await safeDelete(prisma.board, "boards");
  await safeDelete(prisma.projectMember, "project members");
  await safeDelete(prisma.project, "projects");
  await safeDelete(prisma.session, "sessions");
  await safeDelete(prisma.account, "accounts");
  await safeDelete(prisma.user, "users");
  await safeDelete(prisma.appSettings, "app settings");

  // ===========================
  // CREATE USERS
  // ===========================
  console.log("👥 Creating users...");

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@ukk.com",
      passwordHash: hashedPassword,
      globalRole: "ADMIN",
    },
  });

  console.log(`✅ Created 1 user (Admin)`);

  // ===========================
  // CREATE PROJECT (minimal untuk board)
  // ===========================
  console.log("📁 Creating default project...");

  const project = await prisma.project.create({
    data: {
      name: "Default Project",
      description: "Default project for boards",
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      createdBy: admin.id,
    },
  });

  console.log(`✅ Created default project`);

  // ===========================
  // CREATE BOARDS
  // ===========================
  console.log("📋 Creating boards...");

  await prisma.board.create({
    data: { projectId: project.id, name: "To Do", position: 0 },
  });

  await prisma.board.create({
    data: { projectId: project.id, name: "In Progress", position: 1 },
  });

  await prisma.board.create({
    data: { projectId: project.id, name: "Review", position: 2 },
  });

  await prisma.board.create({
    data: { projectId: project.id, name: "Done", position: 3 },
  });

  console.log(`✅ Created 4 boards`);

  // ===========================
  // CREATE APP SETTINGS
  // ===========================
  console.log("⚙️  Creating app settings...");

  await prisma.appSettings.createMany({
    data: [
      {
        key: "app_name",
        value: "UKK Project Manager",
        category: "branding",
        description: "Application name displayed in navbar and page titles",
      },
      {
        key: "company_name",
        value: "UKK Tech Solutions",
        category: "branding",
        description: "Company name for branding purposes",
      },
      {
        key: "theme_primary_color",
        value: "#3b82f6",
        category: "appearance",
        description: "Primary brand color (hex)",
      },
      {
        key: "enable_notifications",
        value: "true",
        category: "features",
        description: "Enable push notifications",
      },
      {
        key: "enable_time_tracking",
        value: "true",
        category: "features",
        description: "Enable time tracking feature",
      },
      {
        key: "min_work_hours_per_day",
        value: "4",
        category: "time_tracking",
        description:
          "Minimum required work hours per day (will show warning if less)",
      },
      {
        key: "max_work_hours_per_day",
        value: "12",
        category: "time_tracking",
        description:
          "Maximum allowed work hours per day (prevents starting timer if exceeded)",
      },
      {
        key: "enable_work_hours_limit",
        value: "true",
        category: "time_tracking",
        description: "Enable work hours limit enforcement",
      },
    ],
  });

  console.log(`✅ Created app settings`);

  // ===========================
  // SUMMARY
  // ===========================
  console.log("\n✨ Seeding completed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Summary:");
  console.log(`   👥 Users: 1 (Admin only)`);
  console.log(`   📋 Boards: 4`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔐 Login credentials:");
  console.log("   Admin    : admin@ukk.com");
  console.log("   Password : password123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((e) => {
    console.error("❌ Prisma seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
