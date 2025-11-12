import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FaPlus, FaUsers, FaTasks } from "react-icons/fa";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id);
  const userRole = session.user.role;

  // Fetch projects based on user role
  const projects =
    userRole === "ADMIN"
      ? await prisma.project.findMany({
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
                  },
                },
              },
            },
            boards: {
              include: {
                cards: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : await prisma.project.findMany({
          where: {
            OR: [
              { createdBy: userId },
              {
                members: {
                  some: {
                    userId,
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
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            boards: {
              include: {
                cards: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

  // Check if user can create projects (Only Admin)
  const canCreateProject = userRole === "ADMIN";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            {userRole === "ADMIN"
              ? "All projects in the system"
              : "Your projects and collaborations"}
          </p>
        </div>
        {canCreateProject && (
          <Button asChild>
            <Link href="/projects/new">
              <FaPlus className="mr-2" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const totalCards = project.boards.reduce(
              (sum, board) => sum + board.cards.length,
              0
            );
            const completedCards = project.boards.reduce(
              (sum, board) =>
                sum +
                board.cards.filter((card) => card.status === "DONE").length,
              0
            );
            const progress =
              totalCards > 0 ? (completedCards / totalCards) * 100 : 0;

            // Check if current user is project member
            const userMembership = project.members.find(
              (m) => m.userId === userId
            );
            const isCreator = project.createdBy === userId;

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card
                  className={`hover:shadow-lg transition-shadow cursor-pointer h-full ${
                    project.isCompleted
                      ? "border-(--theme-primary)er-opacity-40 bg-(--theme-primary) bg-opacity-5"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <div className="flex gap-1">
                        {project.isCompleted && (
                          <Badge
                            variant="outline"
                            className="bg-(--theme-primary)pacity-10 text-(--theme-primary) border-(--theme-primary) border-opacity-30"
                          >
                            Completed
                          </Badge>
                        )}
                        {isCreator && (
                          <Badge
                            variant="default"
                            className="bg-(--theme-primary)"
                          >
                            Owner
                          </Badge>
                        )}
                        {!isCreator && userMembership && (
                          <Badge variant="outline">
                            {userMembership.projectRole}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-1 text-foreground/70">
                        <FaUsers className="w-4 h-4" />
                        <span>{project.members.length} members</span>
                      </div>
                      <div className="flex items-center gap-1 text-foreground/70">
                        <FaTasks className="w-4 h-4" />
                        <span>
                          {completedCards}/{totalCards} tasks
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Creator Info */}
                    <div className="text-xs text-muted-foreground">
                      Created by {project.creator.name}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FaTasks className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-foreground/80 mb-2">
              No projects yet
            </h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              {canCreateProject
                ? "Create your first project to get started with task management and collaboration."
                : "You haven't been added to any projects yet. Contact your project leader or admin."}
            </p>
            {canCreateProject && (
              <Button asChild>
                <Link href="/projects/new">
                  <FaPlus className="mr-2" />
                  Create First Project
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
