import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get assignment report for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");

    // Check if user has access to this project
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: parseInt(session.user.id),
      },
    });

    if (!member && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Build filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const where = {
      card: {
        board: {
          projectId,
        },
      },
      ...(Object.keys(dateFilter).length > 0 && { assignedAt: dateFilter }),
      ...(userId && { assignedTo: parseInt(userId) }),
    };

    // Get assignments with details
    const assignments = await prisma.cardAssignment.findMany({
      where,
      include: {
        card: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            board: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            globalRole: true,
          },
        },
        assigner: {
          select: {
            id: true,
            name: true,
            globalRole: true,
          },
        },
        projectMember: {
          select: {
            projectRole: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    // Calculate statistics
    const stats = {
      totalAssignments: assignments.length,
      activeAssignments: assignments.filter((a) => a.isActive).length,
      completedAssignments: assignments.filter(
        (a) => !a.isActive && a.unassignedAt
      ).length,
      byMember: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    assignments.forEach((assignment) => {
      // Count by member
      const memberName = assignment.assignee.name;
      stats.byMember[memberName] = (stats.byMember[memberName] || 0) + 1;

      // Count by card status
      const status = assignment.card.status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    return NextResponse.json({
      assignments,
      stats,
    });
  } catch (error) {
    console.error("Get assignment report error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
