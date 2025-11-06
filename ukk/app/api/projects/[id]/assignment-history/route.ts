import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects/:id/assignment-history - Get assignment history for a project
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
    const assigneeId = searchParams.get("assigneeId");
    const cardId = searchParams.get("cardId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isActive = searchParams.get("isActive");

    // Check if user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only Admin, Leader, or project members can view assignment history
    const isAdmin = session.user.role === "ADMIN";
    const isLeader = project.members.some(
      (m) => m.userId === userId && m.projectRole === "LEADER"
    );
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isAdmin && !isLeader && !isMember && project.createdBy !== userId) {
      return NextResponse.json(
        {
          error:
            "Access denied. Only Admin, Leader, or project members can view assignment history",
        },
        { status: 403 }
      );
    }

    // Build filter conditions
    interface WhereCondition {
      card: {
        board: {
          projectId: number;
        };
      };
      assignedTo?: number;
      cardId?: number;
      isActive?: boolean;
      assignedAt?: {
        gte?: Date;
        lte?: Date;
      };
    }

    const where: WhereCondition = {
      card: {
        board: {
          projectId: projectId,
        },
      },
    };

    if (assigneeId) {
      where.assignedTo = parseInt(assigneeId);
    }

    if (cardId) {
      where.cardId = parseInt(cardId);
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (startDate || endDate) {
      where.assignedAt = {};
      if (startDate) {
        where.assignedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.assignedAt.lte = new Date(endDate);
      }
    }

    // Fetch assignment history
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
          },
        },
        assigner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        projectMember: {
          select: {
            id: true,
            projectRole: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    // Calculate statistics for each assignment
    const enrichedAssignments = assignments.map((assignment) => {
      let duration = null;
      let status = "active";

      if (assignment.unassignedAt) {
        duration = Math.floor(
          (assignment.unassignedAt.getTime() -
            assignment.assignedAt.getTime()) /
            (1000 * 60 * 60 * 24)
        ); // in days
        status = "unassigned";
      } else if (assignment.card.status === "DONE") {
        duration = Math.floor(
          (new Date().getTime() - assignment.assignedAt.getTime()) /
            (1000 * 60 * 60 * 24)
        ); // in days
        status = "completed";
      } else {
        duration = Math.floor(
          (new Date().getTime() - assignment.assignedAt.getTime()) /
            (1000 * 60 * 60 * 24)
        ); // in days
        status = "active";
      }

      return {
        ...assignment,
        duration,
        status,
      };
    });

    // Calculate summary statistics
    const summary = {
      total: assignments.length,
      active: assignments.filter((a) => a.isActive).length,
      completed: assignments.filter(
        (a) => !a.isActive && a.card.status === "DONE"
      ).length,
      unassigned: assignments.filter(
        (a) => !a.isActive && a.unassignedAt !== null
      ).length,
      averageDuration:
        enrichedAssignments
          .filter((a) => a.duration !== null)
          .reduce((sum, a) => sum + (a.duration || 0), 0) /
        (enrichedAssignments.filter((a) => a.duration !== null).length || 1),
    };

    return NextResponse.json({
      assignments: enrichedAssignments,
      summary,
    });
  } catch (error) {
    console.error("Error fetching assignment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment history" },
      { status: 500 }
    );
  }
}
