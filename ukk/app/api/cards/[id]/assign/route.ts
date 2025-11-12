import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { triggerCardEvent, triggerProjectEvent } from "@/lib/firebase-triggers";

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
    const userId = parseInt(session.user.id);
    const cardId = parseInt(id);
    const body = await request.json();
    const { assigneeId, reason } = body;

    // Get card with project info
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
        assignments: {
          where: { isActive: true },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ message: "Card not found" }, { status: 404 });
    }

    // Check if user is LEADER or ADMIN
    const member = card.board.project.members.find((m) => m.userId === userId);
    const isLeader = member?.projectRole === "LEADER";
    const isAdmin = session.user.role === "ADMIN";

    if (!isLeader && !isAdmin) {
      return NextResponse.json(
        { message: "Only leaders can assign tasks" },
        { status: 403 }
      );
    }

    let assigneeMember = null;
    // Validate assignee is a member of the project
    if (assigneeId) {
      assigneeMember = card.board.project.members.find(
        (m) => m.userId === assigneeId
      );
      if (!assigneeMember) {
        return NextResponse.json(
          { message: "Assignee must be a member of this project" },
          { status: 400 }
        );
      }

      // Check if user is MEMBER role (not OBSERVER)
      if (
        assigneeMember.projectRole === "OBSERVER" &&
        session.user.role !== "ADMIN"
      ) {
        return NextResponse.json(
          { message: "Cannot assign tasks to observers" },
          { status: 400 }
        );
      }

      // ⚠️ CRITICAL: Check if user already has active assignments
      const userActiveAssignments = await prisma.cardAssignment.findMany({
        where: {
          assignedTo: assigneeId,
          isActive: true,
          cardId: { not: cardId }, // Exclude current card (allow re-assign)
        },
        include: {
          card: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      // Check if any active assignment has unfinished card
      const unfinishedCards = userActiveAssignments.filter(
        (assignment) => assignment.card.status !== "DONE"
      );

      if (unfinishedCards.length > 0) {
        const cardTitles = unfinishedCards
          .map((a) => `"${a.card.title}"`)
          .join(", ");
        return NextResponse.json(
          {
            message: `User already has ${unfinishedCards.length} unfinished task(s): ${cardTitles}. Please complete existing tasks first.`,
            unfinishedCards: unfinishedCards.map((a) => ({
              cardId: a.card.id,
              title: a.card.title,
              status: a.card.status,
            })),
          },
          { status: 400 }
        );
      }
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // ⚠️ FIX: Deactivate ALL active assignments for this card (not just first one)
      await tx.cardAssignment.updateMany({
        where: {
          cardId,
          isActive: true,
        },
        data: {
          isActive: false,
          unassignedAt: new Date(),
        },
      });

      // Create new assignment if assigneeId provided
      if (assigneeId && assigneeMember) {
        await tx.cardAssignment.create({
          data: {
            cardId,
            assignedTo: assigneeId,
            assignedBy: userId,
            projectMemberId: assigneeMember.id,
            reason: reason || null,
            isActive: true,
          },
        });
      }

      // Update card status and assigneeId
      const updateData = {
        assigneeId: assigneeId || null,
        updatedAt: new Date(),
        // If card was DONE and being reassigned, reset to TODO
        ...(card.status === "DONE" && assigneeId
          ? { status: "TODO" as const }
          : {}),
      };

      return await tx.card.update({
        where: { id: cardId },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          assignments: {
            where: { isActive: true },
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              assigner: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    // Trigger realtime events
    await triggerCardEvent(cardId.toString(), "card:assigned", {
      card: result,
      assigneeId,
      userId,
      timestamp: new Date().toISOString(),
    });

    await triggerProjectEvent(
      card.board.project.id.toString(),
      "card:assigned",
      {
        card: result,
        boardId: card.boardId,
        assigneeId,
        userId,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Assign card error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
