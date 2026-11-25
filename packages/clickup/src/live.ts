import {
  assertWritable,
  ConnectorError,
  clampLimit,
  optionalEnv,
  type Page,
  requestJson,
  requiredString,
  resolveToken,
  resolveUrl,
  tokenHeaders,
} from "@quvantic/mcp-core";
import type {
  ClickupClient,
  ClickupComment,
  ClickupList,
  ClickupOptions,
  ClickupTask,
  CreateTask,
  ListTasks,
  Priority,
  TaskWrite,
} from "./types.js";
import {
  assertTaskPatch,
  dueDateOf,
  dueMillis,
  PRIORITY_ID,
  priorityOf,
  stringList,
} from "./validate.js";

interface ApiList {
  id: string;
  name?: string;
  task_count?: number | string | null;
  space?: { name?: string };
  folder?: { name?: string };
}

interface ApiTask {
  id: string;
  name?: string;
  description?: string;
  status?: { status?: string };
  priority?: { priority?: string } | null;
  assignees?: { username?: string }[];
  tags?: { name?: string }[];
  due_date?: string | null;
  list?: { id?: string };
  url?: string;
}

interface ApiComment {
  id: string;
  comment_text?: string;
  user?: { username?: string };
  date?: string | number;
}

function asPriority(value: string | undefined): Priority | null {
  if (value === "urgent" || value === "high" || value === "normal" || value === "low") return value;
  return null;
}

function fromDue(value: string | null | undefined): string | null {
  if (!value) return null;
  const ms = Number(value);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10);
}

function mapList(row: ApiList): ClickupList {
  const count = Number(row.task_count ?? 0);
  return {
    id: row.id,
    name: row.name ?? "",
    space: row.space?.name ?? "",
    folder: row.folder?.name ?? "",
    taskCount: Number.isFinite(count) ? count : 0,
  };
}

function mapTask(row: ApiTask, fallbackListId = ""): ClickupTask {
  return {
    id: row.id,
    listId: row.list?.id ?? fallbackListId,
    name: row.name ?? "",
    description: row.description ?? "",
    status: row.status?.status ?? "",
    priority: asPriority(row.priority?.priority),
    assignees: (row.assignees ?? []).map((person) => person.username ?? "").filter(Boolean),
    tags: (row.tags ?? []).map((tag) => tag.name ?? "").filter(Boolean),
    dueDate: fromDue(row.due_date),
    url: row.url ?? `https://app.clickup.com/t/${row.id}`,
  };
}

function mapComment(row: ApiComment, taskId: string): ClickupComment {
  const raw = row.date === undefined ? "" : String(row.date);
  const ms = Number(raw);
  const date = Number.isFinite(ms) && raw !== "" ? new Date(ms).toISOString() : raw;
  return {
    id: String(row.id),
    taskId,
    comment: row.comment_text ?? "",
    user: row.user?.username ?? "",
    date,
  };
}

export class LiveClickupClient implements ClickupClient {
  readonly mode = "live" as const;
  readonly readOnly: boolean;
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly teamId: string | undefined;
  private readonly spaceId: string | undefined;
  private readonly options: ClickupOptions;

  constructor(options: ClickupOptions, readOnly: boolean) {
    this.readOnly = readOnly;
    this.options = options;
    this.token = resolveToken("CLICKUP_API_TOKEN", options);
    this.baseUrl = options.baseUrl ?? "https://api.clickup.com/api/v2";
    const env = options.env ?? process.env;
    this.teamId = options.teamId ?? optionalEnv("CLICKUP_TEAM_ID", env);
    this.spaceId = options.spaceId ?? optionalEnv("CLICKUP_SPACE_ID", env);
  }

