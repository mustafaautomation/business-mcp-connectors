import { ConnectorError } from "./errors.js";
import type { Logger } from "./logger.js";

export type Mode = "sandbox" | "live";

/** Fixed clock used by sandbox creates so demos and tests stay reproducible. */
export const SANDBOX_CLOCK = "2026-11-25T15:04:00.000Z";

export interface ClientOptions {
  mode?: Mode;
  readOnly?: boolean;
  argv?: readonly string[];
  env?: NodeJS.ProcessEnv;
  token?: string;
  logger?: Logger;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  baseUrl?: string;
  now?: () => Date;
  timeoutMs?: number;
  retries?: number;
}

export function resolveMode(options: ClientOptions = {}): Mode {
  if (options.mode) return options.mode;
  const argv = options.argv ?? process.argv;
  if (argv.includes("--live")) return "live";
  if (argv.includes("--sandbox")) return "sandbox";
  const env = options.env ?? process.env;
  const raw = env.MCP_MODE?.trim().toLowerCase();
  if (!raw) return "sandbox";
  if (raw === "live" || raw === "sandbox") return raw;
  throw new ConnectorError(
    "INVALID_MODE",
    `MCP_MODE must be "sandbox" or "live". Received "${raw}".`,
  );
}

export function resolveReadOnly(options: ClientOptions = {}): boolean {
  if (typeof options.readOnly === "boolean") return options.readOnly;
  const argv = options.argv ?? process.argv;
  if (argv.includes("--read-only")) return true;
  const env = options.env ?? process.env;
  const raw = env.MCP_READ_ONLY?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

export function requireEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new ConnectorError(
      "MISSING_TOKEN",
      `Live mode needs ${name}. Set it in the environment, or run with MCP_MODE=sandbox.`,
    );
  }
  return value;
}

export function optionalEnv(
  name: string,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  const value = env[name]?.trim();
  return value ? value : undefined;
}

export function resolveToken(name: string, options: ClientOptions): string {
  const explicit = options.token?.trim();
  if (explicit) return explicit;
  return requireEnv(name, options.env ?? process.env);
}

export function tokenHeaders(
  token: string,
  scheme: "bearer" | "raw",
  extra?: Record<string, string>,
): Record<string, string> {
  return {
    authorization: scheme === "bearer" ? `Bearer ${token}` : token,
    ...extra,
  };
}
