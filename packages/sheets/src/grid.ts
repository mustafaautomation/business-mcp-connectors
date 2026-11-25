import { ConnectorError, requiredString } from "@quvantic/mcp-core";
import type { Cell, SheetMatch } from "./types.js";

export interface ParsedRange {
  sheet: string;
  startCol: number;
  endCol?: number;
  startRow: number;
  endRow?: number;
}

export function columnIndex(label: string): number {
  let n = 0;
  for (const char of label.toUpperCase()) {
    if (char < "A" || char > "Z") {
      throw new ConnectorError("VALIDATION", `Bad column "${label}".`);
    }
    n = n * 26 + (char.charCodeAt(0) - 64);
  }
  return n - 1;
}

export function columnLabel(index: number): string {
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

export function cellToString(value: Cell): string {
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

export function parseRange(range: string): ParsedRange {
  const trimmed = requiredString(range, "range");
  const bang = trimmed.lastIndexOf("!");
  const sheet = (bang === -1 ? trimmed : trimmed.slice(0, bang))
    .replace(/^'/, "")
    .replace(/'$/, "");
  if (!sheet) throw new ConnectorError("VALIDATION", "range needs a sheet name.");
  const a1 = bang === -1 ? "" : trimmed.slice(bang + 1);
  if (!a1) return { sheet, startCol: 0, startRow: 1 };
  const match = /^([A-Z]+)(\d+)?(?::([A-Z]+)(\d+)?)?$/i.exec(a1);
  if (!match) throw new ConnectorError("VALIDATION", `Could not parse range "${range}".`);
  const startCol = columnIndex(match[1] ?? "A");
  const startRow = match[2] ? Number(match[2]) : 1;
  const endCol = match[3] ? columnIndex(match[3]) : match[2] ? startCol : undefined;
  let endRow: number | undefined;
  if (match[4]) endRow = Number(match[4]);
  else if (match[2] && !match[3]) endRow = startRow;
  if (startRow < 1 || (endRow !== undefined && endRow < startRow)) {
    throw new ConnectorError("VALIDATION", `Range "${range}" is reversed or empty.`);
  }
  if (endCol !== undefined && endCol < startCol) {
    throw new ConnectorError("VALIDATION", `Range "${range}" is reversed or empty.`);
  }
  return {
    sheet,
    startCol,
    startRow,
    ...(endCol !== undefined ? { endCol } : {}),
    ...(endRow !== undefined ? { endRow } : {}),
  };
}

export function sliceGrid(rows: string[][], parsed: ParsedRange): string[][] {
  const startRowIndex = parsed.startRow - 1;
  const lastData = rows.length - 1;
  if (rows.length === 0 || startRowIndex > lastData) return [];
  const endRowIndex = Math.min(
    parsed.endRow !== undefined ? parsed.endRow - 1 : lastData,
    lastData,
  );
  if (endRowIndex < startRowIndex) return [];
  let endCol = parsed.endCol;
  if (endCol === undefined) {
    let width = 1;
    for (let r = startRowIndex; r <= endRowIndex; r += 1)
      width = Math.max(width, rows[r]?.length ?? 0);
    endCol = Math.max(width - 1, parsed.startCol);
  }
  const values: string[][] = [];
  for (let r = startRowIndex; r <= endRowIndex; r += 1) {
    const source = rows[r] ?? [];
    const line: string[] = [];
    for (let c = parsed.startCol; c <= endCol; c += 1) line.push(source[c] ?? "");
    values.push(line);
  }
  return values;
}

export function findInWindow(
  window: string[][],
  query: string,
  column: string | undefined,
  originRow: number,
  originCol: number,
): SheetMatch[] {
  const needle = requiredString(query, "query").toLowerCase();
  let colIndex: number | undefined;
  let skipHeader = false;
  if (column) {
    const headers = originRow === 1 ? (window[0] ?? []).map((cell) => cell.toLowerCase()) : [];
    const headerIndex = headers.indexOf(column.toLowerCase());
    if (headerIndex >= 0) {
      colIndex = headerIndex;
      skipHeader = true;
    } else if (/^[A-Z]{1,3}$/i.test(column)) {
      colIndex = columnIndex(column) - originCol;
      if (colIndex < 0) {
        throw new ConnectorError("VALIDATION", `Column ${column} is outside this range.`);
      }
    } else if (originRow !== 1) {
      throw new ConnectorError(
        "VALIDATION",
        "Named columns need a range that starts on the header row. Or pass a column letter.",
      );
    } else {
      throw new ConnectorError("VALIDATION", `Column "${column}" is not a header in this range.`);
    }
  }
  const matches: SheetMatch[] = [];
  window.forEach((line, index) => {
    if (skipHeader && index === 0) return;
    const cells = colIndex === undefined ? line : [line[colIndex] ?? ""];
    if (cells.some((cell) => cell.toLowerCase().includes(needle))) {
      matches.push({ row: originRow + index, values: line });
    }
  });
  return matches;
}

export function findRows(
  rows: string[][],
  query: string,
  column: string | undefined,
  parsed: ParsedRange,
): SheetMatch[] {
  return findInWindow(sliceGrid(rows, parsed), query, column, parsed.startRow, parsed.startCol);
}

export function appendGrid(
  rows: string[][],
  values: string[][],
): { rows: string[][]; start: number; end: number; width: number } {
  if (values.length === 0 || values.some((row) => row.length === 0)) {
    throw new ConnectorError("VALIDATION", "values needs at least one row with one cell.");
  }
  const width = Math.max(...values.map((row) => row.length));
  const copy = rows.map((row) => [...row]);
  const start = copy.length + 1;
  for (const row of values) {
    copy.push(Array.from({ length: width }, (_, index) => row[index] ?? ""));
  }
  return { rows: copy, start, end: start + values.length - 1, width };
}

export function updatedRange(sheet: string, start: number, end: number, width: number): string {
  return `${sheet}!A${start}:${columnLabel(width - 1)}${end}`;
}
