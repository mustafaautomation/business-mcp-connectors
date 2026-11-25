import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Example {
  tool: string;
  label: string;
  arguments: Record<string, unknown>;
}

interface Catalog {
  tools: { name: string; title: string; description: string }[];
  examples: Example[];
}

export function TryTool() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState("");
  const [argsText, setArgsText] = useState("{}");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string>("");
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/sandbox", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Sandbox returned ${response.status}.`);
        return (await response.json()) as Catalog;
      })
      .then((data) => {
        setCatalog(data);
        const first = data.examples[0];
        if (first) {
          setTool(first.tool);
          setArgsText(JSON.stringify(first.arguments, null, 2));
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLoadError(error instanceof Error ? error.message : "The sandbox API did not respond.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  function applyExample(next: string) {
    setTool(next);
    const example = catalog?.examples.find((item) => item.tool === next);
    setArgsText(JSON.stringify(example?.arguments ?? {}, null, 2));
    setResult("");
    setCallError(null);
  }

  async function run() {
    setCallError(null);
    setResult("");
    let args: unknown;
    try {
      args = JSON.parse(argsText) as unknown;
    } catch {
      setCallError("Arguments must be a JSON object.");
      return;
    }
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      setCallError("Arguments must be a JSON object.");
      return;
    }
    setRunning(true);
    try {
      const response = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tool, arguments: args }),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        result?: unknown;
        error?: { message?: string };
      };
      if (!response.ok || body.ok === false) {
        setCallError(body.error?.message ?? `Call failed (${response.status}).`);
        return;
      }
      setResult(JSON.stringify(body.result, null, 2));
    } catch (error) {
      setCallError(error instanceof Error ? error.message : "Call failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section id="try" className="mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl">Try a tool</h2>
          <p className="mt-2 max-w-2xl text-muted">
            This panel calls the read-only sandbox. The same fiction is what{" "}
            <span className="font-mono text-ink">/mcp</span> serves over Streamable HTTP. Writes
            stay on a server you run yourself.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-line bg-paper-2 p-5">
          {loading ? <p className="text-sm text-muted">Loading sandbox tools…</p> : null}
          {loadError ? (
            <p className="text-sm text-clay-dark" role="alert">
              {loadError} Start the site with <span className="font-mono">pnpm dev:site</span>,
              which builds the packages and mounts the sandbox API.
            </p>
          ) : null}
          {catalog && catalog.tools.length === 0 ? (
            <p className="text-sm text-muted">No read tools are published.</p>
          ) : null}
          {catalog && catalog.tools.length > 0 ? (
            <form
              className="grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void run();
              }}
            >
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Tool</span>
                <select
                  className="h-11 rounded-2xl border border-line bg-paper px-3"
                  value={tool}
                  onChange={(event) => applyExample(event.target.value)}
                >
                  {catalog.examples.map((example) => (
                    <option key={example.tool} value={example.tool}>
                      {example.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-muted">
                {catalog.tools.find((item) => item.name === tool)?.description}
              </p>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">Arguments</span>
                <textarea
                  className="min-h-36 rounded-2xl border border-line bg-night p-3 font-mono text-xs text-[#f3eadf]"
                  value={argsText}
                  spellCheck={false}
                  onChange={(event) => setArgsText(event.target.value)}
                />
              </label>
              <Button type="submit" disabled={running || tool === ""}>
                {running ? "Running…" : "Run tool"}
              </Button>
              {callError ? (
                <p className="text-sm text-clay-dark" role="alert">
                  {callError}
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
        <pre className="min-h-64 overflow-auto rounded-3xl bg-night p-4 font-mono text-xs leading-5 text-[#f3eadf]">
          {result || "Results land here. Start with the won deals."}
        </pre>
      </div>
    </section>
  );
}