  private request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return requestJson<T>({
      method,
      url: resolveUrl(this.baseUrl, path),
      headers: tokenHeaders(this.token, "raw"),
      body,
      logger: this.options.logger,
      fetch: this.options.fetch,
      sleep: this.options.sleep,
      timeoutMs: this.options.timeoutMs,
      retries: this.options.retries,
    });
  }

  private async listsInSpace(spaceId: string): Promise<ClickupList[]> {
    const body = await this.request<{ lists?: ApiList[] }>(
      "GET",
      `/space/${encodeURIComponent(spaceId)}/list?archived=false`,
    );
    return (body.lists ?? []).map(mapList);
  }

  async listLists(): Promise<ClickupList[]> {
    if (this.spaceId) return this.listsInSpace(this.spaceId);
    if (!this.teamId) {
      throw new ConnectorError(
        "MISSING_CONFIG",
        "list_lists needs CLICKUP_TEAM_ID or CLICKUP_SPACE_ID in live mode.",
      );
    }
    const spaces = await this.request<{ spaces?: { id: string }[] }>(
      "GET",
      `/team/${encodeURIComponent(this.teamId)}/space?archived=false`,
    );
    const lists: ClickupList[] = [];
    for (const space of (spaces.spaces ?? []).slice(0, 25)) {
      lists.push(...(await this.listsInSpace(space.id)));
    }
    return lists;
  }

  async getList(listId: string): Promise<ClickupList> {
    const body = await this.request<ApiList>(
      "GET",
      `/list/${encodeURIComponent(requiredString(listId, "listId"))}`,
    );
    return mapList(body);
  }

  async listTasks(input: ListTasks): Promise<Page<ClickupTask>> {
    const listId = requiredString(input.listId, "listId");
    clampLimit(input.limit);
    const page = input.cursor ? Number(input.cursor) : 0;
    if (!Number.isInteger(page) || page < 0) {
      throw new ConnectorError("INVALID_CURSOR", "ClickUp cursors are 0-based page numbers.");
    }
    const statuses = input.status ? `&statuses[]=${encodeURIComponent(input.status)}` : "";
    const body = await this.request<{ tasks?: ApiTask[]; last_page?: boolean }>(
      "GET",
      `/list/${encodeURIComponent(listId)}/task?page=${page}&subtasks=true&include_closed=true${statuses}`,
    );
    const items = (body.tasks ?? []).map((task) => mapTask(task, listId));
    return body.last_page === false ? { items, nextCursor: String(page + 1) } : { items };
  }

  async getTask(taskId: string): Promise<ClickupTask> {
    const body = await this.request<ApiTask>(
      "GET",
      `/task/${encodeURIComponent(requiredString(taskId, "taskId"))}`,
    );
    return mapTask(body);
  }

  async createTask(input: CreateTask): Promise<ClickupTask> {
    assertWritable(this.readOnly, "create a task");
    const listId = requiredString(input.listId, "listId");
    const due = dueDateOf(input.dueDate);
    const priority = priorityOf(input.priority);
    const body = await this.request<ApiTask>("POST", `/list/${encodeURIComponent(listId)}/task`, {
      name: requiredString(input.name, "name"),
      description: input.description,
      status: input.status ?? "to do",
      priority: priority ? PRIORITY_ID[priority] : undefined,
      assignees: stringList(input.assignees, "assignees"),
      tags: stringList(input.tags, "tags"),
      due_date: due ? dueMillis(due) : undefined,
      due_date_time: false,
    });
    return mapTask(body, listId);
  }

  async updateTask(taskId: string, patch: TaskWrite): Promise<ClickupTask> {
    assertWritable(this.readOnly, "update a task");
    assertTaskPatch(patch);
    const due = dueDateOf(patch.dueDate);
    const priority = priorityOf(patch.priority);
    const body = await this.request<ApiTask>(
      "PUT",
      `/task/${encodeURIComponent(requiredString(taskId, "taskId"))}`,
      {
        name: patch.name,
        description: patch.description,
        status: patch.status,
        priority: priority ? PRIORITY_ID[priority] : undefined,
        assignees: patch.assignees ? { add: stringList(patch.assignees, "assignees") } : undefined,
        tags: stringList(patch.tags, "tags")?.map((name) => ({ name })),
        due_date: due ? dueMillis(due) : undefined,
        due_date_time: due ? false : undefined,
      },
    );
    return mapTask(body);
  }

  async listComments(taskId: string): Promise<ClickupComment[]> {
    const id = requiredString(taskId, "taskId");
    const body = await this.request<{ comments?: ApiComment[] }>(
      "GET",
      `/task/${encodeURIComponent(id)}/comment`,
    );
    return (body.comments ?? []).map((comment) => mapComment(comment, id));
  }

  async createComment(taskId: string, comment: string): Promise<ClickupComment> {
    assertWritable(this.readOnly, "create a comment");
    const id = requiredString(taskId, "taskId");
    const body = await this.request<ApiComment>("POST", `/task/${encodeURIComponent(id)}/comment`, {
      comment_text: requiredString(comment, "comment"),
    });
    return mapComment(body, id);
  }
}
