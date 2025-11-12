import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Status } from "@prisma/client";
import { triggerCardEvent } from "@/lib/firebase-triggers";

// GET all subtasks for a card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cardId = parseInt(id);

    if (isNaN(cardId)) {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
    }

    const subtasks = await prisma.subtask.findMany({
      where: { cardId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create subtask - Enhanced for member access
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cardId = parseInt(id);
    const { title, assigneeId } = await request.json();

    if (!title || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Check if card exists and get project details
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          include: {
            project: {
              include: {
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
            },
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const userId = parseInt(session.user.id);
    const project = card.board.project;

    // Check if user is a member of the project
    const member = project.members.find((m) => m.userId === userId);
    const isCreator = project.createdBy === userId;
    const isAdmin = session.user.role === "ADMIN";

    if (!member && !isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "You are not a member of this project" },
        { status: 403 }
      );
    }

    // OBSERVER can only view, not create subtasks
    if (member && member.projectRole === "OBSERVER" && !isAdmin) {
      return NextResponse.json(
        { error: "Observers cannot create subtasks" },
        { status: 403 }
      );
    }

    // If assigneeId is provided, validate it
    if (assigneeId) {
      const assigneeMember = project.members.find(
        (m) => m.userId === parseInt(assigneeId)
      );
      if (!assigneeMember) {
        return NextResponse.json(
          { error: "Assignee must be a member of this project" },
          { status: 400 }
        );
      }

      // Can't assign to OBSERVER
      if (assigneeMember.projectRole === "OBSERVER" && !isAdmin) {
        return NextResponse.json(
          { error: "Cannot assign subtasks to observers" },
          { status: 400 }
        );
      }
    }

    // Get the highest position
    const maxPosition = await prisma.subtask.findFirst({
      where: { cardId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const subtask = await prisma.subtask.create({
      data: {
        cardId,
        title: title.trim(),
        status: Status.TODO,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        position: (maxPosition?.position || 0) + 1,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 🔴 Trigger realtime event
    await triggerCardEvent(cardId, "subtask:created", {
      subtask,
      userId: parseInt(session.user.id),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      message: "Subtask created successfully",
      subtask,
    });
  } catch (error) {
    console.error("Create subtask error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
