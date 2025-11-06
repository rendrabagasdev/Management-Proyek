import { GlobalRole } from "@prisma/client";

export interface User {
  id: number;
  name: string;
  email: string;
  globalRole: GlobalRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithProjects extends User {
  projectMembers: {
    id: number;
    projectRole: string;
    project: {
      id: number;
      name: string;
    };
  }[];
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  globalRole?: GlobalRole;
};

export type UpdateUserInput = Partial<CreateUserInput> & {
  id: number;
};
