import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProjectCompletionApproval from "@/components/projects/ProjectApprovel";

export const metadata = {
  title: "Project Approvals | Project Management",
  description: "Approve or reject completed projects",
};

export default async function ProjectApprovalsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user is admin
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <ProjectCompletionApproval />
    </div>
  );
}
