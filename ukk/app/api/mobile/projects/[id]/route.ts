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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify token
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const { id } = await params;
    const userId = parseInt(decoded.userId);
    const projectId = parseInt(id);

    // Check if user is member of this project
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "You are not a member of this project" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get project with boards and only cards assigned to this user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
        boards: {
          include: {
            cards: {
              where: {
                // Only show cards assigned to this user
                assigneeId: userId,
              },
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                assignee: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                _count: {
                  select: {
                    subtasks: true,
                    comments: true,
                    timeLogs: true,
                  },
                },
              },
              orderBy: {
                position: "asc",
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(project, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Get project detail error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
