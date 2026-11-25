import type { Mode, Page } from "@quvantic/mcp-core";

export type NotionParent =
  | { type: "workspace" }
  | { type: "database"; databaseId: string }
  | { type: "page"; pageId: string };

export interface NotionHit {
  id: string;
  object: "page" | "database";
  title: string;
  url: string;
}

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  parent: NotionParent;
  properties: Record<string, string>;
  content: string;
}

export interface NotionDatabase {
  id: string;
  title: string;
  url: string;
  properties: Record<string, string>;
}

export interface SearchInput {
  query?: string;
  filter?: "page" | "database";
  limit?: number;
  cursor?: string;
}

export interface QueryDatabase {
  databaseId: string;
  filterProperty?: string;
  filterValue?: string;
  limit?: number;
  cursor?: string;
}

export interface CreatePage {
  title: string;
  content?: string;
  parentDatabaseId?: string;
  parentPageId?: string;
  titleProperty?: string;
  properties?: Record<string, string>;
}

export interface NotionClient {
  readonly mode: Mode;
  readonly readOnly: boolean;
  search(input: SearchInput): Promise<Page<NotionHit>>;
  readPage(pageId: string): Promise<NotionPage>;
  readDatabase(databaseId: string): Promise<NotionDatabase>;
  queryDatabase(input: QueryDatabase): Promise<Page<NotionPage>>;
  createPage(input: CreatePage): Promise<NotionPage>;
}
