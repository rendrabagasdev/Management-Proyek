/**
 * Script to fix duplicate active card assignments
 * Run this to clean up existing data corruption
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDuplicateAssignments() {
  console.log("🔍 Checking for duplicate active assignments...\n");

  // Find all cards with multiple active assignments
  const allAssignments = await prisma.cardAssignment.findMany({
    where: { isActive: true },
    orderBy: { assignedAt: "asc" },
    include: {
      card: {
        select: {
          id: true,
          title: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Group by cardId
  const cardGroups = new Map<number, typeof allAssignments>();
  allAssignments.forEach((assignment) => {
    const cardId = assignment.cardId;
    if (!cardGroups.has(cardId)) {
      cardGroups.set(cardId, []);
    }
    cardGroups.get(cardId)!.push(assignment);
  });

  // Find cards with multiple active assignments
  const duplicates = Array.from(cardGroups.entries()).filter(
    ([_, assignments]) => assignments.length > 1
  );

  if (duplicates.length === 0) {
    console.log("✅ No duplicate assignments found!");
    return;
  }

  console.log(
    `⚠️  Found ${duplicates.length} cards with duplicate assignments:\n`
  );

  let fixedCount = 0;

  for (const [cardId, assignments] of duplicates) {
    console.log(`Card #${cardId}: "${assignments[0].card.title}"`);
    console.log(`  ${assignments.length} active assignments found:`);

    assignments.forEach((a, index) => {
      console.log(
        `  ${index + 1}. Assigned to: ${a.assignee.name} (${
          a.assignee.id
        }) at ${a.assignedAt.toISOString()}`
      );
    });

    // Keep only the LATEST assignment (last one), deactivate others
    const sortedAssignments = assignments.sort(
      (a, b) => b.assignedAt.getTime() - a.assignedAt.getTime()
    );
    const keepAssignment = sortedAssignments[0];
    const deactivateAssignments = sortedAssignments.slice(1);

    console.log(`  ✅ Keeping: ${keepAssignment.assignee.name}`);
    console.log(
      `  ❌ Deactivating: ${deactivateAssignments.length} old assignments`
    );

    // Deactivate old assignments
    for (const assignment of deactivateAssignments) {
      await prisma.cardAssignment.update({
        where: { id: assignment.id },
        data: {
          isActive: false,
          unassignedAt: new Date(),
        },
      });
    }

    // Update card's assigneeId to match the kept assignment
    await prisma.card.update({
      where: { id: cardId },
      data: {
        assigneeId: keepAssignment.assignedTo,
      },
    });

    fixedCount++;
    console.log("");
  }

  console.log(`\n✅ Fixed ${fixedCount} cards with duplicate assignments!`);

  // Check for users with multiple unfinished tasks
  console.log("\n🔍 Checking for users with multiple unfinished tasks...\n");

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
        },
      },
    },
  });

  // Group by userId
  const userGroups = new Map<number, typeof activeAssignments>();
  activeAssignments.forEach((assignment) => {
    const userId = assignment.assignedTo;
    if (!userGroups.has(userId)) {
      userGroups.set(userId, []);
    }
    userGroups.get(userId)!.push(assignment);
  });

  // Find users with multiple unfinished tasks
  const usersWithMultipleTasks = Array.from(userGroups.entries()).filter(
    ([_, assignments]) => {
      const unfinished = assignments.filter((a) => a.card.status !== "DONE");
      return unfinished.length > 1;
    }
  );

  if (usersWithMultipleTasks.length === 0) {
    console.log("✅ No users with multiple unfinished tasks!");
  } else {
    console.log(
      `⚠️  Found ${usersWithMultipleTasks.length} users with multiple unfinished tasks:\n`
    );

    usersWithMultipleTasks.forEach(([userId, assignments]) => {
      const unfinished = assignments.filter((a) => a.card.status !== "DONE");
      console.log(`User: ${assignments[0].assignee.name} (${userId})`);
      console.log(`  Has ${unfinished.length} unfinished tasks:`);
      unfinished.forEach((a, index) => {
        console.log(`  ${index + 1}. [${a.card.status}] ${a.card.title}`);
      });
      console.log("");
    });
  }
}

fixDuplicateAssignments()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
