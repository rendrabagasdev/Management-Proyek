import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Get assignment history for a card
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

    // Get all assignments for this card
    const assignments = await prisma.cardAssignment.findMany({
      where: { cardId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            globalRole: true,
          },
        },
        assigner: {
          select: {
            id: true,
            name: true,
            globalRole: true,
          },
        },
        projectMember: {
          select: {
            projectRole: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Get assignment history error:", error);
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
