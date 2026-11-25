import { ArrowRight, Shield, Terminal } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  clientConfig,
  clientTargets,
  connectors,
  disclaimer,
  faqs,
  githubUrl,
  offerLine,
  packages,
} from "@/data";
import { TryTool } from "@/TryTool";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function App() {
  return (
    <div className="min-h-screen text-ink">
      <a
        href="#connectors"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-full focus:bg-paper-2 focus:px-3 focus:py-2"
      >
        Skip to connectors
      </a>
      <div className="bg-clay px-4 py-2 text-center text-sm text-paper-2">
        {disclaimer}. Harbor & Co. is fiction.
      </div>
      <header className="sticky top-0 z-10 border-b border-line/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <a href="#top" className="font-display text-xl tracking-tight">
            Quvantic connectors
          </a>
          <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
            <a href="#try" className="hover:text-ink">
              Try it
            </a>
            <a href="#connectors" className="hover:text-ink">
              Connectors
            </a>
            <a href="#workflow" className="hover:text-ink">
              Workflow
            </a>
            <a href="#setup" className="hover:text-ink">
              Setup
            </a>
            <a href="#offer" className="hover:text-ink">
              Offer
            </a>
          </nav>
          <Button asChild>
            <a href={githubUrl} target="_blank" rel="noreferrer">
              GitHub
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-6xl px-5 pb-20 pt-12">
        <section className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-clay-dark">
              Mustafa · mustafaautomation
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] text-balance sm:text-6xl">
              MCP servers for the tools a client already pays for.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              HubSpot, ClickUp, Google Sheets, and Notion on one core: auth, retries, redacted logs,
              and a read-only switch. Sandbox mode is seeded fiction, so the demo runs before anyone
              creates a token.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild>
                <a href={githubUrl} target="_blank" rel="noreferrer">
                  View on GitHub
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="#offer">{offerLine}</a>
              </Button>
              <Button asChild variant="ghost">
                <a href="#try">Try a tool</a>
              </Button>
            </div>
            <dl className="mt-8 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt className="font-mono text-xs text-muted">Servers</dt>
                <dd className="font-display text-2xl">4</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-muted">Tools</dt>
                <dd className="font-display text-2xl">30</dd>
              </div>
              <div>
                <dt className="font-mono text-xs text-muted">Accounts</dt>
                <dd className="font-display text-2xl">0</dd>
              </div>
            </dl>
          </div>
          <figure className="overflow-hidden rounded-3xl border border-line bg-night">
            <img
              src={`${import.meta.env.BASE_URL}demo.gif`}
              alt="Terminal recording of an MCP client calling HubSpot, ClickUp, Sheets, and Notion in sandbox mode"
              className="w-full"
            />
            <figcaption className="flex items-center gap-2 px-4 py-3 font-mono text-xs text-sand">
              <Terminal className="h-3.5 w-3.5" />
              docs/demo.gif · pnpm demo · no accounts
            </figcaption>
          </figure>
        </section>

        <TryTool />

        <section id="connectors" className="mt-20">
          <h2 className="font-display text-3xl">Four connectors, same contract</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Each package is an npm bin. Tools return the same JSON in sandbox and live mode.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {connectors.map((connector) => (
              <Card key={connector.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl">{connector.name}</h3>
                      <p className="mt-1 text-sm text-muted">{connector.summary}</p>
                    </div>
                    <Badge variant="outline">{connector.bin}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs uppercase tracking-wide text-muted">Read</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {connector.reads.map((tool) => (
                      <Badge key={tool} variant="pine">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-wide text-muted">Write</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {connector.writes.map((tool) => (
                      <Badge key={tool}>{tool}</Badge>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted">{connector.scopes}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="workflow" className="mt-20 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-3xl">A won deal becomes onboarding work</h2>
            <p className="mt-3 text-muted">
              The showcase workflow watches HubSpot for stage{" "}
              <span className="font-mono">closedwon</span>, opens four ClickUp tasks, appends a row
              to the Won Deals sheet, and writes a note back on the deal. A second run skips deals
              that already have the note.
            </p>
            <div className="mt-5 flex items-start gap-3 rounded-3xl border border-line bg-moss px-4 py-3 text-sm text-pine">
              <Shield className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-medium">Read-only is global.</span> MCP_READ_ONLY=true refuses
                create and update tools on every server. The model still sees the tools, and the
                call returns READ_ONLY.
              </p>
            </div>
          </div>
          <ol className="grid gap-3">
            {[
              ["1", "HubSpot", "Find deals in closedwon. Harbor & Co. is the $48,000 retainer."],
              [
                "2",
                "ClickUp",
                "Create kickoff, access, interviews, and the week-1 plan on Client onboarding.",
              ],
              ["3", "Sheets", "Append the deal, amount, contact, and task ids to Won Deals."],
            ].map(([step, title, body]) => (
              <li key={step} className="flex gap-4 rounded-3xl border border-line bg-paper-2 p-4">
                <span className="font-display text-3xl text-clay">{step}</span>
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="font-display text-3xl">How a call moves</h2>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
            {[
              "Claude, Cursor, or Claude Code",
              "stdio MCP",
              "Connector",
              "mcp-core",
              "Sandbox or vendor API",
            ].map((step, index) => (
              <div key={step} className="rounded-2xl border border-line bg-paper-2 px-3 py-4">
                <p className="font-mono text-xs text-muted">0{index + 1}</p>
                <p className="mt-1 font-medium">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="setup" className="mt-20">
          <h2 className="font-display text-3xl">Drop the config in the client</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Replace ABSOLUTE_PATH, build the repo, and leave MCP_MODE=sandbox until a token exists.
            The same shape works in all three clients.
          </p>
          <Tabs defaultValue="cursor" className="mt-5">
            <TabsList aria-label="MCP client configs">
              {clientTargets.map((target) => (
                <TabsTrigger key={target.id} value={target.id}>
                  {target.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {clientTargets.map((target) => (
              <TabsContent key={target.id} value={target.id}>
                <Card>
                  <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted">
                      Save as <span className="font-mono text-ink">{target.where}</span>
                    </p>
                    <CopyButton value={clientConfig} />
                  </CardHeader>
                  <CardContent>
                    <pre className="overflow-x-auto rounded-2xl bg-night p-4 font-mono text-xs leading-5 text-[#f3eadf]">
                      {clientConfig}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        <section id="offer" className="mt-20">
          <h2 className="font-display text-3xl">{offerLine}</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Fixed packages from the Upwork and Fiverr offer. Recent posts in this lane sat around
            $20–48/hr. Full copy is in docs/OFFER.md.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {packages.map((item) => (
              <Card key={item.name}>
                <CardHeader>
                  <p className="text-sm text-muted">{item.name}</p>
                  <p className="font-display text-4xl">{item.price}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted">{item.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 grid gap-3">
            {faqs.map((item) => (
              <details key={item.q} className="rounded-2xl border border-line bg-paper-2 px-4 py-3">
                <summary className="cursor-pointer font-medium">{item.q}</summary>
                <p className="mt-2 text-sm text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>
            {disclaimer}.{" "}
            <a className="underline" href={githubUrl} target="_blank" rel="noreferrer">
              github.com/mustafaautomation
            </a>
          </p>
          <p>mcp-connectors.quvantic.com</p>
        </div>
      </footer>
    </div>
  );
}
