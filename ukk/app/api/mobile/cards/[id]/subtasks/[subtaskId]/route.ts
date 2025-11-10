import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExtractMobileJwtFromRequest } from "@/lib/auth-mobile";
import { triggerCardEvent } from "@/lib/pusher";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    // Verify token
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const { id, subtaskId: subtaskIdStr } = await params;
    const cardId = parseInt(id);
    const subtaskId = parseInt(subtaskIdStr);
    const userId = parseInt(decoded.userId);

    // Get current subtask with card and project info
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        card: {
          include: {
            board: {
              include: {
                project: {
                  include: {
                    members: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subtask) {
      return NextResponse.json(
        { message: "Subtask not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check permission
    const project = subtask.card.board.project;
    const member = project.members.find((m) => m.userId === userId);
    const isAssignee = subtask.card.assigneeId === userId;
    const isAdmin = decoded.role === "ADMIN";

    if (!member && !isAdmin) {
      return NextResponse.json(
        { message: "You are not a member of this project" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if user can update (LEADER, Assignee, or ADMIN)
    const canUpdate =
      member?.projectRole === "LEADER" ||
      isAssignee ||
      project.createdBy === userId ||
      isAdmin;

    if (!canUpdate) {
      return NextResponse.json(
        { message: "You don't have permission to update this subtask" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Toggle completed status
    const updatedSubtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        status: subtask.status === "DONE" ? "TODO" : "DONE",
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 🔴 Trigger realtime event
    await triggerCardEvent(cardId.toString(), "subtask:updated", {
      subtask: updatedSubtask,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(updatedSubtask, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Toggle subtask error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    // Verify token
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const { id, subtaskId: subtaskIdStr } = await params;
    const cardId = parseInt(id);
    const subtaskId = parseInt(subtaskIdStr);
    const userId = parseInt(decoded.userId);

    // Get subtask with card and project info
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        card: {
          include: {
            board: {
              include: {
                project: {
                  include: {
                    members: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subtask) {
      return NextResponse.json(
        { message: "Subtask not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check permission
    const project = subtask.card.board.project;
    const member = project.members.find((m) => m.userId === userId);
    const isAssignee = subtask.card.assigneeId === userId;
    const isAdmin = decoded.role === "ADMIN";

    if (!member && !isAdmin) {
      return NextResponse.json(
        { message: "You are not a member of this project" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if user can delete (LEADER, Assignee, or ADMIN)
    const canDelete =
      member?.projectRole === "LEADER" ||
      isAssignee ||
      project.createdBy === userId ||
      isAdmin;

    if (!canDelete) {
      return NextResponse.json(
        { message: "You don't have permission to delete this subtask" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Delete subtask
    await prisma.subtask.delete({
      where: { id: subtaskId },
    });

    // 🔴 Trigger realtime event
    await triggerCardEvent(cardId.toString(), "subtask:deleted", {
      subtaskId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { message: "Subtask deleted" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Delete subtask error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
