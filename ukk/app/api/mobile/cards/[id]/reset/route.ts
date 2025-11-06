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

// Reset card to allow reassignment (for DONE cards)
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

    // Get card with project info to check permissions
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          include: {
            project: {
              include: {
                members: {
                  where: {
                    userId,
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

    // Check if user is a member of this project
    const member = card.board.project.members[0];
    if (!member) {
      return NextResponse.json(
        { message: "You don't have access to this card" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if card is DONE
    if (card.status !== "DONE") {
      return NextResponse.json(
        { message: "Only DONE cards can be reset for reassignment" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Reset card status to TODO and clear assignee to allow reassignment
    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: {
        status: "TODO",
        assigneeId: null,
        updatedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
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
      },
    });

    return NextResponse.json(
      {
        message: "Card reset successfully and ready for reassignment",
        card: updatedCard,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Reset card error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
