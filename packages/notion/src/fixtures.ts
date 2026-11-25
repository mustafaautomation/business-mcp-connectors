import type { NotionDatabase, NotionPage } from "./types.js";

export const databaseFixtures: NotionDatabase[] = [
  {
    id: "db_clients",
    title: "Clients",
    url: "https://sandbox.notion.example/db_clients",
    properties: { Name: "title", Status: "select", Owner: "rich_text", Website: "url" },
  },
  {
    id: "db_playbooks",
    title: "Playbooks",
    url: "https://sandbox.notion.example/db_playbooks",
    properties: { Name: "title", Topic: "select" },
  },
];

export const pageFixtures: NotionPage[] = [
  {
    id: "page_harbor",
    title: "Harbor & Co.",
    url: "https://sandbox.notion.example/page_harbor",
    parent: { type: "database", databaseId: "db_clients" },
    properties: {
      Name: "Harbor & Co.",
      Status: "Active",
      Owner: "Maya Okonkwo",
      Website: "https://harborandco.example",
    },
    content: "Retainer kicked off November 2026. The weekly digest goes out Monday.",
  },
  {
    id: "page_lumen",
    title: "Lumenfield Goods",
    url: "https://sandbox.notion.example/page_lumen",
    parent: { type: "database", databaseId: "db_clients" },
    properties: {
      Name: "Lumenfield Goods",
      Status: "Proposal",
      Owner: "Maya Okonkwo",
      Website: "https://lumenfield.example",
    },
    content: "Checkout instrumentation is in the build queue.",
  },
  {
    id: "page_playbook",
    title: "Onboarding playbook",
    url: "https://sandbox.notion.example/page_playbook",
    parent: { type: "workspace" },
    properties: { title: "Onboarding playbook" },
    content:
      "1. Send the kickoff agenda.\n2. Provision the workspace.\n3. Interview stakeholders.\n4. Deliver the week-1 plan.",
  },
  {
    id: "page_proposal",
    title: "Proposal checklist",
    url: "https://sandbox.notion.example/page_proposal",
    parent: { type: "page", pageId: "page_playbook" },
    properties: { title: "Proposal checklist" },
    content: "Scope, timeline, and the name of the champion.",
  },
];
