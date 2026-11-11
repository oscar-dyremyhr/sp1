"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radar, RotateCcw, Trash2, UserPlus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Field,
  Input,
  Modal,
  PageLoading,
  Select,
  Term,
  toast,
} from "@/design-system/components";
import { copy } from "@/content/copy";
import { SERVICE_PRINCIPAL } from "@/content/setup";
import { formatDateTime } from "@/lib/format";
import { useQuery } from "@/lib/use-query";
import { inviteTeammate, listTeam, listWorkspaces, removeTeammate, rescan, resetDemo } from "@/mocks/service";
import type { Role } from "@/mocks/types";
import { useSession } from "@/store/session";
import { ErrorState } from "./ErrorState";

const t = copy.settings;
const roles: Role[] = ["member", "viewer"];

export function Settings() {
  const router = useRouter();
  const me = useSession((s) => s.user);
  const team = useQuery("team", listTeam);
  const spaces = useQuery("workspaces", listWorkspaces);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (team.error || spaces.error) return <ErrorState onRetry={() => (team.reload(), spaces.reload())} />;
  if (!team.data || !spaces.data) return <PageLoading label={t.loading} />;

  const invite = async (e: FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    try {
      const member = await inviteTeammate(email, role);
      toast({ title: t.team.sent(member.email), description: t.team.sentBody });
      setEmail("");
      team.reload();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : copy.common.errorBody);
    } finally {
      setInviting(false);
    }
  };

  const scanAgain = async () => {
    setScanning(true);
    const result = await rescan();
    setScanning(false);
    spaces.reload();
    toast(
      result.fixed
        ? { title: t.workspaces.rescanFixed(result.fixed.plainTitle), description: t.workspaces.scoreNow(result.score) }
        : { title: t.workspaces.rescanSame, tone: "info" },
    );
  };

  const reset = async () => {
    setResetting(true);
    await resetDemo();
    toast({ title: t.reset.done, description: t.reset.doneBody });
    router.push("/app/welcome");
  };

  return (
    <div className="space-y-6" data-testid="settings">
      <p className="text-ink-muted">{t.subtitle}</p>

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold">{t.team.title}</h2>
          <p className="font-mono text-xs text-ink-muted" data-testid="seat-count">
            {t.team.seats(team.data.members.length, team.data.seats)}
          </p>
        </div>
        <DataTable
          className="mt-4 shadow-none"
          caption={t.team.title}
          rows={team.data.members}
          rowKey={(m) => m.id}
          columns={[
            {
              key: "name",
              header: t.team.cols.name,
              render: (m) => (
                <span className="font-semibold">
                  {m.name} {m.id === me?.id ? <Badge className="ml-1">{t.team.you}</Badge> : null}
                </span>
              ),
            },
            { key: "email", header: t.team.cols.email, render: (m) => <span className="font-mono text-xs">{m.email}</span> },
            { key: "role", header: t.team.cols.role, render: (m) => copy.roles[m.role] },
            {
              key: "actions",
              header: <span className="sr-only">{t.team.cols.actions}</span>,
              align: "right",
              render: (m) =>
                m.role === "owner" ? null : (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 aria-hidden />}
                    aria-label={t.team.removeAria(m.name)}
                    onClick={async () => {
                      await removeTeammate(m.id);
                      team.reload();
                    }}
                  >
                    {t.team.remove}
                  </Button>
                ),
            },
          ]}
        />
        <form onSubmit={invite} className="mt-5 flex flex-wrap items-start gap-3">
          <Field label={t.team.emailLabel} htmlFor="invite-email" error={inviteError || undefined} className="min-w-56 flex-1">
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.auth.emailPlaceholder}
              aria-invalid={inviteError ? true : undefined}
              required
            />
          </Field>
          <Field label={t.team.roleLabel} htmlFor="invite-role" className="w-36">
            <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {copy.roles[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" variant="secondary" loading={inviting} icon={<UserPlus aria-hidden />} className="mt-[1.6rem]" data-testid="invite">
            {t.team.invite}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">{t.workspaces.title}</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {t.workspaces.body} <Term k="workspace" /> · <Term k="catalog" />
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <Badge tone="brand">{t.workspaces.signedInAs(SERVICE_PRINCIPAL)}</Badge>
          <Link href="/setup" target="_blank" className="font-semibold text-brand underline-offset-4 hover:underline">
            {t.workspaces.guide}
          </Link>
        </p>
        <ul className="mt-4 space-y-3">
          {spaces.data.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-line p-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono font-semibold">{w.name}</p>
                <p className="font-mono text-xs break-all text-ink-muted">{w.url}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {w.cloud} · {w.region} · {t.workspaces.catalogs(w.catalogs.length)} · {t.workspaces.lastScan(formatDateTime(w.lastScanAt))}
                </p>
              </div>
              <Badge tone="mint">{t.workspaces.connected}</Badge>
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-4" icon={<Radar aria-hidden />} loading={scanning} onClick={scanAgain} data-testid="rescan">
          {scanning ? t.workspaces.rescanning : t.workspaces.rescan}
        </Button>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 border-dashed border-line-strong">
        <div className="max-w-xl">
          <h2 className="text-lg font-bold">{t.reset.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.reset.body}</p>
        </div>
        <Button variant="secondary" icon={<RotateCcw aria-hidden />} onClick={() => setConfirmReset(true)} data-testid="reset-demo">
          {t.reset.cta}
        </Button>
      </Card>

      <Modal open={confirmReset} onOpenChange={setConfirmReset} title={t.reset.confirmTitle} description={t.reset.confirmBody}>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmReset(false)} disabled={resetting}>
            {copy.common.cancel}
          </Button>
          <Button onClick={reset} loading={resetting} data-testid="reset-confirm">
            {t.reset.confirm}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
