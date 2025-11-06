import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProjectSettings from "@/components/projects/ProjectSettings";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const projectId = parseInt(id);
  const userId = parseInt(session.user.id);

  // Fetch project with all details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          globalRole: true,
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
        orderBy: {
          joinedAt: "asc",
        },
      },
      boards: {
        include: {
          cards: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Check if user has permission to access settings
  const userMember = project.members.find((m) => m.userId === userId);
  const isCreator = project.createdBy === userId;
  const isAdmin = session.user.role === "ADMIN";
  const isProjectLeader = userMember?.projectRole === "LEADER";

  // Only creator, admin, or project leader can access settings
  if (!isCreator && !isAdmin && !isProjectLeader) {
    redirect(`/projects/${projectId}`);
  }

  // Fetch all users for adding new members
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      globalRole: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <ProjectSettings
      project={project}
      currentUserId={userId}
      isAdmin={isAdmin}
      isCreator={isCreator}
      allUsers={allUsers}
    />
  );
}
