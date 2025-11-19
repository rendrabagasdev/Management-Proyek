import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects/approval-status - Get pending and completed projects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can view project approvals" },
        { status: 403 }
      );
    }

    // Fetch pending projects (completed but not approved)
    const pendingProjects = await prisma.project.findMany({
      where: {
        status: {
          not: "COMPLETED",
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, globalRole: true },
            },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Fetch approved projects
    const approvedProjects = await prisma.project.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, globalRole: true },
            },
          },
        },
      },
      orderBy: { approvedAt: "desc" },
    });

    // Calculate task stats for each project
    const enrichedPending = await Promise.all(
      pendingProjects.map(async (project) => {
        const tasks = await prisma.card.findMany({
          where: {
            board: {
              projectId: project.id,
            },
          },
        });

        const completedTasks = tasks.filter((t) => t.status === "DONE").length;

        return {
          ...project,
          totalTasks: tasks.length,
          completedTasks,
        };
      })
    );

    const enrichedApproved = await Promise.all(
      approvedProjects.map(async (project) => {
        const tasks = await prisma.card.findMany({
          where: {
            board: {
              projectId: project.id,
            },
          },
        });

        const completedTasks = tasks.filter((t) => t.status === "DONE").length;

        return {
          ...project,
          totalTasks: tasks.length,
          completedTasks,
        };
      })
    );

    return NextResponse.json({
      pending: enrichedPending,
      approved: enrichedApproved,
    });
  } catch (error) {
    console.error("Error fetching project approval status:", error);
    return NextResponse.json(
      { error: "Failed to fetch project approval status" },
      { status: 500 }
    );
  }
}
