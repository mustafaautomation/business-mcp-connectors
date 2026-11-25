import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Logger } from "./logger.js";
import type { Mode } from "./mode.js";
import { redactString } from "./redact.js";

/** Turn synchronous client throws into rejected promises so callers can `await`. */
export function asyncClient<T extends object>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => {
        try {
          return Promise.resolve(value.apply(target, args));
        } catch (error) {
          return Promise.reject(error);
        }
      };
    },
  });
}

export interface StdioHandle {
  server: McpServer;
  mode: Mode;
  readOnly: boolean;
}

export async function withInMemoryClient<T>(
  server: McpServer,
  run: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({ name: "quvantic-mcp-client", version: "0.1.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    return await run(client);
  } finally {
    await client.close();
    await server.close();
  }
}

export async function runStdioServer(load: () => StdioHandle, connector: string): Promise<void> {
  const logger = new Logger(connector);
  try {
    const started = load();
    logger.info("listening", {
      mode: started.mode,
      readOnly: started.readOnly,
      transport: "stdio",
    });
    const transport = new StdioServerTransport();
    await started.server.connect(transport);
  } catch (error) {
    logger.error("startup_failed", {
      message: redactString(error instanceof Error ? error.message : "Startup failed."),
    });
    process.exit(1);
  }
}
