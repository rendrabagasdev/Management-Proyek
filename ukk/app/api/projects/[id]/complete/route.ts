import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only ADMIN or project creator can mark as completed
    const isAdmin = session.user.role === "ADMIN";
    const isCreator = project.createdBy === parseInt(session.user.id);

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        {
          error: "Only admin or project creator can mark project as completed",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isCompleted } = body;

    // Toggle completion status
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        isCompleted: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                globalRole: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: isCompleted ? "Project marked as completed" : "Project reopened",
      project: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project completion status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
