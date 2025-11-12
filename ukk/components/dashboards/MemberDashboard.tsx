"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/RoleBadge";
import { FaTasks, FaClock, FaComments } from "react-icons/fa";
import { formatRelativeTime } from "@/lib/utils";
import {
  DashboardUser,
  ProjectMemberWithProject,
  BoardWithCards,
  CardWithContext,
} from "@/types/dashboard";

interface MemberDashboardProps {
  user: DashboardUser;
}

export function MemberDashboard({ user }: MemberDashboardProps) {
  // Get all cards assigned to user
  const myCards: CardWithContext[] = user.projectMembers.flatMap(
    (pm: ProjectMemberWithProject) =>
      pm.project.boards.flatMap((board: BoardWithCards) =>
        board.cards.map((card) => ({
          ...card,
          projectName: pm.project.name,
          projectId: pm.project.id,
          boardName: board.name,
        }))
      )
  );

  const activeCards = myCards.filter(
    (c: CardWithContext) => c.status === "IN_PROGRESS"
  );
  const todoCards = myCards.filter((c: CardWithContext) => c.status === "TODO");
  const completedCards = myCards.filter(
    (c: CardWithContext) => c.status === "DONE"
  );

  const stats = [
    {
      title: "Active Tasks",
      value: activeCards.length,
      icon: FaTasks,
      color: "text-(--theme-primary)",
      bgColor: "bg-(--theme-primary)/10",
    },
    {
      title: "To Do",
      value: todoCards.length,
      icon: FaClock,
      color: "text-(--theme-accent)",
      bgColor: "bg-(--theme-accent)/10",
    },
    {
      title: "Completed",
      value: completedCards.length,
      icon: FaComments,
      color: "text-(--theme-success)",
      bgColor: "bg-(--theme-success)/10",
    },
  ];

  const statusColors: Record<string, string> = {
    TODO: "bg-muted text-muted-foreground",
    IN_PROGRESS: "bg-(--theme-primary)/10 text-(--theme-primary)",
    REVIEW: "bg-(--theme-secondary)/10 text-(--theme-secondary)",
    DONE: "bg-(--theme-success)/10 text-(--theme-success)",
  };

  const priorityColors: Record<string, string> = {
    LOW: "border-(--theme-primary) border-opacity-40",
    MEDIUM: "border-(--theme-warning) border-opacity-40",
    HIGH: "border-(--theme-danger) border-opacity-40",
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Track your tasks and progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* My Projects */}
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
          <CardDescription>Projects you&apos;re part of</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {user.projectMembers.map((pm: ProjectMemberWithProject) => (
              <Link key={pm.id} href={`/projects/${pm.project.id}`}>
                <div className="p-3 border rounded-lg hover:bg-muted/50 transition cursor-pointer flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{pm.project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {pm.project.boards.reduce(
                        (sum: number, b: BoardWithCards) =>
                          sum + b.cards.length,
                        0
                      )}{" "}
                      tasks
                    </p>
                  </div>
                  <RoleBadge role={pm.projectRole} size="sm" />
                </div>
              </Link>
            ))}
            {user.projectMembers.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                You&apos;re not part of any projects yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>Tasks assigned to you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myCards.slice(0, 10).map((card: CardWithContext) => (
              <Link key={card.id} href={`/cards/${card.id}`}>
                <div
                  className={`p-4 border-l-4 rounded-lg hover:bg-muted/50 transition-colors transition cursor-pointer ${
                    priorityColors[card.priority]
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {card.projectName} • {card.boardName}
                      </p>
                    </div>
                    <Badge className={statusColors[card.status]}>
                      {card.status.replace("_", " ")}
                    </Badge>
                  </div>
                  {card.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      Due: {formatRelativeTime(new Date(card.dueDate))}
                    </p>
                  )}
                </div>
              </Link>
            ))}
            {myCards.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No tasks assigned yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
