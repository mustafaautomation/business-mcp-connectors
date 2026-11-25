import type { ClickupComment, ClickupTask } from "./types.js";

export interface ListSeed {
  id: string;
  name: string;
  space: string;
  folder: string;
}

export const listFixtures: ListSeed[] = [
  { id: "list_onboarding", name: "Client onboarding", space: "Delivery", folder: "Clients" },
  { id: "list_pipeline", name: "Sales pipeline", space: "Delivery", folder: "Growth" },
  { id: "list_delivery", name: "Build queue", space: "Delivery", folder: "Production" },
];

export const taskFixtures: ClickupTask[] = [
  task(
    "86f0onb01",
    "list_onboarding",
    "Collect signed SOW · Kiln Group",
    "Chris asked for a redline by Friday.",
    "complete",
    "normal",
    ["Maya Okonkwo"],
    ["onboarding"],
    "2026-11-12",
  ),
  task(
    "86f0onb02",
    "list_onboarding",
    "Book kickoff · Paper Route Media",
    "Elena is free Tue–Thu afternoons.",
    "in progress",
    "high",
    ["Samir Haddad"],
    ["onboarding"],
    "2026-11-26",
  ),
  task(
    "86f0onb03",
    "list_onboarding",
    "Share password vault · Lumenfield Goods",
    "Waiting on Priya to invite the studio.",
    "to do",
    "normal",
    ["Maya Okonkwo"],
    ["onboarding"],
    "2026-11-28",
  ),
  task(
    "86f0pip01",
    "list_pipeline",
    "Send Brightsail proposal",
    "Dashboard scope is the booking flow only.",
    "in progress",
    "high",
    ["Samir Haddad"],
    ["sales"],
    "2026-11-27",
  ),
  task(
    "86f0pip02",
    "list_pipeline",
    "Follow up with Kiln Group",
    "Discovery notes are in Notion.",
    "to do",
    "low",
    ["Maya Okonkwo"],
    ["sales"],
    "2026-12-02",
  ),
  task(
    "86f0del01",
    "list_delivery",
    "Instrument Lumenfield checkout",
    "Add the three GA4 events from the spec.",
    "in progress",
    "urgent",
    ["Samir Haddad"],
    ["build"],
    "2026-11-30",
  ),
  task(
    "86f0del02",
    "list_delivery",
    "QA Harbor weekly digest",
    "Check the Monday mail against the sheet.",
    "to do",
    "normal",
    ["Maya Okonkwo"],
    ["build"],
    "2026-12-01",
  ),
];

export const commentFixtures: ClickupComment[] = [
  {
    id: "cmt_900",
    taskId: "86f0onb01",
    comment: "SOW is in the drive. Waiting on their signature.",
    user: "Maya Okonkwo",
    date: "2026-11-20T16:10:00.000Z",
  },
];

function task(
  id: string,
  listId: string,
  name: string,
  description: string,
  status: string,
  priority: ClickupTask["priority"],
  assignees: string[],
  tags: string[],
  dueDate: string,
): ClickupTask {
  return {
    id,
    listId,
    name,
    description,
    status,
    priority,
    assignees,
    tags,
    dueDate,
    url: `https://sandbox.clickup.example/t/${id}`,
  };
}
