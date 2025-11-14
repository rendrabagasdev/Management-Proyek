import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { triggerCardEvent, triggerProjectEvent } from "@/lib/firebase-triggers";
import {
  notifyCardAssigned,
  notifyCardUpdated,
  notifyCardCompleted,
} from "@/lib/notifications";

// GET /api/cards/:id - Get card by ID
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

    const card = await prisma.card.findUnique({
      where: { id: cardId },
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
        creator: { select: { id: true, name: true } },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { position: "asc" },
        },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        timeLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { startTime: "desc" },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}

// PATCH /api/cards/:id - Update card
export async function PATCH(
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
    const body = await request.json();
    const { status, assigneeId } = body;

    // Business rule: Cannot mark as DONE without time logs
    if (status === "DONE") {
      const timeLogsCount = await prisma.timeLog.count({
        where: { cardId },
      });

      if (timeLogsCount === 0) {
        return NextResponse.json(
          { error: "Cannot mark task as done without time tracking" },
          { status: 400 }
        );
      }
    }

    // Check if assignee is being changed (not just status change)
    if (assigneeId !== undefined && assigneeId !== null) {
      const newAssigneeId = parseInt(assigneeId);

      // Get current card with project info to validate assignee is a project member
      const currentCard = await prisma.card.findUnique({
        where: { id: cardId },
        include: {
          board: {
            select: {
              projectId: true,
            },
          },
        },
      });

      if (!currentCard) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
      }

      // Verify that the assignee is a member of the project
      const isProjectMember = await prisma.projectMember.findFirst({
        where: {
          projectId: currentCard.board.projectId,
          userId: newAssigneeId,
        },
      });

      if (!isProjectMember) {
        return NextResponse.json(
          { error: "Assignee must be a member of this project" },
          { status: 400 }
        );
      }

      // Only check if this is a new assignment (not updating existing assignee)
      if (currentCard.assigneeId !== newAssigneeId) {
        // Get project info to check if completed
        const project = await prisma.project.findUnique({
          where: { id: currentCard.board.projectId },
          select: { isCompleted: true },
        });

        // Only enforce one-task-per-user rule if project is NOT completed
        if (!project?.isCompleted) {
          // Check if the new assignee already has ANY assigned card (NOT DONE) IN THIS PROJECT
          const assignedCardsCount = await prisma.card.count({
            where: {
              assigneeId: newAssigneeId,
              id: { not: cardId },
              status: { not: "DONE" }, // Allow assignment if previous cards are DONE
              board: {
                projectId: currentCard.board.projectId,
              },
            },
          });

          if (assignedCardsCount > 0) {
            return NextResponse.json(
              {
                error:
                  "User already has an active (not completed) task in this project",
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Check if new assignee has active task (for IN_PROGRESS status)
    if (assigneeId && status === "IN_PROGRESS") {
      const activeTasksCount = await prisma.card.count({
        where: {
          assigneeId: parseInt(assigneeId),
          status: "IN_PROGRESS",
          id: { not: cardId },
        },
      });

      if (activeTasksCount >= 1) {
        return NextResponse.json(
          { error: "Assignee already has an active task" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    };

    // Only update assigneeId if it's explicitly provided in the request
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId ? parseInt(assigneeId) : null;
    }

    const updatedCard = await prisma.card.update({
      where: { id: cardId },
      data: updateData,
      include: {
        board: true,
        creator: { select: { id: true, name: true } },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true } },
          },
        },
        comments: {
          include: { user: { select: { id: true, name: true } } },
        },
        timeLogs: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    // 🔴 Trigger realtime event
    await triggerCardEvent(cardId, "card:updated", {
      card: updatedCard,
      userId: parseInt(session.user.id),
      timestamp: new Date().toISOString(),
    });

    // Also trigger project-level event for kanban board updates
    await triggerProjectEvent(updatedCard.board.projectId, "card:updated", {
      card: updatedCard,
      boardId: updatedCard.boardId,
      userId: parseInt(session.user.id),
      timestamp: new Date().toISOString(),
    });

    // 🔔 Send notifications
    const currentUserId = parseInt(session.user.id);
    const currentUserName = session.user.name || "Someone";

    // Notify on assignment change
    if (assigneeId !== undefined && updatedCard.assigneeId) {
      const previousCard = await prisma.card.findUnique({
        where: { id: cardId },
        select: { assigneeId: true },
      });

      // Only notify if assignee actually changed
      if (
        previousCard &&
        previousCard.assigneeId !== updatedCard.assigneeId &&
        updatedCard.assigneeId !== currentUserId
      ) {
        await notifyCardAssigned(
          updatedCard.assigneeId,
          cardId,
          updatedCard.title,
          currentUserName
        );
      }
    }

    // Notify on status change to DONE
    if (status === "DONE") {
      // Get all project members to notify
      const projectMembers = await prisma.projectMember.findMany({
        where: {
          projectId: updatedCard.board.projectId,
          userId: { not: currentUserId }, // Don't notify the person who completed it
        },
        select: { userId: true },
      });

      const memberIds = projectMembers.map((m) => m.userId);
      if (memberIds.length > 0) {
        await notifyCardCompleted(
          memberIds,
          cardId,
          updatedCard.title,
          currentUserName
        );
      }
    }

    // Notify assignee on other important changes
    if (
      updatedCard.assigneeId &&
      updatedCard.assigneeId !== currentUserId &&
      (body.priority || body.dueDate)
    ) {
      const changes = [];
      if (body.priority) changes.push(`priority changed to ${body.priority}`);
      if (body.dueDate) changes.push("due date updated");

      await notifyCardUpdated(
        updatedCard.assigneeId,
        cardId,
        updatedCard.title,
        currentUserName,
        changes.join(", ")
      );
    }

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("Error updating card:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}

// DELETE /api/cards/:id - Delete card
export async function DELETE(
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

    // Get card info before deleting
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          select: {
            id: true,
            projectId: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.card.delete({
      where: { id: cardId },
    });

    // Trigger realtime event
    await triggerProjectEvent(card.board.projectId.toString(), "card:deleted", {
      cardId,
      boardId: card.board.id,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("Error deleting card:", error);
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 }
    );
  }
}
