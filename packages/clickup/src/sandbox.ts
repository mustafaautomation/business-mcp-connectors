import {
  assertWritable,
  type ClientOptions,
  ConnectorError,
  clampLimit,
  paginate,
  requiredString,
  SANDBOX_CLOCK,
} from "@quvantic/mcp-core";
import { commentFixtures, listFixtures, taskFixtures } from "./fixtures.js";
import type {
  ClickupClient,
  ClickupComment,
  ClickupList,
  ClickupTask,
  CreateTask,
  ListTasks,
  TaskWrite,
} from "./types.js";
import { assertTaskPatch, dueDateOf, priorityOf, stringList } from "./validate.js";

function copy<T>(value: T): T {
  return structuredClone(value);
}

export class SandboxClickupClient implements ClickupClient {
  readonly mode = "sandbox" as const;
  readonly readOnly: boolean;
  private readonly lists = structuredClone(listFixtures);
  private readonly tasks: ClickupTask[] = structuredClone(taskFixtures);
  private readonly comments: ClickupComment[] = structuredClone(commentFixtures);
  private readonly now: () => Date;
  private nextTask = 1;
  private nextComment = 1;

  constructor(options: ClientOptions, readOnly: boolean) {
    this.readOnly = readOnly;
    this.now = options.now ?? (() => new Date(SANDBOX_CLOCK));
  }

  private toList(seed: (typeof this.lists)[number]): ClickupList {
    return {
      ...seed,
      taskCount: this.tasks.filter((task) => task.listId === seed.id).length,
    };
  }

  private requireList(listId: string) {
    const list = this.lists.find((item) => item.id === listId);
    if (!list) throw new ConnectorError("NOT_FOUND", `List ${listId} was not found.`);
    return list;
  }

  private requireTask(taskId: string): ClickupTask {
    const task = this.tasks.find((item) => item.id === taskId);
    if (!task) throw new ConnectorError("NOT_FOUND", `Task ${taskId} was not found.`);
    return task;
  }

  listLists() {
    return Promise.resolve(this.lists.map((list) => this.toList(list)));
  }

  getList(listId: string) {
    return Promise.resolve(this.toList(this.requireList(requiredString(listId, "listId"))));
  }

  listTasks(input: ListTasks) {
    const listId = requiredString(input.listId, "listId");
    this.requireList(listId);
    const status = input.status?.trim().toLowerCase();
    const rows = this.tasks.filter((task) => {
      if (task.listId !== listId) return false;
      if (status && task.status.toLowerCase() !== status) return false;
      return true;
    });
    return Promise.resolve(paginate(rows.map(copy), clampLimit(input.limit), input.cursor));
  }

  getTask(taskId: string) {
    return Promise.resolve(copy(this.requireTask(requiredString(taskId, "taskId"))));
  }

  createTask(input: CreateTask) {
    assertWritable(this.readOnly, "create a task");
    const listId = requiredString(input.listId, "listId");
    this.requireList(listId);
    const id = `86f0new${String(this.nextTask++).padStart(2, "0")}`;
    const created: ClickupTask = {
      id,
      listId,
      name: requiredString(input.name, "name"),
      description:
        input.description === undefined ? "" : requiredString(input.description, "description"),
      status: input.status === undefined ? "to do" : requiredString(input.status, "status"),
      priority: priorityOf(input.priority) ?? null,
      assignees: stringList(input.assignees, "assignees") ?? [],
      tags: stringList(input.tags, "tags") ?? [],
      dueDate: dueDateOf(input.dueDate) ?? null,
      url: `https://sandbox.clickup.example/t/${id}`,
    };
    this.tasks.push(created);
    return Promise.resolve(copy(created));
  }

  updateTask(taskId: string, patch: TaskWrite) {
    assertWritable(this.readOnly, "update a task");
    assertTaskPatch(patch);
    const current = this.requireTask(requiredString(taskId, "taskId"));
    if (patch.name !== undefined) current.name = requiredString(patch.name, "name");
    if (patch.description !== undefined) {
      current.description = requiredString(patch.description, "description");
    }
    if (patch.status !== undefined) current.status = requiredString(patch.status, "status");
    if (patch.priority !== undefined) current.priority = priorityOf(patch.priority) ?? null;
    if (patch.assignees !== undefined)
      current.assignees = stringList(patch.assignees, "assignees") ?? [];
    if (patch.tags !== undefined) current.tags = stringList(patch.tags, "tags") ?? [];
    if (patch.dueDate !== undefined) current.dueDate = dueDateOf(patch.dueDate) ?? null;
    return Promise.resolve(copy(current));
  }

  listComments(taskId: string) {
    const id = requiredString(taskId, "taskId");
    this.requireTask(id);
    return Promise.resolve(this.comments.filter((comment) => comment.taskId === id).map(copy));
  }

  createComment(taskId: string, comment: string) {
    assertWritable(this.readOnly, "create a comment");
    const id = requiredString(taskId, "taskId");
    this.requireTask(id);
    const created: ClickupComment = {
      id: `cmt_new_${this.nextComment++}`,
      taskId: id,
      comment: requiredString(comment, "comment"),
      user: "Sandbox user",
      date: this.now().toISOString(),
    };
    this.comments.push(created);
    return Promise.resolve(copy(created));
  }
}
