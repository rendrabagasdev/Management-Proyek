"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FaArrowLeft,
  FaUsers,
  FaCog,
  FaChartBar,
  FaHistory,
  FaTrophy,
} from "react-icons/fa";
import { ProjectRole } from "@prisma/client";

interface ProjectHeaderProps {
  project: {
    id: number;
    name: string;
    description: string | null;
    isCompleted: boolean;
    completedAt: Date | null;
    creator: {
      id: number;
      name: string;
      email: string;
    };
    members: Array<{
      id: number;
      projectRole: ProjectRole;
      user: {
        id: number;
        name: string;
        email: string;
      };
    }>;
  };
  userRole: ProjectRole | "LEADER" | null;
  isCreator: boolean;
  isAdmin: boolean;
}

export default function ProjectHeader({
  project,
  userRole,
  isCreator,
  isAdmin,
}: ProjectHeaderProps) {
  const canManage = isCreator || isAdmin || userRole === "LEADER";

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto p-6">
        <div className="mb-4">
          <Button variant="outline" asChild size="sm">
            <Link href="/projects">
              <FaArrowLeft className="mr-2" />
              Back to Projects
            </Link>
          </Button>
        </div>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              {project.isCompleted && (
                <Badge
                  variant="outline"
                  className="bg-(--theme-primary)/10 text-(--theme-primary-dark) border-(--theme-primary)"
                >
                  ✓ Completed
                </Badge>
              )}
              {isCreator && (
                <Badge className="bg-(--theme-primary)">Owner</Badge>
              )}
              {!isCreator && userRole && (
                <Badge variant="outline">{userRole}</Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-4">
              {project.description || "No description provided"}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FaUsers />
                <span>{project.members.length} team members</span>
              </div>
              <span>•</span>
              <span>Created by {project.creator.name}</span>
              {project.isCompleted && project.completedAt && (
                <>
                  <span>•</span>
                  <span className="text-(--theme-primary)">
                    Completed on{" "}
                    {new Date(project.completedAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>

          {canManage && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/projects/${project.id}/analytics`}>
                  <FaChartBar className="mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/projects/${project.id}/assignment-history`}>
                  <FaHistory className="mr-2" />
                  History
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/projects/${project.id}/top-performers`}>
                  <FaTrophy className="mr-2" />
                  Leaderboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/projects/${project.id}/settings`}>
                  <FaCog className="mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
