import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ExtractMobileJwtFromRequest } from "@/lib/auth-mobile";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET /api/mobile/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const userId = parseInt(decoded.userId);
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json(
      { notifications },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH /api/mobile/notifications - Mark as read
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const userId = parseInt(decoded.userId);
    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json(
        { message: "All notifications marked as read" },
        { status: 200, headers: corsHeaders }
      );
    }

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { message: "notificationIds array is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await prisma.notification.updateMany({
      where: {
        id: {
          in: notificationIds,
        },
        userId,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(
      { message: "Notifications marked as read" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Mark notifications as read error:", error);
    return NextResponse.json(
      { message: "Failed to update notifications" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE /api/mobile/notifications - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const userId = parseInt(decoded.userId);
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json(
        { message: "Notification ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    await prisma.notification.deleteMany({
      where: {
        id: parseInt(notificationId),
        userId,
      },
    });

    return NextResponse.json(
      { message: "Notification deleted" },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json(
      { message: "Failed to delete notification" },
      { status: 500, headers: corsHeaders }
    );
  }
}
