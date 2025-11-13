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
import {
  FaUsers,
  FaProjectDiagram,
  FaTasks,
  FaComments,
  FaClock,
  FaChartLine,
  FaUserCog,
  FaCog,
} from "react-icons/fa";
import { ExportData } from "@/components/admin/ExportData";
import { SystemActivity } from "@/components/admin/SystemActivity";

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Only ADMIN can access
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Calculate date ranges
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch comprehensive statistics
  const [
    totalUsers,
    totalProjects,
    completedProjects,
    activeProjects,
    totalCards,
    totalComments,
    totalTimeLogs,
    recentUsers,
    recentProjects,
    recentlyCompletedProjects,
    recentCards,
    activeUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.project.count({
      where: { isCompleted: true },
    }),
    prisma.project.count({
      where: { isCompleted: false },
    }),
    prisma.card.count(),
    prisma.comment.count(),
    prisma.timeLog.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
        createdAt: true,
      },
    }),
    prisma.project.findMany({
      where: { isCompleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        creator: {
          select: { name: true },
        },
        members: true,
      },
    }),
    prisma.project.findMany({
      where: { isCompleted: true },
      orderBy: { completedAt: "desc" },
      take: 5,
      include: {
        creator: {
          select: { name: true },
        },
        members: true,
      },
    }),
    prisma.card.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        creator: {
          select: { id: true, name: true },
        },
        board: {
          select: {
            id: true,
            name: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        timeLogs: {
          some: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        globalRole: true,
        timeLogs: {
          where: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        timeLogs: {
          _count: "desc",
        },
      },
      take: 5,
    }),
  ]);

  // Calculate statistics by role
  const usersByRole = await prisma.user.groupBy({
    by: ["globalRole"],
    _count: true,
  });

  const roleStats = {
    ADMIN: usersByRole.find((r) => r.globalRole === "ADMIN")?._count || 0,
    LEADER: usersByRole.find((r) => r.globalRole === "LEADER")?._count || 0,
    MEMBER: usersByRole.find((r) => r.globalRole === "MEMBER")?._count || 0,
  };

  // Card status statistics
  const cardsByStatus = await prisma.card.groupBy({
    by: ["status"],
    _count: true,
  });

  const statusStats = {
    TODO: cardsByStatus.find((s) => s.status === "TODO")?._count || 0,
    IN_PROGRESS:
      cardsByStatus.find((s) => s.status === "IN_PROGRESS")?._count || 0,
    REVIEW: cardsByStatus.find((s) => s.status === "REVIEW")?._count || 0,
    DONE: cardsByStatus.find((s) => s.status === "DONE")?._count || 0,
  };

  const completionRate =
    totalCards > 0 ? ((statusStats.DONE / totalCards) * 100).toFixed(1) : "0";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Admin Panel</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            System overview and management tools
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Link href="/admin/settings">
              <FaCog className="mr-2" />
              Settings
            </Link>
          </Button>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/admin/users">
              <FaUserCog className="mr-2" />
              Manage Users
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Users</CardDescription>
              <FaUsers className="w-4 h-4 text-(--theme-primary)" />
            </div>
            <CardTitle className="text-3xl">{totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {roleStats.ADMIN} Admin • {roleStats.LEADER} Leader •{" "}
              {roleStats.MEMBER} Member
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Projects</CardDescription>
              <FaProjectDiagram className="w-4 h-4 text-(--theme-success)" />
            </div>
            <CardTitle className="text-3xl">{totalProjects}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {activeProjects} active • {completedProjects} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Tasks</CardDescription>
              <FaTasks className="w-4 h-4 text-(--theme-secondary)" />
            </div>
            <CardTitle className="text-3xl">{totalCards}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {statusStats.DONE} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Comments</CardDescription>
              <FaComments className="w-4 h-4 text-(--theme-accent)" />
            </div>
            <CardTitle className="text-3xl">{totalComments}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Total discussions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Time Logs</CardDescription>
              <FaClock className="w-4 h-4 text-(--theme-info)" />
            </div>
            <CardTitle className="text-3xl">{totalTimeLogs}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Total entries</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Task Status Distribution</CardTitle>
          <CardDescription>Overview of all tasks by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">To Do</Badge>
                <span className="text-sm text-muted-foreground">
                  {statusStats.TODO} tasks
                </span>
              </div>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-muted-foreground/60"
                  style={{
                    width: `${
                      totalCards > 0 ? (statusStats.TODO / totalCards) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-(--theme-primary)/10 text-(--theme-primary)"
                >
                  In Progress
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {statusStats.IN_PROGRESS} tasks
                </span>
              </div>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-(--theme-primary)"
                  style={{
                    width: `${
                      totalCards > 0
                        ? (statusStats.IN_PROGRESS / totalCards) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-(--theme-warning)/10 text-(--theme-warning)"
                >
                  Review
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {statusStats.REVIEW} tasks
                </span>
              </div>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-(--theme-warning)"
                  style={{
                    width: `${
                      totalCards > 0
                        ? (statusStats.REVIEW / totalCards) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-(--theme-success)/10 text-(--theme-success)"
                >
                  Done
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {statusStats.DONE} tasks
                </span>
              </div>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-(--theme-success)"
                  style={{
                    width: `${
                      totalCards > 0 ? (statusStats.DONE / totalCards) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-2xl font-bold text-(--theme-success)">
                  {completionRate}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={
                        user.globalRole === "ADMIN"
                          ? "bg-(--theme-danger)/10 text-(--theme-danger)"
                          : user.globalRole === "LEADER"
                          ? "bg-(--theme-secondary)/10 text-(--theme-secondary)"
                          : "bg-(--theme-primary)/10 text-(--theme-primary)"
                      }
                    >
                      {user.globalRole}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No users yet
                </p>
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/users">View All Users</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Latest active projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-3 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        by {project.creator.name}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-(--theme-success)pacity-10 text-(--theme-success)"
                    >
                      {project.members.length} members
                    </Badge>
                  </div>
                </Link>
              ))}
              {recentProjects.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No active projects
                </p>
              )}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/projects">View All Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Completed Projects */}
      {completedProjects > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaProjectDiagram className="w-5 h-5 text-(--theme-primary)" />
              Recently Completed Projects
            </CardTitle>
            <CardDescription>
              Projects that have been marked as completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentlyCompletedProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-3 border border-(--theme-primary) border-opacity-30 rounded-lg hover:bg-(--theme-primary)/10  transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{project.name}</p>
                        <Badge
                          variant="outline"
                          className="bg-(--theme-primary)/10 text-(--theme-primary)"
                        >
                          Completed
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        by {project.creator.name} • {project.members.length}{" "}
                        members
                      </p>
                      {project.completedAt && (
                        <p className="text-xs text-(--theme-primary) mt-1">
                          Completed on{" "}
                          {new Date(project.completedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-sm text-center text-muted-foreground">
              Total {completedProjects} completed{" "}
              {completedProjects === 1 ? "project" : "projects"}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaTasks className="w-5 h-5" />
            Recent Tasks
          </CardTitle>
          <CardDescription>
            Latest task activity across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentCards.map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="block p-3 border rounded-lg hover:bg-muted/50 transition"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {card.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-muted-foreground mt-1">
                      <span className="truncate max-w-[200px]">
                        {card.board.project.name}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">
                        {card.board.name}
                      </span>
                      <span className="hidden md:inline">•</span>
                      <span className="hidden md:inline">
                        by {card.creator.name}
                      </span>
                      <span className="sm:hidden md:inline">•</span>
                      <span className="text-[10px] sm:text-xs">
                        {new Date(card.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 shrink-0">
                    <Badge
                      variant={card.status === "DONE" ? "default" : "secondary"}
                      className={`text-[10px] sm:text-xs ${
                        card.status === "TODO"
                          ? "bg-muted text-muted-foreground"
                          : card.status === "IN_PROGRESS"
                          ? "bg-(--theme-primary)/10 text-(--theme-primary)"
                          : card.status === "REVIEW"
                          ? "bg-(--theme-warning)/10 text-(--theme-warning)"
                          : "bg-(--theme-success)/10 text-(--theme-success)"
                      }`}
                    >
                      {card.status.replace("_", " ")}
                    </Badge>
                    <Badge
                      className={`text-[10px] sm:text-xs ${
                        card.priority === "HIGH"
                          ? "bg-(--theme-danger)/10 text-(--theme-danger) border-(--theme-danger) border-opacity-30"
                          : card.priority === "MEDIUM"
                          ? "bg-(--theme-warning)/10 text-(--theme-warning) border-(--theme-warning) border-opacity-30"
                          : "bg-(--theme-primary)/10 text-(--theme-primary) border-(--theme-primary) border-opacity-30"
                      }`}
                      variant="outline"
                    >
                      {card.priority}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
            {recentCards.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No tasks yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Activity */}
      <SystemActivity />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaChartLine className="w-5 h-5" />
              Most Active Users (Last 7 Days)
            </CardTitle>
            <CardDescription>Based on time log entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-(--theme-primary)/10 flex items-center justify-center font-bold text-(--theme-primary)">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {user.globalRole}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{user.timeLogs.length}</p>
                    <p className="text-xs text-muted-foreground">time logs</p>
                  </div>
                </div>
              ))}
              {activeUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No activity in the last 7 days
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Data */}
        <ExportData />
      </div>
    </div>
  );
}
