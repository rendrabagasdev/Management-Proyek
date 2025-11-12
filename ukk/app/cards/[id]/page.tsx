import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import CardDetail from "@/components/cards/CardDetail";

interface CardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CardPage({ params }: CardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id);
  const { id } = await params;
  const cardId = parseInt(id);

  if (isNaN(cardId)) {
    notFound();
  }

  // Fetch card with all details
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      board: {
        include: {
          project: {
            include: {
              creator: true,
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
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
              email: true,
            },
          },
        },
      },
      subtasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      timeLogs: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
      },
    },
  });

  if (!card) {
    notFound();
  }

  // Check if user has access to this card's project
  const project = card.board.project;
  const isCreator = project.createdBy === userId;
  const isMember = project.members.some((m) => m.userId === userId);
  const isAdmin = session.user.role === "ADMIN";

  if (!isCreator && !isMember && !isAdmin) {
    redirect("/projects");
  }

  // Get user's role in this project
  const userMembership = project.members.find((m) => m.userId === userId);
  const userProjectRole = isCreator
    ? "LEADER"
    : userMembership?.projectRole || null;

  return (
    <CardDetail
      card={card}
      project={project}
      userId={userId}
      userRole={userProjectRole}
      isCreator={isCreator}
    />
  );
}
