import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { triggerCardEvent } from "@/lib/pusher";

// Update subtask
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, subtaskId } = await params;
    const cardId = parseInt(id);
    const subtaskIdNum = parseInt(subtaskId);
    const { status } = await request.json();

    // Check if subtask exists
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskIdNum },
      include: {
        card: {
          include: {
            board: {
              include: {
                project: {
                  include: {
                    members: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subtask || subtask.cardId !== cardId) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const userId = parseInt(session.user.id);
    const project = subtask.card.board.project;
    const isCreator = project.createdBy === userId;
    const isMember = project.members.some((m) => m.userId === userId);

    if (!isCreator && !isMember && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update subtask
    const updatedSubtask = await prisma.subtask.update({
      where: { id: subtaskIdNum },
      data: { status },
    });

    // Trigger realtime event
    await triggerCardEvent(cardId.toString(), "subtask:updated", {
      subtask: updatedSubtask,
      userId: parseInt(session.user.id),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(updatedSubtask);
  } catch (error) {
    console.error("Update subtask error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete subtask
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, subtaskId } = await params;
    const cardId = parseInt(id);
    const subtaskIdNum = parseInt(subtaskId);

    // Check if subtask exists
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskIdNum },
      include: {
        card: {
          include: {
            board: {
              include: {
                project: {
                  include: {
                    members: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subtask || subtask.cardId !== cardId) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const userId = parseInt(session.user.id);
    const project = subtask.card.board.project;
    const isCreator = project.createdBy === userId;
    const userMembership = project.members.find((m) => m.userId === userId);

    // Only LEADER can delete
    const canDelete =
      isCreator ||
      userMembership?.projectRole === "LEADER" ||
      session.user.role === "ADMIN";

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.subtask.delete({
      where: { id: subtaskIdNum },
    });

    // Trigger realtime event
    await triggerCardEvent(cardId.toString(), "subtask:deleted", {
      subtaskId: subtaskIdNum,
      userId: parseInt(session.user.id),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete subtask error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
