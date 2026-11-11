import { FileClock, GitBranch, KeyRound, ShieldCheck, Tag, Timer } from "lucide-react";
import { copy } from "@/content/copy";
import { formatDate } from "@/lib/format";
import type { Evidence, EvidenceType } from "@/mocks/types";
import { cn } from "@/lib/utils";

export const evidenceIcons: Record<EvidenceType, typeof GitBranch> = {
  lineage: GitBranch,
  dq_check: ShieldCheck,
  access_grant: KeyRound,
  change_record: FileClock,
  retention_policy: Timer,
  ownership_tag: Tag,
};

/** A piece of proof, on receipt paper with a zigzag bottom edge. */
export function EvidenceCard({
  evidence,
  compact,
  className,
}: {
  evidence: Pick<Evidence, "type" | "source" | "summary" | "capturedAt"> & { details?: string };
  compact?: boolean;
  className?: string;
}) {
  const Icon = evidenceIcons[evidence.type];
  return (
    <div className={cn("paper-shadow print-plain", className)}>
      <div className="zigzag-bottom bg-surface px-4 pt-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
          <Icon className="size-3.5 text-brand" aria-hidden />
          {copy.evidenceTypes[evidence.type]}
        </div>
        <p className={cn("mt-1.5 text-ink", compact ? "text-xs" : "text-sm")}>{evidence.summary}</p>
        {!compact && evidence.details ? <p className="mt-1 text-xs text-ink-muted">{evidence.details}</p> : null}
        <div className="dashed-rule mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 pt-2 font-mono text-[11px] text-ink-muted">
          <span className="break-all">{evidence.source}</span>
          <span className="tabular">{formatDate(evidence.capturedAt)}</span>
        </div>
      </div>
    </div>
  );
}
