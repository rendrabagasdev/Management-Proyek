import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Save/Update FCM token
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { message: "FCM token is required" },
        { status: 400 }
      );
    }

    // Update user's FCM token
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token },
    });

    console.log(`FCM token saved for user ${userId}`);

    return NextResponse.json({
      message: "FCM token saved successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return NextResponse.json(
      { message: "An error occurred while saving FCM token" },
      { status: 500 }
    );
  }
}

// DELETE - Remove FCM token (for logout)
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Remove user's FCM token
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: null },
    });

    console.log(`FCM token removed for user ${userId}`);

    return NextResponse.json({
      message: "FCM token removed successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error removing FCM token:", error);
    return NextResponse.json(
      { message: "An error occurred while removing FCM token" },
      { status: 500 }
    );
  }
}
