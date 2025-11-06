"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaChartBar,
  FaUsers,
  FaClock,
  FaTasks,
  FaCheckCircle,
  FaExclamationTriangle,
  FaFire,
} from "react-icons/fa";
import { Priority, Status } from "@prisma/client";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";

interface ProjectAnalyticsProps {
  project: {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    members: Array<{
      userId: number;
      projectRole: string;
      user: {
        id: number;
        name: string;
        email: string;
        globalRole: string;
      };
    }>;
    boards: Array<{
      id: number;
      name: string;
      cards: Array<{
        id: number;
        title: string;
        priority: Priority;
        status: Status;
        dueDate: Date | null;
        createdAt: Date;
        assigneeId: number | null;
        creator: {
          id: number;
          name: string;
        };
        subtasks: Array<{
          id: number;
          status: Status;
        }>;
        comments: Array<{
          id: number;
          user: {
            id: number;
            name: string;
          };
        }>;
        timeLogs: Array<{
          id: number;
          durationMinutes: number | null;
          user: {
            id: number;
            name: string;
          };
        }>;
      }>;
    }>;
  };
}

export default function ProjectAnalytics({ project }: ProjectAnalyticsProps) {
  // Calculate overall statistics
  const allCards = project.boards.flatMap((board) => board.cards);
  const totalCards = allCards.length;
  const completedCards = allCards.filter((c) => c.status === "DONE").length;
  const inProgressCards = allCards.filter(
    (c) => c.status === "IN_PROGRESS"
  ).length;
  const overallProgress =
    totalCards > 0 ? (completedCards / totalCards) * 100 : 0;

  // Calculate time statistics
  const totalTimeSpent = allCards.reduce(
    (sum, card) =>
      sum + card.timeLogs.reduce((s, log) => s + (log.durationMinutes || 0), 0),
    0
  );

  // Priority breakdown
  const highPriorityCards = allCards.filter(
    (c) => c.priority === "HIGH"
  ).length;
  const mediumPriorityCards = allCards.filter(
    (c) => c.priority === "MEDIUM"
  ).length;
  const lowPriorityCards = allCards.filter((c) => c.priority === "LOW").length;

  // Overdue tasks
  const now = new Date();
  const overdueTasks = allCards.filter(
    (c) => c.dueDate && new Date(c.dueDate) < now && c.status !== "DONE"
  );

  // Team performance
  const teamPerformance = project.members.map((member) => {
    const memberCards = allCards.filter((c) => c.assigneeId === member.userId);
    const completedByMember = memberCards.filter(
      (c) => c.status === "DONE"
    ).length;
    const totalTimeByMember = memberCards.reduce(
      (sum, card) =>
        sum +
        card.timeLogs
          .filter((log) => log.user.id === member.userId)
          .reduce((s, log) => s + (log.durationMinutes || 0), 0),
      0
    );
    const commentsCount = allCards.reduce(
      (sum, card) =>
        sum + card.comments.filter((c) => c.user.id === member.userId).length,
      0
    );

    return {
      user: member.user,
      role: member.projectRole,
      assignedCards: memberCards.length,
      completedCards: completedByMember,
      completionRate:
        memberCards.length > 0
          ? (completedByMember / memberCards.length) * 100
          : 0,
      timeSpent: totalTimeByMember,
      commentsCount,
    };
  });

  // Recent activity
  const recentCards = [...allCards]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const stats = [
    {
      title: "Total Tasks",
      value: totalCards,
      icon: FaTasks,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Completed",
      value: completedCards,
      icon: FaCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "In Progress",
      value: inProgressCards,
      icon: FaFire,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Time Spent",
      value: formatDuration(totalTimeSpent),
      icon: FaClock,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      isString: true,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaChartBar className="text-blue-600" />
            Project Analytics
          </h1>
          <p className="text-gray-500 mt-1">{project.name}</p>
        </div>
        <Link
          href={`/projects/${project.id}`}
          className="text-blue-600 hover:underline"
        >
          Back to Project
        </Link>
      </div>

      {/* Overview Stats */}
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

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Project Completion</span>
              <span className="text-sm text-gray-600">
                {completedCards} / {totalCards} tasks
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-xs text-gray-500 mt-1">
              {overallProgress.toFixed(1)}% complete
            </p>
          </div>

          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <FaExclamationTriangle className="text-red-600" />
              <span className="text-sm text-red-800">
                {overdueTasks.length} overdue task
                {overdueTasks.length > 1 ? "s" : ""} need attention
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="tasks">Task Breakdown</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Team Performance */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaUsers />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance.map((member) => (
                  <div
                    key={member.user.id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{member.user.name}</h3>
                        <p className="text-sm text-gray-500">
                          {member.user.email}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{member.role}</Badge>
                          <Badge variant="secondary">
                            {member.user.globalRole}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {member.completionRate.toFixed(0)}%
                        </div>
                        <p className="text-xs text-gray-500">completion rate</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Assigned</p>
                        <p className="text-lg font-semibold">
                          {member.assignedCards}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Completed</p>
                        <p className="text-lg font-semibold text-green-600">
                          {member.completedCards}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time Logged</p>
                        <p className="text-lg font-semibold">
                          {formatDuration(member.timeSpent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Comments</p>
                        <p className="text-lg font-semibold">
                          {member.commentsCount}
                        </p>
                      </div>
                    </div>

                    <Progress value={member.completionRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Breakdown */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">High Priority</span>
                    <Badge className="bg-red-100 text-red-800">
                      {highPriorityCards}
                    </Badge>
                  </div>
                  <Progress
                    value={
                      totalCards > 0
                        ? (highPriorityCards / totalCards) * 100
                        : 0
                    }
                    className="h-2 bg-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Medium Priority</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {mediumPriorityCards}
                    </Badge>
                  </div>
                  <Progress
                    value={
                      totalCards > 0
                        ? (mediumPriorityCards / totalCards) * 100
                        : 0
                    }
                    className="h-2 bg-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Low Priority</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {lowPriorityCards}
                    </Badge>
                  </div>
                  <Progress
                    value={
                      totalCards > 0 ? (lowPriorityCards / totalCards) * 100 : 0
                    }
                    className="h-2 bg-gray-200"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">To Do</span>
                    <Badge variant="secondary">
                      {allCards.filter((c) => c.status === "TODO").length}
                    </Badge>
                  </div>
                  <Progress
                    value={
                      totalCards > 0
                        ? (allCards.filter((c) => c.status === "TODO").length /
                            totalCards) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">In Progress</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {inProgressCards}
                    </Badge>
                  </div>
                  <Progress
                    value={
                      totalCards > 0 ? (inProgressCards / totalCards) * 100 : 0
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Review</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {allCards.filter((c) => c.status === "REVIEW").length}
                    </Badge>
                  </div>
                  <Progress
                    value={
                      totalCards > 0
                        ? (allCards.filter((c) => c.status === "REVIEW")
                            .length /
                            totalCards) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Done</span>
                    <Badge className="bg-green-100 text-green-800">
                      {completedCards}
                    </Badge>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {overdueTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <FaExclamationTriangle />
                  Overdue Tasks ({overdueTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/cards/${task.id}`}
                      className="block p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-sm text-gray-500">
                            Due: {new Date(task.dueDate!).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {task.priority}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Activity */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recently Created Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCards.map((card) => (
                  <Link
                    key={card.id}
                    href={`/cards/${card.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{card.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Created by {card.creator.name} •{" "}
                          {new Date(card.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            card.status === "DONE" ? "default" : "secondary"
                          }
                        >
                          {card.status}
                        </Badge>
                        <Badge
                          className={
                            card.priority === "HIGH"
                              ? "bg-red-100 text-red-800"
                              : card.priority === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {card.priority}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
