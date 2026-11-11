import { cn } from "@/lib/utils";

export type StubbyMood = "happy" | "curious" | "party" | "sleepy";

/**
 * Stubby: a receipt stub with two dot eyes. Appears in empty states,
 * onboarding and success moments. Never in the report itself.
 */
export function Stubby({
  mood = "happy",
  size = 96,
  className,
  title,
}: {
  mood?: StubbyMood;
  size?: number;
  className?: string;
  title?: string;
}) {
  const eyeY = mood === "curious" ? 44 : 46;
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={(size * 120) / 100}
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* paper body with a torn zigzag bottom */}
      <path
        d="M18 10 h64 a6 6 0 0 1 6 6 v88 l-8 -7 l-8 7 l-8 -7 l-8 7 l-8 -7 l-8 7 l-8 -7 l-8 7 l-8 -7 v-81 a6 6 0 0 1 6 -6 z"
        fill="var(--surface)"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* perforation and print lines */}
      <path d="M22 26 h56" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" />
      <path d="M28 72 h30 M28 82 h44" stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" />
      <rect x="62" y="68" width="12" height="8" rx="2" fill="var(--mint)" />
      {/* eyes */}
      {mood === "sleepy" ? (
        <path d="M32 46 q5 4 10 0 M58 46 q5 4 10 0" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="37" cy={eyeY} r="4.5" fill="var(--ink)" />
          <circle cx="63" cy={eyeY} r="4.5" fill="var(--ink)" />
          <circle cx="38.5" cy={eyeY - 1.5} r="1.3" fill="var(--surface)" />
          <circle cx="64.5" cy={eyeY - 1.5} r="1.3" fill="var(--surface)" />
        </>
      )}
      {/* cheeks and mouth */}
      <circle cx="29" cy="55" r="3.5" fill="var(--sun)" />
      <circle cx="71" cy="55" r="3.5" fill="var(--sun)" />
      {mood === "party" ? (
        <path d="M43 54 q7 10 14 0 z" fill="var(--ink)" />
      ) : mood === "curious" ? (
        <circle cx="50" cy="57" r="3" fill="var(--ink)" />
      ) : (
        <path d="M43 55 q7 6 14 0" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" />
      )}
      {mood === "party" ? (
        <path d="M50 10 l-9 -9 M50 10 l0 -10 M50 10 l9 -9" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" />
      ) : null}
    </svg>
  );
}
