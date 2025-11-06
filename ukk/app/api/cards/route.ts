import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { triggerProjectEvent } from "@/lib/pusher";

// POST /api/cards - Create new card
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { boardId, title, description, priority, dueDate, assigneeId } = body;

    if (!boardId || !title) {
      return NextResponse.json(
        { error: "Board ID and title are required" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Check if assignee has reached task limit
    if (assigneeId) {
      // Get board to access project info
      const board = await prisma.board.findUnique({
        where: { id: parseInt(boardId) },
        include: {
          project: {
            select: { isCompleted: true },
          },
        },
      });

      if (!board) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
      }

      // Only enforce one-task-per-user rule if project is NOT completed
      if (!board.project.isCompleted) {
        // Check if assignee already has an active (not DONE) task in this project
        const assignedCardsCount = await prisma.card.count({
          where: {
            assigneeId: parseInt(assigneeId),
            status: { not: "DONE" }, // Allow assignment if previous cards are DONE
            board: {
              projectId: board.projectId,
            },
          },
        });

        if (assignedCardsCount > 0) {
          return NextResponse.json(
            {
              error:
                "Assignee already has an active (not completed) task in this project",
            },
            { status: 400 }
          );
        }
      }
    }

    const card = await prisma.card.create({
      data: {
        boardId: parseInt(boardId),
        title,
        description,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: userId,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
      },
      include: {
        board: true,
        creator: { select: { id: true, name: true } },
        subtasks: true,
        comments: {
          include: { user: { select: { id: true, name: true } } },
        },
        timeLogs: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    // Trigger realtime event
    await triggerProjectEvent(card.board.projectId.toString(), "card:created", {
      card,
      boardId: card.boardId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("Error creating card:", error);
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 }
    );
  }
}
