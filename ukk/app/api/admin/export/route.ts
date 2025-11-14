import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can export data
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get format from query parameter
    const format = req.nextUrl.searchParams.get("format") || "json";

    // Fetch all system data
    const [users, projects, cards, comments, totalTimeLogs] = await Promise.all(
      [
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            globalRole: true,
            createdAt: true,
          },
        }),
        prisma.project.findMany({
          include: {
            creator: {
              select: { name: true, email: true },
            },
            members: {
              include: {
                user: {
                  select: { name: true, email: true },
                },
              },
            },
            boards: {
              include: {
                cards: {
                  select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        }),
        prisma.card.count(),
        prisma.comment.count(),
        prisma.timeLog.count(),
      ]
    );

    // Get user counts separately
    const userCounts = await Promise.all(
      users.map(async (user) => ({
        userId: user.id,
        projectsCreated: await prisma.project.count({
          where: { createdBy: user.id },
        }),
        projectMemberships: await prisma.projectMember.count({
          where: { userId: user.id },
        }),
        tasksAssigned: await prisma.card.count({
          where: { assigneeId: user.id },
        }),
        commentsPosted: await prisma.comment.count({
          where: { userId: user.id },
        }),
        timeLogsCreated: await prisma.timeLog.count({
          where: { userId: user.id },
        }),
      }))
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      summary: {
        totalUsers: users.length,
        totalProjects: projects.length,
        totalCards: cards,
        totalComments: comments,
        totalTimeLogs: totalTimeLogs,
      },
      users: users.map((user) => {
        const counts = userCounts.find((c) => c.userId === user.id);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.globalRole,
          joinedDate: user.createdAt,
          activity: {
            projectsCreated: counts?.projectsCreated || 0,
            projectMemberships: counts?.projectMemberships || 0,
            tasksAssigned: counts?.tasksAssigned || 0,
            commentsPosted: counts?.commentsPosted || 0,
            timeLogsCreated: counts?.timeLogsCreated || 0,
          },
        };
      }),
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        createdBy: project.creator.name,
        createdAt: project.createdAt,
        memberCount: project.members.length,
        members: project.members.map((m) => ({
          name: m.user.name,
          email: m.user.email,
          role: m.projectRole,
        })),
        boards: project.boards.map((board) => ({
          name: board.name,
          cardCount: board.cards.length,
        })),
        statistics: {
          totalCards: project.boards.reduce(
            (sum, board) => sum + board.cards.length,
            0
          ),
          todoCards: project.boards.reduce(
            (sum, board) =>
              sum + board.cards.filter((c) => c.status === "TODO").length,
            0
          ),
          inProgressCards: project.boards.reduce(
            (sum, board) =>
              sum +
              board.cards.filter((c) => c.status === "IN_PROGRESS").length,
            0
          ),
          reviewCards: project.boards.reduce(
            (sum, board) =>
              sum + board.cards.filter((c) => c.status === "REVIEW").length,
            0
          ),
          doneCards: project.boards.reduce(
            (sum, board) =>
              sum + board.cards.filter((c) => c.status === "DONE").length,
            0
          ),
        },
      })),
    };

    // Return based on format
    if (format === "csv") {
      return generateCSV(exportData);
    } else if (format === "pdf") {
      return generatePDF(exportData);
    } else {
      // Default JSON format
      return NextResponse.json(exportData);
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

// Generate CSV format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateCSV(data: any) {
  const csvLines: string[] = [];

  // Summary Section
  csvLines.push("SYSTEM SUMMARY");
  csvLines.push("Category,Count");
  csvLines.push(`Total Users,${data.summary.totalUsers}`);
  csvLines.push(`Total Projects,${data.summary.totalProjects}`);
  csvLines.push(`Total Cards,${data.summary.totalCards}`);
  csvLines.push(`Total Comments,${data.summary.totalComments}`);
  csvLines.push(`Total Time Logs,${data.summary.totalTimeLogs}`);
  csvLines.push("");

  // Users Section
  csvLines.push("USERS");
  csvLines.push(
    "ID,Name,Email,Role,Joined Date,Projects Created,Project Memberships,Tasks Assigned,Comments Posted,Time Logs"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.users.forEach((user: any) => {
    csvLines.push(
      `${user.id},"${user.name}","${user.email}",${user.role},${new Date(
        user.joinedDate
      ).toLocaleDateString()},${user.activity.projectsCreated},${
        user.activity.projectMemberships
      },${user.activity.tasksAssigned},${user.activity.commentsPosted},${
        user.activity.timeLogsCreated
      }`
    );
  });
  csvLines.push("");

  // Projects Section
  csvLines.push("PROJECTS");
  csvLines.push(
    "ID,Name,Created By,Created At,Members,Total Cards,TODO,In Progress,Review,Done"
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data.projects.forEach((project: any) => {
    csvLines.push(
      `${project.id},"${project.name}","${project.createdBy}",${new Date(
        project.createdAt
      ).toLocaleDateString()},${project.memberCount},${
        project.statistics.totalCards
      },${project.statistics.todoCards},${project.statistics.inProgressCards},${
        project.statistics.reviewCards
      },${project.statistics.doneCards}`
    );
  });

  const csvContent = csvLines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="ukk-system-export-${
        new Date().toISOString().split("T")[0]
      }.csv"`,
    },
  });
}

