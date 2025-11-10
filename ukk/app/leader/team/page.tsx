import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import TeamManagement from "@/components/leader/TeamManagement";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Only LEADER can access
  if (session.user.role !== "LEADER") {
    redirect("/dashboard");
  }

  const userId = parseInt(session.user.id);

  // Get all projects where user is LEADER
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { createdBy: userId },
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
      boards: {
        include: {
          cards: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
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
              },
              comments: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
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

  return (
    <div className="min-h-screen bg-background">
      <TeamManagement projects={projects} />
    </div>
  );
}
