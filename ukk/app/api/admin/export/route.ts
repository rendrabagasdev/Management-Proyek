import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can export data
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
