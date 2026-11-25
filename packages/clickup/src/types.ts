import type { ClientOptions, Mode, Page } from "@quvantic/mcp-core";

export type Priority = "urgent" | "high" | "normal" | "low";

export interface ClickupList {
  id: string;
  name: string;
  space: string;
  folder: string;
  taskCount: number;
}

export interface ClickupTask {
  id: string;
  listId: string;
  name: string;
  description: string;
  status: string;
  priority: Priority | null;
  assignees: string[];
  tags: string[];
  dueDate: string | null;
  url: string;
}

export interface ClickupComment {
  id: string;
  taskId: string;
  comment: string;
  user: string;
  date: string;
}

export interface ListTasks {
  listId: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

export interface TaskWrite {
  name?: string;
  description?: string;
  status?: string;
  priority?: Priority;
  assignees?: string[];
  tags?: string[];
  dueDate?: string;
}

export interface CreateTask extends TaskWrite {
  listId: string;
  name: string;
}

export interface ClickupClient {
  readonly mode: Mode;
  readonly readOnly: boolean;
  listLists(): Promise<ClickupList[]>;
  getList(listId: string): Promise<ClickupList>;
  listTasks(input: ListTasks): Promise<Page<ClickupTask>>;
  getTask(taskId: string): Promise<ClickupTask>;
  createTask(input: CreateTask): Promise<ClickupTask>;
  updateTask(taskId: string, patch: TaskWrite): Promise<ClickupTask>;
  listComments(taskId: string): Promise<ClickupComment[]>;
  createComment(taskId: string, comment: string): Promise<ClickupComment>;
}

export interface ClickupOptions extends ClientOptions {
  teamId?: string;
  spaceId?: string;
}
