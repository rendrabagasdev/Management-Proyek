import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectRole } from "@prisma/client";

// GET /api/users/[id]/leader-status - Check if user is already a LEADER
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    // Check if user is already a LEADER in any project
    const existingLeadership = await prisma.projectMember.findFirst({
      where: {
        userId,
        projectRole: ProjectRole.LEADER,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        user: {
          select: { name: true },
        },
      },
    });

    if (existingLeadership) {
      return NextResponse.json({
        isLeader: true,
        projectId: existingLeadership.project.id,
        projectName: existingLeadership.project.name,
        userName: existingLeadership.user.name,
      });
    }

    return NextResponse.json({ isLeader: false });
  } catch (error) {
    console.error("Error checking leader status:", error);
    return NextResponse.json(
      { error: "Failed to check leader status" },
      { status: 500 }
    );
  }
}
