import { ConnectorError, hasAny, requiredString } from "@quvantic/mcp-core";
import type { AssociationType, CompanyWrite, ContactWrite, DealWrite } from "./types.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AMOUNT = /^\d+(\.\d{1,2})?$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeEmail(value: unknown, field = "email"): string {
  const email = requiredString(value, field).toLowerCase();
  if (!EMAIL.test(email)) {
    throw new ConnectorError("VALIDATION", `${field} is not a valid address.`);
  }
  return email;
}

export function optionalEmail(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  return normalizeEmail(value, field);
}

export function normalizeAmount(value: unknown): string {
  const amount = requiredString(value, "amount");
  if (!AMOUNT.test(amount)) {
    throw new ConnectorError("VALIDATION", "amount must be a number like 48000 or 48000.50.");
  }
  return amount;
}

export function optionalAmount(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return normalizeAmount(value);
}

export function optionalDay(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  const day = requiredString(value, field);
  if (!DAY.test(day)) {
    throw new ConnectorError("VALIDATION", `${field} must be YYYY-MM-DD.`);
  }
  return day;
}

export function optionalEmployees(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ConnectorError("VALIDATION", "employees must be a non-negative integer.");
  }
  return value;
}

export function associationType(value: unknown): AssociationType {
  if (value === "contact" || value === "company" || value === "deal") return value;
  throw new ConnectorError("VALIDATION", "objectType must be contact, company, or deal.");
}

export function optionalTimestamp(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  const text = requiredString(value, "timestamp");
  if (Number.isNaN(Date.parse(text))) {
    throw new ConnectorError("VALIDATION", "timestamp must be ISO-8601.");
  }
  return new Date(text).toISOString();
}

export function assertContactPatch(patch: ContactWrite): void {
  if (!hasAny(patch)) {
    throw new ConnectorError("VALIDATION", "Provide at least one contact field to update.");
  }
}

export function assertCompanyPatch(patch: CompanyWrite): void {
  if (!hasAny(patch)) {
    throw new ConnectorError("VALIDATION", "Provide at least one company field to update.");
  }
}

export function assertDealPatch(patch: DealWrite): void {
  if (!hasAny(patch)) {
    throw new ConnectorError("VALIDATION", "Provide at least one deal field to update.");
  }
}

export function domainOf(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  return requiredString(value, "domain").toLowerCase();
}
