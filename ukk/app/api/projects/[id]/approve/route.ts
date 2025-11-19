import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/projects/:id/approve - Approve project completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can approve projects" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const userId = parseInt(session.user.id);
    const body = await request.json();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        boards: {
          include: {
            cards: {
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (
      project.boards
        .map((board) => board.cards)
        .flat()
        .some((card) => card.status !== "DONE")
    ) {
      return NextResponse.json(
        { error: "Project have card active" },
        { status: 404 }
      );
    }
    // Update project to mark as approved
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "COMPLETED",
        isCompleted: true,
        approvedAt: new Date(),
        approvedBy: session.user.name || "Admin",
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, globalRole: true },
            },
          },
        },
      },
    });

    // TODO: Send notification to project creator
    // TODO: Log this action

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error approving project:", error);
    return NextResponse.json(
      { error: "Failed to approve project" },
      { status: 500 }
    );
  }
}
