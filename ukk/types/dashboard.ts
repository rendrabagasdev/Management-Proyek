import { GlobalRole, ProjectRole, Priority, Status } from "@prisma/client";

// User types for dashboard
export interface DashboardUser {
  id: number;
  name: string;
  email: string;
  globalRole: GlobalRole;
  projectMembers: ProjectMemberWithProject[];
}

// Project with relations
export interface ProjectWithDetails {
  id: number;
  name: string;
  description: string | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: number;
    name: string;
    email: string;
  };
  members: ProjectMemberBasic[];
  boards: BoardWithCards[];
}

// Project member with project
export interface ProjectMemberWithProject {
  id: number;
  projectId: number;
  userId: number;
  projectRole: ProjectRole;
  joinedAt: Date;
  project: {
    id: number;
    name: string;
    description: string | null;
    boards: BoardWithCards[];
  };
}

// Basic project member
export interface ProjectMemberBasic {
  id: number;
  projectId: number;
  userId: number;
  projectRole: ProjectRole;
  joinedAt: Date;
}

// Board with cards
export interface BoardWithCards {
  id: number;
  projectId: number;
  name: string;
  position: number;
  createdAt: Date;
  cards: CardBasic[];
}

// Basic card info
export interface CardBasic {
  id: number;
  boardId: number;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  dueDate: Date | null;
  createdBy: number;
  assigneeId: number | null;
  approvedBy: number | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  creator: {
    id: number;
    name: string;
  };
  timeLogs?: Array<{
    id: number;
    durationMinutes: number | null;
  }>;
}

// Card with project context (for member dashboard)
export interface CardWithContext extends CardBasic {
  projectName: string;
  projectId: number;
  boardName: string;
}

// Simple user for admin dashboard
export interface SimpleUser {
  id: number;
  name: string;
  email: string;
  globalRole: GlobalRole;
}
