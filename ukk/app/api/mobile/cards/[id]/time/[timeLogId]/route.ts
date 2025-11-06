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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; timeLogId: string }> }
) {
  try {
    // Verify token
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const { timeLogId: timeLogIdStr } = await params;
    const userId = parseInt(decoded.userId);
    const timeLogId = parseInt(timeLogIdStr);

    // Get time log
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: timeLogId },
    });

    if (!timeLog) {
      return NextResponse.json(
        { message: "Time log not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if this is the user's timer
    if (timeLog.userId !== userId) {
      return NextResponse.json(
        { message: "You can only stop your own timer" },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check if timer is already stopped
    if (timeLog.endTime) {
      return NextResponse.json(
        { message: "Timer is already stopped" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Stop timer
    const endTime = new Date();
    const durationMinutes = Math.floor(
      (endTime.getTime() - timeLog.startTime.getTime()) / 60000
    );

    const updatedTimeLog = await prisma.timeLog.update({
      where: { id: timeLogId },
      data: {
        endTime,
        durationMinutes,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        card: {
          select: {
            id: true,
            title: true,
            assigneeId: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTimeLog, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Stop timer error:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
