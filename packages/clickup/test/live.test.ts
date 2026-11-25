import { Logger } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createClickupClient } from "../src/index.js";

const logger = new Logger("test", () => {});

describe("clickup live", () => {
  it("uses the raw token and maps a created task", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const client = createClickupClient({
      mode: "live",
      token: "pk_test_token",
      env: {},
      logger,
      sleep: async () => undefined,
      fetch: async (input, init) => {
        calls.push({ url: String(input), init: init ?? {} });
        return Response.json({
          id: "86abc",
          name: "Send kickoff agenda",
          description: "Agenda",
          status: { status: "to do" },
          priority: { priority: "high" },
          assignees: [{ username: "Maya Okonkwo" }],
          tags: [{ name: "onboarding" }],
          due_date: String(Date.parse("2026-11-26T00:00:00.000Z")),
          list: { id: "list_onboarding" },
          url: "https://app.clickup.com/t/86abc",
        });
      },
    });
    const task = await client.createTask({
      listId: "list_onboarding",
      name: "Send kickoff agenda",
      priority: "high",
      dueDate: "2026-11-26",
    });
    expect(new Headers(calls[0]?.init.headers).get("authorization")).toBe("pk_test_token");
    expect(calls[0]?.url).toBe("https://api.clickup.com/api/v2/list/list_onboarding/task");
    const body = JSON.parse(String(calls[0]?.init.body)) as { priority: number; due_date: number };
    expect(body.priority).toBe(2);
    expect(body.due_date).toBe(Date.parse("2026-11-26T00:00:00.000Z"));
    expect(task.priority).toBe("high");
    expect(task.dueDate).toBe("2026-11-26");
  });

  it("asks for a workspace id before listing lists", async () => {
    const client = createClickupClient({
      mode: "live",
      token: "pk_test_token",
      env: {},
      logger,
      fetch: async () => {
        throw new Error("should not fetch");
      },
    });
    await expect(client.listLists()).rejects.toMatchObject({ code: "MISSING_CONFIG" });
  });

  it("pages tasks with a team space lookup", async () => {
    const urls: string[] = [];
    const client = createClickupClient({
      mode: "live",
      token: "pk_test_token",
      teamId: "team_1",
      env: {},
      logger,
      sleep: async () => undefined,
      fetch: async (input) => {
        const url = String(input);
        urls.push(url);
        if (url.includes("/team/")) return Response.json({ spaces: [{ id: "space_1" }] });
        if (url.includes("/space/")) {
          return Response.json({
            lists: [{ id: "list_onboarding", name: "Client onboarding", task_count: 3 }],
          });
        }
        return Response.json({
          tasks: [
            {
              id: "86f0onb03",
              name: "Share password vault",
              status: { status: "to do" },
              list: { id: "list_onboarding" },
            },
          ],
          last_page: false,
        });
      },
    });
    const lists = await client.listLists();
    expect(lists[0]?.name).toBe("Client onboarding");
    const page = await client.listTasks({ listId: "list_onboarding", cursor: "0" });
    expect(page.nextCursor).toBe("1");
    expect(urls.some((url) => url.includes("page=0"))).toBe(true);
  });
});
