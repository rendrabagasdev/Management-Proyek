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

  // Create users
  const passwordHash = await hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@ukk.com",
      passwordHash,
      globalRole: GlobalRole.ADMIN,
    },
  });

  const leader1 = await prisma.user.create({
    data: {
      name: "Project Leader 1",
      email: "leader1@ukk.com",
      passwordHash,
      globalRole: GlobalRole.LEADER,
    },
  });

  const leader2 = await prisma.user.create({
    data: {
      name: "Project Leader 2",
      email: "leader2@ukk.com",
      passwordHash,
      globalRole: GlobalRole.LEADER,
    },
  });

  const developer1 = await prisma.user.create({
    data: {
      name: "Developer Andi",
      email: "dev1@ukk.com",
      passwordHash,
      globalRole: GlobalRole.MEMBER,
    },
  });

  const developer2 = await prisma.user.create({
    data: {
      name: "Developer Budi",
      email: "dev2@ukk.com",
      passwordHash,
      globalRole: GlobalRole.MEMBER,
    },
  });

  const designer1 = await prisma.user.create({
    data: {
      name: "Designer Citra",
      email: "designer1@ukk.com",
      passwordHash,
      globalRole: GlobalRole.MEMBER,
    },
  });

  const designer2 = await prisma.user.create({
    data: {
      name: "Designer Dina",
      email: "designer2@ukk.com",
      passwordHash,
      globalRole: GlobalRole.MEMBER,
    },
  });

  console.log("✅ Users created");

  // Create Project 1: E-Commerce Platform
  const project1 = await prisma.project.create({
    data: {
      name: "E-Commerce Platform",
      description:
        "Build a modern e-commerce platform with payment integration",
      createdBy: leader1.id,
      members: {
        create: [
          { userId: leader1.id, projectRole: ProjectRole.LEADER },
          { userId: developer1.id, projectRole: ProjectRole.DEVELOPER },
          { userId: developer2.id, projectRole: ProjectRole.DEVELOPER },
          { userId: designer1.id, projectRole: ProjectRole.DESIGNER },
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

  console.log("✅ Project 1 created");

  // Create Project 2: Mobile App Development
  const project2 = await prisma.project.create({
    data: {
      name: "Mobile App Development",
      description: "Cross-platform mobile app using React Native",
      createdBy: leader2.id,
      members: {
        create: [
          { userId: leader2.id, projectRole: ProjectRole.LEADER },
          { userId: developer2.id, projectRole: ProjectRole.DEVELOPER },
          { userId: designer2.id, projectRole: ProjectRole.DESIGNER },
          { userId: admin.id, projectRole: ProjectRole.OBSERVER },
        ],
      },
      boards: {
        create: [
          { name: "Backlog", position: 0 },
          { name: "Sprint", position: 1 },
          { name: "Testing", position: 2 },
          { name: "Deployed", position: 3 },
        ],
      },
    },
    include: { boards: true },
  });

  console.log("✅ Project 2 created");

  // Get project members for assignments
  const project1Members = await prisma.projectMember.findMany({
    where: { projectId: project1.id },
  });
  const dev1Member = project1Members.find((m) => m.userId === developer1.id)!;
  const dev2Member = project1Members.find((m) => m.userId === developer2.id)!;
  const designer1Member = project1Members.find(
    (m) => m.userId === designer1.id
  )!;

  // Create cards for Project 1
  const todoBoard1 = project1.boards.find((b) => b.name === "To Do")!;
  const inProgressBoard1 = project1.boards.find(
    (b) => b.name === "In Progress"
  )!;
  const reviewBoard1 = project1.boards.find((b) => b.name === "Review")!;
  const doneBoard1 = project1.boards.find((b) => b.name === "Done")!;

  // Card 1: IN_PROGRESS - Assigned to Developer 1
  const card1 = await prisma.card.create({
    data: {
      boardId: inProgressBoard1.id,
      title: "Setup authentication system",
      description:
        "Implement JWT-based authentication with role-based access control",
      priority: Priority.HIGH,
      status: Status.IN_PROGRESS,
      createdBy: leader1.id,
      assigneeId: developer1.id, // Set assigneeId
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subtasks: {
        create: [
          {
            title: "Create login API endpoint",
            status: Status.DONE,
            assigneeId: developer1.id,
            position: 0,
          },
          {
            title: "Create register API endpoint",
            status: Status.IN_PROGRESS,
            assigneeId: developer1.id,
            position: 1,
          },
          {
            title: "Add JWT middleware",
            status: Status.TODO,
            assigneeId: developer1.id,
            position: 2,
          },
        ],
      },
      assignments: {
        create: {
          assignedTo: developer1.id,
          assignedBy: leader1.id,
          projectMemberId: dev1Member.id,
          reason: "Initial assignment for authentication work",
          isActive: true,
        },
      },
    },
  });

  // Card 2: TODO - Assigned to Designer 1
  const card2 = await prisma.card.create({
    data: {
      boardId: todoBoard1.id,
      title: "Design product catalog UI",
      description:
        "Create wireframes and mockups for product listing and detail pages",
      priority: Priority.MEDIUM,
      status: Status.TODO,
      createdBy: leader1.id,
      assigneeId: designer1.id, // Set assigneeId
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      assignments: {
        create: {
          assignedTo: designer1.id,
          assignedBy: leader1.id,
          projectMemberId: designer1Member.id,
          reason: "UI/UX design work",
          isActive: true,
        },
      },
    },
  });

  // Card 3: DONE - Was assigned to Developer 2 (completed)
  const card3 = await prisma.card.create({
    data: {
      boardId: doneBoard1.id,
      title: "Setup project repository",
      description:
        "Initialize Git repo, setup CI/CD pipeline, and configure ESLint",
      priority: Priority.HIGH,
      status: Status.DONE,
      createdBy: leader1.id,
      assigneeId: developer2.id, // Keep assigneeId for history
      approvedBy: leader1.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      assignments: {
        create: {
          assignedTo: developer2.id,
          assignedBy: leader1.id,
          projectMemberId: dev2Member.id,
          reason: "Repository setup - Task completed",
          isActive: false,
          unassignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Card 4: TODO - Not yet assigned (in backlog)
  const card4 = await prisma.card.create({
    data: {
      boardId: todoBoard1.id,
      title: "Implement payment gateway",
      description: "Integrate Stripe payment gateway for checkout process",
      priority: Priority.HIGH,
      status: Status.TODO,
      createdBy: leader1.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      // No assignment yet - waiting in backlog
    },
  });

  // Card 5: DONE - Was assigned to Developer 1 (completed)
  const card5 = await prisma.card.create({
    data: {
      boardId: doneBoard1.id,
      title: "Product search functionality",
      description: "Implement search with filters and sorting",
      priority: Priority.MEDIUM,
      status: Status.DONE,
      createdBy: leader1.id,
      assigneeId: developer1.id,
      approvedBy: leader1.id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      assignments: {
        create: {
          assignedTo: developer1.id,
          assignedBy: leader1.id,
          projectMemberId: dev1Member.id,
          reason: "Search feature implementation - Completed",
          isActive: false,
          unassignedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log("✅ Cards created for Project 1");

  // Add comments
  await prisma.comment.createMany({
    data: [
      {
        cardId: card1.id,
        userId: developer1.id,
        text: "Started working on login endpoint. Using bcrypt for password hashing.",
      },
      {
        cardId: card1.id,
        userId: leader1.id,
        text: "Great! Make sure to add rate limiting for security.",
      },
      {
        cardId: card2.id,
        userId: designer1.id,
        text: "Will start with wireframes first, then create high-fidelity mockups.",
      },
      {
        cardId: card3.id,
        userId: developer2.id,
        text: "Repository setup complete. Added GitHub Actions for CI/CD.",
      },
      {
        cardId: card4.id,
        userId: leader1.id,
        text: "Please research Stripe API documentation before implementing.",
      },
      {
        cardId: card5.id,
        userId: developer1.id,
        text: "Search feature implemented with ElasticSearch. Completed!",
      },
      {
        cardId: card5.id,
        userId: leader1.id,
        text: "Great work! Tested and approved. Merging to production.",
      },
    ],
  });

  console.log("✅ Comments added");

  // Add time logs
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  await prisma.timeLog.createMany({
    data: [
      // Card 1 - Developer 1
      {
        cardId: card1.id,
        userId: developer1.id,
        startTime: twoHoursAgo,
        endTime: oneHourAgo,
        durationMinutes: 60,
        notes: "Implemented login API with JWT token generation",
      },
      {
        cardId: card1.id,
        userId: developer1.id,
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000
        ),
        durationMinutes: 120,
        notes: "Working on register endpoint and password hashing",
      },
      // Card 3 - Developer 2 (completed)
      {
        cardId: card3.id,
        userId: developer2.id,
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000
        ),
        durationMinutes: 90,
        notes: "Setup Git repository and initial project structure",
      },
      {
        cardId: card3.id,
        userId: developer2.id,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000
        ),
        durationMinutes: 45,
        notes: "Configured CI/CD pipeline with GitHub Actions",
      },
      // Card 5 - Developer 1
      {
        cardId: card5.id,
        userId: developer1.id,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000 + 180 * 60 * 1000
        ),
        durationMinutes: 180,
        notes: "Implemented search with ElasticSearch integration",
      },
      {
        cardId: card5.id,
        userId: developer1.id,
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000
        ),
        durationMinutes: 60,
        notes: "Fixed bugs and added tests. Task completed.",
      },
    ],
  });

  console.log("✅ Time logs added");

  // Get project members for Project 2 assignments
  const project2Members = await prisma.projectMember.findMany({
    where: { projectId: project2.id },
  });
  const dev2MemberP2 = project2Members.find((m) => m.userId === developer2.id)!;
  const designer2Member = project2Members.find(
    (m) => m.userId === designer2.id
  )!;

  // Create cards for Project 2
  const backlogBoard2 = project2.boards.find((b) => b.name === "Backlog")!;
  const sprintBoard2 = project2.boards.find((b) => b.name === "Sprint")!;
  const testingBoard2 = project2.boards.find((b) => b.name === "Testing")!;
  const deployedBoard2 = project2.boards.find((b) => b.name === "Deployed")!;

  // Card 6: IN_PROGRESS - Assigned to Developer 2
  const card6 = await prisma.card.create({
    data: {
      boardId: sprintBoard2.id,
      title: "Implement user profile screen",
      description: "Create profile screen with edit functionality",
      priority: Priority.MEDIUM,
      status: Status.IN_PROGRESS,
      createdBy: leader2.id,
      assigneeId: developer2.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      subtasks: {
        create: [
          {
            title: "Create profile UI layout",
            status: Status.DONE,
            assigneeId: developer2.id,
            position: 0,
          },
          {
            title: "Add edit functionality",
            status: Status.IN_PROGRESS,
            assigneeId: developer2.id,
            position: 1,
          },
          {
            title: "Implement avatar upload",
            status: Status.TODO,
            assigneeId: developer2.id,
            position: 2,
          },
        ],
      },
      assignments: {
        create: {
          assignedTo: developer2.id,
          assignedBy: leader2.id,
          projectMemberId: dev2MemberP2.id,
          reason: "Mobile development task",
          isActive: true,
        },
      },
    },
  });

  // Card 7: TODO - Assigned to Designer 2
  const card7 = await prisma.card.create({
    data: {
      boardId: backlogBoard2.id,
      title: "Design app icons and splash screen",
      description: "Create app icon set for iOS and Android",
      priority: Priority.LOW,
      status: Status.TODO,
      createdBy: leader2.id,
      assigneeId: designer2.id,
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      assignments: {
        create: {
          assignedTo: designer2.id,
          assignedBy: leader2.id,
          projectMemberId: designer2Member.id,
          reason: "Design work for mobile app",
          isActive: true,
        },
      },
    },
  });

  // Card 8: TODO - Not yet assigned (in backlog)
  await prisma.card.create({
    data: {
      boardId: backlogBoard2.id,
      title: "Implement push notifications",
      description: "Setup Firebase Cloud Messaging for push notifications",
      priority: Priority.MEDIUM,
      status: Status.TODO,
      createdBy: leader2.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      // No assignment yet - in backlog
    },
  });

  // Add comments for Project 2
  await prisma.comment.createMany({
    data: [
      {
        cardId: card6.id,
        userId: developer2.id,
        text: "Profile layout completed. Working on edit functionality now.",
      },
      {
        cardId: card6.id,
        userId: leader2.id,
        text: "Looking good! Make sure to add form validation.",
      },
      {
        cardId: card7.id,
        userId: designer2.id,
        text: "I'll create multiple icon variations for review.",
      },
    ],
  });

  // Add time logs for Project 2
  await prisma.timeLog.createMany({
    data: [
      {
        cardId: card6.id,
        userId: developer2.id,
        startTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        durationMinutes: 180,
        notes: "Implemented profile screen UI and basic edit functionality",
      },
      {
        cardId: card6.id,
        userId: developer2.id,
        startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000
        ),
        durationMinutes: 90,
        notes: "Setup navigation to profile screen",
      },
    ],
  });

  console.log("✅ Cards created for Project 2");

  console.log("🎉 Seed completed successfully!");
  console.log("\n📧 Test credentials:");
  console.log("Admin: admin@ukk.com / password123");
  console.log("Leader 1: leader1@ukk.com / password123");
  console.log("Leader 2: leader2@ukk.com / password123");
  console.log("Developer 1: dev1@ukk.com / password123");
  console.log("Developer 2: dev2@ukk.com / password123");
  console.log("Designer 1: designer1@ukk.com / password123");
  console.log("Designer 2: designer2@ukk.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
