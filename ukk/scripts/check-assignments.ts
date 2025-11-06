/**
 * Check current state of card assignments
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAssignments() {
  console.log("📊 Current CardAssignment State:\n");

  // Get all active assignments
  const activeAssignments = await prisma.cardAssignment.findMany({
    where: { isActive: true },
    include: {
      card: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assigner: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
  });

  console.log(`Total active assignments: ${activeAssignments.length}\n`);

  // Group by user
  const userAssignments = new Map<number, typeof activeAssignments>();
  activeAssignments.forEach((assignment) => {
    const userId = assignment.assignedTo;
    if (!userAssignments.has(userId)) {
      userAssignments.set(userId, []);
    }
    userAssignments.get(userId)!.push(assignment);
  });

  console.log("═══════════════════════════════════════════════\n");

  userAssignments.forEach((assignments, userId) => {
    const user = assignments[0].assignee;
    const unfinishedTasks = assignments.filter((a) => a.card.status !== "DONE");

    console.log(`👤 User: ${user.name} (ID: ${user.id})`);
    console.log(`   Email: ${user.email}`);
    console.log(
      `   Total assignments: ${assignments.length} (${unfinishedTasks.length} unfinished)\n`
    );

    assignments.forEach((assignment, index) => {
      const statusIcon = assignment.card.status === "DONE" ? "✅" : "⏳";
      console.log(
        `   ${index + 1}. ${statusIcon} [${assignment.card.status}] Card #${
          assignment.card.id
        }: "${assignment.card.title}"`
      );
      console.log(
        `      Assigned by: ${
          assignment.assigner.name
        } at ${assignment.assignedAt.toLocaleString()}`
      );
      console.log(
        `      Reason: ${assignment.reason || "(no reason provided)"}`
      );
    });

    if (unfinishedTasks.length > 1) {
      console.log(
        `   \n   ⚠️  WARNING: User has ${unfinishedTasks.length} unfinished tasks!`
      );
    }

    console.log("\n═══════════════════════════════════════════════\n");
  });

  // Check card status consistency
  console.log("🔍 Checking Card.assigneeId consistency...\n");

  const cards = await prisma.card.findMany({
    where: {
      assigneeId: { not: null },
    },
    select: {
      id: true,
      title: true,
      assigneeId: true,
      status: true,
    },
  });

  for (const card of cards) {
    const activeAssignment = await prisma.cardAssignment.findFirst({
      where: {
        cardId: card.id,
        isActive: true,
      },
    });

    if (!activeAssignment) {
      console.log(
        `⚠️  Card #${card.id} has assigneeId=${card.assigneeId} but NO active assignment!`
      );
    } else if (activeAssignment.assignedTo !== card.assigneeId) {
      console.log(
        `⚠️  Card #${card.id} assigneeId mismatch: Card=${card.assigneeId}, Assignment=${activeAssignment.assignedTo}`
      );
    }
  }

  console.log("\n✅ Consistency check complete!");
}

checkAssignments()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
