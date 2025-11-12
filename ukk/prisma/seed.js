/*
  Prisma seed for development - Creates sample data
*/
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Prisma seed: starting...");

  // Hash password untuk semua user
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🗑️  Cleaning existing data...");
  await prisma.notification.deleteMany();
  await prisma.timeLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.cardAssignment.deleteMany();
  await prisma.card.deleteMany();
  await prisma.board.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appSettings.deleteMany();

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

  const leader1 = await prisma.user.create({
    data: {
      name: "Team Leader",
      email: "leader@ukk.com",
      passwordHash: hashedPassword,
      globalRole: "LEADER",
    },
  });

  const leader2 = await prisma.user.create({
    data: {
      name: "Project Manager",
      email: "manager@ukk.com",
      passwordHash: hashedPassword,
      globalRole: "LEADER",
    },
  });

  const developer1 = await prisma.user.create({
    data: {
      name: "John Developer",
      email: "developer@ukk.com",
      passwordHash: hashedPassword,
      globalRole: "MEMBER",
    },
  });

  const developer2 = await prisma.user.create({
    data: {
      name: "Jane Coder",
      email: "jane@ukk.com",
      passwordHash: hashedPassword,
      globalRole: "MEMBER",
    },
  });

  const designer1 = await prisma.user.create({
    data: {
      name: "Sarah Designer",
      email: "designer@ukk.com",
      passwordHash: hashedPassword,
      globalRole: "MEMBER",
    },
  });

  const designer2 = await prisma.user.create({
    data: {
      name: "Mike Creative",
      email: "mike@ukk.com",
      passwordHash: hashedPassword,
      globalRole: "MEMBER",
    },
  });

  console.log(`✅ Created ${7} users`);

  // ===========================
  // CREATE PROJECTS
  // ===========================
  console.log("📁 Creating projects...");

  const project1 = await prisma.project.create({
    data: {
      name: "E-Commerce Website Redesign",
      description:
        "Complete redesign of the company e-commerce platform with modern UI/UX and improved performance",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      createdBy: admin.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Mobile App Development",
      description:
        "Cross-platform mobile application for iOS and Android using React Native",
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      createdBy: leader1.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: "API Microservices Migration",
      description:
        "Migrate monolithic backend to microservices architecture using Docker and Kubernetes",
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      createdBy: leader2.id,
    },
  });

  console.log(`✅ Created ${3} projects`);

  // ===========================
  // ADD PROJECT MEMBERS
  // ===========================
  console.log("👨‍💼 Adding project members...");

  // Project 1 members
  const pm1_leader = await prisma.projectMember.create({
    data: { projectId: project1.id, userId: leader1.id, projectRole: "LEADER" },
  });

  const pm1_dev1 = await prisma.projectMember.create({
    data: {
      projectId: project1.id,
      userId: developer1.id,
      projectRole: "DEVELOPER",
    },
  });

  const pm1_dev2 = await prisma.projectMember.create({
    data: {
      projectId: project1.id,
      userId: developer2.id,
      projectRole: "DEVELOPER",
    },
  });

  const pm1_designer = await prisma.projectMember.create({
    data: {
      projectId: project1.id,
      userId: designer1.id,
      projectRole: "DESIGNER",
    },
  });

  // Project 2 members
  const pm2_leader = await prisma.projectMember.create({
    data: { projectId: project2.id, userId: leader2.id, projectRole: "LEADER" },
  });

  const pm2_dev1 = await prisma.projectMember.create({
    data: {
      projectId: project2.id,
      userId: developer1.id,
      projectRole: "DEVELOPER",
    },
  });

  const pm2_designer = await prisma.projectMember.create({
    data: {
      projectId: project2.id,
      userId: designer2.id,
      projectRole: "DESIGNER",
    },
  });

  // Project 3 members
  const pm3_leader = await prisma.projectMember.create({
    data: { projectId: project3.id, userId: leader1.id, projectRole: "LEADER" },
  });

  const pm3_dev2 = await prisma.projectMember.create({
    data: {
      projectId: project3.id,
      userId: developer2.id,
      projectRole: "DEVELOPER",
    },
  });

  console.log(`✅ Added project members`);

  // ===========================
  // CREATE BOARDS
  // ===========================
  console.log("📋 Creating boards...");

  // Project 1 boards
  const board1_backlog = await prisma.board.create({
    data: { projectId: project1.id, name: "Backlog", position: 0 },
  });

  const board1_todo = await prisma.board.create({
    data: { projectId: project1.id, name: "To Do", position: 1 },
  });

  const board1_progress = await prisma.board.create({
    data: { projectId: project1.id, name: "In Progress", position: 2 },
  });

  const board1_review = await prisma.board.create({
    data: { projectId: project1.id, name: "Review", position: 3 },
  });

  const board1_done = await prisma.board.create({
    data: { projectId: project1.id, name: "Done", position: 4 },
  });

  // Project 2 boards
  const board2_todo = await prisma.board.create({
    data: { projectId: project2.id, name: "To Do", position: 0 },
  });

  const board2_progress = await prisma.board.create({
    data: { projectId: project2.id, name: "In Progress", position: 1 },
  });

  const board2_done = await prisma.board.create({
    data: { projectId: project2.id, name: "Done", position: 2 },
  });

  // Project 3 boards
  const board3_todo = await prisma.board.create({
    data: { projectId: project3.id, name: "To Do", position: 0 },
  });

  const board3_progress = await prisma.board.create({
    data: { projectId: project3.id, name: "In Progress", position: 1 },
  });

  console.log(`✅ Created boards for all projects`);

  // ===========================
  // CREATE CARDS
  // ===========================
  console.log("📝 Creating cards...");

  // Project 1 cards
  const card1 = await prisma.card.create({
    data: {
      boardId: board1_progress.id,
      title: "Design Homepage Layout",
      description:
        "Create modern and responsive homepage design with hero section, features, and call-to-action",
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: leader1.id,
      assigneeId: designer1.id,
      position: 0,
    },
  });

  const card2 = await prisma.card.create({
    data: {
      boardId: board1_todo.id,
      title: "Implement Product Catalog",
      description:
        "Build product listing page with filters, sorting, and pagination",
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdBy: leader1.id,
      assigneeId: developer1.id,
      position: 0,
    },
  });

  const card3 = await prisma.card.create({
    data: {
      boardId: board1_progress.id,
      title: "Setup Shopping Cart",
      description:
        "Implement shopping cart functionality with add/remove items and quantity management",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdBy: leader1.id,
      assigneeId: developer2.id,
      position: 1,
    },
  });

  const card4 = await prisma.card.create({
    data: {
      boardId: board1_review.id,
      title: "Integrate Payment Gateway",
      description: "Connect with Stripe/PayPal for payment processing",
      priority: "HIGH",
      status: "REVIEW",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdBy: leader1.id,
      assigneeId: developer1.id,
      position: 0,
    },
  });

  const card5 = await prisma.card.create({
    data: {
      boardId: board1_done.id,
      title: "Setup Project Repository",
      description: "Initialize Git repository and setup CI/CD pipeline",
      priority: "HIGH",
      status: "DONE",
      createdBy: leader1.id,
      assigneeId: developer1.id,
      position: 0,
    },
  });

  // Project 2 cards
  const card6 = await prisma.card.create({
    data: {
      boardId: board2_progress.id,
      title: "Build Authentication Flow",
      description: "Implement login, signup, and password reset with JWT",
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      createdBy: leader2.id,
      assigneeId: developer1.id,
      position: 0,
    },
  });

  const card7 = await prisma.card.create({
    data: {
      boardId: board2_todo.id,
      title: "Design Mobile UI Components",
      description: "Create reusable UI components following design system",
      priority: "MEDIUM",
      status: "TODO",
      dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      createdBy: leader2.id,
      assigneeId: designer2.id,
      position: 0,
    },
  });

  const card8 = await prisma.card.create({
    data: {
      boardId: board2_done.id,
      title: "Setup React Native Project",
      description: "Initialize React Native project with required dependencies",
      priority: "HIGH",
      status: "DONE",
      createdBy: leader2.id,
      assigneeId: developer1.id,
      position: 0,
    },
  });

  // Project 3 cards
  const card9 = await prisma.card.create({
    data: {
      boardId: board3_progress.id,
      title: "Dockerize Auth Service",
      description: "Create Docker container for authentication microservice",
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      createdBy: leader1.id,
      assigneeId: developer2.id,
      position: 0,
    },
  });

  const card10 = await prisma.card.create({
    data: {
      boardId: board3_todo.id,
      title: "Setup Kubernetes Cluster",
      description: "Configure K8s cluster on cloud provider",
      priority: "HIGH",
      status: "TODO",
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      createdBy: leader1.id,
      assigneeId: developer2.id,
      position: 0,
    },
  });

  console.log(`✅ Created ${10} cards`);

  // ===========================
  // CREATE CARD ASSIGNMENTS
  // ===========================
  console.log("🔗 Creating card assignments...");

  await prisma.cardAssignment.create({
    data: {
      cardId: card1.id,
      assignedTo: designer1.id,
      assignedBy: leader1.id,
      projectMemberId: pm1_designer.id,
      isActive: true,
    },
  });

  await prisma.cardAssignment.create({
    data: {
      cardId: card2.id,
      assignedTo: developer1.id,
      assignedBy: leader1.id,
      projectMemberId: pm1_dev1.id,
      isActive: true,
    },
  });

  await prisma.cardAssignment.create({
    data: {
      cardId: card3.id,
      assignedTo: developer2.id,
      assignedBy: leader1.id,
      projectMemberId: pm1_dev2.id,
      isActive: true,
    },
  });

  console.log(`✅ Created card assignments`);

  // ===========================
  // CREATE SUBTASKS
  // ===========================
  console.log("✔️  Creating subtasks...");

  await prisma.subtask.createMany({
    data: [
      {
        cardId: card1.id,
        title: "Create wireframes",
        status: "DONE",
        position: 0,
      },
      {
        cardId: card1.id,
        title: "Design hero section",
        status: "IN_PROGRESS",
        assigneeId: designer1.id,
        position: 1,
      },
      {
        cardId: card1.id,
        title: "Design features section",
        status: "TODO",
        position: 2,
      },

      {
        cardId: card2.id,
        title: "Setup database schema",
        status: "DONE",
        position: 0,
      },
      {
        cardId: card2.id,
        title: "Create API endpoints",
        status: "TODO",
        assigneeId: developer1.id,
        position: 1,
      },
      {
        cardId: card2.id,
        title: "Implement filters",
        status: "TODO",
        position: 2,
      },

      {
        cardId: card3.id,
        title: "Design cart UI",
        status: "DONE",
        position: 0,
      },
      {
        cardId: card3.id,
        title: "Implement add to cart",
        status: "IN_PROGRESS",
        assigneeId: developer2.id,
        position: 1,
      },
      {
        cardId: card3.id,
        title: "Add quantity controls",
        status: "TODO",
        position: 2,
      },
    ],
  });

  console.log(`✅ Created subtasks`);

  // ===========================
  // CREATE COMMENTS
  // ===========================
  console.log("💬 Creating comments...");

  await prisma.comment.createMany({
    data: [
      {
        cardId: card1.id,
        userId: leader1.id,
        text: "Please make sure to follow our brand guidelines for colors and typography.",
      },
      {
        cardId: card1.id,
        userId: designer1.id,
        text: "Got it! I'll use the color palette from the design system.",
      },
      {
        cardId: card2.id,
        userId: developer1.id,
        text: "Should we implement infinite scroll or traditional pagination?",
      },
      {
        cardId: card2.id,
        userId: leader1.id,
        text: "Let's go with pagination for better performance on large datasets.",
      },
      {
        cardId: card4.id,
        userId: developer1.id,
        text: "Payment integration is complete. Ready for testing.",
      },
      {
        cardId: card4.id,
        userId: leader1.id,
        text: "Great! I'll review the code and test with sandbox credentials.",
      },
    ],
  });

  console.log(`✅ Created comments`);

  // ===========================
  // CREATE TIME LOGS
  // ===========================
  console.log("⏱️  Creating time logs...");

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await prisma.timeLog.createMany({
    data: [
      {
        cardId: card1.id,
        userId: designer1.id,
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000),
        durationMinutes: 120,
        notes: "Created initial wireframes and mockups",
      },
      {
        cardId: card1.id,
        userId: designer1.id,
        startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        endTime: null, // Currently working
        durationMinutes: null,
        notes: "Designing hero section",
      },
      {
        cardId: card3.id,
        userId: developer2.id,
        startTime: yesterday,
        endTime: new Date(yesterday.getTime() + 4 * 60 * 60 * 1000),
        durationMinutes: 240,
        notes: "Implemented basic cart functionality",
      },
    ],
  });

  console.log(`✅ Created time logs`);

  // ===========================
  // CREATE NOTIFICATIONS
  // ===========================
  console.log("🔔 Creating notifications...");

  await prisma.notification.createMany({
    data: [
      {
        userId: designer1.id,
        type: "CARD_ASSIGNED",
        title: "New Task Assigned",
        message: "You have been assigned to: Design Homepage Layout",
        link: `/cards/${card1.id}`,
        isRead: false,
      },
      {
        userId: developer1.id,
        type: "CARD_ASSIGNED",
        title: "New Task Assigned",
        message: "You have been assigned to: Implement Product Catalog",
        link: `/cards/${card2.id}`,
        isRead: false,
      },
      {
        userId: developer2.id,
        type: "CARD_ASSIGNED",
        title: "New Task Assigned",
        message: "You have been assigned to: Setup Shopping Cart",
        link: `/cards/${card3.id}`,
        isRead: true,
      },
      {
        userId: leader1.id,
        type: "CARD_UPDATED",
        title: "Card Updated",
        message: "Design Homepage Layout has been updated by Sarah Designer",
        link: `/cards/${card1.id}`,
        isRead: false,
      },
      {
        userId: developer1.id,
        type: "COMMENT_ADDED",
        title: "New Comment",
        message: "Team Leader commented on Implement Product Catalog",
        link: `/cards/${card2.id}`,
        isRead: false,
      },
      {
        userId: designer1.id,
        type: "DEADLINE_APPROACHING",
        title: "Deadline Approaching",
        message: "Design Homepage Layout is due in 7 days",
        link: `/cards/${card1.id}`,
        isRead: false,
      },
    ],
  });

  console.log(`✅ Created notifications`);

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
    ],
  });

  console.log(`✅ Created app settings`);

  // ===========================
  // SUMMARY
  // ===========================
  console.log("\n✨ Seeding completed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 Summary:");
  console.log(`   👥 Users: 7 (1 Admin, 2 Leaders, 4 Members)`);
  console.log(`   📁 Projects: 3`);
  console.log(`   📋 Boards: 10`);
  console.log(`   📝 Cards: 10`);
  console.log(`   ✔️  Subtasks: 9`);
  console.log(`   💬 Comments: 6`);
  console.log(`   ⏱️  Time Logs: 3`);
  console.log(`   🔔 Notifications: 6`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🔐 Login credentials:");
  console.log("   Email: admin@ukk.com");
  console.log("   Email: leader@ukk.com");
  console.log("   Email: developer@ukk.com");
  console.log("   Email: designer@ukk.com");
  console.log("   Password: password123");
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
