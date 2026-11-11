"use client";

import { useParams } from "next/navigation";
import { ButtonLink, EmptyState, PageLoading } from "@/design-system/components";
import { copy } from "@/content/copy";
import { useHydrated } from "@/lib/use-hydrated";
import { useQuery } from "@/lib/use-query";
import { getReport, getReportByShareToken } from "@/mocks/service";
import { ReportView } from "@/screens/report/ReportView";

const t = copy.viewer;

function NotFound({ shared }: { shared?: boolean }) {
  return (
    <EmptyState
      mood="sleepy"
      title={t.notFound.title}
      body={t.notFound.body}
      action={
        <ButtonLink href={shared ? "/sample-report" : "/app/reports"} variant="secondary">
          {shared ? t.notFound.ctaPublic : t.notFound.cta}
        </ButtonLink>
      }
    />
  );
}

/** /app/reports/:id */
export function ReportViewer() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useQuery(`report:${id}`, () => getReport(id));
  if (error) return <NotFound />;
  if (!data) return <PageLoading label={t.loading} />;
  return <ReportView key={data.id} report={data} mode="app" />;
}

/** /share/:token — read-only, no sign-in. */
export function SharedReport() {
  const hydrated = useHydrated();
  const { token } = useParams<{ token: string }>();
  const { data, error } = useQuery(`share:${hydrated}:${token}`, () =>
    hydrated ? getReportByShareToken(token) : new Promise<never>(() => {}),
  );
  if (error) return <NotFound shared />;
  if (!data) return <PageLoading label={t.loading} />;
  return <ReportView key={data.id} report={data} mode="shared" />;
}
