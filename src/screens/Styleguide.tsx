"use client";

import { useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import {
  Accordion,
  Badge,
  Button,
  Card,
  ChoiceCard,
  Confetti,
  CreditCounter,
  DataTable,
  Drawer,
  EmptyState,
  EvidenceCard,
  Field,
  GlossaryText,
  Input,
  Logo,
  Modal,
  PlanCard,
  ScoreGauge,
  Segmented,
  Stamp,
  StatusPill,
  Stepper,
  Stubby,
  Term,
  ThemeToggle,
  toast,
} from "@/design-system/components";

const swatches = [
  ["paper", "bg-paper"],
  ["paper-deep", "bg-paper-deep"],
  ["surface", "bg-surface"],
  ["ink", "bg-ink"],
  ["ink-muted", "bg-ink-muted"],
  ["brand", "bg-brand"],
  ["brand-soft", "bg-brand-soft"],
  ["mint", "bg-mint"],
  ["sun", "bg-sun"],
  ["status-pass", "bg-pass"],
  ["status-watch", "bg-watch"],
  ["status-fix", "bg-fix"],
  ["line", "bg-line"],
  ["line-strong", "bg-line-strong"],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-10" data-section={title}>
      <h2 className="mb-6 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

const sampleRows = [
  { id: "INV-1042", what: "5-pack of report credits", amount: "€1,690" },
  { id: "INV-1041", what: "One report credit", amount: "€390" },
];

export function Styleguide() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [choice, setChoice] = useState(true);
  const [step, setStep] = useState(1);
  const [stampKey, setStampKey] = useState(0);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between gap-4 pb-8">
        <div>
          <Logo />
          <h1 className="mt-4 text-4xl font-extrabold">Design system</h1>
          <p className="mt-2 max-w-prose text-ink-muted">
            Fintech that smiles: calm enough for a bank, with a receipt-paper motif and springy motion. Every screen
            uses only these tokens and components.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Colour tokens">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {swatches.map(([name, cls]) => (
            <li key={name}>
              <div className={`h-16 rounded-2xl border border-line ${cls}`} />
              <p className="mt-1.5 font-mono text-xs">{name}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type">
        <div className="space-y-3">
          <p className="font-heading text-5xl font-extrabold">Bricolage Grotesque for headings</p>
          <p className="text-lg">Inter for body text. Plain words, short sentences, one idea at a time.</p>
          <p className="tabular font-mono text-lg">JetBrains Mono for numbers: 72 / 100 · bcbs-p3-01 · €1,690</p>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Generate audit report</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button icon={<Sparkles aria-hidden />}>With icon</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Status pill">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status="pass" />
          <StatusPill status="watch" />
          <StatusPill status="fix" />
          <StatusPill status="pass" size="sm" />
          <StatusPill status="watch" size="sm" />
          <StatusPill status="fix" size="sm" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="brand">DORA</Badge>
          <Badge tone="mint">BCBS 239</Badge>
          <Badge tone="sun">GDPR</Badge>
        </div>
      </Section>

      <Section title="Score gauge">
        <div className="flex flex-wrap items-end gap-8">
          <ScoreGauge score={72} />
          <ScoreGauge score={91} size={180} />
          <ScoreGauge score={38} size={180} />
        </div>
      </Section>

      <Section title="Evidence card">
        <div className="grid gap-5 sm:grid-cols-2">
          <EvidenceCard
            evidence={{
              type: "lineage",
              source: "system.access.table_lineage",
              summary: "38 of 41 risk tables trace back to their source systems.",
              details: "3 tables are fed by hand-run notebooks.",
              capturedAt: "2026-11-10T06:12:00Z",
            }}
          />
          <EvidenceCard
            evidence={{
              type: "access_grant",
              source: "system.information_schema.table_privileges",
              summary: "Customer tables can be read by 4 groups and no individual users.",
              details: "",
              capturedAt: "2026-11-10T06:12:00Z",
            }}
          />
        </div>
      </Section>

      <Section title="Stamp">
        <div className="flex items-center gap-8">
          <Stamp key={`a${stampKey}`} size="sm" />
          <Stamp key={`b${stampKey}`} delay={0.1} />
          <Stamp key={`c${stampKey}`} size="lg" delay={0.2} />
          <Button variant="secondary" size="sm" onClick={() => setStampKey((k) => k + 1)}>
            Stamp again
          </Button>
        </div>
      </Section>

      <Section title="Stepper">
        <Stepper steps={["Company", "Regulations", "Connect", "First scan"]} current={step} />
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Back
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setStep((s) => Math.min(3, s + 1))}>
            Next
          </Button>
        </div>
      </Section>

      <Section title="Drawer and modal">
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setDrawer(true)}>
            Open drawer
          </Button>
          <Button variant="secondary" onClick={() => setModal(true)}>
            Open modal
          </Button>
        </div>
        <Drawer
          open={drawer}
          onOpenChange={setDrawer}
          title="Can you show where your risk numbers come from?"
          description="BCBS 239, Principle 3 (Accuracy and integrity)"
          footer={<Button variant="secondary">Copy message</Button>}
        >
          <p>
            <GlossaryText text="38 of 41 risk tables have full lineage back to source. 3 tables were built by hand-run notebooks." />
          </p>
        </Drawer>
        <Modal
          open={modal}
          onOpenChange={setModal}
          title="You’ve used your free report"
          description="Pick how you’d like to keep going."
        >
          <Button onClick={() => setModal(false)}>Sounds good</Button>
        </Modal>
      </Section>

      <Section title="Data table">
        <DataTable
          caption="Sample invoices"
          rows={sampleRows}
          rowKey={(r) => r.id}
          columns={[
            { key: "id", header: "Invoice", render: (r) => <span className="font-mono">{r.id}</span> },
            { key: "what", header: "What", render: (r) => r.what },
            { key: "amount", header: "Amount", align: "right", render: (r) => <span className="font-mono">{r.amount}</span> },
          ]}
        />
      </Section>

      <Section title="Plan card">
        <div className="mb-5">
          <Segmented
            label="Billing period"
            value={billing}
            onChange={setBilling}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "annual", label: "Annual" },
            ]}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <PlanCard
            name="Team"
            price={billing === "monthly" ? "€990" : "€825"}
            period="per month"
            note={billing === "annual" ? "2 months free" : undefined}
            bestFor="A compliance team reporting quarterly"
            features={["4 reports every month", "10 seats"]}
            action={<Button className="w-full">Start free trial</Button>}
            highlighted
            badge="Most popular"
          />
          <PlanCard
            name="Pay as you go"
            price="€390"
            period="per report"
            bestFor="One or two audits a year"
            features={["Credits never expire", "3 seats"]}
            action={
              <Button variant="secondary" className="w-full">
                Start free trial
              </Button>
            }
          />
        </div>
      </Section>

      <Section title="Credit counter">
        <div className="flex flex-wrap gap-3">
          <CreditCounter credits={1} />
          <CreditCounter credits={5} />
          <CreditCounter credits={0} />
        </div>
      </Section>

      <Section title="Empty state with Stubby">
        <div className="grid gap-5 sm:grid-cols-2">
          <EmptyState
            title="No reports yet"
            body="Your audit reports will show up here. The first one is free."
            action={<Button variant="secondary">Generate audit report</Button>}
          />
          <Card className="flex items-end justify-around">
            <Stubby mood="happy" />
            <Stubby mood="curious" />
            <Stubby mood="party" />
            <Stubby mood="sleepy" />
          </Card>
        </div>
      </Section>

      <Section title="Toast">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => toast({ title: "Copied", description: "The message is on your clipboard." })}>
            Success toast
          </Button>
          <Button variant="secondary" onClick={() => toast({ title: "Heads up", description: "Your trial ends in 3 days.", tone: "warning" })}>
            Warning toast
          </Button>
          <Button variant="secondary" onClick={() => setConfetti((c) => c + 1)}>
            Confetti
          </Button>
          {confetti > 0 ? <Confetti key={confetti} /> : null}
        </div>
      </Section>

      <Section title="Form controls and glossary">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Work email" htmlFor="sg-email" hint="Any email works in this demo.">
            <Input id="sg-email" type="email" placeholder="you@company.com" />
          </Field>
          <Field label="Card number" htmlFor="sg-card" error="This demo only takes the test card.">
            <Input id="sg-card" aria-invalid defaultValue="1234" />
          </Field>
          <ChoiceCard
            type="checkbox"
            name="sg-choice"
            checked={choice}
            onChange={setChoice}
            title="DORA"
            description="Can your systems cope with trouble?"
          />
          <p className="self-center">
            Hover a word: <Term k="lineage" />, <Term k="unityCatalog" />, <Term k="dataOwner" />.
          </p>
        </div>
        <div className="mt-6">
          <Accordion
            items={[
              { q: "What counts as a report?", a: "One report covers one regulation for the workspaces you pick." },
              { q: "Do credits expire?", a: "No. Credits you buy never expire." },
            ]}
          />
        </div>
      </Section>
    </main>
  );
}
