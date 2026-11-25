import {
  assertWritable,
  type ClientOptions,
  ConnectorError,
  clampLimit,
  type Page,
  paginate,
  requiredString,
} from "@quvantic/mcp-core";
import { assertFilterPair, matchesProperty } from "./filter.js";
import { databaseFixtures, pageFixtures } from "./fixtures.js";
import type {
  CreatePage,
  NotionClient,
  NotionDatabase,
  NotionHit,
  NotionPage,
  QueryDatabase,
  SearchInput,
} from "./types.js";

function copy<T>(value: T): T {
  return structuredClone(value);
}

function includes(query: string | undefined, fields: string[]): boolean {
  if (!query?.trim()) return true;
  const needle = query.trim().toLowerCase();
  return fields.some((field) => field.toLowerCase().includes(needle));
}

export class SandboxNotionClient implements NotionClient {
  readonly mode = "sandbox" as const;
  readonly readOnly: boolean;
  private readonly databases: NotionDatabase[] = structuredClone(databaseFixtures);
  private readonly pages: NotionPage[] = structuredClone(pageFixtures);
  private nextPage = 1;

  constructor(_options: ClientOptions, readOnly: boolean) {
    this.readOnly = readOnly;
  }

  private requirePage(pageId: string): NotionPage {
    const page = this.pages.find((item) => item.id === pageId);
    if (!page) throw new ConnectorError("NOT_FOUND", `Page ${pageId} was not found.`);
    return page;
  }

  private requireDatabase(databaseId: string): NotionDatabase {
    const database = this.databases.find((item) => item.id === databaseId);
    if (!database) throw new ConnectorError("NOT_FOUND", `Database ${databaseId} was not found.`);
    return database;
  }

  search(input: SearchInput): Promise<Page<NotionHit>> {
    if (input.filter && input.filter !== "page" && input.filter !== "database") {
      throw new ConnectorError("VALIDATION", "filter must be page or database.");
    }
    const hits: NotionHit[] = [];
    if (input.filter !== "database") {
      for (const page of this.pages) {
        if (includes(input.query, [page.title, page.content, ...Object.values(page.properties)])) {
          hits.push({ id: page.id, object: "page", title: page.title, url: page.url });
        }
      }
    }
    if (input.filter !== "page") {
      for (const database of this.databases) {
        if (includes(input.query, [database.title])) {
          hits.push({
            id: database.id,
            object: "database",
            title: database.title,
            url: database.url,
          });
        }
      }
    }
    return Promise.resolve(paginate(hits, clampLimit(input.limit), input.cursor));
  }

  readPage(pageId: string) {
    return Promise.resolve(copy(this.requirePage(requiredString(pageId, "pageId"))));
  }

  readDatabase(databaseId: string) {
    return Promise.resolve(copy(this.requireDatabase(requiredString(databaseId, "databaseId"))));
  }

  queryDatabase(input: QueryDatabase): Promise<Page<NotionPage>> {
    const database = this.requireDatabase(requiredString(input.databaseId, "databaseId"));
    assertFilterPair(input.filterProperty, input.filterValue);
    const rows = this.pages.filter((page) => {
      if (page.parent.type !== "database" || page.parent.databaseId !== database.id) return false;
      if (input.filterProperty && input.filterValue) {
        return matchesProperty(
          page.properties,
          database.properties,
          input.filterProperty,
          input.filterValue,
        );
      }
      return true;
    });
    return Promise.resolve(paginate(rows.map(copy), clampLimit(input.limit), input.cursor));
  }

  createPage(input: CreatePage) {
    assertWritable(this.readOnly, "create a page");
    const title = requiredString(input.title, "title");
    const databaseId = input.parentDatabaseId?.trim();
    const pageId = input.parentPageId?.trim();
    if ((databaseId ? 1 : 0) + (pageId ? 1 : 0) !== 1) {
      throw new ConnectorError("VALIDATION", "Provide parentDatabaseId or parentPageId, not both.");
    }
    let parent: NotionPage["parent"];
    let titleProperty = input.titleProperty;
    if (databaseId) {
      const database = this.requireDatabase(databaseId);
      parent = { type: "database", databaseId: database.id };
      titleProperty = titleProperty ?? "Name";
      if (database.properties[titleProperty] === undefined) {
        throw new ConnectorError(
          "VALIDATION",
          `Property ${titleProperty} is not on this database.`,
        );
      }
    } else {
      const parentPage = this.requirePage(pageId ?? "");
      parent = { type: "page", pageId: parentPage.id };
      titleProperty = titleProperty ?? "title";
    }
    const id = `page_new_${this.nextPage++}`;
    const created: NotionPage = {
      id,
      title,
      url: `https://sandbox.notion.example/${id}`,
      parent,
      properties: { ...(input.properties ?? {}), [titleProperty]: title },
      content: input.content?.trim() ?? "",
    };
    this.pages.push(created);
    return Promise.resolve(copy(created));
  }
}
