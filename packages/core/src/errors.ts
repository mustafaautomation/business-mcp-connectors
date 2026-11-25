export class ConnectorError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "ConnectorError";
    this.code = code;
    this.status = status;
  }
}

export class ReadOnlyError extends ConnectorError {
  constructor(action: string) {
    super(
      "READ_ONLY",
      `Read-only mode is on. Refusing to ${action}. Unset MCP_READ_ONLY or drop --read-only to allow writes.`,
    );
    this.name = "ReadOnlyError";
  }
}

export function assertWritable(readOnly: boolean, action: string): void {
  if (readOnly) {
    throw new ReadOnlyError(action);
  }
}

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ConnectorError("VALIDATION", `${field} is required.`);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ConnectorError("VALIDATION", "Expected a string.");
  }
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function clampLimit(limit: number | undefined, fallback = 10, max = 100): number {
  if (limit === undefined) return fallback;
  if (!Number.isInteger(limit) || limit < 1 || limit > max) {
    throw new ConnectorError("VALIDATION", `limit must be an integer from 1 to ${max}.`);
  }
  return limit;
}

export function hasAny(patch: object): boolean {
  return Object.values(patch).some((value) => value !== undefined);
}
