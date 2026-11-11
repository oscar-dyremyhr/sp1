import Link from "next/link";
import { copy } from "@/content/copy";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden>
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path
        d="M10 7 h12 v18 l-3 -2.5 l-3 2.5 l-3 -2.5 l-3 2.5 z"
        fill="var(--brand-ink)"
      />
      <path d="M13 12 h6 M13 16 h4" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 rounded-lg", className)} aria-label={copy.brand.name}>
      <LogoMark />
      <span className="font-heading text-xl font-extrabold tracking-tight">{copy.brand.name}</span>
    </Link>
  );
}
