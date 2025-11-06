import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProjectAnalytics from "@/components/projects/ProjectAnalytics";

interface AnalyticsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id);
  const { id } = await params;
  const projectId = parseInt(id);

  if (isNaN(projectId)) {
    notFound();
  }

  // Fetch project with analytics data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
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
              subtasks: true,
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
            },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Check if user is LEADER
  const isCreator = project.createdBy === userId;
  const isLeader = project.members.some(
    (m) => m.userId === userId && m.projectRole === "LEADER"
  );
  const isAdmin = session.user.role === "ADMIN";

  if (!isCreator && !isLeader && !isAdmin) {
    redirect(`/projects/${projectId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectAnalytics project={project} />
    </div>
  );
}
