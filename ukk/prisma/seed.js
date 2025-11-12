/*
  Minimal Prisma seed for production containers.
  Add your initial data here when ready.
*/
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Prisma seed: starting...");
  // Example placeholder: nothing to seed yet.
  // await prisma.user.create({ data: { name: 'Admin', email: 'admin@example.com', passwordHash: '...' } });
  console.log("Prisma seed: nothing to seed (placeholder).");
}

main()
  .catch((e) => {
    console.error("Prisma seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
