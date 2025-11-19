import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/projects/:id/reject - Reject project completion and reopen
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
        { error: "Only admins can reject projects" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const body = await request.json();
    const { notes } = body;

    if (!notes || notes.trim() === "") {
      return NextResponse.json(
        { error: "Notes are required when rejecting a project" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Reopen project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        isCompleted: false,
        completedAt: null,
        status: "ACTIVE",
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

    // TODO: Send notification to project creator with rejection notes
    // TODO: Log this action

    return NextResponse.json({
      ...updatedProject,
      rejectionNotes: notes,
    });
  } catch (error) {
    console.error("Error rejecting project:", error);
    return NextResponse.json(
      { error: "Failed to reject project" },
      { status: 500 }
    );
  }
}
