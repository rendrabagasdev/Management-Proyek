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
    const cardId = parseInt(id);

    // Get card with all details
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        board: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        subtasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        timeLogs: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startTime: "desc",
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

    // Check if user has access to this card's project
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: card.board.project.id,
        userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "You don't have access to this card" },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json(card, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Get card detail error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PATCH(
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

    // Get card with project info
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          include: {
            project: true,
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

    // Check if user has access
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: card.board.project.id,
        userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "You don't have access to this card" },
        { status: 403, headers: corsHeaders }
      );
    }

    // ⚠️ BLOCK assigneeId update from mobile PATCH
    // Must use /api/cards/[id]/assign endpoint instead
    if (body.assigneeId !== undefined) {
      return NextResponse.json(
        {
          message:
            "Cannot update assigneeId directly. Use assign endpoint instead.",
          endpoint: `/api/cards/${cardId}/assign`,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update card (without assigneeId)
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...body,
        assigneeId: undefined, // Ensure not updated
        updatedAt: new Date(),
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
      },
    });

    return NextResponse.json(updatedCard, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Update card error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
