const SENSITIVE_KEY = /authorization|token|secret|password|api[-_]?key|private[-_]?key|credential/i;

export function redactString(input: string): string {
  return input
    .replace(/Bearer\s+[A-Za-z0-9._\-+/=]+/gi, "Bearer [redacted]")
    .replace(/(access_token|api_key|token|key)=([^&\s]+)/gi, "$1=[redacted]");
}

export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const param of ["access_token", "token", "key", "api_key"]) {
      if (parsed.searchParams.has(param)) parsed.searchParams.set(param, "[redacted]");
    }
    return parsed.toString();
  } catch {
    return redactString(url);
  }
}

export function redactValue(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [childKey, child] of Object.entries(value)) {
      output[childKey] = redactValue(child, childKey);
    }
    return output;
  }
  return value;
}
