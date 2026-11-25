import { cursorSchema, limitSchema, type ToolDefinition } from "@quvantic/mcp-core";
import { z } from "zod";
import type { HubspotClient } from "./types.js";

const association = z.enum(["contact", "company", "deal"]);

export const HUBSPOT_TOOL_NAMES = [
  "search_contacts",
  "get_contact",
  "create_contact",
  "update_contact",
  "search_companies",
  "get_company",
  "create_company",
  "update_company",
  "search_deals",
  "get_deal",
  "create_deal",
  "update_deal",
  "create_note",
  "list_notes",
] as const;

export function hubspotTools(client: HubspotClient): ToolDefinition[] {
  return [
    {
      name: "search_contacts",
      title: "Search contacts",
      description:
        "Search HubSpot contacts. query matches name, email, company, and job title. email is an exact address match. Returns items and nextCursor.",
      readOnly: true,
      inputSchema: {
        query: z.string().optional(),
        email: z.string().optional(),
        company: z.string().optional(),
        limit: limitSchema,
        cursor: cursorSchema,
      },
      handler: (args) => client.searchContacts(args),
    },
    {
      name: "get_contact",
      title: "Get contact",
      description: "Read one HubSpot contact by id.",
      readOnly: true,
      inputSchema: { id: z.string().min(1) },
      handler: (args) => client.getContact(String(args.id)),
    },
    {
      name: "create_contact",
      title: "Create contact",
      description: "Create a HubSpot contact. email is required.",
      readOnly: false,
      inputSchema: {
        email: z.string().min(1),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        phone: z.string().optional(),
        lifecycleStage: z.string().optional(),
      },
      handler: (args) => client.createContact(args as { email: string }),
    },
    {
      name: "update_contact",
      title: "Update contact",
      description: "Update fields on a HubSpot contact. Send only the fields that should change.",
      readOnly: false,
      inputSchema: {
        id: z.string().min(1),
        email: z.string().optional(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        phone: z.string().optional(),
        lifecycleStage: z.string().optional(),
      },
      handler: async (args) => {
        const { id, ...patch } = args;
        return client.updateContact(String(id), patch);
      },
    },
    {
      name: "search_companies",
      title: "Search companies",
      description:
        "Search HubSpot companies. query matches name, domain, industry, and city. domain is exact.",
      readOnly: true,
      inputSchema: {
        query: z.string().optional(),
        domain: z.string().optional(),
        limit: limitSchema,
        cursor: cursorSchema,
      },
      handler: (args) => client.searchCompanies(args),
    },
    {
      name: "get_company",
      title: "Get company",
      description: "Read one HubSpot company by id.",
      readOnly: true,
      inputSchema: { id: z.string().min(1) },
      handler: (args) => client.getCompany(String(args.id)),
    },
    {
      name: "create_company",
      title: "Create company",
      description: "Create a HubSpot company. name is required.",
      readOnly: false,
      inputSchema: {
        name: z.string().min(1),
        domain: z.string().optional(),
        industry: z.string().optional(),
        city: z.string().optional(),
        employees: z.number().int().nonnegative().optional(),
        phone: z.string().optional(),
      },
      handler: (args) => client.createCompany(args as { name: string }),
    },
    {
      name: "update_company",
      title: "Update company",
      description: "Update fields on a HubSpot company.",
      readOnly: false,
      inputSchema: {
        id: z.string().min(1),
        name: z.string().optional(),
        domain: z.string().optional(),
        industry: z.string().optional(),
        city: z.string().optional(),
        employees: z.number().int().nonnegative().optional(),
        phone: z.string().optional(),
      },
      handler: async (args) => {
        const { id, ...patch } = args;
        return client.updateCompany(String(id), patch);
      },
    },
    {
      name: "search_deals",
      title: "Search deals",
      description:
        "Search HubSpot deals. stage filters on the dealstage id, for example closedwon. query matches name, company, contact email, and stage.",
      readOnly: true,
      inputSchema: {
        query: z.string().optional(),
        stage: z.string().optional(),
        limit: limitSchema,
        cursor: cursorSchema,
      },
      handler: (args) => client.searchDeals(args),
    },
    {
      name: "get_deal",
      title: "Get deal",
      description:
        "Read one HubSpot deal by id. In live mode, company is filled from the company association when the company property is empty.",
      readOnly: true,
      inputSchema: { id: z.string().min(1) },
      handler: (args) => client.getDeal(String(args.id)),
    },
    {
      name: "create_deal",
      title: "Create deal",
      description:
        "Create a HubSpot deal. name is required. amount is a decimal string such as 48000. stage defaults to appointmentscheduled.",
      readOnly: false,
      inputSchema: {
        name: z.string().min(1),
        amount: z.string().optional(),
        stage: z.string().optional(),
        pipeline: z.string().optional(),
        closeDate: z.string().optional(),
        company: z.string().optional(),
        contactEmail: z.string().optional(),
        owner: z.string().optional(),
      },
      handler: (args) => client.createDeal(args as { name: string }),
    },
    {
      name: "update_deal",
      title: "Update deal",
      description: "Update fields on a HubSpot deal, including stage.",
      readOnly: false,
      inputSchema: {
        id: z.string().min(1),
        name: z.string().optional(),
        amount: z.string().optional(),
        stage: z.string().optional(),
        pipeline: z.string().optional(),
        closeDate: z.string().optional(),
        company: z.string().optional(),
        contactEmail: z.string().optional(),
        owner: z.string().optional(),
      },
      handler: async (args) => {
        const { id, ...patch } = args;
        return client.updateDeal(String(id), patch);
      },
    },
    {
      name: "create_note",
      title: "Create note",
      description:
        "Create a HubSpot note and associate it with a contact, company, or deal. body is plain text.",
      readOnly: false,
      inputSchema: {
        body: z.string().min(1),
        objectType: association,
        objectId: z.string().min(1),
        timestamp: z.string().optional(),
      },
      handler: (args) =>
        client.createNote(
          args as { body: string; objectType: "contact" | "company" | "deal"; objectId: string },
        ),
    },
    {
      name: "list_notes",
      title: "List notes",
      description: "List notes associated with a contact, company, or deal.",
      readOnly: true,
      inputSchema: {
        objectType: association,
        objectId: z.string().min(1),
        limit: limitSchema,
        cursor: cursorSchema,
      },
      handler: (args) =>
        client.listNotes(args as { objectType: "contact" | "company" | "deal"; objectId: string }),
    },
  ];
}
