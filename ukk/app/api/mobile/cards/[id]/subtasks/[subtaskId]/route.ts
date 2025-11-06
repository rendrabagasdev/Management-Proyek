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
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    // Verify token
    const authHeader = request.headers.get("Authorization") || "";
    const decoded = await ExtractMobileJwtFromRequest(authHeader);

    if (decoded instanceof NextResponse) {
      return decoded;
    }

    const { subtaskId: subtaskIdStr } = await params;
    const subtaskId = parseInt(subtaskIdStr);

    // Get current subtask
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!subtask) {
      return NextResponse.json(
        { message: "Subtask not found" },
        { status: 404, headers: corsHeaders }
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

    const { subtaskId: subtaskIdStr } = await params;
    const subtaskId = parseInt(subtaskIdStr);

    // Delete subtask
    await prisma.subtask.delete({
      where: { id: subtaskId },
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
