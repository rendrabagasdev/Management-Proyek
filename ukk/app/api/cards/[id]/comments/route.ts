import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { triggerCardEvent } from "@/lib/firebase-triggers";
import {
  notifyCommentAdded,
  notifyMentionInComment,
} from "@/lib/notifications";

// POST /api/cards/:id/comments - Add comment to card
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
    const body = await request.json();

    if (!body.text) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        cardId,
        userId,
        text: body.text,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // 🔴 Trigger realtime event
    await triggerCardEvent(cardId, "comment:created", {
      comment,
      userId,
      timestamp: new Date().toISOString(),
    });

    // 🔔 Send notifications
    const currentUserName = session.user.name || "Someone";

    // Get card with assignee info
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        title: true,
        assigneeId: true,
        createdBy: true,
      },
    });

    if (card) {
      // Notify card assignee (if not the commenter)
      if (card.assigneeId && card.assigneeId !== userId) {
        await notifyCommentAdded(
          card.assigneeId,
          cardId,
          card.title,
          currentUserName
        );
      }

      // Notify card creator (if different from assignee and commenter)
      if (card.createdBy !== userId && card.createdBy !== card.assigneeId) {
        await notifyCommentAdded(
          card.createdBy,
          cardId,
          card.title,
          currentUserName
        );
      }

      // Detect mentions (@username) in comment text
      const mentionRegex = /@(\w+)/g;
      const mentions = body.text.match(mentionRegex);

      if (mentions) {
        // Get all project members to find mentioned users
        const projectMembers = await prisma.projectMember.findMany({
          where: {
            project: {
              boards: {
                some: {
                  cards: {
                    some: { id: cardId },
                  },
                },
              },
            },
          },
          include: {
            user: { select: { id: true, name: true } },
          },
        });

        // Notify mentioned users
        for (const mention of mentions) {
          const username = mention.slice(1); // Remove @
          const mentionedUser = projectMembers.find(
            (pm) =>
              pm.user.name.toLowerCase() === username.toLowerCase() &&
              pm.userId !== userId
          );

          if (mentionedUser) {
            await notifyMentionInComment(
              mentionedUser.userId,
              cardId,
              card.title,
              currentUserName
            );
          }
        }
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// GET /api/cards/:id/comments - Get all comments for a card
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

    const comments = await prisma.comment.findMany({
      where: { cardId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
