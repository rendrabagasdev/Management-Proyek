"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FaUsers,
  FaTasks,
  FaProjectDiagram,
  FaChartLine,
  FaUserCog,
} from "react-icons/fa";
import {
  ProjectWithDetails,
  SimpleUser,
  BoardWithCards,
  CardBasic,
} from "@/types/dashboard";

interface AdminDashboardProps {
  projects: ProjectWithDetails[];
  users: SimpleUser[];
}

export function AdminDashboard({ projects, users }: AdminDashboardProps) {
  const totalCards = projects.reduce(
    (acc, project) =>
      acc +
      project.boards.reduce(
        (sum: number, board: BoardWithCards) => sum + board.cards.length,
        0
      ),
    0
  );

  const completedCards = projects.reduce(
    (acc, project) =>
      acc +
      project.boards.reduce(
        (sum: number, board: BoardWithCards) =>
          sum +
          board.cards.filter((card: CardBasic) => card.status === "DONE")
            .length,
        0
      ),
    0
  );

  const progressPercentage =
    totalCards > 0 ? (completedCards / totalCards) * 100 : 0;

  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: FaUsers,
      color: "text-(--theme-primary)",
      bgColor: "bg-(--theme-primary)/10",
    },
    {
      title: "Active Projects",
      value: projects.length,
      icon: FaProjectDiagram,
      color: "text-(--theme-success)",
      bgColor: "bg-(--theme-success)/10",
    },
    {
      title: "Total Tasks",
      value: totalCards,
      icon: FaTasks,
      color: "text-(--theme-secondary)",
      bgColor: "bg-(--theme-secondary)/10",
    },
    {
      title: "Completed",
      value: completedCards,
      icon: FaChartLine,
      color: "text-(--theme-accent)",
      bgColor: "bg-(--theme-accent)/10",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            System overview and statistics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Link href="/admin">
              <FaChartLine className="mr-2" />
              Full Admin Panel
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
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
          <CardDescription>System-wide task completion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completed: {completedCards}</span>
            <span>Total: {totalCards}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-sm text-muted-foreground text-right">
            {progressPercentage.toFixed(1)}% Complete
          </p>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>
            Overview of all projects in the system
          </CardDescription>
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
                  className="p-4 border rounded-lg hover:bg-muted/50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        by {project.creator.name} • {project.members.length}{" "}
                        members
                      </p>
                    </div>
                    <Badge variant="outline">
                      {projectDone}/{projectCards} tasks
                    </Badge>
                  </div>
                  <Progress value={projectProgress} className="h-1.5" />
                </div>
              );
            })}
            {projects.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No projects yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
