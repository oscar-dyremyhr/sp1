"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/design-system/components";
import { copy } from "@/content/copy";
import { useHydrated } from "@/lib/use-hydrated";
import { useSession } from "@/store/session";

export function FullPageLoading() {
  return (
    <div role="status" aria-label={copy.common.loading} className="flex flex-1 items-center justify-center py-32">
      <span className="animate-pulse">
        <LogoMark size={44} />
      </span>
    </div>
  );
}

/** Everything under /app needs the browser (local storage) and a signed-in user. */
export function AppGate({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const user = useSession((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return <FullPageLoading />;
  return <>{children}</>;
}
