"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Database, FolderTree, Lightbulb, Plus, Save, Search, Table2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  GlossaryText,
  Input,
  PageLoading,
  Stubby,
  toast,
} from "@/design-system/components";
import { copy } from "@/content/copy";
import { TAG_FAMILIES, countTables, isCovered, isPartial, mapFindings, togglePath } from "@/lib/datamap";
import { formatDateTime } from "@/lib/format";
import { useQuery } from "@/lib/use-query";
import { getDataMap, saveDataMap, type DataMapInfo } from "@/mocks/service";
import type { DataMap, DataRole, MapRecommendation, Policies, TagKey } from "@/mocks/types";
import { cn } from "@/lib/utils";
import { ErrorState } from "./ErrorState";

const t = copy.dataMap;
const roleOrder: DataRole[] = ["risk", "board", "personal", "test"];
const tagOrder: TagKey[] = ["pii", "criticality", "sensitivity", "owner", "retention", "purpose", "businessService"];
const policyOrder: (keyof Policies)[] = ["adminLimit", "historyDays", "restoreTestMonths", "loadDeadline"];

export function DataMapScreen() {
  const { data, error, reload } = useQuery("data-map", getDataMap);
  if (error) return <ErrorState onRetry={reload} />;
  if (!data) return <PageLoading label={t.loading} />;
  return <Editor key={data.map.confirmedAt ?? "guess"} info={data} />;
}

function TriCheckbox({ checked, partial, onChange, label }: { checked: boolean; partial: boolean; onChange: () => void; label: string }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = partial;
      }}
      onChange={onChange}
      className="size-4 shrink-0 accent-(--brand)"
    />
  );
}

