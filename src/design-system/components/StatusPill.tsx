import { CircleCheck, Eye, Wrench } from "lucide-react";
import { copy } from "@/content/copy";
import type { ControlStatus } from "@/mocks/types";
import { cn } from "@/lib/utils";

const styles: Record<ControlStatus, string> = {
  pass: "bg-pass-soft text-pass-ink border-pass-ink/40",
  watch: "bg-watch-soft text-watch-ink border-watch-ink/40",
  fix: "bg-fix-soft text-fix-ink border-fix-ink/40",
};

export const statusIcons = { pass: CircleCheck, watch: Eye, fix: Wrench } as const;

/** Status is never colour alone: every pill carries an icon and a word. */
export function StatusPill({
  status,
  size = "md",
  className,
}: {
  status: ControlStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const Icon = statusIcons[status];
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        styles[status],
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} aria-hidden />
      {copy.status[status]}
    </span>
  );
}
