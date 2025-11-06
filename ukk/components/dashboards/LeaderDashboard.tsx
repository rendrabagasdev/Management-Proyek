"use client";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaProjectDiagram,
  FaTasks,
  FaUsers,
  FaExclamationTriangle,
  FaClock,
  FaChartBar,
  FaFire,
} from "react-icons/fa";
import {
  ProjectWithDetails,
  DashboardUser,
  BoardWithCards,
  CardBasic,
} from "@/types/dashboard";
import { formatDuration } from "@/lib/utils";

interface LeaderDashboardProps {
  projects: ProjectWithDetails[];
  user: DashboardUser;
}

export function LeaderDashboard({ projects }: LeaderDashboardProps) {
  // Calculate all cards
  const allCards = projects.flatMap((project) =>
    project.boards.flatMap((board) => board.cards)
  );

  const totalCards = allCards.length;
  const completedCards = allCards.filter((c) => c.status === "DONE").length;
  const inProgressCards = allCards.filter(
    (c) => c.status === "IN_PROGRESS"
  ).length;

  // Calculate time
  const totalTimeSpent = allCards.reduce(
    (sum, card) =>
      sum +
      (card.timeLogs?.reduce((s, log) => s + (log.durationMinutes || 0), 0) ||
        0),
    0
  );

  // Team members count
  const totalTeamMembers = projects.reduce(
    (sum, project) => sum + project.members.length,
    0
  );

  // Overdue tasks
  const now = new Date();
  const overdueTasks = allCards.filter(
    (c) => c.dueDate && new Date(c.dueDate) < now && c.status !== "DONE"
  );

  // High priority pending
  const highPriorityPending = allCards.filter(
    (c) => c.priority === "HIGH" && c.status !== "DONE"
  );

  const stats = [
    {
      title: "My Projects",
      value: projects.length,
      icon: FaProjectDiagram,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Tasks",
      value: totalCards,
      icon: FaTasks,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "In Progress",
      value: inProgressCards,
      icon: FaFire,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Team Members",
      value: totalTeamMembers,
      icon: FaUsers,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leader Dashboard</h1>
        <p className="text-gray-500">Manage your projects and team</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      {(overdueTasks.length > 0 || highPriorityPending.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueTasks.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <FaExclamationTriangle />
                  Overdue Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-red-700">
                    {overdueTasks.length}
                  </p>
                  <p className="text-sm text-red-600">
                    {overdueTasks.length === 1
                      ? "task needs immediate attention"
                      : "tasks need immediate attention"}
                  </p>
                  <div className="mt-3 space-y-1">
                    {overdueTasks.slice(0, 3).map((task) => (
                      <Link
                        key={task.id}
                        href={`/cards/${task.id}`}
                        className="block text-xs text-red-700 hover:underline"
                      >
                        • {task.title}
                      </Link>
                    ))}
                    {overdueTasks.length > 3 && (
                      <p className="text-xs text-red-600">
                        +{overdueTasks.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {highPriorityPending.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <FaFire />
                  High Priority Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-orange-700">
                    {highPriorityPending.length}
                  </p>
                  <p className="text-sm text-orange-600">
                    high priority{" "}
                    {highPriorityPending.length === 1 ? "task" : "tasks"} in
                    progress
                  </p>
                  <div className="mt-3 space-y-1">
                    {highPriorityPending.slice(0, 3).map((task) => (
                      <Link
                        key={task.id}
                        href={`/cards/${task.id}`}
                        className="block text-xs text-orange-700 hover:underline"
                      >
                        • {task.title}
                      </Link>
                    ))}
                    {highPriorityPending.length > 3 && (
                      <p className="text-xs text-orange-600">
                        +{highPriorityPending.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>Across all your projects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">
                  {totalCards > 0
                    ? Math.round((completedCards / totalCards) * 100)
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-500">
                  {completedCards}/{totalCards}
                </p>
              </div>
              <Progress
                value={totalCards > 0 ? (completedCards / totalCards) * 100 : 0}
                className="mt-2 h-2"
              />
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Time Tracked</p>
              <div className="flex items-center gap-2">
                <FaClock className="text-purple-600" />
                <p className="text-3xl font-bold">
                  {formatDuration(totalTimeSpent)}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Total time logged by team
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Active Projects</p>
              <div className="flex items-center gap-2">
                <FaChartBar className="text-blue-600" />
                <p className="text-3xl font-bold">
                  {
                    projects.filter((p) =>
                      p.boards.some((b) =>
                        b.cards.some((c) => c.status !== "DONE")
                      )
                    ).length
                  }
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Projects with pending tasks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>Projects you&apos;re managing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects.map((project) => {
                  const projectCards = project.boards.reduce(
                    (sum: number, board: BoardWithCards) =>
                      sum + board.cards.length,
                    0
                  );
                  const projectDone = project.boards.reduce(
                    (sum: number, board: BoardWithCards) =>
                      sum +
                      board.cards.filter((c: CardBasic) => c.status === "DONE")
                        .length,
                    0
                  );
                  const projectProgress =
                    projectCards > 0 ? (projectDone / projectCards) * 100 : 0;

                  return (
                    <div
                      key={project.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <Link href={`/projects/${project.id}`}>
                            <h3 className="font-semibold hover:text-blue-600 cursor-pointer">
                              {project.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-500">
                            {project.members.length} team members •{" "}
                            {projectCards} tasks
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">
                            {projectDone}/{projectCards}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/projects/${project.id}/analytics`}>
                              <FaChartBar />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <Progress value={projectProgress} className="h-1.5" />
                    </div>
                  );
                })}
                {projects.length === 0 && (
                  <div className="text-center py-12">
                    <FaProjectDiagram className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No projects yet</p>
                    <p className="text-sm text-gray-400">
                      You will see projects here once you are assigned to one
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                Latest task activity across projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {allCards
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .slice(0, 10)
                  .map((card) => (
                    <Link
                      key={card.id}
                      href={`/cards/${card.id}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">
                            {card.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Created by {card.creator.name} •{" "}
                            {new Date(card.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={
                              card.status === "DONE" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {card.status}
                          </Badge>
                          <Badge
                            className={`text-xs ${
                              card.priority === "HIGH"
                                ? "bg-red-100 text-red-800"
                                : card.priority === "MEDIUM"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {card.priority}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                {allCards.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No tasks yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
