import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlobalRole } from "@prisma/client";

// PATCH /api/users/[id]/role - Update user's global role (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can change user roles
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admin can change user roles" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const { globalRole } = body;

    if (!globalRole) {
      return NextResponse.json(
        { error: "globalRole is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projectMembers: {
          where: {
            projectRole: "LEADER",
          },
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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent admin from changing their own role
    if (userId === parseInt(session.user.id)) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    // Warning: If changing LEADER to MEMBER and user is leading a project
    if (
      user.globalRole === "LEADER" &&
      globalRole === "MEMBER" &&
      user.projectMembers.length > 0
    ) {
      // This is allowed but will be warned in the UI
      // The user will still be project LEADER but cannot be assigned to new projects as LEADER
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        globalRole: globalRole as GlobalRole,
      },
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
