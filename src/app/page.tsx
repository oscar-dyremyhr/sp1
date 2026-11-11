import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stack = [
  {
    title: "Next.js",
    description: "App Router, React Server Components and TypeScript.",
    href: "https://nextjs.org/docs",
  },
  {
    title: "Tailwind CSS",
    description: "Utility-first styling, configured in globals.css.",
    href: "https://tailwindcss.com/docs",
  },
  {
    title: "shadcn/ui",
    description: "Accessible components you own, in src/components/ui.",
    href: "https://ui.shadcn.com/docs",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-12 px-6 py-24">
      <section className="flex flex-col gap-4">
        <p className="text-sm font-medium text-muted-foreground">
          Side project 1
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          sp1
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          A fresh starting point. Edit{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
            src/app/page.tsx
          </code>{" "}
          to begin.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            className={cn(buttonVariants({ size: "lg" }))}
            href="https://github.com/oscar-dyremyhr/sp1"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
          <a
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            href="https://ui.shadcn.com/docs/components"
            target="_blank"
            rel="noopener noreferrer"
          >
            Browse components
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stack.map((item) => (
          <a
            key={item.title}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl transition-opacity hover:opacity-80"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          </a>
        ))}
      </section>
    </main>
  );
}