// Generate PDF format (simple text-based PDF)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generatePDF(data: any) {
  // Create a simple HTML-based PDF content
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>UKK System Export</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 5px;
    }
    .summary {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary-item {
      display: flex;
      justify-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 12px;
    }
    th {
      background: #2563eb;
      color: white;
      padding: 12px 8px;
      text-align: left;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
      background: #f9fafb;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
    .badge-admin { background: #fee2e2; color: #991b1b; }
    .badge-leader { background: #dbeafe; color: #1e40af; }
    .badge-member { background: #e0e7ff; color: #3730a3; }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #6b7280;
      font-size: 11px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <h1>UKK Project Management System - Data Export</h1>
  <p><strong>Export Date:</strong> ${new Date(
    data.exportDate
  ).toLocaleString()}</p>

  <h2>System Summary</h2>
  <div class="summary">
    <div class="summary-item">
      <span><strong>Total Users:</strong></span>
      <span>${data.summary.totalUsers}</span>
    </div>
    <div class="summary-item">
      <span><strong>Total Projects:</strong></span>
      <span>${data.summary.totalProjects}</span>
    </div>
    <div class="summary-item">
      <span><strong>Total Cards:</strong></span>
      <span>${data.summary.totalCards}</span>
    </div>
    <div class="summary-item">
      <span><strong>Total Comments:</strong></span>
      <span>${data.summary.totalComments}</span>
    </div>
    <div class="summary-item">
      <span><strong>Total Time Logs:</strong></span>
      <span>${data.summary.totalTimeLogs}</span>
    </div>
  </div>

  <h2>Users (${data.users.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Projects</th>
        <th>Tasks</th>
        <th>Comments</th>
        <th>Time Logs</th>
      </tr>
    </thead>
    <tbody>
      ${data.users
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map(
          (user: any) => `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td><span class="badge badge-${user.role.toLowerCase()}">${
            user.role
          }</span></td>
          <td>${
            user.activity.projectsCreated + user.activity.projectMemberships
          }</td>
          <td>${user.activity.tasksAssigned}</td>
          <td>${user.activity.commentsPosted}</td>
          <td>${user.activity.timeLogsCreated}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <h2>Projects (${data.projects.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Project Name</th>
        <th>Created By</th>
        <th>Members</th>
        <th>Total Cards</th>
        <th>TODO</th>
        <th>In Progress</th>
        <th>Review</th>
        <th>Done</th>
      </tr>
    </thead>
    <tbody>
      ${data.projects
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map(
          (project: any) => `
        <tr>
          <td><strong>${project.name}</strong></td>
          <td>${project.createdBy}</td>
          <td>${project.memberCount}</td>
          <td>${project.statistics.totalCards}</td>
          <td>${project.statistics.todoCards}</td>
          <td>${project.statistics.inProgressCards}</td>
          <td>${project.statistics.reviewCards}</td>
          <td>${project.statistics.doneCards}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by UKK Project Management System</p>
    <p>For internal use only - Confidential</p>
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: "text/html" });

  return new NextResponse(blob, {
    headers: {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="ukk-system-export-${
        new Date().toISOString().split("T")[0]
      }.html"`,
    },
  });
}
