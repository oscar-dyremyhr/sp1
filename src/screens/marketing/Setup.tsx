import { ArrowRight, Ban, Check, Database, GitBranch, Plug } from "lucide-react";
import { ButtonLink, Card, CodeBlock, DataTable } from "@/design-system/components";
import { setupGuide as g, setupScripts } from "@/content/setup";

const channelIcons = [Database, Plug, GitBranch];

function Script({ id, label }: { id: keyof typeof setupScripts; label: string }) {
  return <CodeBlock className="mt-4" code={setupScripts[id]} label={label} copyLabel={g.copyLabel} copiedMessage={g.copied} />;
}

/** /setup — the guide a compliance officer sends to their data platform engineer. */
export function Setup() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-14" data-testid="setup-guide">
      <h1 className="text-4xl font-extrabold md:text-5xl">{g.title}</h1>
      <p className="mt-3 text-lg text-ink-muted">{g.subtitle}</p>
      <p className="mt-4 rounded-2xl bg-sun px-4 py-3 text-sm text-on-accent">{g.sampleNote}</p>

      {/* ---------- How it talks ---------- */}
      <section aria-labelledby="setup-how" className="mt-12">
        <h2 id="setup-how" className="text-2xl font-bold">
          {g.how.title}
        </h2>
        <p className="mt-2 max-w-prose text-ink-muted">{g.how.body}</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {g.how.flow.map((f, i) => (
            <li key={f.name} className="relative rounded-2xl border border-line bg-surface p-4">
              <span className="font-mono text-xs text-ink-muted">0{i + 1}</span>
              <h3 className="mt-1 font-bold">{f.name}</h3>
              <p className="mt-1 text-sm text-ink-muted">{f.body}</p>
              {i < g.how.flow.length - 1 ? (
                <ArrowRight className="absolute top-1/2 -right-3.5 z-10 size-6 -translate-y-1/2 rounded-full bg-paper p-1 text-ink-muted max-md:hidden" aria-hidden />
              ) : null}
            </li>
          ))}
        </ol>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {g.how.channels.map((c, i) => {
            const Icon = channelIcons[i];
            return (
              <li key={c.name} className="rounded-2xl bg-paper-deep p-4">
                <span className="flex items-center gap-2 font-semibold">
                  <Icon className="size-4 text-brand" aria-hidden />
                  {c.name}
                </span>
                <p className="mt-1.5 font-mono text-xs break-words text-ink-muted">{c.via}</p>
                <p className="mt-1.5 text-sm">{c.used}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Steps ---------- */}
      <section aria-labelledby="setup-steps" className="mt-14">
        <h2 id="setup-steps" className="text-2xl font-bold">
          {g.stepsTitle}
        </h2>
        <ol className="mt-6 space-y-5">
          {g.steps.map((step, i) => (
            <li key={step.title}>
              <Card className="shadow-none">
                <div className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-sm font-bold text-brand-ink">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold">{step.title}</h3>
                    <p className="mt-1 text-ink-muted">{step.body}</p>
                    {"script" in step && step.script ? <Script id={step.script} label={step.scriptLabel} /> : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Permissions ---------- */}
      <section aria-labelledby="setup-perms" className="mt-14">
        <h2 id="setup-perms" className="mb-5 text-2xl font-bold">
          {g.permissions.title}
        </h2>
        <DataTable
          caption={g.permissions.title}
          rows={g.permissions.rows}
          rowKey={(r) => r.what}
          className="shadow-none"
          columns={[
            { key: "what", header: g.permissions.cols.what, className: "w-[34%]", render: (r) => <span className="font-mono text-xs font-semibold">{r.what}</span> },
            { key: "why", header: g.permissions.cols.why, render: (r) => r.why },
            { key: "allows", header: g.permissions.cols.allows, render: (r) => <span className="text-ink-muted">{r.allows}</span> },
          ]}
        />
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="shadow-none">
          <h2 className="text-xl font-bold">{g.never.title}</h2>
          <ul className="mt-4 space-y-2.5">
            {g.never.items.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm">
                <Ban className="mt-0.5 size-4 shrink-0 text-fix-ink" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="shadow-none">
          <h2 className="text-xl font-bold">{g.extras.title}</h2>
          <dl className="mt-4 space-y-3">
            {g.extras.items.map((item) => (
              <div key={item.title}>
                <dt className="flex items-center gap-2 text-sm font-semibold">
                  <Check className="size-4 shrink-0 text-pass-ink" aria-hidden />
                  {item.title}
                </dt>
                <dd className="mt-0.5 pl-6 text-sm text-ink-muted">{item.body}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
      <Script id="revoke" label={g.extras.scriptLabel} />

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-card bg-brand px-8 py-8 text-brand-ink">
        <div>
          <h2 className="text-2xl font-extrabold">{g.done.title}</h2>
          <p className="mt-1">{g.done.body}</p>
        </div>
        <ButtonLink href="/app/welcome" className="bg-surface text-ink">
          {g.done.back}
          <ArrowRight aria-hidden />
        </ButtonLink>
      </div>
    </div>
  );
}
