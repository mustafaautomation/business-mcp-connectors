import { describe, expect, it } from "vitest";
import {
  ConnectorError,
  Logger,
  paginate,
  redactString,
  redactUrl,
  requestJson,
  resolveMode,
  resolveReadOnly,
  resolveToken,
  SANDBOX_CLOCK,
} from "../src/index.js";

describe("mode", () => {
  it("defaults to sandbox", () => {
    expect(resolveMode({ argv: [], env: {} })).toBe("sandbox");
  });

  it("reads MCP_MODE and flags", () => {
    expect(resolveMode({ argv: [], env: { MCP_MODE: "live" } })).toBe("live");
    expect(resolveMode({ argv: ["--live"], env: { MCP_MODE: "sandbox" } })).toBe("live");
    expect(resolveMode({ argv: ["--sandbox"], env: { MCP_MODE: "live" } })).toBe("sandbox");
    expect(resolveMode({ mode: "live", argv: ["--sandbox"] })).toBe("live");
  });

  it("rejects an unknown mode", () => {
    expect(() => resolveMode({ argv: [], env: { MCP_MODE: "prod" } })).toThrow(ConnectorError);
  });

  it("treats the read-only flag and env as on", () => {
    expect(resolveReadOnly({ argv: [], env: {} })).toBe(false);
    expect(resolveReadOnly({ argv: ["--read-only"], env: {} })).toBe(true);
    expect(resolveReadOnly({ argv: [], env: { MCP_READ_ONLY: "true" } })).toBe(true);
    expect(resolveReadOnly({ argv: [], env: { MCP_READ_ONLY: "1" } })).toBe(true);
    expect(resolveReadOnly({ argv: [], env: { MCP_READ_ONLY: "yes" } })).toBe(true);
    expect(resolveReadOnly({ readOnly: false, argv: ["--read-only"] })).toBe(false);
  });

  it("requires a live token from the option or the environment", () => {
    expect(resolveToken("HUBSPOT_ACCESS_TOKEN", { token: "pat-test", env: {} })).toBe("pat-test");
    expect(() => resolveToken("HUBSPOT_ACCESS_TOKEN", { env: {} })).toThrow(/HUBSPOT_ACCESS_TOKEN/);
  });
});

describe("redaction", () => {
  it("strips bearer tokens and query secrets", () => {
    expect(redactString("Authorization: Bearer pat-super-secret")).toBe(
      "Authorization: Bearer [redacted]",
    );
    const url = redactUrl(
      "https://sheets.googleapis.com/v4/values?access_token=sekret-value&range=A1",
    );
    expect(url).not.toContain("sekret-value");
    expect(url).toContain("redacted");
  });
});

describe("logger", () => {
  it("writes stderr-shaped JSON without secrets", () => {
    const lines: string[] = [];
    const logger = new Logger("hubspot", (line) => lines.push(line));
    logger.info("http", {
      authorization: "Bearer super-secret-token",
      mode: "sandbox",
      message: "failed Bearer super-secret-token",
    });
    const line = lines.join("\n");
    expect(line).not.toContain("super-secret-token");
    expect(line).toContain("[redacted]");
    expect(line).toContain("sandbox");
    expect(line).toContain("hubspot");
  });
});

describe("pagination", () => {
  it("returns a cursor until the last page", () => {
    const first = paginate(["a", "b", "c"], 2);
    expect(first.items).toEqual(["a", "b"]);
    expect(first.nextCursor).toBe("2");
    const second = paginate(["a", "b", "c"], 2, first.nextCursor);
    expect(second.items).toEqual(["c"]);
    expect(second.nextCursor).toBeUndefined();
  });

  it("rejects a bad cursor", () => {
    expect(() => paginate(["a"], 10, "nope")).toThrow(/Cursor/);
  });
});

describe("requestJson", () => {
  it("retries 429 and does not log the bearer token", async () => {
    const lines: string[] = [];
    const logger = new Logger("hubspot", (line) => lines.push(line));
    let calls = 0;
    const slept: number[] = [];
    const body = await requestJson<{ ok: boolean }>({
      url: "https://api.example.com/crm?access_token=sekret-value",
      headers: { authorization: "Bearer sekret-value" },
      logger,
      sleep: async (ms) => {
        slept.push(ms);
      },
      fetch: async () => {
        calls += 1;
        if (calls === 1) {
          return new Response(JSON.stringify({ message: "slow down" }), {
            status: 429,
            headers: { "retry-after": "0" },
          });
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });
    expect(body.ok).toBe(true);
    expect(calls).toBe(2);
    expect(slept).toEqual([0]);
    const logged = lines.join("\n");
    expect(logged).not.toContain("sekret-value");
    expect(logged).toContain("redacted");
  });

  it("does not retry a 404", async () => {
    let calls = 0;
    await expect(
      requestJson({
        url: "https://api.example.com/missing",
        sleep: async () => undefined,
        fetch: async () => {
          calls += 1;
          return new Response(JSON.stringify({ message: "missing" }), { status: 404 });
        },
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
    expect(calls).toBe(1);
  });

  it("retries 500 and then fails", async () => {
    let calls = 0;
    await expect(
      requestJson({
        url: "https://api.example.com/boom",
        retries: 2,
        sleep: async () => undefined,
        fetch: async () => {
          calls += 1;
          return new Response(JSON.stringify({ error: { message: "down" } }), { status: 503 });
        },
      }),
    ).rejects.toMatchObject({ code: "UPSTREAM", status: 503 });
    expect(calls).toBe(3);
  });

  it("retries a network error", async () => {
    let calls = 0;
    const body = await requestJson<{ ok: boolean }>({
      url: "https://api.example.com/retry",
      sleep: async () => undefined,
      fetch: async () => {
        calls += 1;
        if (calls < 3) throw new TypeError("socket hang up");
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
    });
    expect(body.ok).toBe(true);
    expect(calls).toBe(3);
  });
});

describe("sandbox clock", () => {
  it("stays on the documented instant", () => {
    expect(SANDBOX_CLOCK).toBe("2026-11-25T15:04:00.000Z");
  });
});
