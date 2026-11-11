import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { sampleReport } from "@/mocks/service";
import { ReportView } from "@/screens/report/ReportView";

export const metadata: Metadata = { title: copy.marketing.nav.sample, description: copy.marketing.preview.body };

export default function SampleReportPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8 print:max-w-none print:p-0">
      <ReportView report={sampleReport()} mode="sample" />
    </div>
  );
}
