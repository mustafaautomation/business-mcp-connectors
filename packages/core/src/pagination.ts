import { ConnectorError } from "./errors.js";

export interface Page<T> {
  items: T[];
  nextCursor?: string;
}

export function decodeOffset(cursor: string | undefined): number {
  if (cursor === undefined || cursor === "") return 0;
  if (!/^\d+$/.test(cursor)) {
    throw new ConnectorError("INVALID_CURSOR", "Cursor is not valid for this collection.");
  }
  return Number(cursor);
}

export function paginate<T>(items: readonly T[], limit: number, cursor?: string): Page<T> {
  const start = decodeOffset(cursor);
  const slice = items.slice(start, start + limit);
  const next = start + limit < items.length ? String(start + limit) : undefined;
  return next === undefined ? { items: [...slice] } : { items: [...slice], nextCursor: next };
}
