import {
  assertWritable,
  type ClientOptions,
  ConnectorError,
  clampLimit,
  type Page,
  requestJson,
  requiredString,
  resolveToken,
  resolveUrl,
  tokenHeaders,
} from "@quvantic/mcp-core";
import { assertFilterPair, notionApiFilter } from "./filter.js";
import type {
  CreatePage,
  NotionClient,
  NotionDatabase,
  NotionHit,
  NotionPage,
  NotionParent,
  QueryDatabase,
  SearchInput,
} from "./types.js";

const NOTION_VERSION = "2022-06-28";

interface RichText {
  plain_text?: string;
}

interface ApiProperty {
  type?: string;
  title?: RichText[];
  rich_text?: RichText[];
  number?: number | null;
  select?: { name?: string } | null;
  status?: { name?: string } | null;
  url?: string | null;
  email?: string | null;
  phone_number?: string | null;
  checkbox?: boolean;
  date?: { start?: string } | null;
}

interface ApiPage {
  id: string;
  url?: string;
  parent?: { type?: string; database_id?: string; page_id?: string };
  properties?: Record<string, ApiProperty>;
}

interface ApiDatabase {
  id: string;
  url?: string;
  title?: RichText[];
  properties?: Record<string, { type?: string }>;
}

interface ApiBlock {
  type?: string;
  has_children?: boolean;
  paragraph?: { rich_text?: RichText[] };
  heading_1?: { rich_text?: RichText[] };
  heading_2?: { rich_text?: RichText[] };
  heading_3?: { rich_text?: RichText[] };
  bulleted_list_item?: { rich_text?: RichText[] };
  numbered_list_item?: { rich_text?: RichText[] };
  to_do?: { rich_text?: RichText[]; checked?: boolean };
  quote?: { rich_text?: RichText[] };
  code?: { rich_text?: RichText[] };
}

function plain(items: RichText[] | undefined): string {
  return (items ?? []).map((item) => item.plain_text ?? "").join("");
}

function pageTitle(properties: Record<string, ApiProperty> | undefined): string {
  if (!properties) return "";
  for (const value of Object.values(properties)) {
    if (value.type === "title") return plain(value.title);
  }
  return "";
}

function flattenProperty(value: ApiProperty | undefined): string {
  if (!value?.type) return "";
  if (value.type === "title") return plain(value.title);
  if (value.type === "rich_text") return plain(value.rich_text);
  if (value.type === "number")
    return value.number === null || value.number === undefined ? "" : String(value.number);
  if (value.type === "select") return value.select?.name ?? "";
  if (value.type === "status") return value.status?.name ?? "";
  if (value.type === "url") return value.url ?? "";
  if (value.type === "email") return value.email ?? "";
  if (value.type === "phone_number") return value.phone_number ?? "";
  if (value.type === "checkbox") return value.checkbox ? "true" : "false";
  if (value.type === "date") return value.date?.start ?? "";
  return "";
}

function flattenProperties(
  properties: Record<string, ApiProperty> | undefined,
): Record<string, string> {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(properties ?? {})) output[key] = flattenProperty(value);
  return output;
}

function mapParent(parent: ApiPage["parent"]): NotionParent {
  if (parent?.type === "database_id" && parent.database_id) {
    return { type: "database", databaseId: parent.database_id };
  }
  if (parent?.type === "page_id" && parent.page_id) return { type: "page", pageId: parent.page_id };
  return { type: "workspace" };
}

function mapPage(row: ApiPage, content = ""): NotionPage {
  return {
    id: row.id,
    title: pageTitle(row.properties),
    url: row.url ?? "",
    parent: mapParent(row.parent),
    properties: flattenProperties(row.properties),
    content,
  };
}

function blockText(block: ApiBlock): string | null {
  const type = block.type ?? "";
  const data = block[type as keyof ApiBlock] as
    | { rich_text?: RichText[]; checked?: boolean }
    | undefined;
  if (!data || typeof data !== "object" || !("rich_text" in data || type === "to_do")) {
    if (
      ![
        "paragraph",
        "heading_1",
        "heading_2",
        "heading_3",
        "bulleted_list_item",
        "numbered_list_item",
        "to_do",
        "quote",
        "code",
      ].includes(type)
    ) {
      return null;
    }
  }
  const text = plain(data && "rich_text" in data ? data.rich_text : undefined);
  if (type === "heading_1") return `# ${text}`;
  if (type === "heading_2") return `## ${text}`;
  if (type === "heading_3") return `### ${text}`;
  if (type === "bulleted_list_item") return `- ${text}`;
  if (type === "numbered_list_item") return `1. ${text}`;
  if (type === "to_do") return `${data?.checked ? "[x]" : "[ ]"} ${text}`;
  if (type === "quote") return `> ${text}`;
  if (type === "paragraph" || type === "code") return text;
  return null;
}

function pageFrom<T>(cursor: string | null | undefined, items: T[]): Page<T> {
  return cursor ? { items, nextCursor: cursor } : { items };
}

function rich(content: string) {
  return [{ type: "text", text: { content } }];
}

export class LiveNotionClient implements NotionClient {
  readonly mode = "live" as const;
  readonly readOnly: boolean;
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly options: ClientOptions;

