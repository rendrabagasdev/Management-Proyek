import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExtractMobileJwtFromRequest } from "@/lib/auth-mobile";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  try {
    // Verify token
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const userId = parseInt(decoded.userId);

    // Get user's projects (all projects where user is a member)
    const projectMembers = await prisma.projectMember.findMany({
      where: {
        userId: userId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get task count for each project (only assigned tasks)
    const projects = await Promise.all(
      projectMembers.map(async (pm) => {
        const taskCount = await prisma.card.count({
          where: {
            board: {
              projectId: pm.project.id,
            },
            // Only cards where user is the assignee OR has assigned subtasks
            OR: [
              { assigneeId: userId },
              {
                subtasks: {
                  some: { assigneeId: userId },
                },
              },
            ],
          },
        });

        return {
          id: pm.project.id,
          name: pm.project.name,
          taskCount,
        };
      })
    );

    // Get all cards assigned to user (active tasks only)
    const myCards = await prisma.card.findMany({
      where: {
        // Only cards where user is the assignee OR has assigned subtasks
        OR: [
          { assigneeId: userId },
          {
            subtasks: {
              some: { assigneeId: userId },
            },
          },
        ],
        // Only active statuses (not DONE)
        status: {
          in: ["TODO", "IN_PROGRESS", "REVIEW"],
        },
      },
      include: {
        creator: {
          select: { id: true, name: true },
        },
        subtasks: {
          include: {
            assignee: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20, // Limit to recent 20 tasks
    });

    return NextResponse.json(
      {
        projects,
        myCards,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
