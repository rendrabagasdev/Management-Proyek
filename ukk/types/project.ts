import { ProjectRole } from "@prisma/client";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
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
