import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import AssignmentHistory from "@/components/projects/AssignmentHistory";

interface AssignmentHistoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AssignmentHistoryPage({
  params,
}: AssignmentHistoryPageProps) {
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

  // Fetch project to verify access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Check if user has access (Admin, Leader, or project member)
  const isCreator = project.createdBy === userId;
  const isLeader = project.members.some(
    (m) => m.userId === userId && m.projectRole === "LEADER"
  );
  const isAdmin = session.user.role === "ADMIN";
  const isMember = project.members.some((m) => m.userId === userId);

  if (!isCreator && !isLeader && !isAdmin && !isMember) {
    redirect(`/projects/${projectId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <AssignmentHistory projectId={projectId} />
      </div>
    </div>
  );
}
