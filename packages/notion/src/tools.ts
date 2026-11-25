import { cursorSchema, limitSchema, type ToolDefinition } from "@quvantic/mcp-core";
import { z } from "zod";
import type { CreatePage, NotionClient, QueryDatabase, SearchInput } from "./types.js";

export const NOTION_TOOL_NAMES = [
  "search",
  "read_page",
  "read_database",
  "query_database",
  "create_page",
] as const;

export function notionTools(client: NotionClient): ToolDefinition[] {
  return [
    {
      name: "search",
      title: "Search",
      description:
        "Search Notion pages and databases by title. filter is page or database. An empty query lists recent matches.",
      readOnly: true,
      inputSchema: {
        query: z.string().optional(),
        filter: z.enum(["page", "database"]).optional(),
        limit: limitSchema,
        cursor: cursorSchema,
      },
      handler: (args) => client.search(args as SearchInput),
    },
    {
      name: "read_page",
      title: "Read page",
      description: "Read a Notion page: flattened properties plus paragraph and heading text.",
      readOnly: true,
      inputSchema: { pageId: z.string().min(1) },
      handler: (args) => client.readPage(String(args.pageId)),
    },
    {
      name: "read_database",
      title: "Read database",
      description: "Read a Notion database schema. properties maps each name to its type.",
      readOnly: true,
      inputSchema: { databaseId: z.string().min(1) },
      handler: (args) => client.readDatabase(String(args.databaseId)),
    },
    {
      name: "query_database",
      title: "Query database",
      description:
        "Query rows in a Notion database. filterProperty and filterValue match by the property type: contains for text, equals for select and status. Call read_page for block content.",
      readOnly: true,
      inputSchema: {
        databaseId: z.string().min(1),
        filterProperty: z.string().optional(),
        filterValue: z.string().optional(),
        limit: limitSchema,
        cursor: cursorSchema,
      },
      handler: (args) => client.queryDatabase(args as unknown as QueryDatabase),
    },
    {
      name: "create_page",
      title: "Create page",
      description:
        "Create a Notion page under parentDatabaseId or parentPageId. titleProperty defaults to Name inside a database and title under a page. Share the parent with the integration in live mode.",
      readOnly: false,
      inputSchema: {
        title: z.string().min(1),
        content: z.string().optional(),
        parentDatabaseId: z.string().optional(),
        parentPageId: z.string().optional(),
        titleProperty: z.string().optional(),
        properties: z.record(z.string()).optional(),
      },
      handler: (args) => client.createPage(args as unknown as CreatePage),
    },
  ];
}
