import { Suspense } from "react";
import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { PageLoading } from "@/design-system/components";
import { ReportViewer } from "@/screens/app/ReportViewer";

export const metadata: Metadata = { title: copy.report.docTitle };

export default function Page() {
  return (
    <Suspense fallback={<PageLoading label={copy.common.loading} />}>
      <ReportViewer />
    </Suspense>
  );
}

// Browser-only screen (reads local storage): opt out of instant-navigation validation.
export const instant = false;
