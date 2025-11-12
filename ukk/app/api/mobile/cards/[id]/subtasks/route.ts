import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ExtractMobileJwtFromRequest } from "@/lib/auth-mobile";
import { triggerCardEvent } from "@/lib/firebase-triggers";

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

// GET all subtasks for a card
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
    const cardId = parseInt(id);

    if (isNaN(cardId)) {
      return NextResponse.json(
        { message: "Invalid card ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const subtasks = await prisma.subtask.findMany({
      where: { cardId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(subtasks, { headers: corsHeaders });
  } catch (error) {
    console.error("Fetch subtasks error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Create new subtask (Member can add subtasks)
export async function POST(
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
    const cardId = parseInt(id);
    const body = await request.json();

    const { title, assigneeId } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { message: "Subtask title is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate card exists and user is a member
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          include: {
            project: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        globalRole: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { message: "Card not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user is a member of the project
    const member = card.board.project.members.find((m) => m.userId === userId);
    const isAdmin = decoded.role === "ADMIN";

    if (!member && !isAdmin) {
      return NextResponse.json(
        { message: "You are not a member of this project" },
        { status: 403, headers: corsHeaders }
      );
    }

    // OBSERVER cannot create subtasks
    if (member && member.projectRole === "OBSERVER" && !isAdmin) {
      return NextResponse.json(
        { message: "Observers cannot create subtasks" },
        { status: 403, headers: corsHeaders }
      );
    }

    // If assigneeId is provided, validate it
    if (assigneeId) {
      const assigneeMember = card.board.project.members.find(
        (m) => m.userId === parseInt(assigneeId)
      );

      if (!assigneeMember) {
        return NextResponse.json(
          { message: "Assignee must be a member of this project" },
          { status: 400, headers: corsHeaders }
        );
      }

      // Can't assign to OBSERVER
      if (assigneeMember.projectRole === "OBSERVER" && !isAdmin) {
        return NextResponse.json(
          { message: "Cannot assign subtasks to observers" },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Get the highest position for ordering
    const maxPosition = await prisma.subtask.findFirst({
      where: { cardId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    // Create subtask
    const subtask = await prisma.subtask.create({
      data: {
        title: title.trim(),
        cardId,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        status: "TODO",
        position: (maxPosition?.position || 0) + 1,
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

    // 🔴 Trigger realtime event
    await triggerCardEvent(cardId.toString(), "subtask:created", {
      subtask,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        message: "Subtask created successfully",
        subtask,
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Add subtask error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
