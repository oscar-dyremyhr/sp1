"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { copy } from "@/content/copy";

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getTheme = () => (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");

export function setTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem("receipts-theme", theme);
  } catch {
    /* storage unavailable: the theme still applies for this visit */
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light" as const);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={copy.theme.switchTo(next)}
      title={copy.theme.switchTo(next)}
      data-testid="theme-toggle"
      className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-transform duration-200 ease-spring hover:-translate-y-0.5 hover:rotate-12"
    >
      {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
    </button>
  );
}
