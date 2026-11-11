import type { ReactNode } from "react";
import { Stubby, type StubbyMood } from "./Stubby";
import { cn } from "@/lib/utils";

/** No dead ends: say what will appear here and offer the next step. */
export function EmptyState({
  title,
  body,
  action,
  mood = "curious",
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  mood?: StubbyMood;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <Stubby mood={mood} size={84} />
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
