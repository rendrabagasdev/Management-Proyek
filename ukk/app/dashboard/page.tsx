import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { LeaderDashboard } from "@/components/dashboards/LeaderDashboard";
import { MemberDashboard } from "@/components/dashboards/MemberDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id);
  const userRole = session.user.role;

  // Fetch user data with projects
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      projectMembers: {
        include: {
          project: {
            include: {
              boards: {
                include: {
                  cards: {
                    where: {
                      OR: [{ createdBy: userId }, { assigneeId: userId }],
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

  if (!user) {
    redirect("/login");
  }

  // Render different dashboard based on role
  if (userRole === "ADMIN") {
    const allProjects = await prisma.project.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: true,
        boards: {
          include: {
            cards: true,
          },
        },
      },
    });

    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
      },
    });

    return <AdminDashboard projects={allProjects} users={allUsers} />;
  }

  if (userRole === "LEADER") {
    const leaderProjects = await prisma.project.findMany({
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
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, globalRole: true },
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
                  select: {
                    id: true,
                    durationMinutes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return <LeaderDashboard projects={leaderProjects} user={user} />;
  }

  // Member (Developer/Designer)
  return <MemberDashboard user={user} />;
}
