import type { Mode } from "@quvantic/mcp-core";

export const SANDBOX_SPREADSHEET_ID = "revenue-ops";

export interface SheetRead {
  spreadsheetId: string;
  range: string;
  values: string[][];
}

export interface SheetAppend {
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
  values: string[][];
}

export interface SheetMatch {
  row: number;
  values: string[];
}

export interface SheetFind {
  spreadsheetId: string;
  range: string;
  query: string;
  matches: SheetMatch[];
}

export type Cell = string | number | boolean;

export interface SheetsClient {
  readonly mode: Mode;
  readonly readOnly: boolean;
  readRange(input: { spreadsheetId?: string; range: string }): Promise<SheetRead>;
  appendRows(input: {
    spreadsheetId?: string;
    range: string;
    values: Cell[][];
  }): Promise<SheetAppend>;
  findRows(input: {
    spreadsheetId?: string;
    range: string;
    query: string;
    column?: string;
  }): Promise<SheetFind>;
}
