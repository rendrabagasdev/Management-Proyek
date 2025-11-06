import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { triggerCardEvent, triggerProjectEvent } from "@/lib/pusher";

// POST /api/cards/:id/time - Start time tracking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cardId = parseInt(id);
    const userId = parseInt(session.user.id);

    // Check if user already has an active timer
    const activeTimer = await prisma.timeLog.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });

    if (activeTimer) {
      return NextResponse.json(
        { error: "You already have an active timer. Please stop it first." },
        { status: 400 }
      );
    }

    // Fetch the card to inspect current assignee/status and project
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Verify user is a member of this project
    const isProjectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: card.board.projectId,
        userId: userId,
      },
    });

    if (!isProjectMember) {
      return NextResponse.json(
        { error: "You must be a member of this project to start a timer" },
        { status: 403 }
      );
    }

    // Prevent starting a timer on a DONE card
    if (card.status === "DONE") {
      return NextResponse.json(
        { error: "Cannot start timer on a completed task" },
        { status: 400 }
      );
    }

    // If the current assignee is not the user, ensure the user doesn't already have an IN_PROGRESS card IN THIS PROJECT
    if (card.assigneeId !== userId) {
      const userActiveTasks = await prisma.card.count({
        where: {
          assigneeId: userId,
          status: "IN_PROGRESS",
          board: {
            projectId: card.board.projectId,
          },
        },
      });

      if (userActiveTasks >= 1) {
        return NextResponse.json(
          {
            error:
              "You already have an active task in this project. Stop it before starting a new one.",
          },
          { status: 400 }
        );
      }

      // Also check if user already has an assigned card in this project
      const userAssignedCards = await prisma.card.count({
        where: {
          assigneeId: userId,
          id: { not: cardId },
          board: {
            projectId: card.board.projectId,
          },
        },
      });

      if (userAssignedCards > 0) {
        return NextResponse.json(
          {
            error:
              "You already have an assigned task in this project. Complete it before starting a new one.",
          },
          { status: 400 }
        );
      }
    } else {
      // If already assigned to the user, also ensure they don't have another IN_PROGRESS task (excluding this card)
      const otherActive = await prisma.card.count({
        where: {
          assigneeId: userId,
          status: "IN_PROGRESS",
          id: { not: cardId },
          board: {
            projectId: card.board.projectId,
          },
        },
      });

      if (otherActive >= 1) {
        return NextResponse.json(
          {
            error:
              "You already have another active task. Stop it before starting a new one.",
          },
          { status: 400 }
        );
      }
    }

    // Create timelog and update card atomically
    const now = new Date();
    const [timeLog, updatedCard] = await prisma.$transaction([
      prisma.timeLog.create({
        data: {
          cardId,
          userId,
          startTime: now,
        },
        include: {
          card: { select: { id: true, title: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.card.update({
        where: { id: cardId },
        data: {
          status: "IN_PROGRESS",
          assigneeId: userId,
        },
        include: {
          creator: { select: { id: true, name: true } },
          subtasks: {
            select: {
              id: true,
              title: true,
              status: true,
              assignee: { select: { id: true, name: true } },
            },
          },
          comments: {
            select: {
              id: true,
              text: true,
              createdAt: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
          timeLogs: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              durationMinutes: true,
              notes: true,
              user: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ] as const);

    // Trigger realtime event for card detail
    await triggerCardEvent(cardId.toString(), "timelog:started", {
      timeLog,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Trigger realtime event for project board (card status changed to IN_PROGRESS)
    await triggerProjectEvent(card.board.projectId.toString(), "card:updated", {
      card: updatedCard,
      boardId: card.boardId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(timeLog, { status: 201 });
  } catch (error) {
    console.error("Error starting time log:", error);
    return NextResponse.json(
      { error: "Failed to start time tracking" },
      { status: 500 }
    );
  }
}

// PATCH /api/cards/:id/time/:timeLogId - Stop time tracking
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const timeLogId = body.timeLogId;

    const timeLog = await prisma.timeLog.findUnique({
      where: { id: timeLogId },
    });

    if (!timeLog) {
      return NextResponse.json(
        { error: "Time log not found" },
        { status: 404 }
      );
    }

    if (timeLog.userId !== userId) {
      return NextResponse.json(
        { error: "You can only stop your own timer" },
        { status: 403 }
      );
    }

    if (timeLog.endTime) {
      return NextResponse.json(
        { error: "This timer has already been stopped" },
        { status: 400 }
      );
    }

    const endTime = new Date();
    const durationMinutes = Math.floor(
      (endTime.getTime() - timeLog.startTime.getTime()) / 1000 // Changed to seconds
    );

    const updatedTimeLog = await prisma.timeLog.update({
      where: { id: timeLogId },
      data: {
        endTime,
        durationMinutes, // Now stores seconds
      },
      include: {
        card: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    });

    // Trigger realtime event
    await triggerCardEvent(timeLog.cardId.toString(), "timelog:stopped", {
      timeLog: updatedTimeLog,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(updatedTimeLog);
  } catch (error) {
    console.error("Error stopping time log:", error);
    return NextResponse.json(
      { error: "Failed to stop time tracking" },
      { status: 500 }
    );
  }
}

// GET /api/cards/:id/time - Get all time logs for a card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cardId = parseInt(id);

    const timeLogs = await prisma.timeLog.findMany({
      where: { cardId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json(timeLogs);
  } catch (error) {
    console.error("Error fetching time logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch time logs" },
      { status: 500 }
    );
  }
}
