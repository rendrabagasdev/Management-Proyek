import { Priority, Status } from "@prisma/client";

export interface Card {
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
}

export interface CardWithDetails extends Card {
  board: {
    id: number;
    name: string;
    projectId: number;
  };
  creator: {
    id: number;
    name: string;
  };
  subtasks: Subtask[];
  comments: Comment[];
  timeLogs: TimeLog[];
}

export interface Subtask {
  id: number;
  cardId: number;
  title: string;
  status: Status;
  assigneeId: number | null;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  assignee?: {
    id: number;
    name: string;
  } | null;
}

export interface Comment {
  id: number;
  cardId: number;
  userId: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    name: string;
  };
}

export interface TimeLog {
  id: number;
  cardId: number;
  userId: number;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: Date;
  user: {
    id: number;
    name: string;
  };
}

export type CreateCardInput = {
  boardId: number;
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
  createdBy: number;
  assigneeId?: number;
};

export type UpdateCardInput = Partial<CreateCardInput> & {
  id: number;
  status?: Status;
  approvedBy?: number;
};

export type CreateSubtaskInput = {
  cardId: number;
  title: string;
  assigneeId?: number;
};

export type CreateCommentInput = {
  cardId: number;
  userId: number;
  text: string;
};

export type StartTimeLogInput = {
  cardId: number;
  userId: number;
  notes?: string;
};

export type StopTimeLogInput = {
  id: number;
  endTime: Date;
  notes?: string;
};

export interface Board {
  id: number;
  projectId: number;
  name: string;
  position: number;
  createdAt: Date;
}

export interface BoardWithCards extends Board {
  cards: Card[];
}
