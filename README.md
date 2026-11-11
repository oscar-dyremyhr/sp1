# sp1

> **Side project 1** — working title. The repo will be renamed once the project has a proper name.

A website built with **Next.js**, **TypeScript**, **Tailwind CSS** and **shadcn/ui**, hosted on **Vercel**.

## Tech stack

| Tool | Purpose |
| --- | --- |
| [Next.js](https://nextjs.org/docs) (App Router) | React framework: routing, server components, builds |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com/docs) | Utility-first styling (configured in `src/app/globals.css`) |
| [shadcn/ui](https://ui.shadcn.com/docs) | Accessible components copied into `src/components/ui` |
| [ESLint](https://eslint.org/) | Linting (`eslint-config-next`) |
| [Vercel](https://vercel.com/docs) | Hosting & preview deployments |

## Project structure

```
sp1/
├── public/                 # Static files served from /
├── src/
│   ├── app/                # App Router: routes, layouts, globals.css
│   │   ├── layout.tsx      # Root layout (fonts, metadata)
│   │   └── page.tsx        # Home page (/)
│   ├── components/
│   │   └── ui/             # shadcn/ui components (yours to edit)
│   └── lib/
│       └── utils.ts        # cn() class-name helper
├── components.json         # shadcn/ui config
├── next.config.ts
└── .github/workflows/      # CI: lint, type-check, build
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.9+ (22 recommended — see `.nvmrc`)
- npm 10+

### Install & run

```bash
npm install
npm run dev         # http://localhost:3000
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint with ESLint |
| `npm run type-check` | Type-check with `tsc` |

## Adding shadcn/ui components

```bash
npx shadcn@latest add dialog input dropdown-menu
```

Components land in `src/components/ui/` and can be edited freely. Browse them at [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components).

> Tip: to style a link like a button, use `cn(buttonVariants({ variant: "outline" }))` so conflicting Tailwind classes are merged correctly.

## Deploying to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import `oscar-dyremyhr/sp1`.
2. Keep the detected defaults (framework: Next.js) and click **Deploy**.

Every push to `main` deploys to production, and every pull request gets a preview URL. Renaming the GitHub repo later is fine — Vercel follows the rename.

## Roadmap

- [ ] Decide on a project name and rename the repo
- [ ] Connect the repo to Vercel
- [ ] Add a dark-mode toggle (e.g. `next-themes`)
- [ ] Replace the starter page with real content

## License

[MIT](LICENSE)
