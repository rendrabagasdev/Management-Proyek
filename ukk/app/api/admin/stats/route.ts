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

    // Only ADMIN can view system stats
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch activity statistics
    const [
      newUsersLast24h,
      newUsersLast7d,
      newUsersLast30d,
      newProjectsLast24h,
      newProjectsLast7d,
      newProjectsLast30d,
      newCardsLast24h,
      newCardsLast7d,
      newCardsLast30d,
      newCommentsLast24h,
      newCommentsLast7d,
      newCommentsLast30d,
      activeUsersLast24h,
      activeUsersLast7d,
      activeUsersLast30d,
    ] = await Promise.all([
      // New users
      prisma.user.count({ where: { createdAt: { gte: last24Hours } } }),
      prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      // New projects
      prisma.project.count({ where: { createdAt: { gte: last24Hours } } }),
      prisma.project.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.project.count({ where: { createdAt: { gte: last30Days } } }),
      // New cards
      prisma.card.count({ where: { createdAt: { gte: last24Hours } } }),
      prisma.card.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.card.count({ where: { createdAt: { gte: last30Days } } }),
      // New comments
      prisma.comment.count({ where: { createdAt: { gte: last24Hours } } }),
      prisma.comment.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.comment.count({ where: { createdAt: { gte: last30Days } } }),
      // Active users (based on time logs)
      prisma.user.count({
        where: {
          timeLogs: {
            some: {
              createdAt: { gte: last24Hours },
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          timeLogs: {
            some: {
              createdAt: { gte: last7Days },
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          timeLogs: {
            some: {
              createdAt: { gte: last30Days },
            },
          },
        },
      }),
    ]);

    const systemStats = {
      timestamp: now.toISOString(),
      activity: {
        last24Hours: {
          newUsers: newUsersLast24h,
          newProjects: newProjectsLast24h,
          newCards: newCardsLast24h,
          newComments: newCommentsLast24h,
          activeUsers: activeUsersLast24h,
        },
        last7Days: {
          newUsers: newUsersLast7d,
          newProjects: newProjectsLast7d,
          newCards: newCardsLast7d,
          newComments: newCommentsLast7d,
          activeUsers: activeUsersLast7d,
        },
        last30Days: {
          newUsers: newUsersLast30d,
          newProjects: newProjectsLast30d,
          newCards: newCardsLast30d,
          newComments: newCommentsLast30d,
          activeUsers: activeUsersLast30d,
        },
      },
    };

    return NextResponse.json(systemStats);
  } catch (error) {
    console.error("System stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch system stats" },
      { status: 500 }
    );
  }
}
