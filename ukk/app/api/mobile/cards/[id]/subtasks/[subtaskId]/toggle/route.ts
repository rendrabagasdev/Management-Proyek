import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExtractMobileJwtFromRequest } from "@/lib/auth-mobile";
import { Status } from "@prisma/client";

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

// PATCH - Toggle subtask status (TODO <-> DONE)
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

    const { id, subtaskId } = await params;
    const cardId = parseInt(id);
    const subtaskIdNum = parseInt(subtaskId);

    if (isNaN(cardId) || isNaN(subtaskIdNum)) {
      return NextResponse.json(
        { message: "Invalid card ID or subtask ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const userId = parseInt(decoded.userId);

    // Get subtask with card and project info
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskIdNum },
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

    // Verify card ID matches
    if (subtask.cardId !== cardId) {
      return NextResponse.json(
        { message: "Subtask does not belong to this card" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user is a member of the project
    const isMember = subtask.card.board.project.members.some(
      (m) => m.userId === userId
    );
    const isAdmin = decoded.role === "ADMIN";

    if (!isMember && !isAdmin) {
      return NextResponse.json(
        { message: "You are not a member of this project" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Toggle status: if DONE -> TODO, else -> DONE
    const newStatus =
      subtask.status === Status.DONE ? Status.TODO : Status.DONE;

    // Update subtask status
    const updatedSubtask = await prisma.subtask.update({
      where: { id: subtaskIdNum },
      data: {
        status: newStatus,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Subtask status updated",
        subtask: updatedSubtask,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Toggle subtask error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
