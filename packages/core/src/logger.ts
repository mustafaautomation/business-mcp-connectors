import { redactValue } from "./redact.js";

export type LogSink = (line: string) => void;

/**
 * Structured logs go to stderr. MCP stdio uses stdout for the protocol,
 * and this logger never writes there. Sensitive keys and bearer tokens are redacted.
 */
export class Logger {
  constructor(
    private readonly connector: string,
    private readonly sink: LogSink = (line) => {
      process.stderr.write(`${line}\n`);
    },
  ) {}

  info(event: string, fields?: Record<string, unknown>): void {
    this.write("info", event, fields);
  }

  warn(event: string, fields?: Record<string, unknown>): void {
    this.write("warn", event, fields);
  }

  error(event: string, fields?: Record<string, unknown>): void {
    this.write("error", event, fields);
  }

  private write(level: string, event: string, fields?: Record<string, unknown>): void {
    const payload = {
      ts: new Date().toISOString(),
      level,
      connector: this.connector,
      event,
      fields: redactValue(fields ?? {}),
    };
    this.sink(JSON.stringify(payload));
  }
}
