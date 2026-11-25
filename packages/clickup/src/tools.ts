import { cursorSchema, limitSchema, type ToolDefinition } from "@quvantic/mcp-core";
import { z } from "zod";
import type { ClickupClient, CreateTask, Priority } from "./types.js";

const priority = z.enum(["urgent", "high", "normal", "low"]);

export const CLICKUP_TOOL_NAMES = [
  "list_lists",
  "get_list",
  "list_tasks",
  "get_task",
  "create_task",
  "update_task",
  "list_comments",
  "create_comment",
] as const;

export function clickupTools(client: ClickupClient): ToolDefinition[] {
  return [
    {
      name: "list_lists",
      title: "List lists",
      description:
        "List ClickUp lists in the sandbox workspace, or in live mode from CLICKUP_SPACE_ID or every space in CLICKUP_TEAM_ID.",
      readOnly: true,
      inputSchema: {},
      handler: () => client.listLists(),
    },
    {
      name: "get_list",
      title: "Get list",
      description: "Read one ClickUp list by id.",
      readOnly: true,
      inputSchema: { listId: z.string().min(1) },
      handler: (args) => client.getList(String(args.listId)),
    },
    {
      name: "list_tasks",
      title: "List tasks",
      description:
        "List tasks in a ClickUp list. Optional status filter. In live mode, cursor is the 0-based page index and each page holds up to 100 tasks.",
      readOnly: true,
      inputSchema: {
        listId: z.string().min(1),
        status: z.string().optional(),
        limit: limitSchema,
        cursor: cursorSchema,
      },
      handler: (args) => client.listTasks(args as { listId: string }),
    },
    {
      name: "get_task",
      title: "Get task",
      description: "Read one ClickUp task by id.",
      readOnly: true,
      inputSchema: { taskId: z.string().min(1) },
      handler: (args) => client.getTask(String(args.taskId)),
    },
    {
      name: "create_task",
      title: "Create task",
      description:
        "Create a ClickUp task. listId and name are required. priority is urgent, high, normal, or low. dueDate is YYYY-MM-DD.",
      readOnly: false,
      inputSchema: {
        listId: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: priority.optional(),
        assignees: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        dueDate: z.string().optional(),
      },
      handler: (args) => client.createTask(args as unknown as CreateTask),
    },
    {
      name: "update_task",
      title: "Update task",
      description: "Update fields on a ClickUp task.",
      readOnly: false,
      inputSchema: {
        taskId: z.string().min(1),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        priority: priority.optional(),
        assignees: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        dueDate: z.string().optional(),
      },
      handler: async (args) => {
        const { taskId, ...patch } = args;
        return client.updateTask(String(taskId), patch as { priority?: Priority });
      },
    },
    {
      name: "list_comments",
      title: "List comments",
      description: "List comments on a ClickUp task.",
      readOnly: true,
      inputSchema: { taskId: z.string().min(1) },
      handler: (args) => client.listComments(String(args.taskId)),
    },
    {
      name: "create_comment",
      title: "Create comment",
      description: "Add a comment to a ClickUp task.",
      readOnly: false,
      inputSchema: { taskId: z.string().min(1), comment: z.string().min(1) },
      handler: (args) => client.createComment(String(args.taskId), String(args.comment)),
    },
  ];
}
