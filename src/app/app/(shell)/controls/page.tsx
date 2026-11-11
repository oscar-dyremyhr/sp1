import { Suspense } from "react";
import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { PageLoading } from "@/design-system/components";
import { Controls } from "@/screens/app/Controls";

export const metadata: Metadata = { title: copy.controls.title };

export default function ControlsPage() {
  return (
    <Suspense fallback={<PageLoading label={copy.controls.loading} />}>
      <Controls />
    </Suspense>
  );
}

// Browser-only screen (reads local storage): opt out of instant-navigation validation.
export const instant = false;
