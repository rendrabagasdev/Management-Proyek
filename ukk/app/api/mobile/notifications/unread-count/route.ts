import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ExtractMobileJwtFromRequest } from "@/lib/auth-mobile";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const userId = parseInt(decoded.userId);

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return NextResponse.json({ count }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Get unread count error:", error);
    return NextResponse.json(
      { message: "Failed to fetch unread count" },
      { status: 500, headers: corsHeaders }
    );
  }
}
