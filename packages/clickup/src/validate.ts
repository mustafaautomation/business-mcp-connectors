import { ConnectorError, hasAny, requiredString } from "@quvantic/mcp-core";
import type { Priority, TaskWrite } from "./types.js";

const PRIORITIES = new Set<Priority>(["urgent", "high", "normal", "low"]);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function priorityOf(value: unknown): Priority | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string" && PRIORITIES.has(value as Priority)) return value as Priority;
  throw new ConnectorError("VALIDATION", "priority must be urgent, high, normal, or low.");
}

export function dueDateOf(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  const day = requiredString(value, "dueDate");
  if (!DAY.test(day)) throw new ConnectorError("VALIDATION", "dueDate must be YYYY-MM-DD.");
  return day;
}

export function stringList(value: unknown, field: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new ConnectorError("VALIDATION", `${field} must be a list of non-empty strings.`);
  }
  return value.map((item) => item.trim());
}

export function assertTaskPatch(patch: TaskWrite): void {
  if (!hasAny(patch)) {
    throw new ConnectorError("VALIDATION", "Provide at least one task field to update.");
  }
}

export const PRIORITY_ID: Record<Priority, number> = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
};

export function dueMillis(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`);
}
