"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Copy } from "lucide-react";
import {
  Badge,
  Button,
  Drawer,
  EmptyState,
  EvidenceCard,
  GlossaryText,
  PageLoading,
  Segmented,
  Skeleton,
  Stamp,
  StatusPill,
  statusIcons,
  toast,
} from "@/design-system/components";
import { copy } from "@/content/copy";
import { useQuery } from "@/lib/use-query";
import { getControl, listControls, listRegulations } from "@/mocks/service";
import type { ControlStatus, RegulationId } from "@/mocks/types";
import { ErrorState } from "./ErrorState";

const t = copy.controls;
const statusValues = ["all", "pass", "watch", "fix"] as const;
const regTone = { dora: "brand", bcbs239: "mint", gdpr: "sun" } as const;

function isStatus(v: string | null): v is ControlStatus {
  return v === "pass" || v === "watch" || v === "fix";
}
function isRegulation(v: string | null): v is RegulationId {
  return v === "dora" || v === "bcbs239" || v === "gdpr";
}

export function Controls() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const status = isStatus(params.get("status")) ? (params.get("status") as ControlStatus) : "all";
  const regulation = isRegulation(params.get("regulation")) ? (params.get("regulation") as RegulationId) : "all";
  const openId = params.get("control");

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === "all") next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const regs = useQuery("regulations", listRegulations);
  const list = useQuery(`controls:${regulation}:${status}`, () => listControls({ regulationId: regulation, status }));

  if (list.error) return <ErrorState onRetry={list.reload} />;

  return (
    <div className="space-y-6" data-testid="controls">
      <p className="text-ink-muted">
        <GlossaryText text={t.subtitle} />
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-muted">{t.filterRegulation}</span>
          <Segmented
            label={t.filterRegulation}
            value={regulation}
            onChange={(v) => setParam("regulation", v)}
            options={[
              { value: "all" as const, label: copy.common.all },
              ...(regs.data ?? []).map((r) => ({ value: r.id, label: r.name })),
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink-muted">{t.filterStatus}</span>
          <Segmented
            label={t.filterStatus}
            value={status}
            onChange={(v) => setParam("status", v)}
            options={statusValues.map((s) => {
              if (s === "all") return { value: s, label: copy.common.all };
              const Icon = statusIcons[s];
              return {
                value: s,
                label: (
                  <>
                    <Icon className="size-4" aria-hidden />
                    {copy.status[s]}
                  </>
                ),
              };
            })}
          />
        </div>
      </div>

      {!list.data ? (
        <PageLoading label={t.loading} />
      ) : list.data.length === 0 ? (
        <EmptyState
          title={t.emptyTitle}
          body={t.emptyBody}
          action={
            <Button variant="secondary" onClick={() => router.replace(pathname, { scroll: false })}>
              {t.clearFilters}
            </Button>
          }
        />
      ) : (
        <>
          <p className="font-mono text-xs text-ink-muted" aria-live="polite" data-testid="control-count">
            {t.count(list.data.length)}
          </p>
          <ul className={`space-y-2 transition-opacity ${list.loading ? "opacity-50" : ""}`}>
            {list.data.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setParam("control", c.id)}
                  aria-label={`${c.plainTitle}. ${copy.status[c.status]}. ${t.open}`}
                  data-control={c.id}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-transform duration-200 ease-spring hover:-translate-y-0.5 hover:border-line-strong"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{c.plainTitle}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={regTone[c.regulationId]}>{copy.regulations[c.regulationId]}</Badge>
                      <span className="font-mono text-xs text-ink-muted">{c.ref}</span>
                    </span>
                  </span>
                  <StatusPill status={c.status} size="sm" />
                  <ChevronRight
                    className="size-5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <ControlDrawer id={openId} onClose={() => setParam("control", null)} />
    </div>
  );
}

function ControlDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const d = copy.controls.drawer;
  const { data, error } = useQuery(`control:${id ?? "none"}`, () => (id ? getControl(id) : Promise.resolve(null)));
  const control = data?.control;

  const copyMessage = async () => {
    if (!control) return;
    try {
      await navigator.clipboard.writeText(d.message(control));
    } catch {
      /* clipboard blocked: nothing else to do in the demo */
    }
    toast({ title: d.copiedTitle, description: d.copiedBody });
  };

  return (
    <Drawer
      open={id !== null}
      onOpenChange={(open) => !open && onClose()}
      title={control?.plainTitle ?? (error ? copy.common.errorTitle : d.loading)}
      description={control ? <span className="font-mono">{control.ref}</span> : undefined}
      footer={
        control && control.status !== "pass" ? (
          <Button variant="secondary" icon={<Copy aria-hidden />} onClick={copyMessage} data-testid="share-fix">
            {d.share}
          </Button>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState message={error.message} />
      ) : !control || !data ? (
        <div role="status" aria-label={d.loading} className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-20" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="space-y-7" data-testid="control-drawer">
          <div className="flex items-center justify-between gap-3">
            <StatusPill status={control.status} />
            {control.status === "pass" ? <Stamp /> : null}
          </div>

          <section>
            <h3 className="text-sm font-bold tracking-wide text-ink-muted uppercase">{d.whatWeFound}</h3>
            <p className="mt-2 text-base">
              <GlossaryText text={control.explanation} />
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              <GlossaryText text={control.formalTitle} />
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold tracking-wide text-ink-muted uppercase">{d.evidence}</h3>
            <ul className="mt-3 space-y-4">
              {data.evidence.map((e) => (
                <li key={e.id}>
                  <EvidenceCard evidence={e} />
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold tracking-wide text-ink-muted uppercase">{d.howToFix}</h3>
            {control.fixSteps.length === 0 ? (
              <p className="mt-2">{d.nothingToFix}</p>
            ) : (
              <div className="mt-2 rounded-2xl border border-line bg-surface p-4">
                <p className="font-semibold">{d.askTeam(control.owner)}</p>
                <ol className="mt-3 space-y-2">
                  {control.fixSteps.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-paper-deep font-mono text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">
                        <GlossaryText text={step} />
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
