import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaArrowLeft } from "react-icons/fa";
import UserManagement from "@/components/admin/UserManagement";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Only ADMIN can access
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all users with their project memberships
  const users = await prisma.user.findMany({
    include: {
      projectMembers: {
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      createdProjects: {
        select: {
          id: true,
          name: true,
        },
      },
      createdCards: {
        select: {
          id: true,
        },
      },
      comments: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage all users in the system
          </p>
        </div>
      </div>

      <UserManagement users={users} />
    </div>
  );
}
