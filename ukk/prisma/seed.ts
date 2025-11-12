import {
  PrismaClient,
  GlobalRole,
  ProjectRole,
  Priority,
  Status,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.timeLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.cardAssignment.deleteMany();
  await prisma.card.deleteMany();
  await prisma.board.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create users - 4 users: 1 Admin + 1 Leader + 2 Members
  const passwordHash = await hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@ukk.com",
      passwordHash,
      globalRole: GlobalRole.ADMIN,
    },
  });

  const leader = await prisma.user.create({
    data: {
      name: "Team Leader",
      email: "leader@ukk.com",
      passwordHash,
      globalRole: GlobalRole.LEADER,
    },
  });

  const developer = await prisma.user.create({
    data: {
      name: "Developer Budi",
      email: "developer@ukk.com",
      passwordHash,
      globalRole: GlobalRole.MEMBER,
    },
  });

  const designer = await prisma.user.create({
    data: {
      name: "Designer Citra",
      email: "designer@ukk.com",
      passwordHash,
      globalRole: GlobalRole.MEMBER,
    },
  });

  console.log("✅ Users created");

  // Create Project
  const project = await prisma.project.create({
    data: {
      name: "E-Commerce Platform",
      description: "Build a modern e-commerce platform",
      createdBy: leader.id,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      members: {
        create: [
          { userId: leader.id, projectRole: ProjectRole.LEADER },
          { userId: developer.id, projectRole: ProjectRole.DEVELOPER },
          { userId: designer.id, projectRole: ProjectRole.DESIGNER },
        ],
      },
      boards: {
        create: [
          { name: "To Do", position: 0 },
          { name: "In Progress", position: 1 },
          { name: "Review", position: 2 },
          { name: "Done", position: 3 },
        ],
      },
    },
    include: { boards: true },
  });

  console.log("✅ Project created");
  console.log("🎉 Seed completed!");
  console.log("\n📧 Credentials:");
  console.log("Admin: admin@ukk.com / password123");
  console.log("Leader: leader@ukk.com / password123");
  console.log("Developer: developer@ukk.com / password123");
  console.log("Designer: designer@ukk.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
