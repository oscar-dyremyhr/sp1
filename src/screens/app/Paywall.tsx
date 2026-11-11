"use client";

// Filled in at build-order step 7 (credits, paywall, checkout).
export function openPaywall(opts: { onDone?: () => void }) {
  opts.onDone?.();
}

export function PaywallHost() {
  return null;
}
