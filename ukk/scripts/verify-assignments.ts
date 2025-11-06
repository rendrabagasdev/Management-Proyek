import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  console.log("🔍 Verifying Card Assignments...\n");

  // Get all cards with their assignments
  const cards = await prisma.card.findMany({
    include: {
      assignments: {
        include: {
          assignee: { select: { name: true } },
          assigner: { select: { name: true } },
        },
      },
      board: {
        include: {
          project: { select: { name: true } },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  console.log(`📊 Total Cards: ${cards.length}\n`);

  let cardsWithoutAssignee = 0;
  let cardsWithoutActiveAssignment = 0;
  let cardsWithActiveAssignment = 0;

  cards.forEach((card, index) => {
    const activeAssignment = card.assignments.find((a) => a.isActive);
    const hasAssigneeId = card.assigneeId !== null;

    console.log(`${index + 1}. ${card.title}`);
    console.log(`   Project: ${card.board.project.name}`);
    console.log(`   Status: ${card.status}`);
    console.log(
      `   AssigneeId: ${hasAssigneeId ? `✅ ${card.assigneeId}` : "❌ NULL"}`
    );
    console.log(`   Active Assignment: ${activeAssignment ? "✅" : "❌"}`);

    if (activeAssignment) {
      console.log(`   Assigned to: ${activeAssignment.assignee.name}`);
      console.log(`   Assigned by: ${activeAssignment.assigner.name}`);
      console.log(`   Reason: ${activeAssignment.reason}`);
      cardsWithActiveAssignment++;
    }

    if (!hasAssigneeId) {
      cardsWithoutAssignee++;
    }

    if (!activeAssignment && card.status !== "DONE") {
      cardsWithoutActiveAssignment++;
    }

    console.log("");
  });

  // Summary
  console.log("=".repeat(60));
  console.log("📋 SUMMARY:");
  console.log(`Total Cards: ${cards.length}`);
  console.log(`Cards with Active Assignment: ${cardsWithActiveAssignment}`);
  console.log(`Cards without AssigneeId: ${cardsWithoutAssignee}`);
  console.log(
    `Non-DONE cards without Active Assignment: ${cardsWithoutActiveAssignment}`
  );
  console.log("=".repeat(60));

  if (cardsWithoutAssignee === 0 && cardsWithoutActiveAssignment === 0) {
    console.log("\n✅ SUCCESS! All cards have proper assignments!");
  } else {
    console.log("\n⚠️ WARNING! Some cards are missing assignments!");
  }

  await prisma.$disconnect();
}

verify().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
