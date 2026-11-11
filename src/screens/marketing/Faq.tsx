import { Mail } from "lucide-react";
import { Accordion, Stubby, buttonClass } from "@/design-system/components";
import { copy } from "@/content/copy";

const t = copy.faqPage;

export function Faq() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14">
      <h1 className="text-4xl font-extrabold md:text-5xl">{t.title}</h1>
      <p className="mt-4 mb-8 text-lg text-ink-muted">{t.subtitle}</p>
      <Accordion items={t.items} />
      <div className="mt-10 flex flex-wrap items-center gap-5 rounded-card border border-dashed border-line-strong bg-surface p-6">
        <Stubby mood="curious" size={64} />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{t.contactTitle}</h2>
          <p className="text-ink-muted">
            {t.contactBody} <span className="font-mono text-sm">{copy.brand.contactEmail}</span>
          </p>
        </div>
        <a href={`mailto:${copy.brand.contactEmail}`} className={buttonClass({ variant: "secondary" })}>
          <Mail aria-hidden />
          {t.contactCta}
        </a>
      </div>
    </div>
  );
}
