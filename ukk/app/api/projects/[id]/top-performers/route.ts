import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects/:id/top-performers - Get top performers in a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const userId = parseInt(session.user.id);

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "all"; // week, month, all
    const limit = parseInt(searchParams.get("limit") || "10");

    // Check if user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                globalRole: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only Admin, Leader, or project members can view top performers
    const isAdmin = session.user.role === "ADMIN";
    const isLeader = project.members.some(
      (m) => m.userId === userId && m.projectRole === "LEADER"
    );
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isAdmin && !isLeader && !isMember && project.createdBy !== userId) {
      return NextResponse.json(
        {
          error:
            "Access denied. Only Admin, Leader, or project members can view top performers",
        },
        { status: 403 }
      );
    }

    // Calculate date range based on timeframe
    let startDate: Date | undefined;
    const now = new Date();

    switch (timeframe) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        startDate = undefined;
        break;
    }

    // Get all cards for this project with assignments and time logs
    const cards = await prisma.card.findMany({
      where: {
        board: {
          projectId: projectId,
        },
        ...(startDate && {
          updatedAt: {
            gte: startDate,
          },
        }),
      },
      include: {
        assignments: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        timeLogs: {
          where: startDate
            ? {
                startTime: {
                  gte: startDate,
                },
              }
            : undefined,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        comments: {
          where: startDate
            ? {
                createdAt: {
                  gte: startDate,
                },
              }
            : undefined,
        },
      },
    });

    // Calculate performance metrics for each user
    const userStats = new Map<
      number,
      {
        user: { id: number; name: string; email: string };
        cardsAssigned: number;
        cardsCompleted: number;
        cardsInProgress: number;
        totalTimeMinutes: number;
        commentsCount: number;
        completionRate: number;
        averageCompletionTime: number;
      }
    >();

    // Initialize stats for all project members
    project.members.forEach((member) => {
      userStats.set(member.userId, {
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
        },
        cardsAssigned: 0,
        cardsCompleted: 0,
        cardsInProgress: 0,
        totalTimeMinutes: 0,
        commentsCount: 0,
        completionRate: 0,
        averageCompletionTime: 0,
      });
    });

    // Track completion times for average calculation
    const completionTimes = new Map<number, number[]>();

    // Calculate stats from cards
    cards.forEach((card) => {
      // Get active assignments
      const activeAssignments = card.assignments.filter((a) => a.isActive);

      activeAssignments.forEach((assignment) => {
        const stats = userStats.get(assignment.assignedTo);
        if (stats) {
          stats.cardsAssigned++;

          if (card.status === "DONE") {
            stats.cardsCompleted++;

            // Calculate completion time
            const completionTime = Math.floor(
              (card.updatedAt.getTime() - assignment.assignedAt.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            if (!completionTimes.has(assignment.assignedTo)) {
              completionTimes.set(assignment.assignedTo, []);
            }
            completionTimes.get(assignment.assignedTo)?.push(completionTime);
          } else if (
            card.status === "IN_PROGRESS" ||
            card.status === "REVIEW"
          ) {
            stats.cardsInProgress++;
          }
        }
      });

      // Count comments
      card.comments.forEach((comment) => {
        const stats = userStats.get(comment.userId);
        if (stats) {
          stats.commentsCount++;
        }
      });

      // Sum time logs
      card.timeLogs.forEach((log) => {
        const stats = userStats.get(log.userId);
        if (stats && log.durationMinutes) {
          stats.totalTimeMinutes += log.durationMinutes;
        }
      });
    });

    // Calculate completion rates and average completion times
    userStats.forEach((stats, userId) => {
      if (stats.cardsAssigned > 0) {
        stats.completionRate =
          (stats.cardsCompleted / stats.cardsAssigned) * 100;
      }

      const times = completionTimes.get(userId);
      if (times && times.length > 0) {
        stats.averageCompletionTime =
          times.reduce((sum, time) => sum + time, 0) / times.length;
      }
    });

    // Convert to array and sort by multiple criteria
    const performers = Array.from(userStats.values())
      .map((stats) => ({
        ...stats,
        // Calculate overall score: weighted sum of different metrics
        score:
          stats.cardsCompleted * 10 + // Completed cards are most important
          stats.cardsInProgress * 5 + // In-progress shows active work
          stats.completionRate * 2 + // High completion rate is good
          (stats.totalTimeMinutes > 0 ? 5 : 0) + // Time tracking shows engagement
          stats.commentsCount * 0.5 - // Comments show collaboration
          (stats.averageCompletionTime > 0
            ? stats.averageCompletionTime * 0.1
            : 0), // Lower completion time is better
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Calculate project-wide statistics
    const projectStats = {
      totalCards: cards.length,
      completedCards: cards.filter((c) => c.status === "DONE").length,
      inProgressCards: cards.filter(
        (c) => c.status === "IN_PROGRESS" || c.status === "REVIEW"
      ).length,
      todoCards: cards.filter((c) => c.status === "TODO").length,
      totalMembers: project.members.length,
      activeMembers: Array.from(userStats.values()).filter(
        (s) => s.cardsAssigned > 0
      ).length,
    };

    return NextResponse.json({
      performers,
      projectStats,
      timeframe,
    });
  } catch (error) {
    console.error("Error fetching top performers:", error);
    return NextResponse.json(
      { error: "Failed to fetch top performers" },
      { status: 500 }
    );
  }
}
