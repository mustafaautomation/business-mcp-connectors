import {
  assertWritable,
  type ClientOptions,
  ConnectorError,
  requiredString,
} from "@quvantic/mcp-core";
import { spreadsheetFixtures } from "./fixtures.js";
import { appendGrid, cellToString, findRows, parseRange, sliceGrid, updatedRange } from "./grid.js";
import type { Cell, SheetAppend, SheetFind, SheetRead, SheetsClient } from "./types.js";
import { SANDBOX_SPREADSHEET_ID } from "./types.js";

export class SandboxSheetsClient implements SheetsClient {
  readonly mode = "sandbox" as const;
  readonly readOnly: boolean;
  private readonly book = structuredClone(spreadsheetFixtures);

  constructor(_options: ClientOptions, readOnly: boolean) {
    this.readOnly = readOnly;
  }

  private idFor(explicit?: string): string {
    if (explicit?.trim()) return explicit.trim();
    return SANDBOX_SPREADSHEET_ID;
  }

  private sheet(spreadsheetId: string, name: string): string[][] {
    if (spreadsheetId !== this.book.id) {
      throw new ConnectorError("NOT_FOUND", `Spreadsheet ${spreadsheetId} was not found.`);
    }
    const rows = this.book.sheets[name];
    if (!rows) throw new ConnectorError("NOT_FOUND", `Sheet ${name} was not found.`);
    return rows;
  }

  readRange(input: { spreadsheetId?: string; range: string }): Promise<SheetRead> {
    const parsed = parseRange(input.range);
    const spreadsheetId = this.idFor(input.spreadsheetId);
    const values = sliceGrid(this.sheet(spreadsheetId, parsed.sheet), parsed);
    return Promise.resolve({ spreadsheetId, range: input.range, values });
  }

  appendRows(input: {
    spreadsheetId?: string;
    range: string;
    values: Cell[][];
  }): Promise<SheetAppend> {
    assertWritable(this.readOnly, "append rows");
    const parsed = parseRange(input.range);
    const spreadsheetId = this.idFor(input.spreadsheetId);
    const current = this.sheet(spreadsheetId, parsed.sheet);
    const values = input.values.map((row) => row.map(cellToString));
    const appended = appendGrid(current, values);
    this.book.sheets[parsed.sheet] = appended.rows;
    return Promise.resolve({
      spreadsheetId,
      updatedRange: updatedRange(parsed.sheet, appended.start, appended.end, appended.width),
      updatedRows: values.length,
      values,
    });
  }

  findRows(input: {
    spreadsheetId?: string;
    range: string;
    query: string;
    column?: string;
  }): Promise<SheetFind> {
    const parsed = parseRange(input.range);
    const spreadsheetId = this.idFor(input.spreadsheetId);
    const matches = findRows(
      this.sheet(spreadsheetId, parsed.sheet),
      input.query,
      input.column,
      parsed,
    );
    return Promise.resolve({
      spreadsheetId,
      range: input.range,
      query: requiredString(input.query, "query"),
      matches,
    });
  }
}
