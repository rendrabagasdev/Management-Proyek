import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

// GET - Get overtime approval requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "my-requests"; // my-requests | pending-approvals | all

    let approvals;

    if (type === "my-requests") {
      // Get approvals yang user request
      approvals = await prisma.overtimeApproval.findMany({
        where: { requestedBy: userId },
        include: {
          card: {
            include: {
              board: {
                include: {
                  project: true,
                },
              },
            },
          },
          requester: {
            select: { id: true, name: true, email: true },
          },
          approver: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { requestedAt: "desc" },
      });
    } else if (type === "pending-approvals") {
      // Get pending approvals untuk leader/admin
      const isLeaderOrAdmin =
        session.user.role === "ADMIN" || session.user.role === "LEADER";

      if (!isLeaderOrAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      approvals = await prisma.overtimeApproval.findMany({
        where: {
          status: "PENDING",
          card: {
            board: {
              project: {
                OR: [
                  { createdBy: userId }, // Project creator
                  {
                    members: {
                      some: {
                        userId,
                        projectRole: "LEADER",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        include: {
          card: {
            include: {
              board: {
                include: {
                  project: true,
                },
              },
            },
          },
          requester: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { requestedAt: "desc" },
      });
    } else {
      // Get all approvals for a specific card
      const cardId = searchParams.get("cardId");
      if (!cardId) {
        return NextResponse.json(
          { error: "Card ID required" },
          { status: 400 }
        );
      }

      approvals = await prisma.overtimeApproval.findMany({
        where: { cardId: parseInt(cardId) },
        include: {
          requester: {
            select: { id: true, name: true, email: true },
          },
          approver: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { requestedAt: "desc" },
      });
    }

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("Get overtime approvals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch approvals" },
      { status: 500 }
    );
  }
}

// POST - Request overtime approval
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { cardId, reason } = await request.json();

    if (!cardId || !reason) {
      return NextResponse.json(
        { error: "Card ID and reason are required" },
        { status: 400 }
      );
    }

    // Get card details
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        board: {
          include: {
            project: {
              include: {
                creator: true,
                members: {
                  where: { projectRole: "LEADER" },
                  include: { user: true },
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

    // Check if user is assigned to this card
    if (card.assigneeId !== userId) {
      return NextResponse.json(
        { error: "You are not assigned to this card" },
        { status: 403 }
      );
    }

    // Check if deadline exists and is overdue
    if (!card.deadline) {
      return NextResponse.json(
        { error: "Card has no deadline" },
        { status: 400 }
      );
    }

    const now = new Date();
    const deadline = new Date(card.deadline);
    const daysOverdue = Math.ceil(
      (now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysOverdue <= 0) {
      return NextResponse.json(
        { error: "Card is not overdue yet" },
        { status: 400 }
      );
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.overtimeApproval.findFirst({
      where: {
        cardId,
        requestedBy: userId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending request for this card" },
        { status: 400 }
      );
    }

    // Create overtime approval request
    const approval = await prisma.overtimeApproval.create({
      data: {
        cardId,
        requestedBy: userId,
        reason,
        daysOverdue,
      },
      include: {
        card: true,
        requester: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Send notification to project leaders and creator
    const notifyUsers: number[] = [card.board.project.createdBy];

    // Add project leaders
    card.board.project.members.forEach((member) => {
      if (member.userId !== userId) {
        notifyUsers.push(member.userId);
      }
    });

    // Remove duplicates
    const uniqueUsers = [...new Set(notifyUsers)];

    // Create notifications
    await Promise.all(
      uniqueUsers.map((recipientId) =>
        createNotification({
          userId: recipientId,
          type: "OVERTIME_REQUEST",
          title: "Overtime Approval Request",
          message: `${session.user.name} meminta izin untuk melanjutkan task "${card.title}" yang terlambat ${daysOverdue} hari`,
          link: `/cards/${cardId}`,
        })
      )
    );

    return NextResponse.json({
      message: "Overtime approval request submitted",
      approval,
    });
  } catch (error) {
    console.error("Create overtime approval error:", error);
    return NextResponse.json(
      { error: "Failed to create approval request" },
      { status: 500 }
    );
  }
}

// PATCH - Approve or reject overtime request
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { approvalId, action, approverNotes } = await request.json();

    if (!approvalId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Approval ID and valid action required" },
        { status: 400 }
      );
    }

    // Get approval details
    const approval = await prisma.overtimeApproval.findUnique({
      where: { id: approvalId },
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
        requester: true,
      },
    });

    if (!approval) {
      return NextResponse.json(
        { error: "Approval request not found" },
        { status: 404 }
      );
    }

    if (approval.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Check if user is leader or admin
    const project = approval.card.board.project;
    const isProjectCreator = project.createdBy === userId;
    const isProjectLeader = project.members.some(
      (m) => m.userId === userId && m.projectRole === "LEADER"
    );
    const isAdmin = session.user.role === "ADMIN";

    if (!isProjectCreator && !isProjectLeader && !isAdmin) {
      return NextResponse.json(
        { error: "Only project leaders or admins can approve/reject requests" },
        { status: 403 }
      );
    }

    // Update approval
    const updatedApproval = await prisma.overtimeApproval.update({
      where: { id: approvalId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        approverId: userId,
        respondedAt: new Date(),
        approverNotes: approverNotes || null,
      },
      include: {
        card: true,
        requester: true,
        approver: {
          select: { name: true },
        },
      },
    });

    // Send notification to requester
    await createNotification({
      userId: approval.requestedBy,
      type: action === "approve" ? "OVERTIME_APPROVED" : "OVERTIME_REJECTED",
      title:
        action === "approve"
          ? "Overtime Request Approved"
          : "Overtime Request Rejected",
      message:
        action === "approve"
          ? `Your overtime request for "${approval.card.title}" has been approved by ${session.user.name}`
          : `Your overtime request for "${approval.card.title}" has been rejected by ${session.user.name}`,
      link: `/cards/${approval.cardId}`,
    });

    return NextResponse.json({
      message: `Request ${action}d successfully`,
      approval: updatedApproval,
    });
  } catch (error) {
    console.error("Update overtime approval error:", error);
    return NextResponse.json(
      { error: "Failed to update approval" },
      { status: 500 }
    );
  }
}
