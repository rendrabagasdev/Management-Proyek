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
    const cardId = parseInt(id);

    // Get all time logs for this card
    const timeLogs = await prisma.timeLog.findMany({
      where: { cardId },
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
    });

    return NextResponse.json(timeLogs, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Get time logs error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}

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

    // Check if user already has an active timer
    const activeTimer = await prisma.timeLog.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (activeTimer) {
      return NextResponse.json(
        { message: "You already have an active timer running" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get card to check status
    const card = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json(
        { message: "Card not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Use transaction to start timer and update card status
    const result = await prisma.$transaction(async (tx) => {
      // Start new timer
      const timeLog = await tx.timeLog.create({
        data: {
          cardId,
          userId,
          startTime: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Auto update card status to IN_PROGRESS if not already
      if (card.status !== "IN_PROGRESS" && card.status !== "DONE") {
        await tx.card.update({
          where: { id: cardId },
          data: {
            status: "IN_PROGRESS",
            updatedAt: new Date(),
          },
        });
      }

      return timeLog;
    });

    return NextResponse.json(result, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("Start timer error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
