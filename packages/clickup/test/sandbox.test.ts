import { Logger } from "@quvantic/mcp-core";
import { describe, expect, it } from "vitest";
import { createClickupClient } from "../src/index.js";

const logger = new Logger("test", () => {});

function client(readOnly = false) {
  return createClickupClient({ mode: "sandbox", readOnly, logger });
}

describe("clickup sandbox", () => {
  it("lists lists with live task counts and filters tasks", async () => {
    const clickup = client();
    const lists = await clickup.listLists();
    const onboarding = lists.find((list) => list.id === "list_onboarding");
    expect(onboarding?.taskCount).toBe(3);
    const open = await clickup.listTasks({ listId: "list_onboarding", status: "to do" });
    expect(open.items.map((task) => task.id)).toEqual(["86f0onb03"]);
    const page = await clickup.listTasks({ listId: "list_onboarding", limit: 2 });
    expect(page.nextCursor).toBe("2");
  });

  it("creates a task and a comment", async () => {
    const clickup = client();
    const task = await clickup.createTask({
      listId: "list_onboarding",
      name: "Send kickoff agenda",
      priority: "high",
      dueDate: "2026-11-26",
      tags: ["onboarding"],
    });
    expect(task.id).toBe("86f0new01");
    expect(task.url).toContain(task.id);
    const comment = await clickup.createComment(task.id, "Agenda is drafted.");
    expect((await clickup.listComments(task.id)).map((row) => row.id)).toContain(comment.id);
    const updated = await clickup.updateTask(task.id, { status: "in progress" });
    expect(updated.status).toBe("in progress");
    expect((await clickup.getList("list_onboarding")).taskCount).toBe(4);
  });

  it("blocks writes when read-only", async () => {
    const clickup = client(true);
    await expect(
      clickup.createTask({ listId: "list_onboarding", name: "Nope" }),
    ).rejects.toMatchObject({ code: "READ_ONLY" });
    await expect(clickup.getTask("missing")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
