import { ConnectorError } from "@quvantic/mcp-core";

export function assertFilterPair(property: string | undefined, value: string | undefined): void {
  if ((property === undefined) !== (value === undefined)) {
    throw new ConnectorError("VALIDATION", "filterProperty and filterValue must be sent together.");
  }
}

export function matchesProperty(
  properties: Record<string, string>,
  schema: Record<string, string>,
  name: string,
  value: string,
): boolean {
  const type = schema[name];
  if (!type) throw new ConnectorError("VALIDATION", `Property ${name} is not on this database.`);
  const current = properties[name] ?? "";
  if (type === "select" || type === "status" || type === "checkbox") {
    return current.toLowerCase() === value.toLowerCase();
  }
  if (type === "number") {
    if (!Number.isFinite(Number(value))) {
      throw new ConnectorError("VALIDATION", "number filters need a number.");
    }
    return Number(current) === Number(value);
  }
  return current.toLowerCase().includes(value.toLowerCase());
}

export function notionApiFilter(
  name: string,
  type: string,
  value: string,
): Record<string, unknown> {
  if (type === "title") return { property: name, title: { contains: value } };
  if (type === "rich_text") return { property: name, rich_text: { contains: value } };
  if (type === "select") return { property: name, select: { equals: value } };
  if (type === "status") return { property: name, status: { equals: value } };
  if (type === "url") return { property: name, url: { contains: value } };
  if (type === "email") return { property: name, email: { contains: value } };
  if (type === "phone_number") return { property: name, phone_number: { contains: value } };
  if (type === "checkbox") {
    if (value !== "true" && value !== "false") {
      throw new ConnectorError("VALIDATION", "checkbox filters use true or false.");
    }
    return { property: name, checkbox: { equals: value === "true" } };
  }
  if (type === "number") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
      throw new ConnectorError("VALIDATION", "number filters need a number.");
    return { property: name, number: { equals: parsed } };
  }
  return { property: name, rich_text: { contains: value } };
}
