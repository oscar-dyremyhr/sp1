import { Ticket } from "lucide-react";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

/** Credits are always visible: "1 report left". */
export function CreditCounter({ credits, className }: { credits: number; className?: string }) {
  return (
    <span
      data-testid="credit-counter"
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium",
        credits === 0 ? "border-watch-ink/40 bg-watch-soft text-watch-ink" : "border-line bg-surface text-ink",
        className,
      )}
    >
      <Ticket className="size-4" aria-hidden />
      <span>
        <span className="tabular font-mono font-bold">{credits}</span> {copy.credits.left(credits)}
      </span>
    </span>
  );
}
