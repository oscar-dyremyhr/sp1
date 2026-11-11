import { Suspense } from "react";
import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { PageLoading } from "@/design-system/components";
import { Reports } from "@/screens/app/Reports";

export const metadata: Metadata = { title: copy.reports.title };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading label={copy.common.loading} />}>
      <Reports />
    </Suspense>
  );
}

// Browser-only screen (reads local storage): opt out of instant-navigation validation.
export const instant = false;
