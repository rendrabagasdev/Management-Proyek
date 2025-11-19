import { ProjectRole } from "@prisma/client";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED";
  isCompleted: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  completedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface ProjectWithMembers extends Project {
  creator: {
    id: number;
    name: string;
    email: string;
  };
  members: {
    id: number;
    projectRole: ProjectRole;
    user: {
      id: number;
      name: string;
      email: string;
      globalRole: string;
    };
  }[];
  boards: {
    id: number;
    name: string;
    position: number;
  }[];
}

export interface ProjectWithStats extends ProjectWithMembers {
  totalTasks: number;
  completedTasks: number;
}

export type CreateProjectInput = {
  name: string;
  description?: string;
  createdBy: number;
};

export type UpdateProjectInput = Partial<CreateProjectInput> & {
  id: number;
};

export type AddProjectMemberInput = {
  projectId: number;
  userId: number;
  projectRole: ProjectRole;
};