function Editor({ info }: { info: DataMapInfo }) {
  const { structure, tags } = info;
  const [map, setMap] = useState<DataMap>(info.map);
  const [savedAt, setSavedAt] = useState(info.map.confirmedAt);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<DataRole>("risk");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set(info.map.roles.risk.map((p) => p.split(".")[0])));

  const change = (next: DataMap) => {
    setMap(next);
    setDirty(true);
  };
  const paths = map.roles[role];
  const toggle = (path: string) => change({ ...map, roles: { ...map.roles, [role]: togglePath(paths, path, structure) } });
  const toggleOpen = (path: string) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const totals = useMemo(
    () => ({
      schemas: structure.reduce((n, c) => n + c.schemas.length, 0),
      tables: structure.reduce((n, c) => n + c.schemas.reduce((m, s) => m + s.tables.length, 0), 0),
    }),
    [structure],
  );

  const q = query.trim().toLowerCase();
  const visible = structure
    .map((c) => ({
      ...c,
      schemas: c.schemas
        .map((s) => ({
          ...s,
          tables: s.tables.filter((tb) => !q || tb.includes(q) || s.name.includes(q) || c.name.includes(q)),
        }))
        .filter((s) => !q || s.tables.length > 0 || s.name.includes(q) || c.name.includes(q)),
    }))
    .filter((c) => !q || c.schemas.length > 0 || c.name.includes(q));

  const recommendations = useMemo<MapRecommendation[]>(() => {
    const f = mapFindings(map, structure, tags);
    const r = t.recs;
    return [
      ...f.emptyRoles.map((x) => ({ id: `empty-${x}`, ...r.emptyRole(t.roles[x].name, t.roles[x].checks) })),
      ...f.strayBoard.map((table) => ({ id: `board-${table}`, ...r.strayBoard(table), action: { label: r.add, role: "board" as const, path: table } })),
      ...f.strayTest.map((c) => ({ id: `test-${c}`, ...r.strayTest(c), action: { label: r.add, role: "test" as const, path: c } })),
      ...f.duplicateTags.map((d) => ({ id: `dup-${d.other}`, ...r.duplicateTag(d.chosen, d.other, d.count, d.on) })),
      ...f.singleTables.map((x) => ({ id: `single-${x.role}`, ...r.singleTables(t.roles[x.role].name, x.count) })),
      { id: "inherit-owner", ...r.inheritOwner },
    ];
  }, [map, structure, tags]);

  const applyRec = (rec: MapRecommendation) => {
    const a = rec.action;
    if (!a?.role || !a.path) return;
    change({ ...map, roles: { ...map.roles, [a.role]: togglePath(map.roles[a.role], a.path, structure) } });
    toast({ title: t.recs.added });
  };

  const save = async () => {
    setSaving(true);
    const saved = await saveDataMap(map);
    setMap(saved);
    setSavedAt(saved.confirmedAt);
    setDirty(false);
    setSaving(false);
    toast({ title: t.saved, description: t.savedBody });
  };

  return (
    <div className="space-y-6 pb-24" data-testid="data-map">
      <p className="max-w-3xl text-ink-muted">
        <GlossaryText text={t.subtitle} />
      </p>

      {savedAt ? null : (
        <div className="flex items-center gap-4 rounded-card bg-sun px-6 py-4 text-on-accent" data-testid="map-guess">
          <Stubby mood="curious" size={52} />
          <div>
            <p className="font-heading text-lg font-bold">{t.guessTitle}</p>
            <p className="text-sm">{t.guessBody}</p>
          </div>
        </div>
      )}

      {/* ---------- Where things live ---------- */}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">{t.rolesTitle}</h2>
          <p className="font-mono text-xs text-ink-muted">{t.structureNote(structure.length, totals.schemas, totals.tables)}</p>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">
          <GlossaryText text={t.rolesBody} />
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-[18rem_1fr]">
          <div role="radiogroup" aria-label={t.rolesAria} className="space-y-2">
            {roleOrder.map((r) => {
              const active = r === role;
              return (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-role={r}
                  onClick={() => {
                    setRole(r);
                    setOpen(new Set(map.roles[r].map((p) => p.split(".")[0])));
                  }}
                  className={cn(
                    "block w-full rounded-2xl border bg-surface p-3.5 text-left transition-transform duration-200 ease-spring hover:-translate-y-0.5",
                    active ? "border-brand ring-1 ring-brand" : "border-line-strong",
                  )}
                >
                  <span className="block font-semibold">{t.roles[r].name}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{t.roles[r].description}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={map.roles[r].length ? "mint" : "sun"} data-testid={`covered-${r}`}>
                      {t.covered(countTables(map.roles[r], structure))}
                    </Badge>
                    <span className="text-xs text-ink-muted">{t.usedBy(t.roles[r].checks)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="min-w-0 rounded-2xl border border-line">
            <div className="relative border-b border-line p-3">
              <Search className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.search}
                aria-label={t.search}
                className="pl-9"
              />
            </div>
            <ul aria-label={t.treeAria(t.roles[role].name)} className="max-h-[28rem] overflow-y-auto p-2">
              {visible.length === 0 ? <li className="px-3 py-6 text-center text-sm text-ink-muted">{t.searchEmpty}</li> : null}
              {visible.map((c) => {
                const catalogOpen = q ? true : open.has(c.name);
                const tablesInCatalog = c.schemas.reduce((n, s) => n + s.tables.length, 0);
                return (
                  <li key={c.name}>
                    <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-ink/5">
                      <button
                        type="button"
                        onClick={() => toggleOpen(c.name)}
                        aria-expanded={catalogOpen}
                        aria-label={t.toggle(c.name)}
                        className="rounded-md p-1 text-ink-muted hover:text-ink"
                      >
                        <ChevronRight className={cn("size-4 transition-transform", catalogOpen && "rotate-90")} aria-hidden />
                      </button>
                      <TriCheckbox checked={isCovered(paths, c.name)} partial={isPartial(paths, c.name)} onChange={() => toggle(c.name)} label={c.name} />
                      <Database className="size-4 shrink-0 text-brand" aria-hidden />
                      <span className="font-mono text-sm font-semibold">{c.name}</span>
                      <span className="ml-auto text-xs whitespace-nowrap text-ink-muted">
                        {c.workspace} · {t.tablesIn(tablesInCatalog)}
                      </span>
                    </div>
                    {catalogOpen ? (
                      <ul className="ml-6 border-l border-line pl-2">
                        {c.schemas.map((s) => {
                          const schemaPath = `${c.name}.${s.name}`;
                          const schemaOpen = q ? true : open.has(schemaPath);
                          return (
                            <li key={s.name}>
                              <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-ink/5">
                                <button
                                  type="button"
                                  onClick={() => toggleOpen(schemaPath)}
                                  aria-expanded={schemaOpen}
                                  aria-label={t.toggle(schemaPath)}
                                  className="rounded-md p-1 text-ink-muted hover:text-ink"
                                >
                                  <ChevronRight className={cn("size-4 transition-transform", schemaOpen && "rotate-90")} aria-hidden />
                                </button>
                                <TriCheckbox
                                  checked={isCovered(paths, schemaPath)}
                                  partial={isPartial(paths, schemaPath)}
                                  onChange={() => toggle(schemaPath)}
                                  label={schemaPath}
                                />
                                <FolderTree className="size-4 shrink-0 text-ink-muted" aria-hidden />
                                <span className="font-mono text-sm">{s.name}</span>
                                <span className="ml-auto text-xs text-ink-muted">{t.tablesIn(s.tables.length)}</span>
                              </div>
                              {schemaOpen ? (
                                <ul className="ml-6 border-l border-line pl-2">
                                  {s.tables.map((tb) => {
                                    const tablePath = `${schemaPath}.${tb}`;
                                    return (
                                      <li key={tb}>
                                        <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 pl-9 hover:bg-ink/5">
                                          <TriCheckbox checked={isCovered(paths, tablePath)} partial={false} onChange={() => toggle(tablePath)} label={tablePath} />
                                          <Table2 className="size-4 shrink-0 text-ink-muted" aria-hidden />
                                          <span className="font-mono text-sm break-all">{tb}</span>
                                        </label>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Card>

      {/* ---------- Tags ---------- */}
      <Card>
        <h2 className="text-lg font-bold">{t.tagsTitle}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          <GlossaryText text={t.tagsBody} />
        </p>
        <ul className="mt-4 divide-y divide-line">
          {tagOrder.map((key) => {
            const setting = map.tags[key];
            const found = tags.find((x) => x.name === setting.name);
            const alternatives = tags.filter((x) => x.name !== setting.name && TAG_FAMILIES[key].includes(x.name));
            const setTag = (patch: Partial<typeof setting>) => change({ ...map, tags: { ...map.tags, [key]: { ...setting, ...patch } } });
            return (
              <li key={key} className="grid gap-x-6 gap-y-3 py-4 md:grid-cols-[16rem_1fr]">
                <div>
                  <p className="font-semibold">{t.tags[key].name}</p>
                  <p className="text-sm text-ink-muted">{t.tags[key].description}</p>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-3">
                    <Field label={t.tagName} htmlFor={`tag-${key}`} className="min-w-44 flex-1">
                      <Input id={`tag-${key}`} value={setting.name} onChange={(e) => setTag({ name: e.target.value })} className="font-mono" />
                    </Field>
                    {setting.value !== undefined ? (
                      <Field label={t.tagValue} htmlFor={`tag-${key}-value`} className="min-w-44 flex-1">
                        <Input id={`tag-${key}-value`} value={setting.value} onChange={(e) => setTag({ value: e.target.value })} className="font-mono" />
                      </Field>
                    ) : null}
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    {found ? (
                      <span className="text-pass-ink">{t.tagUse(found.count, found.on)}</span>
                    ) : (
                      <span className="text-watch-ink">{t.notFound}</span>
                    )}
                    {alternatives.length > 0 ? <span>{t.found}</span> : null}
                    {alternatives.map((x) => (
                      <button
                        key={x.name}
                        type="button"
                        onClick={() => setTag({ name: x.name })}
                        className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-ink hover:border-ink"
                      >
                        {x.name}
                      </button>
                    ))}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* ---------- Policies ---------- */}
      <Card>
        <h2 className="text-lg font-bold">{t.policiesTitle}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t.policiesBody}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {policyOrder.map((key) => (
            <Field key={key} label={t.policies[key]} htmlFor={`policy-${key}`}>
              <Input
                id={`policy-${key}`}
                type={key === "loadDeadline" ? "time" : "number"}
                min={key === "loadDeadline" ? undefined : 1}
                value={map.policies[key]}
                onChange={(e) =>
                  change({
                    ...map,
                    policies: { ...map.policies, [key]: key === "loadDeadline" ? e.target.value : Math.max(1, Number(e.target.value) || 1) },
                  })
                }
                className="font-mono"
              />
            </Field>
          ))}
        </div>
      </Card>

      {/* ---------- Recommendations ---------- */}
      <section aria-labelledby="recs-title">
        <h2 id="recs-title" className="text-lg font-bold">
          {t.recsTitle}
        </h2>
        <p className="mt-1 mb-4 text-sm text-ink-muted">{t.recsBody}</p>
        {recommendations.length === 0 ? (
          <EmptyState mood="party" title={t.recsEmptyTitle} body={t.recsEmptyBody} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2" data-testid="map-recs">
            {recommendations.map((rec) => (
              <li key={rec.id} className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4" data-rec={rec.id}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sun text-on-accent">
                  <Lightbulb className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{rec.title}</p>
                  <p className="mt-0.5 text-sm break-words text-ink-muted">{rec.body}</p>
                  {rec.action ? (
                    <Button variant="secondary" size="sm" className="mt-3" icon={<Plus aria-hidden />} onClick={() => applyRec(rec)}>
                      {rec.action.label}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Save bar ---------- */}
      <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-5 py-3 pl-20 lg:pl-64">
          <p className="text-sm text-ink-muted" aria-live="polite" data-testid="map-status">
            {dirty ? t.unsaved : savedAt ? t.savedAt(formatDateTime(savedAt)) : t.guessTitle}
          </p>
          <Button variant="secondary" icon={<Save aria-hidden />} onClick={save} loading={saving} disabled={!dirty && savedAt !== null} data-testid="save-map">
            {t.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
