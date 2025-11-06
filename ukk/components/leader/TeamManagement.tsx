"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FaUsers,
  FaTasks,
  FaClock,
  FaComment,
  FaProjectDiagram,
  FaStar,
} from "react-icons/fa";
import { GlobalRole, Priority, ProjectRole, Status } from "@prisma/client";
import { formatDuration } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamMember {
  userId: number;
  projectRole: ProjectRole;
  user: {
    id: number;
    name: string;
    email: string;
    globalRole: GlobalRole;
  };
}

interface CardType {
  id: number;
  title: string;
  status: Status;
  priority: Priority;
  dueDate: Date | null;
  createdAt: Date;
  assigneeId: number | null;
  creator: {
    id: number;
    name: string;
  };
  timeLogs: Array<{
    id: number;
    durationMinutes: number | null;
    user: {
      id: number;
      name: string;
    };
  }>;
  comments: Array<{
    id: number;
    user: {
      id: number;
      name: string;
    };
  }>;
}

interface Project {
  id: number;
  name: string;
  members: TeamMember[];
  boards: Array<{
    id: number;
    cards: CardType[];
  }>;
}

interface TeamManagementProps {
  projects: Project[];
}

export default function TeamManagement({ projects }: TeamManagementProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | "all">(
    "all"
  );

  // Aggregate team data
  const allMembers = new Map<number, TeamMember>();
  projects.forEach((project) => {
    project.members.forEach((member) => {
      if (!allMembers.has(member.userId)) {
        allMembers.set(member.userId, member);
      }
    });
  });

  const filteredProjects =
    selectedProjectId === "all"
      ? projects
      : projects.filter((p) => p.id === selectedProjectId);

  // Calculate team stats
  const teamStats = Array.from(allMembers.values()).map((member) => {
    const memberProjects = projects.filter((p) =>
      p.members.some((m) => m.userId === member.userId)
    );

    const allCards = memberProjects.flatMap((p) =>
      p.boards.flatMap((b) => b.cards)
    );

    const assignedCards = allCards.filter(
      (c) => c.assigneeId === member.userId
    );
    const createdCards = allCards.filter((c) => c.creator.id === member.userId);
    const completedCards = assignedCards.filter(
      (c) => c.status === "DONE"
    ).length;

    const totalTime = allCards.reduce(
      (sum, card) =>
        sum +
        card.timeLogs
          .filter((log) => log.user.id === member.userId)
          .reduce((s, log) => s + (log.durationMinutes || 0), 0),
      0
    );

    const totalComments = allCards.reduce(
      (sum, card) =>
        sum + card.comments.filter((c) => c.user.id === member.userId).length,
      0
    );

    const overdueTasks = assignedCards.filter(
      (c) =>
        c.dueDate && new Date(c.dueDate) < new Date() && c.status !== "DONE"
    ).length;

    const highPriorityPending = assignedCards.filter(
      (c) => c.priority === "HIGH" && c.status !== "DONE"
    ).length;

    return {
      user: member.user,
      projectRole: member.projectRole,
      projectsCount: memberProjects.length,
      assignedCards: assignedCards.length,
      createdCards: createdCards.length,
      completedCards,
      completionRate:
        assignedCards.length > 0
          ? (completedCards / assignedCards.length) * 100
          : 0,
      totalTime,
      totalComments,
      overdueTasks,
      highPriorityPending,
    };
  });

  // Sort by completion rate
  const topPerformers = [...teamStats]
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 5);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FaUsers className="text-blue-600" />
            Team Management
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage your team performance
          </p>
        </div>

        <Select
          value={selectedProjectId.toString()}
          onValueChange={(value) =>
            setSelectedProjectId(value === "all" ? "all" : parseInt(value))
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Team Members
            </CardTitle>
            <FaUsers className="text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Projects
            </CardTitle>
            <FaProjectDiagram className="text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tasks
            </CardTitle>
            <FaTasks className="text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamStats.reduce((sum, m) => sum + m.assignedCards, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Time Tracked
            </CardTitle>
            <FaClock className="text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(
                teamStats.reduce((sum, m) => sum + m.totalTime, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaStar className="text-yellow-500" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((member, index) => (
                  <div
                    key={member.user.id}
                    className="flex items-center gap-4 p-3 border rounded-lg"
                  >
                    <div className="text-2xl font-bold text-gray-300 w-8">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{member.user.name}</h3>
                      <p className="text-sm text-gray-500">
                        {member.user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {member.completionRate.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.completedCards}/{member.assignedCards} completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>All Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamStats.map((member) => (
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
                          <Badge variant="secondary">
                            {member.user.globalRole}
                          </Badge>
                          <Badge variant="outline">
                            {member.projectsCount} projects
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {member.completionRate.toFixed(0)}%
                        </div>
                        <p className="text-xs text-gray-500">completion</p>
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
                          {formatDuration(member.totalTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Comments</p>
                        <p className="text-lg font-semibold">
                          {member.totalComments}
                        </p>
                      </div>
                    </div>

                    {(member.overdueTasks > 0 ||
                      member.highPriorityPending > 0) && (
                      <div className="flex gap-2 pt-2 border-t">
                        {member.overdueTasks > 0 && (
                          <Badge className="bg-red-100 text-red-800">
                            {member.overdueTasks} overdue
                          </Badge>
                        )}
                        {member.highPriorityPending > 0 && (
                          <Badge className="bg-orange-100 text-orange-800">
                            {member.highPriorityPending} high priority
                          </Badge>
                        )}
                      </div>
                    )}

                    <Progress value={member.completionRate} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time Tracking Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaClock className="text-purple-600" />
                  Time Tracking Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...teamStats]
                    .sort((a, b) => b.totalTime - a.totalTime)
                    .slice(0, 10)
                    .map((member, index) => (
                      <div
                        key={member.user.id}
                        className="flex justify-between items-center p-2 border-b"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {index + 1}.
                          </span>
                          <span className="font-medium">
                            {member.user.name}
                          </span>
                        </div>
                        <span className="font-semibold text-purple-600">
                          {formatDuration(member.totalTime)}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaComment className="text-blue-600" />
                  Most Active Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...teamStats]
                    .sort((a, b) => b.totalComments - a.totalComments)
                    .slice(0, 10)
                    .map((member, index) => (
                      <div
                        key={member.user.id}
                        className="flex justify-between items-center p-2 border-b"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {index + 1}.
                          </span>
                          <span className="font-medium">
                            {member.user.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {member.totalComments} comments
                          </Badge>
                          <Badge variant="outline">
                            {member.createdCards} cards
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamStats
                  .sort((a, b) => b.assignedCards - a.assignedCards)
                  .map((member) => {
                    const maxCards = Math.max(
                      ...teamStats.map((m) => m.assignedCards)
                    );
                    const workloadPercentage =
                      maxCards > 0
                        ? (member.assignedCards / maxCards) * 100
                        : 0;

                    return (
                      <div key={member.user.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">
                              {member.user.name}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({member.user.globalRole})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {member.assignedCards} tasks
                            </span>
                            {member.overdueTasks > 0 && (
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                {member.overdueTasks} overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Progress value={workloadPercentage} className="h-2" />
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>
                            In Progress:{" "}
                            {
                              filteredProjects
                                .flatMap((p) =>
                                  p.boards.flatMap((b) => b.cards)
                                )
                                .filter(
                                  (c) =>
                                    c.assigneeId === member.user.id &&
                                    c.status === "IN_PROGRESS"
                                ).length
                            }
                          </span>
                          <span>•</span>
                          <span>Completed: {member.completedCards}</span>
                          {member.highPriorityPending > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600">
                                {member.highPriorityPending} high priority
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}/analytics`}
                className="p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold mb-1">{project.name}</h3>
                <p className="text-sm text-gray-500">
                  {project.members.length} members • View analytics
                </p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