  constructor(options: ClientOptions, readOnly: boolean) {
    this.readOnly = readOnly;
    this.options = options;
    this.token = resolveToken("NOTION_API_TOKEN", options);
    this.baseUrl = options.baseUrl ?? "https://api.notion.com/v1";
  }

  private request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return requestJson<T>({
      method,
      url: resolveUrl(this.baseUrl, path),
      headers: tokenHeaders(this.token, "bearer", { "notion-version": NOTION_VERSION }),
      body,
      logger: this.options.logger,
      fetch: this.options.fetch,
      sleep: this.options.sleep,
      timeoutMs: this.options.timeoutMs,
      retries: this.options.retries,
    });
  }

  async search(input: SearchInput): Promise<Page<NotionHit>> {
    if (input.filter && input.filter !== "page" && input.filter !== "database") {
      throw new ConnectorError("VALIDATION", "filter must be page or database.");
    }
    const body = await this.request<{
      results?: ({ object?: string } & (ApiPage | ApiDatabase))[];
      next_cursor?: string | null;
    }>("POST", "/search", {
      query: input.query ?? "",
      filter: input.filter ? { value: input.filter, property: "object" } : undefined,
      page_size: clampLimit(input.limit),
      start_cursor: input.cursor,
    });
    const items: NotionHit[] = [];
    for (const result of body.results ?? []) {
      if (result.object === "database") {
        const database = result as ApiDatabase;
        items.push({
          id: database.id,
          object: "database",
          title: plain(database.title),
          url: database.url ?? "",
        });
      } else {
        const page = result as ApiPage;
        items.push({
          id: page.id,
          object: "page",
          title: pageTitle(page.properties),
          url: page.url ?? "",
        });
      }
    }
    return pageFrom(body.next_cursor, items);
  }

  async readPage(pageId: string): Promise<NotionPage> {
    const id = requiredString(pageId, "pageId");
    const page = await this.request<ApiPage>("GET", `/pages/${encodeURIComponent(id)}`);
    const blocks = await this.request<{ results?: ApiBlock[]; has_more?: boolean }>(
      "GET",
      `/blocks/${encodeURIComponent(id)}/children?page_size=100`,
    );
    const lines = (blocks.results ?? [])
      .map(blockText)
      .filter((line): line is string => line !== null);
    if (blocks.has_more) lines.push("…");
    return mapPage(page, lines.join("\n"));
  }

  async readDatabase(databaseId: string): Promise<NotionDatabase> {
    const row = await this.request<ApiDatabase>(
      "GET",
      `/databases/${encodeURIComponent(requiredString(databaseId, "databaseId"))}`,
    );
    const properties: Record<string, string> = {};
    for (const [name, value] of Object.entries(row.properties ?? {}))
      properties[name] = value.type ?? "unknown";
    return { id: row.id, title: plain(row.title), url: row.url ?? "", properties };
  }

  async queryDatabase(input: QueryDatabase): Promise<Page<NotionPage>> {
    const databaseId = requiredString(input.databaseId, "databaseId");
    assertFilterPair(input.filterProperty, input.filterValue);
    let filter: Record<string, unknown> | undefined;
    if (input.filterProperty && input.filterValue) {
      const database = await this.readDatabase(databaseId);
      const type = database.properties[input.filterProperty];
      if (!type) {
        throw new ConnectorError(
          "VALIDATION",
          `Property ${input.filterProperty} is not on this database.`,
        );
      }
      filter = notionApiFilter(input.filterProperty, type, input.filterValue);
    }
    const body = await this.request<{ results?: ApiPage[]; next_cursor?: string | null }>(
      "POST",
      `/databases/${encodeURIComponent(databaseId)}/query`,
      { filter, page_size: clampLimit(input.limit), start_cursor: input.cursor },
    );
    return pageFrom(
      body.next_cursor,
      (body.results ?? []).map((row) => mapPage(row)),
    );
  }

  async createPage(input: CreatePage): Promise<NotionPage> {
    assertWritable(this.readOnly, "create a page");
    const title = requiredString(input.title, "title");
    const databaseId = input.parentDatabaseId?.trim();
    const pageId = input.parentPageId?.trim();
    if ((databaseId ? 1 : 0) + (pageId ? 1 : 0) !== 1) {
      throw new ConnectorError("VALIDATION", "Provide parentDatabaseId or parentPageId, not both.");
    }
    const titleProperty = input.titleProperty ?? (databaseId ? "Name" : "title");
    const properties: Record<string, unknown> = {
      [titleProperty]: { title: rich(title) },
    };
    for (const [key, value] of Object.entries(input.properties ?? {})) {
      if (key === titleProperty) continue;
      properties[key] = { rich_text: rich(value) };
    }
    const children = input.content?.split("\n").map((line) => ({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: rich(line) },
    }));
    const row = await this.request<ApiPage>("POST", "/pages", {
      parent: databaseId ? { database_id: databaseId } : { page_id: pageId },
      properties,
      children,
    });
    const page = mapPage(row, input.content ?? "");
    if (!page.title) page.title = title;
    return page;
  }
}
