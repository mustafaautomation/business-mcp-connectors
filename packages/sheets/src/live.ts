import {
  assertWritable,
  type ClientOptions,
  ConnectorError,
  requestJson,
  requiredString,
  requireEnv,
  resolveToken,
  resolveUrl,
  tokenHeaders,
} from "@quvantic/mcp-core";
import { cellToString, findInWindow, parseRange } from "./grid.js";
import type { Cell, SheetAppend, SheetFind, SheetRead, SheetsClient } from "./types.js";

function normalizeValues(values: unknown): string[][] {
  if (!Array.isArray(values)) return [];
  return values.map((row) => {
    if (!Array.isArray(row)) return [];
    return row.map((cell) => (cell === null || cell === undefined ? "" : String(cell)));
  });
}

export class LiveSheetsClient implements SheetsClient {
  readonly mode = "live" as const;
  readonly readOnly: boolean;
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly env: NodeJS.ProcessEnv;
  private readonly options: ClientOptions;

  constructor(options: ClientOptions, readOnly: boolean) {
    this.readOnly = readOnly;
    this.options = options;
    this.env = options.env ?? process.env;
    this.token = resolveToken("GOOGLE_SHEETS_ACCESS_TOKEN", options);
    this.baseUrl = options.baseUrl ?? "https://sheets.googleapis.com/v4";
  }

  private spreadsheetId(explicit?: string): string {
    if (explicit?.trim()) return explicit.trim();
    return requireEnv("GOOGLE_SHEETS_SPREADSHEET_ID", this.env);
  }

  private request<T>(method: string, path: string, body?: unknown): Promise<T> {
    return requestJson<T>({
      method,
      url: resolveUrl(this.baseUrl, path),
      headers: tokenHeaders(this.token, "bearer"),
      body,
      logger: this.options.logger,
      fetch: this.options.fetch,
      sleep: this.options.sleep,
      timeoutMs: this.options.timeoutMs,
      retries: this.options.retries,
    });
  }

  async readRange(input: { spreadsheetId?: string; range: string }): Promise<SheetRead> {
    const spreadsheetId = this.spreadsheetId(input.spreadsheetId);
    const range = requiredString(input.range, "range");
    const body = await this.request<{ range?: string; values?: unknown }>(
      "GET",
      `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
    );
    return { spreadsheetId, range: body.range ?? range, values: normalizeValues(body.values) };
  }

  async appendRows(input: {
    spreadsheetId?: string;
    range: string;
    values: Cell[][];
  }): Promise<SheetAppend> {
    assertWritable(this.readOnly, "append rows");
    const spreadsheetId = this.spreadsheetId(input.spreadsheetId);
    const range = requiredString(input.range, "range");
    const values = input.values.map((row) => row.map(cellToString));
    if (values.length === 0 || values.some((row) => row.length === 0)) {
      throw new ConnectorError("VALIDATION", "values needs at least one row with one cell.");
    }
    const body = await this.request<{ updates?: { updatedRange?: string; updatedRows?: number } }>(
      "POST",
      `/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      { values },
    );
    return {
      spreadsheetId,
      updatedRange: body.updates?.updatedRange ?? range,
      updatedRows: body.updates?.updatedRows ?? values.length,
      values,
    };
  }

  async findRows(input: {
    spreadsheetId?: string;
    range: string;
    query: string;
    column?: string;
  }): Promise<SheetFind> {
    const read = await this.readRange(input);
    const parsed = parseRange(read.range);
    const matches = findInWindow(
      read.values,
      input.query,
      input.column,
      parsed.startRow,
      parsed.startCol,
    );
    return {
      spreadsheetId: read.spreadsheetId,
      range: read.range,
      query: requiredString(input.query, "query"),
      matches,
    };
  }
}
