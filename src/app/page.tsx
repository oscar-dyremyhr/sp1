import { ButtonLink, Logo } from "@/design-system/components";
import { copy } from "@/content/copy";

// Placeholder until the landing page lands (build-order step 8).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <Logo />
      <h1 className="text-5xl font-extrabold">{copy.brand.tagline}</h1>
      <div>
        <ButtonLink href="/styleguide" variant="secondary">
          Design system
        </ButtonLink>
      </div>
    </main>
  );
}
