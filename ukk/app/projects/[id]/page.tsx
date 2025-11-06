import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import KanbanBoard from "@/components/projects/KanbanBoard";
import ProjectHeader from "@/components/projects/ProjectHeader";

interface ProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
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

  // Fetch project with all details
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
                select: {
                  id: true,
                },
              },
              timeLogs: {
                select: {
                  id: true,
                  durationMinutes: true,
                },
              },
            },
            orderBy: {
              position: "asc",
            },
          },
        },
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!project) {
    console.log("Project not found with ID:", projectId);
    notFound();
  }

  // Check if user has access to this project
  const isMember = project.members.some((m) => m.userId === userId);
  const isAdmin = session.user.role === "ADMIN";

  if (!isMember && !isAdmin) {
    redirect("/projects");
  }

  // Get user's role in this project
  const userMembership = project.members.find((m) => m.userId === userId);
  const userProjectRole = userMembership?.projectRole || null;

  // Admin always has creator privileges
  const isCreator = isAdmin;

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectHeader
        project={project}
        userRole={userProjectRole}
        isCreator={isCreator}
        isAdmin={isAdmin}
      />
      <KanbanBoard
        project={project}
        userId={userId}
        userRole={userProjectRole}
        isCreator={isCreator}
      />
    </div>
  );
}
