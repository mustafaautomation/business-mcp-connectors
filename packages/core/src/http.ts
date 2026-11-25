import { ConnectorError } from "./errors.js";
import type { Logger } from "./logger.js";
import { redactString, redactUrl } from "./redact.js";

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function resolveUrl(base: string, path: string): string {
  const root = base.replace(/\/$/, "");
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface HttpRequest {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  logger?: Logger;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

function codeForStatus(status: number): string {
  if (status === 401 || status === 403) return "AUTH";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 400 || status === 422) return "VALIDATION";
  if (status === 429) return "RATE_LIMIT";
  return "UPSTREAM";
}

function messageFromBody(text: string, status: number): string {
  const fallback = `Upstream returned ${status}.`;
  if (!text.trim()) return fallback;
  try {
    const parsed = JSON.parse(text) as {
      message?: unknown;
      error?: unknown;
      err?: unknown;
      error_description?: unknown;
      errors?: { message?: unknown }[];
    };
    const nested =
      parsed.error && typeof parsed.error === "object" && "message" in parsed.error
        ? (parsed.error as { message?: unknown }).message
        : undefined;
    const candidate =
      (typeof parsed.message === "string" && parsed.message) ||
      (typeof nested === "string" && nested) ||
      (typeof parsed.err === "string" && parsed.err) ||
      (typeof parsed.error === "string" && parsed.error) ||
      (typeof parsed.error_description === "string" && parsed.error_description) ||
      (typeof parsed.errors?.[0]?.message === "string" && parsed.errors[0].message) ||
      fallback;
    return redactString(candidate);
  } catch {
    return redactString(text.slice(0, 300));
  }
}

function retryDelay(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  }
  return Math.min(1000 * 2 ** (attempt - 1), 8000);
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

export async function requestJson<T>(options: HttpRequest): Promise<T> {
  const method = options.method ?? "GET";
  const attempts = (options.retries ?? 2) + 1;
  const sleep = options.sleep ?? delay;
  const fetchImpl =
    options.fetch ??
    ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
      globalThis.fetch(input, init));
  const logger = options.logger;
  let networkError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 20_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const started = Date.now();
    try {
      const response = await fetchImpl(options.url, {
        method,
        headers: {
          accept: "application/json",
          "user-agent": "quvantic-mcp-connectors/0.1.0",
          ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
          ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      const text = await response.text();
      const fields = {
        method,
        url: redactUrl(options.url),
        status: response.status,
        durationMs: Date.now() - started,
        attempt,
      };
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < attempts) {
        logger?.warn("http_retry", fields);
        await sleep(retryDelay(response, attempt));
        continue;
      }
      if (!response.ok) {
        const message = messageFromBody(text, response.status);
        logger?.error("http_error", { ...fields, message });
        throw new ConnectorError(codeForStatus(response.status), message, response.status);
      }
      logger?.info("http", fields);
      if (!text.trim()) return undefined as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new ConnectorError("UPSTREAM", "Upstream response was not valid JSON.");
      }
    } catch (error) {
      if (error instanceof ConnectorError) throw error;
      networkError = error;
      if (attempt < attempts) {
        logger?.warn("http_retry", {
          method,
          url: redactUrl(options.url),
          attempt,
          message: redactString(error instanceof Error ? error.message : "Network request failed."),
        });
        await sleep(Math.min(1000 * 2 ** (attempt - 1), 8000));
        continue;
      }
      if (isAbort(error)) {
        throw new ConnectorError("TIMEOUT", "The upstream API timed out.");
      }
      throw new ConnectorError(
        "NETWORK",
        redactString(error instanceof Error ? error.message : "Network request failed."),
      );
    } finally {
      clearTimeout(timer);
    }
  }

  throw new ConnectorError(
    "NETWORK",
    redactString(networkError instanceof Error ? networkError.message : "Network request failed."),
  );
}
