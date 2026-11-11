import { Suspense } from "react";
import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { Logo, PageLoading, ThemeToggle } from "@/design-system/components";
import { SharedReport } from "@/screens/app/ReportViewer";

export const metadata: Metadata = { title: copy.report.docTitle, robots: { index: false } };

// Shared reports live in the browser's local storage in this demo.
export const instant = false;

export default function SharedReportPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-6 print:max-w-none print:p-0">
      <header className="no-print mb-6 flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main>
        <Suspense fallback={<PageLoading label={copy.viewer.loading} />}>
          <SharedReport />
        </Suspense>
      </main>
    </div>
  );
}
